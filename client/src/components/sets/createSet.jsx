import { useState, useEffect, useRef } from "preact/hooks";
import { ToastContainer, toast } from "react-toastify";
import ReactQuill from "react-quill";
import { useNavigate } from "react-router-dom";
import ImageResize from "quill-image-resize-module-react";
import ImageCompress from "quill-image-compress";
import SelectOptions from "../helpers/selectOptions";
import { convert as convertToText } from "html-to-text";
import { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import "../../styles/create.css";
import "react-toastify/dist/ReactToastify.css";
import ImportModalComponent from "../helpers/importModal";
import axiosInstance from "../../utils/axiosConfig";
import translate from "../../utils/languagesHandler";
import {
  handleFlashcardDelete,
  handleTermChange,
  handleDefinitionChange,
  handleFlip,
  handleFlipAll,
  handleAddFlashcard,
  handleImportSet,
  handleCopyToClipboard,
  handlePushUp,
  handlePushDown,
  handleCopyFlashcard,
  handleSearchTermOnline,
} from "../../utils/flashcardsOperations";
import ImportModal from "../helpers/importModal";

const Create = () => {
  const [flashcards, setFlashcards] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [importModal, setImportModal] = useState({
    open: false,
    importText: "",
    importChar: "",
    importChar2: "",
  });
  const [category, setCategory] = useState("");
  const [flipped, setFlipped] = useState(false);
  const flashcardsContainerRef = useRef(null);
  const navigate = useNavigate();
  Quill.register("modules/imageResize", ImageResize);
  Quill.register("modules/imageCompress", ImageCompress);
  const submitHandler = (e) => {
    e.preventDefault();
    if (!navigator.onLine && false) {
      toast("You are offline! Please check your internet connection.");
      return;
    }
    let tempTitle = new DOMParser().parseFromString(title, "text/html");
    let tempDescription = new DOMParser().parseFromString(
      description,
      "text/html"
    );
    const flashcardsArray = flashcards.map((flashcard) => {
      const tempTerm = new DOMParser().parseFromString(
        flashcard.term,
        "text/html"
      );
      const tempDefinition = new DOMParser().parseFromString(
        flashcard.definition,
        "text/html"
      );
      return {
        term: tempTerm.body.innerHTML,
        definition: tempDefinition.body.innerHTML,
      };
    });
    if (tempTitle.body.innerText.length > 1e4) {
      toast(translate("error.titleTooLong"));
      return;
    }
    if (tempDescription.body.innerText.length > 1e4) {
      toast(translate("error.descriptionTooLong"));
      return;
    }
    if (tempTitle.body.innerText.length < 1) {
      toast(translate("error.titleTooShort"));
      return;
    }
    if (flashcardsArray.length > 20000) {
      toast(translate("error.tooManyFlashcards"));
      return;
    }
    if (flashcardsArray.length == 0) {
      toast(translate("error.atLeastOneFlashcards"));
      return;
    }
    //check if all flashcards are valid but don't spam with multiple messaes
    let validFlashcards = true;
    flashcardsArray.forEach((flashcard) => {
      if (convertToText(flashcard.term).length > 1e6) {
        validFlashcards = false;
        return;
      }
      if (convertToText(flashcard.definition).length > 1e6) {
        validFlashcards = false;
        return;
      }
      if (convertToText(flashcard.term).length < 1) {
        validFlashcards = false;
        return;
      }
      if (convertToText(flashcard.definition).length < 1) {
        validFlashcards = false;
        return;
      }
    });
    if (!validFlashcards) {
      toast(translate("error.invaildFlashcards"));
      return;
    }
    let cumulativeSize = 0;
    flashcardsArray.forEach((flashcard) => {
      cumulativeSize += flashcard.term.length;
      cumulativeSize += flashcard.definition.length;
    });
    if (cumulativeSize > 1e7) {
      toast(translate("error.flashcardExcessiveSize"));
      //check for the largest flashcards and display them
      let largestFlashcards = [];
      flashcardsArray.forEach((flashcard) => {
        if (flashcard.term.length > 1e6) {
          largestFlashcards.push(flashcard.term);
        }
        if (flashcard.definition.length > 1e6) {
          largestFlashcards.push(flashcard.definition);
        }
      });
      let largestFlashcard = largestFlashcards[0];
      largestFlashcards.forEach((flashcard) => {
        if (flashcard.length > largestFlashcard.length) {
          largestFlashcard = flashcard;
        }
      });
      toast(translate("label.largestFlashcard") + largestFlashcard.term);
      return;
    }

    const data = {
      title,
      description,
      flashcards,
      category,
    };
    axiosInstance
      .post("/sets", data)
      .then((res) => {
        setTitle("");
        setDescription("");
        setFlashcards([]);
        localStorage.removeItem("flashcards");
        localStorage.removeItem("title");
        localStorage.removeItem("description");
        toast(translate("label.successfulSetCreation"));
        setTimeout(() => {
          navigate(`/set/${res.data.set_id}`);
        }, 2000);
      })
      .catch((err) => {
        toast(translate("error.generic"));
      });
  };

  useEffect(() => {
    if (flashcardsContainerRef.current && flashcards.length > 1) {
      const container = flashcardsContainerRef.current;
      container.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [flashcards.length]);

  return (
    <div id="createContainer" ref={flashcardsContainerRef}>
      <ImportModalComponent
        importModal={importModal}
        setImportModal={setImportModal}
        handleImportSet={handleImportSet}
        toast={toast}
        flashcards={flashcards}
        setFlashcards={setFlashcards}
      />
      <div className="flashcard main">
        <h2 style={{ userSelect: "none" }}>{translate("label.setTitle")}</h2>

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
          {translate("label.setDescription")}{" "}
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
        <section id="btnGroup">
          <button onClick={() => setImportModal({ open: true })}>{translate("button.Import")}</button>
          {flashcards.length ? (
            <button
              onClick={() =>
                handleFlipAll(
                  flashcards,
                  setFlashcards,
                  setFlipped,
                  flipped,
                  toast
                )
              }
            >
              {flipped ? translate("button.flipBack") : translate("button.flipAll")}
            </button>
          ) : (
            ""
          )}
          <SelectOptions setCategory={setCategory} />
        </section>
      </div>
      {flashcards.map((flashcard, index) => (
        <section className="fadeIn" key={index}>
          <div id="flex">
            <div>
              <button
                className="flashcard__top-button"
                onClick={() =>
                  handleFlashcardDelete(
                    Number(flashcard.flashcard_id),
                    setFlashcards,
                    toast
                  )
                }
              >
                ❌
              </button>

              <button
                className="flashcard__top-button"
                onClick={() =>
                  handleCopyFlashcard(
                    flashcard.flashcard_id,
                    flashcards,
                    setFlashcards,
                    toast
                  )
                }
              >
                🧑‍🤝‍🧑
              </button>

              <button
                className="flashcard__top-button"
                onClick={() =>
                  handleSearchTermOnline(
                    flashcard.flashcard_id,
                    flashcards,
                    setFlashcards,
                    toast
                  )
                }
              >
                🌍
              </button>

              <button
                className="flashcard__top-button"
                onClick={() =>
                  handleCopyToClipboard(
                    flashcard.flashcard_id,
                    flashcards,
                    toast
                  )
                }
              >
                📋
              </button>
              {flashcards.length > 1 ? (
                <button
                  className="flashcard__top-button"
                  onClick={() =>
                    handlePushUp(
                      flashcard.flashcard_id,
                      setFlashcards,
                      flashcards
                    )
                  }
                >
                  👆
                </button>
              ) : (
                ""
              )}
              {flashcards.length > 1 ? (
                <button
                  className="flashcard__top-button"
                  onClick={() =>
                    handlePushDown(
                      flashcard.flashcard_id,
                      setFlashcards,
                      flashcards
                    )
                  }
                >
                  👇
                </button>
              ) : (
                ""
              )}
              <button
                onClick={() =>
                  handleFlip(flashcard.flashcard_id, flashcards, setFlashcards)
                }
                className="flashcard__top-button"
              >
                ↔️
              </button>
            </div>
            <h2>
              {translate("label.Flashcard")} {index + 1}/{flashcards.length}
            </h2>
          </div>
          <div className="flashcard">
            <h3>{translate("label.Term")}</h3>
            <ReactQuill
              value={flashcard.term}
              className="bg"
              onChange={(value) =>
                handleTermChange(
                  flashcard.flashcard_id,
                  value,
                  flashcards,
                  setFlashcards,
                  toast
                )
              }
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
                  ["link", "image", "video"],
                  ["clean"],
                ],
                clipboard: {
                  matchVisual: false,
                },
                imageResize: {
                  parchment: Quill.import("parchment"),
                  modules: ["Resize", "DisplaySize"],
                },
              }}
            />
            <h3>{translate("label.Definition")}</h3>
            <ReactQuill
              className="sm-s"
              value={flashcard.definition}
              onChange={(value) =>
                handleDefinitionChange(
                  flashcard.flashcard_id,
                  value,
                  flashcards,
                  setFlashcards,
                  toast
                )
              }
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
                  ["link", "image", "video"],
                  ["clean"],
                ],
                clipboard: {
                  matchVisual: false,
                },
                imageResize: {
                  parchment: Quill.import("parchment"),
                  modules: ["Resize", "DisplaySize"],
                },
              }}
            />
          </div>
        </section>
      ))}
      <button
        className="flashcard-button"
        onClick={() =>
          handleAddFlashcard(flashcardsContainerRef, setFlashcards, flashcards)
        }
      >
        ➕
      </button>
      {flashcards.length ? (
        <button onClick={submitHandler} id="done">
          ✅
        </button>
      ) : (
        ""
      )}

      <ToastContainer
        position="bottom-right"
        hideProgressBar={false}
        autoClose={3000}
        theme="colored"
        closeOnClick
      />
    </div>
  );
};

export default Create;
