import ReactQuill from "react-quill";
import { useState, useEffect, useRef } from "preact/hooks";
import ImageResize from "quill-image-resize-module-react";
import { Link } from "react-router-dom";
import ImageCompress from "quill-image-compress";
import { convert as convertToText } from "html-to-text";
import { formatDistance } from "date-fns";
import { useParams } from "react-router-dom";
import parse from "html-react-parser";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import SelectLimit from "./helpers/selectLimit";
import SelectOptions from "./helpers/selectOptions";
import { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import "../styles/create.css";
import "react-toastify/dist/ReactToastify.css";
import "../styles/allPages.css";
import "../styles/folderCreate.css";
import axiosInstance from "../utils/axiosConfig";

const EditFolder = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [allSets, setAllSets] = useState([]);
  const [setsChosen, setSetsChosen] = useState([]);
  const [originalData, setOriginalData] = useState({});
  const [query, setQuery] = useState("");
  const [onlyPersonalSets, setOnlyPersonalSets] = useState(false);
  const [limit, setLimit] = useState(10);
  const [category, setCategory] = useState("");
  const [folderCategory, setFolderCategory] = useState("");

  Quill.register("modules/imageResize", ImageResize);
  Quill.register("modules/imageCompress", ImageCompress);
  const { id } = useParams();
  const navigate = useNavigate();

  const getFolder = async () => {
    axiosInstance
      .get(`/folder/${id}`)
      .then((res) => {
        setTitle(res.data[0].title);
        setDescription(res.data[0].description);
        //get set ids from the array of res.data and set it to setsChosen
        let setIds = [];
        console.log(res.data);
        res.data.forEach((el) => {
          setIds.push(el.set_id);
        });
        setOriginalData({
          title: res.data[0].title,
          description: res.data[0].description,
          sets: setIds,
        });
        setSetsChosen(setIds);
      })
      
  };

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
  const updateFolder = async () => {
    if (setsChosen.length > 2000) {
      toast.error("More than 2000 sets are not allowed in a folder");
      return;
    }
    if (convertToText(title).length > 50) {
      toast.error("Title is too long");
      return;
    }
    if (convertToText(description).length > 500) {
      toast.error("Description is too long");
      return;
    }
    if (title.length < 5) {
      toast.error("Title is too short");
      return;
    }
    if (description.length < 5) {
      toast.error("Description is too short");
      return;
    }
    if (setsChosen.length < 1) {
      if (
        !confirm("Are you sure you want to update a folder without any sets?")
      ) {
        return;
      }
    }
    if (
      title === originalData.title &&
      description === originalData.description &&
      setsChosen.length === originalData.sets.length &&
      setsChosen.every((val, index) => val === originalData.sets[index]) &&
      folderCategory === originalData.folderCategory
    ) {
      toast.error("You didn't make any changes");
      return;
    }
    axiosInstance
      .post("/folder/update", {
        title,
        description,
        setsChosen,
        folder_id: id,
        folderCategory
      })
      .then((res) => {
        toast.success("Folder edited successfully");
        navigate(`/folder/${id}`);
      })
      .catch((err) => {
        toast.error("Something went wrong");
      });
  };

  useEffect(() => {
    getFolder();
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
          <h2 style={{ userSelect: "none" }}>Folder title</h2>
          <ReactQuill
            className="bg-x"
            onChange={(value) => setTitle(value)}
            placeholder="Economics 101"
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
            Folder description
          </h2>

          <ReactQuill
            className="sm"
            onChange={(value) => setDescription(value)}
            value={description}
            placeholder="Chapter 1 and 2 including the text questions assigned by the professor"
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
          <SelectOptions setCategory={setFolderCategory} initialState={originalData.category}/>
          <div id="setsChosenContainer">
            <center>
              {" "}
              <p>
                Your preselected sets are already here, you can always add new
              </p>
            </center>
            <div id="searchContainer">
              <center>
                {" "}
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  width="50ch"
                  placeholder="Search for sets"
                />
                <select onChange={(e) => setSetCombineModal(e.target.value)}>
                  <option value={true}>My sets</option>
                  <option value={false}>Community sets</option>
                </select>
                <SelectLimit setLimit={setLimit} />
                <SelectOptions setCategory={setCategory} />
                <button onClick={getSets}>Search</button>
              </center>
            </div>

            <div id="allSetsContainer">
              {allSets.length ? (
                allSets.map((el) => (
                  <div
                    className={"individualSet"}
                    style={{
                      maxWidth: "20vw",
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
                    <h3>{el.flashcard_count} flashcards</h3>
                    <h3>
                      Created{" "}
                      {formatDistance(new Date(el.date_created), new Date(), {
                        addSufix: true,
                      })}{" "}
                      ago
                    </h3>
                    <center>
                      <button onClick={() => selectItem(el.set_id)}>
                        {setsChosen.includes(el.set_id) ? "Deselect" : "Select"}
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
                onClick={updateFolder}
              >
                Update folder with
                {setsChosen.length
                  ? ` ${setsChosen.length} set${
                      setsChosen.length === 1 ? "" : "s"
                    }`
                  : " no sets"}
              </button>
            </center>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditFolder;
