<div align="center">
  <img src="https://github.com/Burhanverse/assets/blob/main/Tuneified.png" width="260" height="260">
</div>
<h1 align="center">Tunified (Inspired by <a href="https://github.com/Runixe786/Tunify">Tunify</a>)
</h1> 
A Telegram bot that fetches the currently playing song from Last.fm and posts details about the song to a specified channel.

---
### Preview:
<div align="center">
  <img src="https://github.com/Burhanverse/assets/blob/main/Tunified_demo.png">
</div>

### Features:

- Fetches the now playing song from Last.fm.
- Utilizes Spotify and YTDL modules to get the required metadata for the tracks.
- Posts the song details to a Telegram channel.
- Updates the post every 5 seconds to reflect the current song.
- Shows the Last listened song date and time.
- Configurable via `.env` file for API keys and other settings.

---

### Prerequisites & Setup:

- Node.js v14+ installed.
- Telegram Bot API token.
- Last.FM client installed in your phone for scrobbling tracks (it is recommanded to use pano scrobbler if you are on Android).
- Last.fm API key, Shared secret and username.
- Spotify Client ID & Client Secret.
- Telegram Channel ID.

1\. Download and install [Node.js](https://nodejs.org/en/download/).

2\. Clone the repository:
```bash
    git clone https://github.com/Burhanverse/Tunified.git
    cd Tunified
```
3\. Install dependencies:
```bash
    npm i
```
4\. Create a `.env` file in the root directory and add the following environment variables:
```env
    LASTFM_API_KEY=
    LASTFM_SHARED_SECRET=
    LASTFM_USER=
    TELEGRAM_BOT_TOKEN=
    TELEGRAM_CHANNEL_ID=
    SPOTIFY_CLIENT_ID=
    SPOTIFY_CLIENT_SECRET=
```
5\. Get your Last.FM API KEY & SHARED SECERT from [here](https://www.last.fm/api/account/create) remember to login with the same account you use for scrobbling tracks as this will serve as the main source for the bot to display the current playing track data.

6\. Add the bot [@myidbot](https://t.me/myidbot) to your chat or channel → send the command `/getgroupid@myidbot` and follow the instructions in the bot.

7\. To get `TELEGRAM_BOT_TOKEN`, go to chat with [@BotFather](https://t.me/BotFather) and send the command `/newbot`. Following the instructions. Upon completion, [@BotFather](https://t.me/BotFather) will give you the bot token. Don't forget to add the bot to your channel.

8\. Go to [this link](https://developer.spotify.com/dashboard/applications) (login if required) to get your `SPOTIFY_CLIENT_ID` & `SPOTIFY_CLIENT_SECRET`. In your "Dashboard" click on "CREATE AN APP". Enter any name and description of the application. Now ,in the Redirect URIs field enter `https://example.com/` , check all the boxes down below and → click "CREATE AN APP". Now copy the ID and SECERT and put it in the `.env` file.

9\.Start the bot:
```bash
    node init.mjs
```
- Updates to latest source from github, clean installs module as speciefied in package-lock.json and then starts the bot.

OR for normal startup of the bot,
```bash
    node bot.mjs
```

---

The bot will now fetch the currently playing song from Last.fm every 5 seconds and post details to the specified Telegram channel.

---
