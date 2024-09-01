import express from 'express';

import { welcome, login, register } from '../controllers/PublicController.js';

const router = express.Router();

router.get('/', welcome);

router.get('/login', login);

router.get('/register', register);

export default router;
