"use strict";

const Promise = require("bluebird");
const fs = Promise.promisifyAll(require("fs"));
const DxfParser = require("dxf-parser");
const _ = require("lodash");
const printf = require("printf");

function cleanText(str) {
  const m = str.match(/^\{\\C\d+;(.+)\}$/);
  if (m) return m[1];
  return str;
}

function bbox(entities) {
  const bbox = {};
  for (const { position } of entities) {
    if (!position) continue;
    for (const [axis, val] of Object.entries(position)) {
      const slot = bbox[axis];
      if (!slot) {
        bbox[axis] = { min: val, max: val };
        continue;
      }
      slot.min = Math.min(slot.min, val);
      slot.max = Math.max(slot.max, val);
    }
  }
  return bbox;
}

function showEntities(entities) {
  for (const entity of entities) {
    console.log(
      printf(
        "%5d %-6s %-8s %-40s %10.4f %10.4f %s",
        entity.id,
        entity.handle,
        entity.type,
        entity.layer,
        entity.position.x,
        entity.position.y,
        cleanText(entity.text || "")
      )
    );
  }
}

function groupRuns(entities) {
  const work = entities.slice(0);
  const out = [];
  let lastID;

  while (work.length) {
    const next = work.shift();
    if (lastID === undefined || next.id > lastID + 1) out.push([]);
    _.last(out).push(next);
    lastID = next.id;
  }

  return out;
}

function foldLabels(entities) {
  const chunks = groupRuns(entities);

  const heights = [];
  const orphans = [];

  for (const chunk of chunks) {
    while (chunk.length) {
      const next = chunk.shift();
      if (next.type !== "POINT") {
        orphans.push(next);
        continue;
      }

      heights.push({ ...next, labels: [] });

      while (chunk.length && chunk[0].type !== "POINT") {
        const label = chunk.shift();
        if (label.type === "MTEXT") _.last(heights).labels.push(next);
        else orphans.push(label);
      }
    }
  }

  return { heights, orphans };
}

(async () => {
  try {
    const src = "ref/Pike Lane Topographical Survey.dxf";
    const obj = await fs.readFileAsync(src, "latin1");
    const dxf = parser.parseSync(obj);

    const entities = _.chain(dxf.entities)
      .map(e => ({ ...e, id: parseInt(e.handle, 16) }))
      .groupBy("layer")
      .pickBy((val, name) => /height/i.test(name))
      .omitBy((val, name) => /head/i.test(name))
      .values()
      .flatten()
      .sortBy("handle")
      .value();

    const bb = bbox(entities);
    console.log(bb);

    const { heights, orphans } = foldLabels(entities);
    showEntities(orphans);
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
