const express = require("express");
const router = express.Router();
const pool = require("../utils/dbConfig");
const { authorizeToken } = require("../utils/authMiddleware");


router.get("/statstics/personal/sets/:id", authorizeToken, (req, res) => {
  let id = req.params.id;
  pool.query(
    `SELECT date FROM "reviewsSets" WHERE user_id = $1 AND set_id=$2`,
    [req.user_id, id],
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send("Internal error occured");
        return false;
      }
      res.status(200).send(result.rows);
    }
  );
});
router.get(
  "/statstics/personal/flashcards/:id",
  authorizeToken,
  (req, res) => {
    let id = req.params.id;
    pool.query(
      `SELECT flashcards.flashcard_id, confidence, term
    FROM "reviewsFlashcards"
    JOIN flashcards ON flashcards.flashcard_id = "reviewsFlashcards".flashcard_id
    WHERE "reviewsFlashcards".user_id = $1 AND "reviewsFlashcards".set_id = $2`,
      [req.user_id, id],
      (err, result) => {
        if (err) {
          res.status(500).send("Internal error occured");
          return false;
        }
        res.status(200).send(result.rows);
      }
    );
  }
);

module.exports = router;
