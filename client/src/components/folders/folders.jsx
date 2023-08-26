import { useEffect, useState } from "preact/hooks";
import { convert as parse } from "html-to-text";
import { Link } from "react-router-dom";
import "../../styles/allPages.css";
import axiosInstance from "../../utils/axiosConfig";
import SelectOptions from "./../helpers/selectOptions";
import SelectLimit from "./../helpers/selectLimit";
import token from "../../utils/jwtParser";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "../../styles/sets.css";
import translate from "../../utils/languagesHandler";
import axios from "axios";
const Folders = () => {
  const [folders, setFolders] = useState([]);
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState(100);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
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
        toast.error(translate("error.generic"));
      });
  };
  const shareFolderOutside = (folder_id) => {
    try {
      let url = `${window.location.origin}/folder/${folder_id}`;
      window.navigator.clipboard.writeText(url);
      toast.success(translate("success.sharedLinkCopied"));
    } catch (err) {
      toast.error(translate("error.featureNotSupported"));
    }
  };
  const removeFolder = (folder_id, user_id) => {
    //check if the user is the owner of the folder
    if (token.user_id !== user_id) {
      toast.error(translate("error.notOwner"));
      return false;
    }
    if (!confirm(translate("prompt.deleteFolder"))) {
      return false;
    }
    axiosInstance
      .post(`/folder/delete`, { folder_id })
      .then((res) => {
        if (res.status === 200) {
          toast.success(translate("success.folderDeleted"));
          search();
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
      />{" "}
      <h1>{translate("label.yourFolders")} 🗂️</h1>
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
        <button className="searchBtn" onClick={search}>
          {translate("label.search")}
        </button>
      </center>
      {folders.length ? (
        <>
          <div className="setContainer">
            {folders.length
              ? folders.map((el) => (
                  <section className="card folder-background">
                    <Link
                      style={{ textDecoration: "none" }}
                      to={`/folder/${el.folder_id}`}
                      key={el.folder_id}
                    >
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
                    </Link>
                    <section className="btnGroup">
                      <button
                        style={{ backgroundColor: "transparent" }}
                        onClick={() => shareFolderOutside(el.folder_id)}
                      >
                        {translate("button.share")}
                      </button>
                      {el.user_id === token.user_id ? (
                        <button
                          style={{ backgroundColor: "transparent" }}
                          onClick={() => {
                            navigate("/folder/edit/" + el.folder_id);
                          }}
                        >
                          {translate("button.edit")}
                        </button>
                      ) : (
                        ""
                      )}
                      {el.user_id === token.user_id ? (
                        <button
                          style={{ backgroundColor: "transparent" }}
                          onClick={() => removeFolder(el.folder_id, el.user_id)}
                        >
                          {translate("button.delete")}
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
        <h2 id="infoText">{translate("label.noFoldersFound")}</h2>
      )}
    </div>
  );
};

export default Folders;
