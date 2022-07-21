const { csGet } = require("./get.js");
const { csFetch } = require("./fetch.js");
const api = require("./get.js");
const apit = require("./fetch.js");
const path = require('path');
const express = require('express');
const app = express();
const ejs = require('ejs');
const bodyParser = require('body-parser');
const { parse } = require('node-html-parser');
const rp = require('request-promise-native');
let ts = Date.now();
let da = new Date(ts);
utc = da.getTime() + da.getTimezoneOffset() * 60000;
offset = -6;
const date = new Date(utc + 3600000 * offset);
const passwordProtected = require('./login');
app.use(passwordProtected());

//Post pages using EJS and start website
const dataDir = path.resolve(`${process.cwd()}${path.sep}`);
const templateDir = path.resolve(`${dataDir}${path.sep}`);
console.log(' Starting ComicServer...');
app.engine('json', ejs.renderFile);
app.use('/', express.static(path.resolve(`${dataDir}${path.sep}assets`)));
const renderTemplate = (res, req, template, data = {}) => { res.render(path.resolve(`${templateDir}${path.sep}${template}`), Object.assign(data))};

app.get('/:comic/:year/:month/:day', (req, res) => {
  const csDo = csGet({ 
  name: req.params.comic,
  year: req.params.year, 
  month: req.params.month, 
  day: req.params.day
  });
  var comic = req.params.comic;
  var csImage = api.url;
  var csDate = api.date;
  var csName = api.name;
  var csParamsStart = api.ps;
  var csParamsEnd = api.pe;
  var prevstring = api.ps;
  var nextstring = api.ns;
  if(csName === null) {
  csName = "mm"
  csParamsStart = "mm"
  csParamsEnd = "mm"
  nextstring = "mm"
  prevstring = "mm"
  }
renderTemplate(res, req, 'comic.ejs', { 
csImage, 
csDate, 
csName, 
csParamsStart, 
csParamsEnd, 
comic, 
prevstring, 
nextstring 
});
});

app.get('/:comic', (req, res) => {
  const csDo = csFetch({ 
  name: req.params.comic
  });
  const csName = apit.redir.slice(55, -1)
  console.log(csName)
  res.redirect(csName)
});

app.get('/', (req, res) => {
  renderTemplate(res, req, 'index.ejs');
});

app.post('/', (req, res) => {
  renderTemplate(res, req, 'index.ejs');
});

app.get('*', (req, res) => {
  renderTemplate(res, req, 'error.ejs');
});

app.listen('3000', null, null, () =>
  console.log(`ComicServer has started!`)
);