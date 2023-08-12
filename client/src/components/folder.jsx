import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../utils/axiosConfig";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import parse from "html-react-parser";
import "../styles/folder.css";
const Folder = () => {
  const { id } = useParams();
  const [folder, setFolder] = useState({});
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axiosInstance.get(`/folder/${id}`).then((res) => {
      setFolder({
        title: res.data[0].title,
        description: res.data[0].description,
        owner: res.data[0].username,
      });
      setSets(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div id="page">
      {loading ? (
        <h1>Loading...</h1>
      ) : (
        <>
          <h1>{parse(`${folder.title} 🗂️`)}</h1>
          <h2 style={{ color: "gray" }}>{parse(folder.description).length}</h2>
          <h3 style={{ color: "gray" }}>Created by {folder.owner}</h3>
          <div className="setContainer">
            {sets.map((el) => (
              <Link
                style={{ textDecoration: "none" }}
                to={`/set/${el.set_id}`}
                key={el.id}
              >
                <section className="card">
                  <section className="card-body">
                    <div className="card-title">
                      {parse(
                        el.title.length > 50
                          ? el.title.slice(0, 50) + "..."
                          : el.title
                      )}
                    </div>
                    <div className="card-text">
                      {parse(
                        el.description.length > 50
                          ? el.description.slice(0, 50) + "..."
                          : el.description
                      )}
                    </div>
                  </section>
                </section>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Folder;
