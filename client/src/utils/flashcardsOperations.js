import { translate } from "../utils/languagesHandler.js";



const handleFlashcardDelete = (index, setFlashcards, toast) => {
  setFlashcards((prev) =>
    prev.filter((flashcard) => Number(flashcard.flashcard_id) !== index)
  );

  toast(translate("success.flashcardDeleted"));
};

const handleTermChange = (el, value, flashcards, setFlashcards, toast) => {
  if (value.length > 1e6) {
    toast(translate("error.flashcardTooBig"));
    return;
  }
  const index = flashcards.findIndex(
    (flashcard) => flashcard.flashcard_id === el
  );
  const updatedFlashcards = [...flashcards];
  updatedFlashcards[index].term = value;
  setFlashcards(updatedFlashcards);
};
const handleDefinitionChange = (
  el,
  value,
  flashcards,
  setFlashcards,
  toast
) => {
  if (value.length > 1e6) {
    toast(translate("error.flashcardTooBig"));
    return;
  }
  const index = flashcards.findIndex(
    (flashcard) => flashcard.flashcard_id === el
  );
  const updatedFlashcards = [...flashcards];
  updatedFlashcards[index].definition = value;
  setFlashcards(updatedFlashcards);
};
const handleFlip = (index, flashcards, setFlashcards) => {
  const updatedFlashcards = [...flashcards];
  const flashcardIndex = updatedFlashcards.findIndex(
    (flashcard) => flashcard.flashcard_id === index
  );
  updatedFlashcards[flashcardIndex] = {
    ...updatedFlashcards[flashcardIndex],
    term: updatedFlashcards[flashcardIndex].definition,
    definition: updatedFlashcards[flashcardIndex].term,
  };
  setFlashcards(updatedFlashcards);
};
const handleFlipAll = (
  flashcards,
  setFlashcards,
  setFlipped,
  flipped,
  toast
) => {
  const updatedFlashcards = flashcards.map((flashcard) => ({
    term: flashcard.definition,
    definition: flashcard.term,
  }));
  setFlashcards(updatedFlashcards);
  setFlipped(!flipped);
  toast(translate("success.flippedAll"));
};
const handleAddFlashcard = (
  flashcardsContainerRef,
  setFlashcards,
  flashcards
) => {
  const container = flashcardsContainerRef.current.lastChild;
  const newFlashcard = {
    term: "",
    definition: "",
    flashcard_id: Math.random(),
  };
  setFlashcards((prev) => [...prev, newFlashcard]);
  setTimeout(() => {
    if (flashcardsContainerRef.current && flashcards.length > 1) {
      container.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, 200);
};
const handleImportSet = (
  importModal,
  setImportModal,
  toast,
  flashcards,
  setFlashcards
) => {
  const { importText, importChar, importChar2 } = importModal;
  if (!importText || !importChar) {
    toast(translate("error.importSet"));
    return;
  }

  let flashcardsToAdd;
  if (importChar2 === "/n" || importChar2 === " ") {
    flashcardsToAdd = importText.split("\n"); // Split on new lines
  } else {
    flashcardsToAdd = importText.split(importChar2);
  }
  const updatedFlashcards = [...flashcards];

  flashcardsToAdd.forEach((flashcard, i) => {
    const [term, definition] = flashcard.split(importChar);
    updatedFlashcards.push({ term, definition, flashcard_id: Math.random() });
  });

  setFlashcards(updatedFlashcards);
  setImportModal({ open: false });

  toast(`${tranlate("label.Imported")} ${flashcardsToAdd.length} ${translate("label.flashcards")}`);
};
const handleCopyToClipboard = (index, flashcards, toast) => {
  //index is the flashcard_id
  const targetFlashcard = flashcards.find(
    (flashcard) => flashcard.flashcard_id === index
  );

  const def = new DOMParser().parseFromString(
    targetFlashcard.term,
    "text/html"
  );
  const termText = def.body.textContent;
  const term = new DOMParser().parseFromString(
    targetFlashcard.definition,
    "text/html"
  );
  const defText = term.body.textContent;
  navigator.clipboard.writeText(termText + " - " + defText);
  toast("Term and definition copied to clipboard!");
};
const handlePushUp = (el, setFlashcards, flashcards) => {
  const index = flashcards.findIndex(
    (flashcard) => flashcard.flashcard_id === el
  );

  if (index > 0) {
    const updatedFlashcards = [...flashcards];
    const temp = updatedFlashcards[index];
    updatedFlashcards[index] = updatedFlashcards[index - 1];
    updatedFlashcards[index - 1] = temp;

    // Swap flashcard IDs
    [updatedFlashcards[index].flashcard_id, updatedFlashcards[index - 1].flashcard_id] =
      [updatedFlashcards[index - 1].flashcard_id, updatedFlashcards[index].flashcard_id];

    setFlashcards(updatedFlashcards);
  }
};

const handlePushDown = (el, setFlashcards, flashcards) => {
  const index = flashcards.findIndex(
    (flashcard) => flashcard.flashcard_id === el
  );

  if (index < flashcards.length - 1) {
    const updatedFlashcards = [...flashcards];
    const temp = updatedFlashcards[index];
    updatedFlashcards[index] = updatedFlashcards[index + 1];
    updatedFlashcards[index + 1] = temp;

    // Swap flashcard IDs
    [updatedFlashcards[index].flashcard_id, updatedFlashcards[index + 1].flashcard_id] =
      [updatedFlashcards[index + 1].flashcard_id, updatedFlashcards[index].flashcard_id];

    setFlashcards(updatedFlashcards);
  }
};

const handleCopyFlashcard = (el, flashcards, setFlashcards, toast) => {
  const index = flashcards.findIndex(
    (flashcard) => flashcard.flashcard_id === el
  );
  const updatedFlashcards = [...flashcards];
  const newFlashcard = {
    term: updatedFlashcards[index].term,
    definition: updatedFlashcards[index].definition,
  };
  updatedFlashcards.splice(index + 1, 0, newFlashcard);
  setFlashcards(updatedFlashcards);
};

const handleSearchTermOnline = (el, flashcards, setFlashcards, toast) => {
  const index = flashcards.findIndex(
    (flashcard) => flashcard.flashcard_id === el
  );
  const targetFlashcard = flashcards[index];
  const term = targetFlashcard.term;
  const parsedString = new DOMParser().parseFromString(term, "text/html");
  const termText = parsedString.body.textContent;
  if (!termText.length) {
    toast("Please enter a term to search for");
    return;
  }
  const url = `https://www.google.com/search?q=${translate("label.define")}:${termText}`;
  window.open(url, "_blank");
};
export {
  handleFlashcardDelete, //handle flashcard add
  handleTermChange,
  handleDefinitionChange,
  handleFlipAll,
  handleAddFlashcard,
  handleFlip,
  handleImportSet,
  handleCopyToClipboard,
  handlePushUp,
  handlePushDown,
  handleCopyFlashcard,
  handleSearchTermOnline,
};
