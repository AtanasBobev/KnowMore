const express = require("express");
const router = express.Router();
const pool = require("../utils/dbConfig");
const validatePassword = require("../utils/passwordValidator");
const { generateAccessToken } = require("../utils/jwt");
const fs = require("fs");
const path = require("path");
const bcyrpt = require("bcrypt");
const { env } = require("process");
const { authorizeToken } = require("../utils/authMiddleware");

router.post("/register", async (req, res) => {
  if (
    req.body.username == null ||
    req.body.email == null ||
    req.body.password == null ||
    req.body.age == null ||
    req.body.gender == null
  ) {
    res.status(400).json({ message: "Please fill all the fields" });
    return;
  }
  if (req.body.username.length < 3 || req.body.username.length > 20) {
    res.status(400).json({
      message: "Username must be at least 3 characters long and at most 20",
    });
    return;
  }
  if (req.body.age < 1 || req.body.age > 99) {
    res.json({ message: "Age must be 1-99 years" }).status(400);
    return;
  }
  if (req.body.language == null) {
    req.body.language = "en-US";
  }
  //check if the language exists in the folder

  const languages = fs.readdirSync(path.join(__dirname, "../translations"));
  if (!languages.includes("translation." + req.body.language + ".json")) {
    res.status(400).json({ message: "Language not supported" });
    return;
  }

  const errors = validatePassword(req.body.password);

  if (errors.length) {
    res
      .status(400)
      .json({ message: "Passowrd doesn't abide by the standarts" });
    return;
  }

  const { username, email, password, age, gender } = req.body;

  password = await bcyrpt.hash(password, env.SALT_ROUNDS);

  pool.query(
    "INSERT INTO users (username, email, password, age, gender,date, language) VALUES ($1, $2, $3, $4, $5,$6, $7)",
    [
      username,
      email,
      password,
      age,
      gender,
      new Date().toISOString(),
      req.body.language,
    ],
    (err, result) => {
      if (err) {
        console.error("DBError: " + err.message);
        if (err.message.includes("username")) {
          res.status(400).json({ message: "Username already exists" });
        } else {
          res.status(400).json({ message: "Email already exists" });
        }
      } else {
        pool.query(
          "SELECT user_id FROM users WHERE username = $1",
          [username],
          (err, result) => {
            if (err) {
              console.error("DBError: " + err.message);
              res

                .json({
                  message:
                    "Database error! Hold on tight and try again in a few minutes.",
                })
                .status(500);
            } else {
              const user_id = result.rows[0].user_id;
              const token = generateAccessToken(username, email, true, user_id);
              res
                .status(200)
                .json({ token: token, language: req.body.language });
              res.end();
            }
          }
        );
      }
    }
  );
});

router.post("/login", (req, res) => {
  if (req.body.username == null || req.body.password == null) {
    res.status(400).json({ message: "Please fill all the fields" });
    return;
  }
  const { username, password } = req.body;
  password = bcyrpt.hash(password, env.SALT_ROUNDS);
  pool.query(
    "SELECT * FROM users WHERE username = $1 AND password = $2",
    [username, password],
    (err, result) => {
      if (err) {
        console.error("DBError: " + err.message);
        res
          .json({
            message:
              "Database error! Hold on tight and try again in a few minutes.",
          })
          .status(500);
      } else {
        if (result.rows.length) {
          pool.query(
            "SELECT user_id FROM users WHERE username = $1",
            [username],
            (err, result) => {
              if (err) {
                console.error("DBError: " + err.message);
                res
                  .json({
                    message:
                      "Database error! Hold on tight and try again in a few minutes",
                  })
                  .status(500);
              } else {
                const user_id = result.rows[0].user_id;

                const token = generateAccessToken(
                  result.rows[0].username,
                  result.rows[0].email,
                  true,
                  user_id
                );
                res.status(200).json({ token: token });
                res.end();
              }
            }
          );
        } else {
          res.status(400).json({ message: "Wrong username or password!" });
        }
      }
    }
  );
});

router.post("/delete/all", authorizeToken, (req, res) => {
  if (req.body.password == null) {
    res.status(400).json({ message: "Please fill all the fields" });
    return;
  }
  const { password } = req.body;
  password = bcyrpt.hash(password, env.SALT_ROUNDS);
  pool.query(
    "SELECT * FROM users WHERE username = $1 AND password = $2",
    [req.user, password],
    (err, result) => {
      if (err) {
        console.error("DBError: " + err.message);
        res
          .status(500)
          .send(
            "Database error! Hold on tight and try again in a few minutes."
          );
      } else {
        if (result.rows.length) {
          pool.query("DELETE FROM likedSets WHERE user_id = $1", [req.user_id]);
          pool.query("DELETE FROM likedFlashcards WHERE user_id = $1", [
            req.user_id,
          ]);

          pool.query(
            "SELECT set_id FROM sets WHERE user_id = $1",
            [req.user_id],
            (err, result) => {
              if (err) {
                console.error("DBError: " + err.message);
                res
                  .status(500)
                  .send(
                    "Database error! Hold on tight and try again in a few minutes."
                  );
              } else {
                for (let i = 0; i < result.rows.length; i++) {
                  pool.query(
                    "DELETE FROM flashcards WHERE set_id = $1",
                    [result.rows[i].set_id],
                    (err, result) => {
                      if (err) {
                        console.error("DBError: " + err.message);
                        res
                          .status(500)
                          .send(
                            "Database error! Hold on tight and try again in a few minutes."
                          );
                      }
                    }
                  );
                }
                pool.query(
                  "DELETE FROM sets WHERE user_id = $1",
                  [req.user_id],
                  (err, result) => {
                    if (err) {
                      console.error("DBError: " + err.message);
                      res
                        .status(500)
                        .send(
                          "Database error! Hold on tight and try again in a few minutes."
                        );
                    } else {
                      pool.query(
                        "DELETE FROM users WHERE user_id = $1",
                        [req.user_id],
                        (err, result) => {
                          if (err) {
                            console.error("DBError: " + err.message);
                            res
                              .status(500)
                              .send(
                                "Database error! Hold on tight and try again in a few minutes."
                              );
                          } else {
                            res.status(200).send("User deleted successfully");
                          }
                        }
                      );
                    }
                  }
                );
              }
            }
          );
        } else {
          res.status(400).json({ message: "Wrong password!" });
        }
      }
    }
  );
});
router.post("/delete/data", authorizeToken, (req, res) => {
  if (req.body.password == null) {
    res.status(400).json({ message: "Please fill all the fields" });
    return;
  }
  const { password } = req.body;
  password = bcyrpt.hash(password, env.SALT_ROUNDS);
  pool.query(
    "SELECT * FROM users WHERE username = $1 AND password = $2",
    [req.user, password],
    (err, result) => {
      if (err) {
        console.error("DBError: " + err.message);
        res
          .status(500)
          .send(
            "Database error! Hold on tight and try again in a few minutes."
          );
      } else {
        if (result.rows.length) {
          pool.query("DELETE FROM likedSets WHERE user_id = $1", [req.user_id]);
          pool.query("DELETE FROM likedFlashcards WHERE user_id = $1", [
            req.user_id,
          ]);

          pool.query(
            "SELECT set_id FROM sets WHERE user_id = $1",
            [req.user_id],
            (err, result) => {
              if (err) {
                console.error("DBError: " + err.message);
                res
                  .status(500)
                  .send(
                    "Database error! Hold on tight and try again in a few minutes."
                  );
              } else {
                for (let i = 0; i < result.rows.length; i++) {
                  pool.query(
                    "DELETE FROM flashcards WHERE set_id = $1",
                    [result.rows[i].set_id],
                    (err, result) => {
                      if (err) {
                        console.error("DBError: " + err.message);
                        res
                          .status(500)
                          .send(
                            "Database error! Hold on tight and try again in a few minutes."
                          );
                      }
                    }
                  );
                }
                pool.query(
                  "DELETE FROM sets WHERE user_id = $1",
                  [req.user_id],
                  (err, result) => {
                    if (err) {
                      console.error("DBError: " + err.message);
                      res
                        .status(500)
                        .send(
                          "Database error! Hold on tight and try again in a few minutes."
                        );
                    } else {
                      res.status(200).send("User deleted successfully");
                    }
                  }
                );
              }
            }
          );
        } else {
          res.status(400).json({ message: "Wrong password!" });
        }
      }
    }
  );
});

module.exports = router;
