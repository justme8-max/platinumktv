import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Edit, Trash2, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Employee {
  id: string;
  employee_id: string;
  name: string;
  division: string;
  phone: string;
  created_at: string;
}

interface EmployeeListProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: () => void;
  canDelete: boolean;
}

export default function EmployeeList({ employees, onEdit, onDelete, canDelete }: EmployeeListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);

    try {
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;
      toast.success("Karyawan berhasil dihapus");
      onDelete();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const getDivisionColor = (division: string) => {
    const colors: Record<string, string> = {
      MANAGER: "bg-purple-500",
      ACCOUNTING: "bg-blue-500",
      KAPTEN: "bg-green-500",
      KASIR: "bg-yellow-500",
      WAITERS: "bg-orange-500",
      OB: "bg-gray-500",
      DJ: "bg-pink-500",
      SECURTY: "bg-red-500",
      SOUNDMEN: "bg-indigo-500",
      BAR: "bg-teal-500"
    };
    return colors[division] || "bg-gray-500";
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Karyawan</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Divisi</TableHead>
              <TableHead>No. Telepon</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Belum ada data karyawan
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-mono text-sm">{employee.employee_id}</TableCell>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>
                    <Badge className={getDivisionColor(employee.division)}>
                      {employee.division}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {employee.phone ? (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {employee.phone}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(employee)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {canDelete && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteId(employee.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Karyawan?</AlertDialogTitle>
            <AlertDialogDescription>
              Aksi ini tidak dapat dibatalkan. Data karyawan akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
