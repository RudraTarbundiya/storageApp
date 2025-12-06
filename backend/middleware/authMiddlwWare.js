import usersData from '../usersDb.json' with {type: "json"}

export default function checkAuth(req, res, next) {
    const { userId } = req.cookies;
    // Matches UUID v1–v5
    const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    const user = usersData.find((user) => user.id === userId);
    if (!UUID_REGEX.test(userId) || !user) {
        return res.status(401).json({ error: "Not logged!" });
    }
    req.user = user
    next()
}
