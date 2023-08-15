import React from "react";
import { Link } from "react-router-dom";
import parse from "html-react-parser";
import axiosInstance from "../../utils/axiosConfig.js";
import axios from "axios";
const AddToFolderModal = (props) => {
  const addToFolder = () => {
    axiosInstance
      .post("/folders/sets/add", {
        set_id: props.addToFolderPopup.set_id,
        folder_ids: props.addToFolderPopup.foldersChosen,
      })
      .then((res) => {
        props.setAddToFolderPopup({
          ...props.addToFolderPopup,
          open: false,
          foldersChosen: [],
        });
        props.toast("Added to folder");
      })
      .catch((err) => {
        props.toast("Error adding to folder");
        props.setAddToFolderPopup({
          ...props.addToFolderPopup,
          open: false,
        });
      });
  };

  return (
    <>
      {props.addToFolderPopup.open ? (
        <div className="modal">
          <div className="modal-content">
            <h1>Add to folder</h1>
            <p>
              Select a folder to add this set to. You can also create a new
              folder.
            </p>
            <div className="folderContainer">
              {props.addToFolderPopup.allFolders ? (
                props.addToFolderPopup.allFolders.map((el) => (
                  <section
                    style={{
                      boxShadow: props.addToFolderPopup.foldersChosen.includes(
                        el.folder_id
                      )
                        ? "0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)"
                        : "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
                    }}
                    className="card"
                  >
                    <Link
                      style={{ textDecoration: "none" }}
                      target="_blank"
                      rel="noopener noreferrer"
                      to={`/folder/${el.folder_id}`}
                      key={el.id}
                    >
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
                    </Link>
                    <center>
                      <button
                        onClick={() => props.selectItemFolder(el.folder_id)}
                      >
                        {props.addToFolderPopup.foldersChosen.includes(
                          el.folder_id
                        )
                          ? "Deselect"
                          : "Select"}
                      </button>
                    </center>
                  </section>
                ))
              ) : (
                <h1>No folders found</h1>
              )}
            </div>
          </div>
          <div className="modal-footer">
            {props.addToFolderPopup.foldersChosen.length ? (
              <button onClick={addToFolder}>Add to folder</button>
            ) : (
              ""
            )}
            <button
              className="close"
              onClick={() =>
                props.setAddToFolderPopup({
                  ...props.addToFolderPopup,
                  open: false,
                  foldersChosen: [],
                })
              }
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        ""
      )}
    </>
  );
};

export default AddToFolderModal;
