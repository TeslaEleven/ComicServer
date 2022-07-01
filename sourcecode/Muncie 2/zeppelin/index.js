const { MessageActionRow, MessageButton, MessageEmbed, Client, Intents } = require('discord.js');
const { parse } = require("node-html-parser");
const rp = require("request-promise-native");
const r = require("request");
const token = process.env.token
const comms = require('./comms')
comms

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.once('ready', () => {
	console.log('Ready!');
  client.application.commands.set([])
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
	const { commandName } = interaction;
  const array = ["amazing-spider-man", "arctic-circle", "barney-google-and-snuffy-smith", "beetle-bailey-1", "between-friends", "bizarro", "blondie", "carpe-diem", "crankshaft", "crock", "curtis", "daddy-daze", "dennis-the-menace", "dustin", "edge-city", "flash-forward", "flash-gordon", "funky-winkerbean", "Funny_Online_Animals", "Gearhead_Gertie", "hagar-the-horrible", "hi-and-lois", "Intelligent", "judge-parker", "katzenjammer-kids", "kevin-and-kell", "Macanudo", "mallard-fillmore", "mandrake-the-magician-1", "mark-trail", "Marvin", "mary-worth", "moose-and-molly", "mother-goose-grimm", "mutts", "on-the-fastrack", "pardon-my-planet", "popeye", "popeyes-cartoon-club", "prince-valiant", "pros-cons", "rae-the-doe", "rex-morgan-m-d", "rhymes-with-orange", "safe-havens", "sales", 'sally-forth', "sam-and-silo", "sherman-s-lagoon", "shoe", "six-chix", "slylock-fox-and-comics-for-kids", "take-it-from-the-tinkersons", "brilliant-mind-of-edison-lee", "family-circus", "lockhorns", "pajama-diaries", "phantom", "tiger", "tinas-groove", "todd-the-dinosaur", "zippy-the-pinhead", "zits", "Blondie", "Popeye", "Hagar-the-Horrible", "Beetle-Bailey-1"];
  if (commandName === 'cs') {
  let ts = Date.now();
  let da = new Date(ts);
  utc = da.getTime() + da.getTimezoneOffset() * 60000;
  offset = -6;
  const date = new Date(utc + 3600000 * offset);
  let options = {
    insecure: true,
    rejectUnauthorized: false
  };
  const csName = interaction.options.getString('comic')
  var csRYear = interaction.options.getString('date')
  var csYear = csRYear.slice(0,4)
  var csRMonth = interaction.options.getString('date')
  var csMonth = csRMonth.slice(4,7)
  var csRDay = interaction.options.getString('date')
  var csDay = csRDay.slice(8,10)
  var csDate = "wfv"
  var csImage = "wfv"
  const mo = ("0" + (date.getMonth() + 1)).slice(-2);
  if(csRYear === null) {
  csYear = date.getFullYear();
  csMonth = mo;
  csDay = date.getDate();
  }
  if(array.includes(csName)) {
  const parsedPage = parse(await  rp(`https://v7.comicskingdom.net/comics/${csName}/${csYear}-${csMonth}-${csDay}`, options))
  const csRaw = parsedPage.querySelector("img.img-fluid");
  const csImagee = csRaw.rawAttrs;
  csImage = csImagee.slice(166, -19)
  csDate = csName;
  } else {
  const parsedPage = parse(
  await rp(`https://www.gocomics.com/${csName}/${csYear}/${csMonth}/${csDay}`));
  const csRawDate = parsedPage
    .querySelector('.item-comic-image img')
    .rawAttrs.split(/ alt=/)[1]
    .replace(/"/g, '');
  csDate = csRawDate.slice(0, -70);
  csImage = parsedPage
    .querySelector('.item-comic-image img')
    .rawAttrs.split(/ src=/)[1]
    .replace(/"/g, '');
  }
    const filter = i => i.customId === 'prev';

const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

collector.on('collect', async i => {
	if (i.customId === 'prev') {
		await i.update({ content: 'A button was clicked!', components: [] });
	}
});

collector.on('end', collected => console.log(`Prev ${collected.size} items`));
const row = new MessageActionRow()
.addComponents(
new MessageButton()
.setCustomId('prev')
.setLabel('Previous')
.setStyle('PRIMARY'),
new MessageButton()
.setCustomId('rand')
.setLabel('Shu-ffle')
.setStyle('PRIMARY'),
new MessageButton()
.setCustomId('next')
.setLabel('Next')
.setStyle('PRIMARY')
);
  const embed = new MessageEmbed()
    .setTitle(csDate)
    .setColor(0x6699ff)
    .setImage(csImage)
await interaction.reply({ embeds: [embed], components: [row] })
}
})

client.login(token);
console.log('Bot is Deployed')