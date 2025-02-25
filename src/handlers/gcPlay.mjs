import { getIndividualUserData, saveUserData, fetchNowPlaying, createText, getReplyMarkup } from '../utils.mjs';
import { getYouTubeMusicDetails } from '../youtube.mjs';

export async function getNowPlayingForUser(userId) {
    try {
        const userData = await getIndividualUserData(userId);
        if (!userData?.lastfmUsername) {
            return { error: "Last.fm username not set. Use /setlastfm to configure." };
        }

        const track = await fetchNowPlaying(userId);
        if (!track) {
            return { error: "Could not fetch current track information." };
        }

        const details = await getYouTubeMusicDetails(track.artistName, track.trackName);
        if (!details) {
            return { error: "Could not fetch track details from YouTube Music." };
        }

        return {
            success: true,
            data: {
                track,
                userData,
                details
            }
        };
    } catch (error) {
        console.error('Error in getNowPlayingForUser:', error);
        return { error: "An error occurred while fetching track information." };
    }
}

export async function formatNowPlayingMessage(data) {
    const { track, userData, details } = data;
    const text = createText({ ...track, ...userData });
    const replyMarkup = getReplyMarkup({
        id: details.id,
        artistName: track.artistName
    });
    replyMarkup.reply_markup.inline_keyboard.push([{
        text: "Refresh",
        callback_data: `refresh_${userData.userId}`
    }]);

    return {
        text,
        replyMarkup,
        albumCover: details.albumCover
    };
}

export async function sendNowPlaying(bot, chatId, userId, isGroup = false) {
    try {
        const result = await getNowPlayingForUser(userId);
        if (result.error) {
            return { error: result.error };
        }

        const formatted = await formatNowPlayingMessage(result.data);

        if (formatted.albumCover) {
            const message = await bot.api.sendPhoto(chatId, formatted.albumCover, {
                caption: formatted.text,
                parse_mode: 'HTML',
                reply_markup: formatted.replyMarkup.reply_markup
            });

            if (!isGroup) {
                await saveUserData(userId, { lastMessageId: message.message_id });
            }

            return { success: true, messageId: message.message_id };
        } else {
            const message = await bot.api.sendMessage(chatId, formatted.text, {
                parse_mode: 'HTML',
                reply_markup: formatted.replyMarkup.reply_markup
            });

            if (!isGroup) {
                await saveUserData(userId, { lastMessageId: message.message_id });
            }

            return { success: true, messageId: message.message_id };
        }
    } catch (error) {
        console.error('Error in sendNowPlaying:', error);
        return { error: "Failed to send Now Playing message." };
    }
}

export async function updateNowPlaying(bot, chatId, messageId, userId) {
    try {
        const result = await getNowPlayingForUser(userId);
        if (result.error) {
            return { error: result.error };
        }

        const formatted = await formatNowPlayingMessage(result.data);

        if (formatted.albumCover) {
            await bot.api.editMessageMedia(chatId, messageId, {
                type: 'photo',
                media: formatted.albumCover,
                caption: formatted.text,
                parse_mode: 'HTML'
            }, {
                reply_markup: formatted.replyMarkup.reply_markup
            });
        } else {
            await bot.api.editMessageText(chatId, messageId, formatted.text, {
                parse_mode: 'HTML',
                reply_markup: formatted.replyMarkup.reply_markup
            });
        }

        return { success: true };
    } catch (error) {
        console.error('Error in updateNowPlaying:', error);
        return { error: "Failed to update Now Playing message." };
    }
}

export async function refreshNowPlaying(bot, chatId, userId, messageId) {
    const result = await updateNowPlaying(bot, chatId, messageId, userId);
    return result;
}
