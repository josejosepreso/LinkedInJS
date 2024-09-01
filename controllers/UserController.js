import oracledb from 'oracledb';

const DATABASE_USER = process.env.DATABASE_USER;
const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;
const DATABASE_URL = process.env.DATABASE_URL;

export const login = async (req, res) => {

	let connection;
	try {

		connection = await oracledb.getConnection({ user: DATABASE_USER, password: DATABASE_PASSWORD, connectionString: DATABASE_URL });

		const result = await connection.execute(`
			SELECT * FROM TBL_USUARIOS WHERE CORREO = '${req.body.email}' AND CONTRASENA = '${req.body.password}'
		`);

		if(result.rows.length > 0) {

			req.session.user = req.body.email;

			return res.status(200).redirect('/home');
		}

		res.status(400).json({msg:"Usuario no encontrado"});
	} catch(error) {
		
		console.log(error);
	}

};

export const home = (req, res) => {

	res.render('home');
};

export const signout = (req, res) => {

	res.redirect('/');
};

export const profile = (req, res) => {

	res.render('profile');
};
