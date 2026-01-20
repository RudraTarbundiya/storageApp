import Router from 'express';
import checkAuth, { checkAdmin } from '../middleware/authMiddlwWare.js';
import { sendPublicFile, getPublicDirData } from '../controller/publicController.js';
import User from '../models/userModel.js';

const router = Router();

// Get user's root directory ID (for admin to start browsing)
router.get('/user/:userId/root', checkAuth, checkAdmin, async (req, res, next) => {
    try {
        const user = await User.findById(req.params.userId).select('rootDirId name email picture').lean();
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ rootDirId: user.rootDirId, user: { name: user.name, email: user.email, picture: user.picture } });
    } catch (err) {
        next(err);
    }
});

router.get('/file/:id', checkAuth, checkAdmin, sendPublicFile)
router.get('/directory/:id', checkAuth, checkAdmin, getPublicDirData)

export default router;