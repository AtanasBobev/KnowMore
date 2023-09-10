import { useState, useEffect } from "preact/hooks";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Register from "./components/authentication/register";
import Login from "./components/authentication/login";
import CreateSet from "./components/sets/createSet";
import CreateFolder from "./components/folders/createFolder";
import VerifyEmail from "./components/authentication/verifyEmail";
import Study from "./components/sets/study";
import NavBar from "./components/navBar";
import ViewSet from "./components/sets/set";
import Sets from "./components/sets/sets";
import Review from "./components/sets/review";
import Explore from "./components/explore";
import EditSet from "./components/sets/editSet";
import Folder from "./components/folders/folder";
import Folders from "./components/folders/folders";
import FolderEdit from "./components/folders/editFolder";
import Settings from "./components/settings";
import "./app.css"

export const App = () => {
  const [verified, setVerified] = useState(true);
  useEffect(() => {
    let jwt = localStorage.getItem("jwt");
    if (jwt) {
      setVerified(true);
    }else{
      setVerified(false);
    }
  }, []);

  return (
    <>
      <BrowserRouter>
        <NavBar />
        <div style={{ marginTop: "15vh" }}>
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/study/:id" element={<Study />} />
            <Route path="/review/:id" element={<Review />} />

            {verified && (
              <>
                {/* Protected routes */}
                <Route path="/folder/edit/:id" element={<FolderEdit />} />
                <Route path="/folders" element={<Folders />} />
                <Route path="/create-set" element={<CreateSet />} />
                <Route path="/create-folder" element={<CreateFolder />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/sets" element={<Sets />} />
                <Route path="/set/edit/:id" element={<EditSet />} />
                <Route path="/settings" element={<Settings />} />
              </>
            )}

            {/* 404 handling */}
            <Route path="*" element={<Navigate to="/explore" />} />

            {/* These routes are outside the verified check */}
            <Route path="/set/:id" element={<ViewSet />} />
            <Route path="/folder/:id" element={<Folder />} />
          </Routes>
        </div>
      </BrowserRouter>
    </>
  );
}