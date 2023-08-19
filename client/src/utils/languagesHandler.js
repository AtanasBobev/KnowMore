import axiosInstance from "./axiosConfig";


const currentLanguage = "en-US";

let languageData = {};

const loadLanguageData = async (language) => {
  try {
    const response = await axiosInstance.get(`/languages/${language}`);
    return response.data;
  } catch (error) {
    console.error("Error loading language data:", error);
    return {};
  }
};


const initializeLanguageData = async () => {
  languageData = await loadLanguageData(currentLanguage);
};

const translate = (key) => {
  console.log(languageData);
  return languageData[key] || key; // Return the translation or the key itself if not found
};

window.addEventListener("load", initializeLanguageData);

export default translate;
