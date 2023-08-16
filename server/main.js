const express = require("express");
const pool = require("./dbConfig");
const validatePassword = require("./passwordValidator");
const { authorizeToken } = require("./authMiddleware");
const bodyParser = require("body-parser");
const cors = require("cors");
const { convert } = require("html-to-text");
const { generateAccessToken } = require("./jwt");
const app = express();
const port = process.env.PORT || 5000;
app.use(
  bodyParser.urlencoded({
    limit: "5mb",
    parameterLimit: 100000,
    extended: false,
  })
);

app.use(
  bodyParser.json({
    limit: process.env.BODY_LIMIT || "5mb",
  })
);
app.use(cors());
app.use(express.json());
app.options("*", cors());

//Authentication routes

app.post("/v1/register", async (req, res) => {
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

  const errors = validatePassword(req.body.password);

  if (errors.length) {
    res
      .status(400)
      .json({ message: "Passowrd doesn't abide by the standarts" });
    return;
  }

  const { username, email, password, age, gender } = req.body;
  pool.query(
    "INSERT INTO users (username, email, password, age, gender,date) VALUES ($1, $2, $3, $4, $5,$6)",
    [username, email, password, age, gender, new Date().toISOString()],
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
              const token = generateAccessToken(
                username,
                email,
                false,
                user_id
              );
              res.status(200).json({ token: token });
              res.end();
            }
          }
        );
      }
    }
  );
});

app.post("/v1/login", (req, res) => {
  if (req.body.username == null || req.body.password == null) {
    res.status(400).json({ message: "Please fill all the fields" });
    return;
  }
  const { username, password } = req.body;
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
          //get user_id
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

//Flashcards routes
app.get("/v1/set/:id", authorizeToken, (req, res) => {
  const set_id = req.params.id;
  if (
    set_id < 0 ||
    set_id % 1 !== 0 ||
    set_id === undefined ||
    set_id === null ||
    set_id === NaN ||
    set_id === -Infinity ||
    set_id > 100000000
  ) {
    res.json({ message: "Invalid set id" }).status(400);
    return false;
  }
  pool.query(
    `SELECT 
    s.set_id, s.name, s.description, s.date_created, s.date_modified, s.category,
    f.term, f.definition, f.flashcard_id, u.username, rf.confidence, u.user_id,
    CASE WHEN lf.flashcard_id IS NOT NULL THEN true ELSE false END AS liked
  FROM sets s
  JOIN flashcards f ON s.set_id = f.set_id
  JOIN users u ON s.user_id = u.user_id
  LEFT JOIN "reviewsFlashcards" rf ON rf.set_id = s.set_id AND rf.flashcard_id = f.flashcard_id
  LEFT JOIN "likedFlashcards" lf ON u.user_id = lf.user_id AND f.flashcard_id = lf.flashcard_id
  WHERE s.set_id = $1`,
    [set_id],
    (err, result) => {
      if (err) {
        console.error("DBError: " + err.message);
        res.json({ message: "Error fetching flashcard set" }).status(500);
      } else {
        if (result.rows.length) {
          res.json(result.rows).status(200);
        } else {
          res.status(400).end();
        }
      }
    }
  );
});
app.patch("/v1/set", authorizeToken, (req, res) => {
  if (
    !req.body.set_id ||
    !req.body.title ||
    !req.body.description ||
    !req.body.flashcards
  ) {
    res.status(409).send("Missing parameters");
  }
  if (convert(req.body.title).length > 100000) {
    res.status(409).send("Excessive size");
    return;
  }
  if (convert(req.body.description).length > 100000) {
    res.status(409).send("Excessive size");
    return;
  }
  if (convert(req.body.title).length < 1) {
    res.status(409).send("Title is empty");
    return;
  }
  if (convert(req.body.description).length < 1) {
    res.status(409).send("Description is empty");
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
    "UPDATE sets SET name=$1, description=$2, date_modified=$3, category=$5 WHERE set_id=$4",
    [
      req.body.title,
      req.body.description,
      new Date().toISOString(),
      req.body.set_id,
      req.body.category,
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
  req.body.flashcards.forEach((flashcard) => {
    pool.query(
      "UPDATE flashcards SET term=$1, definition=$2 WHERE set_id=$3 AND flashcard_id=$4",
      [
        flashcard.term,
        flashcard.definition,
        req.body.set_id,
        flashcard.flashcard_id,
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
      }
    );
  });
  res.status(200).end();
});

app.get("/v1/sets/user", authorizeToken, (req, res) => {
  pool.query(
    "SELECT set_id, name, description, date_created, date_modified FROM sets WHERE user_id = $1 ORDER BY date_modified DESC",
    [req.user_id],
    (err, result) => {
      if (err) {
        console.error("DBError: " + err.message);
        res.status(500).json({ message: "Error fetching flashcard sets" });
      } else {
        res.json(result.rows).status(200);
      }
    }
  );
});

app.post("/v1/set/like", authorizeToken, (req, res) => {
  if (!req.body.set_id) {
    res.status(409).send("Missing parameters");
    return false;
  }
  pool.query(
    'INSERT INTO "likedSets" (set_id, user_id) VALUES ($1, $2)',
    [req.body.set_id, req.user_id],
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
app.post("/v1/set/dislike", authorizeToken, (req, res) => {
  if (!req.body.set_id) {
    res.status(409).send("Missing parameters");
    return false;
  }
  pool.query(
    'DELETE FROM "likedSets" WHERE set_id=$1 AND user_id=$2',
    [req.body.set_id, req.user_id],
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
app.get("/v1/set/liked/:id", authorizeToken, (req, res) => {
  if (!req.params.id) {
    res.status(409).send("Missing parameters");
    return false;
  }
  pool.query(
    'SELECT * FROM "likedSets" WHERE set_id=$1 AND user_id=$2',
    [req.params.id, req.user_id],
    (err, results) => {
      if (err) {
        console.log(err);
        res.status(500).end();
        return false;
      }
      if (results.rows.length) {
        res.status(200).send(true);
      } else {
        res.status(200).send(false);
      }
    }
  );
});
/*app.get("/v1/set/liked/:id", (req, res) => {
  //get the total numer of likes on a set
  if (!req.params.id) {
    res.status(409).send("Missing parameters");
    return false;
  }
  pool.query(
    'SELECT COUNT(*) FROM "likedSets" WHERE set_id=$1',
    [req.params.id],
    (err, results) => {
      if (err) {
        console.log(err);
        res.status(500).end();
        return false;
      }
      res.status(200).send(results.rows[0].count);
    }
  );
});
*/
app.post("/v1/sets/combine", authorizeToken, (req, res) => {
  //you are receiving an array of set ids in req.body.sets and a set_id in req.body.set_id. You have to create a new set that contains all the flashcards from the sets in req.body.sets and the set_id of the new set and return the id of the new set
  if (!req.body.sets || !req.body.set_id) {
    res.status(409).send("Missing parameters");
    return false;
  }
  let setsData = [];
  req.body.sets.forEach((set) => {
    //get the sets data and join all flashcards in the same set. The idea is in the end to have an array of flashcards that we can insert in the new set
    pool.query(
      `SELECT
        s.set_id, s.name, s.description, s.date_created, s.date_modified, u.username, u.user_id,
        f.term, f.definition, f.flashcard_id
      FROM sets s
      JOIN flashcards f ON s.set_id = f.set_id
      JOIN users u ON s.user_id = u.user_id
      WHERE s.set_id = $1`,
      [set],
      (err, result) => {
        if (err) {
          console.error("DBError: " + err.message);
          res.json({ message: "Error fetching flashcard sets" }).status(500);
        } else {
          if (result.rows.length) {
            setsData.push(result.rows);
            //check if all sets have been fetched
            if (setsData.length === req.body.sets.length) {
              newSet();
            }
          } else {
            res.status(400).end();
          }
        }
      }
    );
  });
  const newSet = () => {
    if (setsData.length > 2000) {
      res.status(400).json({ message: "Too many flashcards" });
      return false;
    }
    //create the new set, its name should be a combination of the names of the sets that are being combined. Use the sets array
    pool.query(
      "INSERT INTO sets (name, description, date_created, date_modified, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING set_id",
      [
        req.body.sets.join(", "),
        "Combined sets",
        new Date().toISOString(),
        new Date().toISOString(),
        req.user_id,
      ],
      (err, result) => {
        if (err) {
          console.error("DBError: " + err.message);
          res.status(500).json({ message: "Error creating flashcard set" });
          return false;
        }
        const set_id = result.rows[0].set_id;
        setsData.forEach((set) => {
          set.forEach((flashcard) => {
            pool.query(
              "INSERT INTO flashcards (term, definition, set_id) VALUES ($1, $2, $3)",
              [flashcard.term, flashcard.definition, set_id],
              (err, result) => {
                if (err) {
                  console.log(err);
                  pool.query("DELETE FROM sets WHERE set_id = $1", [set_id]);
                  return false;
                }
              }
            );
          });
        });
        res
          .status(200)
          .json({ message: "Flashcard set created successfully", set_id });
      }
    );
  };
});

app.post("/v1/sets/all/", (req, res) => {
  let limit = 100;
  if (req.body.limit) {
    limit = req.query.limit;
  }
  let category = "";
  if (req.body.category) {
    category = `AND s.category = '${req.body.category}'`;
  }
  let searchQuery = "";
  if (req.body.query) {
    searchQuery = `AND (s.name ILIKE '%${req.body.query}%' OR s.description ILIKE '%${req.body.query}%')`;
  }
  let onlyPersonal = "";
  if (req.body.onlyPersonal === "true") {
    onlyPersonal = `AND s.user_id = ${req.user_id}`;
  }
  let sortBy = "";
  switch (req.body.sortBy) {
    case "date_modified":
      sortBy = "ORDER BY s.date_modified DESC";
      break;
    case "date_created":
      sortBy = "ORDER BY s.date_created DESC";
      break;
    case "likes":
      // Use a subquery to count the number of likes for each set
      sortBy = `
        ORDER BY (SELECT COUNT(*) FROM "likedSets" ls WHERE ls.set_id = s.set_id) DESC
      `;
      break;
    case "flashcards":
      sortBy = "ORDER BY flashcard_count DESC";
      break;
    default:
      sortBy = "ORDER BY s.set_id DESC";
      break;
  }

  if (req.user_id) {
    pool.query(
      `SELECT
        s.set_id, s.name, s.description, s.date_created, s.date_modified, u.username, u.user_id,
        CASE WHEN ls.set_id IS NOT NULL THEN true ELSE false END AS liked,
        (SELECT COUNT(*) FROM flashcards f WHERE f.set_id = s.set_id) AS flashcard_count
      FROM sets s
      JOIN users u ON s.user_id = u.user_id
      LEFT JOIN "likedSets" ls ON u.user_id = ls.user_id AND s.set_id = ls.set_id
      WHERE s.set_id NOT IN (SELECT set_id FROM "likedSets" WHERE user_id = $1)
      ${searchQuery}
      ${onlyPersonal}
      ${category}
      ${sortBy}
      LIMIT $2`,
      [req.user_id, limit],
      (err, result) => {
        if (err) {
          console.error("DBError: " + err.message);
          res.json({ message: "Error fetching flashcard sets" }).status(500);
        } else {
          res.json(result.rows).status(200);
        }
      }
    );
  } else {
    pool.query(
      `SELECT
        s.set_id, s.name, s.description, s.date_created, s.date_modified, u.username, u.user_id,
        (SELECT COUNT(*) FROM flashcards f WHERE f.set_id = s.set_id) AS flashcard_count
      FROM sets s
      LEFT JOIN "likedSets" ls ON s.set_id = ls.set_id
      JOIN users u ON s.user_id = u.user_id
      WHERE s.set_id NOT IN (SELECT set_id FROM "likedSets" WHERE user_id = $1)
      ${searchQuery}
      ${onlyPersonal}
      ${category}
      ${sortBy}
      LIMIT $2`,
      [req.user_id, limit],
      (err, result) => {
        if (err) {
          console.error("DBError: " + err.message);
          res.json({ message: "Error fetching flashcard sets" }).status(500);
        } else {
          res.json(result.rows).status(200);
        }
      }
    );
  }
});

app.get("/v1/set/export/:id", authorizeToken, (req, res) => {
  const set_id = req.params.id;
  if (
    set_id < 0 ||
    set_id % 1 !== 0 ||
    set_id === undefined ||
    set_id === null ||
    set_id === NaN ||
    set_id === -Infinity ||
    set_id > 100000000
  ) {
    res.json({ message: "Invalid set id" }).status(400);
    return false;
  }
  pool.query(
    `SELECT
      s.set_id, s.name, s.description, s.date_created, s.date_modified, u.username, 
      f.term, f.definition
    FROM sets s
    JOIN flashcards f ON s.set_id = f.set_id
    JOIN users u ON s.user_id = u.user_id
    WHERE s.set_id = $1`,
    [set_id],
    (err, result) => {
      if (err) {
        console.error("DBError: " + err.message);
        res.json({ message: "Error fetching flashcard set" }).status(500);
      } else {
        if (result.rows.length) {
          res.set("Content-Type", "application/json");
          res.set(
            "Content-Disposition",
            "attachment; filename=flashcards.json"
          );
          res.status(200).send(JSON.stringify(result.rows));
        } else {
          res.status(400).end();
        }
      }
    }
  );
});

app.post("/v1/sets", authorizeToken, (req, res) => {
  const { title, description, flashcards } = req.body;
  if (!convert(title).length) {
    res.status(400).json({ message: "Title is empty!" });
    return;
  }
  if (!convert(description).length) {
    res.status(400).json({ message: "Description is empty!" });
    return;
  }
  if (convert(description).length > 10000) {
    res.status(400).json({ message: "Description is too long!" });
    return;
  }
  if (convert(title).length > 10000) {
    res.status(400).json({ message: "Title is too long!" });
    return;
  }
  if (convert(title).length < 1) {
    res.status(400).json({ message: "Title is empty!" });
    return;
  }
  if (convert(description).length < 1) {
    res.status(400).json({ message: "Description is empty!" });
    return;
  }

  if (!flashcards.length) {
    res.status(400).json({ message: "Set is empty!" });
    return;
  }
  let flashcardErrors = false;
  flashcards.forEach((flashcard) => {
    if (
      !convert(flashcard.term).length ||
      !convert(flashcard.definition).length
    ) {
      flashcards.splice(flashcards.indexOf(flashcard), 1);
      return;
    }
    if (convert(flashcard.term).length > 100000) {
      flashcardErrors = true;
      return;
    }
    if (convert(flashcard.definition).length > 100000) {
      flashcardErrors = true;
      return;
    }
  });
  if (flashcardErrors) {
    return false;
  }
  pool.query(
    "INSERT INTO sets (name, description, date_created, date_modified, user_id,category) VALUES ($1, $2, $3, $4, $5,$6) RETURNING set_id",
    [
      title,
      description,
      new Date().toISOString(),
      new Date().toISOString(),
      req.user_id,
      req.body.category,
    ],
    (err, result) => {
      if (err) {
        console.error("DBError: " + err.message);
        res.status(500).json({ message: "Error creating flashcard set" });
        return false;
      }
      const set_id = result.rows[0].set_id;
      flashcards.forEach((flashcard) => {
        pool.query(
          "INSERT INTO flashcards (term, definition, set_id) VALUES ($1, $2, $3)",
          [flashcard.term, flashcard.definition, set_id],
          (err, result) => {
            if (err) {
              console.log(err);
              pool.query("DELETE FROM sets WHERE set_id = $1", [set_id]);
              return false;
            }
          }
        );
      });
      res
        .status(200)
        .json({ message: "Flashcard set created successfully", set_id });
    }
  );
});
app.get("/v1/sets/most/common", authorizeToken, (req, res) => {
  pool.query(
    `SELECT rs.set_id, s.name, COUNT(*) AS total_rows
    FROM "reviewsSets" rs
    JOIN "sets" s ON rs.set_id = s.set_id
    WHERE rs.user_id = $1
    GROUP BY rs.set_id, s.name
    ORDER BY total_rows DESC
    LIMIT 2`,
    [req.user_id],
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send("Internal error occured");
        return false;
      }
      if (result.rows.length) {
        res.status(200).send(result.rows);
      } else {
        pool.query(
          `SELECT set_id, name FROM sets WHERE user_id = $1 LIMIT 2`,
          [req.user_id],
          (err, result) => {
            if (err) {
              console.log(err);
              res.status(500).send("Internal error occured");
              return false;
            }
            res.status(200).send(result.rows);
          }
        );
      }
    }
  );
});
app.post("/v1/set/copy", authorizeToken, (req, res) => {
  if (!req.body.set_id) {
    res.status(409).send("Missing parameters");
    return false;
  }
  //copy set
  pool.query(
    "SELECT * FROM sets WHERE set_id=$1",
    [req.body.set_id],
    (err, results) => {
      if (err) {
        res.status(500);
        return false;
      }
      if (results.rows.length) {
        pool.query(
          "INSERT INTO sets (name, description, date_created, date_modified, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING set_id",
          [
            results.rows[0].name,
            results.rows[0].description,
            new Date().toISOString(),
            new Date().toISOString(),
            req.user_id,
          ],
          (err, result) => {
            if (err) {
              console.error("DBError: " + err.message);
              res.status(500).json({ message: "Error creating flashcard set" });
              return false;
            }
            const set_id = result.rows[0].set_id;
            pool.query(
              "SELECT * FROM flashcards WHERE set_id=$1",
              [req.body.set_id],
              (err, results) => {
                if (err) {
                  res.status(500);
                  return false;
                }
                if (results.rows.length) {
                  results.rows.forEach((flashcard) => {
                    pool.query(
                      "INSERT INTO flashcards (term, definition, set_id) VALUES ($1, $2, $3)",
                      [flashcard.term, flashcard.definition, set_id],
                      (err, result) => {
                        if (err) {
                          res.status(500);
                          return false;
                        }
                      }
                    );
                  });
                }
              }
            );
            pool.query(
              "SELECT set_id FROM sets WHERE user_id=$1 ORDER BY set_id DESC",
              [req.user_id],
              (err, results) => {
                if (err) {
                  res.status(500);
                  return false;
                }
                if (results.rows.length) {
                  res.status(200).send(results.rows[0]);
                }
              }
            );
          }
        );
      }
    }
  );
});

app.put("/v1/flashcard", authorizeToken, (req, res) => {
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
app.put("/v1/sets", authorizeToken, (req, res) => {
  if (!req.body.set_id) {
    res.status(409).send("Missing parameters");
  }
  pool.query(
    'INSERT INTO "reviewsSets" (set_id, user_id, date) VALUES ($1, $2, $3)',
    [Number(req.body.set_id), Number(req.user_id), new Date().toISOString()],
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
app.patch("/v1/flashcard", authorizeToken, (req, res) => {
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
app.post("/v1/flashcard/create", authorizeToken, (req, res) => {
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
app.post("/v1/flashcard/delete", authorizeToken, (req, res) => {
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
app.post("/v1/flashcard/like", authorizeToken, (req, res) => {
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
app.post("/v1/set/delete", authorizeToken, (req, res) => {
  if (!req.body.set_id) {
    res.status(409).send("Missing parameters");
    return false;
  }
  //check if user is owner of set
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
        pool.query(`DELETE FROM "likedSets" WHERE set_id=$1`, [
          req.body.set_id,
        ]);
        pool.query(
          'DELETE FROM "reviewsSets" WHERE set_id=$1',
          [req.body.set_id],
          (err, results) => {
            if (err) {
              console.log(err);
              res.status(500).end();
              return false;
            }
          }
        );
        pool.query(
          'DELETE FROM "likedFlashcards" WHERE set_id=$1',
          [req.body.set_id],
          (err, results) => {
            if (err) {
              console.log(err);
              res.status(500).end();
              return false;
            }
          }
        );
        pool.query(
          'DELETE FROM "reviewsFlashcards" WHERE set_id=$1',
          [req.body.set_id],
          (err, results) => {
            if (err) {
              console.log(err);
              res.status(500).end();
              return false;
            }
          }
        );
        pool.query(
          "DELETE FROM flashcards WHERE set_id=$1",
          [req.body.set_id],
          (err, results) => {
            if (err) {
              console.log(err);
              res.status(500).end();
              return false;
            }
            pool.query(
              "DELETE FROM sets WHERE set_id=$1",
              [req.body.set_id],
              (err, results) => {
                if (err) {
                  console.log(err);
                  res.status(500).end();
                  return false;
                }
              }
            ); /*  */
          }
        );

        res.status(200).end();
      }
    }
  );
});
app.post("/v1/flashcard/dislike", authorizeToken, (req, res) => {
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
app.get("/v1/statstics/personal/sets/:id", authorizeToken, (req, res) => {
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
app.get("/v1/statstics/personal/flashcards/:id", authorizeToken, (req, res) => {
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
});
app.post("/v1/folders/create", authorizeToken, (req, res) => {
  if (convert(req.body.title).length > 100000) {
    res.status(409).send("Excessive size");
    return;
  }
  if (convert(req.body.title).length < 1) {
    res.status(409).send("Name is empty");
    return;
  }
  if (convert(req.body.description).length > 100000) {
    res.status(409).send("Excessive size");
    return;
  }
  if (convert(req.body.description).length < 1) {
    res.status(409).send("Description is empty");
    return;
  }
  if (req.body.sets.length > 2000) {
    res.status(409).send("Too many sets");
    return;
  }
  pool.query(
    "INSERT INTO folders (title, description, date_created, date_modified, user_id, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING folder_id",
    [
      req.body.title,
      req.body.description,
      new Date().toISOString(),
      new Date().toISOString(),
      req.user_id,
      req.body.category
    ],
    (err, result) => {
      if (err) {
        console.error("DBError: " + err.message);
        res.status(500).json({ message: "Error creating folder" });
        return false;
      }
      const folder_id = result.rows[0].folder_id;
      req.body.sets.forEach((set) => {
        pool.query(
          'INSERT INTO "foldersSets" (folder_id, set_id) VALUES ($1, $2)',
          [folder_id, set],
          (err, result) => {
            if (err) {
              console.log(err);
              pool.query("DELETE FROM folders WHERE folder_id = $1", [
                folder_id,
              ]);
              return false;
            }
          }
        );
      });
      res
        .status(200)
        .json({ message: "Folder created successfully", folder_id });
    }
  );
});
app.post("/v1/folders/all", (req,res)=>{
//this is the same router as sets/all expects you are searching for folders. 

  let limit = 10;
  if (req.body.limit) {
    limit = req.body.limit;
  }
  let searchQuery = "";
  if (req.body.search) {
    searchQuery = `AND (folders.title ILIKE '%${req.body.search}%' OR folders.description ILIKE '%${req.body.search}%')`;
  }
  let onlyPersonal = "";
  if (req.body.onlyPersonal) {
    onlyPersonal = `AND folders.user_id = ${req.user_id}`;
  }
  let category = "";
  if (req.body.category) {
    category = `AND folders.category = '${req.body.category}'`;
  }
  let sortBy = "";
  if (req.body.sortBy) {
    switch (req.body.sortBy) {
      case "date_created":
        sortBy = `ORDER BY folders.date_created DESC`;
        break;
      case "date_modified":
        sortBy = `ORDER BY folders.date_modified DESC`;
        break;
      case "name":
        sortBy = `ORDER BY folders.title ASC`;
        break;
      default:
        sortBy = `ORDER BY folders.date_created DESC`;
        break;
    }
  }
  //return folders and data about them, you don't have to return sets in the folders
  pool.query(
    `SELECT
    COUNT(*) AS count
  FROM folders
  WHERE 1=1 ${searchQuery} ${onlyPersonal} ${category};`,
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send("Internal error occured");
        return false;
      }
      if (result.rows.length) {
        pool.query(
          `SELECT
          users.username,
          folders.folder_id,
          folders.title AS name,
          folders.description,
          folders.category,
          folders.user_id
      FROM folders
      JOIN users ON users.user_id = folders.user_id
      WHERE 1=1 ${searchQuery} ${onlyPersonal} ${category} ${sortBy} LIMIT ${limit};`,
          (err, result) => {
            if (err) {
              console.log(err);
              res.status(500).send("Internal error occured");
              return false;
            }
            if (result.rows.length) {
              res.status(200).send(result.rows);
            } else {
              res.status(204).send("No folders");
            }
          }
        );
      } else {
        res.status(404).send("Not found");
      }
    }
  );
})
app.get("/v1/folder/:id", (req, res) => {
  let id = req.params.id;

  pool.query(
    `SELECT
    COUNT(*) AS count
  FROM folders
  WHERE folders.folder_id = $1;`,
    [id],
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send("Internal error occured");
        return false;
      }
      if (result.rows.length) {
        pool.query(
          `SELECT
          users.username,
          sets.name AS set_title,
          sets.description AS set_description,
          folders.folder_id,
          folders.title,
          folders.description,
          folders.category,
          folders.user_id,
          "foldersSets".set_id,
          "foldersSets".bind_id
      FROM folders
      LEFT JOIN "foldersSets" ON folders.folder_id = "foldersSets".folder_id
      JOIN users ON users.user_id = folders.user_id
      LEFT JOIN sets ON sets.set_id = "foldersSets".set_id
      WHERE folders.folder_id = $1;`,
          [id],
          (err, result) => {
            if (err) {
              console.log(err);
              res.status(500).send("Internal error occured");
              return false;
            }
            if (result.rows.length) {
              res.status(200).send(result.rows);
            } else {
              res.status(204).send("Folder empty");
            }
          }
        );
      } else {
        res.status(404).send("Not found");
      }
    }
  );
});
app.post("/v1/folder/update", authorizeToken, (req, res) => {
  if (!req.body.folder_id || !req.body.title || !req.body.description) {
    res.status(409).send("Missing parameters");
    return false;
  }
  pool.query(
    "SELECT user_id FROM folders WHERE folder_id=$1",
    [req.body.folder_id],
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
        //get all sets that are already part of the folder
        pool.query(
          'SELECT set_id FROM "foldersSets" WHERE folder_id=$1',
          [req.body.folder_id],
          (err, results) => {
            if (err) {
              res.status(500);
              return false;
            }

            if (results.rows.length) {
              let setsAlreadyInFolder = [];
              results.rows.forEach((set) => {
                setsAlreadyInFolder.push(set.set_id);
              });
              //get all sets that are not part of the folder
              let setsToAdd = [];
              req.body.setsChosen.forEach((set) => {
                if (!setsAlreadyInFolder.includes(set)) {
                  setsToAdd.push(set);
                }
              });
              //add sets that are not part of the folder
              setsToAdd.forEach((set) => {
                pool.query(
                  'INSERT INTO "foldersSets" (folder_id, set_id) VALUES ($1, $2)',
                  [req.body.folder_id, set],
                  (err, result) => {
                    if (err) {
                      console.log(err);
                      console.log("4");
                      pool.query(
                        'DELETE FROM "foldersSets" WHERE folder_id=$1',
                        [req.body.folder_id],
                        (err, results) => {
                          if (err) {
                            console.log(err);
                            res.status(500).end();
                            return false;
                          }
                          console.log("5");
                        }
                      );
                      return false;
                    }
                  }
                );
              });
            } else {
              req.body.setsChosen.forEach((set) => {
                pool.query(
                  'INSERT INTO "foldersSets" (folder_id, set_id) VALUES ($1, $2)',
                  [req.body.folder_id, set],
                  (err, result) => {
                    if (err) {
                      console.log(err);
                      console.log("4");
                      pool.query(
                        'DELETE FROM "foldersSets" WHERE folder_id=$1',
                        [req.body.folder_id],
                        (err, results) => {
                          if (err) {
                            console.log(err);
                            res.status(500).end();
                            return false;
                          }
                          console.log("5");
                        }
                      );
                      return false;
                    }
                  }
                );
              });
            }
          }
        );
        //update folder title and description
        pool.query(
          "UPDATE folders SET title=$1, description=$2, date_modified=$3, category=$4 WHERE folder_id=$5",
          [
            req.body.title,
            req.body.description,
            new Date().toISOString(),
            req.body.folderCategory,
            req.body.folder_id,
          ],
          (err, results) => {
            if (err) {
              console.log(err);
              res.status(500).end();
              return false;
            }
            res.status(200).end();
          }
        );
      }else{
        res.status(403).send("You are not the owner of this folder")
      }
    }
  );
});
app.post("/v1/folders/sets/add", authorizeToken, (req, res) => {
  if (!req.body.set_id || !req.body.folder_ids) {
    res.status(409).send("Missing parameters");
    return false;
  }
  //check if user is owner of set, then add the set to folders. Keep in mind that some of the folders may already have this set.
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
        req.body.folder_ids.forEach((folder_id) => {
          pool.query(
            'INSERT INTO "foldersSets" (folder_id, set_id) VALUES ($1, $2)',
            [folder_id, req.body.set_id],
            (err, result) => {
              if (err) {
                console.log(err);
                res.status(500).end();
                return false;
              }
            }
          );
        });
        res.status(200).end();
      }
    }
  );
});
app.post("/v1/folders/user", authorizeToken, (req, res) => {
  let limit = 100;
  if (req.body.limit) {
    limit = req.query.limit;
  }
  let category = "";
  if (req.body.category) {
    category = `AND category = '${req.body.category}'`;
  }
  let searchQuery = "";
  if (req.body.query) {
    searchQuery = `AND (title ILIKE '%${req.body.query}%' OR description ILIKE '%${req.body.query}%')`;
  }

  pool.query(
    `SELECT
    folders.folder_id,
    folders.title,
    folders.description,
    folders.date_created,
    folders.date_modified,
    folders.user_id
FROM folders
JOIN users ON users.user_id = folders.user_id
WHERE folders.user_id = $1
${searchQuery}
${category}
LIMIT $2`,
    [req.user_id, limit],
    (err, result) => {
      if (err) {
        console.error("DBError: " + err.message);
        res.json({ message: "Error fetching flashcard sets" }).status(500);
      } else {
        res.json(result.rows).status(200);
      }
    }
  );
});
app.post("/v1/folder/set/remove", authorizeToken, (req, res) => {
  let id = req.body.folder_id;
  let set_id = req.body.set_id;
  if (!id || !set_id) {
    res.status(409).send("Missing parameters");
    return false;
  }
  pool.query(
    "SELECT user_id FROM folders WHERE folder_id=$1",
    [id],
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
          'DELETE FROM "foldersSets" WHERE folder_id=$1 AND set_id=$2',
          [id, set_id],
          (err, results) => {
            if (err) {
              console.log(err);
              res.status(500).end();
              return false;
            }
            res.status(200).end();
          }
        );
      }
    }
  );
});
app.post("/v1/folder/delete", authorizeToken, (req, res) => {
  let id = req.body.folder_id;
  if (!id) {
    res.status(409).send("Missing parameters");
    return false;
  }
  //check if user is owner of set
  pool.query(
    "SELECT user_id FROM folders WHERE folder_id=$1",
    [id],
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
          'DELETE FROM "foldersSets" WHERE folder_id=$1',
          [id],
          (err, results) => {
            if (err) {
              console.log(err);
              res.status(500).end();
              return false;
            }
          }
        );
        pool.query(
          "DELETE FROM folders WHERE folder_id=$1",
          [id],
          (err, results) => {
            if (err) {
              console.log(err);
              res.status(500).end();
              return false;
            }
            res.status(200).end();
          }
        );
      }
    }
  );
});

app.listen(port, () => {
  console.log(`Server listening on the port::${port}`);
});
