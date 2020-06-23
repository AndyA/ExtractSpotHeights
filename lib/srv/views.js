"use strict";

const express = require("express");
const app = express();
const config = require("config");
const _ = require("lodash");

const getStash = (...extra) =>
  _.mergeWith({}, { ...config }, ...extra, (obj, src) => {
    if (typeof src === "function") return src(obj);
  });

app.get("/", (req, res) => {
  res.render("viewer", getStash());
});

module.exports = app;
