const express = require('express')
const nodemailer = require("nodemailer");
const path = require('path')
const Database = require("@replit/database")
const db = new Database()
const { parse } = require('rss-to-json');
var cors = require('cors');
var app = express();
app.use(cors());
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
const ejs = require('ejs')
const ms = require('ms')
const rp = require('request-promise')
const schedule = require('node-schedule');
app.use(express.json());

const transporter = nodemailer.createTransport({
  host: 'smtp.mail.me.com',
  port: 587,
  auth: {
    user: process.env.MAILE,
    pass: process.env.NDPASS
  }
});

const port = 3500

// Greeting List
const items = ["Hi there!","Hey, how's it going?","How are you doing?","Wassup?","What's cracking?","Greetings, Earthling!","Howdy-do!","Salutations, my friend.", "Hiya!","Nice to meet you.","Hey, what's happening?","What's happening, captain?","How's life treating you?","Top of the morning to you!","Ahoy, matey!","Hi-de-ho!","What's the good word?","Good to see you!","How goes it?","Hey, partner!","Howdy, y'all!","Well, hello there!","Hey, howdy, hey!","What's the buzz?","Long time no see!","G'day, mate!","Hi, ho, Silver!","Aloha, amigos!","How's everything?","Greetings from Hollywood!","Pleasure to make your acquaintance.","What's the scoop?","Welcome, welcome, welcome!","Live long and prosper","Greetings and salutations","Hello there","What's up, doc?","Cowabunga!","Make it so","Everything is awesome!","Namaste","Aloha","Yo","Hakuna Matata","Bazinga!","You shall not pass!","Howdy","Good day","G'day mate","Bonjour","Hola","Hello World!","Sup"]
app.get('/',  (req, res) => {
if(req.headers.referer === "https://comicserver.org/") {
ejs.renderFile(__dirname + "/templates/csa.ejs", function(err, str){
    res.send(str)
})
} else {
res.sendStatus(200)
}
})

app.get('/fav.png', function (req, res) {
  res.sendFile(__dirname + '/dailycore.png');
})

app.post('/', async (req, res) => {
  var body = req.body
  const email = body.username
  const favs = "[ " + body.password + " ]"
  db.set(email, favs).then(() => { });
  db.get("emails").then(value => {
    var list = value
    if (list === '[]') {
      list = JSON.parse(value)
      list.push(email)
      db.set("emails", list).then(() => { res.status(200).send('Done!'); confirmationMail(email) });
    } else {
      list.push(email)
      db.set("emails", list).then(() => { res.status(200).send('Done!'); confirmationMail(email) });
    }
  });
})

Array.prototype.removeByValue = function (val) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] === val) {
      this.splice(i, 1);
      i--;
    }
  }
  return this;
}

function confirmationMail(email) {
ejs.renderFile(__dirname + "/templates/confirmation.ejs", {email: email}, function (err, data) {
if (err) {
console.log(err);
} else {
const mainOptions = {
from: '"ComicServer Daily" <daily@comicserver.org>',
to: email,
subject: "Hey there!",
text: "Welcome to Daily!",
html: data,
headers: { 'x-myheader': 'test header' }
};
transporter.sendMail(mainOptions, (err, info) => {
if (err) {
console.log(err);
} else {
console.log('Confimation mail sent to ' + email);
}
});
}
})
}

app.get('/sheet', async (req, res) => {
  var rss = req.query.url;
  db.get(rss).then(value => {res.send(value)})
});

app.post('/import', async (req, res) => {
    if(req.headers['csclient'] === "app") {
        db.set(req.headers.uname, req.body)
      console.log('Added ' + req.body)
    } else {
    res.sendStatus(403)
    }
});


app.get('/rss', async (req, res) => {
(async () => {
  var rss = await parse(req.query.url);
  res.send(rss);
})();
});

const refr = new schedule.RecurrenceRule();
refr.tz = 'America/Chicago';
refr.hour = 07;
refr.minute = 45;
schedule.scheduleJob(refr, async function(){
await rp('https://comicserver.org/reqsync').then(data => { console.log('req-ed (should respond with didstuff) ' + data) })
});

const refresh = new schedule.RecurrenceRule();
refresh.tz = 'America/Chicago';
refresh.hour = 07;
refresh.minute = 50;
schedule.scheduleJob(refresh, function(){
startProcess()
});

const refreshreboot = new schedule.RecurrenceRule();
refreshreboot.tz = 'America/Chicago';
refreshreboot.hour = 07;
refreshreboot.minute = 55;
schedule.scheduleJob(refreshreboot, function(){
startProcess()
});

const start = new schedule.RecurrenceRule();
start.tz = 'America/Chicago';
start.hour = 08;
start.minute = 00;
schedule.scheduleJob(start, function(){
startMail()
});

function startProcess() {
 var itemsProcessed = 0;
 db.list().then(keys => {
  keys.forEach(startKeys)
 })
 var comics = []
 function startKeys(index, item) {
    if(index.includes('@')) {
    db.get(index).then(value =>{
    if(typeof value === "string") {
    var arr = JSON.parse(value)
    ofNo(arr)
    } else {
    ofNo(value)
    }
    function ofNo(arr) {
    comics = comics.concat(arr)
    db.get('emails').then(num => {
    itemsProcessed++
    if(itemsProcessed === num.length) {
      const lower = comics.map(element => {
  return element.replace(/\s/g, "").toLowerCase();
});
     var uniqueArray = lower.filter(function(item, pos) {
    return lower.indexOf(item) == pos;
})
startDoing(uniqueArray)  
console.log(uniqueArray)
    }
    })
    }
    })
    }
    }
}

function startDoing(comics) {
comics.forEach(async function(item, index) {
var urll = "https://ComicServer-Daily.comicserver.repl.co/rss?url=https://www.comicsrss.com/rss/" + item + ".rss";
var url = urll.replace(/\s/g, "").toLowerCase();
await rp(url).then(async (data) => {
var obj = JSON.parse(data)
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const div = new JSDOM(obj.items[0].description);
const croppedcdata = div.window.document.querySelector("img").src
const title = obj.items[0].title
const [actualTitle] = title.split(' by');
const doc = `<a style="margin:0;padding:none;font-size:1.5em;padding-bottom:1%;text-decoration:none;color:#405685" href="https://comicserver.org/?summary=${actualTitle}">${actualTitle}</a><div style="width:auto;margin-left: auto;margin-right: auto;"><img style="width: 100%;margin-left:auto;margin-right:auto" src="${croppedcdata}"/><br><br>`
db.set(item, doc)
})
})
console.log('Fully Refreshed!')
}

function startMail() {
db.get("emails").then(hehe => {
const override = hehe
override.forEach(secondFunc)
function secondFunc(item, index) {
db.get(item).then(evars => {
if(typeof evars === "string") {
var vars = JSON.parse(evars)
} else {
var vars = evars
}
var itemsProcessed = 0;
var doc = ""
vars.forEach(thirdFunc)
function thirdFunc(comic, index) {
db.get(comic.replace(/\s/g,"").toLowerCase()).then(html => {
doc += html
itemsProcessed++
if(itemsProcessed === vars.length) {
sendMail(doc, item)
}
})
}
})
}
})
}

function sendMail(vars, item) {
var toship = items[Math.floor(Math.random()*items.length)];
console.log(toship)
if(item === "agave@comicserver.org") {
//toship = "Happy Birthday, garbled!"
//console.log(toship)
}
ejs.renderFile(__dirname + "/templates/welcome.ejs", { comics: vars, email: item, toship: toship }, function (err, data) {
if (err) {
console.log(err);
} else {
const mainOptions = {
from: '"ComicServer Daily" <daily@comicserver.org>',
to: item,
subject: "Your comics have arrived!",
text: "View your daily runthrough on ComicServer!",
html: data,
headers: { 'x-myheader': 'aheader' }
};
transporter.sendMail(mainOptions, (err, info) => {
if (err) {
console.log(err);
} else {
console.log('Message sent to ' + item);
}
});
}
})
}

app.listen(port, function() {
console.log(`ComicServer Daily is broadcasting at ${port}!`);
})