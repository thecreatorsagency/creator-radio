const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');

// Path to the songs folder
const songsFolder = path.join(__dirname, '../../songs');

// Function to calculate Levenshtein distance for fuzzy matching
const levenshteinDistance = (a, b) => {
    const matrix = Array.from({ length: a.length + 1 }, () =>
        Array(b.length + 1).fill(0)
    );

    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            if (a[i - 1] === b[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[a.length][b.length];
};

// Function to normalize input (lowercase and remove extra spaces)
const normalize = (str) => str.toLowerCase().trim();

// Function to find the closest match
const findClosestMatch = (input, filenames) => {
    const normalizedInput = normalize(input);
    let closestMatch = null;
    let lowestDistance = Infinity;

    filenames.forEach(filename => {
        const normalizedFilename = normalize(filename);
        const distance = levenshteinDistance(normalizedInput, normalizedFilename);
        if (distance < lowestDistance) {
            lowestDistance = distance;
            closestMatch = filename;
        }
    });

    return { closestMatch, lowestDistance };
};

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
        .addStringOption(option =>
            option
                .setName('input')
                .setDescription('The song ID or filename (excluding extension)')
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

            // Get the input from the user
            const input = interaction.options.getString('input');
            const filenames = files.map(file => path.parse(file).name);

            let selectedSongPath;
            let selectedSongName;

            // Attempt exact match first
            const exactMatch = files.find(file =>
                normalize(path.parse(file).name) === normalize(input)
            );

            if (exactMatch) {
                selectedSongPath = exactMatch;
                selectedSongName = path.parse(exactMatch).name;
            } else {
                // Find closest match using Levenshtein distance
                const { closestMatch, lowestDistance } = findClosestMatch(input, filenames);

                if (closestMatch && lowestDistance <= 6) { // Increase tolerance
                    selectedSongPath = files.find(file =>
                        normalize(path.parse(file).name) === normalize(closestMatch)
                    );
                    selectedSongName = closestMatch;

                    console.log(`Fuzzy match found: "${closestMatch}" (distance: ${lowestDistance})`);
                } else {
                    console.log(`No close match found for input: "${input}"`);
                    await interaction.reply(
                        `No exact or close match found for **${input}**. Please try again with a valid song ID or filename.`
                    );
                    return;
                }
            }

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
