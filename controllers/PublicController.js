import oracledb from 'oracledb';

const DATABASE_USER = process.env.DATABASE_USER;
const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;
const DATABASE_URL = process.env.DATABASE_URL;

export const welcome = (req, res) => {

	res.render('index');
};

export const login = (req, res) => {

	res.render('login');
};

export const register = async (req, res) => {

	let connection;
	let places = [];

	try {

		connection = await oracledb.getConnection({ user: DATABASE_USER, password: DATABASE_PASSWORD, connectionString: DATABASE_URL });

		const result = await connection.execute(
			`SELECT *
			FROM (
				SELECT  A.NOMBRE_LUGAR,B.NOMBRE_LUGAR AS LUGAR_SUPERIOR,C.NOMBRE_LUGAR AS LUGAR_SUPER_SUPERIOR
				FROM TBL_LUGARES A LEFT JOIN TBL_LUGARES B ON (A.CODIGO_LUGAR_SUPERIOR = B.CODIGO_LUGAR)
				LEFT JOIN TBL_LUGARES C ON (B.CODIGO_LUGAR_SUPERIOR = C.CODIGO_LUGAR)
			)
			WHERE LUGAR_SUPERIOR IS NOT NULL
			AND LUGAR_SUPER_SUPERIOR IS NOT NULL`
		);

		places = result.rows;

	} catch(error) {

		console.error(error);
	}

	res.render('register', { places: places });
};
