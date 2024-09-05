import oracledb from 'oracledb';

export const login = async (req, res) => {

	let connection;
	try {

		connection = await oracledb.getConnection({
			user: process.env.DATABASE_USER,
			password: process.env.DATABASE_PASSWORD,
			connectionString: process.env.DATABASE_URL
		});

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

		connection = await oracledb.getConnection({
			user: process.env.DATABASE_USER,
			password: process.env.DATABASE_PASSWORD,
			connectionString: process.env.DATABASE_URL
		});

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
				TO_CHAR(A.FECHA_PUBLICACION, 'DD-MM-YY') AS FECHA_PUBLICACION,
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
		user: req.session.user,
		posts: posts,
		currentJob: currentJob,
		notFollowed: notFollowed
	});
};

export const profile = async (req, res) => {

	const id = req.query.id;

	let connection;

	let personalInfo = [];
	let experiences = [];
	let education = [];
	let achievements = [];
	let skills = [];

	try {

		connection = await oracledb.getConnection({
			user: process.env.DATABASE_USER,
			password: process.env.DATABASE_PASSWORD,
			connectionString: process.env.DATABASE_URL
		});

		let result;

		result = await connection.execute(
			`WITH PUESTO_ACTUAL AS (
				SELECT  A.CODIGO_USUARIO,
					A.PUESTO || ' en '  || B.NOMBRE AS PUESTO_ACTUAL
				FROM 	TBL_EXPERIENCIAS_LABORALES A,
					TBL_EMPRESAS B
				WHERE A.CODIGO_EMPRESA = B.CODIGO_EMPRESA
				AND FECHA_FIN IS NULL
			)
			SELECT 	A.NOMBRE || ' ' || A.APELLIDO AS NOMBRE_COMPLETO,
				A.NOMBRE_FOTO_PERFIL,
				B.PUESTO_ACTUAL,
				A.CORREO,
				C.NOMBRE_LUGAR || ', ' || D.NOMBRE_LUGAR AS LUGAR_RESIDENCIA,
				A.DESCRIPCION,
				A.TELEFONO
			FROM TBL_USUARIOS A,PUESTO_ACTUAL B,TBL_LUGARES C,TBL_LUGARES D
			WHERE A.CODIGO_USUARIO = B.CODIGO_USUARIO (+)
			AND C.CODIGO_LUGAR = A.LUGAR_RESIDENCIA
			AND C.CODIGO_LUGAR_SUPERIOR = D.CODIGO_LUGAR
			AND A.CODIGO_USUARIO = ${id}`
		);

		personalInfo = result.rows[0];

		result = await connection.execute(
			`SELECT A.PUESTO,
				B.NOMBRE AS EMPRESA,
				A.FECHA_INICIO || ' - ' || NVL(TO_CHAR(A.FECHA_FIN),'Ahora') AS TIEMPO
			FROM 	TBL_EXPERIENCIAS_LABORALES A,
				TBL_EMPRESAS B
			WHERE A.CODIGO_EMPRESA = B.CODIGO_EMPRESA
			AND A.CODIGO_USUARIO = ${id}`
		);

		experiences = result.rows;

		result = await connection.execute(
			`SELECT	A.TITULO,B.NOMBRE AS INSTITUCION,
				A.FECHA_INICIO || ' - ' || NVL(TO_CHAR(A.FECHA_FIN),'Ahora') AS TIEMPO
			FROM	TBL_TITULOS_ACADEMICOS A,
				TBL_INSTITUCIONES B
			WHERE B.CODIGO_INSTITUCION = A.CODIGO_INSTITUCION
			AND CODIGO_USUARIO = ${id}`
		);

		education = result.rows;

		result = await connection.execute(
			`SELECT	A.TITULO || ' (' || B.NOMBRE || ')' AS TITULO,
				C.NOMBRE AS INSTITUCION,
				TO_CHAR(A.FECHA_OBTENCION, 'DD-MM-YY') AS FECHA_OBTENCION
			FROM 	TBL_LOGROS A,
				TBL_TIPOS_LOGROS B,
				TBL_INSTITUCIONES C
			WHERE A.CODIGO_TIPO_LOGRO = B.CODIGO_TIPO_LOGRO
			AND C.CODIGO_INSTITUCION = A.REMITIDO_POR
			AND A.CODIGO_USUARIO = ${id}`
		);

		achievements = result.rows;

		result = await connection.execute(
			`WITH APROBACIONES AS (
				SELECT  CODIGO_USUARIO,
					CODIGO_HABILIDAD,
					COUNT(*) AS NUMERO_APROBACIONES
				FROM TBL_APROBACIONES_HABILIDADES
				GROUP BY CODIGO_USUARIO,CODIGO_HABILIDAD
			)
			SELECT	C.NOMBRE AS HABILIDAD,
				NVL(B.NUMERO_APROBACIONES,0) AS APROBACIONES
			FROM 	TBL_HABILIDADES_POR_USUARIOS A,
				APROBACIONES B,
				TBL_HABILIDADES C
			WHERE A.CODIGO_HABILIDAD = B.CODIGO_HABILIDAD (+)
			AND A.CODIGO_USUARIO = B.CODIGO_USUARIO (+)
			AND C.CODIGO_HABILIDAD = A.CODIGO_HABILIDAD
			AND A.CODIGO_USUARIO = ${id}`
		);

		skills = result.rows;
	} catch(error) {

		console.log(error);
	}

	const flag = (parseInt(id) === req.session.user.id) ? true : false;

	res.render('profile', {
		user: req.session.user,
		personalInfo: personalInfo,
		experiences: experiences,
		education: education,
		achievements: achievements,
		skills: skills,
		flag: flag
	});
};

export const signout = (req, res) => {

	req.session.destroy();

	res.redirect('/');
};


