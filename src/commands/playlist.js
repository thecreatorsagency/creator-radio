const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Path to the songs folder
const songsFolder = path.join(__dirname, '../../songs');

// Path to the playlist file inside the songs folder
const playlistFile = path.join(songsFolder, 'playlist.json');

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

// Split array into chunks for pagination
const paginateArray = (array, pageSize) => {
    const pages = [];
    for (let i = 0; i < array.length; i += pageSize) {
        pages.push(array.slice(i, i + pageSize));
    }
    return pages;
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playlist')
        .setDescription('Displays the playlist of available songs'),

    async execute(interaction) {
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

            if (files.length === 0) {
                await interaction.reply('The playlist is empty. Add some songs to the folder first.');
                return;
            }

            // Generate the playlist with IDs and relative paths
            const playlist = files.map((file, index) => ({
                id: index + 1,
                path: path.relative(songsFolder, file),
            }));

            // Write the playlist to a JSON file inside the songs folder
            fs.writeFileSync(playlistFile, JSON.stringify({ songs: playlist }, null, 2));

            // Paginate the playlist (10 items per page)
            const pageSize = 10;
            const pages = paginateArray(
                playlist.map(song => `${song.id}: ${song.path}`),
                pageSize
            );

            // Helper to generate embed for a specific page
            const generateEmbed = (pageIndex) => {
                const embed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle('🎶 Playlist')
                    .setDescription(pages[pageIndex].join('\n'))
                    .setFooter({ text: `Page ${pageIndex + 1} of ${pages.length}` });

                return embed;
            };

            // Initial embed
            let currentPage = 0;
            const message = await interaction.reply({
                embeds: [generateEmbed(currentPage)],
                fetchReply: true,
                components: pages.length > 1
                    ? [
                          {
                              type: 1, // ActionRow
                              components: [
                                  {
                                      type: 2, // Button
                                      label: 'Previous',
                                      style: 1, // Primary
                                      custom_id: 'prev',
                                      disabled: true,
                                  },
                                  {
                                      type: 2, // Button
                                      label: 'Next',
                                      style: 1, // Primary
                                      custom_id: 'next',
                                      disabled: pages.length <= 1,
                                  },
                              ],
                          },
                      ]
                    : [],
            });

            // Create a button interaction collector
            const collector = message.createMessageComponentCollector({
                time: 60000, // Collector active for 60 seconds
            });

            collector.on('collect', async (btnInteraction) => {
                if (btnInteraction.user.id !== interaction.user.id) {
                    await btnInteraction.reply({
                        content: "You can't interact with this menu!",
                        ephemeral: true,
                    });
                    return;
                }

                // Handle button clicks
                if (btnInteraction.customId === 'prev' && currentPage > 0) {
                    currentPage--;
                } else if (btnInteraction.customId === 'next' && currentPage < pages.length - 1) {
                    currentPage++;
                }

                // Update the embed and buttons
                await btnInteraction.update({
                    embeds: [generateEmbed(currentPage)],
                    components: [
                        {
                            type: 1, // ActionRow
                            components: [
                                {
                                    type: 2, // Button
                                    label: 'Previous',
                                    style: 1, // Primary
                                    custom_id: 'prev',
                                    disabled: currentPage === 0,
                                },
                                {
                                    type: 2, // Button
                                    label: 'Next',
                                    style: 1, // Primary
                                    custom_id: 'next',
                                    disabled: currentPage === pages.length - 1,
                                },
                            ],
                        },
                    ],
                });
            });

            collector.on('end', async () => {
                // Disable buttons after collector ends
                await message.edit({
                    components: [],
                });
            });
        } catch (error) {
            console.error('Error reading the playlist:', error);
            await interaction.reply('There was an error trying to load the playlist.');
        }
    },
};
