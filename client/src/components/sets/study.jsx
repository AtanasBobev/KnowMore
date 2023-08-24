import { useState, useEffect, useRef } from "preact/hooks";
import { ToastContainer, toast } from "react-toastify";
import { useParams } from "react-router-dom";
import parse from "html-react-parser";
import measureDistance from "../../utils/measureDifference";
import axiosInstance from "../../utils/axiosConfig";
import "react-toastify/dist/ReactToastify.css";
import "../../styles/study.css";
import {
  getSet,
  getConfidenceLevel,
  updateSetReview,
  shuffle,
  updateCard,
} from "../../utils/reviewMethods";

const MultipleChoice = () => {
  const { id } = useParams();
  const inputRef = useRef(null);
  const [originalFlashcards, setOriginalFlashcards] = useState([]);
  const [sentUpdate, setSentUpdate] = useState([]);
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [flashcards, setFlashcards] = useState([]);
  const [randomIndex, setRandomIndex] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [rightAnswerExpected, setRightAnswerExpected] = useState(false);
  useEffect(() => {
    getSet(
      setTerm,
      setFlashcards,
      setOriginalFlashcards,
      "string",
      setLoaded,
      id
    );
  }, []);

  const Generate = () => {
    let random = 0,
      temporaryFlashcards = flashcards;
    random = Math.floor(Math.random() * flashcards.length);

    if (flashcards[randomIndex] && flashcards[randomIndex].rounds <= 0) {
      temporaryFlashcards = flashcards.filter(
        (flashcard) => flashcard.rounds > 0
      );
      toast(translate("success.doneWithFlashcard"));
      random = 0;
    }

    if (!temporaryFlashcards.length) {
      endStudy();
      return;
    }
    updateCard(flashcards[randomIndex].confidence, flashcards, randomIndex);

    setRandomIndex(random);
    setTerm(temporaryFlashcards[random].term);
    setDefinition(temporaryFlashcards[random].definition);
    setFlashcards(temporaryFlashcards);
    inputRef.current.value = "";
  };
  const sanitizeHTML = (htmlString) => {
    const tempElement = document.createElement("div");
    tempElement.innerHTML = htmlString;
    return tempElement.textContent || tempElement.innerText || "";
  };
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      newQuestion();
    }
  };
  const endStudy = () => {
    updateSetReview(setSentUpdate, originalFlashcards);
    setGameOver(true);
    toast("success.doneWithSet")
    setTerm("success.doneWithSet");
    setDefinition("success.doneWithSet");
  };
  const newQuestion = (forceTrue=false) => {
    if (gameOver) return;
    if (!flashcards[randomIndex]) {
      Generate();
      return;
    }
    if(forceTrue){
      setRightAnswerExpected(false);
      toast.success("Okay, okay, you are right!");
      setFlashcards((prev) =>
        prev.map((flashcard, index) => {
          if (index === randomIndex) {
            flashcard.confidence = Number(flashcard.confidence) + 2;
            flashcard.rounds = Number(flashcard.rounds) - 2;
          }
          return flashcard;
        })
      );
      Generate();
      return;
    }
    if (
      measureDistance(
        sanitizeHTML(flashcards[randomIndex].term)
          .toLowerCase()
          .replace(/ /g, ""),
        inputRef.current.value.toLowerCase().replace(/ /g, "")
      ) == 1 || forceTrue
    ) {
      setRightAnswerExpected(false);
      toast.success("success.Correct");
      setFlashcards((prev) =>
        prev.map((flashcard, index) => {
          if (index === randomIndex) {
            flashcard.confidence = Number(flashcard.confidence) + 1;
            flashcard.rounds = Number(flashcard.rounds) - 1;
          }
          return flashcard;
        })
      );
      Generate();
    } else {
      setRightAnswerExpected(true);
      toast.error(
        `${label.writeCorrectAnswer} ${sanitizeHTML(
          flashcards[randomIndex].term
        )}`
      );
      setFlashcards((prev) =>
        prev.map((flashcard, index) => {
          if (index === randomIndex) {
            flashcard.confidence = Number(flashcard.confidence) + 1;
            flashcard.rounds = Number(flashcard.rounds) + 1;
          }
          return flashcard;
        })
      );
    }
  };
  const restartStudy = () => {
    setGameOver(false);
    let tempFlashcards = originalFlashcards;
    tempFlashcards.forEach((flashcard) => {
      flashcard.rounds = getConfidenceLevel(Number(flashcard.confidence));
    });
    setFlashcards(shuffle(tempFlashcards));
    let random = Math.floor(Math.random() * originalFlashcards.length);
    setRandomIndex(random);
    setTerm(originalFlashcards[random].term);
    setDefinition(originalFlashcards[random].definition);
  };
  useEffect(() => {
    if (originalFlashcards.length) {
      Generate();
    }
  }, [originalFlashcards.length]);

  return (
    <div>
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
      <div className="quiz-container" id={gameOver && "restart"}>
        {!gameOver ? <p>{translate("label.Definition")}:</p> : ""}
        <p id="definition">{definition ? parse(definition) : ""}</p>
        <br />
        {!gameOver ? (
          <>
            {" "}
            <p>{label.Term}:</p>
            <input
              id="answer"
              type="text"
              ref={inputRef}
              onKeyDown={handleKeyDown}
            />
            <section id="buttonGroup">
              {!rightAnswerExpected ? (
                <button onClick={() => newQuestion()}>{translate("button.IdontKnow")}</button>
              ) : (
                ""
              )}
              {rightAnswerExpected ? (
                <button onClick={() => newQuestion(true)}>{translate("button.IWasRight")}</button>
              ) : (
                <button onClick={() => Generate()}>{translate("button.Skip")}</button>
              )}
              <button onClick={newQuestion}>✅</button>
            </section>
          </>
        ) : (
          <button id="restartBtn" onClick={restartStudy}>
            {translate("button.Restart")}
          </button>
        )}
      </div>
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

export default MultipleChoice;
