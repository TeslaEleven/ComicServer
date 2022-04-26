const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const clientId = process.env.CLIENTID
const token = process.env.TOKEN
const guildId = process.env.GUILDID

const commands = 
[
  new SlashCommandBuilder()
	.setName('cse')
	.setDescription('One trillion comics, right in your pocket')
	.addStringOption(option =>
		option.setName('comic')
			.setDescription('The comic\'s name')
			.setRequired(true))
  	.addStringOption(option =>
		option.setName('year')
			.setDescription('4 Didgets'))
  .addStringOption(option =>
		option.setName('month')
			.setDescription('2 Digets'))
  .addStringOption(option =>
		option.setName('day')
			.setDescription('2 Digets'))
]

	.map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

rest.put(Routes.applicationCommands(clientId), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);