// Req packages and directories
const path = require('path');
const express = require('express');
const app = express();
const ejs = require('ejs');
const RadioBrowser = require('radio-browser')

// EJS Pages
const dataDir = path.resolve(`${process.cwd()}${path.sep}`);
const templateDir = path.resolve(`${dataDir}${path.sep}pages`);
app.engine('json', ejs.renderFile);
app.use('/', express.static(path.resolve(`${dataDir}${path.sep}assets`)));
const renderTemplate = (res, req, template, data = {}) => {
  res.render(path.resolve(`${templateDir}${path.sep}${template}`), Object.assign(data));
};

app.get('/', async (req, res) => {
renderTemplate(res, req, 'index.ejs')
});

app.get('/logo.png', function (req, res) {
  res.sendFile(__dirname + '/pages/passband.png');
})

app.get('/thumb.png', function (req, res) {
  res.sendFile(__dirname + '/pages/thumb.png');
})

app.get('/play/:url', async (req, res) => {
const urll = req.params.url
const url = urll.replace(/</g, '/')
renderTemplate(res, req, 'player.ejs', { url })
});

app.get('/name/:query', async (req, res) => {
let filter = {
  limit: 10,
  by: 'name',
  searchterm: req.params.query
}
const parms = req.params.query
RadioBrowser.getStations(filter).then(
data => 
renderTemplate(res, req, 'omni.ejs', { data, parms })
)
});

app.get('/genre/:query', async (req, res) => {
let filter = {
  limit: 10,
  by: 'tag',
  searchterm: req.params.query
}
const parms = req.params.query
RadioBrowser.getStations(filter).then(
data => 
renderTemplate(res, req, 'omni.ejs', { data, parms })
)
});

app.get('*', async (req, res) => {
res.redirect('/')
});

app.listen(3000, () => {
  console.log('Cesium is Launched');
});