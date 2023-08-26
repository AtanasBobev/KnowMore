import { render } from "preact";
import { App } from "./app.jsx";
import "./index.css";
import translate  from "./utils/languagesHandler.js";

//wait for the language data to load before rendering the app
const waitForLanguageData = () => {
    if (translate("label.logoText") === "label.logoText") {
        console.log("Waiting for language data. Checking every 100ms...");
        setTimeout(waitForLanguageData, 100);
    } else {
        console.log("Language data loaded");
        render(<App />, document.getElementById("app"));

    }
};
waitForLanguageData();

