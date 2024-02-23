// Variables for packages and directories
const path = require("path");
const express = require("express");
var bodyParser = require("body-parser");
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
const ejs = require("ejs");
const { parse } = require("node-html-parser");
const rp = require("request-promise-native");
const Database = require("@replit/database");
const db = new Database();
var LocalStrategy = require("passport-local");
var crypto = require("crypto");
var dbe = require("./db.js");
var passport = require("passport");
var session = require("express-session");
var SQLiteStore = require("connect-sqlite3")(session);
const AI = require("stable-diffusion-cjs");
var cors = require("cors");
const schedule = require("node-schedule");

// Passport login configuration
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store: new SQLiteStore({ db: "sessions.db", dir: "./var/db" }),
  })
);
app.use(passport.authenticate("session"));
passport.use(
  new LocalStrategy(function verify(username, password, cb) {
    dbe.get(
      "SELECT * FROM users WHERE username = ?",
      [username],
      function (err, row) {
        if (err) {
          return cb(err);
        }
        if (!row) {
          return cb(null, false, {
            message: "Incorrect username or password.",
          });
        }

        crypto.pbkdf2(
          password,
          row.salt,
          310000,
          32,
          "sha256",
          function (err, hashedPassword) {
            if (err) {
              return cb(err);
            }
            if (!crypto.timingSafeEqual(row.hashed_password, hashedPassword)) {
              return cb(null, false, {
                message: "Incorrect username or password.",
              });
            }
            return cb(null, row);
          }
        );
      }
    );
  })
);
passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
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
app.engine("json", ejs.renderFile);
app.use("/", express.static(path.resolve(`${dataDir}${path.sep}assets`)));
const renderTemplate = (res, req, template, data = {}) => {
  res.render(
    path.resolve(`${templateDir}${path.sep}${template}`),
    Object.assign(data)
  );
  console.log(req.headers.referer);
};

var uname;

app.get("/sheet", async (req, res) => {
  if(req.user) {
  if(req.user.username === "csadmin124") {
  db.get(req.query.key).then((val) => {
    res.send(val);
  });
  } else {
  renderTemplate(res, req, "error.ejs");
  }
  } else {
  renderTemplate(res, req, "error.ejs");
  }
});
app.get("/editsheet", async (req, res) => {
  if(req.user) {
  if(req.user.username === "csadmin124") {
  db.set(req.query.key, req.query.value)
  res.send('done')
  } else {
  renderTemplate(res, req, "error.ejs");
  }
  } else {
  renderTemplate(res, req, "error.ejs");
  }
});
app.get("/deletesheet", async (req, res) => {
  if(req.user) {
  if(req.user.username === "csadmin124") {
  db.delete(req.query.key)
  res.send('done')
  } else {
    renderTemplate(res, req, 'error.ejs')
  }
  } else {
  renderTemplate(res, req, "error.ejs");
  }
});

app.get("/manifest.json", async (req, res) => {
  res.json({
    name: "ComicServer",
    short_name: "ComicServer",
    display: "standalone",
    scope: "/",
    start_url: "/",
  });
});

function search(text, arr) {
  var e = arr.filter((label) => label.includes(text));
  if (!Array.isArray(e) || !e.length) {
    return false;
  } else {
    return true;
  }
}

function searchReturnsValue(text, arr) {
  var e = arr.filter((label) => label.includes(text));
  return e;
}

app.get("/sync", async (req, res) => {
  if (req.headers["csclient"] === "app") {
    var usr = req.query.email;
    var user = req.query.name;
    db.get("emails").then((value) => {
      if (value.includes(usr + "-" + user)) {
        res.send("no!");
        return;
      }
      if (search(usr, value) === true) {
        res.send("already!");
        return;
      } else {
        value.push(usr + "-" + user);
        db.set("emails", value).then(() => {
          res.send("good");
        });
      }
    });
  } else {
    renderTemplate(res, req, "error.ejs");
  }
});

app.get("/rss", async (req, res) => {
  const { parse } = require("rss-to-json");
  (async () => {
    var rss = await parse(req.query.url);
    res.send(rss);
  })();
});

app.get("/chsync", async (req, res) => {
  if (req.headers["csclient"] === "app") {
    var user = req.query.name;
    db.get("emails").then((value) => {
      if (search(user, value) === true) {
        res.send("no!" + searchReturnsValue(user, value));
        return;
      } else {
        res.send("yes!");
        return;
      }
    });
  } else {
    renderTemplate(res, req, "error.ejs");
  }
});

app.get("/reqsync", async (req, res) => {
  doStuff();
  res.send("didstuff");
});

function doStuff() {
  db.get("emails").then((emails) => {
    emails.forEach(doOtherStuff);
  });
}

function doOtherStuff(index, item) {
  var uname = index.split("-");
  db.get(uname[1]).then(async (value) => {
    var url = "https://comicserver-daily.comicserver.repl.co/import";
    await rp({
      method: "POST",
      headers: { csclient: "app", uname: uname[0] },
      body: value,
      json: true,
      uri: url,
    });
    wait(60000);
  });
}

app.get("/explore", function (req, res, next) {
  var autofill = req.query.name;
  renderTemplate(res, req, "exp.ejs", { autofill });
});

app.get("/ai", function (req, res, next) {
  if(req.user) {
  const prompt = req.query.prompt;
  AI.generate(prompt, async (result) => {
    if (result.error) {
      console.log(result.error);
      res.send(
        'Error Generating. Redirecting. <script>window.location.replace("/")</script>'
      );
    }
    let one = result.results[0];
    let two = result.results[1];
    let three = result.results[2];
    let four = result.results[3];
    renderTemplate(res, req, "ai.ejs", { one, two, three, four, prompt });
  });
  } else {
    var html = ""
    renderTemplate(res, req, "signin.ejs", { html });
  }
});

app.get("/signup", function (req, res, next) {
  renderTemplate(res, req, "signup.ejs");
});

app.get("/offline", function (req, res, next) {
  renderTemplate(res, req, "offline.ejs");
});

app.get("/delete", function (req, res) {
  const user = req.query.uname;
  dbe.run(`DELETE FROM users WHERE username LIKE '${user}';`);
  db.delete(user).then(() => {
    res.redirect("/logout");
  });
});

app.post("/signup", function (req, res, next) {
  var salt = crypto.randomBytes(16);
  crypto.pbkdf2(
    req.body.password,
    salt,
    310000,
    32,
    "sha256",
    function (err, hashedPassword) {
      if (err) {
        return next(err);
      }
      dbe.run(
        "INSERT INTO users (username, hashed_password, salt) VALUES (?, ?, ?)",
        [req.body.username, hashedPassword, salt],
        function (err) {
          if (err) {
            return next(err);
          }
          var user = {
            id: this.lastID,
            username: req.body.username,
          };
          req.login(user, function (err) {
            if (err) {
              return next(err);
            }
            db.set(req.body.username, "[]").then(() => {});
            res.redirect("/");
          });
        }
      );
    }
  );
});

app.post(
  "/login/password",
  passport.authenticate("local", { failureRedirect: "/login?status=false" }),
  function (req, res) {
    res.redirect(req.get("referer"));
  }
);

app.get("/login", function (req, res, next) {
  const query = req.query.status;
  var html = "";
  if (query === "false") {
    html = `<p><span style="padding-left:10px"><b>Login Failed.</b> Please check your username and password.</span>
<span style="float:right;font-size:1.5em;padding-right:10px;cursor:pointer;padding-top:-5px" onclick="changeBanner()"><i class="bi bi-x"></i></span></p>
<hr style="background-color:var(--ba);height:1px;border:0;">`;
    renderTemplate(res, req, "signin.ejs", { html });
  } else {
    renderTemplate(res, req, "signin.ejs", { html });
  }
});

app.get("/", async (req, resp) => {
  if (req.user) {
    var summary = req.query.summary;
    const token = req.user.username;
    await db.get(token).then((value) => {
      exports.e = value;
    });
    async function final() {
      if (exports.e === null) {
        var html = ""
        renderTemplate(resp, req, "signin.ejs", {html});
        return;
      } else {
        const uname = token;
        await db.get(token).then((value) => {
          exports.favs = value;
        });
        const favs = exports.favs;
        renderTemplate(resp, req, "index.ejs", { favs, uname, summary });
      }
    }
    final();
  } else {
    const query = req.query.status;
    var html = "";
    if (query === "false") {
      html = `<p style="padding-left:10px"><b>Login Failed.</b> Please check your username and password.</p><hr style="background-color:var(--ba);height:1px;border:0;">`;
      renderTemplate(resp, req, "signin.ejs", { html });
    }
    html = ``;
    renderTemplate(resp, req, "signin.ejs", { html });
  }
});

app.get("/edit", async (req, resp) => {
  if (req.user) {
    const name = req.query.url;
    var summary = req.query.summary;
    const token = req.user.username;
    await db.get(token).then((value) => {
      exports.e = value;
    });
    async function final() {
      if (exports.e === null) {
        const html = "";
        renderTemplate(resp, req, "signin.ejs", { html });
        return;
      } else {
        const uname = token;
        await db.get(token).then((value) => {
          exports.favs = value;
        });
        const favs = exports.favs;
        const len = exports.favs;
        renderTemplate(resp, req, "edit.ejs", {
          favs,
          uname,
          len,
          token,
          summary,
          name,
        });
      }
    }
    final();
  } else {
    const html = "";
    renderTemplate(resp, req, "signin.ejs", { html });
  }
});

app.get("/del", async (req, res) => {
  var html = ""
  if (req.user) {
    const token = req.user.username;
    const sloc = req.query.index;
    db.get(token).then((value) => {
      const arr = value.filter((e) => e !== sloc);
      db.set(token, arr).then(() => {
        renderTemplate(res, req, "del.ejs", { token });
      });
    });
  } else {
    renderTemplate(res, req, "signin.ejs", {html});
  }
});

app.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.get("/search", async (req, res) => {
  if (req.user) {
    const term = req.query.name;
    const parsedPage = parse(
      await rp(
        `https://www.gocomics.com/search/full_results?category=comic&terms=${term}`
      )
    );
    const csRawLink = parsedPage.querySelector("div.comic__image a");
    if (csRawLink === null) {
      renderTemplate(res, req, "error.ejs");
    } else {
      const csStillRaw = csRawLink.rawAttrs
        .split(/ href=/)[1]
        .replace(/"/g, "");
      const csLink = csStillRaw.replace(" ", "?");
      res.redirect(csLink);
    }
  } else {
    var html = "";
    renderTemplate(res, req, "signin.ejs", { html });
    console.log("We did it.");
  }
});

app.get("/add", async (req, res) => {
  var html = ""
  if (req.user) {
    const url = req.query.url;
    res.redirect("./edit?url=" + url);
  } else {
    renderTemplate(res, req, "signin.ejs", {html});
  }
});

app.get("/plzesadd", async (req, res) => {
  renderTemplate(res, req, "plzesadd.ejs");
});

app.get("/plzadd", async (req, res) => {
  var html = ""
  if (req.user) {
    const token = req.user.username;
    const unamee = req.query.url;
    const unameee = unamee.replace(/</g, "/");
    const name = unameee.replace(/>/g, "?");
    db.get(token).then((value) => {
      var list = value;
      if (list === "[]") {
        list = JSON.parse(value);
        list.push(name);
        db.set(token, list).then(() => {
          res.redirect("/plzesadd");
        });
      } else {
        list.push(name);
        db.set(token, list).then(() => {
          res.redirect("/plzesadd");
        });
      }
    });
  } else {
    renderTemplate(res, req, "signin.ejs", {html});
  }
});

app.get("/:comic/:year/:month/:day", async (req, res) => {
  if (req.user) {
    const today = ("0" + date.getDate()).slice(-2);
    const acyear = date.getFullYear();
    const acmonth = ("0" + (date.getMonth() + 1)).slice(-2);
    const datestring = acyear + "/" + acmonth + "/" + today;
    const comic = req.params.comic;
    const year = req.params.year;
    const month = req.params.month;
    const dayy = ("0" + req.params.day).slice(-2);
    const monthh = ("0" + req.params.month).slice(-2);
    const day = req.params.day;
    var ejsstring = year + "/" + monthh + "/" + dayy;
    const parsedPage = parse(
      await rp(`https://www.gocomics.com/${comic}/${year}/${month}/${day}`)
    );
    var csImage = parsedPage
      .querySelector(".item-comic-image img")
      .rawAttrs.split(/ src=/)[1]
      .replace(/"/g, "");
    const csRawDate = parsedPage
      .querySelector(".item-comic-image img")
      .rawAttrs.split(/ alt=/)[1]
      .replace(/"/g, "");
    const csDate = csRawDate.slice(0, -70);
    const prev = day - 1;
    const next = prev + 2;
    const csRawParamsStart = parsedPage
      .querySelector(
        ".btn.btn-outline-secondary.gc-calendar-nav__datepicker.js-calendar-wrapper"
      )
      .rawAttrs.split(/ data-start=/)[1]
      .replace(/"/g, "");
    var csuname = parsedPage.querySelector("h4.media-heading.h4.mb-0").rawText;
    const csParamsStart = csRawParamsStart.slice(0, -63);
    const csStartFormatted = csParamsStart.slice(0, 4);
    const csRawParamsEnd = parsedPage
      .querySelector(
        ".btn.btn-outline-secondary.gc-calendar-nav__datepicker.js-calendar-wrapper"
      )
      .rawAttrs.split(/ data-end=/)[1]
      .replace(/"/g, "");
    const csParamsEnd = csRawParamsEnd.slice(0, -32);
    const csParamsDay = csParamsEnd.slice(8);
    const csParamsMonthh = csParamsEnd.slice(5, -3);
    const csParamsMonth = parseFloat(csParamsMonthh) + 1;
    const csParamsYear = csParamsEnd.slice(0, -6);
    const csEndFormatted = csParamsEnd.slice(0, 4);
    const csTest = parsedPage
      .querySelector(".gc-calendar-nav__next a")
      .rawAttrs.split(/ href=/)[1]
      .replace(/"/g, "");
    const csLength = comic.length + 3;
    const csStr = csTest.slice(csLength, -78);
    const csTestTwo = parsedPage
      .querySelector(".gc-calendar-nav__previous a.js-previous-comic")
      .rawAttrs.split(/ href=/)[1]
      .replace(/"/g, "");
    const csStrPrev = csTestTwo.slice(csLength, -95);
    const nextstring = csStr;
    const prevstring = csStrPrev;
    const csTitleandStuff = comic + "-" + datestring;
    renderTemplate(res, req, "comic.ejs", {
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
      csuname,
    });
  } else {
    var html = "";
    renderTemplate(res, req, "signin.ejs", { html });
    console.log("We did it.");
  }
});

app.get("/chfavs", async (req, res) => {
  if (req.headers["csclient"] === "app") {
    var usr = req.query.user
    var item = req.query.comic
    var itm = item.toLowerCase().replaceAll(" ", "")
    db.get(usr).then((value) => {
       value = value.map(v => v.toLowerCase().replaceAll(" ", ""));
      if (value === "[]") {
       res.send('no')
      } else {
        console.log(value + itm)
       if(value.includes(itm)) {
         res.send('yes')
       } else {
         res.send('no')
      }
    }
    })
  } else {
    renderTemplate(res, req, "error.ejs");
  }
});

app.get("/k/:comic/:year/:month/:day", async (req, res) => {
  if (req.user) {
    let options = {
      insecure: true,
      rejectUnauthorized: false,
    };
    const today = date.getDate();
    const acyear = date.getFullYear();
    const acmonth = ("0" + (date.getMonth() + 1)).slice(-2);
    const datestring = acyear + "/" + acmonth + "/" + today;
    const comic = req.params.comic;
    const comicc = comic.charAt(0).toUpperCase() + comic.slice(1);
    const year = req.params.year;
    const month = req.params.month;
    const day = req.params.day;
    const parsedPage = parse(
      await rp(
        `https://v7.comicskingdom.net/comics/${comic}/${year}-${month}-${day}`,
        options
      )
    );
    function csImage() {
      const csRaw = parsedPage.querySelector("img.img-fluid");
      const csImagee = csRaw.rawAttrs;
      const csImage = csImagee.slice(5, -20);
      renderTemplate(res, req, "king-comic.ejs", {
        day,
        acmonth,
        datestring,
        today,
        comic,
        csImage,
        month,
        year,
        comicc,
      });
    }
    setTimeout(csImage, 2000);
  } else {
    var html = "";
    renderTemplate(res, req, "signin.ejs", { html });
    console.log("We did it.");
  }
});

app.get("/load", async (req, res) => {
  if (req.user) {
    var array = [
      "amazing-spider-man",
      "arctic-circle",
      "barney-google-and-snuffy-smith",
      "beetle-bailey",
      "beetle-bailey-1",
      "between-friends",
      "bizarro",
      "blondie",
      "carpe-diem",
      "crankshaft",
      "crock",
      "curtis",
      "daddy-daze",
      "dennis-the-menace",
      "dustin",
      "edge-city",
      "flash-forward",
      "flash-gordon",
      "funky-winkerbean",
      "Funny_Online_Animals",
      "Gearhead_Gertie",
      "hagar-the-horrible",
      "hi-and-lois",
      "Intelligent",
      "judge-parker",
      "katzenjammer-kids",
      "kevin-and-kell",
      "Macanudo",
      "mallard-fillmore",
      "mandrake-the-magician-1",
      "mark-trail",
      "Marvin",
      "mary-worth",
      "moose-and-molly",
      "mother-goose-grimm",
      "mutts",
      "on-the-fastrack",
      "pardon-my-planet",
      "popeye",
      "popeyes-cartoon-club",
      "prince-valiant",
      "pros-cons",
      "rae-the-doe",
      "rex-morgan-m-d",
      "rhymes-with-orange",
      "safe-havens",
      "sales",
      "sally-forth",
      "sam-and-silo",
      "sherman-s-lagoon",
      "shoe",
      "six-chix",
      "slylock-fox-and-comics-for-kids",
      "take-it-from-the-tinkersons",
      "brilliant-mind-of-edison-lee",
      "family-circus",
      "lockhorns",
      "pajama-diaries",
      "phantom",
      "tiger",
      "tinas-groove",
      "todd-the-dinosaur",
      "zippy-the-pinhead",
      "zits",
    ];
    var term = req.query.name;
    var format = term.replace(/\s/g, "-").toLowerCase();
    if (format === "beetle-bailey") format = "beetle-bailey-1";
    if (array.includes(format)) {
      const comic = format;
      const mo = ("0" + (date.getMonth() + 1)).slice(-2);
      const datestring =
        date.getFullYear() + "/" + mo + "/" + ("0" + date.getDate()).slice(-2);
      res.redirect("/k/" + comic + "/" + datestring);
    } else {
      const parsedPage = parse(
        await rp(
          `https://www.gocomics.com/search/results?utf8=%E2%9C%93&terms=${term}`
        )
      );
      var csRawDate = parsedPage.querySelector(".content-section-sm a");
      var csDate = csRawDate;
      if (csRawDate === null) {
        res.redirect("/404/200");
        return;
      } else {
        const hellothere = csRawDate.rawAttrs;
        csDate = hellothere.slice(6, -1);
      }
      const comic = csDate;
      const parsedDate = parse(await rp(`https://www.gocomics.com/${comic}/`));
      const datestringg = parsedDate.querySelector(
        ".gc-deck.gc-deck--cta-0 a"
      ).rawAttrs;
      const datestring = datestringg.slice(55, -1);
      res.redirect(datestring);
    }
  } else {
    var html = "";
    renderTemplate(res, req, "signin.ejs", { html });
    console.log("We did it.");
  }
});

app.get("/:comic/random", async (req, res) => {
  if (req.user) {
    const comic = req.params.comic;
    const parsedPage = parse(
      await rp(`https://www.gocomics.com/random/${comic}`)
    );
    const ccsStr = parsedPage
      .querySelector(
        ".btn.btn-outline-secondary.gc-calendar-nav__datepicker.js-calendar-wrapper"
      )
      .rawAttrs.split(/ data-date=/)[1]
      .replace(/"/g, "");
    const csStr = ccsStr.slice(0, 10);
    res.redirect("/" + comic + "/" + csStr);
  } else {
    var html = "";
    renderTemplate(res, req, "signin.ejs", { html });
    console.log("We did it.");
  }
});

app.get("/tomorrow/:comic/:year/:month/:day", async (req, res) => {
  if (req.user) {
    const today = req.params.day;
    const acyear = req.params.year;
    const acmonth = req.params.month;
    const datestring = acyear + "-" + acmonth + "-" + today;
    const comic = req.params.comic;
    const parsedPage = parse(
      await rp(
        `https://licensing.andrewsmcmeel.com/features/${comic}?date=${datestring}`
      )
    );
    const csRawImage = parsedPage
      .querySelector(".text-center img")
      .rawAttrs.split(/ src=/)[1]
      .replace(/"/g, "");
    const csImage = csRawImage.slice(0, 63);
    const csRawDate = parsedPage
      .querySelector(".text-center img")
      .rawAttrs.split(/ alt=/)[1]
      .replace(/"/g, "");
    const csDate = csRawDate;
    renderTemplate(res, req, "future.ejs", { csImage, csDate, comic });
  } else {
    var html = "";
    renderTemplate(res, req, "signin.ejs", { html });
    console.log("We did it.");
  }
});

app.get("/tomorrow", async (req, res) => {
  if (req.user) {
    const comic = req.query.name;
    const smarter = parse(
      await rp(
        `https://licensing.andrewsmcmeel.com/search?q=${comic}&search_comic=&search_category=&search_start_date=&search_end_date=&search_sort_by=best_match`
      )
    );
    const actualunameee = smarter
      .querySelector("div.card.card-hover.search-item.mb-3 a")
      .rawAttrs.slice(16);
    const actualunamee = actualunameee.substring(0, 4);
    var n = actualunamee.indexOf("?");
    actualuname = actualunamee.substring(0, n != -1 ? n : s.length);
    const csDateString =
      "/" +
      date.getFullYear() +
      "/" +
      (date.getMonth() + 1) +
      "/" +
      (date.getDate() + 1);
    res.redirect("/tomorrow/" + actualuname + csDateString);
  } else {
    var html = "";
    renderTemplate(res, req, "signin.ejs", { html });
    console.log("We did it.");
  }
});

const rsses = [
  "think",
  "1-and-done",
  "2cowsandachicken",
  "ninechickweedlane",
  "9chickweedlane",
  "9-chickweed-lane-classics",
  "9to5",
  "tavicat",
  "a-problem-like-jamal",
  "adamathome",
  "adult-children",
  "agnes",
  "aj-and-magnus",
  "algoodwyn",
  "alis-house",
  "alley-oop",
  "amanda-the-great",
  "amazing-spider-man",
  "american-chop-suey",
  "andertoons",
  "andycapp",
  "angry-birds",
  "angry-little-girls",
  "animalcrackers",
  "annie",
  "apartment-3-g_1",
  "archie",
  "arcticcircle",
  "arloandjanis",
  "artbymoga",
  "ask-a-cat",
  "ask-a-portly-syndicate-person",
  "askshagg",
  "at-the-zoo",
  "aunty-acid",
  "bc",
  "babyblues",
  "baby-trump",
  "backintheday",
  "back-to-bc",
  "bacon",
  "bad-machinery",
  "badreporter",
  "badlands",
  "baldo",
  "ballardstreet",
  "banana-triangle",
  "barkeaterlake",
  "barneyandclyde",
  "barney-google-and-snuffy-smith",
  "barney-google-and-snuffy-smith-1",
  "barneygoogle",
  "basicinstructions",
  "batch-rejection",
  "beanie-the-brownie",
  "bear-with-me",
  "beardo",
  "beetlebailey",
  "beetle-bailey-1",
  "ben",
  "bent-objects",
  "berger-and-wyse",
  "berkeley-mews",
  "betty",
  "betweenfriends",
  "Beware-of-Toddler",
  "bewley",
  "bfgf-syndrome",
  "biff-and-riley",
  "big-ben-bolt",
  "big-ben-bolt-sundays",
  "bignate",
  "big-nate-first-class",
  "bigtop",
  "biographic",
  "bird-and-moon",
  "birdbrains",
  "bizarro",
  "bleeker",
  "bliss",
  "blondie",
  "bloomcounty",
  "bonanas",
  "bobgorrell",
  "Show-Me-The-Funny",
  "Show-Me-The-Funny-Pets",
  "bob-the-angry-flower",
  "bobthesquirrel",
  "boners-ark",
  "boners-ark-sundays",
  "boomerangs",
  "bottomliners",
  "boundandgagged",
  "bozo",
  "brain-squirts",
  "break-of-day",
  "breaking-cat-news",
  "brevity",
  "brewsterrockit",
  "brian-duffy",
  "brian-mcfadden",
  "brick-bradford",
  "brilliantmindofedisonlee",
  "bringing-up-father",
  "broomhilda",
  "buckles",
  "bully",
  "buni",
  "bushy-tales",
  "buz-sawyer",
  "cestlavie",
  "calvinandhobbes",
  "candorville",
  "captionit",
  "carpediem",
  "cats-cafe",
  "little-moments-of-love",
  "cathy",
  "cathy-commiserations",
  "cattitude-doggonit",
  "chanlowe",
  "cheap-thrills-cuisine",
  "cheer-up-emo-kid",
  "chipbok",
  "chrisbritt",
  "chuck-draws-things",
  "chucklebros",
  "citizendog",
  "claw",
  "claybennett",
  "clayjones",
  "clearbluewater",
  "cleats",
  "closetohome",
  "committed",
  "compu-toon",
  "connie-to-the-wonnie",
  "cornered",
  "cowandboy",
  "cowtown",
  "crabgrass",
  "crankshaft",
  "crock",
  "crumb",
  "culdesac",
  "cursed-forever",
  "curses",
  "curtis",
  "daddydaze",
  "daddyshome",
  "danwasserman",
  "danasummers",
  "darksideofthehorse",
  "darrin-bell",
  "david-m-hitch",
  "day-by-dave",
  "deep-dark-fears",
  "deflocked",
  "dennisthemenace",
  "diamondlil",
  "dicktracy",
  "dilbert",
  "dilbert-classics",
  "thedinetteset",
  "dinosaur-comics",
  "dogeatdoug",
  "dogsofckennel",
  "domesticabuse",
  "doodle-for-food",
  "doodle-diary",
  "doodle-town",
  "doonesbury",
  "dorris-mccomics",
  "drabble",
  "dragon-girl",
  "drewsheneman",
  "drive",
  "dudedude",
  "dumbwich-castle",
  "dustin",
  "ed-gamble",
  "edge-city",
  "edge-of-adventure",
  "eek",
  "emmy-lou",
  "endtown",
  "eric-allie",
  "eric-the-circle",
  "everyday-people-cartoons",
  "eyebeam",
  "eyebeam-classic",
  "fminus",
  "facesinthenews",
  "false-knees",
  "familycircus",
  "familytree",
  "farcus",
  "fat-cats",
  "flash-forward",
  "flash-gordon",
  "flash-gordon-1",
  "flash-gordon-sundays",
  "floandfriends",
  "foolish-mortals",
  "forbetterorforworse",
  "forheavenssake",
  "fortknox",
  "four-eyes",
  "fowl-language",
  "foxtrot",
  "foxtrotclassics",
  "francis",
  "frank-and-ernest",
  "frazz",
  "fredbasset",
  "freerange",
  "freshlysqueezed",
  "frogapplause",
  "funky-winkerbean",
  "funky-winkerbean-sundays",
  "funky-winkerbean-1",
  "Funny-Online-Animals",
  "g-man-webcomics",
  "garfield",
  "garfield-classics",
  "garfieldminusgarfield",
  "garymarkstein",
  "garyvarvel",
  "gasolinealley",
  "Gearhead-Gertie",
  "geech",
  "gentle-creatures",
  "getalife",
  "getfuzzy",
  "gil",
  "gilthorp",
  "gingermeggs",
  "glasbergen-cartoons",
  "globetrotter",
  "gnome-syndicate",
  "goats",
  "fan-art",
  "graffiti",
  "grand-avenue",
  "gray-matters",
  "green-humour",
  "hagarthehorrible",
  "haikuewe",
  "haircut-practice",
  "half-full",
  "half-full-espanol",
  "ham-shears",
  "harley",
  "healthcapsules",
  "heart-of-juliet-jones",
  "heart-of-juliet-jones-sundays",
  "heartofthecity",
  "heathcliff",
  "henrypayne",
  "herbandjamaal",
  "herman",
  "herman-en-espanol",
  "hiandlois",
  "hi-and-lois-1",
  "homeandaway",
  "homefree",
  "hot-comics-for-cool-people",
  "how-to-cat",
  "hubris",
  "human-cull",
  "humorme",
  "hutch-owen",
  "ice-cream-sandwich-comics",
  "imaginethis",
  "imogen-quest",
  "in-security",
  "inthebleachers",
  "inthesticks",
  "inkpen",
  "inspector-dangers-crime-quiz",
  "Intelligent",
  "invisible-bread",
  "itsallaboutyou",
  "jackohman",
  "jake-likes-onions",
  "janesworld",
  "jeffdanziger",
  "jeffstahler",
  "jen-sorensen",
  "jerryholbert",
  "humorcartoon",
  "jerry-king-comics",
  "jetpack-jr",
  "jim-benton-cartoons",
  "jimmorin",
  "jimsjournal",
  "jimmy-margulies",
  "joe-heller",
  "joevanilla",
  "joelpett",
  "joey-alison-sayers-comics",
  "john-branch",
  "johndeering",
  "johnny-hazard",
  "judge-parker",
  "judge-parker-1",
  "jumpstart",
  "jungle-jim-sundays",
  "junk-drawer",
  "just-say-uncle",
  "katzenjammer-kids",
  "katzenjammer-kids-sundays",
  "kencatalino",
  "kevin-and-kell",
  "kal",
  "kevinkallaugher",
  "kevin-necessary-editorial-cartoons",
  "kid-beowulf",
  "kid-shay-comics",
  "kidspot",
  "kidtown",
  "king-of-the-royal-mounted",
  "kirk-walters",
  "kitncarlyle",
  "kitchen-capers",
  "kliban",
  "klibans-cats",
  "krazy-kat",
  "lacucaracha",
  "laloalcaraz",
  "lards-world-peace-tips",
  "lastkiss",
  "laughing-redhead-comics",
  "lay-lines",
  "learn-to-speak-cat",
  "lee-judge",
  "legalization-nation",
  "Legend-of-Bill",
  "legends-in-the-heights",
  "lil-abner",
  "libertymeadows",
  "life-on-earth",
  "lil-donnie",
  "lio",
  "lisabenson",
  "littledoglost",
  "little-fried-chicken-and-sushi",
  "little-iodine-sundays",
  "little-nemo",
  "liz-climo-cartoons",
  "lola",
  "long-story-short",
  "looks-good-on-paper",
  "looseparts",
  "lostsheep",
  "lostsideofsuburbia",
  "luann",
  "luann-againn",
  "luckycow",
  "lug-nuts",
  "lukey-mcgarrys-tldr",
  "lunarbaboon",
  "m2bulls",
  "macanudo",
  "magicinaminute",
  "magnificatz",
  "maintaining",
  "making-it",
  "mallardfillmore",
  "mandrake-the-magician",
  "mandrake-the-magician-1",
  "mandrake-the-magician-sundays",
  "mannequin-on-the-moon",
  "mara-llave-keeper-of-time",
  "marias-day",
  "mark-trail",
  "Mark-Trail-Vintage",
  "marmaduke",
  "marshallramsey",
  "marvin",
  "mary-worth",
  "masterstrokes",
  "matt-bors",
  "mattdavies",
  "mattwuerker",
  "mazetoons-puzzle",
  "medium-large",
  "meg-classics",
  "mercworks",
  "messy-cow",
  "mexikid-stories",
  "michael-andrew",
  "michaelramirez",
  "microcosm",
  "mike-beckom",
  "mike-du-jour",
  "mike-lester",
  "mikeluckovich",
  "mike-peters",
  "mike-shelton",
  "mike-smith",
  "minimumsecurity",
  "miss-peach",
  "mo",
  "moderately-confused",
  "moms-cancer",
  "momma",
  "monty",
  "moose-and-molly",
  "mother-goose-grimm",
  "mother-goose-and-grimm",
  "motley-classics",
  "mr-lowe",
  "mtpleasant",
  "mustard-and-boloney",
  "muttandjeff",
  "mutts",
  "mycage",
  "my-dad-is-dracula",
  "mythtickle",
  "nancy",
  "nancy-classics",
  "nestheads",
  "neurotica",
  "thenewadventuresofqueenvictoria",
  "next-door-neighbors",
  "nick-and-zuzu",
  "nickanderson",
  "nonsequitur",
  "not-invented-here",
  "nothing-is-not-something",
  "now-recharging",
  "offthemark",
  "office-hours",
  "oh-brother",
  "Olive-Popeye",
  "ollie-and-quentin",
  "onaclaireday",
  "on-the-fastrack",
  "onebighappy",
  "ordinary-bill",
  "origins-of-the-sunday-comics",
  "our-super-adventure",
  "outofthegenepool",
  "outland",
  "overthehedge",
  "overboard",
  "ozy-and-millie",
  "pardon-my-planet",
  "patoliphant",
  "paulszep",
  "pcandpixel",
  "peanuts",
  "peanuts-begins",
  "pearlsbeforeswine",
  "pedroxmolina",
  "perry-bible-fellowship",
  "petunia-and-dre",
  "phil-hands",
  "phoebe-and-her-unicorn",
  "pibgorn",
  "pibgornsketches",
  "pickles",
  "pictures-in-boxes",
  "pie-comic",
  "pinkerton",
  "pirate-mike",
  "please-keep-warm",
  "please-listen-to-me",
  "pluggers",
  "poochcafe",
  "poorcraft",
  "poorly-drawn-lines",
  "pop-culture-shock-therapy",
  "popeye",
  "popeyes-cartoon-club",
  "poptropica",
  "pot-shots",
  "preteena",
  "pricklycity",
  "prince-valiant",
  "prince-valiant-sundays",
  "promises-promises",
  "pros-cons",
  "questionable-quotebook",
  "quincy",
  "rabbitsagainstmagic",
  "radio-patrol",
  "rae-the-doe",
  "raising-duncan",
  "randolphitch",
  "reallifeadventures",
  "realitycheck",
  "rebecca-hendin",
  "redandrover",
  "redmeat",
  "replyall",
  "reply-all-lite",
  "rex-morgan-m-d",
  "rhymeswithorange",
  "richards-poor-almanac",
  "riphaywire",
  "rip-kirby",
  "ripleysbelieveitornot",
  "robrogers",
  "robbie-and-bobby",
  "robert-ariail",
  "rosa-dominical",
  "roseisrose",
  "rosebuds",
  "rosebuds-en-espanol",
  "rubes",
  "rudypark",
  "rugrats",
  "safe-havens",
  "sales",
  "sally-forth",
  "salt-n-pepper",
  "sam-and-silo",
  "sarahs-scribbles",
  "saturday-morning-breakfast-cereal",
  "savage-chickens",
  "scarygary",
  "scenes-from-a-multiverse",
  "scottstantis",
  "secret-agent-x-9",
  "sheldon",
  "shen-comix",
  "shermanslagoon",
  "shirley-and-son-classics",
  "shoe",
  "shoecabbage",
  "shortcuts",
  "shrimpandgrits",
  "shutterbug-follies",
  "signewilkinson",
  "six-chix",
  "sketchshark-comics",
  "sketchy-chics",
  "skinhorse",
  "skippy",
  "slylock-fox-and-comics-for-kids",
  "small-potatoes",
  "snow-sez",
  "snowflakes",
  "spectickles",
  "speechless",
  "speedbump",
  "spirit-of-the-staircase",
  "spot-the-frog",
  "starling",
  "stevebenson",
  "stevebreen",
  "stevekelley",
  "sticky-comics",
  "stonesoup",
  "stone-soup-classics",
  "strangebrew",
  "stuartcarlson",
  "studio-jantze",
  "sunny-street",
  "sunshine-state",
  "super-fun-pak-comix",
  "swan-eaters",
  "sweet-and-sour-pork",
  "sylvia",
  "takeitfromthetinkersons",
  "tankmcnamara",
  "tarzan",
  "ted-rall",
  "ten-cats",
  "tex",
  "texts-from-mittens",
  "that-is-priceless",
  "that-new-carl-smell",
  "thats-life",
  "thatababy",
  "academiawaltz",
  "the-adventures-of-business-cat",
  "theargylesweater",
  "the-awkward-yeti",
  "thebarn",
  "the-bent-pinky",
  "the-best-medicine",
  "thebigpicture",
  "boondocks",
  "the-born-loser",
  "thebuckets",
  "thecity",
  "the-comic-strip-that-has-a-finale-every-day",
  "the-conjurers",
  "the-creeps",
  "the-daily-drawing",
  "dinetteset",
  "thedoozies",
  "duplex",
  "theelderberries",
  "theflyingmccoys",
  "thefortuneteller",
  "thefuscobrothers",
  "the-gentlemans-armchair",
  "thegrizzwells",
  "humble-stumble",
  "thekchronicles",
  "theknightlife",
  "the-last-mechanical-monster",
  "leftyboscopictureshow",
  "the-little-king",
  "lockhorns",
  "thelockhorns",
  "the-lost-bear",
  "the-martian-confederacy",
  "meaningoflila",
  "the-middle-age",
  "themiddletons",
  "the-norm-4-0",
  "thenorm",
  "theothercoast",
  "the-other-end",
  "pajama-diaries",
  "phantom",
  "phantom-1",
  "phantom-sundays",
  "the-pigeon-gazette",
  "the-quixote-syndrome",
  "the-sunshine-club",
  "upside-down-world-of-gustave-verbeek",
  "the-wandering-melon",
  "the-worried-well",
  "the-worst-thing-ive-ever-done",
  "thimble-theater",
  "thinlines",
  "tiger",
  "tiger-1",
  "tiger-sundays",
  "tim-campbell",
  "tim-eagan",
  "tina-s-groove",
  "tinysepuku",
  "toby",
  "todays-szep",
  "todd-the-dinosaur",
  "tom-stiglich",
  "tomthedancingbug",
  "tomtoles",
  "toomuchcoffeeman",
  "tough-town",
  "trivquiz",
  "truth-facts",
  "two-party-opera",
  "us-acres",
  "uncleartsfunland",
  "underpants-and-overbites",
  "understanding-chaos",
  "unstrange-phenomena",
  "up-and-out",
  "viewsoftheworld",
  "viewsafrica",
  "viewsamerica",
  "viewsasia",
  "viewsbusiness",
  "viewseurope",
  "viewslatinamerica",
  "viewsmideast",
  "viivi-and-wagner",
  "wtduck",
  "wallace-the-brave",
  "walthandelsman",
  "warped",
  "watchyourhead",
  "wawawiwa",
  "waynovision",
  "we-the-robots",
  "webcomic-name",
  "weepals",
  "whyatt-cartoons",
  "widdershins",
  "wide-open",
  "drewlitton",
  "winston",
  "witoftheworld",
  "wizardofid",
  "wizard-of-id-classics",
  "wondermark",
  "working-daze",
  "workingitout",
  "world-of-wonder",
  "worry-lines",
  "wrong-hands",
  "wumo",
  "yaffle",
  "yesimhotinthis",
  "zackhill",
  "zen-pencils",
  "ziggy",
  "zippy-the-pinhead",
  "zits",
];

app.get("/sumload", (req, res) => {
  var name = req.query.load;
  if (req.query.ask) {
    var LevenshteinArray = require("levenshtein-array");
    var leven = LevenshteinArray(rsses, req.query.ask);
    var w = leven[0].w;
    res.redirect("https://comicserver.org/edit?url=" + w);
  } else {
    var LevenshteinArray = require("levenshtein-array");
    var leven = LevenshteinArray(rsses, name);
    var w = leven[0].w;
    res.redirect("https://comicserver.org/?summary=" + w);
  }
});

app.use((req, res, next) => {
  renderTemplate(res, req, "error.ejs");
});

app.listen(3000);
