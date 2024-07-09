import { Markup } from 'telegraf';
import dotenv from 'dotenv';

dotenv.config();

const lastfmApiKey = process.env.LASTFM_API_KEY;
const lastfmUser = process.env.LASTFM_USER;

async function fetchNowPlaying() {
    try {
        const response = await fetch(`http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${lastfmUser}&api_key=${lastfmApiKey}&format=json`);
        const data = await response.json();
        const nowPlaying = data.recenttracks.track[0];

        if (nowPlaying['@attr'] && nowPlaying['@attr'].nowplaying === 'true') {
            return nowPlaying;
        }
    } catch (error) {
        console.error('Error fetching now playing from Last.fm:', error);
    }

    return null;
}

function cleanArtistName(artist) {
    return artist.split(/,|&/)[0].trim();
}

function createText({ trackName, artistName, albumName, releaseDate }) {
    return `🎵 **Aqua is Listening to:**\n\n` +
           `**Song:** ${trackName}\n` +
           `**Artist:** ${artistName}\n` +
           `**Album:** ${albumName}\n` +
           `**Release Date:** ${releaseDate}`;
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
