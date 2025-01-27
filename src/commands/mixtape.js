const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const state = require('../state'); // Import shared state

// Path to the "PizzaDAO Mixtape" folder
const mixtapeFolder = path.join(__dirname, '../../songs/mixtape');

// Function to shuffle an array
const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mixtape')
        .setDescription('Plays songs from the PizzaDAO Mixtape folder in random order'),

    async execute(interaction) {
        try {
            if (!fs.existsSync(mixtapeFolder)) {
                await interaction.reply('The folder does not exist. Please make sure the songs are in the correct location.');
                return;
            }

            // Supported audio file extensions
            const supportedExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.wma'];

            // Get all files from the mixtape folder
            const allFiles = fs.readdirSync(mixtapeFolder).filter(file =>
                supportedExtensions.includes(path.extname(file).toLowerCase())
            );

            if (allFiles.length === 0) {
                await interaction.reply('The folder is empty or contains unsupported file types. Add some songs to the folder first.');
                return;
            }

            // Shuffle the files and set the state queue
            state.queue = shuffleArray(allFiles);

            const voiceChannel = interaction.member.voice.channel;
            if (!voiceChannel) {
                await interaction.reply('You need to be in a voice channel to play music!');
                return;
            }

            state.connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });

            state.player = createAudioPlayer();

            // Function to play the next song
            const playNextSong = () => {
                if (state.queue.length === 0) {
                    interaction.followUp('All songs from the mixtape have been played!');
                    state.connection.destroy();
                    state.connection = null;
                    state.player = null;
                    return;
                }

                const nextSong = state.queue.shift();
                const resource = createAudioResource(path.join(mixtapeFolder, nextSong));

                console.log(`Playing: ${nextSong}`);
                state.player.play(resource);
            };

            // Handle player events
            state.player.on(AudioPlayerStatus.Idle, playNextSong);
            state.player.on('error', (error) => {
                console.error('Error during playback:', error);
                interaction.followUp(`An error occurred while playing the song: ${error.message}`);
                playNextSong(); // Skip to the next song
            });

            // Subscribe the player to the connection and start playback
            state.connection.subscribe(state.player);
            playNextSong();

            await interaction.reply('🎵 Playing songs from the PizzaDAO Mixtape folder in random order!');
        } catch (error) {
            console.error('Error executing the mixtape command:', error);
            await interaction.reply('There was an error trying to play the songs.');
        }
    },
};
