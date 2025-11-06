import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserPlus, Trash2, Shield } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Profile {
  id: string;
  full_name: string;
  email: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  profiles: Profile;
}

const AVAILABLE_ROLES = [
  { value: "owner", label: "Owner" },
  { value: "manager", label: "Manager" },
  { value: "cashier", label: "Kasir" },
  { value: "waiter", label: "Pelayan" },
  { value: "accountant", label: "Akuntan" },
  { value: "hrd", label: "HRD" },
];

export default function UserRoleManagement() {
  const { t } = useLanguage();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserRoles();
    loadProfiles();
  }, []);

  const loadUserRoles = async () => {
    const { data, error } = await supabase
      .from("user_roles")
      .select(`
        id,
        user_id,
        role,
        profiles (
          id,
          full_name,
          email
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Gagal memuat daftar role");
      return;
    }

    setUserRoles(data as UserRole[]);
  };

  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .order("full_name");

    if (error) {
      toast.error("Gagal memuat daftar user");
      return;
    }

    setProfiles(data);
  };

  const handleAddRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast.error("Pilih user dan role terlebih dahulu");
      return;
    }

    setLoading(true);
    try {
      // Check if user already has this role
      const existing = userRoles.find(
        (ur) => ur.user_id === selectedUser && ur.role === selectedRole
      );

      if (existing) {
        toast.error("User sudah memiliki role ini");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("user_roles").insert([{
        user_id: selectedUser,
        role: selectedRole as any,
      }]);

      if (error) throw error;

      toast.success("Role berhasil ditambahkan");
      setSelectedUser("");
      setSelectedRole("");
      loadUserRoles();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    if (!confirm("Yakin ingin menghapus role ini?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;

      toast.success("Role berhasil dihapus");
      loadUserRoles();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      owner: "bg-primary text-primary-foreground",
      manager: "bg-accent text-accent-foreground",
      cashier: "bg-success text-success-foreground",
      waiter: "bg-[hsl(var(--platinum))] text-[hsl(var(--platinum-foreground))]",
      accountant: "bg-warning text-warning-foreground",
      hrd: "bg-[hsl(var(--gold))] text-[hsl(var(--gold-foreground))]",
    };
    return colors[role] || "bg-secondary text-secondary-foreground";
  };

  // Group roles by user
  const groupedRoles = userRoles.reduce((acc, ur) => {
    const userId = ur.user_id;
    if (!acc[userId]) {
      acc[userId] = {
        profile: ur.profiles,
        roles: [],
      };
    }
    acc[userId].roles.push({ id: ur.id, role: ur.role });
    return acc;
  }, {} as Record<string, { profile: Profile; roles: { id: string; role: string }[] }>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Manajemen Role User
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Role Form */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Pilih User" />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  {profile.full_name} ({profile.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Pilih Role" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_ROLES.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleAddRole}
            disabled={loading || !selectedUser || !selectedRole}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Tambah
          </Button>
        </div>

        {/* User Roles List */}
        <div className="space-y-4">
          <h3 className="font-semibold">Daftar User & Role</h3>
          {Object.entries(groupedRoles).length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Belum ada user dengan role
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(groupedRoles).map(([userId, data]) => (
                <Card key={userId} className="bg-muted/30">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{data.profile.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.profile.email}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {data.roles.map((roleData) => (
                            <div key={roleData.id} className="flex items-center gap-1">
                              <Badge className={getRoleColor(roleData.role)}>
                                {
                                  AVAILABLE_ROLES.find(
                                    (r) => r.value === roleData.role
                                  )?.label || roleData.role
                                }
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleRemoveRole(roleData.id)}
                                disabled={loading}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
