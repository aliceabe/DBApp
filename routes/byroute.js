var express = require('express')
var mysql = require('mysql')
var connection = require('./connection')
var router = express.Router()

var sql = {

	'selectRoutes': 'SELECT DISTINCT A1.airportCode AS orig, A2.airportCode AS dest FROM route R, airport A1, airport A2 WHERE R.orig=A1.airportId AND R.dest=A2.airportId;',

	'selectStats': '' +
	'SELECT R.airTime, R.distance \
	FROM route R, airport A1, airport A2 \
	WHERE A1.airportId = R.orig AND A2.airportId = R.dest AND A1.airportCode = ? and A2.airportCode = ?; \
	CREATE OR REPLACE VIEW query AS \
	SELECT F.* \
	FROM route R, airport A1, airport A2, flight F \
	WHERE ( \
		R.orig = A1.airportId AND \
		R.dest = A2.airportId AND \
		A1.airportCode = ? AND \
		A2.airportCode = ? AND \
		F.routeId = R.routeId \
	); \
	SELECT Air.description, A.tot, IFNULL(B.del,0) AS del, IFNULL(C.can,0) AS can, IFNULL(ROUND(B.del*100/A.tot,1),0) AS del_p, IFNULL(ROUND(C.can*100/A.tot,1),0) AS can_p, IFNULL(D.avg,0) AS avg \
	FROM \
		(SELECT Q.airlineId, count(*) AS tot FROM query Q GROUP BY Q.airlineId) A LEFT OUTER JOIN \
		(SELECT Q.airlineId, count(*) AS del FROM query Q WHERE EXISTS (SELECT * FROM flight_delayed FD WHERE FD.flightId=Q.flightId) GROUP BY Q.airlineId) B ON A.airlineId = B.airlineId LEFT OUTER JOIN \
		(SELECT Q.airlineId, count(*) AS can FROM query Q WHERE EXISTS (SELECT * FROM flight_canceled FC WHERE FC.flightId=Q.flightId) GROUP BY Q.airlineId) C ON A.airlineId = C.airlineId LEFT OUTER JOIN \
		(SELECT Q.airlineId, ROUND(AVG(FD.duration)) AS avg FROM query Q, flight_delayed FD WHERE Q.flightId=FD.flightId GROUP BY Q.airlineId) D ON A.airlineId = D.airlineId LEFT OUTER JOIN \
		airline Air ON A.airlineId = Air.airlineId \
	ORDER BY A.tot DESC; \
	DROP VIEW IF EXISTS query;'

}

/* GET route page BEFORE user's choice */
router.get('/', function(req, res) {
	connection.query(sql.selectRoutes, function(err, route) {
		res.render('index', {
			title: 'By route',
			routes: route
		})
	})
})

/* POST user choice */
router.post('/', function(req, res) {
	res.redirect('/routes/' + req.body.route)
})

/* GET route page AFTER user's choice */
router.get('/:id', function(req, res) {
	orig = req.params.id.substring(0, 3)
	dest = req.params.id.substring(4, 7)
	connection.query(mysql.format(sql.selectStats, [orig, dest, orig, dest]), function(err, results) {
		console.log(results[0])
		console.log(results[2])
		timeDist = results[0]
		airlineStats = results[2]
		res.render('route', {
			title: req.params.id,
			timeDist: timeDist,
			airlineStats: airlineStats
		})
	})
})

module.exports = router
