import { useState, useEffect, useRef } from "preact/hooks";
import { ToastContainer, toast } from "react-toastify";
import { useParams } from "react-router-dom";
import parse from "html-react-parser";
import measureDistance from "../../utils/measureDifference";
import axiosInstance from "../../utils/axiosConfig";
import "react-toastify/dist/ReactToastify.css";
import "../../styles/study.css";
import translate from "../../utils/languagesHandler";
import {
  getSet,
  getConfidenceLevel,
  updateSetReview,
  shuffle,
  updateCard,
} from "../../utils/reviewMethods";
import axios from "axios";

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
  const [userPreferences, setUserPreferences] = useState({
    minimumFlashcardAppears: 1,
    maximumFlashcardAppears: 9999,
    promptWith: "auto",
  });
  useEffect(() => {
    axiosInstance.get("/preferences/user").then((res) => {
      setUserPreferences(res.data);
    });
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
    if (flashcards[randomIndex] && flashcards[randomIndex].rounds <= 0 && flashcards[randomIndex].seen >= userPreferences.minimumFlashcardAppears && flashcards[randomIndex].seen <= userPreferences.maximumFlashcardAppears) {
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
    if (userPreferences.promptWith === "term") {
    setTerm(temporaryFlashcards[random].term);
    setDefinition(temporaryFlashcards[random].definition);
    } else if(userPreferences.promptWith === "definition") {
      setTerm(temporaryFlashcards[random].definition);
      setDefinition(temporaryFlashcards[random].term);
    } else if(userPreferences.promptWith === "auto") {
      if(temporaryFlashcards[random].term.length > temporaryFlashcards[random].definition.length) {
        setTerm(temporaryFlashcards[random].term);
        setDefinition(temporaryFlashcards[random].definition);
      } else {
        setTerm(temporaryFlashcards[random].definition);
        setDefinition(temporaryFlashcards[random].term);
      }
    }else {
      if(Math.random() > 0.5) {
        setTerm(temporaryFlashcards[random].term);
        setDefinition(temporaryFlashcards[random].definition);
      } else {
        setTerm(temporaryFlashcards[random].definition);
        setDefinition(temporaryFlashcards[random].term);
      }
    }
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
    toast("success.doneWithSet");
    setTerm("success.doneWithSet");
    setDefinition("success.doneWithSet");
  };
  const newQuestion = (forceTrue = false) => {
    if (gameOver) return;
    if (!flashcards[randomIndex]) {
      Generate();
      return;
    }
    if (forceTrue) {
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
      ) == 1 ||
      forceTrue
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
        `${translate("label.writeCorrectAnswer")} ${sanitizeHTML(
          flashcards[randomIndex].term
        )}`, {autoClose: 5000}
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
            <p>{translate("label.Term")}:</p>
            <input
              id="answer"
              type="text"
              ref={inputRef}
              onKeyDown={handleKeyDown}
            />
            <section id="buttonGroup">
              {!rightAnswerExpected ? (
                <button onClick={() => newQuestion()}>
                  {translate("button.IdontKnow")}
                </button>
              ) : (
                ""
              )}
              {rightAnswerExpected ? (
                <button onClick={() => newQuestion(true)}>
                  {translate("button.IWasRight")}
                </button>
              ) : (
                <button onClick={() => Generate()}>
                  {translate("button.Skip")}
                </button>
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
