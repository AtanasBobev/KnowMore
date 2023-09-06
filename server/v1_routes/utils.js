const express = require("express");
const router = express.Router();
const pool = require("../utils/dbConfig");
const fs = require("fs");
const { authorizeToken } = require("../utils/authMiddleware");

router.get("/languages/:lang", (req, res) => {
  let lang = req.params.lang;
  //check if the selected language is supported, supported languages are in the translations folder
  let files = fs.readdirSync("./translations");
  let supportedLanguages = [];
  files.forEach((file) => {
    supportedLanguages.push(file.split(".")[1]);
  });
  if (!supportedLanguages.includes(lang)) {
    res.status(404).send("Not found");
    return false;
  }
  //get the language file
  let languageFile = fs.readFileSync(`./translations/translation.${lang}.json`);
  let languageFileParsed = JSON.parse(languageFile);
  res.status(200).send(languageFileParsed);
});
router.post("/export/all", authorizeToken, (req, res) => {
 //create a zip file with all the user's data
 pool.query(
    `SELECT * FROM users WHERE user_id = $1`,[req.user_id],
    (err, results) => {
      if (err) {
        console.log(err);
        res.status(500).send("Internal server error");
        return false;
      }
      if (!results.rows.length) {
        res.status(404).send("Not found");
        return false;
      }
      let user = results.rows[0];
      let data = {
        user: {
          username: user.username,
          email: user.email,
          verified: user.verified,
          created_at: user.created_at,
          age: user.age,
          gender: user.gender,
          registrationDate: user.date,
          defaultLanguage: user.language,
          profilePicture: user.profile_picture,
        },
        sets: [],
      };
      pool.query(
        `SELECT * FROM sets WHERE user_id = $1`,[req.user_id],
        (err, results) => {
          if (err) {
            console.log(err);
            res.status(500).send("Internal server error");
            return false;
          }
          if (results.rows.length) {
            results.rows.forEach((set) => {
              let setObj = {
                set_id: set.set_id,
                name: set.name,
                description: set.description,
                created_at: set.created_at,
                flashcards: [],
              };
              pool.query(
                `SELECT * FROM flashcards WHERE set_id = $1`,[set.set_id],
                (err, results) => {
                  if (err) {
                    console.log(err);
                    res.status(500).send("Internal server error");
                    return false;
                  }
                  if (results.rows.length) {
                    results.rows.forEach((flashcard) => {
                      setObj.flashcards.push({
                        flashcard_id: flashcard.flashcard_id,
                        term: flashcard.term,
                        definition: flashcard.definition,
                        created_at: flashcard.created_at,
                      });
                    });
                  }
                 pool.query("SELECT * FROM preference WHERE user_id = $1", [req.user_id], (err, results) => {
                    if (err) {
                      console.log(err);
                      res.status(500).send("Internal server error");
                      return false;
                    }
                    if (results.rows.length) {
                      data.preferences = results.rows[0];
                      data.sets.push(setObj);
                    }
                  });
                }
              );
            });
          }
          setTimeout(() => {
            res.status(200).send(data);
          }, 3000);
        }
      );
    }
  );
});
router.post("/languages/user/change", authorizeToken, (req, res) => {
  if (!req.body.language) {
    res.status(409).send("Missing parameters");
    return false;
  }
  let files = fs.readdirSync("./translations");
  let supportedLanguages = [];
  files.forEach((file) => {
    supportedLanguages.push(file.split(".")[1]);
  });
  if (!supportedLanguages.includes(req.body.language)) {
    res.status(404).send("Not found");
    return false;
  }
  pool.query(
    `UPDATE users SET language = $1 WHERE user_id = $2`,[req.body.language, req.user_id],
    (err, results) => {
      if (err) {
        console.log(err);
        res.status(500).send("Internal server error");
        return false;
      }
      res.status(200).end();
    }
  );
});
router.post("/preferences/change", authorizeToken, (req, res) => {
  if (!req.body.minimumFlashcardAppears || !req.body.maximumFlashcardAppears || !req.body.promptWith) {
    res.status(409).send("Missing parameters");
    return false;
  }
  if (req.body.minimumFlashcardAppears < 1 || req.body.minimumFlashcardAppears > 9999) {
    res.status(409).send("Invalid parameters");
    return false;
  }
  if (req.body.maximumFlashcardAppears < 1 || req.body.maximumFlashcardAppears > 9999) {
    res.status(409).send("Invalid parameters");
    return false;
  }
  if (req.body.minimumFlashcardAppears > req.body.maximumFlashcardAppears) {
    res.status(409).send("Invalid parameters");
    return false;
  }
  if (req.body.promptWith !== "auto" && req.body.promptWith !== "term" && req.body.promptWith !== "definition" && req.body.promptWith !== "both") {
    res.status(409).send("Invalid parameters");
    return false;
  }
  pool.query(
    `UPDATE preferences SET minimum_flashcard_appears = $1, maximum_flashcard_appears = $2, prompt_with = $3 WHERE user_id = $4`,[req.body.minimumFlashcardAppears, req.body.maximumFlashcardAppears, req.body.promptWith, req.user_id],
    (err, results) => {
      if (err) {
        console.log(err);
        res.status(500).send("Internal server error");
        return false;
      }
      res.status(200).end();
    }
  );
});
router.get("/preferences", authorizeToken, (req, res) => {
  pool.query(
    `SELECT minimum_flashcard_appears, maximum_flashcard_appears, prompt_with FROM preferences WHERE user_id = $1`,[req.user_id],
    (err, results) => {
      if (err) {
        console.log(err);
        res.status(500).send("Internal server error");
        return false;
      }
      if (!results.rows.length) {
        res.status(404).send("Not found");
        return false;
      }
      res.status(200).send(results.rows[0]);
    }
  );
});



module.exports = router;
