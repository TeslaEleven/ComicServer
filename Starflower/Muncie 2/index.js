// Req packages and directories
const path = require('path');
const express = require('express');
const app = express();
const ejs = require('ejs');
const { parse } = require('node-html-parser');
const rp = require('request-promise-native');
const config = require('./config.json');
const FormData = require('form-data');
const fetch = require('node-fetch');
app.use(require('express-session')(config.session))
const Database = require("@replit/database")
const db = new Database()

// Set up date variables (Central Time Chicago)
let ts = Date.now();
let da = new Date(ts);
utc = da.getTime() + da.getTimezoneOffset() * 60000;
offset = -6;
const date = new Date(utc + 3600000 * offset);

//Post pages using EJS
const dataDir = path.resolve(`${process.cwd()}${path.sep}`);
const templateDir = path.resolve(`${dataDir}${path.sep}pages`);
app.engine('json', ejs.renderFile);
app.use('/', express.static(path.resolve(`${dataDir}${path.sep}assets`)));
const renderTemplate = (res, req, template, data = {}) => {
res.render(path.resolve(`${templateDir}${path.sep}${template}`), Object.assign(data));
};

app.get('/login/callback', async (req, resp) => {
const accessCode = req.query.code;
if (!accessCode)
return resp.redirect('/');
const data = new FormData();
data.append('client_id', process.env.ClientId);
data.append('client_secret', process.env.ClientSecret);
data.append('grant_type', 'authorization_code');
data.append('redirect_uri', config.oauth2.redirect_uri);
data.append('scope', 'identify');
data.append('code', accessCode);
const json = await (await fetch('https://discord.com/api/oauth2/token', {method: 'POST', body: data})).json();
req.session.bearer_token = json.access_token;
resp.redirect('/');
});

app.get('/login', (req, res) => {
res.redirect(`https://discord.com/api/oauth2/authorize` + `?client_id=${process.env.client_id}` +   `&redirect_uri=${encodeURIComponent(config.oauth2.redirect_uri)}` + `&response_type=code&scope=${encodeURIComponent(config.oauth2.scopes.join(" "))}`)
})

app.get('/', async (req, resp) => {
const data = await fetch(`https://discord.com/api/users/@me`, {headers: { Authorization: `Bearer ${req.session.bearer_token}` } });
const json = await data.json();
exports.uname = json.username
exports.disc = json.discriminator
exports.id = json.id
exports.ava = json.avatar
var uname = exports.uname;
var disc = exports.disc;
var id = exports.id;
var ava = exports.ava;
db.get(id + "-" + '1').then(value => {exports.s1 = value});
const s1 = exports.s1
db.get(id + "-" + '2').then(value => {exports.s2 = value});
const s2 = exports.s2
db.get(id + "-" + '3').then(value => {exports.s3 = value});
const s3 = exports.s3
db.get(id + "-" + '4').then(value => {exports.s4 = value});
const s4 = exports.s4
db.get(id + "-" + '5').then(value => {exports.s5 = value});
const s5 = exports.s5
db.get(id + "-" + '6').then(value => {exports.s6 = value});
const s6 = exports.s6
db.get(id + "-" + '7').then(value => {exports.s7 = value});
const s7 = exports.s7
db.get(id + "-" + '8').then(value => {exports.s8 = value});
const s8 = exports.s8
db.get(id + "-" + '9').then(value => {exports.s9 = value});
const s9 = exports.s9
renderTemplate(resp, req, 'index.ejs', { uname, disc, id, ava, s1, s2, s3, s4, s5, s6, s7, s8, s9});
});

app.get('/add/:slot/:name', async (req, res) => {
const id = exports.id;
if(id !== undefined) {
const slot = req.params.slot;
const namee = req.params.name;
const name = namee.replace(/</g, '/')
db.set(id + "-" + slot, name).then(() => {
res.redirect('/')
});
} else {
res.send('Sign in already!')
}
});

app.get('/del/:slot', async (req, res) => {
const id = exports.id;
const slot = req.params.slot;
db.delete(id + "-" + slot).then(() => {
res.redirect('/')
});
});

app.get('/get/:slot', async (req, res) => {
const id = exports.id;
if(id !== undefined) {
const slot = req.params.slot;
db.get(id + "-" + slot).then(value => {res.send(value)});
} else {
res.send('Sign in already!')
}
});

app.get('/list', async (req, res) => {
db.list().then(keys => {res.send(keys)});
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
    renderTemplate(res, req, 'comic.ejs', {
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
    renderTemplate(res, req, 'king-comic.ejs', {
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

app.get('/load/:term', async (req, res) => {
var array = ["amazing-spider-man", "arctic-circle", "barney-google-and-snuffy-smith", "beetle-bailey", "beetle-bailey-1", "between-friends", "bizarro", "blondie", "carpe-diem", "crankshaft", "crock", "curtis", "daddy-daze", "dennis-the-menace", "dustin", "edge-city", "flash-forward", "flash-gordon", "funky-winkerbean", "Funny_Online_Animals", "Gearhead_Gertie", "hagar-the-horrible", "hi-and-lois", "Intelligent", "judge-parker", "katzenjammer-kids", "kevin-and-kell", "Macanudo", "mallard-fillmore", "mandrake-the-magician-1", "mark-trail", "Marvin", "mary-worth", "moose-and-molly", "mother-goose-grimm", "mutts", "on-the-fastrack", "pardon-my-planet", "popeye", "popeyes-cartoon-club", "prince-valiant", "pros-cons", "rae-the-doe", "rex-morgan-m-d", "rhymes-with-orange", "safe-havens", "sales", 'sally-forth', "sam-and-silo", "sherman-s-lagoon", "shoe", "six-chix", "slylock-fox-and-comics-for-kids", "take-it-from-the-tinkersons", "brilliant-mind-of-edison-lee", "family-circus", "lockhorns", "pajama-diaries", "phantom", "tiger", "tinas-groove", "todd-the-dinosaur", "zippy-the-pinhead", "zits"];
var term = req.params.term;
var format = term.replace(/\s/g,"-").toLowerCase();
if(format === "beetle-bailey") format = "beetle-bailey-1";
if(array.includes(format)) {
const comic = format;
const mo = ("0" + (date.getMonth() + 1)).slice(-2);
const datestring = date.getFullYear() + '/' + mo + '/' + ("0" + date.getDate()).slice(-2);
res.redirect('/k/' + comic + '/' + datestring);
} else {
const parsedPage = parse(await rp(`https://www.gocomics.com/search/results?utf8=%E2%9C%93&terms=${term}`));
var csRawDate = parsedPage.querySelector('.content-section-sm a')
var csDate = csRawDate;
if(csRawDate === null) {
res.redirect('/404/200');
return;
} else {
const hellothere = csRawDate.rawAttrs;
csDate = hellothere.slice(6, -1)
}
const comic = csDate;
const parsedDate = parse(await rp(`https://www.gocomics.com/${comic}/`)
);
const datestringg = parsedDate.querySelector('.gc-deck.gc-deck--cta-0 a').rawAttrs;
const datestring = datestringg.slice(55, -1)
res.redirect(datestring);
}
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

app.get('*', (req,  res) => {
    renderTemplate(res, req, 'error.ejs');
  });

app.listen('3000');