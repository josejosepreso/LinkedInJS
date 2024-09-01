import express from 'express';

import { home, login, signout, profile } from '../controllers/UserController.js';

const router = express.Router();

router.post('/user/login', login);

router.get('/home', home);

router.get('/signout', signout);

router.get('/profile', profile);

export default router;
