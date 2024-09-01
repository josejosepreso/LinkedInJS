import oracledb from 'oracledb';

const DATABASE_USER = process.env.DATABASE_USER;
const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;
const DATABASE_URL = process.env.DATABASE_URL;

export const getJobs = async (req, res) => {

	let connection;
	let jobs = [];
	
	try {

		connection = await oracledb.getConnection({ user: DATABASE_USER, password: DATABASE_PASSWORD, connectionString: DATABASE_URL });

		const result = await connection.execute(
			`SELECT  A.CODIGO_OFERTA_LABORAL,
				A.TITULO,
			        B.NOMBRE AS EMPRESA,
			        C.NOMBRE_MODALIDAD AS MODALIDAD,
			        D.NOMBRE_LUGAR || ', ' || E.NOMBRE_LUGAR || ' · ' || A.FECHA_PUBLICACION || ' · ' || F.APLICACIONES AS INFORMACION,
			        A.DESCRIPCION,
			        A.FOTO
			FROM    TBL_OFERTAS_LABORALES A,
			        TBL_EMPRESAS B,
			        TBL_MODALIDADES C,
			        TBL_LUGARES D,
			        TBL_LUGARES E,
			        (
			            SELECT CODIGO_OFERTA_LABORAL, COUNT(*) AS APLICACIONES
			            FROM TBL_APLICACIONES_A_OFERTAS
			            GROUP BY CODIGO_OFERTA_LABORAL
			        ) F
			WHERE A.CODIGO_EMPRESA = B.CODIGO_EMPRESA
			AND A.MODALIDAD = C.CODIGO_MODALIDAD
			AND D.CODIGO_LUGAR = A.UBICACION
			AND D.CODIGO_LUGAR_SUPERIOR = E.CODIGO_LUGAR
			AND A.CODIGO_OFERTA_LABORAL = F.CODIGO_OFERTA_LABORAL`
		);

		jobs = result.rows;

	} catch(error) {

		console.log(error);
	}

	res.render('jobs', { jobs: jobs });
};
