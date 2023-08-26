require('dotenv').config();
const { Pool } = require("pg");
console.log(process.env.DATABASE_URL);
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  idleTimeoutMillis: 24 * 60 * 60 * 1000,
  max: 1000,
});

pool.connect((err) => {
  if (err) {
    console.log("Error when setting up DB: " + err);
  } else {
    console.log("DB connected successfully!");
  }
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

module.exports = pool;