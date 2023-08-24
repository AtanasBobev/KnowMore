import { useState, useEffect } from "preact/hooks";
import { toast, ToastContainer } from "react-toastify";
import {
  getSet,
  getConfidenceLevel,
  handleConfidence,
  shuffle,
} from "../../utils/reviewMethods";
import { useParams } from "react-router-dom";
import parse from "html-react-parser";
import translate from "../../utils/translate";
import "../../styles/review.css";

const Review = () => {
  const { id } = useParams();
  const [flashcards, setFlashcards] = useState([]);
  const [originalFlashcards, setOriginalFlashcards] = useState([]);
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipOpen, setFlipOpen] = useState(false);
  const [hideUI, setHideUI] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [sentUpdate, setSentUpdate] = useState(false);

  useEffect(() => {
    getSet(
      setTerm,
      setFlashcards,
      setOriginalFlashcards,
      setHideUI,
      setLoaded,
      id
    );
  }, []);
  useEffect(() => {
    if (!loaded) {
      return false;
    }
    if (flashcards.length) {
      setTerm(flashcards[currentIndex].term);
      setDefinition(flashcards[currentIndex].definition);
    } else {
      setTerm(translate("label.allFlashcardsReviewed"));
      setFlipOpen(false);
      setHideUI(true);
    }
  }, [flashcards, currentIndex, loaded]);

  useEffect(() => {
    if (loaded && hideUI) {
      let flashcardsTemp = originalFlashcards;
      flashcardsTemp.forEach((flashcard) => {
        flashcard.rounds = getConfidenceLevel(flashcard.confidence);
      });
      setHideUI(false);
      setCurrentIndex(0);
      setFlashcards(flashcardsTemp);
    }
  }, [flipOpen]);
  return (
    <section id="container">
      <ToastContainer
        position="bottom-right"
        hideProgressBar={true}
        autoClose={3000}
        theme="colored"
        closeOnClick
      />
      {loaded && flashcards.length ? (
        <div
          style={{
            width: (flashcards.length / originalFlashcards.length) * 100 + "vw",
          }}
          className="progressBar"
        ></div>
      ) : (
        ""
      )}
      <div id="cardContainer">
        <div id="term">{parse(term)}</div>
        {flipOpen && <div id="definition">{parse(definition)}</div>}
      </div>
      {!flipOpen && loaded ? (
        <button id="flipButton" onClick={() => setFlipOpen((prev) => !prev)}>
          {hideUI ? translate("button.Restart") : translate("button.Flip") }
        </button>
      ) : (
        ""
      )}
      {flipOpen && !hideUI ? (
        <div id="conditionalButtons">
          <center>
            <h4>{translate("label.howConfidentAreYou")}</h4>
          </center>
          <center>
            <button
              className="confidenceButton"
              onClick={() =>
                handleConfidence(
                  sentUpdate,
                  setSentUpdate,
                  1,
                  originalFlashcards,
                  setFlashcards,
                  flashcards,
                  currentIndex,
                  setCurrentIndex,
                  setFlipOpen,
                  toast
                )
              }
              style={{ borderBottom: "5px solid #ff0015" }}
            >
              1
            </button>
            <button
              className="confidenceButton"
              onClick={() =>
                handleConfidence(
                  sentUpdate,
                  setSentUpdate,
                  2,
                  originalFlashcards,
                  setFlashcards,
                  flashcards,
                  currentIndex,
                  setCurrentIndex,
                  setFlipOpen,
                  toast
                )
              }
              style={{ borderBottom: "5px solid #ff6d00" }}
            >
              2
            </button>
            <button
              className="confidenceButton"
              onClick={() =>
                handleConfidence(
                  sentUpdate,
                  setSentUpdate,
                  3,
                  originalFlashcards,
                  setFlashcards,
                  flashcards,
                  currentIndex,
                  setCurrentIndex,
                  setFlipOpen,
                  toast
                )
              }
              style={{ borderBottom: "5px solid #ffbb00" }}
            >
              3
            </button>
            <button
              className="confidenceButton"
              onClick={() =>
                handleConfidence(
                  sentUpdate,
                  setSentUpdate,
                  4,
                  originalFlashcards,
                  setFlashcards,
                  flashcards,
                  currentIndex,
                  setCurrentIndex,
                  setFlipOpen,
                  toast
                )
              }
              style={{ borderBottom: "5px solid #94fc03" }}
            >
              4
            </button>
            <button
              className="confidenceButton"
              onClick={() =>
                handleConfidence(
                  sentUpdate,
                  setSentUpdate,
                  5,
                  originalFlashcards,
                  setFlashcards,
                  flashcards,
                  currentIndex,
                  setCurrentIndex,
                  setFlipOpen,
                  toast
                )
              }
              style={{ borderBottom: "5px solid  #00ff9a" }}
            >
              5
            </button>
          </center>
        </div>
      ) : (
        ""
      )}
    </section>
  );
};

export default Review;
