import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { InlineKeyboard } from 'grammy';

dotenv.config();

const lastfmApiKey = process.env.LASTFM_API_KEY;
let dbClient;
const databaseName = 'TunifiedDB';
const usersCollection = 'users';
let db;
let isConnected = false;

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

async function initializeDatabase() {
    await connectDB();
    if (!isConnected) try {
        console.log("Initializing database...");
        await db.createCollection(usersCollection);
        console.log("Users collection created successfully");
    } catch (error) {
        if (error.code !== 48) {
            console.error("Error creating users collection:", error);
        }
    }
}

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

async function fetchNowPlaying(userId, lastPlayed) {
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
            const albumName = recentTrack.album['#text'] || '';

            const trackInfoResponse = await fetch(`http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${lastfmApiKey}&artist=${encodeURIComponent(artistName)}&track=${encodeURIComponent(trackName)}&username=${userData.lastfmUsername}&format=json`);
            const trackInfoData = await trackInfoResponse.json();
            const playCount = trackInfoData.track.userplaycount || 'N/A';

            return {
                userId,
                channelId: userData.channelId,
                tgUser: userData.tgUser,
                trackName,
                artistName,
                albumName,
                status,
                playCount,
                lastMessageId: userData.lastMessageId,
                lastfmUsername: userData.lastfmUsername,
            };
        }
    } catch (error) {
        console.error("Error fetching now playing:", error);
        return null;
    }
}

function createText({ trackName, artistName, albumName, status, tgUser, playCount, lastfmUsername }) {
    return `<b><i><a href="https://www.last.fm/user/${encodeURIComponent(lastfmUsername)}">${tgUser || 'User'}</a> is Listening to:</i></b>\n\n` +
        `<b><i>Song:</i></b> ${trackName}\n` +
        `<b><i>Artist:</i></b> ${artistName}\n` +
        `${albumName ? `<b><i>Album:</i></b> ${albumName}\n` : ''}` +
        `<b><i>Play Count:</i></b> ${playCount}\n` +
        `<b><i>Status:</i></b> ${status}\n\n` +
        `<a href="https://burhanverse.t.me">𝘗𝘳𝘫𝘬𝘵:𝘚𝘪𝘥.</a>`;
}

function getReplyMarkup({ id, artistName }) {
    const googleSearchLink = `https://www.google.com/search?q=${encodeURIComponent(artistName + ' artist bio')}`;
    const keyboard = new InlineKeyboard()
        .url("Listen Now", `https://song.link/y/${id}`)
        .url("About Artist", googleSearchLink);

    return { reply_markup: keyboard };
}

export { connectDB, initializeDatabase, saveUserData, getUserData, fetchNowPlaying, createText, getReplyMarkup };
