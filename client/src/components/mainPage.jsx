import { useEffect, useState } from "preact/hooks";
import { convert as parse } from "html-to-text";
import { Link } from "react-router-dom";
import "../styles/allPages.css";
import axiosInstance from "../utils/axiosConfig";
import SelectOptions from "./helpers/selectOptions";
import SelectSort from "./helpers/selectSort";
import SelectLimit from "./helpers/selectLimit";
import "../styles/sets.css";
const Explore = () => {
  const [sets, setSets] = useState([]);
  const [category, setCategory] = useState();
  const [limit, setLimit] = useState(100);
  const [sortBy, setSortBy] = useState();
  const [query, setQuery] = useState();
  const search = () => {
    axiosInstance
      .post("/sets/all", { query, category, limit, onlyPersonal: false,sortBy })
      .then((res) => {
        setSets(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };
  useEffect(search, []);

  return (
    <div id="page">
      <h1>Community sets 🔍</h1>
     
      {sets.length ? (
        <>
         <center>
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
        <button className="searchBtn" onClick={search}>Search</button>
      </center>{/*  */}
          <div className="setContainer">
            {sets.length
              ? sets.map((el) => (
                  <Link
                    style={{ textDecoration: "none" }}
                    to={`/set/${el.set_id}`}
                    key={el.id}
                  >
                    <section className="card">
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
                    </section>
                  </Link>
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
