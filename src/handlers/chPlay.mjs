import { getUserData, saveUserData, fetchNowPlaying, createText, getReplyMarkup } from '../utils.mjs';
import { getYouTubeMusicDetails } from '../youtube.mjs';

export async function chPlaying(bot) {
    try {
        const users = await getUserData();
        
        if (!users || !Array.isArray(users)) {
            console.error("No users found or users is not an array");
            return;
        }
        
        if (users.length === 0) {
            console.log("No users registered yet");
            return;
        }
        
        console.log(`Processing ${users.length} users...`);
        
        for (const user of users) {
            try {
                // Skip users without channel ID (they won't receive channel updates)
                if (!user.channelId) {
                    continue;
                }
                
                const track = await fetchNowPlaying(user.userId);
                if (track) {
                    let details = await getYouTubeMusicDetails(track.artistName, track.trackName);

                    if (!details) {
                        console.error(`Could not fetch details from YouTube Music for ${track.trackName} by ${track.artistName}`);
                        continue;
                    }

                    const { albumCover, id } = details;
                    const text = createText({ ...track, ...user });
                    const replyMarkup = getReplyMarkup({ id, artistName: track.artistName });

                    if (user.lastMessageId) {
                        try {
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
                        } catch (editError) {
                            // If message editing fails, send a new message and update the stored message ID
                            if (editError.description?.includes('message to edit not found') || 
                                editError.description?.includes('chat not found')) {
                                
                                console.log(`Sending new message for user ${user.userId} due to edit failure`);
                                
                                try {
                                    const message = await bot.api.sendPhoto(user.channelId, albumCover, {
                                        caption: text,
                                        parse_mode: 'HTML',
                                        reply_markup: replyMarkup.reply_markup
                                    });

                                    await saveUserData(user.userId, { lastMessageId: message.message_id });
                                } catch (sendError) {
                                    if (sendError.description?.includes('chat not found')) {
                                        console.log(`Chat not found for user ${user.userId}, removing channel ID`);
                                        await saveUserData(user.userId, { channelId: null, lastMessageId: null });
                                    } else {
                                        console.error(`Error sending new message for user ${user.userId}:`, sendError.description);
                                    }
                                }
                            } else {
                                console.error(`Error editing message for user ${user.userId}:`, editError.description);
                            }
                        }
                    } else {
                        try {
                            const message = await bot.api.sendPhoto(user.channelId, albumCover, {
                                caption: text,
                                parse_mode: 'HTML',
                                reply_markup: replyMarkup.reply_markup
                            });

                            await saveUserData(user.userId, { lastMessageId: message.message_id });
                        } catch (sendError) {
                            if (sendError.description?.includes('chat not found')) {
                                console.log(`Chat not found for user ${user.userId}, removing channel ID`);
                                await saveUserData(user.userId, { channelId: null, lastMessageId: null });
                            } else {
                                console.error(`Error sending message for user ${user.userId}:`, sendError.description);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error(`Error processing user ${user.userId}:`, error.message);
            }
        }
    } catch (error) {
        console.error("Error in chPlaying function:", error);
    }
}
