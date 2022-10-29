// Start packages and directories
const path = require('path');
const express = require('express');
const app = express();
const ejs = require('ejs');
const { parse } = require('node-html-parser');
const rp = require('request-promise-native');
const Database = require("@replit/database")
const db = new Database()
var useragent = require('express-useragent');
app.use(useragent.express());
var Fingerprint = require('express-fingerprint')

app.use(Fingerprint({
	parameters:[
		Fingerprint.useragent,
		Fingerprint.acceptHeaders,
		Fingerprint.geoip,

		function(next) {
			next(null,{
			'param1':'value1'
			})
		},
		function(next) {
			next(null,{
			'param2':'value2'
			})
		},
	]
}))

// Set up date variables for comics (Central Time)
let ts = Date.now();
let da = new Date(ts);
utc = da.getTime() + da.getTimezoneOffset() * 60000;
offset = -6;
const date = new Date(utc + 3600000 * offset);

//GET pages using EJS
const dataDir = path.resolve(`${process.cwd()}${path.sep}`);
const templateDir = path.resolve(`${dataDir}${path.sep}pages`);
app.engine('json', ejs.renderFile);
app.use('/', express.static(path.resolve(`${dataDir}${path.sep}assets`)));
const renderTemplate = (res, req, template, data = {}) => {
  res.render(path.resolve(`${templateDir}${path.sep}${template}`), Object.assign(data));
};

app.get('/list', async (req, res) => {
db.list().then(keys => {res.send(keys)})
})

app.get('/get/:id', async (req, res) => {
db.get(req.params.id).then(value => {res.send(value + " - " + req.fingerprint.components)});
})

app.get('/sync/:sync', async (req, res) => {
const token = req.fingerprint.hash
const ua = req.useragent
if(ua.isMobile === false) {
renderTemplate(res, req, 'error.ejs')
} else {
const syncid = req.params.sync
db.get(syncid).then(value => {
const uname = value
db.get(syncid + "-favs").then(valuetwo => {
const favs = valuetwo
renderTemplate(res, req, 'sync.ejs', {favs, uname})
});
});
}
})

app.get('/sync', async (req, res) => {
const token = req.fingerprint.hash
const ua = req.useragent
if(ua.isMobile === false) {
renderTemplate(res, req, 'error.ejs')
} else {
renderTemplate(res, req, 'synctwo.ejs')
}
})

app.get('/tour', async (req,res) => {
const token = req.fingerprint.hash
const sub = req.query.uname
  db.set(token + "-favs", "[]")
  db.set(token, `["${sub}"]`)
  res.redirect('/')
})

app.get('/', async (req, resp) => {
const token = req.fingerprint.hash
  await db.get(token).then(value => {exports.e = value});
  async function final() {
  if(exports.e === null) {
  renderTemplate(resp, req, 'guest.ejs')
  return;
  }
  if(exports.e !== null) {
    await db.get(token).then(value => {
  var ef = JSON.parse(value)
  exports.uname = ef
  });
  const uname = exports.uname
  await db.get(token + "-favs").then(value => {exports.favs = value});
  const favs = exports.favs
  renderTemplate(resp, req, 'index.ejs', { favs, uname });
  }
  }
  final()
})

app.get('/edit', async (req, resp) => {
const token = req.fingerprint.hash
  db.get(token).then(value => {exports.e = value});
  async function final() {
  if(exports.e === null) {
  renderTemplate(resp, req, 'guest.ejs')
  return;
  }
  if(exports.e !== null) {
    await db.get(token).then(value => {
  var ef = JSON.parse(value)
  exports.uname = ef
  });
  const uname = exports.uname
  await db.get(token + "-favs").then(value => {exports.favs = value});
  const favs = exports.favs
    const len = exports.favs
  renderTemplate(resp, req, 'edit.ejs', { favs, uname, len, token });
  }
  }
  final()
})

app.get("/search/:term", async (req, res) => {
  const term = req.params.term;
  const parsedPage = parse(await rp(`https://www.gocomics.com/search/full_results?category=comic&terms=${term}`))
  const csRawLink = parsedPage.querySelector("div.comic__image a")
  if (csRawLink === null) {
    renderTemplate(res, req, 'error.ejs')
  } else {
    const csStillRaw = csRawLink.rawAttrs.split(/ href=/)[1].replace(/"/g, "");
    const csLink = csStillRaw.replace(" ", "?");
    res.redirect(csLink)
  }
});

app.get('/add', async (req, res) => {
const token = req.fingerprint.hash
  const name = req.query.url
  var status = "200";
db.get(token).then(value => {exports.token = value});
if(exports.token === null) {
status = '401'
renderTemplate(res, req, 'prev.ejs', { name, status })
} else {
renderTemplate(res, req, 'prev.ejs', { name, status })
}
});

app.get('/plzadd', async (req, res) => {
const token = req.fingerprint.hash
  const namee = req.query.url;
  const nameee = namee.replace(/</g, '/')
  const name = nameee.replace(/>/g, '?')
  db.get(token + "-favs").then(value => {
    var list = value
    if (list === '[]') {
      list = JSON.parse(value)
      list.push(name)
      console.log(list)
      db.set(token + "-favs", list).then(() => { res.redirect('/') });
    } else {
      list.push(name)
      console.log(list)
      db.set(token + "-favs", list).then(() => { res.redirect('/') });
    }
  });
});

app.get('/del/:slot', async (req, res) => {
const token = req.fingerprint.hash
  const sloc = req.params.slot
  db.get(token + "-favs").then(value => {
    function removeSecond(element, index) {
      return index != sloc;
    }
    var arr = value.filter(removeSecond);
    db.set(token + "-favs", arr).then(() => { res.redirect('/') });
  });
});

app.get('/del', async (req, res) => {
const token = req.fingerprint.hash
  db.delete(token)
  db.delete(token + "-favs").then(() => { res.clearCookie('connect.sid', { path: '/' }).status(200).send('Cleared!'); });
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
  var format = term.replace(/\s/g, "-").toLowerCase();
  if (format === "beetle-bailey") format = "beetle-bailey-1";
  if (array.includes(format)) {
    const comic = format;
    const mo = ("0" + (date.getMonth() + 1)).slice(-2);
    const datestring = date.getFullYear() + '/' + mo + '/' + ("0" + date.getDate()).slice(-2);
    res.redirect('/k/' + comic + '/' + datestring);
  } else {
    const parsedPage = parse(await rp(`https://www.gocomics.com/search/results?utf8=%E2%9C%93&terms=${term}`));
    var csRawDate = parsedPage.querySelector('.content-section-sm a')
    var csDate = csRawDate;
    if (csRawDate === null) {
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

app.get("/search/:term", async (req, res) => {
  const pass = process.env.AUTH;
  const term = req.params.term;
  const parsedPage = parse(await rp(`https://www.gocomics.com/search/results?utf8=%E2%9C%93&terms=${term}`))
  const csRawLink = parsedPage.querySelector("div.comic__image a").rawAttrs.split(/ href=/)[1].replace(/"/g, "");
  const csLink = csRawLink.replace(" ", "?");
  const csImage = parsedPage.querySelector(".item-comic-image img").rawAttrs.split(/ src=/)[1].replace(/"/g, "");
  const csRawDate = parsedPage.querySelector(".item-comic-image img").rawAttrs.split(/ alt=/)[1].replace(/"/g, "");
  const csDate = csRawDate.slice(0, -70);
  renderTemplate(res, req, "global.ejs", { csLink, term, csDate, csImage, pass });
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
  renderTemplate(res, req, 'future.ejs', { csImage, csDate, comic });
});

app.get('/tomorrow/:comic', async (req, res) => {
  const comic = req.params.comic;
  const smarter = parse(await rp(`https://licensing.andrewsmcmeel.com/search?q=${comic}&search_comic=&search_category=&search_start_date=&search_end_date=&search_sort_by=best_match`));
  const actualNameee = smarter.querySelector('div.card.card-hover.search-item.mb-3 a').rawAttrs.slice(16)
  const actualNamee = actualNameee.substring(0, 4)
  var n = actualNamee.indexOf('?');
  actualName = actualNamee.substring(0, n != -1 ? n : s.length);
  const csDateString = "/" + date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + (date.getDate() + 1)
  console.log("/tomorrow/" + actualName + csDateString)
  res.redirect("/tomorrow/" + actualName + csDateString)
});

app.get('*', (req, res) => {
  renderTemplate(res, req, 'error.ejs');
});

app.all('Come back later.')

app.listen(3000)