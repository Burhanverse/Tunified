<div align="center">
  <img src="https://github.com/Burhanverse/assets/blob/main/tunified.svg" width="130">
</div>
<h1 align="center">TunifiedNXT</h1> 
<p>
A Telegram bot to fetch the currently playing song from Last.fm and shares it on Telegram.
</p>
<P>
Available at <a href="https://t.me/tunifiedxbot">TunifiedNXT</a>
</P>

---
### Preview:
<div align="center">
  <img src="https://github.com/Burhanverse/assets/blob/main/Tunified_demo.png">
</div>

### Features:

- [x] Fetches the now playing song from Last.fm.
- [x] Utilizes `YTMusicAPI` to get the required CoverART for the tracks.
- [x] Posts the song details to a Telegram channel.
- [x] Updates the post every 5 seconds to reflect the current song (channels only).
- [x] Supports multiple channels.
- [x] Supports group chats.

---

### Prerequisites & Setup:
- Node.js v18+ installed.
- Python 3.11+ installed.
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
3\. Create a `.env` file in the root directory and add the following environment variables:
```env
LASTFM_API_KEY=
LASTFM_SHARED_SECRET=
TELEGRAM_BOT_TOKEN=
MONGO_URI=
```
4\. Get your Last.FM API KEY & SHARED SECERT from [here](https://www.last.fm/api/account/create) remember to login with the same account you use for scrobbling tracks as this will serve as the main source for the bot to display the current playing track data.

5\. Add the bot [@myidbot](https://t.me/myidbot) to your chat or channel → send the command `/getgroupid@myidbot` and follow the instructions in the bot.

6\. To get `TELEGRAM_BOT_TOKEN`, go to chat with [@BotFather](https://t.me/BotFather) and send the command `/newbot`. Following the instructions. Upon completion, [@BotFather](https://t.me/BotFather) will give you the bot token. Don't forget to add the bot to your channel.

7\. Create a mongodb cluster for database.

8\.Start the bot:
```bash
./start.sh
```
---
