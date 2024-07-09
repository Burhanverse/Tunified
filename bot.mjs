import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import { fetchNowPlaying, cleanArtistName, createText, getReplyMarkup } from './src/utils.mjs';
import { getSpotifyDetails } from './src/spotify.mjs';
import { getYouTubeMusicDetails } from './src/youtube.mjs';

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const channelId = process.env.TELEGRAM_CHANNEL_ID;
let lastPostedMessageId = null;

async function postNowPlaying(track) {
    const { artist, name } = track;
    const artistName = cleanArtistName(artist['#text']);
    const trackName = name;

    let details = await getSpotifyDetails(artistName, trackName) || await getYouTubeMusicDetails(artistName, trackName);

    if (!details) {
        console.error('Could not fetch details from Spotify or YouTube Music');
        return;
    }

    const { spotifyLink, youtubeMusicLink, albumCover, albumName, releaseDate, id, artistLink } = details;

    const text = createText({ trackName, artistName, albumName, releaseDate });
    const extra = getReplyMarkup({ id, artistName });

    try {
        if (lastPostedMessageId) {
            await bot.telegram.editMessageMedia(
                channelId,
                lastPostedMessageId,
                null,
                {
                    type: 'photo',
                    media: albumCover,
                    caption: text,
                    parse_mode: 'Markdown'
                },
                extra
            );
        } else {
            const message = await bot.telegram.sendPhoto(channelId, albumCover, {
                caption: text,
                parse_mode: 'Markdown'
            },
            extra
            );

            lastPostedMessageId = message.message_id;
        }
    } catch (error) {
        console.error('Error posting or updating to Telegram:', error);
    }
}

async function checkAndPostNowPlaying() {
    try {
        const nowPlayingTrack = await fetchNowPlaying();

        if (nowPlayingTrack) {
            await postNowPlaying(nowPlayingTrack);
        }
    } catch (error) {
        console.error('Error fetching or posting now playing:', error);
    }
}

setInterval(checkAndPostNowPlaying, 5000);

bot.launch();
