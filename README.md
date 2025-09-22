# Creator Radio 🎵

Creator Radio is a Discord bot that brings music to your server, with features designed to play, manage, and skip tracks effortlessly. It's lightweight, easy to set up, and customizable for your needs. Originally forked from Pizza Radio and adapted for The Creators Collective.

---

### 🌟 Features

- **Play Songs**: Queue and play songs directly from a folder in your project.
- **Playlist Management**: List available songs to choose from.
- **Skip Tracks**: Skip to the next song in the queue.
- **Stop Playback**: Stop the current song, with an option to disconnect the bot.
- **Mixtape Mode**: Shuffle and play songs from The Creators Mixtape folder.
- **Repository Mode**: Play songs from The Creators Collective Repository folder.
- **Album Management**: Display song IDs for specific albums/folders.
- **Persistent Voice Channel Connection**: Bot can remain in the voice channel even after stopping playback.

---

### 🚀 Installation

Follow these steps to set up Creator Radio:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/thecreatorsagency/creator-radio.git
   cd creator-radio
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Copy the example \`.env\` file and update it with your Discord bot token and other configurations:
   ```bash
   cp .env.example .env```
4. **Start the Bot**:
   ```bash
   npm start
   ```
---

### 📂 Folder Structure

- **`src/`**: Contains the bot's code and commands.
  - **`commands/`**: Modular commands like play, stop, skip, mixtape, and repo.
  - **`state.js/`**: Shared state management for the bot.
- **`songs/`**: Folder to store your audio files (not included in the repo).
  - **`mixtape/`**: The Creators Mixtape folder for curated music.
  - **`repo/`**: The Creators Collective Repository folder for community music.
- **`scratch-pad/`**: Utility scripts for deployment and debugging.

---

### 🛠 Commands

- `/play <song>`: Play a specific song from the playlist.
- `/playlist`: List all available songs.
- `/skip`: Skip the current song.
- `/stop`: Stop the music (optionally keeps the bot in the channel).
- `/mixtape`: Play songs randomly from The Creators Mixtape folder.
- `/repo`: Play songs randomly from The Creators Collective Repository folder.
- `/album <folder>`: Display song IDs for a specific album/folder.
- `/folder`: Manage and play songs from specific folders.

---

### 🤝 Contributing

Contributions are welcome! Feel free to fork the repository, submit pull requests, or open issues for bug reports and feature suggestions.

---

### ⚠️ Notes

- Ensure you have the correct permissions in your Discord server to allow the bot to join voice channels and play music.
- The `songs/` folder must contain valid audio files (\`.mp3\`, \`.wav\`, etc.) for the bot to play.

---

Happy listening! 🎧
