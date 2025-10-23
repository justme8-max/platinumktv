import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface ExportButtonProps {
  data: any[];
  filename: string;
  headers: string[];
}

export default function ExportButton({ data, filename, headers }: ExportButtonProps) {
  const { t } = useLanguage();

  const exportToCSV = () => {
    if (!data || data.length === 0) {
      toast.error(t("Tidak ada data untuk diekspor", "No data to export"));
      return;
    }

    const csvHeaders = headers.join(",");
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        return typeof value === "string" && value.includes(",") 
          ? `"${value}"` 
          : value;
      }).join(",");
    });

    const csvContent = [csvHeaders, ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(t("Data berhasil diekspor", "Data exported successfully"));
  };

  return (
    <Button onClick={exportToCSV} variant="outline" size="sm">
      <FileSpreadsheet className="mr-2 h-4 w-4" />
      {t("Ekspor ke Excel", "Export to Excel")}
    </Button>
  );
}
