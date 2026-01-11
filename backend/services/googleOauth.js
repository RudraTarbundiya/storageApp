import { OAuth2Client } from 'google-auth-library'
import { google } from 'googleapis'
import GoogleToken from '../models/googleTokenModel.js'

const client_id = '63206782506-clugu9nar16huil5fcvg51e70fpd9m9v.apps.googleusercontent.com'
const client_secret = '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'
const redirectUri = "http://localhost:5173"

export const verifyIdTokenAndGetUser = async (idToken) => {
    const client = new OAuth2Client({
        clientId: client_id,
        clientSecret: client_secret,
        redirectUri
    });
    const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: client_id
    })
    const userData = ticket.getPayload()
    return userData;
}

//for explicit oauth flow
export default async function fetchToken(code) {
    const client = new google.auth.OAuth2({
        clientId: client_id,
        clientSecret: client_secret,
        redirectUri
    });

    const { tokens } = await client.getToken(code)
    client.setCredentials(tokens);
    const userData = await verifyIdTokenAndGetUser(tokens.id_token);
    await GoogleToken.create({
        userId: userData.sub,
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token,
        expiryDate: tokens.expiry_date,
    })

    return userData.sub;
};

export async function getDriveClient(userId) {
    const tokenDoc = await GoogleToken
        .findOne({ userId })
        .select("+refreshToken +accessToken");

    const client = new google.auth.OAuth2({
        clientId: client_id,
        clientSecret: client_secret,
        redirectUri
    }

    );

    client.setCredentials({
        refresh_token: tokenDoc.refreshToken,
        access_token: tokenDoc.accessToken,
        expiry_date: tokenDoc.expiryDate,
    });

    client.on("tokens", async (tokens) => {
        if (tokens.access_token) {
            await GoogleToken.updateOne(
                { userId },
                {
                    accessToken: tokens.access_token,
                    expiryDate: tokens.expiry_date,
                }
            );
        }
    });

    return google.drive({ version: "v3", auth: client });
}

export async function listDriveFiles(userId, options = {}) {
    const drive = await getDriveClient(userId);
    const res = await drive.files.list({
        pageSize: options.pageSize ?? 10,
        q: options.q ?? 'trashed=false',
        fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, owners(emailAddress))',
        orderBy: options.orderBy ?? 'modifiedTime desc',
        pageToken: options.pageToken
    });
    return res.data;
}