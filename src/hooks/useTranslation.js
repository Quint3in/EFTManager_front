import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';

export function useTranslation() {
  const { language } = useLanguage();
  const dict = translations[language] || translations.en;

  function t(key) {
    return dict[key] || key;
  }

  return { t };
}