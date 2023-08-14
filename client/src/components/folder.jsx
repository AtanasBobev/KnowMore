import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../utils/axiosConfig";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import parse from "html-react-parser";
import "../styles/folder.css";
import { set } from "date-fns";
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
        console.log(res);
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
  useEffect(() => {
    getData();
  }, []);
  const removeFromFolder = () => {
    if (!confirm("Are you sure you want to remove this set from the folder?")) {
      return false;
    }
    axiosInstance
      .post(`/folder/set/remove`, { folder_id:id, set_id: sets[0].set_id })
      .then((res) => {
        if (res.status === 200) {
          toast.success("Set removed from folder");
        } else {
          toast.error("Ooops, something went wrong");
        }
      });
  };

  return (
    <div id="page">
      {loading ? (
        <h1>Loading...</h1>
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
          <h3 style={{ color: "gray" }}>Created by {folder.owner}</h3>
          <div className="setContainer">
            {sets.length
              ? sets[0].set_id
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
                      <button onClick={removeFromFolder}>Remove</button>
                    </section>
                  ))
                : ""
              : ""}
          </div>
        </>
      )}
    </div>
  );
};

export default Folder;
