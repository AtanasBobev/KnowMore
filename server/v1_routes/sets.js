const express = require("express");
const router = express.Router();
const pool = require("../utils/dbConfig");
const { authorizeToken } = require("../utils/authMiddleware");
const { convert } = require("html-to-text");

router.get("/set/:id", (req, res) => {
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
    LEFT JOIN flashcards f ON s.set_id = f.set_id
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
router.patch("/set", authorizeToken, (req, res) => {
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
    //some of the flashcards are new and some are old. You have to update the old ones and insert the new ones
    if (flashcard.flashcard_id) {
      pool.query(
        "UPDATE flashcards SET term=$1, definition=$2 WHERE flashcard_id=$3",
        [flashcard.term, flashcard.definition, flashcard.flashcard_id],
        (err, results) => {
          if (err) {
            res.status(500).end();
            return false;
          }
        }
      );
    }
    if (!flashcard.flashcard_id) {
      pool.query(
        "INSERT INTO flashcards (term, definition, set_id) VALUES ($1, $2, $3)",
        [flashcard.term, flashcard.definition, req.body.set_id],
        (err, results) => {
          if (err) {
            res.status(500).end();
            return false;
          }
        }
      );
    }
  });
  res.status(200).end();
});

router.get("/sets/user", authorizeToken, (req, res) => {
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

router.post("/set/like", authorizeToken, (req, res) => {
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
router.post("/set/dislike", authorizeToken, (req, res) => {
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
router.get("/set/liked/:id", authorizeToken, (req, res) => {
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

router.post("/sets/combine", authorizeToken, (req, res) => {
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

router.post("/sets/all/", (req, res) => {
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

router.get("/set/export/:id", (req, res) => {
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

router.post("/sets", authorizeToken, (req, res) => {
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
router.get("/sets/most/common", authorizeToken, (req, res) => {
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
router.post("/set/copy", authorizeToken, (req, res) => {
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
router.post("/set/delete", authorizeToken, (req, res) => {
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
        pool.query('DELETE FROM "foldersSets" WHERE set_id=$1', [
          req.body.set_id,
        ]);
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
router.put("/sets", authorizeToken, (req, res) => {
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

module.exports = router;
