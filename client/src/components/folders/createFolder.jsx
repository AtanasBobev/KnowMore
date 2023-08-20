import ReactQuill from "react-quill";
import { useState, useEffect, useRef } from "preact/hooks";
import ImageResize from "quill-image-resize-module-react";
import { Link } from "react-router-dom";
import ImageCompress from "quill-image-compress";
import { convert as convertToText } from "html-to-text";
import { formatDistance } from "date-fns";
import parse from "html-react-parser";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import SelectLimit from "../helpers/selectLimit";
import SelectOptions from "../helpers/selectOptions";
import { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import "../../styles/create.css";
import "react-toastify/dist/ReactToastify.css";
import "../../styles/allPages.css";
import "../../styles/folderCreate.css";
import axiosInstance from "../../utils/axiosConfig";
import translate from "../../utils/languagesHandler";

const CreateFolder = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [allSets, setAllSets] = useState([]);
  const [setsChosen, setSetsChosen] = useState([]);
  const [query, setQuery] = useState("");
  const [onlyPersonalSets, setOnlyPersonalSets] = useState(false);
  const [limit, setLimit] = useState(10);
  const [category, setCategory] = useState("");
  const [folderCategory, setFolderCategory] = useState("");
  Quill.register("modules/imageResize", ImageResize);
  Quill.register("modules/imageCompress", ImageCompress);

  const navigate = useNavigate();

  const getSets = async () => {
    axiosInstance
      .post(`/sets/all/`, {
        query: query,
        onlyPersonalSets,
        limit,
        category,
      })
      .then((res) => {
        setAllSets(res.data);
      });
  };
  const selectItem = (id) => {
    if (setsChosen.includes(id)) {
      setSetsChosen(setsChosen.filter((el) => el !== id));
    } else {
      setSetsChosen([...setsChosen, id]);
    }
  };
  const createFolder = async () => {
    if (setsChosen.length > 2000) {
      toast.error(translate("error.tooManySets"));
      return;
    }
    if (convertToText(title).length > 50) {
      toast.error(translate("error.titleTooLong"));
      return;
    }
    if (convertToText(description).length > 500) {
      toast.error(translate("error.descriptionTooLong"));
      return;
    }
    if (title.length < 5) {
      toast.error(translate("error.titleTooLong"));
      return;
    }
    if (description.length < 5) {
      toast.error(translate("error.descriptionTooShort"));
      return;
    }
    if (setsChosen.length < 1) {
      if (!confirm(translate("prompt.noSetsFolder"))) {
        return;
      }
    }
    axiosInstance
      .post("/folders/create/", {
        title: title,
        description: description,
        sets: setsChosen,
        category: folderCategory,
      })
      .then((res) => {
        toast.success(translate("success.folderCreated"));
        navigate(`/folder/${res.data.folder_id}`);
      })
      .catch((err) => {
        toast.error(translate("error.generic"));
      });
  };

  useEffect(() => {
    getSets();
  }, []);

  return (
    <section>
      <ToastContainer
        position="bottom-right"
        hideProgressBar={false}
        autoClose={3000}
        theme="colored"
        closeOnClick
      />
      <div id="createFolder">
        <div className="flashcard main center">
          <h2 style={{ userSelect: "none" }}>
            {translate("placeholder.folderTitle")}
          </h2>
          <ReactQuill
            className="bg-x"
            onChange={(value) => setTitle(value)}
            value={title}
            modules={{
              toolbar: [
                [{ header: "1" }, { header: "2" }, { font: [] }],
                [{ size: [] }],
                [
                  "bold",
                  "italic",
                  "underline",
                  "size",
                  "font",
                  "blockquote",
                  "color",
                  "strike",
                  "script",
                ],
                [
                  { list: "ordered" },
                  { list: "bullet" },
                  { indent: "-1" },
                  { indent: "+1" },
                ],
                ["link"],
                ["clean"],
              ],
              clipboard: {
                matchVisual: false,
              },
              imageCompress: {},
            }}
          />
          <h2 style={{ marginTop: "1vmax", userSelect: "none" }}>
            {translate("placeholder.folderDescription")}
          </h2>

          <ReactQuill
            className="sm"
            onChange={(value) => setDescription(value)}
            value={description}
            modules={{
              imageCompress: {},
              toolbar: [
                [{ header: "1" }, { header: "2" }, { font: [] }],
                [{ size: [] }],
                [
                  "bold",
                  "italic",
                  "underline",
                  "size",
                  "font",
                  "blockquote",
                  "color",
                  "strike",
                  "script",
                ],
                [
                  { list: "ordered" },
                  { list: "bullet" },
                  { indent: "-1" },
                  { indent: "+1" },
                ],
                ["link"],
                ["clean"],
              ],
              clipboard: {
                matchVisual: false,
              },
            }}
          />
          <div style={{ margin: "1vmax" }}>
            <SelectOptions setCategory={setFolderCategory} />
          </div>
          <div id="setsChosenContainer">
            <center>
              {" "}
              <p>{translate("label.addSomeSetsInFolder")}</p>
            </center>
            <div id="searchContainer">
              <center>
                {" "}
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  width="50ch"
                  placeholder={translate("placeholder.searchSets")}
                />
                <select onChange={(e) => setSetCombineModal(e.target.value)}>
                  <option value={true}>{translate("option.mySets")}</option>
                  <option value={false}>
                    {translate("option.communitySets")}
                  </option>
                </select>
                <SelectLimit setLimit={setLimit} />
                <SelectOptions setCategory={setCategory} />
                <button onClick={getSets}>{translate("button.Search")}</button>
              </center>
            </div>

            <div id="allSetsContainer">
              {allSets.length ? (
                allSets.map((el) => (
                  <div
                    className={"individualSet"}
                    style={{
                      maxWidth: "20vmax",
                      boxShadow: setsChosen.includes(el.set_id)
                        ? "0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)"
                        : "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
                    }}
                    value={el.set_id}
                  >
                    <Link
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "black", textDecoration: "none" }}
                      to={`/set/${el.set_id}`}
                    >
                      <h1>
                        {parse(el.name).length > 15
                          ? parse(el.name).slice(0, 15)
                          : parse(el.name)}
                      </h1>
                    </Link>
                    <h2>
                      {parse(el.description).length > 15
                        ? parse(el.name).slice(0, 15) + "..."
                        : parse(el.name)}
                    </h2>
                    <h3>
                      {el.flashcard_count} {translate("label.flashcards")}
                    </h3>
                    <h3>
                      Created{" "}
                      {formatDistance(new Date(el.date_created), new Date(), {
                        addSufix: true,
                      })}{" "}
                      ago
                    </h3>
                    <center>
                      <button onClick={() => selectItem(el.set_id)}>
                        {setsChosen.includes(el.set_id)
                          ? translate("button.Deselect")
                          : translate("button.Select")}
                      </button>
                    </center>
                  </div>
                ))
              ) : (
                <p>
                  We searched all galaxies but couldn't find a set like this 😢
                </p>
              )}
            </div>
            <center>
              {" "}
              <button
                style={{
                  margin: "1vmax",
                  boxShadow:
                    "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
                }}
                onClick={createFolder}
              >
                {translate("button.createFolder")}
                {setsChosen.length
                  ? `${translate("label.with")} ${setsChosen.length} ${translate("label.setS")}`
                  : translate("label.noSets")}
              </button>
            </center>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CreateFolder;
