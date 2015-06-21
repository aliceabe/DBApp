var express = require('express')
var mysql = require('mysql')
var connection = require('./connection')
var router = express.Router()

var sql = {
	'selectAirport': 'SELECT A.airportCode AS airp FROM airport A;',

	'selectStats': '' +
					'SELECT COUNT(F1.flightId) AS flightcount \
					FROM airport A1, route R1, flight F1 \
					WHERE (A1.airportId=R1.orig OR A1.airportId=R1.dest) AND R1.routeId=F1.routeId AND A1.airportCode=?; \
					SELECT COUNT(FD2.delayId) AS delaycount \
					FROM airport A2, route R2, flight F2, flight_delayed FD2 \
					WHERE (A2.airportId=R2.orig OR A2.airportId=R2.dest) AND R2.routeId=F2.routeId AND F2.flightId=FD2.flightId AND A2.airportCode=?; \
					SELECT COUNT(FC3.cancelId) AS cancelcount \
					FROM airport A3, route R3, flight F3, flight_canceled FC3 \
					WHERE (A3.airportId=R3.orig OR A3.airportId=R3.dest) AND R3.routeId=F3.routeId AND F3.flightId=FC3.flightId AND A3.airportCode=?; \
					SELECT IFNULL((Temp2.delaycount1/Temp1.flightcount1)*100,0) AS perdel \
					FROM (SELECT COUNT(F1.flightId) AS flightcount1 \
						FROM airport A1, route R1, flight F1 \
						WHERE (A1.airportId=R1.orig OR A1.airportId=R1.dest) AND R1.routeId=F1.routeId AND A1.airportCode=?) Temp1, \
						(SELECT COUNT(FD2.delayId) AS delaycount1 \
						FROM airport A2, route R2, flight F2, flight_delayed FD2 \
						WHERE (A2.airportId=R2.orig OR A2.airportId=R2.dest) AND R2.routeId=F2.routeId AND F2.flightId=FD2.flightId AND A2.airportCode=?) Temp2; \
					SELECT IFNULL((Temp2.cancelcount2/Temp1.flightcount2)*100,0) AS percan \
					FROM (SELECT COUNT(F1.flightId) AS flightcount2 \
						FROM airport A1, route R1, flight F1 \
						WHERE (A1.airportId=R1.orig OR A1.airportId=R1.dest) AND R1.routeId=F1.routeId AND A1.airportCode=?) Temp1, \
						(SELECT COUNT(FC3.cancelId) AS cancelcount2 \
						FROM airport A3, route R3, flight F3, flight_canceled FC3 \
						WHERE (A3.airportId=R3.orig OR A3.airportId=R3.dest) AND R3.routeId=F3.routeId AND F3.flightId=FC3.flightId AND A3.airportCode=?) Temp2; \
					SELECT IFNULL(AVG(FD4.duration),0) AS avgdelay \
					FROM airport A4, route R4, flight F4, flight_delayed FD4 \
					WHERE (A4.airportId=R4.orig OR A4.airportId=R4.dest) AND R4.routeId=F4.routeId AND F4.flightId=FD4.flightId AND A4.airportCode=?; \
					SELECT D5.type AS name, IFNULL(AVG(FD5.duration),0) AS y \
					FROM airport A5, route R5, flight F5, flight_delayed FD5, delay D5 \
					WHERE (A5.airportId=R5.orig OR A5.airportId=R5.dest) AND R5.routeId=F5.routeId AND F5.flightId=FD5.flightId AND A5.airportCode=? AND D5.delayId=FD5.delayId \
					GROUP BY D5.type; \
					SELECT C6.type AS name, IFNULL(COUNT(FC6.cancelId),0) AS y \
					FROM airport A6, route R6, flight F6, flight_canceled FC6, cancel C6 \
					WHERE (A6.airportId=R6.orig OR A6.airportId=R6.dest) AND R6.routeId=F6.routeId AND F6.flightId=FC6.flightId AND A6.airportCode=? AND C6.cancelId=FC6.cancelId \
					GROUP BY C6.type;'
}

/* GET airline page BEFORE user's choice */
router.get('/', function(req, res) {
	connection.query(sql.selectAirport, function(err, airport) {
		//console.log("hello world!!!")
		res.render('airportchoice', {
			title: 'By airport',
			allairport: airport
		})
	})
})

/* POST user choice */
router.post('/', function(req, res) {
	res.redirect('/routes/' + req.body.airport)
})

/* GET airline page AFTER user's choice */
router.get('/:id', function(req, res) {
	airportcode = req.params.id
	connection.query(mysql.format(sql.selectStats, [airportcode,airportcode,airportcode,airportcode,airportcode,airportcode,airportcode,airportcode,airportcode,airportcode]), function(err, results) {
		console.log("Naya zhamela")
		console.log(airportcode)
	
		res.render('airport', {
			title: req.params.id,
			flightcount: results[0],
			delaycount: results[1],
			cancelcount: results[2],
			perdelay: results[3],
			percancel: results[4],
			avgdelay: results[5],
			delaystats: results[6],
			cancelstats: results[7]
		})
	})
})

module.exports = router





