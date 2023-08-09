import React from "react";

const ImportModal = props => {
  return (
    <>
      {props.importModal.open ? (
        <section id="importModal" className="modal">
          <div className="modal-content">
            <textarea
              onChange={(e) =>
                props.setImportModal((prevModal) => ({
                  ...prevModal,
                  importText: e.target.value,
                }))
              }
              placeholder="Copy paste your set here. For example: Term 1 - Definition 1, Term 2 - Definition 2, Term 3 - Definition 3 or any other syntax"
              id="importText"
            ></textarea>
            <p>Character between term and definition</p>
            <input
              onChange={(e) =>
                props.setImportModal((prevModal) => ({
                  ...prevModal,
                  importChar: e.target.value,
                }))
              }
              type="text"
              placeholder=" - "
              id="importChar"
            />
            <p>Character between cards. Use /n for a new line</p>
            <input
              onChange={(e) =>
                props.setImportModal((prevModal) => ({
                  ...prevModal,
                  importChar2: e.target.value,
                }))
              }
              type="text"
              placeholder=" , "
              id="importChar2"
            />
          </div>
          <div className="modal-footer">
            <button
              onClick={() =>
                props.handleImportSet(
                  props.importModal,
                  props.setImportModal,
                  props.toast,
                  props.flashcards,
                  props.setFlashcards
                )
              }
            >
              Import set
            </button>
            <button onClick={() => props.setImportModal({ open: false })}>
              Close
            </button>
          </div>
        </section>
      ) : (
        ""
      )}
    </>
  );
};

export default ImportModal;
