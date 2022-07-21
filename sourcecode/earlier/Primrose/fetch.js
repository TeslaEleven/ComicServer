//Dependencies
const { parse } = require("node-html-parser");
const rp = require("request-promise-native");
const r = require("request")

exports.csFetch = async function request(things) {
const comic = things.name
const parsedDate = parse(
  await rp(`https://www.gocomics.com/${comic}/`)
);
const datestringg = parsedDate.querySelector('div.gc-deck.gc-deck--cta-0 a').rawAttrs;
console.log(datestringg)
module.exports.redir = datestringg
}