var express = require('express')
var mysql = require('mysql')
var connection = require('./connection')
var router = express.Router()

var sql = {

	'selectAirlines': 'SELECT A1.code FROM airline A1;',

	'selectStats': '' +
		'SELECT COUNT(F2.fid) \
		FROM flight F2, airline A2 \
		WHERE F2.airlineCode = A2.code AND A2.code = ?; \
		SELECT COUNT(DISTINCT FD3.did) \
		FROM flight_delayed FD3, flight F3 \
		WHERE FD3.fid = F3.fid AND F3.airlineCode = ?; \
		SELECT COUNT(DISTINCT FC4.cid) \
		FROM flight_canceled FC4, flight F4 \
		WHERE FC4.fid = F4.fid AND F4.airlineCode=?; \
		'

}

/* GET airline page BEFORE user's choice */
router.get('/', function(req, res) {
	connection.query(sql.selectAirlines, function(err, airline) {
		res.render('airlinechoice', {
			title: 'By airline',
			airlines: airline
		})
	})
})

/* POST user choice */
router.post('/', function(req, res) {
	res.redirect('/airlines/' + req.body.airline)
})

/* GET airline page AFTER user's choice */
router.get('/:id', function(req, res) {
	airlineID = req.params.id
	connection.query(mysql.format(sql.selectStats, [airlineID, airlineID, airlineID]), function(err, results) {
		console.log(results[0])
		console.log(results[2])
		timeDist = results[0]
		airlineStats = results[2]
		res.render('airline', {
			title: req.params.id,
			timeDist: timeDist,
			airlineStats: airlineStats
		})
	})
})

module.exports = router