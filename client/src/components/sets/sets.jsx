import { useEffect, useState } from "preact/hooks";
import translate from "../../utils/languagesHandler";
import { convert as parse } from "html-to-text";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "../../styles/allPages.css";
import axiosInstance from "../../utils/axiosConfig";
import SelectOptions from "../helpers/selectOptions";
import SelectSort from "../helpers/selectSort";
import SelectLimit from "../helpers/selectLimit";
import token from "../../utils/jwtParser";
import "../../styles/sets.css";
import { useNavigate } from "react-router-dom";
import { set } from "date-fns";
const SetsComponent = () => {
  const [sets, setSets] = useState([]);
  const [category, setCategory] = useState();
  const [limit, setLimit] = useState(100);
  const [sortBy, setSortBy] = useState();
  const [query, setQuery] = useState();
  const navigate = useNavigate();
  const search = () => {
    axiosInstance
      .post("/sets/all", { query, category, limit, onlyPersonal: true, sortBy })
      .then((res) => {
        setSets(res.data);
      })
      .catch((err) => {
        toast.error(translate("error.generic"));
      });
  };
  const Share = (set_id) => {
    try {
      let url = `${window.location.origin}/set/${set_id}`;
      window.navigator.clipboard.writeText(url);
      toast.success(translate("success.sharedLinkCopied"));
    } catch (err) {
      toast.error(translate("error.featureNotSupported"));
    }
  };
  const removeSet = (set_id, user_id) => {
    if (token.user_id !== user_id) {
      toast.error(translate("error.notOwner"));
      return false;
    }
    if (!confirm(translate("prompt.deleteSet"))) {
      return false;
    }
    axiosInstance
      .post(`/set/delete`, { set_id })
      .then((res) => {
        if (res.status === 200) {
          toast.success(translate("success.setDeleted"));
          setSets(sets.filter((el) => el.set_id !== set_id));
        }
      })
      .catch((err) => {
        toast.error(translate("error.generic"));
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
      />
      <h1 style={{ margin: "2vmax" }}>{translate("label.yourSets")} 🧮</h1>

      {sets.length ? (
        <>
          <center>
            <SelectLimit setLimit={setLimit} />
            <input
              style={{ width: "50ch", margin: ".5vmax" }}
              maxLength={100}
              placeholder={translate("placeholder.searchOwnSets")}
              onChange={(e) =>
                setQuery(e.target.value.length ? e.target.value : "")
              }
            />
            <SelectOptions setCategory={setCategory} />
            <SelectSort setSortBy={setSortBy} />
            <button className="searchBtn" onClick={search}>
              {translate("button.Search")}
            </button>
          </center>
          {/*  */}
          <div className="setContainer">
            {sets.length
              ? sets.map((el) => (
                  <section className="card">
                    <Link
                      style={{ textDecoration: "none" }}
                      to={`/set/${el.set_id}`}
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
                        onClick={() => Share(el.set_id)}
                      >
                        {translate("button.Share")}
                      </button>
                      {el.user_id === token.user_id ? (
                        <button
                          style={{ backgroundColor: "transparent" }}
                          onClick={() => {
                            navigate("/set/edit/" + el.set_id);
                          }}
                        >
                          {translate("button.Edit")}
                        </button>
                      ) : (
                        ""
                      )}
                      {el.user_id === token.user_id ? (
                        <button
                          style={{ backgroundColor: "transparent" }}
                          onClick={() => removeSet(el.set_id, el.user_id)}
                        >
                          {translate("button.Delete")}
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
         {translate("label.noSetsFound")}
        </h2>
      )}
    </div>
  );
};

export default SetsComponent;
