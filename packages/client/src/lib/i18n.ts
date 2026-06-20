import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "../locales/en/common.json";
import enConfig from "../locales/en/config.json";
import enErrors from "../locales/en/errors.json";
import enGame from "../locales/en/game.json";
import enResults from "../locales/en/results.json";
import esCommon from "../locales/es/common.json";
import esConfig from "../locales/es/config.json";
import esErrors from "../locales/es/errors.json";
import esGame from "../locales/es/game.json";
import esResults from "../locales/es/results.json";

void i18n.use(initReactI18next).init({
  lng: "es",
  fallbackLng: "es",
  ns: ["common", "game", "config", "results", "errors"],
  defaultNS: "common",
  resources: {
    en: {
      common: enCommon,
      config: enConfig,
      errors: enErrors,
      game: enGame,
      results: enResults,
    },
    es: {
      common: esCommon,
      config: esConfig,
      errors: esErrors,
      game: esGame,
      results: esResults,
    },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
