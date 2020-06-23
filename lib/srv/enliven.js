"use strict";

// TODO Support #EXT-X-DISCONTINUITY-SEQUENCE
//
// https://tools.ietf.org/html/draft-pantos-http-live-streaming-13#section-6.2.1
//
// TODO Duration override: make it possible that the whole playlist is e.g. 24
// hours long even if the actual playlist overruns by a few seconds.

const _ = require("lodash");
const hls = require("../hls");
const MathX = require("../common/mathx.js");

function makeProto(playlist) {
  const segmentProto = proto => {
    proto.header.removeTag("EXT-X-PLAYLIST-TYPE");
    delete proto.footer; // remove #EXT-X-ENDLIST
    proto.list = []; // and segments
    return proto;
  };

  const variantProto = proto =>
    proto.mapURI(uri => uri.replace(/^(.+)\.(m3u8)$/, "$1.live.$2"));

  if (playlist instanceof hls.SegmentPlaylist)
    return segmentProto(playlist.clone());

  if (playlist instanceof hls.VariantPlaylist)
    return variantProto(playlist.clone());

  throw new Error("Need a VariantPlaylist or a SegmentPlaylist");
}

class Enliven {
  constructor(playlist, options) {
    this.opt = Object.assign(
      {
        before: 45000,
        after: 15000,
        time: 0
      },
      options || {}
    );
    this.source = playlist.clone();
    this.proto = makeProto(this.source);
  }

  getLive(options) {
    const opt = _.extend({ offset: 0 }, this.opt, options || {});
    const { proto, source } = this;

    if (proto instanceof hls.VariantPlaylist) {
      if (!opt.offset) return proto;
      return proto.clone().mapURI(uri => uri + "?o=" + opt.offset);
    }

    const countSegments = (list, upto) =>
      list.slice(0, upto).filter(i => i.uri).length;

    const { duration, list } = source;

    const timeNow = opt.time - opt.before + opt.offset * 1000;
    const time = MathX.fmodp(timeNow, duration);

    let pos = source.findSegment(time);

    const live = proto.clone();

    const retired =
      Math.floor(timeNow / duration) * countSegments(list) +
      countSegments(list, pos);

    live.mediaSequence = retired + 1;

    live.append(list[pos]);
    let got = list[pos].startTime + list[pos].duration - time;
    const span = opt.after + opt.before;

    while (got < span) {
      // Wrapped?
      if (++pos >= list.length) {
        pos -= list.length;
        live.appendDiscontinuity();
      }
      live.append(list[pos]);
      got += list[pos].duration;
    }

    return live;
  }
}

module.exports = Enliven;
