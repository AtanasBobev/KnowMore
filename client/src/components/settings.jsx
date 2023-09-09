import { useState, useEffect, useLayoutEffect, useRef } from "preact/hooks";
import translate from "../utils/languagesHandler";
import "../styles/settings.css";
import axiosInstance from "../utils/axiosConfig";
import jwt_decode from "jwt-decode";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import { set } from "date-fns";

const Settings = () => {
  const [userPreferences, setUserPreferences] = useState({
    minimumFlashcardAppears: 1,
    maximumFlashcardAppears: 9999,
    promptWith: "auto",
  });
  const [pendingChanges, setPendingChanges] = useState(false);
  const [serverUpdate, setServerUpdate] = useState(false);
  const isMounted = useRef(true);

  const logOut = () => {
    localStorage.removeItem("jwt");
    window.location.reload();
  };

  const deleteEverything = () => {
    let pass = prompt("Enter your password to confirm");
    if (!pass) {
      return;
    }
    axiosInstance
      .post("/auth/delete", { password: pass })
      .then((res) => {
        if (res.status === 200) {
          localStorage.removeItem("jwt");
          window.location.reload();
        }
      })
      .catch((err) => {
        toast.error(err.response.data.message);
      });
  };

  const deleteData = () => {
    let pass = prompt("Enter your password to confirm");
    if (!pass) {
      return;
    }
    axiosInstance
      .post("/auth/delete/data", { password: pass })
      .then((res) => {
        if (res.status === 200) {
          localStorage.removeItem("jwt");
          window.location.reload();
        }
      })
      .catch((err) => {
        // toast.error(translate("error.generic"));
      });
  };

  const exportAll = () => {
    axiosInstance
      .post("/export/all")
      .then((res) => {
        if (res.status === 200) {
          let data = res.data;
          let dataStr = JSON.stringify(data);
          let dataUri =
            "data:application/json;charset=utf-8," +
            encodeURIComponent(dataStr);
          let exportFileDefaultName = "MyData.json";
          let linkElement = document.createElement("a");
          linkElement.setAttribute("href", dataUri);
          linkElement.setAttribute("download", exportFileDefaultName);
          linkElement.click();
        }
      })
      .catch((err) => {
        toast.error(translate("error.generic"));
      });
  };

  const changeLanguage = (choice) => {
    let value = choice.target.value;
    axiosInstance
      .post("/languages/user/change", { language: value })
      .then((res) => {
        if (res.status === 200) {
          localStorage.setItem("language", value);
          window.location.reload();
        }
      })
      .catch((err) => {
        toast.error(translate("error.generic"));
      });
  };

  useEffect(() => {
    axiosInstance
      .get("/preferences/user")
      .then((res) => {
        if (isMounted.current) {
          setUserPreferences({
            minimumFlashcardAppears: res.data.minimum_flashcard_appears,
            maximumFlashcardAppears: res.data.maximum_flashcard_appears,
            promptWith: res.data.prompt_with,
          });
          setServerUpdate(true);
        }
      })
      .catch((err) => {
        if (isMounted.current) {
          toast.error(translate("error.generic"));
        }
      });
  }, []);

  const handlePreferenceChange = (preference, value) => {
    if (preference === "minimumFlashcardAppears") {
      if (value > userPreferences.maximumFlashcardAppears) {
        toast.error(translate("error.minimumFlashcardAppears"));
        return;
      }
    }
    if (preference === "maximumFlashcardAppears") {
      if (value < userPreferences.minimumFlashcardAppears) {
        toast.error(translate("error.maximumFlashcardAppears"));
        return;
      }
    }
    if (preference === "promptWith") {
      if (
        value !== "auto" &&
        value !== "term" &&
        value !== "definition" &&
        value !== "both"
      ) {
        toast.error(translate("error.promptWith"));
        return;
      }
    }
    setUserPreferences({ ...userPreferences, [preference]: value });
    setPendingChanges(true);
  };

  useEffect(() => {
    if (pendingChanges) {
      axiosInstance
        .post("/preferences/user/change", {
          minimumFlashcardAppears: userPreferences.minimumFlashcardAppears,
          maximumFlashcardAppears: userPreferences.maximumFlashcardAppears,
          promptWith: userPreferences.promptWith,
        })
        .then((res) => {
          if (res.status === 200) {
            setPendingChanges(false);
            toast.success(translate("success.Done"));
          }
        })
        .catch((err) => {
          toast.error(translate("error.generic"));
        });
    }
  }, [pendingChanges]);

  return (
    <div id="settings">
      <ToastContainer />
      <h1>{translate("label.Settings")}⚙️</h1>
      <section>
        <h2>{translate("label.Account")}</h2>
        <ul>
          <li>{translate("label.logOut")}</li>
          <div>
            <p>{translate("label.logOutDescription")}</p>
            <button onClick={logOut}>{translate("label.logOut")}</button>
          </div>
          <li>{translate("label.changeUsername")}</li>
          <div>
            <p>{translate("label.changeUsernameDescription")}</p>
            <input type="text" placeholder={translate("label.newUsername")} />
            <button>{translate("button.newUsername")}</button>
          </div>
          <li>{translate("label.changeEmail")}</li>
          <div>
            <p>{translate("label.changeEmailDescription")}</p>
            <p>{translate("label.yourCurrentEmailIs")} someemail@gmail.com</p>
            <input type="text" placeholder="New email" />
            <button>{translate("button.changeEmail")}</button>
          </div>
          <li>{translate("label.changePassword")}</li>
          <div>
            <p>
             {translate("label.passwordExplanation")}
            </p>
            <input type="text" placeholder={translate("placeholder.currentPassword")} />
            <input type="text" placeholder={translate("placeholder.newPassword")} />
            <input type="text" placeholder={translate("placeholder.repeatNewPassword")} />
            <button>{translate("button.changePassword")}</button>
          </div>
          <li>{translate("label.changeLanguage")}</li>
          <div>
            <p>
             {translate("label.changeLanguageDescription")}
            </p>
            <select
              onChange={changeLanguage}
              value={localStorage.getItem("language")}
            >
              <option value="en-US">{translate("option.English")}</option>
              <option value="bg-BG">{translate("option.Bulgarian")}</option>
            </select>
          </div>
          <li>{translate("label.exportData")}</li>
          <div>
            <p>
             {translate("label.exportDataDescription")}
            </p>
            <button onClick={exportAll}>{translate("button.exportAllData")}</button>
          </div>
          <li>{translate("label.deleteData")}</li>
          <div>
            <p>
              {translate("label.deleteDataDescription")}
            </p>
            <button onClick={deleteData}>{translate("button.deleteAllData")}</button>
          </div>
          <li>{translate("label.deleteEverything")}</li>
          <div>
            <p>
              {translate("label.deleteEverythingDescription")}
            </p>
            <button onClick={deleteEverything}>
              {translate("button.deleteEverything")}
            </button>
          </div>
        </ul>
        <h2>{translate("label.Study")}</h2>
        <ul>
          <li>{translate("label.minFlashcardsShown")}</li>
          <div>
            <p>
              {translate("label.minFlashcardsShownDescription")}
            </p>
            <select
              onChange={(e) =>
                handlePreferenceChange(
                  "minimumFlashcardAppears",
                  Number(e.target.value)
                )
              }
              value={userPreferences.minimumFlashcardAppears}
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="5">5</option>
            </select>
          </div>
          <li>{translate("label.maxFlashcardsShown")}</li>
          <div>
            <p>
            {translate("label.maxFlashcardsShownDescription")}
            </p>
            <select
              onChange={(e) =>
                handlePreferenceChange(
                  "maximumFlashcardAppears",
                  Number(e.target.value)
                )
              }
              value={userPreferences.maximumFlashcardAppears}
            >
              <option value="9999">-</option>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </div>
          <li>{translate("label.promptWith")}</li> 
          <div>
            <p>{translate("label.promptWithDescription")}</p>
            <select
              onChange={(e) =>
                handlePreferenceChange("promptWith", e.target.value)
              }
              value={userPreferences.promptWith}
            >
              <option value="term">{translate("option.Term")}</option>
              <option value="definition">{translate("option.Definition")}</option>
              <option value="both">{translate("option.Both")}</option>
              <option value="auto">{translate("option.Auto")}</option>
            </select>
          </div>
        </ul>
      </section>
    </div>
  );
};

export default Settings;
