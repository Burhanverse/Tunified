import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { Markup } from 'telegraf';

dotenv.config();

const lastfmApiKey = process.env.LASTFM_API_KEY;
let dbClient;
const databaseName = 'TunifiedDB';
const usersCollection = 'users';
let db;
let isConnected = false;

// Connect to MongoDB
async function connectDB(forceReconnect = false) {
    if (!isConnected) {
        try {
            dbClient = new MongoClient(process.env.MONGO_URI);
            await dbClient.connect();
            if (forceReconnect) await dbClient.db().command({ ping: 1 });
            db = dbClient.db(databaseName);
            isConnected = true;
            console.log("Connected to MongoDB");
        } catch (error) {
            console.error("Error connecting to MongoDB:", error);
        }
    }
}

// Initialize database and create necessary collections
async function initializeDatabase() {
    await connectDB();
    if (!isConnected) try {
        console.log("Initializing database...");
        await db.createCollection(usersCollection);
        console.log("Users collection created successfully");
    } catch (error) {
        if (error.code !== 48) { // 48 is the error code for "collection already exists"
            console.error("Error creating users collection:", error);
        }
    }
}

// Save user data to MongoDB
async function saveUserData(userId, data) {
    try {
        if (!isConnected) await connectDB(true);
        const collection = db.collection(usersCollection);
        await collection.updateOne(
            { userId },
            { $set: data },
            { upsert: true }
        );
        console.log(`User data saved for userId: ${userId}`);
    } catch (error) {
        console.error("Error saving user data:", error);
    }
}

// Get user data from MongoDB
async function getUserData() {
    try {
        if (!isConnected) await connectDB(true);
        const collection = db.collection(usersCollection);
        return await collection.find().toArray();
    } catch (error) {
        console.error("Error fetching all user data:", error);
        return null;
    }
}

// Fetch now playing track from Last.fm
async function fetchNowPlaying(userId) {
    try {
        if (!isConnected) await connectDB(true);
        const collection = db.collection(usersCollection);
        const userData = await collection.findOne({ userId });
        if (!userData || !userData.lastfmUsername) {
            throw new Error("Last.fm username not set for user.");
        }

        const response = await fetch(`http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${userData.lastfmUsername}&api_key=${lastfmApiKey}&format=json`);
        const data = await response.json();
        const recentTrack = data.recenttracks.track[0];
        const isPlaying = recentTrack['@attr']?.nowplaying === 'true';
        const status = isPlaying ? 'Playing' : 'Paused';

        if (recentTrack) {
            const trackName = recentTrack.name;
            const artistName = recentTrack.artist['#text'];
            const albumName = recentTrack.album['#text'] || 'Unknown Album';

            return {
                userId,
                channelId: userData.channelId,
                tgUser: userData.tgUser,
                trackName,
                artistName,
                albumName,
                status,
                lastPlayed: isPlaying ? new Date().toISOString() : recentTrack.date?.uts || 'N/A',
                lastMessageId: userData.lastMessageId,
            };
        }
    } catch (error) {
        console.error("Error fetching now playing:", error);
        return null;
    }
}

function createText({ trackName, artistName, albumName, status, tgUser }) {
    return `<b>${tgUser || 'User'} is Listening to:</b>\n\n` +
           `<b>Song:</b> ${trackName}\n` +
           `<b>Artist:</b> ${artistName}\n` +
           `<b>Album:</b> ${albumName}\n` +
           `<b>Status:</b> ${status}\n\n` +
           `©<a href="https://akuamods.t.me">AquaMods</a>`;
}

function getReplyMarkup({ id, artistName }) {
    const googleSearchLink = `https://www.google.com/search?q=${encodeURIComponent(artistName + ' artist bio')}`;
    return Markup.inlineKeyboard([
        [
            { text: "Listen Now", url: `https://song.link/s/${id}` },
            { text: "About Artist", url: googleSearchLink },
        ],
    ]);
}

export { connectDB, initializeDatabase, saveUserData, getUserData, fetchNowPlaying, createText, getReplyMarkup };
