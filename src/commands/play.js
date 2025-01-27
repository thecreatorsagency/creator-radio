const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');

// Path to the songs folder
const songsFolder = path.join(__dirname, '../../songs');

// Function to get all files recursively
const getFilesRecursively = (folder) => {
    let files = [];
    const entries = fs.readdirSync(folder, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(folder, entry.name);
        if (entry.isDirectory()) {
            files = files.concat(getFilesRecursively(fullPath));
        } else if (entry.isFile()) {
            files.push(fullPath);
        }
    }

    return files;
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a song from the playlist')
        .addIntegerOption(option =>
            option
                .setName('song')
                .setDescription('The song ID to play (as shown in /playlist)')
                .setRequired(true)
        ),

    async execute(interaction) {
        console.log(`Executing /play command for user ${interaction.user.tag}`);

        try {
            if (!fs.existsSync(songsFolder)) {
                await interaction.reply('The songs folder does not exist. Please create the folder and add songs.');
                return;
            }

            // Supported audio file extensions
            const supportedExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.wma'];

            // Get all files recursively
            const allFiles = getFilesRecursively(songsFolder);
            const files = allFiles.filter(file =>
                supportedExtensions.includes(path.extname(file).toLowerCase())
            );

            console.log(`Found ${files.length} supported song(s).`);

            if (files.length === 0) {
                await interaction.reply('The playlist is empty or contains unsupported file types. Add some songs to the folder first.');
                return;
            }

            const songId = interaction.options.getInteger('song') - 1;
            if (songId < 0 || songId >= files.length) {
                await interaction.reply('Invalid song ID. Please select a valid ID from the playlist.');
                return;
            }

            const selectedSongPath = files[songId];
            const selectedSongName = path.parse(selectedSongPath).name;

            const voiceChannel = interaction.member.voice.channel;
            if (!voiceChannel) {
                await interaction.reply('You need to be in a voice channel to play music!');
                return;
            }

            // Join the user's voice channel
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });

            // Create an audio player
            const player = createAudioPlayer();

            // Create an audio resource
            const resource = createAudioResource(selectedSongPath);

            // Handle player events
            player.on(AudioPlayerStatus.Playing, () => {
                console.log(`Now playing: ${selectedSongName}`);
            });

            player.on('error', error => {
                console.error(`Error playing ${selectedSongName}:`, error);
                interaction.followUp('There was an error playing the song.');
            });

            // Play the resource
            player.play(resource);
            connection.subscribe(player);

            await interaction.reply(`🎵 Now playing: **${selectedSongName}**`);
        } catch (error) {
            console.error('Error playing the song:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp('There was an error trying to play the song.');
            } else {
                await interaction.reply('There was an error trying to play the song.');
            }
        }
    },
};
