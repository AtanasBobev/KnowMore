const express = require("express");
const router = express.Router();
const pool = require("../utils/dbConfig");
const { authorizeToken } = require("../utils/authMiddleware");
const { convert } = require("html-to-text");

router.post("/folders/create", authorizeToken, (req, res) => {
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
      req.body.category,
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
router.post("/folders/all", (req, res) => {
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
});
("");
router.get("/folder/:id", (req, res) => {
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
router.post("/folder/update", authorizeToken, (req, res) => {
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
      } else {
        res.status(403).send("You are not the owner of this folder");
      }
    }
  );
});
router.post("/folders/sets/add", authorizeToken, (req, res) => {
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
router.post("/folders/user", authorizeToken, (req, res) => {
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
router.post("/folder/set/remove", authorizeToken, (req, res) => {
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
router.post("/folder/delete", authorizeToken, (req, res) => {
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

module.exports = router;