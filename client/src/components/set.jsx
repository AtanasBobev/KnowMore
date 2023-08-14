import React from "react";
import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "preact/hooks";
import { ToastContainer, toast } from "react-toastify";
import parse from "html-react-parser";
import { convert as convertToText } from "html-to-text";
import { Link } from "react-router-dom";
import axiosInstance from "../utils/axiosConfig";
import ReactQuill from "react-quill";
import { Quill } from "react-quill";
import "../styles/set.css";
import token from "../utils/jwtParser";
import ImageResize from "quill-image-resize-module-react";
import ImageCompress from "quill-image-compress";
//DEPRECATED
//import sortByTerm from "../utils/arraySort";
import ImportModal from "./helpers/importModal";
import speak from "../utils/speechSynthesis";
import katex from "katex";
import "katex/dist/katex.min.css";
import { useNavigate } from "react-router-dom";
import CombineModal from "./helpers/combineModal";
window.katex = katex;

const ViewSet = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [set, setSet] = useState([]);
  const [setStats, setSetStats] = useState([]);
  const [flashcardStats, setFlashcardStats] = useState([]);
  const flashcardsContainerRef = useRef(null);
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

  const [cardEdit, setCardEdit] = useState({
    edit: false,
    cardBeingEdited: null,
    term: "",
    definition: "",
  });
  const [isSetValid, setIsSetValid] = useState(true);

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
      })
      .catch((error) => {
        setSet([]);
        setIsSetValid(false);
        return false;
      });

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
  };

  useEffect(() => {
    getSet();
  }, []);

  const Share = () => {
    try {
      let url = window.location.href;
      window.navigator.clipboard.writeText(url);
      toast.success("Share link has been copied to clipboard");
    } catch (err) {
      toast.error(
        "It seems like the share functionality doesn't work on your browser"
      );
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
      toast.error("Flashcard not found!");
      return;
    }
    console.log(convertToText(cardEdit.definition).length);

    if (convertToText(cardEdit.term).length < 2) {
      toast("Term cannot be so empty!");
      return;
    }
    if (convertToText(cardEdit.definition).length < 2) {
      toast("Definition cannot be so empty!");
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
            toast.success("Flashcard edits saved!");
          })
          .catch((err) => {
            toast.error(
              "Oopsie, something went wrong. We think it is a sign for you to go outside and get some fresh air while we fix this."
            );
          });
      }
    } else {
      toast.info("No changes made.");
    }
    setCardEdit({ edit: false, cardBeingEdited: null });
  };
  const addFlashcard = () => {
    if (cardEdit.edit && cardEdit.cardBeingEdited) {
      if (
        !confirm(
          "Are you sure you want to discard your changes and add a new flashcard? You are currently editing a flashcard."
        )
      ) {
        return false;
      }
      if (set[set.length - 1].new) {
        setSet((prev) =>
          prev.filter((el) => el.flashcard_id !== cardEdit.cardBeingEdited)
        );
      }
      setCardEdit({ edit: false });
    }

    const newFlashcard = {
      term: "",
      definition: "",
      flashcard_id: set.length,
      new: true,
    };
    setSet((prev) => [...prev, newFlashcard]);
    setCardEdit({
      edit: true,
      cardBeingEdited: set.length,
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
      if (
        !confirm(
          "Are you sure you want to discard your changes and like this set? You are currently editing a flashcard."
        )
      ) {
        return false;
      }
      if (set[set.length - 1].new) {
        setSet((prev) =>
          prev.filter((el) => el.flashcard_id !== cardEdit.cardBeingEdited)
        );
      }
      setCardEdit({ edit: false });
    }

    //define liked based on the flashcard_id you are recieving. You need to check which flashcard_id is being liked

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
          toast.error(
            "Oopsie, something went wrong. We think it is a sign for you to go outside and get some fresh air while we fix this."
          );
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
          toast.error(
            "Oopsie, something went wrong. We think it is a sign for you to go outside and get some fresh air while we fix this."
          );
        });
    }
  };

  const copySet = () => {
    axiosInstance
      .post("/set/copy", { set_id: set[0].set_id })
      .then((res) => {
        toast.success("We copied your set. You are current browsing the copy");
        navigate(`/set/${res.data.set_id}`);
      })
      .catch((err) => {
        toast.error(
          "Oopsie, something went wrong. We think it is a sign for you to go outside and get some fresh air while we fix this."
        );
      });
  };

  const likeSet = () => {
    if (!token.user_id) {
      toast("You need to be logged in to like a set.");
      return;
    }
    axiosInstance.post("/set/like", { set_id: set[0].set_id }).then((res) => {
      setLikedSet(true);
      toast.success("Set liked! You can view it in your profile.");
    });
  };
  const dislikeSet = () => {
    if (!token.user_id) {
      toast("You need to be logged in to dislike a set.");
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
      toast.error(
        "You cannot combine these sets because the total number of flashcards exceeds 2000."
      );
      return;
    }
    axiosInstance
      .post("/sets/combine", {
        sets: combineModal.setsChosen,
        set_id: set[0].set_id,
      })
      .then((res) => {
        toast.success("Sets combined! Navigating to your new set!");
        setCombineModal((prevModal) => ({
          ...prevModal,
          open: false,
        }));
        setTimeout(() => {
          navigate(`/set/${res.data.set_id}`);
        }, 1000);
      })
      .catch((err) => {
        toast.error(
          "Oopsie, something went wrong. We think it is a sign for you to go outside and get some fresh air while we fix this."
        );
      });
  };
  const combinePopup = () => {
    axiosInstance
      .post(`/sets/all/`, {
        query: combineModal.query,
        onlyPersonalSets: combineModal.onlyPersonalSets,
      })
      .then((res) => {
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
    if (!token.user_id) {
      toast("You need to be logged in to export a set.");
      return;
    }
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

        toast.success("Set exported as .csv! Check your downloads folder.");
      })
      .catch((err) => {
        toast.error(
          "Oopsie, something went wrong. We think it is a sign for you to go outside and get some fresh air while we fix this."
        );
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
  useEffect(() => {
    if (set.length && cardEdit.edit && cardEdit.cardBeingEdited) {
      const container = flashcardsContainerRef.current;
      container.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [set]);

  return (
    <>
      <CombineModal
        combineModal={combineModal}
        setCombineModal={setCombineModal}
        combineSets={combineSets}
        combinePopup={combinePopup}
        selectItem={selectItem}
        set={set}
      />
      {!isSetValid ? (
        <h1 id="infoText">
          Our trusty🐕 tried to find this set but couldn't! Check your link! 🙂
        </h1>
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
          <h1>{set.length ? convertToText(set[0].name) : "Loading..."}</h1>
          <h2 style={{color:"white"}}>
            {set.length ? convertToText(set[0].description) : "Loading..."}
          </h2>
          <p className="category">
            {" "}
            {set.length
              ? set[0].category
                ? set[0].category
                : "No category"
              : ""}
          </p>
          {set.length ? (
            <div className="buttonGroup">
              <Link
                style={{ textDecoration: "none" }}
                to={`/study/${set[0].set_id}`}
              >
                <button>Study</button>
              </Link>
              <button className="disabled">Play</button>
              <Link
                style={{ textDecoration: "none" }}
                to={`/review/${set[0].set_id}`}
              >
                <button>Review</button>
              </Link>

              {likedSet ? (
                <button onClick={dislikeSet}>Dislike</button>
              ) : (
                <button onClick={likeSet}>Like</button>
              )}
              {set.length && token.user_id == set[0].user_id ? (
                <button onClick={addFlashcard}>Add flashcards</button>
              ) : (
                ""
              )}
              <button
                style={{ border: moreOpen ? "5px solid white" : "" }}
                onClick={() => setMoreOpen((prev) => !prev)}
              >
                {moreOpen ? "Less" : "More"}
              </button>

              {moreOpen ? (
                <>
                  <Link
                    style={{ textDecoration: "none" }}
                    to={`/review/${set[0].set_id}`}
                  >
                    <button>Add to folder</button>
                  </Link>
                  {set.length && token.user_id == set[0].user_id ? (
                    <button onClick={() => navigate(`/edit/${id}`)}>
                      Edit
                    </button>
                  ) : (
                    ""
                  )}
                  <button onClick={combinePopup}>Combine</button>
                  {set.length && token.user_id == set[0].user_id ? (
                    <button onClick={copySet}>Copy</button>
                  ) : (
                    ""
                  )}

                  <button onClick={Share}>Share</button>

                  <button onClick={exportSet}>Export</button>
                  <button
                    onClick={() => {
                      if (
                        !confirm("Are you sure you want to delete this set?")
                      ) {
                        return false;
                      }
                      axiosInstance
                        .post(`/set/delete`, {
                          set_id: set[0].set_id,
                        })
                        .then((response) => {
                          toast.success("Set deleted! Navigating...");
                          setTimeout(() => {
                            navigate(`/sets`);
                          }, 1000);
                        })
                        .catch((err) => {
                          toast.error(
                            "Oopsie, something went wrong. We think it is a sign for you to go outside and get some fresh air while we fix this."
                          );
                        });
                    }}
                  >
                    Delete
                  </button>
                </>
              ) : (
                ""
              )}
            </div>
          ) : (
            ""
          )}

          <p>Created by {set.length ? set[0].username : "Loading..."} </p>
        </div>
        {setStats.length && flashcardStats.length ? (
          <div id="statisticsBox">
            Great job! You've already gone through this set {setStats.length}{" "}
            times. You have covered{" "}
            {flashcardStats.length == set.length
              ? "all flashcards."
              : flashcardStats.length +
                " out of " +
                set.length +
                " flashcards."}{" "}
            The flashcard that you know the best is{" "}
            {convertToText(flashcardStats[flashcardStats.length - 1].term)}{" "}
            while the one you're the least familiar with is{" "}
            {convertToText(flashcardStats[0].term)}.{" "}
          </div>
        ) : (
          ""
        )}
        <div id="leadboards"></div>
        <div className="cardContainer">
          {set.length
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
                      placeholder={"Term"}
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
                      <button onClick={() => like(el.flashcard_id)}>
                        {el.liked ? "❤️‍🔥" : "❤️"}
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
                            if (
                              !confirm(
                                "Are you sure you want to discard your changes?"
                              )
                            ) {
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
                            confirm(
                              "Are you sure you want to delete this flashcard?"
                            ) &&
                            axiosInstance
                              .post(`/flashcard/delete`, {
                                flashcard_id: el.flashcard_id,
                                set_id: set[0].set_id,
                              })
                              .then((response) => {
                                toast.success("Flashcard deleted!");
                                setCardEdit({ edit: false });
                                setSet((prev) =>
                                  prev.filter(
                                    (el) =>
                                      el.flashcard_id !==
                                      cardEdit.cardBeingEdited
                                  )
                                );
                                if (!Number(set.length)) {
                                  toast(
                                    "Hmm, it seems there are no flashcards in this set. Click Add!"
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
            : "Loading..."}
        </div>
      </section>
    </>
  );
};

export default ViewSet;
