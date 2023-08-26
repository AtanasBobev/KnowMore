import { set } from "date-fns";
import axiosInstance from "./axiosConfig";


const currentLanguage = "en-US";

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

const translate = (key) => {
  if (!languageData[key]) {
    return key;
  }
  return languageData[key];
};

window.addEventListener("load", initializeLanguageData);

export default translate;
