import { h, render } from "preact";
import { useState, useEffect } from "preact/hooks";
import { App } from "./app.jsx";
import "./index.css";
import translate from "./utils/languagesHandler.js";
import LanguageChooser from "./components/languageChooser.jsx";

const AppLoader = () => {
  const [languageDataLoaded, setLanguageDataLoaded] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [showLanguageChooser, setShowLanguageChooser] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("language")) {
        initiateLanguageData(localStorage.getItem("language"));
    }else{
        setShowLanguageChooser(true);
    }
  }, []);
  useEffect(() => {
    if (selectedLanguage) {
      setShowLanguageChooser(false);
      initiateLanguageData(selectedLanguage);
    }
  }, [selectedLanguage]);

  const initiateLanguageData = (lang) => {
    if (translate("label.logoText", lang) === "label.logoText") {
      console.log("Waiting for language data. Checking every 100ms...");
      setTimeout(() => initiateLanguageData(lang), 100);
    } else {
      console.log("Language data loaded");
      setLanguageDataLoaded(true);
    }
  };

  const handleLanguageChange = (newLanguage) => {
    // Handle language change here and update the selectedLanguage state accordingly
    setSelectedLanguage(newLanguage);
  };

  return (
    <div>
      {showLanguageChooser ? (
        <LanguageChooser chooseLang={handleLanguageChange} />
      ) : (
        <App />
      )}
    </div>
  );
};

render(<AppLoader />, document.getElementById("app"));
