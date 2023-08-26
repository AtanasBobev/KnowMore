import React from "react";
import translate from "../../utils/languagesHandler";
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
              placeholder={translate("placeholder.importText")}
              id="importText"
            ></textarea>
            <p>{translate("label.characterBetween")}</p>
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
            <p>{translate("label.characterBetweenCards")}</p>
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
              {translate("button.importSet")}
            </button>
            <button onClick={() => props.setImportModal({ open: false })}>
              {translate("button.Close")}
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
