import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === "id" ? "en" : "id")}
      className="gap-2"
    >
      <Languages className="h-4 w-4" />
      {language === "id" ? "EN" : "ID"}
    </Button>
  );
}
