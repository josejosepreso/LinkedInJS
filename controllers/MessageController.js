import oracledb from 'oracledb';

const DATABASE_USER = process.env.DATABASE_USER;
const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;
const DATABASE_URL = process.env.DATABASE_URL;

export const messages = (req, res) => {

	res.render('messages');
};
