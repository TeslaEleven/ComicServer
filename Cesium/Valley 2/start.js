// Req packages and directories
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
module.exports = async client => {
  const dataDir = path.resolve(`${process.cwd()}${path.sep}`);
  const templateDir = path.resolve(`${dataDir}${path.sep}pages`);
  console.log(' Starting ComicServer...');
  app.engine('json', ejs.renderFile);
  app.use('/', express.static(path.resolve(`${dataDir}${path.sep}assets`)));
  const renderTemplate = (res, req, template, data = {}) => {
    res.render(
      path.resolve(`${templateDir}${path.sep}${template}`),
      Object.assign(data));
  };

  app.get('/', (req, res) => {
    renderTemplate(res, req, 'betai.ejs');
  });

  app.get('/versions', (req, res) => {
    renderTemplate(res, req, 'betav.ejs');
  });

  app.post('/', (req, res) => {
    renderTemplate(res, req, 'betai.ejs');
  });

  app.get('/tomorrow/:comic/:year/:month/:day', async (req, res) => {
    const today = req.params.day;
    const acyear = req.params.year;
    const acmonth = req.params.month;
    const datestring = acyear + '-' + acmonth + '-' + today;
    const comic = req.params.comic;
    const parsedPage = parse(
      await rp(
        `https://licensing.andrewsmcmeel.com/features/${comic}?date=${datestring}`
      )
    );
    const csRawImage = parsedPage
      .querySelector('.text-center img')
      .rawAttrs.split(/ src=/)[1]
      .replace(/"/g, '');
    const csImage = csRawImage.slice(0, 63);
    const csRawDate = parsedPage
      .querySelector('.text-center img')
      .rawAttrs.split(/ alt=/)[1]
      .replace(/"/g, '');
    const csDate = csRawDate;
    renderTemplate(res, req, 'betaf.ejs', { csImage, csDate, comic });
  });

  app.get('/tomorrow/:comic', async (req, res) => {
    const today = date.getDate() + 1;
    const acyear = date.getFullYear();
    const acmonth = ('0' + (date.getMonth() + 1)).slice(-2);
    const datestring = acyear + '-' + acmonth + '-' + today;
    const comic = req.params.comic;
    const parsedPage = parse(
      await rp(
        `https://licensing.andrewsmcmeel.com/features/${comic}?date=${datestring}`
      )
    );
    const csRawImage = parsedPage
      .querySelector('.text-center img')
      .rawAttrs.split(/ src=/)[1]
      .replace(/"/g, '');
    const csImage = csRawImage.slice(0, 63);
    const csRawDate = parsedPage
      .querySelector('.text-center img')
      .rawAttrs.split(/ alt=/)[1]
      .replace(/"/g, '');
    const csDate = csRawDate;
    res.redirect(`/tomorrow/${comic}/${acyear}/${acmonth}/${today}`);
  });

  app.get('/:comic/:year/:month/:day', async (req, res) => {
    const today = ('0' + (date.getDate())).slice(-2);
    const acyear = date.getFullYear();
    const acmonth = ('0' + (date.getMonth() + 1)).slice(-2);
    const datestring = acyear + '/' + acmonth + '/' + today;
    const comic = req.params.comic;
    const year = req.params.year;
    const month = req.params.month;
    const dayy = ('0' + (req.params.day)).slice(-2);
    const monthh = ('0' + (req.params.month)).slice(-2);
    const day = req.params.day;
    var ejsstring = year + "/" + monthh + "/" + dayy
    const parsedPage = parse(
      await rp(
        `https://www.gocomics.com/${comic}/${year}/${month}/${day}`
      ).catch(err => {
        console.log('Request failed\n', err);
      })
    );
    var csImage = parsedPage
      .querySelector('.item-comic-image img')
      .rawAttrs.split(/ src=/)[1]
      .replace(/"/g, '');
    const csRawDate = parsedPage
      .querySelector('.item-comic-image img')
      .rawAttrs.split(/ alt=/)[1]
      .replace(/"/g, '');
    const csDate = csRawDate.slice(0, -70);
    const prev = day - 1;
    const next = prev + 2;
    const csRawParamsStart = parsedPage
      .querySelector(
        '.btn.btn-outline-secondary.gc-calendar-nav__datepicker.js-calendar-wrapper'
      )
      .rawAttrs.split(/ data-start=/)[1]
      .replace(/"/g, '');
    var csName = parsedPage.querySelector('h4.media-heading.h4.mb-0').rawText;
    const csParamsStart = csRawParamsStart.slice(0, -63);
    const csStartFormatted = csParamsStart.slice(0, 4);
    const csRawParamsEnd = parsedPage
      .querySelector(
        '.btn.btn-outline-secondary.gc-calendar-nav__datepicker.js-calendar-wrapper'
      )
      .rawAttrs.split(/ data-end=/)[1]
      .replace(/"/g, '');
    const csParamsEnd = csRawParamsEnd.slice(0, -32);
    const csParamsDay = csParamsEnd.slice(8)
    const csParamsMonthh = csParamsEnd.slice(5, -3)
    const csParamsMonth = parseFloat(csParamsMonthh) + 1
    const csParamsYear = csParamsEnd.slice(0, -6)
    const csEndFormatted = csParamsEnd.slice(0, 4);
    const csTest = parsedPage
      .querySelector('.gc-calendar-nav__next a')
      .rawAttrs.split(/ href=/)[1]
      .replace(/"/g, '');
    const csLength = comic.length + 3;
    const csStr = csTest.slice(csLength, -78);
    const csTestTwo = parsedPage
      .querySelector('.gc-calendar-nav__previous a.js-previous-comic')
      .rawAttrs.split(/ href=/)[1]
      .replace(/"/g, '');
    const csStrPrev = csTestTwo.slice(csLength, -95);
    const nextstring = csStr;
    const prevstring = csStrPrev;
    const csTitleandStuff = comic + "-" + datestring;
    renderTemplate(res, req, 'beta.ejs', {
      prevstring,
      nextstring,
      day,
      acmonth,
      datestring,
      today,
      comic,
      csDate,
      csImage,
      prev,
      next,
      month,
      year,
      ejsstring,
      csParamsStart,
      csParamsMonth,
      csParamsYear,
      csParamsDay,
      csParamsEnd,
      csName
    });
  });

  app.get('/k/:comic/:year/:month/:day', async (req, res) => {
    let options = {
      insecure: true,
      rejectUnauthorized: false
    };
    const today = date.getDate();
    const acyear = date.getFullYear();
    const acmonth = ('0' + (date.getMonth() + 1)).slice(-2);
    const datestring = acyear + '/' + acmonth + '/' + today;
    const comic = req.params.comic;
    const comicc = comic.charAt(0).toUpperCase() + comic.slice(1);
    const year = req.params.year;
    const month = req.params.month;
    const day = req.params.day;
    const parsedPage = parse(await rp(`https://v7.comicskingdom.net/comics/${comic}/${year}-${month}-${day}`, options))
const csRaw = parsedPage.querySelector("img.img-fluid");
    const csImagee = csRaw.rawAttrs;
    const csImagge = csImagee.slice(166, -19);
    const csImage = csImagge.replace(/&amp;/g, '&');
    renderTemplate(res, req, 'betak.ejs', {
      day,
      acmonth,
      datestring,
      today,
      comic,
      csImage,
      month,
      year,
      comicc
    });
  });

  app.get('/k/:comic', async (req, res) => {
    const comic = req.params.comic;
    let ts = Date.now();
    let d = new Date(ts);
    utc = d.getTime() + d.getTimezoneOffset() * 60000;
    offset = -6;
    d = new Date(utc + 3600000 * offset);
    const mo = ("0" + (date.getMonth() + 1)).slice(-2);
    const datestring = date.getFullYear() + '/' + mo + '/' + ("0" + date.getDate()).slice(-2);
    res.redirect('/k/' + comic + '/' + datestring);
  });

    app.get('/amu/:term', async (req, res) => {
    const term = req.params.term;
    const parsedPage = parse(await rp(`https://www.gocomics.com/search/results?utf8=%E2%9C%93&terms=${term}`));
    var csRawDate = parsedPage
      .querySelector('.content-section-sm a')
      var csDate = csRawDate;
    if(csRawDate === null) {
    csDate = "/404/200"
    } else {
    const hellothere = csRawDate.rawAttrs;
    csDate = hellothere.slice(6, -1)
    }
    res.redirect(csDate)
  });

  app.get('/search/:term', async (req, res) => {
    const term = req.params.term;
    renderTemplate(res, req, 'differ.ejs', { term })
  });

  app.get('/:comic/random', async (req, res) => {
    const comic = req.params.comic;
    const parsedPage = parse(
      await rp(`https://www.gocomics.com/random/${comic}`)
    );
    const ccsStr = parsedPage
      .querySelector(
        '.btn.btn-outline-secondary.gc-calendar-nav__datepicker.js-calendar-wrapper'
      )
      .rawAttrs.split(/ data-date=/)[1]
      .replace(/"/g, '');
    const csStr = ccsStr.slice(0, 10);
    res.redirect('/' + comic + '/' + csStr);
  });

  app.get('/:comic', async (req, res) => {
    const comic = req.params.comic;
        const parsedDate = parse(
      await rp(`https://www.gocomics.com/${comic}/`)
    );
    const datestringg = parsedDate.querySelector('.gc-deck.gc-deck--cta-0 a').rawAttrs;
    const datestring = datestringg.slice(55, -1)
    res.redirect(datestring);
  });

  app.get('*', (req, res) => {
    res.send('404')
  });

  app.listen('3000', null, null, () =>
    console.log(`ComicServer has started!`)
  );
};