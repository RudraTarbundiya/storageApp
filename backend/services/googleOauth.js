import { OAuth2Client } from 'google-auth-library'
import { google } from 'googleapis'
import User from '../models/userModel.js'


export const verifyIdTokenAndGetUser = async (idToken) => {
    const client = new OAuth2Client({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI
    });
    const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID
    })
    const userData = ticket.getPayload()
    return userData;
}

//for explicit oauth flow
export default async function fetchToken(code, userId) {
    const client = new google.auth.OAuth2({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: 'postmessage'
    });

    const { tokens } = await client.getToken(code)
    client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const { data: userData } = await oauth2.userinfo.get();
    console.log("Google user data:", userData);
    if (!userId) {
        throw new Error("Authenticated user ID is required to store Google tokens");
    }

    const user = await User.findById(userId).select("+googleTokens");
    if (!user) {
        throw new Error("User not found");
    }
    
    const refreshToken = tokens.refresh_token || user.googleTokens?.refreshToken;
    if (!refreshToken) {
        const error = new Error("Google did not return a refresh token. Please reconnect and grant offline access.");
        error.status = 400;
        throw error;
    }
    
    console.log(refreshToken)
    const newUser =await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                googleTokens: {
                    sub: userData.id,
                    refreshToken,
                    accessToken: tokens.access_token,
                    expiryDate: tokens.expiry_date,
                }
            }
        },
        { new: true }
    );
};

export async function getDriveClient(userId) {
    const user = await User
        .findById(userId)
        .select("+googleTokens");

    if (!user || !user.googleTokens) {
        const error = new Error("Google Drive not authorized");
        error.status = 401;
        throw error;
    }

    const { refreshToken, accessToken, expiryDate } = user.googleTokens;
    const googleTokens = user.googleTokens;

    const client = new google.auth.OAuth2({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI
    });

    client.setCredentials({
        refresh_token: refreshToken,
        access_token: accessToken,
        expiry_date: expiryDate,
    });

    client.on("tokens", async (tokens) => {
        if (tokens.access_token) {
            await User.findByIdAndUpdate(
                userId,
                {
                    $set: {
                        googleTokens: {
                            sub: googleTokens.sub,
                            refreshToken: googleTokens.refreshToken,
                            accessToken: tokens.access_token,
                            expiryDate: tokens.expiry_date,
                        }
                    }
                }
            );
        }
    });

    return google.drive({ version: "v3", auth: client });
}

export async function listDriveFiles(userId, options = {}) {
    const drive = await getDriveClient(userId);

    // Build query - if custom q provided, use it; otherwise default
    let query = options.q;
    if (!query) {
        query = "trashed = false";
    }

    const res = await drive.files.list({
        pageSize: options.pageSize ?? 50,
        q: query,
        fields: 'nextPageToken, files(id,name,mimeType,parents,modifiedTime,size)',
        orderBy: options.orderBy ?? 'modifiedTime desc, name asc',
        pageToken: options.pageToken
    });

    const folders = [];
    const files = [];

    for (const item of res.data.files) {
        if (item.mimeType === "application/vnd.google-apps.folder") {
            folders.push(item);
        } else {
            files.push(item);
        }
    }

    return { folders, files, nextPageToken: res.data.nextPageToken };
}