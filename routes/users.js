var express = require('express')
var mysql = require('mysql')
var connection = require('./connection')
var router = express.Router()

var sql = {

	'selectAirlines' : '' +
	'SELECT A.airlineCode \
	FROM flight F, airline A \
	WHERE F.airlineId = A.airlineId \
	GROUP BY F.airlineId \
	ORDER BY COUNT(*) DESC \
	LIMIT 20;',

	'checkUserPass': '' +
	'SELECT * FROM user \
	WHERE username = ? AND password = ?;',

	'checkFlight': '' +
	'SELECT F.* FROM flight F, route R, airport A1, airport A2, airline A \
	WHERE A1.airportCode = ? AND A2.airportCode = ? AND A.airlineCode = ? AND F.flightDate = ? AND F.flightdepTime = ? \
	AND F.airlineId = A.airlineId AND A1.airportId = R.orig AND A2.airportId = R.dest AND R.routeId = F.routeId;',

	'addRating': '' +
	'INSERT INTO rating \
	SELECT A.airlineId, U.userId, ? FROM user U, airline A \
	WHERE U.username = ? AND A.airlineCode = ?;',

	'addPricing': '' +
	'INSERT INTO pricing \
	SELECT F.flightId, U.userId, ? FROM user U, flight F, route R, airline A, airport A1, airport A2 \
	WHERE U.username = ? AND A.airlineCode = ? AND A1.airportCode = ? AND A2.airportCode = ? AND F.flightDate = ? AND F.flightdepTime = ? \
	AND F.airlineId = A.airlineId AND F.routeId = R.routeId and A1.airportId = R.orig AND A2.airportId = R.dest;'

}

var topairlines = []

/* GET route page BEFORE user's choice */
router.get('/', function(req, res) {
	connection.query(sql.selectAirlines, function(err, airlines) {
		topairlines = airlines
		res.render('userchoice', {
			title: 'User',
			topairlines: topairlines,
			incorrectflight: '',
			wronguserpass: ''
		})
	})
})

/* POST user choice */
router.post('/', function(req, res) {
	connection.query(mysql.format(sql.checkUserPass, [req.body.username, req.body.password]), function(err, user) {
		if (user.length) {
			orig = req.body.route.substring(0,3)
			dest = req.body.route.substring(4,7)
			connection.query(mysql.format(sql.checkFlight, [orig,dest,req.body.airline, req.body.flightdate, req.body.deptime]), function(err, flight) {
				incorrectflight = 'yes'
				if (flight.length) {
					// the flight exists, so we add the rating
					incorrectflight = 'no'
					connection.query(mysql.format(sql.addRating, [req.body.rating, req.body.username, req.body.airline]), function(err, add) {
						console.log(add)
					})
					connection.query(mysql.format(sql.addPricing, [req.body.amount, req.body.username, req.body.airline, orig, dest, req.body.flightdate, req.body.deptime]), function(err, pricing) {
						console.log(pricing)
					})
				}
				res.render('userchoice', {
					title: 'Thank you',
					topairlines: topairlines,
					wronguserpass: '',
					incorrectflight: incorrectflight
				})
			})
		} else {
			res.render('userchoice', {
				title: 'Thank you',
				topairlines: topairlines,
				wronguserpass: 'yes',
				incorrectflight: ''
			})
		}
	})
})

module.exports = router
