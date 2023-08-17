import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { convert as convertToText } from "html-to-text";
import axiosInstance from "../utils/axiosConfig";
import t from "../translations/translation.bg-BG.json";

import "../styles/navBar.css";

const NavBar = () => {
  const [isAuth, setIsAuth] = useState(false); // State for register/login mode
  const [mostCommonSets, setMostCommonSets] = useState([]); // State for most common set
  const [showCreateOptions, setShowCreateOptions] = useState(false); // State for showing create options
  const location = useLocation(); // Get the current location
  const createButtonRef = useRef(null); // Create a ref for the "Create" button
  const getMostCommonSets = async () => {
    axiosInstance.get("/sets/most/common").then((res) => {
      setMostCommonSets(res.data);
    });
  };
  const toggleCreateOptions = () => {
    setShowCreateOptions(!showCreateOptions);
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        createButtonRef.current &&
        !createButtonRef.current.contains(event.target)
      ) {
        setShowCreateOptions(false);
      }
    };
    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);
  useEffect(() => {
    localStorage.getItem("jwt") ? setIsAuth(true) : setIsAuth(false);
  }, [localStorage.getItem("jwt")]);

  useEffect(() => {
    getMostCommonSets();
  }, []);
  return (
    <nav className={`navbar ${isAuth ? "auth" : ""}`}>
      <Link style={{ textDecoration: "none" }} to="/" className="logo">
        <h1 className="logo-text">{t.logoText}</h1>
      </Link>
      <div className="nav-links">
        {isAuth ? (
          <>
            <li>
              <Link
                to="/explore"
                className={location.pathname === "/explore" ? "active" : ""}
              >
                <span role="img" aria-label="Explore">
                  🔍
                </span>{" "}
                Explore
              </Link>
            </li>

            <li>
              <Link
                to="/sets"
                className={location.pathname === "/sets" ? "active" : ""}
              >
                <span role="img" aria-label="Sets">
                  🧮
                </span>{" "}
                Sets
              </Link>
            </li>
            <li>
              <Link
                to="/folders"
                className={location.pathname === "/folders" ? "active" : ""}
              >
                <span role="img" aria-label="Folders">
                  🗂️
                </span>{" "}
                Folders
              </Link>
            </li>
            <li>
              <div ref={createButtonRef} className="create-button">
                <Link
                  className={
                    location.pathname === "/create-set" ||
                    location.pathname === "/create-folder"
                      ? "active"
                      : ""
                  }
                  to={window.location.pathname}
                  onClick={toggleCreateOptions}
                >
                  <span role="img" aria-label="Create">
                    ✏️
                  </span>
                  Create
                </Link>
                {showCreateOptions && (
                  <div className="create-options">
                    <Link
                      className={
                        location.pathname === "/create-set" ? "active" : ""
                      }
                      to="/create-set"
                    >
                      Set
                    </Link>
                    <Link
                      className={
                        location.pathname === "/create-folder" ? "active" : ""
                      }
                      to="/create-folder"
                    >
                      Folder
                    </Link>
                  </div>
                )}
              </div>
            </li>
            <li>
              <Link
                to="/settings"
                className={location.pathname === "/settings" ? "active" : ""}
              >
                <span role="img" aria-label="Settings">
                  ⚙️
                </span>{" "}
                Settings
              </Link>
            </li>
            <ul className="jsb">
              <div className="btn-container">
                {mostCommonSets.map((set) => (
                  <li key={set.id}>
                    <Link
                      to={`/set/${set.set_id}`}
                      className={
                        location.pathname === `/set/${set.id}`
                          ? "active common-set"
                          : "common-set"
                      }
                    >
                      {convertToText(set.name).length > 20
                        ? convertToText(set.name).substring(0, 20) + "..."
                        : convertToText(set.name)}
                    </Link>
                  </li>
                ))}
              </div>
            </ul>
          </>
        ) : (
          <>
            <li>
              <Link
                to="/login"
                className={location.pathname === "/login" ? "active" : ""}
              >
                <span role="img" aria-label="Login">
                  🔥
                </span>
                Login
              </Link>
            </li>
            <li>
              <Link
                to="/register"
                className={location.pathname === "/register" ? "active" : ""}
              >
                <span role="img" aria-label="Register">
                  🛸
                </span>
                Register
              </Link>
            </li>
          </>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
