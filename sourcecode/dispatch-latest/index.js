const express = require('express');
const ejs = require('ejs');
const { parse } = require('rss-to-json');
var bodyParser = require('body-parser');
var cors = require('cors');
var app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
var LocalStrategy = require('passport-local');
var crypto = require('crypto');
var dbe = require('./db.js');
var passport = require('passport');
var session = require('express-session');
var SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');
const Database = require("@replit/database")
const db = new Database()

// Passport configuration
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

app.get('/signup', function(req, res, next) {
  ejs.renderFile('/home/runner/dispatch/pages/signup.ejs', function(err, str){
    res.send(str)
});
});

app.get('/delete', function (req, res) {
const user = req.query.uname
dbe.run(`DELETE FROM users WHERE username LIKE '${user}';`)
db.delete(user).then(() => {res.redirect('/logout')});
})

app.post('/sum', function (req, res) {
var text = req.body.art
let SummarizerManager = require("node-summarizer").SummarizerManager;
let Summarizer = new SummarizerManager(text,7); res.send(Summarizer.getSummaryByFrequency())
})

app.post('/signup', function(req, res, next) {
  var salt = crypto.randomBytes(16);
  crypto.pbkdf2(req.body.password, salt, 310000, 32, 'sha256', function(err, hashedPassword) {
    if (err) { return next(err); }
    dbe.run('INSERT or IGNORE INTO users (username, hashed_password, salt) VALUES (?, ?, ?)', [
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
        db.set(req.body.username, "[]").then(() => { res.redirect('/');});
      });
    });
  });
});

app.post('/login/password', passport.authenticate('local', {
  successReturnToOrRedirect: '/',
  failureRedirect: '/login'
})
);

app.get('/login', function(req, res, next) {
if(req.user) {
ejs.renderFile('/home/runner/dispatch/pages/signin.ejs', function(err, str){
  res.send(str)
});
} else {
ejs.renderFile('/home/runner/dispatch/pages/signin.ejs', function(err, str){
    res.send(str)
});
}
});


app.get('/', async (req, res) => {
if(req.user) {
const token = req.user.username
await db.get(token).then(value => { exports.favs = value });
const favs = JSON.stringify(exports.favs)
ejs.renderFile('/home/runner/dispatch/pages/index.ejs', {items: favs}, function(err, str){
    res.send(str)
});
} else {
ejs.renderFile('/home/runner/dispatch/pages/signin.ejs', function(err, str){
    res.send(str)
});
}
});

app.get('/rss', async (req, res) => {
(async () => {
  var rss = await parse(req.query.url);
  res.send(rss);
})();
});

app.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});


app.get('/edit', async (req, res) => {
if(req.user) {
const token = req.user.username
await db.get(token).then(value => { exports.favs = value });
const favs = JSON.stringify(exports.favs)
ejs.renderFile('/home/runner/dispatch/pages/edit.ejs', {token: token, items: favs }, function(err, str){
    res.send(str)
});
} else {
ejs.renderFile('/home/runner/dispatch/pages/signin.ejs', function(err, str){
    res.send(str)
});
}
});

app.get('/cust', (req, res) => {
if(req.user) {
ejs.renderFile('/home/runner/dispatch/pages/rss.ejs', function(err, str){
  res.send(str)
});
} else {
ejs.renderFile('/home/runner/dispatch/pages/signin.ejs', function(err, str){
    res.send(str)
});
}
});

app.get('/del', async (req, res) => {
  if (req.user) {
  const token = req.user.username
  const sloc = req.query.index
  db.get(token).then(value => {
const arr = value.filter(e => e !== sloc)
    db.set(token, arr).then(() => { res.redirect('/') });
  });
} else {
renderTemplate(res, req, 'signin.ejs')
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

app.get('/passband', (req, res) => {
if(req.user) {
ejs.renderFile('/home/runner/dispatch/pages/pb.ejs', function(err, str){
    res.send(str)
});
} else {
ejs.renderFile('/home/runner/dispatch/pages/signin.ejs', function(err, str){
    res.send(str)
});
}
});

app.get('/weather', (req, res) => {
if(req.user) {
ejs.renderFile('/home/runner/dispatch/pages/weather.ejs', function(err, str){
    res.send(str)
});
} else {
ejs.renderFile('/home/runner/dispatch/pages/signin.ejs', function(err, str){
    res.send(str)
});
}
});

app.listen(3000, () => {
  console.log('dispatch has started.');
});