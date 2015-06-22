var express = require('express')
var mysql = require('mysql')
var connection = require('./connection')
var router = express.Router()

var sql = {

	'selectAirlines' : '' +
	'SELECT DISTINCT A1.airlineCode AS airl FROM airline A1 ORDER BY airl; \
	SELECT A.airlineCode \
	FROM flight F, airline A \
	WHERE F.airlineId = A.airlineId \
	GROUP BY F.airlineId \
	ORDER BY COUNT(*) DESC \
	LIMIT 20;',

	'selectStats': '' +
		'SELECT COUNT(*) AS noFlights1 \
		FROM flight F2, airline A2 \
		WHERE F2.airlineId = A2.airlineId AND A2.airlineCode = ?; \
		SELECT COUNT(*) AS noDelays \
		FROM flight_delayed FD3, flight F3, airline A3 \
		WHERE F3.airlineId=A3.airlineId AND F3.flightId=FD3.flightId AND A3.airlineCode=?; \
		SELECT COUNT(*) AS noCancels\
		FROM flight_canceled FC4, flight F4, airline A4 \
		WHERE F4.airlineId=A4.airlineId AND F4.flightId=FC4.flightId AND A4.airlineCode=?; \
		SELECT IFNULL((Temp1.noofDelays/Temp2.noofFlights)/100, 0) AS perdel \
		FROM (SELECT COUNT(*) AS noofDelays \
				FROM flight_delayed FD3, flight F3, airline A3 \
				WHERE F3.airlineId=A3.airlineId AND F3.flightId=FD3.flightId AND A3.airlineCode=?) Temp1, \
				(SELECT COUNT(F2.flightId) AS noofFlights \
				FROM flight F2, airline A2 \
				WHERE F2.airlineId = A2.airlineId AND A2.airlineCode=?) Temp2; \
		SELECT IFNULL((Temp1.noofCancels/Temp2.noofFlights)/100, 0) AS percan \
		FROM (SELECT COUNT(*) AS noofCancels \
				FROM flight_canceled FC4, flight F4, airline A4 \
				WHERE F4.airlineId=A4.airlineId AND F4.flightId=FC4.flightId AND A4.airlineCode=?) Temp1, \
				(SELECT COUNT(F2.flightId) AS noofFlights \
				FROM flight F2, airline A2 \
				WHERE F2.airlineId = A2.airlineId AND A2.airlineCode = ?) Temp2; \
		SELECT ROUND(IFNULL(AVG(FD3.duration),0)) AS avgDelay \
		FROM flight_delayed FD3, flight F3, airline A3 \
		WHERE F3.airlineId=A3.airlineId AND F3.flightId=FD3.flightId AND A3.airlineCode=?; \
		SELECT D5.type AS name, IFNULL(COUNT(*),0) AS y \
		FROM airline A5, flight F5, flight_delayed FD5, delay D5 \
		WHERE F5.airlineId=A5.airlineId AND F5.flightId=FD5.flightId AND D5.delayId=FD5.delayId AND A5.airlineCode=? \
		GROUP BY D5.type; \
		SELECT C6.type AS name, IFNULL(COUNT(*),0) AS y \
		FROM airline A6, flight F6, flight_canceled FC6, cancel C6 \
		WHERE F6.airlineId=A6.airlineId AND F6.flightId=FC6.flightId AND C6.cancelId=FC6.cancelId AND A6.airlineCode=? \
		GROUP BY C6.type; \
		SELECT AVG(R.rating) as rate \
		FROM airline A, rating R \
		WHERE A.airlineId=R.airlineId AND A.airlineCode=?;'
}


/* GET airline page BEFORE user's choice */
router.get('/', function(req, res) {
	connection.query(sql.selectAirlines, function(err, airlines) {
		//console.log("hello world!!!")
		res.render('airlinechoice', {
			title: 'By airline',
			//console.log(airline[0])
			allairlines: airlines[0],
			topairlines: airlines[1]
		})
	})
})

/* POST user choice */
router.post('/', function(req, res) {
	res.redirect('/airlines/' + req.body.airline)
})

/* GET airline page AFTER user's choice */
router.get('/:id', function(req, res) {
	airlinecode = req.params.id
	connection.query(mysql.format(sql.selectStats, [airlinecode,airlinecode,airlinecode,airlinecode,airlinecode,airlinecode,airlinecode,airlinecode,airlinecode,airlinecode,airlinecode]), function(err, results) {
		console.log("Naya zhamela")
		//console.log(airlinecode)
		console.log(results[8])

	
		res.render('airline', {
			title: req.params.id,
			flightcount: results[0],
			delaycount: results[1],
			cancelcount: results[2],
			perdelay: results[3],
			percancel: results[4],
			avgdelay: results[5],
			delaystats: results[6],
			cancelstats: results[7],
			rating: results[8]
		})
	})
})

module.exports = router