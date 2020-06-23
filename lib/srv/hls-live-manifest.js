"use strict";

const express = require("express");
const moment = require("moment-timezone");
const rp = require("request-promise");
const HLS = require("../hls");
const Enliven = require("./enliven.js");
const io = require("@pm2/io");
const config = require("config");

const { tz, type, adjust } = config.get("player");

const app = express();

const liveRate = io.meter({
  name: "HLS Live Requests",
  id: "app/live/volume"
});

const cache = {};

function fetch(url) {
  if (!cache.hasOwnProperty(url)) {
    cache[url] = rp(url).then(body => {
      const playlist = HLS.Playlist.parse(body);
      return new Enliven(playlist, {
        before: 105000,
        after: 15000
      });
    });
  }
  return cache[url];
}

function dayOffset() {
  const now = moment.tz(tz);
  return (
    now.hour() * 3600000 +
    now.minute() * 60000 +
    now.second() * 1000 +
    now.millisecond()
  );
}

const isLive = /^(.*)\.live(\.m3u8)$/;

app.get(isLive, async (req, res) => {
  const vodPath = req.params[0] + req.params[1];
  const offset = Number(req.query.o || 0);

  if (isLive.test(vodPath))
    throw new Error("Attempt to enliven a live playlist");

  const vodURL = req.protocol + "://" + req.headers.host + vodPath;
  const timeOffset = dayOffset() - adjust * 1000;

  const enliven = await fetch(vodURL);

  res
    .type(type)
    .header("Cache-Control", "max-age=5, must-revalidate")
    .send(enliven.getLive({ time: timeOffset, offset }).format());

  liveRate.mark();
});

module.exports = app;
