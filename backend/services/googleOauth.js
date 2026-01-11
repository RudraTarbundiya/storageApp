import { OAuth2Client } from 'google-auth-library'
import { google } from 'googleapis'

const client_id = '63206782506-clugu9nar16huil5fcvg51e70fpd9m9v.apps.googleusercontent.com'
const client_secret = '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'

const client = new OAuth2Client({
    clientId: client_id,
    clientSecret: client_secret
});

export async function getOauthUrl() {
    const url = client.generateAuthUrl({
        scope: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/drive.readonly'],
        access_type: 'offline',
        prompt: 'consent'
    });
    return url;
}

export const verifyIdTokenAndGetUser = async (idToken) => {
    const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: client_id
    })
    const userData = ticket.getPayload()
    return userData;
}

//for explicit oauth flow
export default async function fetchIdToken(code) {

    const { tokens } = await client.getToken(code)
    client.setCredentials(tokens);
    const userData = await verifyIdTokenAndGetUser(tokens.id_token);

    // tokensArr.push({tokens, userId : userData.sub});
    // await writeFile("tokens.json", JSON.stringify(tokensArr, null, 2));
    return { userData, tokens };
};

export async function listDriveFiles(userId, options = {}) {
    const userTokens = tokensArr.find(item => item.userId === userId)?.tokens;
    if (!userTokens) {
        throw new Error('User tokens not found');
    }
    client.setCredentials(userTokens);

    const drive = google.drive({ version: 'v3', auth: client });
    const res = await drive.files.list({
        pageSize: options.pageSize ?? 10,
        q: options.q ?? 'trashed=false',
        fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, owners(emailAddress))',
        orderBy: options.orderBy ?? 'modifiedTime desc',
        pageToken: options.pageToken
    });
    return res.data;
}