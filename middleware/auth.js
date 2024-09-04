const auth = (req, res, next) => {

	// console.log(req.url);
	
	// if(!req.session.user) return res.redirect('/login');

	// console.log(req.session.user);

	next();
};

export default auth;
