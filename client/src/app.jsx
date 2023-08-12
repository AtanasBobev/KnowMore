import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./components/register";
import Login from "./components/login";
import CreateSet from "./components/createSet";
import CreateFolder from "./components/createFolder";
import VerifyEmail from "./components/verify-email";
import Study from "./components/study";
import NavBar from "./components/navBar";
import ViewSet from "./components/set";
import Sets from "./components/sets";
import Review from "./components/review";
import Explore from "./components/mainPage";
import Edit from "./components/edit";
import Folder from "./components/folder";

export function App() {
  return (
    <>
      <BrowserRouter>
        <NavBar />
        <div style={{ marginTop: "15vh" }}>
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/folder/:id" element={<Folder />} />
            <Route path="/login" element={<Login />} />
            <Route path="/create-set" element={<CreateSet />} />
            <Route path="/create-folder" element={<CreateFolder />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/study/:id" element={<Study />} />
            <Route path="/set/:id" element={<ViewSet />} />
            <Route path="/sets" element={<Sets />} />
            <Route path="/review/:id" element={<Review />} />
            <Route path="/edit/:id" element={<Edit />} />
            <Route path="/explore" element={<Explore />} />
          </Routes>
        </div>
      </BrowserRouter>
    </>
  );
}
