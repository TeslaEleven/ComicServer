// Variables for packages and directories
const path = require('path');
const express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
const ejs = require('ejs');
const { parse } = require('node-html-parser');
const rp = require('request-promise-native');
const Database = require("@replit/database")
const db = new Database()
var LocalStrategy = require('passport-local');
var crypto = require('crypto');
var dbe = require('./db.js');
var passport = require('passport');
var session = require('express-session');
var SQLiteStore = require('connect-sqlite3')(session);
const AI = require("stable-diffusion-cjs")
var cors = require('cors')

// Passport login configuration
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  store: new SQLiteStore({ db: 'sessions.db', dir: './var/db' })
}));
app.use(passport.authenticate('session'));
passport.use(new LocalStrategy(function verify(username, password, cb) {
  dbe.get('SELECT * FROM users WHERE username = ?', [username], function(err, row) {
    if (err) { return cb(err); }
    if (!row) { return cb(null, false, { message: 'Incorrect username or password.' }); }

    crypto.pbkdf2(password, row.salt, 310000, 32, 'sha256', function(err, hashedPassword) {
      if (err) { return cb(err); }
      if (!crypto.timingSafeEqual(row.hashed_password, hashedPassword)) {
        return cb(null, false, { message: 'Incorrect username or password.' });
      }
      return cb(null, row);
    });
  });
}));
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});


// Set up date variables for comics (America/Chicago)
let ts = Date.now();
let da = new Date(ts);
utc = da.getTime() + da.getTimezoneOffset() * 60000;
offset = -6;
const date = new Date(utc + 3600000 * offset);

// Variables for EJS rendering
const dataDir = path.resolve(`${process.cwd()}${path.sep}`);
const templateDir = path.resolve(`${dataDir}${path.sep}pages`);
app.engine('json', ejs.renderFile);
app.use('/', express.static(path.resolve(`${dataDir}${path.sep}assets`)));
const renderTemplate = (res, req, template, data = {}) => {
res.render(path.resolve(`${templateDir}${path.sep}${template}`), Object.assign(data));
console.log(req.headers.referer)
};

var uname;

app.get('/src', async (req, res) => {
   if (req.user) {
let prompt = req.query.prompt
AI.generate(prompt, async (result) => {
if (result.error) {
console.log(result.error)
return;
}
let data = result.results[0].split(",")[1]
const buffer = Buffer.from(data, "base64")
res.writeHead(200,{'Content-Type':'image/png'});
res.end(buffer)
})
   } else {
    res.redirect('https://blog.comicserver.org/muncie-13/')
        console.log('We did it.')
   }
})

app.get('/manifest.json', async (req, res) => {
res.json({
  "name": "ComicServer",
  "short_name": "ComicServer",
  "theme_color": "var(--basic)",
  "background_color": "var(--basic)",
  "display": "standalone",
  "scope": "/",
  "start_url": "/"
});
})

app.get('/explore', function(req, res, next) {
  renderTemplate(res, req, 'exp.ejs')
});

app.get('/ai', function(req, res, next) {
  const prompt = req.query.prompt
  renderTemplate(res, req, 'ai.ejs', { prompt })
});

app.get('/signup', function(req, res, next) {
  renderTemplate(res, req, 'signup.ejs')
});

app.get('/offline', function(req, res, next) {
  renderTemplate(res, req, 'offline.ejs')
});

app.get('/delete', function (req, res) {
const user = req.query.uname
dbe.run(`DELETE FROM users WHERE username LIKE '${user}';`)
db.delete(user).then(() => {res.redirect('/logout')});
})

app.post('/signup', function(req, res, next) {
  var salt = crypto.randomBytes(16);
  crypto.pbkdf2(req.body.password, salt, 310000, 32, 'sha256', function(err, hashedPassword) {
    if (err) { return next(err); }
    dbe.run('INSERT INTO users (username, hashed_password, salt) VALUES (?, ?, ?)', [
      req.body.username,
      hashedPassword,
      salt
    ], function(err) {
      if (err) { return next(err); }
      var user = {
        id: this.lastID,
        username: req.body.username
      };
      req.login(user, function(err) {
        if (err) { return next(err); }
        db.set(req.body.username, "[]").then(() => { });
        res.redirect('/');
      });
    });
  });
});

app.post('/login/password', passport.authenticate('local', {
  successReturnToOrRedirect: '/',
  failureRedirect: '/login?status=false'
})
);

app.get('/login', function(req, res, next) {
  const query = req.query.status
  var html = ''
  if(query === 'false') {
  html = `<p><span style="padding-left:10px"><b>Login Failed.</b> Please check your username and password.</span>
<span style="float:right;font-size:1.5em;padding-right:10px;cursor:pointer;padding-top:-5px" onclick="changeBanner()"><i class="bi bi-x"></i></span></p>
<hr style="background-color:var(--ba);height:1px;border:0;">`
  renderTemplate(res, req, 'signin.ejs', { html })
  } else {
  renderTemplate(res, req, 'signin.ejs', { html })
  }
});

app.get('/', async (req, resp) => {
  if (req.user) {
  var summary = req.query.summary
  const token = req.user.username
  await db.get(token).then(value => { exports.e = value });
  async function final() {
    if (exports.e === null) {
      renderTemplate(resp, req, 'signin.ejs')
      return;
    } else {
      const uname = token
      await db.get(token).then(value => { exports.favs = value });
      const favs = exports.favs
      renderTemplate(resp, req, 'index.ejs', { favs, uname, summary });
    }
  }
  final()
  } else {
  const query = req.query.status
  var html = ""
  if(query === 'false') {
  html = `<p style="padding-left:10px"><b>Login Failed.</b> Please check your username and password.</p><hr style="background-color:var(--ba);height:1px;border:0;">`
  renderTemplate(resp, req, 'signin.ejs', { html })
  }
  renderTemplate(resp, req, 'signin.ejs', { html })
  }
})

app.get('/edit', async (req, resp) => {
  if (req.user) {
  var summary = req.query.summary
  const token = req.user.username
  await db.get(token).then(value => { exports.e = value });
  async function final() {
    if (exports.e === null) {
      const html = ""
      renderTemplate(resp, req, 'signin.ejs', {html})
      return;
    } else {
      const uname = token
      await db.get(token).then(value => { exports.favs = value });
      const favs = exports.favs
      const len = exports.favs
      renderTemplate(resp, req, 'edit.ejs', { favs, uname, len, token, summary });
    }
  }
  final()
} else {
      const html = ""
      renderTemplate(resp, req, 'signin.ejs', {html})
renderTemplate(resp, req, 'signin.ejs')
}
})

app.get('/del', async (req, res) => {
  if (req.user) {
  const token = req.user.username
  const sloc = req.query.index
  db.get(token).then(value => {
const arr = value.filter(e => e !== sloc)
    db.set(token, arr).then(() => { renderTemplate(res, req, 'del.ejs', { token }) });
  });
} else {
renderTemplate(res, req, 'signin.ejs')
}
});

app.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.get("/search", async (req, res) => {
   if (req.user) {
  const term = req.query.name;
  const parsedPage = parse(await rp(`https://www.gocomics.com/search/full_results?category=comic&terms=${term}`))
  const csRawLink = parsedPage.querySelector("div.comic__image a")
  if (csRawLink === null) {
    renderTemplate(res, req, 'error.ejs')
  } else {
    const csStillRaw = csRawLink.rawAttrs.split(/ href=/)[1].replace(/"/g, "");
    const csLink = csStillRaw.replace(" ", "?");
    res.redirect(csLink)
  }
   } else {
    res.redirect('https://blog.comicserver.org/muncie-13/')
        console.log('We did it.')
   }
});

app.get('/add', async (req, res) => {
  if (req.user) {
  const token = req.user.username
  const name = req.query.url
  var status = "200";
  db.get(token).then(value => { exports.token = value });
      renderTemplate(res, req, 'prev.ejs', { name, status })
  } else {
    status = '401'
      const name = req.query.url
    renderTemplate(res, req, 'prev.ejs', { name, status })
  }
});

app.get('/plzadd', async (req, res) => {
  if (req.user) {
  const token = req.user.username
  const unamee = req.query.url;
  const unameee = unamee.replace(/</g, '/')
  const name = unameee.replace(/>/g, '?')
  db.get(token).then(value => {
    var list = value
    if (list === '[]') {
      list = JSON.parse(value)
      list.push(name)
      db.set(token, list).then(() => { res.redirect('/') });
    } else {
      list.push(name)
      db.set(token, list).then(() => { res.redirect('/') });
    }
  });
} else {
renderTemplate(res, req, 'signin.ejs')
}
});

app.get('/:comic/:year/:month/:day', async (req, res) => {
   if (req.user) {
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
  await rp(`https://www.gocomics.com/${comic}/${year}/${month}/${day}`));
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
  var csuname = parsedPage.querySelector('h4.media-heading.h4.mb-0').rawText;
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
    csuname
  });
   } else {
    res.redirect('https://blog.comicserver.org/muncie-13/')
        console.log('We did it.')
   }
});

app.get('/k/:comic/:year/:month/:day', async (req, res) => {
   if (req.user) {
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
  function csImage() {
  const csRaw = parsedPage.querySelector("img.img-fluid");
  const csImagee = csRaw.rawAttrs;
  const csImage = csImagee.slice(5, -20)
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
  }
  setTimeout(csImage, 2000)
   } else {
    res.redirect('https://blog.comicserver.org/muncie-13/')
        console.log('We did it.')
   }
});

app.get('/load', async (req, res) => {
   if (req.user) {
var array = ["amazing-spider-man", "arctic-circle", "barney-google-and-snuffy-smith", "beetle-bailey", "beetle-bailey-1", "between-friends", "bizarro", "blondie", "carpe-diem", "crankshaft", "crock", "curtis", "daddy-daze", "dennis-the-menace", "dustin", "edge-city", "flash-forward", "flash-gordon", "funky-winkerbean", "Funny_Online_Animals", "Gearhead_Gertie", "hagar-the-horrible", "hi-and-lois", "Intelligent", "judge-parker", "katzenjammer-kids", "kevin-and-kell", "Macanudo", "mallard-fillmore", "mandrake-the-magician-1", "mark-trail", "Marvin", "mary-worth", "moose-and-molly", "mother-goose-grimm", "mutts", "on-the-fastrack", "pardon-my-planet", "popeye", "popeyes-cartoon-club", "prince-valiant", "pros-cons", "rae-the-doe", "rex-morgan-m-d", "rhymes-with-orange", "safe-havens", "sales", 'sally-forth', "sam-and-silo", "sherman-s-lagoon", "shoe", "six-chix", "slylock-fox-and-comics-for-kids", "take-it-from-the-tinkersons", "brilliant-mind-of-edison-lee", "family-circus", "lockhorns", "pajama-diaries", "phantom", "tiger", "tinas-groove", "todd-the-dinosaur", "zippy-the-pinhead", "zits"];
  var term = req.query.name;
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
   } else {
    res.redirect('https://blog.comicserver.org/muncie-13')
        console.log('We did it.')
   }
});

app.get('/:comic/random', async (req, res) => {
   if (req.user) {
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
   } else {
    res.redirect('https://blog.comicserver.org/muncie-13/')
        console.log('We did it.')
   }
});

app.get('/tomorrow/:comic/:year/:month/:day', async (req, res) => {
   if (req.user) {
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
   } else {
    res.redirect('https://blog.comicserver.org/muncie-13/')
        console.log('We did it.')
   }
});

app.get('/tomorrow', async (req, res) => {
   if (req.user) {
  const comic = req.query.name;
  const smarter = parse(await rp(`https://licensing.andrewsmcmeel.com/search?q=${comic}&search_comic=&search_category=&search_start_date=&search_end_date=&search_sort_by=best_match`));
  const actualunameee = smarter.querySelector('div.card.card-hover.search-item.mb-3 a').rawAttrs.slice(16)
  const actualunamee = actualunameee.substring(0, 4)
  var n = actualunamee.indexOf('?');
  actualuname = actualunamee.substring(0, n != -1 ? n : s.length);
  const csDateString = "/" + date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + (date.getDate() + 1)
  res.redirect("/tomorrow/" + actualuname + csDateString)
   } else {
    res.redirect('https://blog.comicserver.org/muncie-13/')
        console.log('We did it.')
   }
});

app.get('/error', (req, res) => {
  renderTemplate(res, req, 'error2.ejs');
});

app.use((req, res, next) => {
  renderTemplate(res, req, 'error.ejs');
})

app.listen(3000)