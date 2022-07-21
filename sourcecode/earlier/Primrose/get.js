//Dependencies
const { parse } = require("node-html-parser");
const rp = require("request-promise-native");
const r = require("request")

// Date setup
let ts = Date.now();
let da = new Date(ts);
utc = da.getTime() + da.getTimezoneOffset() * 60000;
offset = -6;
const date = new Date(utc + 3600000 * offset);


exports.csGet = async function request(options) {
const array = ["amazing-spider-man", "arctic-circle", "barney-google-and-snuffy-smith", "beetle-bailey-1", "between-friends", "bizarro", "blondie", "carpe-diem", "crankshaft", "crock", "curtis", "daddy-daze", "dennis-the-menace", "dustin", "edge-city", "flash-forward", "flash-gordon", "funky-winkerbean", "Funny_Online_Animals", "Gearhead_Gertie", "hagar-the-horrible", "hi-and-lois", "Intelligent", "judge-parker", "katzenjammer-kids", "kevin-and-kell", "Macanudo", "mallard-fillmore", "mandrake-the-magician-1", "mark-trail", "Marvin", "mary-worth", "moose-and-molly", "mother-goose-grimm", "mutts", "on-the-fastrack", "pardon-my-planet", "popeye", "popeyes-cartoon-club", "prince-valiant", "pros-cons", "rae-the-doe", "rex-morgan-m-d", "rhymes-with-orange", "safe-havens", "sales", 'sally-forth', "sam-and-silo", "sherman-s-lagoon", "shoe", "six-chix", "slylock-fox-and-comics-for-kids", "take-it-from-the-tinkersons", "brilliant-mind-of-edison-lee", "family-circus", "lockhorns", "pajama-diaries", "phantom", "tiger", "tinas-groove", "todd-the-dinosaur", "zippy-the-pinhead", "zits", "Blondie", "Popeye", "Hagar-the-Horrible", "Beetle-Bailey-1"];
if(array.includes !== options.name) {
// Date configuration and helper variables
const today = ('0' + (date.getDate())).slice(-2);
const acyear = date.getFullYear();
const acmonth = ('0' + (date.getMonth() + 1)).slice(-2);
const datestring = acyear + '/' + acmonth + '/' + today;
const comic = options.name;
const year = options.year;
const month = options.month;
const dayy = ('0' + (options.day)).slice(-2);
const monthh = ('0' + (options.month)).slice(-2);
const day = options.day;
var ejsstring = year + "/" + monthh + "/" + dayy
  
// Main components and variables
const parsedPage = parse(await rp( `https://www.gocomics.com/${comic}/${year}/${month}/${day}`));
var csImage = parsedPage.querySelector('.item-comic-image img').rawAttrs.split(/ src=/)[1].replace(/"/g, '');
const csRawDate = parsedPage.querySelector('.item-comic-image img').rawAttrs.split(/ alt=/)[1].replace(/"/g, '');
const csDate = csRawDate.slice(0, -70);
  
// Datepicker helper variables
const prev = day - 1;
const next = prev + 2;
const csRawParamsStart = parsedPage.querySelector('.btn.btn-outline-secondary.gc-calendar-nav__datepicker.js-calendar-wrapper').rawAttrs.split(/ data-start=/)[1].replace(/"/g, '');
var csName = parsedPage.querySelector('h4.media-heading.h4.mb-0').rawText;
const csParamsStart = csRawParamsStart.slice(0, -63);
const csStartFormatted = csParamsStart.slice(0, 4);
const csRawParamsEnd = parsedPage.querySelector('.btn.btn-outline-secondary.gc-calendar-nav__datepicker.js-calendar-wrapper').rawAttrs.split(/ data-end=/)[1].replace(/"/g, '');
const csParamsEnd = csRawParamsEnd.slice(0, -32);
const csParamsDay = csParamsEnd.slice(8)
const csParamsMonthh = csParamsEnd.slice(5, -3)
const csParamsMonth = parseFloat(csParamsMonthh) + 1
const csParamsYear = csParamsEnd.slice(0, -6)
const csEndFormatted = csParamsEnd.slice(0, 4);
const csTest = parsedPage.querySelector('.gc-calendar-nav__next a').rawAttrs.split(/ href=/)[1].replace(/"/g, '');
const csLength = comic.length + 3;
  
// Next/Previous parameter build
const csStr = csTest.slice(csLength, -78);
const csTestTwo = parsedPage.querySelector('.gc-calendar-nav__previous a.js-previous-comic').rawAttrs.split(/ href=/)[1].replace(/"/g, '');
const csStrPrev = csTestTwo.slice(csLength, -95);
const nextstring = csStr;
const prevstring = csStrPrev;
module.exports.url = csImage
module.exports.date = csDate
module.exports.name = csName
module.exports.ps = csParamsStart
module.exports.pe = csParamsEnd
module.exports.ps = prevstring
module.exports.ns = nextstring
} else if(array.includes === options.name) {
// SSL reconfiguration
let ssl = {
  insecure: true,
  rejectUnauthorized: false
};
// Date variables
const today = date.getDate();
const acyear = date.getFullYear();
const acmonth = ('0' + (date.getMonth() + 1)).slice(-2);
const datestring = acyear + '/' + acmonth + '/' + today;
const comic = options.name;
const comicName = comic.charAt(0).toUpperCase() + comic.slice(1);
const year = options.year;
const month = options.month;
const day = options.day;
const csDate = comicName + " for " + datestring;
// Vital components
const parsedPage = parse(await rp(`https://v7.comicskingdom.net/comics/${comic}/${year}-${month}-${day}`, ssl))
const csRaw = parsedPage.querySelector("img.img-fluid");
const csImagee = csRaw.rawAttrs;
const csImagge = csImagee.slice(166, -19);
const csImage = csImagge.replace(/&amp;/g, '&');
module.exports.url = csImage
}
}