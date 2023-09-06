const express = require("express");
const router = express.Router();
const pool = require("../utils/dbConfig");
const { authorizeToken } = require("../utils/authMiddleware");
const { convert } = require("html-to-text");

router.put("/flashcard", authorizeToken, (req, res) => {
  if (!req.body.flashcard_id || !req.body.set_id || !req.body.flashcard_id) {
    res.status(409).send("Missing parameters");
  }
  pool.query(
    'SELECT confidence from "reviewsFlashcards" WHERE set_id=$1 AND flashcard_id=$2 AND user_id=$3',
    [req.body.set_id, req.body.flashcard_id, req.user_id],
    (err, results) => {
      if (err) {
        res.status(500);
        return false;
      }
      if (results.rows.length) {
        updatedConfidence = Number(results.rows[0].confidence);
        switch (req.body.confidence) {
          case 1:
            updatedConfidence -= 2;
            break;
          case 2:
            updatedConfidence--;
            break;
          case 4:
            updatedConfidence++;
            break;
          case 5:
            updatedConfidence += 2;
            break;
          default:
            break;
        }
        pool.query(
          'INSERT INTO "reviewsFlashcards" (set_id, flashcard_id, user_id,confidence) VALUES ($1, $2, $3,$4) ON CONFLICT (set_id, flashcard_id, user_id) DO UPDATE SET confidence = EXCLUDED.confidence',
          [
            Number(req.body.set_id),
            Number(req.body.flashcard_id),
            Number(req.user_id),
            updatedConfidence,
          ],
          (err) => {
            if (err) {
              res.status(500);
              return false;
            }
            res.status(200).end();
          }
        );
      } else {
        pool.query(
          'INSERT INTO "reviewsFlashcards" (set_id, flashcard_id, user_id,confidence) VALUES ($1, $2, $3,$4) ON CONFLICT (set_id, flashcard_id, user_id) DO UPDATE SET confidence = EXCLUDED.confidence',
          [
            Number(req.body.set_id),
            Number(req.body.flashcard_id),
            Number(req.user_id),
            req.body.confidence,
          ],
          (err) => {
            if (err) {
              res.status(500);
              return false;
            }
            res.status(200).end();
          }
        );
      }
    }
  );
});
router.patch("/flashcard", authorizeToken, (req, res) => {
  if (
    !req.body.set_id ||
    !req.body.flashcard_id ||
    !req.body.term ||
    !req.body.definition
  ) {
    res.status(409).send("Missing parameters");
  }
  if (convert(req.body.term).length > 100000) {
    res.status(409).send("Excessive size");
    return;
  }
  if (convert(req.body.definition).length > 100000) {
    res.status(409).send("Excessive size");
    return;
  }
  if (convert(req.body.term).length < 1) {
    res.status(409).send("Term is empty");
    return;
  }
  if (convert(req.body.definition).length < 1) {
    res.status(409).send("Definition is empty");
    return;
  }

  pool.query(
    "SELECT user_id FROM sets WHERE set_id=$1",
    [req.body.set_id],
    (err, results) => {
      if (err) {
        res.status(500);
        return false;
      }
      if (results.rows.length) {
        if (results.rows[0].user_id !== req.user_id) {
          res.status(403).send("Forbidden");
          return false;
        }
      }
    }
  );

  pool.query(
    "UPDATE flashcards SET term=$1, definition=$2 WHERE set_id=$3 AND flashcard_id=$4",
    [
      req.body.term,
      req.body.definition,
      req.body.set_id,
      req.body.flashcard_id,
    ],
    (err, results) => {
      if (err) {
        res.status(500).end();
        return false;
      }
      if (!results.rowCount) {
        res.status(404).end();
        return false;
      }
      res.status(200).end();
    }
  );
});
router.post("/flashcard/create", authorizeToken, (req, res) => {
  if (!req.body.set_id) {
    res.status(409).send("Missing parameters");
  }
  pool.query(
    "SELECT user_id FROM sets WHERE set_id=$1",
    [req.body.set_id],
    (err, results) => {
      if (err) {
        res.status(500);
        return false;
      }
      if (results.rows.length) {
        if (results.rows[0].user_id !== req.user_id) {
          res.status(403).send("Forbidden");
          return false;
        }
      }
    }
  );
  pool.query(
    "INSERT INTO flashcards (term, definition, set_id) VALUES ($1, $2, $3)",
    [req.body.term, req.body.definition, req.body.set_id],
    (err, results) => {
      if (err) {
        res.status(500).end();
        return false;
      }
      res.status(200).end();
    }
  );
});
router.post("/flashcard/delete", authorizeToken, (req, res) => {
  if (!req.body.flashcard_id || !req.body.set_id) {
    res.status(409).send("Missing parameters");
    return false;
  }
  pool.query(
    "SELECT user_id FROM sets WHERE set_id=$1",
    [req.body.set_id],
    (err, results) => {
      if (err) {
        res.status(500);
        return false;
      }
      if (results.rows.length) {
        if (results.rows[0].user_id !== req.user_id) {
          res.status(403).send("Forbidden");
          return false;
        }
        pool.query(
          'DELETE FROM "reviewsFlashcards" WHERE set_id=$1 AND flashcard_id=$2',
          [req.body.set_id, req.body.flashcard_id],
          (err, results) => {
            if (err) {
              console.log(err);
              res.status(500).end();
              return false;
            }
          }
        );
        res.status(200).end();
      }
    }
  );
  pool.query(
    'DELETE FROM "likedFlashcards" WHERE set_id=$1 AND flashcard_id=$2',
    [req.body.set_id, req.body.flashcard_id],
    (err, results) => {
      if (err) {
        console.log(err);
        res.status(500).end();
        return false;
      }
    }
  );
  pool.query(
    "DELETE FROM flashcards WHERE set_id=$1 AND flashcard_id=$2",
    [req.body.set_id, req.body.flashcard_id],
    (err, results) => {
      if (err) {
        console.log(err);
        res.status(500).end();
        return false;
      }
      res.status(200).end();
    }
  );
});
router.post("/flashcard/like", authorizeToken, (req, res) => {
  if (!req.body.flashcard_id || !req.body.set_id) {
    res.status(409).send("Missing parameters");
    return false;
  }
  pool.query(
    'INSERT INTO "likedFlashcards" (flashcard_id, user_id,set_id) VALUES ($1, $2,$3)',
    [req.body.flashcard_id, req.user_id, req.body.set_id],
    (err, results) => {
      if (err) {
        console.log(err);
        res.status(500).end();
        return false;
      }
      res.status(200).end();
    }
  );
});
router.post("/flashcard/dislike", authorizeToken, (req, res) => {
  if (!req.body.flashcard_id || !req.body.set_id) {
    res.status(409).send("Missing parameters");
    return false;
  }
  pool.query(
    'DELETE FROM "likedFlashcards" WHERE flashcard_id=$1 AND user_id=$2 AND set_id=$3',
    [req.body.flashcard_id, req.user_id, req.body.set_id],
    (err, results) => {
      if (err) {
        console.log(err);
        res.status(500).end();
        return false;
      }
      res.status(200).end();
    }
  );
});


module.exports = router;
