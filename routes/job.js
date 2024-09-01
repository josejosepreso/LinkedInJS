import express from 'express';

import { getJobs} from '../controllers/JobController.js';

const router = express.Router();

router.get('/jobs', getJobs);

export default router;
