const { SlashCommandBuilder } = require('discord.js');
const state = require('../state'); // Import shared state

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skips the current song and plays the next one in the queue'),

    async execute(interaction) {
        try {
            if (!state.player || state.queue.length === 0) {
                await interaction.reply('There are no songs playing or no songs in the queue.');
                return;
            }

            // Skip the current song by stopping the player
            state.player.stop();
            await interaction.reply('⏭️ Skipped to the next song!');
        } catch (error) {
            console.error('Error executing the skip command:', error);
            await interaction.reply('There was an error trying to skip the song.');
        }
    },
};
