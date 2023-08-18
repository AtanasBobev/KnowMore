import { useEffect, useState } from "preact/hooks";
import { convert as parse } from "html-to-text";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import "../styles/allPages.css";
import { toast, ToastContainer } from "react-toastify";
import axiosInstance from "../utils/axiosConfig";
import SelectOptions from "./helpers/selectOptions";
import SelectSort from "./helpers/selectSort";
import SelectLimit from "./helpers/selectLimit";
import token from "../utils/jwtParser";
import "../styles/sets.css";
const Explore = () => {
  const [sets, setSets] = useState([]);
  const [category, setCategory] = useState();
  const [limit, setLimit] = useState(100);
  const [sortBy, setSortBy] = useState();
  const [query, setQuery] = useState();
  const [typeSearch, setTypeSearch] = useState("Sets");
  const navigate = useNavigate();

  const search = () => {
    if (typeSearch === "Sets") {
      axiosInstance
        .post("/sets/all", {
          query,
          category,
          limit,
          onlyPersonal: false,
          sortBy,
        })
        .then((res) => {
          setSets(res.data);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      axiosInstance
        .post("/folders/all", {
          query,
          category,
          limit,
          onlyPersonal: false,
          sortBy,
        })
        .then((res) => {
          setSets(res.data);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
  const multiShare = (folder_id, set) => {
    if (set.folder_id) {
      try {
        let url = `${window.location.origin}/folder/${folder_id}`;
        window.navigator.clipboard.writeText(url);
        toast.success("Share link has been copied to clipboard");
      } catch (err) {
        toast.error(
          "It seems like the share functionality doesn't work on your browser"
        );
      }
    } else {
      try {
        let url = `${window.location.origin}/set/${set.set_id}`;
        window.navigator.clipboard.writeText(url);
        toast.success("Share link has been copied to clipboard");
      } catch (err) {
        toast.error(
          "It seems like the share functionality doesn't work on your browser"
        );
      }
    }
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
      <h1 style={{margin:"2vmax"}}>Explore community creations 🔍</h1>
      <center>
        <select onChange={(e) => setTypeSearch(e.target.value)}>
          <option selected value="Sets">
            Sets
          </option>
          <option value="Folders">Folders</option>
        </select>
        <SelectLimit setLimit={setLimit} />
        <input
          style={{ width: "50ch" }}
          maxLength={100}
          placeholder="Search all sets"
          onChange={(e) =>
            setQuery(e.target.value.length ? e.target.value : "")
          }
        />
        <SelectOptions setCategory={setCategory} />
        <SelectSort setSortBy={setSortBy} />
        <button className="searchBtn" onClick={search}>
          Search
        </button>
      </center>
      {sets.length ? (
        <>
          {/*  */}
          <div className="setContainer">
            {sets.length
              ? sets.map((el) => (
                  <section
                    className={el.folder_id ? "card folder-background" : "card"}
                  >
                    <Link
                      style={{ textDecoration: "none" }}
                      target="_blank"
                      rel="noopener noreferrer"
                      to={
                        el.set_id
                          ? `/set/${el.set_id}`
                          : `/folder/${el.folder_id}`
                      }
                      key={el.id}
                    >
                      <section className="card-body">
                        <div className="card-title">
                          {parse(el.name).length > 50
                            ? parse(el.name).slice(0, 50) + "..."
                            : parse(el.name)}
                        </div>
                        <div className="card-text">
                          {parse(el.description).length > 50
                            ? parse(el.description).slice(0, 50) + "..."
                            : parse(el.description)}
                        </div>
                      </section>
                    </Link>

                    <section className="btnGroup">
                      <button
                        style={{ backgroundColor: "transparent" }}
                        onClick={() => multiShare(el.folder_id, el)}
                      >
                        Share
                      </button>
                      {el.user_id === token.user_id ? (
                        <button
                          style={{ backgroundColor: "transparent" }}
                          onClick={() => {
                            if (el.folder_id) {
                              navigate(`/folder/edit/${el.folder_id}`);
                            } else {
                              navigate(`/edit/${el.set_id}`);
                            }
                          }}
                        >
                          Edit
                        </button>
                      ) : (
                        ""
                      )}

                      {el.user_id === token.user_id ? (
                        <button
                          style={{ backgroundColor: "transparent" }}
                          onClick={() => {
                            if (el.folder_id)
                              window.location.href = `/folder/delete/${el.folder_id}`;
                            else
                              window.location.href = `/set/delete/${el.set_id}`;
                          }}
                        >
                          Delete
                        </button>
                      ) : (
                        ""
                      )}
                    </section>
                  </section>
                ))
              : ""}
          </div>
        </>
      ) : (
        <h2 id="infoText">
          My pet parrot 🦜 flew across many oceans but couldn't find the set you
          are looking for. Why not create it?
        </h2>
      )}
    </div>
  );
};

export default Explore;
