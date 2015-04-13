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

// function getCORS(method, url) {
// 	var xhr = new XMLHttpRequest();
// 	xhr.open("get", "mongodb://localhost/test")
// }

// post API
app.post('/sendLocation', function(request, response) {
	db.collection('locations', function (err, coll) {
		coll.find().forEach(function(request, response) {
			var login = request.body.login;
			var lat = request.body.lat;
			var lng = request.body.lng;
			var date = Date.now();
			var toInsert = {
				"login": login,
				"lat" : lat,
				"lng" : lng,
				"created_at" : date
			};
			if ((toInsert.login == undefined) ||
				(toInsert.lat == undefined) ||
				(toInsert.lng == undefined)) {	
					response.status(500).send({"error":"Whoops, something is wrong with your data!"});
				}
			else {
				db.locations.find({"login": login}).toArray(function (err, arr){
					if (arr.length == 0) {
						coll.insert(toInsert);
						response.status(200).send(JSON.stringify(db.locations.find()));
					}
					else {
						coll.update({"login": login}, {"lat": lat, "lng": lng, "created_at": date});
						response.status(200).send(JSON.stringify(db.locations.find()));
					}
				});
			}
		});
	});
});

/*
// get API
app.get('/location.json', function (request, response) {
	


})

*/


// home/root
app.get('/', function(request, response) {
	response.set('Content-Type', 'text/html');
	var indexPage = '';
	db.collection('locations', function(er, collection) {
		if (!er) {
			collection.find().toArray(function(err, cursor) {
				if (!err) {
					x = JSON.stringify(cursor);
					indexPage += "<!DOCTYPE HTML><html><head><title>Where are they now?"
								+ "</title></head><body><h1>Messers Moony, Wormtail, Padfoor, "
								+ "and Prongs, Purveyors of Aids to Magical Mischief-Makers, "
								+ "are proud to present: The Marauder's Map </h1>";
					for (var count = 0; count < x.length; count++) {
						indexPage += "<p> count is: " + count + "<p>";
						indexPage += "<p>" + x[count].login + " checked in at "
									+ x[count].lat + ", " + x[count].lng
									+ " on " + x[count].created_at + "<p>";
					}
					indexPage += "</body></html>"
					response.send(indexPage);
				} else {
					response.send("<!DOCTYPE HTML><html><head><title>Where are they "
								+ "now?</title></head><body><h1>Messers Moony, Wormtail, "
								+ "Padfoor, and Prongs, Purveyors of Aids to Magical "
								+ "Mischief-Makers, regret to inform you that something "
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

