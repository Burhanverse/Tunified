import dotenv from 'dotenv';
import { getIndividualUserData } from './utils.mjs';

dotenv.config();

const lastfmApiKey = process.env.LASTFM_API_KEY;
const lastfmBaseUrl = 'http://ws.audioscrobbler.com/2.0/';

// Helper function to make Last.fm API requests
async function makeLastfmRequest(method, params = {}) {
    const url = new URL(lastfmBaseUrl);
    url.searchParams.set('method', method);
    url.searchParams.set('api_key', lastfmApiKey);
    url.searchParams.set('format', 'json');
    
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.set(key, value);
        }
    });

    try {
        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Last.fm API error for method ${method}:`, error);
        throw error;
    }
}

// Get user's top artists
export async function getUserTopArtists(userId, period = 'overall', limit = 10) {
    try {
        const userData = await getIndividualUserData(userId);
        if (!userData?.lastfmUsername) {
            return { error: "Last.fm username not set. Use /setlastfm to configure." };
        }

        const data = await makeLastfmRequest('user.gettopartists', {
            user: userData.lastfmUsername,
            period,
            limit
        });

        if (!data.topartists?.artist) {
            return { error: "No top artists found." };
        }

        const artists = Array.isArray(data.topartists.artist) 
            ? data.topartists.artist 
            : [data.topartists.artist];

        return {
            success: true,
            data: {
                artists,
                username: userData.lastfmUsername,
                period,
                total: data.topartists['@attr']?.total || artists.length
            }
        };
    } catch (error) {
        console.error('Error getting top artists:', error);
        return { error: "Failed to fetch top artists." };
    }
}

// Get user's top tracks
export async function getUserTopTracks(userId, period = 'overall', limit = 10) {
    try {
        const userData = await getIndividualUserData(userId);
        if (!userData?.lastfmUsername) {
            return { error: "Last.fm username not set. Use /setlastfm to configure." };
        }

        const data = await makeLastfmRequest('user.gettoptracks', {
            user: userData.lastfmUsername,
            period,
            limit
        });

        if (!data.toptracks?.track) {
            return { error: "No top tracks found." };
        }

        const tracks = Array.isArray(data.toptracks.track) 
            ? data.toptracks.track 
            : [data.toptracks.track];

        return {
            success: true,
            data: {
                tracks,
                username: userData.lastfmUsername,
                period,
                total: data.toptracks['@attr']?.total || tracks.length
            }
        };
    } catch (error) {
        console.error('Error getting top tracks:', error);
        return { error: "Failed to fetch top tracks." };
    }
}

// Get user's recent tracks
export async function getUserRecentTracks(userId, limit = 10, from = null, to = null) {
    try {
        const userData = await getIndividualUserData(userId);
        if (!userData?.lastfmUsername) {
            return { error: "Last.fm username not set. Use /setlastfm to configure." };
        }

        const params = {
            user: userData.lastfmUsername,
            limit
        };

        if (from) params.from = from;
        if (to) params.to = to;

        const data = await makeLastfmRequest('user.getrecenttracks', params);

        if (!data.recenttracks?.track) {
            return { error: "No recent tracks found." };
        }

        const tracks = Array.isArray(data.recenttracks.track) 
            ? data.recenttracks.track 
            : [data.recenttracks.track];

        return {
            success: true,
            data: {
                tracks,
                username: userData.lastfmUsername,
                total: data.recenttracks['@attr']?.total || tracks.length
            }
        };
    } catch (error) {
        console.error('Error getting recent tracks:', error);
        return { error: "Failed to fetch recent tracks." };
    }
}

// Get user's loved tracks
export async function getUserLovedTracks(userId, limit = 10) {
    try {
        const userData = await getIndividualUserData(userId);
        if (!userData?.lastfmUsername) {
            return { error: "Last.fm username not set. Use /setlastfm to configure." };
        }

        const data = await makeLastfmRequest('user.getlovedtracks', {
            user: userData.lastfmUsername,
            limit
        });

        if (!data.lovedtracks?.track) {
            return { error: "No loved tracks found." };
        }

        const tracks = Array.isArray(data.lovedtracks.track) 
            ? data.lovedtracks.track 
            : [data.lovedtracks.track];

        return {
            success: true,
            data: {
                tracks,
                username: userData.lastfmUsername,
                total: data.lovedtracks['@attr']?.total || tracks.length
            }
        };
    } catch (error) {
        console.error('Error getting loved tracks:', error);
        return { error: "Failed to fetch loved tracks." };
    }
}

// Get user's top albums
export async function getUserTopAlbums(userId, period = 'overall', limit = 10) {
    try {
        const userData = await getIndividualUserData(userId);
        if (!userData?.lastfmUsername) {
            return { error: "Last.fm username not set. Use /setlastfm to configure." };
        }

        const data = await makeLastfmRequest('user.gettopalbums', {
            user: userData.lastfmUsername,
            period,
            limit
        });

        if (!data.topalbums?.album) {
            return { error: "No top albums found." };
        }

        const albums = Array.isArray(data.topalbums.album) 
            ? data.topalbums.album 
            : [data.topalbums.album];

        return {
            success: true,
            data: {
                albums,
                username: userData.lastfmUsername,
                period,
                total: data.topalbums['@attr']?.total || albums.length
            }
        };
    } catch (error) {
        console.error('Error getting top albums:', error);
        return { error: "Failed to fetch top albums." };
    }
}

// Get user's listening statistics
export async function getUserInfo(userId) {
    try {
        const userData = await getIndividualUserData(userId);
        if (!userData?.lastfmUsername) {
            return { error: "Last.fm username not set. Use /setlastfm to configure." };
        }

        const data = await makeLastfmRequest('user.getinfo', {
            user: userData.lastfmUsername
        });

        if (!data.user) {
            return { error: "User information not found." };
        }

        return {
            success: true,
            data: {
                user: data.user,
                username: userData.lastfmUsername
            }
        };
    } catch (error) {
        console.error('Error getting user info:', error);
        return { error: "Failed to fetch user information." };
    }
}

// Get weekly artist chart
export async function getUserWeeklyArtistChart(userId, from = null, to = null) {
    try {
        const userData = await getIndividualUserData(userId);
        if (!userData?.lastfmUsername) {
            return { error: "Last.fm username not set. Use /setlastfm to configure." };
        }

        const params = {
            user: userData.lastfmUsername
        };

        if (from) params.from = from;
        if (to) params.to = to;

        const data = await makeLastfmRequest('user.getweeklyartistchart', params);

        if (!data.weeklyartistchart?.artist) {
            return { error: "No weekly artist chart found." };
        }

        const artists = Array.isArray(data.weeklyartistchart.artist) 
            ? data.weeklyartistchart.artist 
            : [data.weeklyartistchart.artist];

        return {
            success: true,
            data: {
                artists,
                username: userData.lastfmUsername,
                from: data.weeklyartistchart['@attr']?.from,
                to: data.weeklyartistchart['@attr']?.to
            }
        };
    } catch (error) {
        console.error('Error getting weekly artist chart:', error);
        return { error: "Failed to fetch weekly artist chart." };
    }
}

// Get weekly track chart
export async function getUserWeeklyTrackChart(userId, from = null, to = null) {
    try {
        const userData = await getIndividualUserData(userId);
        if (!userData?.lastfmUsername) {
            return { error: "Last.fm username not set. Use /setlastfm to configure." };
        }

        const params = {
            user: userData.lastfmUsername
        };

        if (from) params.from = from;
        if (to) params.to = to;

        const data = await makeLastfmRequest('user.getweeklytrackchart', params);

        if (!data.weeklytrackchart?.track) {
            return { error: "No weekly track chart found." };
        }

        const tracks = Array.isArray(data.weeklytrackchart.track) 
            ? data.weeklytrackchart.track 
            : [data.weeklytrackchart.track];

        return {
            success: true,
            data: {
                tracks,
                username: userData.lastfmUsername,
                from: data.weeklytrackchart['@attr']?.from,
                to: data.weeklytrackchart['@attr']?.to
            }
        };
    } catch (error) {
        console.error('Error getting weekly track chart:', error);
        return { error: "Failed to fetch weekly track chart." };
    }
}

// Get artist information
export async function getArtistInfo(artistName, username = null) {
    try {
        const params = {
            artist: artistName
        };

        if (username) params.username = username;

        const data = await makeLastfmRequest('artist.getinfo', params);

        if (!data.artist) {
            return { error: "Artist information not found." };
        }

        return {
            success: true,
            data: {
                artist: data.artist
            }
        };
    } catch (error) {
        console.error('Error getting artist info:', error);
        return { error: "Failed to fetch artist information." };
    }
}

// Get track information
export async function getTrackInfo(artistName, trackName, username = null) {
    try {
        const params = {
            artist: artistName,
            track: trackName
        };

        if (username) params.username = username;

        const data = await makeLastfmRequest('track.getinfo', params);

        if (!data.track) {
            return { error: "Track information not found." };
        }

        return {
            success: true,
            data: {
                track: data.track
            }
        };
    } catch (error) {
        console.error('Error getting track info:', error);
        return { error: "Failed to fetch track information." };
    }
}

// Helper function to format period names
export function formatPeriod(period) {
    const periods = {
        'overall': 'All Time',
        '7day': 'Last 7 Days',
        '1month': 'Last Month',
        '3month': 'Last 3 Months',
        '6month': 'Last 6 Months',
        '12month': 'Last Year'
    };
    return periods[period] || period;
}

// Helper function to format numbers
export function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Helper function to escape HTML entities
export function escapeHTML(text) {
    if (!text) return '';
    return text.replace(/[<>&"']/g, (char) => {
        switch (char) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '"': return '&quot;';
            case "'": return '&#39;';
            default: return char;
        }
    });
}
