const form = document.querySelector("form#login-form");
const answer = document.querySelector("div#answer");

async function login(e) {

	e.preventDefault();

	const formData = new FormData(this);
	const email = formData.get("email");
	const password = formData.get("password");

	try {

		const res = await fetch("http://localhost:8000/user/login", {

			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({email,password}),
		});

		if(res.redirected) {

			answer.textContent = "Inicio sesion exitosamente";

			window.location.href = res.url;

			return;
		}

		answer.textContent = "Usuario no encontrado";
	} catch(error) {

		console.log(error);
	}
}

form.addEventListener("submit", login);
