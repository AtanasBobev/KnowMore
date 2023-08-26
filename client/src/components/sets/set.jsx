import React from "react";
import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "preact/hooks";
import { ToastContainer, toast } from "react-toastify";
import parse from "html-react-parser";
import { convert as convertToText } from "html-to-text";
import { Link } from "react-router-dom";
import axiosInstance from "../../utils/axiosConfig";
import ReactQuill from "react-quill";
import { Quill } from "react-quill";
import "../../styles/set.css";
import token from "../../utils/jwtParser";
import ImageResize from "quill-image-resize-module-react";
import ImageCompress from "quill-image-compress";
import SelectLiked from "../helpers/selectLiked";
import SelectRefineSet from "../helpers/selectRefineSet";
//DEPRECATED
//import sortByTerm from "../utils/arraySort";
import ImportModal from "../helpers/importModal";
import speak from "../../utils/speechSynthesis";
import katex from "katex";
import "katex/dist/katex.min.css";
import { useNavigate } from "react-router-dom";
import CombineModal from "../helpers/combineModal";
import AddToFolderModal from "../helpers/addToFolderModal";
import translate from "../../utils/languagesHandler";
window.katex = katex;

const ViewSet = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  //FOR DEV PURPOSES
  const [bugTract, setBugTrack] = useState();

  const [set, setSet] = useState([]);
  const [tempSets, setTempSets] = useState([]);
  const [setStats, setSetStats] = useState([]);
  const flashcardsContainerRef = useRef(null);
  const [likedState, setLikedState] = useState("all");
  const [flashcardStats, setFlashcardStats] = useState([]);
  const [moreOpen, setMoreOpen] = useState(false);
  const [likedSet, setLikedSet] = useState(false);
  const [combineModal, setCombineModal] = useState({
    open: false,
    setsChosen: [],
    allSets: [],
    onlyPersonalSets: false,
    query: "",
    totalFlashcards: 0,
  });
  const [bugTrac2, setBugTrac2] = useState();

  const [cardEdit, setCardEdit] = useState({
    edit: false,
    cardBeingEdited: null,
    term: "",
    definition: "",
  });
  const [isSetValid, setIsSetValid] = useState(true);

  const [addToFolderPopup, setAddToFolderPopup] = useState({
    open: false,
    foldersChosen: [],
    allFolders: [],
    set_id: Number(id),
  });

  const [furtherRefinements, setFurtherRefinements] = useState("id");

  Quill.register("modules/imageResize", ImageResize);
  Quill.register("modules/imageCompress", ImageCompress);

  const getSet = async () => {
    if (
      id < 0 ||
      id % 1 !== 0 ||
      id === undefined ||
      id === null ||
      id == -Infinity ||
      id > 100000000
    ) {
      setSet([]);
      setIsSetValid(false);
      return false;
    }

    axiosInstance
      .get(`/set/${id}`)
      .then((response) => {
        setSet(response.data);
        setBugTrack(response.data);
      })
      .catch((error) => {
        setSet([]);
        setIsSetValid(false);
        return false;
      });
    if (token.user_id) {
      axiosInstance.get(`/statstics/personal/sets/${id}`).then((response) => {
        setSetStats(response.data);
      });

      axiosInstance
        .get(`/statstics/personal/flashcards/${id}`)
        .then((response) => {
          let tempArray = response.data;
          if (tempArray) {
            tempArray.sort((a, b) => {
              const confidenceA = Number(a.confidence);
              const confidenceB = Number(b.confidence);
              return confidenceA - confidenceB;
            });
            setFlashcardStats(response.data);
          }
        });

      axiosInstance.get(`/set/liked/${id}`).then((response) => {
        if (response.data) {
          setLikedSet(true);
        }
      });
    }
  };
  const sortFlashcards = () => {
    let sortedSet = [...set];
    console.log(furtherRefinements);
    if (furtherRefinements === "a-z") {
      sortedSet.sort((a, b) => {
        const termA = convertToText(a.term).toLowerCase();
        const termB = convertToText(b.term).toLowerCase();
        return termA.localeCompare(termB);
      });
    } else if (furtherRefinements === "z-a") {
      sortedSet.sort((a, b) => {
        const termA = convertToText(a.term).toLowerCase();
        const termB = convertToText(b.term).toLowerCase();
        return termB.localeCompare(termA);
      });
    } else if (furtherRefinements === "mostconfident") {
      sortedSet.sort((a, b) => Number(b.confidence) - Number(a.confidence));
    } else if (furtherRefinements === "leastconfident") {
      sortedSet.sort((a, b) => Number(a.confidence) - Number(b.confidence));
    } else if (furtherRefinements === "id") {
      sortedSet.sort((a, b) => Number(a.flashcard_id) - Number(b.flashcard_id));
    }
    setSet(sortedSet);
  };
  useEffect(() => {
    getSet();
  }, []);

  const Share = () => {
    try {
      let url = window.location.href;
      window.navigator.clipboard.writeText(url);
      toast.success(translate("success.sharedLinkCopied"));
    } catch (err) {
      toast.error(translate("error.generic"));
    }
  };

  const handleEdit = (flashcardId) => {
    const flashcardToEdit = set.find((el) => el.flashcard_id === flashcardId);

    if (flashcardToEdit) {
      setCardEdit({
        edit: true,
        cardBeingEdited: flashcardId,
        term: flashcardToEdit.term,
        definition: flashcardToEdit.definition,
      });
      setBugTrac2({
        edit: true,
        cardBeingEdited: flashcardId,
        term: flashcardToEdit.term,
        definition: flashcardToEdit.definition,
      });
    }
  };

  const handleChange = (content, type) => {
    setCardEdit((prev) => ({
      ...prev,
      [type]: content,
    }));
  };

  const handleSave = (flashcard_id) => {
    const flashcardToEdit = set.find((el) => el.flashcard_id === flashcard_id);

    if (!flashcardToEdit) {
      toast.error(translate("error.flashcardNotFound"));
      return;
    }

    if (convertToText(cardEdit.term).length < 2) {
      toast(translate("error.termTooShort"));
      return;
    }
    if (convertToText(cardEdit.definition).length < 2) {
      toast(translate("error.definitionTooShort"));
      return;
    }
    if (
      flashcardToEdit.term !== cardEdit.term ||
      flashcardToEdit.definition !== cardEdit.definition
    ) {
      setSet((prev) =>
        prev.map((el) => {
          if (el.flashcard_id === flashcard_id) {
            return {
              ...el,
              term: cardEdit.term,
              definition: cardEdit.definition,
            };
          } else {
            return el;
          }
        })
      );
      if (flashcardToEdit.new) {
        axiosInstance.post("/flashcard/create", {
          set_id: set[0].set_id,
          term: cardEdit.term,
          definition: cardEdit.definition,
        });
      } else {
        axiosInstance
          .patch("/flashcard", {
            flashcard_id,
            set_id: set[0].set_id,
            term: cardEdit.term,
            definition: cardEdit.definition,
          })
          .then((response) => {
            toast.success(translate("label.flashcardUpdated"));
          })
          .catch((err) => {
            toast.error(translate("error.generic"));
          });
      }
    } else {
      toast.info("No changes made.");
    }
    setCardEdit({ edit: false, cardBeingEdited: null });
  };
  const addFlashcard = () => {
    if (cardEdit.edit && cardEdit.cardBeingEdited) {
      if (!confirm(translate("prompt.discardChangesFlashcard"))) {
        return false;
      }
      if (set[set.length - 1].new) {
        setSet((prev) =>
          prev.filter((el) => el.flashcard_id !== cardEdit.cardBeingEdited)
        );
      }
      setCardEdit({ edit: false });
    }
    let newId = Number(set[set.length - 1].flashcard_id) + 2;
    const newFlashcard = {
      term: "",
      definition: "",
      flashcard_id: newId,
      new: true,
    };
    setSet((prev) => [...prev, newFlashcard]);
    setCardEdit({
      edit: true,
      cardBeingEdited: newId,
      term: "",
      definition: "",
    });
  };

  const like = (flashcard_id) => {
    if (!token.user_id) {
      toast("You need to be logged in to like a set.");
      return;
    }
    //check if the last flashcard is saved
    if (cardEdit.edit && cardEdit.cardBeingEdited) {
      if (!confirm(translate("promp.discardLike"))) {
        return false;
      }
      if (set[set.length - 1].new) {
        setSet((prev) =>
          prev.filter((el) => el.flashcard_id !== cardEdit.cardBeingEdited)
        );
      }
      setCardEdit({ edit: false });
    }

    const liked = set.filter((el) => el.flashcard_id === flashcard_id)[0].liked;
    if (liked) {
      axiosInstance
        .post("/flashcard/dislike", {
          flashcard_id: flashcard_id,
          set_id: set[0].set_id,
        })
        .then((response) => {
          setSet((prev) =>
            prev.map((el) => {
              if (el.flashcard_id === flashcard_id) {
                console.log(el);
                return {
                  ...el,
                  liked: false,
                };
              } else {
                return el;
              }
            })
          );
        })
        .catch((err) => {
          toast.error(translate("error.generic"));
        });
    } else {
      axiosInstance
        .post("/flashcard/like", {
          flashcard_id: flashcard_id,
          set_id: set[0].set_id,
        })
        .then((response) => {
          setSet((prev) =>
            prev.map((el) => {
              if (el.flashcard_id === flashcard_id) {
                console.log(el);
                return {
                  ...el,
                  liked: true,
                };
              } else {
                return el;
              }
            })
          );
        })
        .catch((err) => {
          toast.error(translate("error.generic"));
        });
    }
  };

  const copySet = () => {
    axiosInstance
      .post("/set/copy", { set_id: set[0].set_id })
      .then((res) => {
        toast.success(translate("label.setCopiedCopy"));
        navigate(`/set/${res.data.set_id}`);
      })
      .catch((err) => {
        toast.error(translate("error.generic"));
      });
  };

  const likeSet = () => {
    if (!token.user_id) {
      toast(translate("error.notLoggedIn"));
      return;
    }
    axiosInstance.post("/set/like", { set_id: set[0].set_id }).then((res) => {
      setLikedSet(true);
      toast.success(translate("label.setLiked"));
    });
  };
  const dislikeSet = () => {
    if (!token.user_id) {
      toast(translate("error.notLoggedIn"));
      return;
    }
    axiosInstance
      .post("/set/dislike", { set_id: set[0].set_id })
      .then((res) => {
        setLikedSet(false);
      });
  };
  const combineSets = () => {
    if (combineModal.totalFlashcards + set.length > 2000) {
      toast.error(translate("error.cannotCombineTooManyFlashcards"));
      return;
    }
    axiosInstance
      .post("/sets/combine", {
        sets: combineModal.setsChosen,
        set_id: set[0].set_id,
      })
      .then((res) => {
        toast.success(translate("success.setsCombined"));
        setCombineModal((prevModal) => ({
          ...prevModal,
          open: false,
        }));
        setTimeout(() => {
          navigate(`/set/${res.data.set_id}`);
        }, 1000);
      })
      .catch((err) => {
        toast.error(translate("error.generic"));
      });
  };
  const combinePopup = () => {
    axiosInstance
      .post(`/sets/all/`, {
        query: combineModal.query,
        onlyPersonalSets: combineModal.onlyPersonalSets,
      })
      .then((res) => {
        res.data = res.data.filter((el) => el.set_id !== set[0].set_id);
        setCombineModal((prevModal) => ({
          ...prevModal,
          open: true,
          allSets: res.data,
        }));
      });
  };
  const countRemainingFlashcards = () => {
    let totalFlashcards = 0;
    combineModal.setsChosen.forEach((el) => {
      const setToAdd = combineModal.allSets.find((set) => set.set_id === el);
      totalFlashcards += Number(setToAdd.flashcard_count);
    });
    setCombineModal((prevModal) => ({
      ...prevModal,
      totalFlashcards: totalFlashcards,
    }));
  };
  const exportSet = () => {
    axiosInstance
      .get(`/set/export/${set[0].set_id}`)
      .then((res) => {
        const json = res.data;
        const fields = Object.keys(json[0]);
        const replacer = function (key, value) {
          return value === null ? "" : value;
        };
        let csv = json.map(function (row) {
          return fields

            .map(function (fieldName) {
              return JSON.stringify(row[fieldName], replacer);
            })
            .join(",");
        });
        csv.unshift(fields.join(",")); // add header column
        csv = csv.join("\r\n");

        //save the .csv file
        const element = document.createElement("a");
        const file = new Blob([csv], {
          type: "text/csv",
        });
        element.href = URL.createObjectURL(file);
        element.download = `${convertToText(set[0].name)}.csv`;
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();

        toast.success(translate("success.exportedSet"));
      })
      .catch((err) => {
        toast.error(translate("error.generic"));
      });
  };

  useEffect(() => {
    countRemainingFlashcards();
  }, [combineModal.setsChosen]);
  const selectItem = (e) => {
    if (combineModal.setsChosen.includes(e)) {
      setCombineModal((prev) => {
        return {
          ...prev,
          setsChosen: prev.setsChosen.filter((el) => el !== e),
          flashcard_count: prev.flashcard_count - e.flashcard_count,
        };
      });
    } else {
      setCombineModal((prev) => {
        return {
          ...prev,
          setsChosen: [...prev.setsChosen, e],
          flashcard_count: prev.flashcard_count + e.flashcard_count,
        };
      });
    }
  };
  const selectItemFolder = (id) => {
    if (addToFolderPopup.foldersChosen.includes(id)) {
      setAddToFolderPopup((prev) => {
        return {
          ...prev,
          foldersChosen: prev.foldersChosen.filter((el) => el !== id),
        };
      });
    } else {
      setAddToFolderPopup((prev) => {
        return {
          ...prev,
          foldersChosen: [...prev.foldersChosen, id],
        };
      });
    }
  };
  const getFolders = () => {
    axiosInstance
      .post("/folders/user")
      .then((res) => {
        setAddToFolderPopup((prev) => ({
          ...prev,
          allFolders: res.data,
        }));
      })
      .catch((err) => {
        toast.error("Ooops, something went wrong");
      });
  };
  useEffect(() => {
    setTempSets(set);
    if (likedState === "liked") {
      setSet((prev) => prev.filter((el) => el.liked));
    } else if (likedState === "all") {
      setSet(tempSets);
    }
  }, [likedState]);

  useEffect(() => {
    sortFlashcards();
  }, [furtherRefinements]);

  useEffect(() => {
    if (token.user_id) {
      getFolders();
    }
  }, []);

  useEffect(() => {
    if (set.length && cardEdit.edit && cardEdit.cardBeingEdited) {
      const container = flashcardsContainerRef.current;
      container.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [set]);
  useEffect(() => {
    sortFlashcards();
  }, [set.length]);
  return (
    <>
      <AddToFolderModal
        addToFolderPopup={addToFolderPopup}
        setAddToFolderPopup={setAddToFolderPopup}
        selectItemFolder={selectItemFolder}
        set={set}
        toast={toast}
      />
      <CombineModal
        combineModal={combineModal}
        setCombineModal={setCombineModal}
        combineSets={combineSets}
        combinePopup={combinePopup}
        selectItem={selectItem}
        set={set}
      />
      {!isSetValid ? (
        <h1 id="infoText">{translate("label.noSetFound")}</h1>
      ) : (
        ""
      )}
      <section
        ref={flashcardsContainerRef}
        style={{ display: !isSetValid && "none" }}
      >
        <ToastContainer
          position="bottom-right"
          hideProgressBar={true}
          autoClose={3000}
          theme="colored"
          closeButton={false}
          closeOnClick
        />
        <div id="mainBar">
          <h1>
            {set?.[0]
              ? convertToText(set[0].name)
              : tempSets.length > set.length
              ? convertToText(tempSets[0].name)
              : "Loading..."}
          </h1>
          <h2 style={{ color: "white" }}>
            {set?.[0]
              ? convertToText(set[0].description)
              : tempSets.length > set.length
              ? convertToText(tempSets[0].description)
              : "Loading..."}
          </h2>
          <p className="category">
            {set?.[0] && set[0].category
              ? set[0].category
              : tempSets.length > set.length
              ? convertToText(tempSets[0].category)
              : "No category"}
          </p>
          {set.length && !set[0].flashcard_id ? (
            <div>
              <button onClick={() => navigate(`/set/edit/${id}`)}>Edit</button>

              <button
                onClick={() => {
                  if (!confirm(translate("prompt.deleteSet"))) {
                    return false;
                  }
                  axiosInstance
                    .post(`/set/delete`, {
                      set_id: set[0].set_id,
                    })
                    .then((response) => {
                      toast.success(translate("success.setDeleted"));
                      setTimeout(() => {
                        navigate(`/sets`);
                      }, 1000);
                    })
                    .catch((err) => {
                      toast.error(translate("error.generic"));
                    });
                }}
              >
                Delete
              </button>
            </div>
          ) : (
            ""
          )}
          {set.length && set[0].flashcard_id ? (
            <div className="buttonGroup">
              <Link
                style={{ textDecoration: "none" }}
                to={`/study/${set[0].set_id}`}
              >
                <button>{translate("button.Study")}</button>
              </Link>
              <Link
                style={{ textDecoration: "none" }}
                to={`/review/${set[0].set_id}`}
              >
                <button>{translate("button.Review")}</button>
              </Link>

              {likedSet ? (
                <button onClick={dislikeSet}>
                  {translate("button.Dislike")}
                </button>
              ) : (
                <button onClick={likeSet}>{translate("button.Like")}</button>
              )}
              {set.length && token.user_id == set[0].user_id ? (
                <button onClick={addFlashcard}>
                  {translate("button.addFlashcard")}
                </button>
              ) : (
                ""
              )}
              <button
                style={{ border: moreOpen ? "5px solid white" : "" }}
                onClick={() => setMoreOpen((prev) => !prev)}
              >
                {moreOpen ? translate("button.Less") : translate("button.More")}
              </button>

              {moreOpen ? (
                <>
                  {set.length && token.user_id ? (
                    <button
                      onClick={() =>
                        setAddToFolderPopup((prev) => ({
                          ...prev,
                          open: true,
                        }))
                      }
                    >
                      {translate("button.addToFolder")}
                    </button>
                  ) : (
                    ""
                  )}
                  {set.length && token.user_id == set[0].user_id ? (
                    <button onClick={() => navigate(`/set/edit/${id}`)}>
                      {translate("button.Edit")}
                    </button>
                  ) : (
                    ""
                  )}

                  {set.length && token.user_id == set[0].user_id ? (
                    <>
                      {" "}
                      <button onClick={copySet}>
                        {translate("button.Copy")}
                      </button>
                      <button onClick={combinePopup}>
                        {translate("button.Combine")}
                      </button>
                    </>
                  ) : (
                    ""
                  )}

                  <button onClick={Share}>{translate("button.Share")}</button>

                  <button onClick={exportSet}>
                    {" "}
                    {translate("button.Export")}
                  </button>
                  {set.length && token.user_id == set[0].user_id ? (
                    <button
                      onClick={() => {
                        if (!confirm(translate("prompt.deleteSet"))) {
                          return false;
                        }
                        axiosInstance
                          .post(`/set/delete`, {
                            set_id: set[0].set_id,
                          })
                          .then((response) => {
                            toast.success(translate("success.setDeleted"));
                            setTimeout(() => {
                              navigate(`/sets`);
                            }, 1000);
                          })
                          .catch((err) => {
                            toast.error(translate("error.generic"));
                          });
                      }}
                    >
                      {translate("button.Delete")}
                    </button>
                  ) : (
                    ""
                  )}
                </>
              ) : (
                ""
              )}
            </div>
          ) : (
            ""
          )}

          <p>
            {translate("label.createdBy")}{" "}
            {set.length ? set[0].username : "Loading..."}{" "}
          </p>
        </div>
        {setStats.length && flashcardStats.length ? (
          <div id="statisticsBox">
            {translate("label.goneThroughtThisSet")} {setStats.length}{" "}
            {translate("label.timesYouHaveCovered")}
            {flashcardStats.length == set.length
              ? translate("label.allFlashcardsLowercase")
              : flashcardStats.length +
                translate("label.outOf") +
                set.length +
                translate("label.flashcards")}{" "}
            {translate("label.knownBestFlashcard")}{" "}
            {convertToText(flashcardStats[flashcardStats.length - 1].term)}{" "}
            {translate("label.leastFamiliarWith")}{" "}
            {convertToText(flashcardStats[0].term)}.{" "}
          </div>
        ) : (
          ""
        )}
        <section id="btnSetFilters">
          <SelectLiked
            initialState={likedState}
            setLikedState={setLikedState}
          />
          <SelectRefineSet
            initialState={furtherRefinements}
            setFurtherRefinements={setFurtherRefinements}
          />
        </section>
        <div className="cardContainer">
          {set.length && set[0].flashcard_id
            ? set.map((el) => (
                <div
                  className="cardModern"
                  style={{
                    width:
                      cardEdit.edit &&
                      cardEdit.cardBeingEdited == el.flashcard_id
                        ? "90vw"
                        : "70vw",
                  }}
                  key={el.flashcard_id}
                >
                  {!cardEdit.edit ||
                  cardEdit.cardBeingEdited !== el.flashcard_id ? (
                    <div
                      style={{ cursor: "pointer" }}
                      onClick={() => speak(convertToText(el.term))}
                    >
                      {parse(el.term)}
                    </div>
                  ) : (
                    <ReactQuill
                      value={cardEdit.term}
                      className="editQuill"
                      onChange={(content) => handleChange(content, "term")}
                      modules={{
                        formula: true,
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
                          ["formula"],
                          ["link"],
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
                  )}
                  {!cardEdit.edit ||
                  cardEdit.cardBeingEdited !== el.flashcard_id ? (
                    <div
                      style={{ cursor: "pointer" }}
                      onClick={() => speak(convertToText(el.definition))}
                    >
                      {parse(el.definition)}
                    </div>
                  ) : (
                    <ReactQuill
                      value={cardEdit.definition}
                      className="editQuill"
                      onChange={(content) =>
                        handleChange(content, "definition")
                      }
                      placeholder={"Definition"}
                      modules={{
                        imageCompress: {},
                        formula: true,
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
                          ["formula"],
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
                  )}
                  <div className="buttonGroupSmall">
                    {!cardEdit.edit ||
                    cardEdit.cardBeingEdited !== el.flashcard_id ? (
                      <button
                        style={{
                          filter: el.liked
                            ? "grayscale(0%)"
                            : "grayscale(100%)",
                        }}
                        onClick={() => like(el.flashcard_id)}
                      >
                        ❤️
                      </button>
                    ) : (
                      ""
                    )}
                    {cardEdit.edit &&
                    cardEdit.cardBeingEdited === el.flashcard_id ? (
                      <>
                        <button onClick={() => handleSave(el.flashcard_id)}>
                          ✅
                        </button>
                        <button
                          onClick={() => {
                            if (!confirm(translate("prompt.discardChanges"))) {
                              return false;
                            }
                            if (el.new) {
                              setSet((prev) =>
                                prev.filter(
                                  (el) =>
                                    el.flashcard_id !== cardEdit.cardBeingEdited
                                )
                              );
                            }
                            setCardEdit((prev) => ({
                              ...prev,
                              cardBeingEdited: false,
                            }));
                          }}
                        >
                          ❌
                        </button>
                        <button
                          onClick={() =>
                            confirm(translate("prompt.deleteFlashcard")) &&
                            axiosInstance
                              .post(`/flashcard/delete`, {
                                flashcard_id: el.flashcard_id,
                                set_id: set[0].set_id,
                              })
                              .then((response) => {
                                toast.success(
                                  translate("success.flashcardDeleted")
                                );
                                setCardEdit({ edit: false });
                                if (set.length > 1) {
                                  setSet((prev) =>
                                    prev.filter(
                                      (el) =>
                                        el.flashcard_id !==
                                        cardEdit.cardBeingEdited
                                    )
                                  );
                                } else {
                                  setSet((prev) => [
                                    {
                                      ...prev,
                                      flashcard_id: null,
                                      term: null,
                                      definition: null,
                                    },
                                  ]);
                                }
                                if (!Number(set.length)) {
                                  toast(
                                    translate("label.noFlashcardsInThiSet")
                                  );
                                }
                              })
                          }
                        >
                          🗑️
                        </button>
                      </>
                    ) : (
                      <button onClick={() => handleEdit(el.flashcard_id)}>
                        {token.user_id == el.user_id ? "✏️" : ""}
                      </button>
                    )}
                  </div>
                </div>
              ))
            : set.length
            ? translate("label.noFlashcardsInThiSet")
            : tempSets.length > set.length
            ? translate("label.noObjectFound")
            : ""}
        </div>
      </section>
    </>
  );
};

export default ViewSet;
