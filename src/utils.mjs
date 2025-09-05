import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { InlineKeyboard } from 'grammy';

dotenv.config();

const lastfmApiKey = process.env.LASTFM_API_KEY;

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    channelId: String,
    tgUser: String,
    lastfmUsername: String,
    lastMessageId: String,
    status: String,
    lastListenedTime: Date
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function connectDB(forceReconnect = false) {
    try {
        if (mongoose.connection.readyState === 0 || forceReconnect) {
            const mongoUri = process.env.MONGO_URI;
            const isAtlas = mongoUri && mongoUri.includes('mongodb+srv://');
            
            const connectionOptions = {
                dbName: 'TunifiedDB',
                serverSelectionTimeoutMS: 30000,
                connectTimeoutMS: 30000,
                socketTimeoutMS: 30000,
                family: 4,
                retryWrites: true,
                retryReads: true,
                maxPoolSize: 10,
                minPoolSize: 2,
                maxIdleTimeMS: 30000,
                heartbeatFrequencyMS: 10000
            };
            
            if (isAtlas) {
                connectionOptions.ssl = true;
                connectionOptions.authSource = 'admin';
            }
            
            await mongoose.connect(mongoUri, connectionOptions);
            console.log("Connected to MongoDB via Mongoose");
        }
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        
        if (error.message.includes('SSL') || error.message.includes('TLS')) {
            console.log("Retrying with minimal SSL settings...");
            try {
                const minimalOptions = {
                    dbName: 'TunifiedDB',
                    serverSelectionTimeoutMS: 30000,
                    ssl: true
                };
                
                await mongoose.connect(process.env.MONGO_URI, minimalOptions);
                console.log("Connected to MongoDB with minimal SSL settings");
                return;
            } catch (fallbackError) {
                console.error("Fallback connection also failed:", fallbackError);
            }
        }
        
        throw error;
    }
}

async function initializeDatabase() {
    await connectDB();
    
    mongoose.connection.on('connected', () => {
        console.log('Mongoose connected to MongoDB');
    });
    
    mongoose.connection.on('error', (err) => {
        console.error('Mongoose connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
        console.log('Mongoose disconnected from MongoDB');
    });
    
    process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('Mongoose connection closed due to app termination');
        process.exit(0);
    });
    
    console.log("Database initialized with Mongoose");
}

async function saveUserData(userId, data) {
    try {
        if (mongoose.connection.readyState === 0) await connectDB(true);
        
        await User.findOneAndUpdate(
            { userId },
            { $set: data },
            { upsert: true, new: true }
        );
        console.log(`User data saved for userId: ${userId}`);
    } catch (error) {
        console.error("Error saving user data:", error);
    }
}

async function getUserData(retryCount = 0) {
    try {
        if (mongoose.connection.readyState === 0) await connectDB(true);
        
        if (mongoose.connection.readyState !== 1) {
            throw new Error('MongoDB connection not ready');
        }
        
        const users = await User.find({}).lean();
        
        if (!users) {
            console.log("No users found in database");
            return [];
        }
        
        if (!Array.isArray(users)) {
            console.warn("Users data is not an array, converting...");
            return Array.isArray(users) ? users : [users];
        }
        
        return users;
    } catch (error) {
        console.error("Error fetching all user data:", error);
        
        if (retryCount < 3 && (error.name === 'MongoServerSelectionError' || error.name === 'MongoNetworkError')) {
            console.log(`Retrying getUserData... Attempt ${retryCount + 1}/3`);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
            return getUserData(retryCount + 1);
        }
        
        return [];
    }
}

async function getIndividualUserData(userId) {
    try {
        if (mongoose.connection.readyState === 0) await connectDB(true);
        return await User.findOne({ userId }).lean();
    } catch (error) {
        console.error('Error in getIndividualUserData:', error);
        return null;
    }
}

async function fetchNowPlaying(userId) {
    try {
        if (mongoose.connection.readyState === 0) await connectDB(true);
        const userData = await User.findOne({ userId });

        if (!userData || !userData.lastfmUsername) {
            throw new Error("Last.fm username not set for user.");
        }

        const response = await fetch(
            `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${userData.lastfmUsername}&api_key=${lastfmApiKey}&format=json`
        );
        const data = await response.json();

        if (
            !data.recenttracks ||
            !data.recenttracks.track ||
            (Array.isArray(data.recenttracks.track) && data.recenttracks.track.length === 0)
        ) {
            throw new Error("No recent tracks available or unexpected API response.");
        }

        const recentTrack = Array.isArray(data.recenttracks.track)
            ? data.recenttracks.track[0]
            : data.recenttracks.track;

        const isPlaying = recentTrack['@attr']?.nowplaying === 'true';
        const currentStatus = isPlaying ? 'Playing' : 'Paused';

        if (recentTrack) {
            const trackName = recentTrack.name;
            const artistName = recentTrack.artist['#text'];
            const albumName = recentTrack.album['#text'] || '';

            const trackInfoResponse = await fetch(
                `http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${lastfmApiKey}&artist=${encodeURIComponent(
                    artistName
                )}&track=${encodeURIComponent(trackName)}&username=${userData.lastfmUsername}&format=json`
            );
            const trackInfoData = await trackInfoResponse.json();

            if (!trackInfoData.track) {
                console.warn("No track info available from Last.fm API.");
            }
            const playCount = trackInfoData.track.userplaycount || 'N/A';

            let lastListenedTime = userData.lastListenedTime ? new Date(userData.lastListenedTime) : null;
            const previousStatus = userData.status;

            if (currentStatus === 'Paused' && previousStatus === 'Playing') {
                lastListenedTime = new Date();
                await User.findOneAndUpdate(
                    { userId },
                    { 
                        lastListenedTime: lastListenedTime,
                        status: currentStatus 
                    },
                    { new: true }
                );
            } else if (currentStatus !== previousStatus) {
                await User.findOneAndUpdate(
                    { userId },
                    { status: currentStatus },
                    { new: true }
                );
            }

            return {
                userId,
                channelId: userData.channelId,
                tgUser: userData.tgUser,
                trackName,
                artistName,
                albumName,
                status: currentStatus,
                playCount,
                lastMessageId: userData.lastMessageId,
                lastfmUsername: userData.lastfmUsername,
                lastListenedTime: currentStatus === 'Paused' ? lastListenedTime : null,
            };
        }
    } catch (error) {
        return null;
    }
}

function getRelativeTime(timestamp) {
    if (!timestamp) return "N/A";

    const now = new Date();
    const diffMs = now - new Date(timestamp);
    const diffMinutes = diffMs / 60000;

    if (diffMinutes < 30) return "A few minutes ago";
    if (diffMinutes < 60) return "Recently";

    const diffHours = diffMs / 3600000;
    if (diffHours < 24) return `${Math.floor(diffHours)} hours ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays} days ago`;

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} months ago`;

    const diffYears = Math.floor(diffMonths / 12);
    return `${diffYears} years ago`;
}

function getFormattedGMTTime(timestamp) {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString('en-GB', { timeZone: 'UTC', hour12: false });
}

function createText({ trackName, artistName, albumName, status, tgUser, playCount, lastfmUsername, lastListenedTime }) {
    let message = `🎧 <b><i><a href="https://www.last.fm/user/${encodeURIComponent(lastfmUsername)}">${tgUser || 'User'}</a> is Listening to:</i></b>\n\n` +
        `⋗ <b><i>Song:</i></b> ${trackName}\n` +
        `⋗ <b><i>Artist:</i></b> ${artistName}\n`;
    if (albumName) {
        message += `⋗ <b><i>Album:</i></b> ${albumName}\n`;
    }
    message += `⋗ <b><i>Play Count:</i></b> ${playCount}\n` +
        `⋗ <b><i>Status:</i></b> ${status}\n`;
    if (status === "Paused") {
        message += `⋗ <b><i>Last Played:</i></b> ${getRelativeTime(lastListenedTime)}\n\n`;
    } else {
        message += `\n`;
    }
    message += `<a href="https://burhanverse.t.me">𝘗𝘳𝘫𝘬𝘵:𝘚𝘪𝘥.</a>`;
    return message;
}

function getReplyMarkup({ id, artistName }) {
    const googleSearchLink = `https://www.google.com/search?q=${encodeURIComponent(artistName + ' artist bio')}`;
    const keyboard = new InlineKeyboard()
        .url("Listen Now", `https://song.link/y/${id}`)
        .url("About Artist", googleSearchLink);

    return { reply_markup: keyboard };
}

export { connectDB, initializeDatabase, saveUserData, getUserData, getIndividualUserData, fetchNowPlaying, createText, getReplyMarkup };
