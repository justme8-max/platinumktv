import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  employee?: {
    id: string;
    name: string;
    division: string;
    phone: string;
  };
}

const DIVISIONS = [
  "MANAGER",
  "ACCOUNTING",
  "KAPTEN",
  "KASIR",
  "WAITERS",
  "OB",
  "DJ",
  "SECURTY",
  "SOUNDMEN",
  "BAR"
];

export default function EmployeeDialog({ open, onOpenChange, onSuccess, employee }: EmployeeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: employee?.name || "",
    division: employee?.division || "",
    phone: employee?.phone || ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (employee) {
        // Update existing employee
        const { error } = await supabase
          .from("employees")
          .update({
            name: formData.name,
            division: formData.division,
            phone: formData.phone
          })
          .eq("id", employee.id);

        if (error) throw error;
        toast.success("Karyawan berhasil diupdate");
      } else {
        // Generate employee ID using database function
        const { data: generatedId, error: idError } = await supabase
          .rpc("generate_employee_id", {
            emp_name: formData.name,
            emp_division: formData.division
          });

        if (idError) throw idError;

        // Create new employee
        const { error } = await supabase
          .from("employees")
          .insert({
            employee_id: generatedId,
            name: formData.name,
            division: formData.division,
            phone: formData.phone
          });

        if (error) throw error;
        toast.success(`Karyawan berhasil ditambahkan dengan ID: ${generatedId}`);
      }

      onSuccess();
      onOpenChange(false);
      setFormData({ name: "", division: "", phone: "" });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{employee ? "Edit Karyawan" : "Tambah Karyawan Baru"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: NENI KURNIAWATI"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="division">Divisi</Label>
            <Select
              value={formData.division}
              onValueChange={(value) => setFormData({ ...formData, division: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih divisi" />
              </SelectTrigger>
              <SelectContent>
                {DIVISIONS.map((div) => (
                  <SelectItem key={div} value={div}>
                    {div}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">No. Telepon</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="081234567890"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : employee ? "Update" : "Tambah"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
