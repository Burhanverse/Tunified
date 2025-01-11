<div align="center">
  <img src="https://github.com/Burhanverse/assets/blob/main/Tuneified.png" width="260" height="260">
</div>
<h1 align="center">Tunified (Inspired by <a href="https://github.com/Runixe786/Tunify">Tunify</a>)
</h1> 
A Telegram bot that fetches the currently playing song from Last.fm and posts details about the song to a specified channel.

Available at <a href="https://t.me/tunifiedxbot">Tunified</a>
---
### Preview:
<div align="center">
  <img src="https://github.com/Burhanverse/assets/blob/main/Tunified_demo.png">
</div>

### Features:

- Fetches the now playing song from Last.fm.
- Utilizes Youtube Music api to get the required metadata for the tracks.
- Posts the song details to a Telegram channel.
- Updates the post every 5 seconds to reflect the current song.

---

### Prerequisites & Setup:
- Node.js v18+ installed.
- Telegram Bot API token.
- MongoDB for database.
- Last.FM client installed in your phone for scrobbling tracks (it is recommanded to use pano scrobbler if you are on Android).
- Last.fm API key, Shared secret and username.
- Telegram Channel ID.

1\. Download and install [Node.js](https://nodejs.org/en/download/).

2\. Clone the repository:
```bash
    git clone https://github.com/Burhanverse/Tunified.git
    cd Tunified
```
3\. Install dependencies:
```bash
    npm install --include=dev
```
4\. Create a `.env` file in the root directory and add the following environment variables:
```env
LASTFM_API_KEY=
LASTFM_SHARED_SECRET=
TELEGRAM_BOT_TOKEN=
MONGO_URI=
```
5\. Get your Last.FM API KEY & SHARED SECERT from [here](https://www.last.fm/api/account/create) remember to login with the same account you use for scrobbling tracks as this will serve as the main source for the bot to display the current playing track data.

6\. Add the bot [@myidbot](https://t.me/myidbot) to your chat or channel → send the command `/getgroupid@myidbot` and follow the instructions in the bot.

7\. To get `TELEGRAM_BOT_TOKEN`, go to chat with [@BotFather](https://t.me/BotFather) and send the command `/newbot`. Following the instructions. Upon completion, [@BotFather](https://t.me/BotFather) will give you the bot token. Don't forget to add the bot to your channel.

8\. Create a mongodb cluster for database.

9\.Start the bot:
```bash
    npm start
```
---

The bot will now fetch the currently playing song from Last.fm every 5 seconds and post details to the specified Telegram channel.

---
