import axiosInstance from "../utils/axiosConfig";
const getSet = async (
  setTerm,
  setFlashcards,
  setOriginalFlashcards,
  setHideUI = "",
  setLoaded,
  id
) => {
  if (
    id < 0 ||
    id % 1 !== 0 ||
    id === undefined ||
    id === null ||
    id == -Infinity ||
    id > 100000000
  ) {
    setTerm("Oopsie daisy, this set doesn't exist");
    if (typeof setHideUI == "function") {
      setHideUI(true);
    }
    setLoaded(false);
    return false;
  }

  axiosInstance
    .get(`/set/${id}`)
    .then((response) => {
      const flashcardsTemp = response.data;
      flashcardsTemp.forEach((flashcard) => {
        flashcard.rounds = getConfidenceLevel(flashcard.confidence);
      });
      setLoaded(true);
      setOriginalFlashcards(response.data);
      setFlashcards(shuffle(flashcardsTemp));
    })
    .catch(() => {
      setFlashcards([]);
      setLoaded(true);
      return false;
    });
};
const getConfidenceLevel = (confidenceLevel) => {
  if (confidenceLevel < 0) {
    return 10;
  } else if (confidenceLevel >= 0 && confidenceLevel < 10) {
    return 5;
  } else if (confidenceLevel >= 10 && confidenceLevel < 20) {
    return 4;
  } else {
    return 3;
  }
};
const updateCard = (confidence, flashcards, currentIndex) => {
  axiosInstance.put(`/flashcard`, {
    flashcard_id: flashcards[currentIndex].flashcard_id,
    confidence,
    set_id: flashcards[currentIndex].set_id,
  });
};
const updateSetReview = (setSentUpdate, originalFlashcards) => {
  axiosInstance
    .put("/sets", { set_id: originalFlashcards[0].set_id })
    .then(() => {
      setSentUpdate(true);
    })
    .catch(() => console.log("Generic error"));
};
const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};


const handleConfidence = (
  sentUpdate,
  setSentUpdate,
  confidence,
  originalFlashcards,
  setFlashcards,
  flashcards,
  currentIndex,
  setCurrentIndex,
  setFlipOpen,
  toast,
) => {
  if (!sentUpdate) {
    console.log("SENT")
    updateSetReview(setSentUpdate, originalFlashcards);
  }
  switch (confidence) {
    case 1:
      if (flashcards[currentIndex].confidence <= 0) {
        flashcards[currentIndex].confidence = 0;
        break;
      }
      flashcards[currentIndex].confidence =
        Number(flashcards[currentIndex].confidence) - 2;
      break;
    case 2:
      if (flashcards[currentIndex].confidence <= 0) {
        flashcards[currentIndex].confidence = 0;
        break;
      }
      flashcards[currentIndex].confidence =
        Number(flashcards[currentIndex].confidence) - 1;
      break;
    case 3:
      break;
    case 4:
      flashcards[currentIndex].confidence =
        Number(flashcards[currentIndex].confidence) + 1;
      break;
    case 5:
      flashcards[currentIndex].confidence =
        Number(flashcards[currentIndex].confidence) + 2;
      break;
    default:
      break;
  }
  setFlashcards((prevFlashcards) => {
    const updatedFlashcards = [...prevFlashcards];
    updatedFlashcards[currentIndex] = {
      ...updatedFlashcards[currentIndex],
      rounds: updatedFlashcards[currentIndex].rounds - 1,
    };
    return updatedFlashcards;
  });
  if (
    flashcards[currentIndex].rounds <= 0 &&
    Number(flashcards[currentIndex].confidence) > 10
  ) {
    const flashcardToRemove = flashcards[currentIndex];
    toast.success("You have mastered this flashcard!");

    setFlashcards((prev) =>
      prev.filter(
        (item) => item.flashcard_id !== flashcardToRemove.flashcard_id
      )
    );
    if (currentIndex + 1 === flashcards.length) {
      setCurrentIndex(0);
    }
  } else {
    if (currentIndex + 1 == flashcards.length) {
      setCurrentIndex(0);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }
  if (confidence !== 3) {
    updateCard(confidence, flashcards, currentIndex);
  }
  setFlipOpen(false);
};

export {
  getSet,
  getConfidenceLevel,
  updateCard,
  updateSetReview,
  handleConfidence,
  shuffle,
};
