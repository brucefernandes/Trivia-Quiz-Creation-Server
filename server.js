//Create express app
const express = require('express');
const http = require('http');


let app = express();

//Database variables
let mongo = require('mongodb');
let MongoClient = mongo.MongoClient;
let db;
app.use(express.urlencoded({extended: true}));
app.use(express.json())
//View engine
app.set("view engine", "pug");

//Set up the routes
app.use(express.static("public"));
app.get("/questions",getQuestions);
app.get("/questions/:qID", sendQuestion);
app.get("/createquiz", createQuiz);
app.get("/quizzes", quizQuery);
app.get("/quiz/:quizID", displayQuiz);
app.post("/quizzes", saveQuiz);



let categories = {}
let difficulties = {}




function getQuestions(req, res, next){

	let query = {};

	if (req.query.category) query['category'] = req.query.category;
	if (req.query.difficulty) query['difficulty'] = req.query.difficulty;

	console.log("Category and Difficulty chosen: " + JSON.stringify(query));

	let query_options = {
		"limit":25
	}

	res.format({
	  'text/html': function () {
		console.log("The request was HTML..");
		db.collection("questions").find(query, query_options).toArray(function(err, result){
		   if(err){
			   res.status(500).send("Error reading database.");
			   return;
		   }
		   res.status(200).render('question_list', {'questions' : result});

	   });

	  },

	  'application/json': function () {
		 console.log("The request was JSON..");

		 db.collection("questions").find(query, query_options).toArray(function(err, result){
 			if(err){
 				res.status(500).send("Error reading database.");
 				return;
 			}
			let reply = { 'questions': result};
			res.status(200).send(JSON.stringify(reply))
 		});
	  },
	})
}

function sendQuestion(req, res, next){
	let oid;
	try{
		oid = new mongo.ObjectID(req.params.qID);
	}catch{
		res.status(404).send("Unknown ID");
		console.log('cant find it 1');
		return;
	}

	db.collection("questions").findOne({"_id":oid}, function(err, result){
		if(err){
			res.status(500).send("Error reading database.");
			return;
		}
		if(!result){
			res.status(404).send("Unknown ID");
			console.log('cant find it 2');

			return;
		}

		res.format({

		  'text/html': function () {
		    res.status(200).render("question", result);
		  },

		  'application/json': function () {
		    res.send(JSON.stringify(result));
		  },

		})

	});

}

function createQuiz(req, res, next){

	res.status(200).render('createquiz', {'difficulties': difficulties, 'categories': categories});

}

function saveQuiz(req, res, next){
	let body = ""
	req.on('data', (chunk) => {
		body += chunk;
	})

	req.on('end', () => {
		let quiz = JSON.parse(body);

		let quiz_questions = quiz.questions;

		let q_ids = [];
		quiz_questions.forEach( obj =>{
			 let o = new mongo.ObjectID(obj.qid);
			 q_ids.push(o);
		})

		let query = {'_id': {$in: q_ids}}

		db.collection("questions").find(query).toArray(function(err, question_objects){
			quiz['questions'] = question_objects;

			db.collection("quizzes").insertOne(quiz, function(err, result){
	  			if(err) throw err;
	  			console.log("Successfuly inserted " + result.insertedCount + " documents.")

				console.log('Redirecting to client..');
				res.status(200).send(JSON.stringify(result.insertedId));

	  		});

		});




	})
}


function displayQuiz(req, res, next){
	let quizID;
	try{
		quizID = new mongo.ObjectID(req.params.quizID);
	}catch{
		res.status(404).send("Unknown ID");
		console.log('cant find it 1');
		return;
	}
	console.log(quizID);

	db.collection("quizzes").findOne({"_id":quizID}, function(err, result){
		if(err){
			res.status(500).send("Error reading database.");
			return;
		}
		if(!result){
			res.status(404).send("Unknown ID");
			console.log('cant find it 2');

			return;
		}

		res.format({

		  'text/html': function () {
			res.status(200).render("displayQuiz", {quiz: result});
		  },

		  'application/json': function () {
			res.send(JSON.stringify(result));
		  },

		})

	});
}


function quizQuery(req, res, next){

	let query = {}

	if(req.query.creator) {
		var re = new RegExp(req.query.creator);
		console.log(re);
		query['creator'] = {$regex: re, $options: 'i' };
	}

	if(req.query.tag) {
		var re = new RegExp(`^${req.query.tag}$`);
		
		query['tags'] = {$elemMatch: {$regex: re, $options: 'im'}}

	}


	db.collection("quizzes").find(query).toArray(function(err, result){
	   if(err){
		   res.status(500).send("Error reading database.");
		   return;
	   }

	   res.format({

	   	  'text/html': function () {
	   		res.status(200).render("quiz_list", {quiz: result});
	   	  },

	   	  'application/json': function () {
	   		res.send(JSON.stringify(result));
	   	  },

	   	})

   	});







}

// Initialize database connection
MongoClient.connect("mongodb://localhost:27017/", function(err, client) {
  if(err) throw err;

  //Get the t8 database
  db = client.db('a4');

  console.log("Sending difficulties....");
  db.collection('questions').distinct('difficulty', function(err, dif){
	console.log("Retrieving diffculties...");
	difficulties = dif;
	console.log("Difficulties retrieved: " + dif);


  });

  console.log("Sending categories....");
  db.collection('questions').distinct('category', function(err, cat){
	  console.log("Retrieving categories...");
	  categories = cat;
	  console.log("Categories retrived: " + cat)
	  console.log("Finished Retrieving categories...");


  });


  // Start server once Mongo is initialized
  app.listen(3000);
  console.log("Listening on port 3000");
});
