import { Router } from 'express';
import { googleLogin } from '../controllers/signin.controller.js';

const router = Router();

/**
 * @route   POST /api/auth/google
 * @desc    Authenticate user via Google and issue JWT
 * @access  Public
 */
router.post('/google', googleLogin);

export default router;