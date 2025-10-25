import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { translations } from "@/translations";

type Language = "id" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, placeholders?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Helper function to get nested values from an object using a dot-separated string
const getNestedValue = (obj: any, key: string): string | undefined => {
  return key.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("id");

  const t = useCallback(
    (key: string, placeholders?: Record<string, string | number>): string => {
      const langTranslations = translations[language];
      let translation = getNestedValue(langTranslations, key);

      if (!translation) {
        console.warn(`Translation not found for key: ${key}`);
        // Fallback to English if translation is not found in the current language
        const fallbackLang = translations["en"];
        translation = getNestedValue(fallbackLang, key);
        if (!translation) {
          return key; // Return the key itself if not found in fallback
        }
      }

      if (placeholders) {
        Object.entries(placeholders).forEach(([placeholder, value]) => {
          translation = translation!.replace(`{${placeholder}}`, String(value));
        });
      }

      return translation!;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
