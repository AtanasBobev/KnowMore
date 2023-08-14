import { useEffect, useState } from "preact/hooks";
import { convert as parse } from "html-to-text";
import { Link } from "react-router-dom";
import "../styles/allPages.css";
import axiosInstance from "../utils/axiosConfig";
import SelectOptions from "./helpers/selectOptions";
import SelectLimit from "./helpers/selectLimit";
import { toast, ToastContainer } from "react-toastify";
import "../styles/sets.css";
const Folders = () => {
  const [folders, setFolders] = useState([]);
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState(100);
  const [query, setQuery] = useState("");
  const search = () => {
    axiosInstance
      .post("/folders/user", {
        query,
        category,
        limit,
        onlyPersonal: true,
      })
      .then((res) => {
        setFolders(res.data);
      })
      .catch((err) => {
        toast.error("Ooops, something went wrong");
      });
  };
  useEffect(search, []);

  return (
    <div id="page">
      <ToastContainer
        position="bottom-right"
        hideProgressBar={false}
        autoClose={3000}
        theme="colored"
        closeOnClick
      />{" "}
      <h1>Your folders 🗂️</h1>
      <center>
        <SelectLimit setLimit={setLimit} />
        <input
          style={{ width: "50ch", margin: ".5vmax" }}
          maxLength={100}
          placeholder="Search your sets"
          onChange={(e) =>
            setQuery(e.target.value.length ? e.target.value : "")
          }
        />
        <SelectOptions setCategory={setCategory} />
        <button className="searchBtn" onClick={search}>
          Search
        </button>
      </center>
      {folders.length ? (
        <>
          {/*  */}
          <div className="setContainer">
            {folders.length
              ? folders.map((el) => (
                  <Link
                    style={{ textDecoration: "none" }}
                    to={`/folder/${el.folder_id}`}
                    key={el.folder_id}
                  >
                    <section className="card">
                      <section className="card-body">
                        <div className="card-title">
                          {parse(el.title).length > 50
                            ? parse(el.title).slice(0, 50) + "..."
                            : parse(el.title)}
                        </div>
                        <div className="card-text">
                          {parse(el.description).length > 50
                            ? parse(el.description).slice(0, 50) + "..."
                            : parse(el.description)}
                        </div>
                      </section>
                    </section>
                  </Link>
                ))
              : ""}
          </div>
        </>
      ) : (
        <h2 id="infoText">
          My pet parrot 🦜 flew across many oceans but couldn't find the folder
          you are looking for. Why not create it?
        </h2>
      )}
    </div>
  );
};

export default Folders;
