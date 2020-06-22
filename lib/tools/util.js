"use strict";

const util = require("util");

const inspect = obj =>
  util.inspect(obj, {
    depth: null,
    sorted: true,
    getters: true
  });

const json = obj => JSON.stringify(obj, null, 2);

module.exports = { inspect, json };
