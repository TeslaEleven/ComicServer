
  // We import modules.
const path = require("path");
const express = require("express");
const config = require("../config");
const ejs = require("ejs");
const fs = require('fs'); 
const bodyParser = require("body-parser");
const { parse } = require("node-html-parser");
const rp = require("request-promise-native");
const { htmlToText } = require('html-to-text');
const r = require("request");
const axios = require("axios");
let ts = Date.now();
let da = new Date(ts);
utc = da.getTime() + (da.getTimezoneOffset() * 60000);
offset = -6;
const date = new Date(utc + (3600000*offset));
const app = express();
const nodeFip = require('node-fip')
app.use(nodeFip({
    mode: 'whitelist',
    proxy: false,
    ips: [process.env.IP1]
}))
// We export the dashboard as a function which we call in ready event.
module.exports = async (client) => {
  // We declare absolute paths.
  const dataDir = path.resolve(`${process.cwd()}${path.sep}webapp`); // The absolute path of current this directory.
  const templateDir = path.resolve(`${dataDir}${path.sep}templates`); // Absolute path of ./templates directory.

  // Deserializing and serializing users without any additional logic.
  // Validating the url by creating a new instance of an Url then assign an object with the host and protocol properties.
  // If a custom domain is used, we take the protocol, then the hostname and then we add the callback route.
  // Ex: Config key: https://localhost/ will have - hostname: localhost, protocol: http
  
  var callbackUrl;
  var domain;
  
  try {
    const domainUrl = new URL(config.domain);
    domain = {
      host: domainUrl.hostname,
      protocol: domainUrl.protocol
    };
  } catch (e) {
    console.log(e);
    throw new TypeError("Invalid domain specific in the config file.");
  }
  
  if (config.usingCustomDomain) {
    callbackUrl =  `${domain.protocol}//${domain.host}/callback`
  } else {
    callbackUrl = `${domain.protocol}//${domain.host}${config.port == 80 ? "" : `:${config.port}`}/callback`;
  }
  
  // This line is to inform users where the system will begin redirecting the users.
  // And can be removed.
  console.log(" Starting Dashboard...");

  // We bind the domain.
  app.locals.domain = config.domain.split("//")[1];

  // We set out templating engine.
  app.engine("html", ejs.renderFile);
  app.set("view engine", "html");

  // We initialize body-parser middleware to be able to read forms.
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));

  
  // We host all of the files in the assets using their name in the root address.
  // A style.css file will be located at http://<your url>/style.css
  // You can link it in any template using src="/assets/filename.extension"
  app.use("/", express.static(path.resolve(`${dataDir}${path.sep}assets`)));
  
  // We declare a renderTemplate function to make rendering of a template in a route as easy as possible.
  const renderTemplate = (res, req, template, data = {}) => {
    // Default base data which passed to the ejs template by default. 
    const baseData = {
      bot: 'notneeded',
      path: 'notneeded',
      user: 'notneeded'
    };
    // We render template using the absolute path of the template and the merged default data with the additional data provided.
    res.render(path.resolve(`${templateDir}${path.sep}${template}`), Object.assign(baseData, data));
  };

  // Index endpoint.
  app.get("/", (req, res) => {
    renderTemplate(res, req, "index.ejs");
  });

  app.get("/tomorrow/:comic", async (req, res) => {
   const today = date.getDate() + 1;
   const acyear = date.getFullYear();
   const acmonth = ("0" + (date.getMonth() + 1)).slice(-2);
   const datestring = acyear + "-" + acmonth + "-" + today;
   const comic = req.params.comic;
   const parsedPage = parse(await rp(`https://licensing.andrewsmcmeel.com/features/${comic}?date=${datestring}`))
   const csRawImage = parsedPage.querySelector(".text-center img").rawAttrs.split(/ src=/)[1].replace(/"/g, "");
   const csImage = csRawImage.slice(0, 63)
   const csRawDate = parsedPage.querySelector(".text-center img").rawAttrs.split(/ alt=/)[1].replace(/"/g, "");
   const csDate = csRawDate;
   renderTemplate(res, req, "future.ejs", { csImage, csDate });
  });

  app.get("/embed/:comic/:year/:month/:day", async (req, res) => {
    const today = date.getDate();
    const acyear = date.getFullYear();
    const acmonth = ("0" + (date.getMonth() + 1)).slice(-2);
    const datestring = acyear + "/" + acmonth + "/" + today;
    const pass = process.env.AUTH;
    const comic = req.params.comic;
    const year = req.params.year;
    const month = req.params.month;
    const day = req.params.day;
    const parsedPage = parse(await rp(`https://www.gocomics.com/${comic}/${year}/${month}/${day}`)
        .catch(err => {
            console.log("Request failed\n", err);
        })
    )
   const csImage = parsedPage.querySelector(".item-comic-image img").rawAttrs.split(/ src=/)[1].replace(/"/g, "");
   const csRawDate = parsedPage.querySelector(".item-comic-image img").rawAttrs.split(/ alt=/)[1].replace(/"/g, "");
   const csDate = csRawDate.slice(0, -70);
   const prev = day - 1;
   const next = prev + 2;
   const csRawParamsStart = parsedPage.querySelector(".btn.btn-outline-secondary.gc-calendar-nav__datepicker.js-calendar-wrapper").rawAttrs.split(/ data-start=/)[1].replace(/"/g, "");
   const csParamsStart = csRawParamsStart.slice(0, -63)
   const csStartFormatted = csParamsStart.slice(0, 4)
  const csRawParamsEnd = parsedPage.querySelector(".btn.btn-outline-secondary.gc-calendar-nav__datepicker.js-calendar-wrapper").rawAttrs.split(/ data-end=/)[1].replace(/"/g, "");
  const csParamsEnd = csRawParamsEnd.slice(0, -32)
  const csEndFormatted = csParamsEnd.slice(0, 4)
 const csTest = parsedPage.querySelector(".gc-calendar-nav__next a").rawAttrs.split(/ href=/)[1].replace(/"/g, "");
 const csLength = comic.length + 3;
 const csStr = csTest.slice(csLength, -78)
 const csTestTwo = parsedPage.querySelector(".gc-calendar-nav__previous a.js-previous-comic").rawAttrs.split(/ href=/)[1].replace(/"/g, "");
  const csStrPrev = csTestTwo.slice(csLength, -95)
  const nextstring = csStr;
  const prevstring = csStrPrev;
  renderTemplate(res, req, "static.ejs", { csStartFormatted, prevstring, nextstring, csEndFormatted, csParamsStart, csParamsEnd, day, acmonth, datestring, today, comic, csDate, csImage, prev, next, month, year, pass});
  });

    app.get("/comic/:comic/:year/:month/:day", async (req, res) => {
    const today = date.getDate();
    const acyear = date.getFullYear();
    const acmonth = ("0" + (date.getMonth() + 1)).slice(-2);
    const datestring = acyear + "/" + acmonth + "/" + today;
    const pass = process.env.AUTH;
    const comic = req.params.comic;
    const year = req.params.year;
    const month = req.params.month;
    const day = req.params.day;
    const parsedPage = parse(await rp(`https://www.gocomics.com/${comic}/${year}/${month}/${day}`)
        .catch(err => {
            console.log("Request failed\n", err);
        })
    )
   const csImage = parsedPage.querySelector(".item-comic-image img").rawAttrs.split(/ src=/)[1].replace(/"/g, "");
   const csRawDate = parsedPage.querySelector(".item-comic-image img").rawAttrs.split(/ alt=/)[1].replace(/"/g, "");
   const csDate = csRawDate.slice(0, -70);
   const prev = day - 1;
   const next = prev + 2;
   const csRawParamsStart = parsedPage.querySelector(".btn.btn-outline-secondary.gc-calendar-nav__datepicker.js-calendar-wrapper").rawAttrs.split(/ data-start=/)[1].replace(/"/g, "");
   const csParamsStart = csRawParamsStart.slice(0, -63)
   const csStartFormatted = csParamsStart.slice(0, 4)
  const csRawParamsEnd = parsedPage.querySelector(".btn.btn-outline-secondary.gc-calendar-nav__datepicker.js-calendar-wrapper").rawAttrs.split(/ data-end=/)[1].replace(/"/g, "");
  const csParamsEnd = csRawParamsEnd.slice(0, -32)
  const csEndFormatted = csParamsEnd.slice(0, 4)
 const csTest = parsedPage.querySelector(".gc-calendar-nav__next a").rawAttrs.split(/ href=/)[1].replace(/"/g, "");
 const csLength = comic.length + 3;
 const csStr = csTest.slice(csLength, -78)
 const csTestTwo = parsedPage.querySelector(".gc-calendar-nav__previous a.js-previous-comic").rawAttrs.split(/ href=/)[1].replace(/"/g, "");
  const csStrPrev = csTestTwo.slice(csLength, -95)
  const nextstring = csStr;
  const prevstring = csStrPrev;
  const csRaw = parsedPage.querySelector("div.comic__transcript-container.js-comic-transcript.collapse p");
  const csTranscript = htmlToText(csRaw, {
  wordwrap: 130
  });
  renderTemplate(res, req, "comic.ejs", { csStartFormatted, prevstring, nextstring, csEndFormatted, csParamsStart, csParamsEnd, day, acmonth, datestring, today, comic, csDate, csImage, prev, next, month, year, pass, csTranscript});
  });

    app.get("/search/:comic/:term", async (req, res) => {
  const pass = process.env.AUTH;
  const term = req.params.term;
  const comic = req.params.comic;
    const parsedPage = parse(await rp(`https://www.gocomics.com/search/${comic}?utf8=%E2%9C%93&terms=${term}`)
        .catch(err => {
            console.log("Request failed\n", err);
        })
    )
  const csRawLink = parsedPage.querySelector("div.comic__image a").rawAttrs.split(/ href=/)[1].replace(/"/g, "");
  const csSlice = comic.length + 6;
  const csLink = csRawLink.slice(0, -csSlice);
  const csImage = parsedPage.querySelector(".item-comic-image img").rawAttrs.split(/ src=/)[1].replace(/"/g, "");
  const csRawDate = parsedPage.querySelector(".item-comic-image img").rawAttrs.split(/ alt=/)[1].replace(/"/g, "");
   const csDate = csRawDate.slice(0, -70)
   renderTemplate(res, req, "search.ejs", { csLink, term, comic, csDate, csImage, pass});
  });

  app.get("/search/:term", async (req, res) => {
  const pass = process.env.AUTH;
  const term = req.params.term;
      const parsedPage = parse(await rp(`https://www.gocomics.com/search/results?utf8=%E2%9C%93&terms=${term}`)
        .catch(err => {
            console.log("Request failed\n", err);
        })
    )
  const csRawLink = parsedPage.querySelector("div.comic__image a").rawAttrs.split(/ href=/)[1].replace(/"/g, "");
  const csLink = csRawLink.replace(" ", "?");
  const csImage = parsedPage.querySelector(".item-comic-image img").rawAttrs.split(/ src=/)[1].replace(/"/g, "");
  const csRawDate = parsedPage.querySelector(".item-comic-image img").rawAttrs.split(/ alt=/)[1].replace(/"/g, "");
   const csDate = csRawDate.slice(0, -70);
   renderTemplate(res, req, "global.ejs", { csLink, term, csDate, csImage, pass});
  });

  app.get("/comic/:comic", async (req, res) => {
  const pass = process.env.AUTH;
  const comic = req.params.comic;
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const acmonth = date.getMonth() + 1;
    const day = date.getDate();
    const today = date.getDate();
    const datestring = year + "/" + month + "/" + day;
    const parsedPage = parse(await rp(`https://www.gocomics.com/${comic}/${year}/${month}/${day}`)
        .catch(err => {
            console.log("Request failed\n", err);
        })
    )
   const csImage = parsedPage.querySelector(".item-comic-image img").rawAttrs.split(/ src=/)[1].replace(/"/g, "");
   const csRawDate = parsedPage.querySelector(".item-comic-image img").rawAttrs.split(/ alt=/)[1].replace(/"/g, "");
   const csDate = csRawDate.slice(0, -70)
  const csRawParamsStart = parsedPage.querySelector(".btn.btn-outline-secondary.gc-calendar-nav__datepicker.js-calendar-wrapper").rawAttrs.split(/ data-start=/)[1].replace(/"/g, "");
   const csParamsStart = csRawParamsStart.slice(0, -63)
   const csStartFormatted = csParamsStart.slice(0, 4)
  const csRawParamsEnd = parsedPage.querySelector(".btn.btn-outline-secondary.gc-calendar-nav__datepicker.js-calendar-wrapper").rawAttrs.split(/ data-end=/)[1].replace(/"/g, "");
  const csParamsEnd = csRawParamsEnd.slice(0, -32)
  const csEndFormatted = csParamsEnd.slice(0, 4)
 const csTest = parsedPage.querySelector(".gc-calendar-nav__next a").rawAttrs.split(/ href=/)[1].replace(/"/g, "");
 const csLength = comic.length + 3;
 const csStr = csTest.slice(csLength, -78)
 const csTestTwo = parsedPage.querySelector(".gc-calendar-nav__previous a.js-previous-comic").rawAttrs.split(/ href=/)[1].replace(/"/g, "");
  const csStrPrev = csTestTwo.slice(csLength, -95)
  const nextstring = csStr;
  const prevstring = csStrPrev;
  const csRaw = parsedPage.querySelector("div.comic__transcript-container.js-comic-transcript.collapse p");
  const csTranscript = htmlToText(csRaw, {
  wordwrap: 130
  });
  renderTemplate(res, req, "comic.ejs", { prevstring, nextstring, csParamsStart, csStartFormatted, csEndFormatted, csParamsEnd, day, acmonth, datestring, today, month, year, comic, csDate, csImage, pass, csTranscript});
  });
  
  app.get("/comic/:comic/random", async (req, res) => {
  const comic = req.params.comic;
  const parsedPage = parse(await rp(`https://www.gocomics.com/random/${comic}`))
  const ccsStr = parsedPage.querySelector(".btn.btn-outline-secondary.gc-calendar-nav__datepicker.js-calendar-wrapper").rawAttrs.split(/ data-date=/)[1].replace(/"/g, "");
  const csStr = ccsStr.slice(0, -255)
  res.redirect("https://csApp.wel3com.repl.co/comic/" + comic + "/" + csStr)
  });

  app.get("*", (req, res) => {
    renderTemplate(res, req, "redir.ejs");
  });

  app.listen(config.port, null, null, () => console.log(`Webapp has started on port ${config.port}.`));
};
