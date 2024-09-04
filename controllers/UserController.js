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

			const user = result.rows[0];

			req.session.user = {
				
				id: user[0],
				name: user[3] + " " + user[4],
				photo: user[12]
			};

			return res.status(200).redirect('/home');
		}

		res.status(400).json({msg:"Usuario no encontrado"});
	} catch(error) {
		
		console.log(error);
	}

};

export const home = async (req, res) => {

	let posts = [];
	let currentJob = '';
	let notFollowed = [];

	let connection;

	try {

		connection = await oracledb.getConnection({ user: DATABASE_USER, password: DATABASE_PASSWORD, connectionString: DATABASE_URL });

		let result;

		//
		result = await connection.execute(
			`WITH SIGUIENDO AS (
				SELECT CODIGO_USUARIO_SIGUIENDO
				FROM TBL_SEGUIDORES
				WHERE CODIGO_USUARIO_SEGUIDOR = ${req.session.user.id}
				UNION SELECT ${req.session.user.id} FROM DUAL
			),
			REACCIONES AS (
				SELECT  A.CODIGO_PUBLICACION,
					COUNT(B.CODIGO_REACCION) AS CANTIDAD_REACCIONES
				FROM 	TBL_PUBLICACIONES A,
					TBL_REACCIONES_POR_PUBLICACION B
				WHERE A.CODIGO_PUBLICACION = B.CODIGO_PUBLICACION (+)
				GROUP BY A.CODIGO_PUBLICACION
			),
			COMENTARIOS AS (
				SELECT  A.CODIGO_PUBLICACION,
					COUNT(B.CODIGO_COMENTARIO) AS CANTIDAD_COMENTARIOS
				FROM 	TBL_PUBLICACIONES A,
					TBL_COMENTARIOS B
				WHERE A.CODIGO_PUBLICACION = B.CODIGO_PUBLICACION (+)
				GROUP BY A.CODIGO_PUBLICACION
			)
			SELECT	DISTINCT A.CODIGO_PUBLICACION,
				G.NOMBRE_REACCION,
				B.CODIGO_USUARIO_SIGUIENDO,
				C.NOMBRE || ' ' || C.APELLIDO AS USUARIO,
				A.CONTENIDO,
				TO_CHAR(A.FECHA_PUBLICACION, 'DD/MM/YY') AS FECHA_PUBLICACION,
				D.CANTIDAD_REACCIONES,
				E.CANTIDAD_COMENTARIOS,
				C.NOMBRE_FOTO_PERFIL
			FROM 	TBL_PUBLICACIONES A,
				SIGUIENDO B,
				TBL_USUARIOS C,
				REACCIONES D,
				COMENTARIOS E,
				TBL_REACCIONES_POR_PUBLICACION F,
				TBL_REACCIONES G
			WHERE A.CODIGO_USUARIO = B.CODIGO_USUARIO_SIGUIENDO
			AND C.CODIGO_USUARIO = A.CODIGO_USUARIO
			AND D.CODIGO_PUBLICACION = A.CODIGO_PUBLICACION
			AND E.CODIGO_PUBLICACION = A.CODIGO_PUBLICACION
			AND A.CODIGO_PUBLICACION = F.CODIGO_PUBLICACION (+)
			AND F.CODIGO_REACCION = G.CODIGO_REACCION (+)
			AND F.CODIGO_USUARIO (+) = ${req.session.user.id}
			ORDER BY FECHA_PUBLICACION DESC`
		);

		posts = result.rows;

		//
		result = await connection.execute(
			`SELECT  A.PUESTO || ' en ' || B.NOMBRE AS PUESTO_ACTUAL
			FROM 	TBL_EXPERIENCIAS_LABORALES A,
				TBL_EMPRESAS B
			WHERE A.FECHA_FIN IS NULL
			AND B.CODIGO_EMPRESA = A.CODIGO_EMPRESA
			AND CODIGO_USUARIO = ${req.session.user.id}`
		);

		currentJob = result.rows[0];

		//
		result = await connection.execute(
			`WITH NO_SIGUIENDO AS (
			    SELECT CODIGO_USUARIO
			    FROM (
			        SELECT CODIGO_USUARIO_SIGUIENDO
			        FROM TBL_SEGUIDORES
			        WHERE CODIGO_USUARIO_SEGUIDOR = ${req.session.user.id}
			    ) A
			    RIGHT JOIN TBL_USUARIOS B
			    ON (A.CODIGO_USUARIO_SIGUIENDO = B.CODIGO_USUARIO)
			    WHERE A.CODIGO_USUARIO_SIGUIENDO IS NULL
			    AND CODIGO_USUARIO <> ${req.session.user.id}
			)
			SELECT  A.CODIGO_USUARIO,
				A.NOMBRE || ' ' || A.APELLIDO AS NOMBRE_USUARIO,
			        A.DESCRIPCION,
			        A.NOMBRE_FOTO_PERFIL
			FROM TBL_USUARIOS A
			INNER JOIN NO_SIGUIENDO B
			ON (A.CODIGO_USUARIO = B.CODIGO_USUARIO)`
		);

		notFollowed = result.rows;
	} catch(error) {

		console.log(error);
	}

	res.render('home', {
		name: req.session.user.name,
		photo: req.session.user.photo,
		posts: posts,
		currentJob: currentJob,
		notFollowed: notFollowed
	});
};

export const signout = (req, res) => {

	req.session.destroy();

	res.redirect('/');
};

export const profile = (req, res) => {

	res.render('profile');
};
