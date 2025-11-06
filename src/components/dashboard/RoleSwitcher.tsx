import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";

interface RoleSwitcherProps {
  roles: string[];
  currentRole: string;
  onRoleChange: (role: string) => void;
}

const roleTranslations: { [key: string]: { en: string; id: string } } = {
  owner: { en: "Owner", id: "Pemilik" },
  manager: { en: "Manager", id: "Manajer" },
  cashier: { en: "Cashier", id: "Kasir" },
  waiter: { en: "Waiter", id: "Pelayan" },
  waitress: { en: "Waitress", id: "Pelayan" },
  accountant: { en: "Accountant", id: "Akuntan" },
};

export default function RoleSwitcher({ roles, currentRole, onRoleChange }: RoleSwitcherProps) {
  const { language } = useLanguage();

  if (roles.length <= 1) return null;

  return (
    <Select value={currentRole} onValueChange={onRoleChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue>
          {roleTranslations[currentRole]?.[language] || currentRole}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => (
          <SelectItem key={role} value={role}>
            {roleTranslations[role]?.[language] || role}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
