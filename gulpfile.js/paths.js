"use strict";

module.exports = {
  app: {
    survey: {
      src: "lib/app/survey.js",
      dest: "www/js"
    }
  },
  scss: {
    src: "lib/app/**/*.{sass,scss}",
    dest: "www/css",
    include: ["lib/sass", "node_modules"],
    watch: ["lib/**/*.{sass,scss}"]
  }
};
