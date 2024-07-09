import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { Markup } from 'telegraf';

dotenv.config();

const lastfmApiKey = process.env.LASTFM_API_KEY;
const lastfmUser = process.env.LASTFM_USER;

async function fetchNowPlaying() {
    const response = await fetch(`http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${lastfmUser}&api_key=${lastfmApiKey}&format=json`);
    const data = await response.json();
    const nowPlaying = data.recenttracks.track[0];

    if (nowPlaying['@attr'] && nowPlaying['@attr'].nowplaying === 'true') {
        return nowPlaying;
    }

    return null;
}

function cleanArtistName(artist) {
    return artist.split(/,|&/)[0].trim();
}

function createText({ trackName, artistName, albumName, releaseDate }) {
    return `🎵 **Now Playing:**\n\n` +
           `**Song:** ${trackName}\n` +
           `**Artist:** ${artistName}\n` +
           `**Album:** ${albumName}\n` +
           `**Release Date:** ${releaseDate}`;
}

function getReplyMarkup({ id, artistName }) {
    const artist = artistName.split(",")[0];
    return Markup.inlineKeyboard([
        [
            {
                text: "Listen it",
                url: `https://song.link/s/${id}`,
            },
            {
                text: `More by ${artist}`,
                url: `https://open.spotify.com/search/${artist}`,
            },
        ],
    ]);
}

export { fetchNowPlaying, cleanArtistName, createText, getReplyMarkup };
