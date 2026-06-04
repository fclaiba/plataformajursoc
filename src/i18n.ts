import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translations
const resources = {
  es: {
    translation: {
      "navbar": {
        "dashboard": "Dashboard",
        "mis_materias": "Mis Materias",
        "mis_solicitudes": "Mis Solicitudes",
        "mapa_correlativas": "Mapa de Correlativas",
        "ranking_docente": "Ranking Docente",
        "ingresar": "Ingresar",
        "registrarse": "Registrarse"
      }
    }
  },
  en: {
    translation: {
      "navbar": {
        "dashboard": "Dashboard",
        "mis_materias": "My Subjects",
        "mis_solicitudes": "My Requests",
        "mapa_correlativas": "Correlatives Map",
        "ranking_docente": "Professor Ranking",
        "ingresar": "Login",
        "registrarse": "Register"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "es", // default language
    fallbackLng: "es",
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
