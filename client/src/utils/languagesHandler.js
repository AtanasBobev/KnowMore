import { set } from "date-fns";
import axiosInstance from "./axiosConfig";

const currentLanguage = localStorage.getItem("language") || "en-US";

let languageData = {};

const loadLanguageData = async (language) => {
  try {
    const response = await axiosInstance.get(`/languages/${language}`);
    return response.data;
  } catch (error) {
    console.error("Error loading language data:", error);
    setTimeout(() => loadLanguageData(language), 3000);
    return {};
  }
};

const initializeLanguageData = async () => {
  languageData = await loadLanguageData(currentLanguage);
};

const translate = (key, lang) => {
  if (lang) {
    if (lang !== currentLanguage) {
      loadLanguageData(lang).then((data) => {
        localStorage.setItem("language", lang);
        languageData = data;
      });
    }
  }
  if (!languageData[key]) {
    return key;
  }
  return languageData[key];
};

window.addEventListener("load", initializeLanguageData);

export default translate;
