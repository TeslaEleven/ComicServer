const config = require('../config');
const path = require('path');
const express = require('express');
const app = express();
const ejs = require('ejs');
const bodyParser = require('body-parser');
const { parse } = require('node-html-parser');
const rp = require('request-promise-native');
const { htmlToText } = require('html-to-text');
let ts = Date.now();
let da = new Date(ts);
utc = da.getTime() + da.getTimezoneOffset() * 60000;
offset = -6;
const date = new Date(utc + 3600000 * offset);
const ms = require('ms');
const passwordProtected = require('express-password-protect');
const passconf = {
	username: process.env.UNAME,
	password: process.env.AUTH,
	maxAge: ms('1h')
};
app.use(passwordProtected(passconf));

module.exports = async client => {
	const dataDir = path.resolve(`${process.cwd()}${path.sep}webapp`);
	const templateDir = path.resolve(`${dataDir}${path.sep}templates`);
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
		throw new TypeError('Invalid domain specific in the config file.');
	}
	callbackUrl = `${domain.protocol}//${domain.host}/callback`;
	console.log(' Starting Dashboard...');
	app.locals.domain = config.domain.split('//')[1];
	app.engine('json', ejs.renderFile);
	app.set('view engine', 'json');
	app.use(bodyParser.json());
	app.use(
		bodyParser.urlencoded({
			extended: true
		})
	);
	app.use('/', express.static(path.resolve(`${dataDir}${path.sep}assets`)));
	const renderTemplate = (res, req, template, data = {}) => {
		const baseData = {
			bot: 'notneeded',
			path: 'notneeded',
			user: 'notneeded'
		};
		res.render(
			path.resolve(`${templateDir}${path.sep}${template}`),
			Object.assign(baseData, data)
		);
	};

	app.get('/', (req, res) => {
		renderTemplate(res, req, 'index.ejs');
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
		renderTemplate(res, req, 'future.ejs', { csImage, csDate });
	});

	app.get('/:comic/:year/:month/:day', async (req, res) => {
		const today = date.getDate();
		const acyear = date.getFullYear();
		const acmonth = ('0' + (date.getMonth() + 1)).slice(-2);
		const datestring = acyear + '/' + acmonth + '/' + today;
		const pass = process.env.AUTH;
		const comic = req.params.comic;
		const year = req.params.year;
		const month = req.params.month;
		const day = req.params.day;
		const parsedPage = parse(
			await rp(
				`https://www.gocomics.com/${comic}/${year}/${month}/${day}`
			).catch(err => {
				console.log('Request failed\n', err);
			})
		);
		const csImage = parsedPage
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
		const csParamsStart = csRawParamsStart.slice(0, -63);
		const csStartFormatted = csParamsStart.slice(0, 4);
		const csRawParamsEnd = parsedPage
			.querySelector(
				'.btn.btn-outline-secondary.gc-calendar-nav__datepicker.js-calendar-wrapper'
			)
			.rawAttrs.split(/ data-end=/)[1]
			.replace(/"/g, '');
		const csParamsEnd = csRawParamsEnd.slice(0, -32);
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
		const csRaw = parsedPage.querySelector(
			'div.comic__transcript-container.js-comic-transcript.collapse p'
		);
		const csTranscript = htmlToText(csRaw, {
			wordwrap: 130
		});
    const commentTextt = parsedPage.querySelector(
			'.comment-body'
		);
    const commentText = htmlToText(commentTextt, {
			wordwrap: 130
		});
		renderTemplate(res, req, 'comic.ejs', {
			csStartFormatted,
			prevstring,
			nextstring,
			csEndFormatted,
			csParamsStart,
			csParamsEnd,
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
			pass,
			csTranscript,
      commentText
		});
	});
	
		app.get('/k/:comic/:year/:month/:day', async (req, res) => {
		const today = date.getDate();
		const acyear = date.getFullYear();
		const acmonth = ('0' + (date.getMonth() + 1)).slice(-2);
		const datestring = acyear + '/' + acmonth + '/' + today;
		const comic = req.params.comic;
		const comicc = comic.charAt(0).toUpperCase() + comic.slice(1);
		const year = req.params.year;
		const month = req.params.month;
		const day = req.params.day;
  const parsedPage = parse(await rp(`https://v7.comicskingdom.net/comics/${comic}/${year}-${month}-${day}`)
        .catch(err => {
            console.log("Request failed\n", err);
        })
    )		
		  const csRaw = parsedPage.querySelector("div.col-12.text-center img");
  const csImagee = htmlToText(csRaw, {
    wordwrap: 130
  });
  const csImage = csImagee.slice(1, -1)
		renderTemplate(res, req, 'kstrips.ejs', {
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


	app.get('/search/:comic/:term', async (req, res) => {
		const term = req.params.term;
		const comic = req.params.comic;
		const parsedPage = parse(
			await rp(
				`https://www.gocomics.com/search/${comic}?utf8=%E2%9C%93&terms=${term}`
			).catch(err => {
				console.log('Request failed\n', err);
			})
		);
  	const csRawDate = parsedPage
		.querySelector('.comic__image a').rawAttrs
		const csDate = csRawDate.slice(33).replace('"','?');
		renderTemplate(res, req, 'search.ejs', {
			term,
			comic,
			csDate
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
		res.redirect('https://app.comicserver.org/k/' + comic + '/' + datestring);
	});
	
	app.get('/search/:term', async (req, res) => {
		const term = req.params.term;
		const parsedPage = parse(
			await rp(
				`https://www.gocomics.com/search/results?utf8=%E2%9C%93&terms=${term}`
			).catch(err => {
				console.log('Request failed\n', err);
			})
		);
  	const csRawDate = parsedPage
		.querySelector('.comic__image a').rawAttrs
		const csDate = csRawDate.slice(33).replace('"','?');
		renderTemplate(res, req, 'global.ejs', {
			term,
			csDate
		});
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
		res.redirect('https://app.comicserver.org/' + comic + '/' + csStr);
	});

	app.get('/:comic', async (req, res) => {
		const comic = req.params.comic;
		let ts = Date.now();
		let d = new Date(ts);
		utc = d.getTime() + d.getTimezoneOffset() * 60000;
		offset = -6;
		d = new Date(utc + 3600000 * offset);
		const mo = date.getMonth() + 1;
		const datestring = date.getFullYear() + '/' + mo + '/' + date.getDate();
		const parsedPage = parse(
			await rp(`https://www.gocomics.com/${comic}/${datestring}`)
		);
		res.redirect('https://app.comicserver.org/' + comic + '/' + datestring);
	});

	app.get('*', (req, res) => {
		renderTemplate(res, req, 'redir.ejs');
	});

	app.listen(config.port, null, null, () =>
		console.log(`Webapp has started on port ${config.port}.`)
	);
};