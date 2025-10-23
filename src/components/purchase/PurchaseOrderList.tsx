import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, CheckCircle, XCircle, Package } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_name: string;
  total_amount: number;
  status: string;
  requested_at: string;
  requested_by: string;
  profiles?: {
    full_name: string;
  };
}

export default function PurchaseOrderList({ onAdd, userRole }: { onAdd: () => void; userRole: string }) {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Load user profiles separately
      const ordersWithProfiles = await Promise.all(
        (data || []).map(async (order) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", order.requested_by)
            .single();
          
          return { ...order, profiles: profile };
        })
      );

      setOrders(ordersWithProfiles);
    } catch (error) {
      toast.error(t("Gagal memuat order", "Failed to load orders"));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("purchase_orders")
        .update({ 
          status: "approved",
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;
      toast.success(t("Order disetujui", "Order approved"));
      loadOrders();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("purchase_orders")
        .update({ status: "completed" })
        .eq("id", id);

      if (error) throw error;
      toast.success(t("Order selesai, stok telah diperbarui", "Order completed, stock updated"));
      loadOrders();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "outline", label: t("Menunggu", "Pending") },
      approved: { variant: "default", label: t("Disetujui", "Approved") },
      rejected: { variant: "destructive", label: t("Ditolak", "Rejected") },
      completed: { variant: "secondary", label: t("Selesai", "Completed") },
    };
    
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return <div>{t("Memuat...", "Loading...")}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">{t("Purchase Order", "Purchase Orders")}</h3>
        {userRole === "owner" || userRole === "manager" ? (
          <Button onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            {t("Buat PO", "Create PO")}
          </Button>
        ) : null}
      </div>

      <div className="space-y-3">
        {orders.map((order) => (
          <Card key={order.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{order.po_number}</h4>
                  {getStatusBadge(order.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("Supplier:", "Supplier:")} {order.supplier_name}
                </p>
                <p className="text-sm">
                  {t("Dibuat oleh:", "Requested by:")} {order.profiles?.full_name || "-"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(order.requested_at), "dd MMM yyyy HH:mm")}
                </p>
                <p className="font-semibold">Rp {order.total_amount.toLocaleString()}</p>
              </div>

              {userRole === "owner" && order.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleApprove(order.id)}>
                    <CheckCircle className="mr-1 h-4 w-4" />
                    {t("Setujui", "Approve")}
                  </Button>
                </div>
              )}

              {(userRole === "owner" || userRole === "manager") && order.status === "approved" && (
                <Button size="sm" onClick={() => handleComplete(order.id)}>
                  <Package className="mr-1 h-4 w-4" />
                  {t("Selesai", "Complete")}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
