// Danielle Westerman
// COMP20 Assigment 3
// Marauder's Map server
// 4/15/15


// Initialization
var express = require('express');
var bodyParser = require('body-parser');
var validator = require('validator'); // See documentation at https://github.com/chriso/validator.js
var app = express();
// See https://stackoverflow.com/questions/5710358/how-to-get-post-query-in-express-node-js
app.use(bodyParser.json());
// See https://stackoverflow.com/questions/25471856/express-throws-error-as-body-parser-deprecated-undefined-extended
app.use(bodyParser.urlencoded({ extended: true }));

// Mongo initialization and connecot to database
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/test';
var MongoClient = require('mongodb').MongoClient, format = require('util').format;
var db = MongoClient.connect(mongoUri, function(error, databaseConnection) {
	db = databaseConnection;
});

// post API
app.post('/sendLocation', function(request, response) {
	response.header("Access-Control-Allow-Origin: *");
	response.header("Access-Control-Allow-Headers: X-Requested-With");
	db.collection('locations', function(err, coll) {
		if (!err) {
			var toInsert = {
				"login": request.body.login,
				"lat" : parseFloat(request.body.lat),
				"lng" : parseFloat(request.body.lng),
				"created_at" : Date.now()
			};
			// console.log(toInsert);
			if ((toInsert.login == undefined) ||
				(toInsert.lat == undefined) ||
				(toInsert.lng == undefined)) {	
					response.status(400).send({"error":"Whoops, something is wrong with your data!"});
				}
			else {
					coll.update({"login": toInsert.login}, toInsert, {upsert: true});
					response.send(JSON.stringify(coll));
			}
		}
		else {
			response.status(500).send();
		}
	});
});


// get API
app.get('/location.json', function(request, response) {
	response.header("Access-Control-Allow-Origin: *");
	response.header("Access-Control-Allow-Headers: X-Requested-With");
	db.collection('locations', function(err, coll) {
		if (!err) {
			coll.find({'login': request.query.login}).toArray(function(err, cursor){
				if (!err) {
					if (cursor.length == 0) {
						response.send({});
					}
					else {
						response.send(JSON.stringify(cursor));
					}
				}
			});
		}
		else {
			response.status(500).send();
		}

	});
});




// home/root
app.get('/', function(request, response) {
	response.set('Content-Type', 'text/html');
	var indexPage = '';
	db.collection('locations', function(er, coll) {
		if (!er) {
			coll.find().toArray(function(err, cursor) {
				if (!err) {
					var x = JSON.stringify(cursor);
					indexPage += "<!DOCTYPE HTML><html><head><title>Where are they now?"
								+ "</title></head><body><h1>Messrs Moony, Wormtail, Padfoor, "
								+ "and Prongs, <br> Purveyors of Aids to Magical Mischief-Makers, "
								+ "<br>are proud to present: <br><i> The Marauder's Map </i></h1>";
					cursor.forEach(function(rec){
						indexPage += "<p>" + rec.login + " checked in at "
									+ rec.lat + ", " + rec.lng
									+ " on " + rec.created_at + "</p>";

					})
					indexPage += "</body></html>"
					response.send(indexPage);
				} else {
					response.status(500).send("<!DOCTYPE HTML><html><head><title>Where are they "
								+ "now?</title></head><body><h1>Messrs Moony, Wormtail, "
								+ "Padfoor, and Prongs, <br> Purveyors of Aids to Magical "
								+ "Mischief-Makers, <br> regret to inform you that something "
								+ "has gone wrong! </h1>");
				}
			});
		}
		else {
			response.send(500);
		}
	});
});

// Oh joy! http://stackoverflow.com/questions/15693192/heroku-node-js-error-web-process-failed-to-bind-to-port-within-60-seconds-of
app.listen(process.env.PORT || 5000);

