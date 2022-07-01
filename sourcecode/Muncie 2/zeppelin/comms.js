const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const clientId = process.env.ClientId
const guildId = process.env.GuildId
const token = process.env.token

const commands = 
[
  new SlashCommandBuilder()
	.setName('cs')
	.setDescription('One trillion comics, right in your pocket')
	.addStringOption(option =>
		option.setName('comic')
			.setDescription('The comic\'s name')
			.setRequired(true))
  	.addStringOption(option =>
		option.setName('date')
			.setDescription('yyyy/mm/dd')
  		.setRequired(true))
]
	.map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then(() => console.log('Bot has Commands'))
	.catch(console.error);