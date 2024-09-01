class Job {

	static showJobModal(id, title, description, img, info, company, type) {
		
		document.querySelector("img#jobImage").src = "";

		document.querySelector("h1#jobTitle").innerText = title;
		document.querySelector("p#jobDescription").innerText = description;
		if(img != "null") document.querySelector("img#jobImage").src = img;
		document.querySelector("p#information").innerText = info + ' personas aplicaron';
		document.querySelector("p#type").innerText = type;
		document.querySelector("p#company").innerText = company;
		
    		let modal = new bootstrap.Modal(document.querySelector(`div#showJobModal`));
		modal.show();
	}
}
