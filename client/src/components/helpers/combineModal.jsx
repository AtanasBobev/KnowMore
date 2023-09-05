import React from "react";
import { Link } from "react-router-dom";
import parse from "html-react-parser";
import { formatDistance } from "date-fns";
import translate from "../../utils/languagesHandler";
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
              {translate("label.combineSetsModal")}{" "}
              {combineModal.totalFlashcards} {translate("label.flashcardsIn")}{" "}
              {combineModal.setsChosen.length === 0
                ? translate("label.noSetsLowercase")
                : `${combineModal.setsChosen.length} ${
                    combineModal.setsChosen.length === 1
                      ? translate("label.set")
                      : translate("label.sets")
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
              .{" "}
              <p>
                {"  "+translate("label.Merge") + "  "}
                {"  "}
                {parse(set[0].name)}
                {"  "}
                {" " + translate("label.with")}:
              </p>
            </p>
            <div>
              <input
                style={{ width: "50ch", margin: ".5vmax" }}
                placeholder={translate("placeholder.searchSets")}
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
                <option value={true}>{translate("option.mySets")}</option>
                <option value={false}>
                  {translate("option.communitySets")}
                </option>
              </select>
              <button onClick={combinePopup}>
                {translate("button.Search")}
              </button>
            </div>

            <div id="allSetsContainer">
              {combineModal.allSets.length ? (
                combineModal.allSets.map((el) => (
                  <div
                    title={
                      Number(el.number_of_flashcards) + set.length > 2000
                        ? translate("error.tooManyFlashcardsCombined")
                        : translate("label.canCombine")
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
                      {translate("label.Created")}{" "}
                      {formatDistance(new Date(el.date_created), new Date(), {
                        addSufix: true,
                      })}{" "}
                      {translate("label.ago")}
                    </h3>
                    <center>
                      {Number(el.number_of_flashcards) + set.length > 1 ? (
                        ""
                      ) : (
                        <button onClick={() => selectItem(el.set_id)}>
                          {combineModal.setsChosen.includes(el.set_id)
                            ? translate("button.Deselect")
                            : translate("button.Select")}
                        </button>
                      )}
                    </center>
                  </div>
                ))
              ) : (
                <p>{translate("label.noSetsFound")}</p>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button onClick={combineSets}>
              {translate("button.combineSets")}
            </button>
            {combineModal.setsChosen.length ? (
              <button
                onClick={() =>
                  setCombineModal((prevModal) => ({
                    ...prevModal,
                    setsChosen: [],
                  }))
                }
              >
                {translate("button.clearSelection")}
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

export default combineModal;
