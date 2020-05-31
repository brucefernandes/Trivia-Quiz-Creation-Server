
let added_questions = [];
function change(){

	let category 		= document.getElementById('cat').value;
	let difficulty 		= document.getElementById('diff').value;

	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
	    if (this.readyState == 4 && this.status == 200) {

				let div = document.getElementById("questions");
	       		div.innerHTML = "";

				div.innerHTML = this.responseText;
		   }
	 }
	xhttp.open("GET", `http://localhost:3000/questions?category=${category}&difficulty=${difficulty}`, true);
	xhttp.send();
}


function addQuestion(){
	console.log("Add Checkbox clicked!");

	let target = event.target || event.srcElement;
	let qid = target.id
	target.disabled = true;

	//checks whether we have already have the question
	let bool = false;
	added_questions.forEach( item =>{
		if (item.qid == qid){
			alert("You have already added this question");
			bool = true;
		}
	})

	if (bool == true) return;
	let obj = { 'question' : document.getElementById(qid).innerHTML, 'qid' : qid};
	added_questions.push(obj);
	console.log(added_questions);
	//at this point we know that the question ahs not been addedalready

	render();


}

function render(){
	document.getElementById("addedalready").innerHTML = "";

	added_questions.forEach( item => {

		let a = document.createElement('a');
		a.href = "http://localhost:3000/questions/" + item.qid;
		a.target = "_blank";
		a.innerHTML = item.question;


		let d_checkbox = document.createElement('input');
		d_checkbox.id = item.qid
		d_checkbox.type = "checkbox"
		d_checkbox.setAttribute('onclick', "deleteQuestion()");

		let div = document.getElementById("addedalready");
		div.appendChild(a);
		div.appendChild(d_checkbox);

		div.appendChild(document.createElement("br"));


	})


}

function deleteQuestion(){

	var target = event.target || event.srcElement;
	var qid = target.id

	let counter = 0;
	added_questions.forEach( item => {

		if(item.qid == qid){
			added_questions.splice(counter, 1);
		}
		counter++;
	})
	render()
}


function saveQuiz(){


	let creator = document.getElementById("creator").value;
	if (creator.trim().length <= 0){
		alert("Enter your name daho!");
		return;
	}

	let t = document.getElementById("tags").value;
	if (t.trim().length <= 0){
		alert("Enter a tag baka!");
		return;
	}
	let tags = t.split(" ");

	if(added_questions.length === 0){
		alert("Add atleast one question mate!");
		return;
	}

	let quiz = { 'creator' : creator, 'tags': tags, 'questions' : added_questions};

	var xhttp = new XMLHttpRequest();

	xhttp.onreadystatechange = function() {
	    if (this.readyState == 4 && this.status == 200) {

			let q = JSON.parse(this.response);

			window.location.href = `http://localhost:3000/quiz/${q}`;
		   }
	 }

	xhttp.open("POST", `http://localhost:3000/quizzes`, true);
	xhttp.send(JSON.stringify(quiz));

}
