import translate from "../utils/languagesHandler";
import "../styles/settings.css";
import axiosInstance from "../utils/axiosConfig";
import jwt_decode from "jwt-decode";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import { useState, useEffect } from "preact/hooks";
const Settings = () => {
  const [minimumFlashcardAppears, setMinimumFlashcardAppears] = useState(1);
  const [maximumFlashcardAppears, setMaximumFlashcardAppears] = useState(9999);
  const [promptWith, setPromptWith] = useState("auto");
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
        //  toast.error(translate("error.generic"));
      });
  };
  const exportAll = () => {
    axiosInstance
      .post("/export/all")
      .then((res) => {
        if (res.status === 200) {
          //     let jwt = localStorage.getItem("jwt");
          //    let username = jwt_decode(jwt).username;
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
  if (maximumFlashcardAppears < minimumFlashcardAppears) {
    toast.error(translate("error.invalidParameters"));
    return;
  }
  axiosInstance
    .get("/preferences")
    .then((res) => {
      if (res.status === 200) {
        setMinimumFlashcardAppears(res.data.minimumFlashcardAppears);
        setMaximumFlashcardAppears(res.data.maximumFlashcardAppears);
        setPromptWith(res.data.promptWith);
      }
    })
    .catch((err) => {
      toast.error(translate("error.generic"));
    });
}, []);
useEffect(() => {
  axiosInstance
    .post("/preferences/change", {
      minimumFlashcardAppears,
      maximumFlashcardAppears,
      promptWith,
    })
    .then((res) => {
      if (res.status === 200) {
        toast.success(translate("success.preferencesChanged"));
      }
    })
    .catch((err) => {
      toast.error(translate("error.generic"));
    });
}, [minimumFlashcardAppears, maximumFlashcardAppears, promptWith]);

  return (
    <div id="settings">
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
            <p>Your current email is: someemail@gmail.com</p>
            <input type="text" placeholder="New email" />
            <button>Change email</button>
          </div>
          <li>Change password</li>
          <div>
            <p>
              Password must be at least 8 characters long and contain at least
              one number and one letter. You will be logged out and will have to
              login again with the new password.
            </p>
            <input type="text" placeholder="Enter current password" />
            <input type="text" placeholder="Enter new password" />
            <input type="text" placeholder="Repeat new password" />
            <button>Change password</button>
          </div>
          <li>Change language</li>
          <div>
            <p>
              Changing the langauges changes the UI language, but doesn't change
              the speaking language.
            </p>
            <select
              onChange={changeLanguage}
              value={localStorage.getItem("language")}
            >
              <option value="en-US">English</option>
              <option value="bg-BG">Bulgarian</option>
            </select>
          </div>
          <li>Export data</li>
          <div>
            <p>
              Exporting your data will download a .json file with all your sets
              and preferences. You can use this file to import your data in
              another account.
            </p>
            <button onClick={exportAll}>Export all data</button>
          </div>
          <li>Delete data</li>
          <div>
            <p>
              Deleting your data all sets and preferences are going to be
              deleted, but your account is going to be preserved. Use this
              option if you want to start fresh.
            </p>
            <button onClick={deleteData}>Delete all data</button>
          </div>
          <li>Delete account</li>
          <div>
            <p>
              Once you delete your data and account the request may take up to a
              couple of minutes depending on the size of the account. We advise
              you to download your data beforehand.
            </p>
            <button onClick={deleteEverything}>
              Delete all data & account
            </button>
          </div>
        </ul>
        <h2>Study</h2>
        <ul>
          <li>Minimum number of times a flashcard is shown</li>
          <div>
            <p>
              The minimum number of times a flashcards is going to be seen in a
              study session
            </p>
            <select
              onChange={(e) =>
                setMinimumFlashcardAppears(Number(e.target.value))
              }
              value={minimumFlashcardAppears}
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="5">5</option>
            </select>
          </div>
          <li>Maximum number a flashcard is shown</li>
          <div>
            <p>
              The maximum number of times a flashcards is going to be seen in a
              study session
            </p>
            <select onChange={e=>setMaximumFlashcardAppears(e.target.value)} value={maximumFlashcardAppears}>
              <option value="9999">No maximum</option>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </div>
          <li>Prompt with </li>
          <div>
            <p>Choose what to be prompted with in study mode</p>
            <select onChange={e=>setPromptWith(e.target.value)} value={promptWith}>
              <option value="term">Term</option>
              <option value="definition">Definition</option>
              <option value="both">Both</option>
              <option value="auto">Auto</option>
            </select>
          </div>
        </ul>
      </section>
    </div>
  );
};

export default Settings;
