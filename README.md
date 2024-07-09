#  Tunified (Inspired by [Tunify](https://github.com/Runixe786/Tunify))

A Termux compatible Telegram bot that fetches the currently playing song from Last.fm and posts details about the song to a specified channel.

## Features

- Fetches the now playing song from Last.fm.
- Posts the song details to a Telegram channel.
- Updates the post every 5 seconds to reflect the current song.
- Configurable via `.env` file for API keys and other settings.

## Files Structure

```\
├── src/spotify.mjs
├── src/youtube.mjs
├── src/utils.mjs
├── bot.mjs
├── .env
├── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js v14+ installed.
- Telegram Bot API token.
- Last.fm API key, Shared secret and username.
- Spotify Client ID & Client Secret.
- Telegram Channel ID.

### Installation

1\. Clone the repository:

```bash
    git clone https://github.com/Burhanverse/Tunified.git
    cd Tunified
```

2\. Install dependencies:

```bash
    npm i
```

3\. Create a `.env` file in the root directory and add the following environment variables:

```env
    LASTFM_API_KEY=
    LASTFM_SHARED_SECRET=
    LASTFM_USER=
    TELEGRAM_BOT_TOKEN=
    TELEGRAM_CHANNEL_ID=
    SPOTIFY_CLIENT_ID=
    SPOTIFY_CLIENT_SECRET=
```

### Running the Bot

Start the bot:

```bash
    node bot.mjs
```

The bot will now fetch the currently playing song from Last.fm every 5 seconds and post details to the specified Telegram channel.
