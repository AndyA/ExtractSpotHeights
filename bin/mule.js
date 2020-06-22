"use strict";

require("../lib/use");

const Promise = require("bluebird");
const fs = Promise.promisifyAll(require("fs"));
const DxfParser = require("dxf-parser");
const _ = require("lodash");
const printf = require("printf");
const { bumper, mergeCounters, filterTail } = require("tools/functions");
const { json, inspect } = require("tools/util");

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

function centre(entity) {
  if (_.isArray(entity)) {
    const centres = entity.map(centre);
    return _.mapValues(mergeCounters(...centres), v => v / centres.length);
  }
  return entity.position;
}

function dist(a, b) {
  const [ca, cb] = [a, b].map(centre);
  return Math.sqrt(
    _.sum(
      Object.keys(ca)
        .map(k => ca[k] - cb[k])
        .map(x => x * x)
    )
  );
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

  const out = [];
  const orphans = [];
  const layerAssoc = {};
  const bumpAssoc = bumper(layerAssoc);

  for (const chunk of chunks) {
    while (chunk.length) {
      const next = chunk.shift();
      if (next.type !== "POINT") {
        orphans.push(next);
        continue;
      }

      out.push({ ...next, labels: [] });

      while (chunk.length && chunk[0].type !== "POINT") {
        const label = chunk.shift();
        if (label.type === "MTEXT") {
          _.last(out).labels.push(label);
          bumpAssoc(next.layer, label.layer);
        } else orphans.push(label);
      }
    }
  }

  const [heights, noLabels] = _.partition(out, e =>
    e.labels
      .map(l => l.text)
      .map(cleanText)
      .map(_.trim)
      .some(n => !isNaN(n))
  );

  return { heights, noLabels, orphans, layerAssoc };
}

function matchOrphans(trove) {
  const [oGroup, nlGroup] = [trove.orphans, trove.noLabels].map(l =>
    _.groupBy(l, "layer")
  );

  const sNoLabel = new Set(trove.noLabels);
  const sOrphans = new Set(trove.orphans);

  for (const [hl, lls] of Object.entries(trove.layerAssoc)) {
    for (const ll of Object.keys(lls)) {
      const noLabels = nlGroup[hl] || [];
      const orphans = groupRuns(oGroup[ll] || []);
      let pairs = [];
      for (const orphan of orphans)
        for (const noLabel of noLabels)
          pairs.push({ noLabel, orphan, d: dist(noLabel, orphan) });
      pairs.sort((a, b) => a.d - b.d);

      while (pairs.length) {
        const { noLabel, orphan, d } = pairs.shift();
        if (sNoLabel.has(noLabel) && orphan.every(o => sOrphans.has(o))) {
          //          console.log(inspect({ noLabel, orphan, d }));
          noLabel.labels.push(...orphan);
          trove.heights.push({ ...noLabel, d });
          sNoLabel.delete(noLabel);
          for (const o of orphan) sOrphans.delete(o);
        }
      }
    }
  }

  return { ...trove, orphans: [...sOrphans], noLabels: [...sNoLabel] };
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

    const trove = matchOrphans(foldLabels(entities));

    if (0) {
      console.log(json({ bb, ...trove }));
    }

    if (1) {
      console.log("Orphans:");
      showEntities(trove.orphans);

      console.log("Unlabelled:");
      showEntities(trove.noLabels);
    }
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
