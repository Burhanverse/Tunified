import { Markup } from 'telegraf';
import dotenv from 'dotenv';

dotenv.config();

const lastfmApiKey = process.env.LASTFM_API_KEY;
const lastfmUser = process.env.LASTFM_USER;

let lastPlayed = null;

async function fetchNowPlaying() {
    try {
        const response = await fetch(`http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${lastfmUser}&api_key=${lastfmApiKey}&format=json`);
        const data = await response.json();

        const recentTrack = data.recenttracks.track[0];

        const isPlaying = recentTrack['@attr'] && recentTrack['@attr'].nowplaying === 'true';
        const status = isPlaying ? 'Playing' : 'Paused';

        if (recentTrack) {
            const trackName = recentTrack.name;
            const artistName = recentTrack.artist['#text'];
            const albumName = recentTrack.album['#text'] || 'Unknown Album';
            const trackMbid = recentTrack.mbid || null;

            const trackInfoResponse = await fetch(`http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${lastfmApiKey}&artist=${encodeURIComponent(artistName)}&track=${encodeURIComponent(trackName)}&username=${lastfmUser}&format=json`);
            const trackInfoData = await trackInfoResponse.json();

            const playCount = trackInfoData.track.userplaycount || 'N/A';

            if (isPlaying) {
                lastPlayed = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
            }

            return {
                trackName,
                artistName,
                albumName,
                playCount,
                lastPlayed,
                status
            };
        }
    } catch (error) {
        console.error('Error fetching now playing from Last.fm:', error);
    }

    return null;
}

function cleanArtistName(artist) {
    return artist.split(/,|&/)[0].trim();
}

function createText({ trackName, artistName, albumName, playCount, lastPlayed, status }) {
    return `<b>𝘼𝙦𝙪𝙖 𝙞𝙨 𝙇𝙞𝙨𝙩𝙚𝙣𝙞𝙣𝙜 𝙩𝙤:</b>\n\n` +
           `<b>𝙎𝙤𝙣𝙜:</b> ${trackName}\n` +
           `<b>𝘼𝙧𝙩𝙞𝙨𝙩:</b> ${artistName}\n` +
           `<b>𝘼𝙡𝙗𝙪𝙢:</b> ${albumName}\n` +
           `<b>𝙎𝙩𝙖𝙩𝙪𝙨:</b> ${status}\n` +
           `<b>𝙋𝙡𝙖𝙮 𝘾𝙤𝙪𝙣𝙩:</b> ${playCount}\n` +
           `<b>𝙇𝙖𝙨𝙩 𝙋𝙡𝙖𝙮𝙚𝙙:</b> ${lastPlayed || 'N/A'}\n` +
           `<b>𝙇𝙖𝙨𝙩.𝙁𝙈 𝙋𝙧𝙤𝙛𝙞𝙡𝙚:</b> <a href="https://www.last.fm/user/${encodeURIComponent(lastfmUser)}">${lastfmUser}</a>`;
}

function getReplyMarkup({ id, artistName }) {
    const artist = artistName.split(",")[0];
    const googleSearchLink = `https://www.google.com/search?q=${encodeURIComponent(artistName + ' artist bio')}`;
    return Markup.inlineKeyboard([
        [
            {
                text: "Listen Now",
                url: `https://song.link/s/${id}`,
            },
            {
                text: `About ${artist}`,
                url: googleSearchLink,
            },
        ],
        [
            {
                text: `Made by AquaMods`,
                url: `https://akuamods.t.me`,
            },
        ],
    ]);
}

export { fetchNowPlaying, cleanArtistName, createText, getReplyMarkup };
