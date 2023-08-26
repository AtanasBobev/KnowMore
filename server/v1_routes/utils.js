const express = require("express");
const router = express.Router();
const pool = require("../utils/dbConfig");
const fs = require("fs");

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

module.exports = router;
