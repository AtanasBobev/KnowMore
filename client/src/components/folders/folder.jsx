import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../../utils/axiosConfig";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import parse from "html-react-parser";
import { shareSet as Share } from "../../utils/_setOpertaions";
import "../../styles/folder.css";
import { set } from "date-fns";
import translate from "../../utils/languagesHandler";
const Folder = () => {
  const { id } = useParams();
  const [folder, setFolder] = useState({});
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const getData = () => {
    axiosInstance
      .get(`/folder/${id}`)
      .then((res) => {
        if (res.status === 204) {
          setFolder({
            title: "Hmm, this folder is empty",
            description: "Nothing to see here...",
            owner: "a mysterious stranger🕵️‍♂️",
          });
          setLoading(false);
        } else {
          setFolder({
            title: res.data[0].title,
            description: res.data[0].description,
            owner: res.data[0].username,
          });
          setSets(res.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (err.status == 404) {
          setFolder({
            title: "Folder not found",
            description: "404",
            owner: "an alien👽",
          });
          setLoading(false);
        } else {
          toast.error("Ooops, something went wrong");
        }
      });
  };
  const removeFromFolder = (set_id) => {
    axiosInstance
      .post("/folder/set/remove", { folder_id: id, set_id })
      .then((res) => {
        toast.success(translate("success.setRemovedFromFolder"));
        setSets((prev) => prev.filter((el) => el.set_id !== set_id));
      })
      .catch((err) => {
        toast.error(translate("error.generic"));
      });
  };
  useEffect(() => {
    getData();
  }, []);

  return (
    <div id="page">
      {loading ? (
        <h1>...</h1>
      ) : (
        <>
          <ToastContainer
            position="bottom-right"
            hideProgressBar={false}
            autoClose={3000}
            theme="colored"
            closeOnClick
          />
          <h1>{parse(`${folder.title} 🗂️`)}</h1>
          <h2 style={{ color: "gray" }}>{parse(folder.description)}</h2>
          <h3 style={{ color: "gray" }}>
            {translate("label.createdBy")} {folder.owner}
          </h3>
          <div className="setContainer">
            {sets.length > 0 && sets[0].set_id !== null
              ? sets.map((el) => (
                  <section className="card">
                    <Link
                      style={{ textDecoration: "none" }}
                      to={`/set/${el.set_id}`}
                      key={el.id}
                    >
                      <section className="card-body">
                        <div className="card-title">
                          {parse(
                            el.set_title.length > 50
                              ? el.set_title.slice(0, 50) + "..."
                              : el.set_title
                          )}
                        </div>
                        <div className="card-text">
                          {parse(
                            el.set_description.length > 50
                              ? el.set_description.slice(0, 50) + "..."
                              : el.set_description
                          )}
                        </div>
                      </section>
                    </Link>
                    <button onClick={() => removeFromFolder(el.set_id)}>
                      {translate("button.Remove")}
                    </button>
                  </section>
                ))
              : ""}
          </div>
        </>
      )}
    </div>
  );
};

export default Folder;
