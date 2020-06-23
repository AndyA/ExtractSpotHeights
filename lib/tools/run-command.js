"use strict";

const { spawn } = require("child_process");
const Promise = require("bluebird");

async function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit" })
      .on("exit", (code, signal) => resolve({ code, signal }))
      .on("error", reject);
  });
}

module.exports = runCommand;
