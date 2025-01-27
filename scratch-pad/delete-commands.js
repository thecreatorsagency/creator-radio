require('dotenv').config({ path: '../.env' })
const { REST, Routes } = require('discord.js');

// Load environment variables
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID; // Your bot's application ID
const GUILD_ID = process.env.DISCORD_GUILD_ID; // Your server's ID

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        // Fetch and delete all global commands
        console.log('Fetching global commands...');
        const globalCommands = await rest.get(Routes.applicationCommands(CLIENT_ID));
        
        for (const command of globalCommands) {
            await rest.delete(Routes.applicationCommand(CLIENT_ID, command.id));
            console.log(`Deleted global command: ${command.name}`);
        }

        // Fetch and delete all guild-specific commands
        console.log('Fetching guild-specific commands...');
        const guildCommands = await rest.get(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID));
        
        for (const command of guildCommands) {
            await rest.delete(Routes.applicationGuildCommand(CLIENT_ID, GUILD_ID, command.id));
            console.log(`Deleted guild command: ${command.name}`);
        }

        console.log('All commands have been successfully deleted.');
    } catch (error) {
        console.error('Error deleting commands:', error);
    }
})();

