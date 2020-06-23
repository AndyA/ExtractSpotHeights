"use strict";

require("../lib/use.js");

const express = require("express");
const exphbs = require("express-handlebars");
const config = require("config");
const Handlebars = require("handlebars");

const app = express();

app.engine(
  ".hbs",
  exphbs({
    defaultLayout: "main",
    extname: ".hbs",
    handlebars: Handlebars
  })
);

app.set("view engine", ".hbs");

// Our Handlebars extensions
//require("handlebars/helpers")(Handlebars);

app.use(require("srv/views.js"));

app.use(express.static(config.get("app.root")));

app.listen(config.get("app.port"));
