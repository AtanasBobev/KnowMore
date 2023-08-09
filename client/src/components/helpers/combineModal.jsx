import React from "react";
import { Link } from "react-router-dom";
import parse from "html-react-parser";
import { formatDistance } from "date-fns";

const combineModal = (props) => {
  const {
    combineModal,
    setCombineModal,
    combineSets,
    combinePopup,
    selectItem,
    set,
  } = props;
  return (
    <>
      {combineModal.open ? (
        <section className="modal">
          <div className="modal-content">
            <p>
              Combining sets allows you to merge multiple sets into one new set
              with a maximum of 2000 cards. You have currently selected{" "}
              {combineModal.totalFlashcards} flashcards in{" "}
              {combineModal.setsChosen.length === 0
                ? "no sets"
                : `${combineModal.setsChosen.length} ${
                    combineModal.setsChosen.length === 1 ? "set" : "sets"
                  }: `}
              {combineModal.setsChosen.length > 0 &&
                combineModal.setsChosen.map((setId, index) => (
                  <React.Fragment key={setId}>
                    {index > 0 && ", "}
                    <Link
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "black", textDecoration: "none" }}
                      to={`/set/${setId}`}
                    >
                      {parse(
                        combineModal.allSets.find((set) => set.set_id === setId)
                          .name + "  "
                      )}
                    </Link>
                  </React.Fragment>
                ))}
              . Merge {parse(set[0].name)} with:
            </p>
            <div>
              <input
                style={{ width: "50ch", margin: ".5vmax" }}
                placeholder="Search sets"
                onChange={(e) =>
                  setCombineModal((prevModal) => ({
                    ...prevModal,
                    query: e.target.value,
                  }))
                }
              />
              <select
                onChange={(e) =>
                  setCombineModal((prevModal) => ({
                    ...prevModal,
                    onlyPersonalSets: e.target.value,
                  }))
                }
              >
                <option value={true}>My sets</option>
                <option value={false}>Community sets</option>
              </select>
              <button onClick={combinePopup}>Search</button>
            </div>

            <div id="allSetsContainer">
              {combineModal.allSets.length ? (
                combineModal.allSets.map((el) => (
                  <div
                    title={
                      Number(el.number_of_flashcards) + set.length > 2000
                        ? "You can't combine this set because it has more than 2000 flashcards combined with your set"
                        : "You can add this set to your combined set"
                    }
                    className={"individualSet "}
                    style={{
                      boxShadow: combineModal.setsChosen.includes(el.set_id)
                        ? "0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)"
                        : "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
                    }}
                    value={el.set_id}
                  >
                    <Link
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "black", textDecoration: "none" }}
                      to={`/set/${el.set_id}`}
                    >
                      <h1>
                        {parse(el.name).length > 15
                          ? parse(el.name).slice(0, 15)
                          : parse(el.name)}
                      </h1>
                    </Link>
                    <h2>
                      {parse(el.description).length > 15
                        ? parse(el.name).slice(0, 15) + "..."
                        : parse(el.name)}
                    </h2>
                    <h3>{el.flashcard_count} flashcards</h3>
                    <h3>
                      Created{" "}
                      {formatDistance(new Date(el.date_created), new Date(), {
                        addSufix: true,
                      })}{" "}
                      ago
                    </h3>
                    <center>
                      {Number(el.number_of_flashcards) + set.length > 1 ? (
                        ""
                      ) : (
                        <button onClick={() => selectItem(el.set_id)}>
                          {combineModal.setsChosen.includes(el.set_id)
                            ? "Deselect"
                            : "Select"}
                        </button>
                      )}
                    </center>
                  </div>
                ))
              ) : (
                <p>
                  We searched all galaxies but couldn't find a set like this 😢
                </p>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button onClick={combineSets}>Combine sets</button>
            {combineModal.setsChosen.length ? (
              <button
                onClick={() =>
                  setCombineModal((prevModal) => ({
                    ...prevModal,
                    setsChosen: [],
                  }))
                }
              >
                Clear all selections
              </button>
            ) : (
              ""
            )}
            <button
              onClick={() =>
                setCombineModal((prevModal) => ({
                  ...prevModal,
                  open: false,
                }))
              }
            >
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

export default combineModal;
