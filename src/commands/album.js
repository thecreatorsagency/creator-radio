const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Path to the songs folder
const songsFolder = path.join(__dirname, '../../songs');

// Path to the playlist file
const playlistFile = path.join(songsFolder, 'playlist.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('album')
        .setDescription('Displays the song IDs for the specified album (folder)')
        .addStringOption(option =>
            option
                .setName('folder')
                .setDescription('The name of the folder to display songs from')
                .setRequired(true)
        ),

    async execute(interaction) {
        try {
            const folderName = interaction.options.getString('folder');
            const targetFolder = path.join(songsFolder, folderName);

            if (!fs.existsSync(targetFolder)) {
                await interaction.reply(`The folder "${folderName}" does not exist. Please check the name and try again.`);
                return;
            }

            // Check if playlist.json exists
            if (!fs.existsSync(playlistFile)) {
                await interaction.reply('The playlist.json file does not exist. Please run the /playlist command first.');
                return;
            }

            // Read and parse playlist.json
            const playlistData = JSON.parse(fs.readFileSync(playlistFile, 'utf-8'));

            if (!playlistData.songs || !Array.isArray(playlistData.songs)) {
                await interaction.reply('Invalid playlist data. Please regenerate the playlist using the /playlist command.');
                return;
            }

            // Filter songs based on the specified folder
            const folderPath = path.relative(songsFolder, targetFolder).replace(/\\/g, '/'); // Normalize path for compatibility
            const songsInFolder = playlistData.songs.filter(song => song.path.startsWith(folderPath));

            if (songsInFolder.length === 0) {
                await interaction.reply(`No songs found in the folder "${folderName}".`);
                return;
            }

            // Generate song list with IDs
            const songList = songsInFolder.map(song => `${song.id}: ${song.path}`);

            // Embed to display song IDs
            const embed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle(`🎵 Album: ${folderName}`)
                .setDescription(songList.join('\n'))
                .setFooter({ text: `Total songs: ${songsInFolder.length}` });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching album songs:', error);
            await interaction.reply('There was an error trying to load the album.');
        }
    },
};
