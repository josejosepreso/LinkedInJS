import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import session from 'express-session';

import auth from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import publicRouter from './routes/public.js';
import userRouter from './routes/user.js';
import messageRouter from './routes/message.js';
import jobRouter from './routes/job.js';

//
app.use(session({
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: true
}));

//
app.use(auth);

//
app.use(express.json());

// EJS
app.set('view engine', 'ejs');
app.set('views', 'views');

// Public folder
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', publicRouter, userRouter, messageRouter, jobRouter);

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
