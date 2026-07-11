import express from 'express';
import * as friendController from '../controllers/friendController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);

router.post('/request', friendController.sendRequest);
router.get('/pending', friendController.getPending);
router.post('/accept', friendController.acceptRequest);
router.post('/reject', friendController.rejectRequest);
router.get('/search', friendController.searchUsers);
router.get('/', friendController.getFriends);
router.get('/:friendId/passport', friendController.getFriendPassport);
router.get('/:friendId', friendController.getFriendProfile);
router.delete('/:friendId', friendController.unfriend);

export default router;