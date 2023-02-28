const express = require('express')
const nodemailer = require("nodemailer");
const path = require('path')
const Database = require("@replit/database")
const db = new Database()
const { parse } = require('rss-to-json');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
const ejs = require('ejs')
const ms = require('ms')
const rp = require('request-promise')

const transporter = nodemailer.createTransport({
  host: 'smtp.mail.me.com',
  port: 587,
  auth: {
    user: process.env.MAILE,
    pass: process.env.PASS
  }
});

const port = 8000

app.get('/',  (req, res) => {
if(req.query.favs) {
ejs.renderFile(__dirname + "/templates/signup.ejs", { favs: req.query.favs }, function(err, str){
    res.send(str)
})
} else {
ejs.renderFile(__dirname + "/templates/from.ejs", function(err, str){
    res.send(str)
});
}
})

app.post('/', async (req, res) => {
  const email = req.body.username
  const favs = "[ " + req.body.password + " ]"
  db.set(email, favs).then(() => { });
  db.get("emails").then(value => {
    var list = value
    if (list === '[]') {
      list = JSON.parse(value)
      list.push(email)
      db.set("emails", list).then(() => { res.send('Done!') });
      confirmationMail(email)
    } else {
      list.push(email)
      db.set("emails", list).then(() => { res.send('Done!') });
      confirmationMail(email)
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

app.get('/unsub', async (req, res) => {
res.send('Server Error Occurred.')
})

app.get('/rss', async (req, res) => {
(async () => {
  var rss = await parse(req.query.url);
  res.send(rss);
})();
});

setInterval(setTime, ms('1m'))
function setTime() {
let ts = Date.now();
let da = new Date(ts);
utc = da.getTime() + da.getTimezoneOffset() * 60000;
offset = -6;
const objDate = new Date(utc + 3600000 * offset);
var minutes = objDate.getMinutes();
var hours = objDate.getHours();
if(hours >= 8 && hours <= 12){
  sendWhen()
} else {
console.log('Not Yet! ' + hours);
db.get("emails").then(value => {
db.set("tosend", value)
});
}
}

function sendWhen() {
startProcess()
console.log('Sending Batch!');
}

function confirmationMail(email) {
ejs.renderFile(__dirname + "/templates/confirmation.ejs", function (err, data) {
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
console.log('Confimation mail sent: ' + info.response);
}
});
}
})
}

function startProcess() {
db.get("tosend").then(value => {
const emailadds = value
emailadds.forEach(function(item, index) {
db.get(item).then(async value => {
const valuee = JSON.parse(value)
var vars = ""
var itemsProcessed = 0;
valuee.forEach(async function(item, index) {
var urll = "https://ComicServer-Daily.comicserver.repl.co/rss?url=https://www.comicsrss.com/rss/" + item + ".rss";
var url = urll.replace(/\s/g, "").toLowerCase();
await rp(url).then((data) => {
var obj = JSON.parse(data)
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const div = new JSDOM(obj.items[0].description);
const croppedcdata = div.window.document.querySelector("img").src
const doc = `<a class="notana" href='https://www.comicserver.org/load/${item}' name="${item}">${obj.items[0].title}</a><hr style="background-color:var(--ba);height:1px;border:0;"><div class="r"><img style="margin-left:auto;margin-right:auto" src="${croppedcdata}"/></div><br><br>`
vars += doc
itemsProcessed++;
if(itemsProcessed === valuee.length) {
sendMail(vars);
}
})
});
});
function sendMail(vars) {
ejs.renderFile(__dirname + "/templates/welcome.ejs", { comics: vars, email: item }, function (err, data) {
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
console.log('Message sent: ' + info.response);
db.get("tosend").then(value => {
const newval = value.filter(e => e !== item)
db.set("tosend", newval)
});
}
});
}
})
}
})
})
}

app.listen(port, function() {
console.log(`App is listening on port ${port} !`);
})