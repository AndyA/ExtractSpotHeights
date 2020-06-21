"use strict";

const Promise = require("bluebird");
const fs = Promise.promisifyAll(require("fs"));
const DxfParser = require("dxf-parser");
const _ = require("lodash");

(async () => {
  try {
    const src = "ref/Pike Lane Topographical Survey.dxf";
    const obj = await fs.readFileAsync(src, "latin1");
    const dxf = parser.parseSync(obj);

    const heights = _.chain(dxf.entities)
      .groupBy("layer")
      .pickBy((val, name) => /height/i.test(name))
      .omitBy((val, name) => /head/i.test(name))
      .value();

    console.log(JSON.stringify(heights, null, 2));
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

const parser = new DxfParser();
try {
} catch (err) {
  return console.error(err.stack);
}
