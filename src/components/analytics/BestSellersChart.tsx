import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function BestSellersChart() {
  const { t } = useLanguage();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBestSellers();
  }, []);

  const loadBestSellers = async () => {
    try {
      const { data: salesData, error } = await supabase
        .from("sales_items")
        .select(`
          quantity,
          product_id,
          products (name_id, name_en)
        `)
        .not("product_id", "is", null);

      if (error) throw error;

      const aggregated = salesData?.reduce((acc: any, item: any) => {
        const productId = item.product_id;
        if (!acc[productId]) {
          acc[productId] = {
            name: item.products?.name_id || "Unknown",
            totalQty: 0,
          };
        }
        acc[productId].totalQty += item.quantity;
        return acc;
      }, {});

      const chartData = Object.values(aggregated || {})
        .sort((a: any, b: any) => b.totalQty - a.totalQty)
        .slice(0, 10);

      setData(chartData);
    } catch (error) {
      console.error("Error loading best sellers:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>{t("Memuat...", "Loading...")}</div>;
  }

  const bestSellers = data.slice(0, 5);
  const worstSellers = data.slice(-5).reverse();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-green-500" />
          <h3 className="text-xl font-semibold">{t("Produk Terlaris", "Best Sellers")}</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={bestSellers}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="totalQty" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="h-5 w-5 text-orange-500" />
          <h3 className="text-xl font-semibold">{t("Produk Kurang Laris", "Slow Movers")}</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={worstSellers}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="totalQty" fill="hsl(var(--orange))" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
