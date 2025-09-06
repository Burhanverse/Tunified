import { getUserData, saveUserData, fetchNowPlaying, createText, getReplyMarkup } from '../utils.mjs';
import { getYouTubeMusicDetails } from '../youtube.mjs';

export async function chPlaying(bot) {
    try {
        const users = await getUserData();
        if (!users || !Array.isArray(users)) {
            return; // Silently return if no users or database error
        }
        
        for (const user of users) {
            try {
                const track = await fetchNowPlaying(user.userId);
                if (track) {
                    let details = await getYouTubeMusicDetails(track.artistName, track.trackName, track.albumName);

                    if (!details) {
                        continue;
                    }

                    const { albumCover, id } = details;
                    const text = createText({ ...track, ...user });
                    const replyMarkup = getReplyMarkup({ id, artistName: track.artistName });

                    if (user.lastMessageId) {
                        await bot.api.editMessageMedia(
                            user.channelId,
                            user.lastMessageId,
                            {
                                type: 'photo',
                                media: albumCover,
                                caption: text,
                                parse_mode: 'HTML'
                            },
                            { reply_markup: replyMarkup.reply_markup }
                        );
                    } else {
                        const message = await bot.api.sendPhoto(user.channelId, albumCover, {
                            caption: text,
                            parse_mode: 'HTML',
                            reply_markup: replyMarkup.reply_markup
                        });

                        await saveUserData(user.userId, { lastMessageId: message.message_id });
                    }
                }
            } catch (error) {
                // Only log critical errors, suppress common Telegram API errors
                if (!error.message.includes('chat not found') && 
                    !error.message.includes('message to edit not found')) {
                    console.error(`Error processing user ${user.userId}:`, error.message);
                }
            }
        }
    } catch (error) {
        // Database connection errors or other critical issues
        if (error.message.includes('MongoDB connection not ready')) {
            console.warn('MongoDB connection not ready, skipping this cycle');
        } else {
            console.error('Critical error in chPlaying:', error.message);
        }
    }
}
