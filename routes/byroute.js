var express = require('express')
var mysql = require('mysql')
var connection = require('./connection')
var _ = require('underscore')
var router = express.Router()

var sql = {

	'selectRoutes': '' +
	'SELECT DISTINCT A1.airportCode AS orig, A2.airportCode AS dest \
	FROM route R, airport A1, airport A2 \
	WHERE R.orig=A1.airportId AND R.dest=A2.airportId; \
	SELECT A1.airportCode AS orig, A2.airportCode AS dest \
	FROM ( \
	SELECT F.routeId, COUNT(*) AS total \
	FROM flight F \
	GROUP BY F.routeId \
	ORDER BY total DESC \
	LIMIT 20 \
	) B, \
	route R, \
	airport A1, \
	airport A2 \
	WHERE A1.airportId = R.orig AND A2.airportId = R.dest AND B.routeId = R.routeId;',

	'selectStats': '' +
	'SELECT R.airTime, R.distance \
	FROM route R, airport A1, airport A2 \
	WHERE A1.airportId = R.orig AND A2.airportId = R.dest AND A1.airportCode = ? and A2.airportCode = ? \
	; \
	CREATE OR REPLACE VIEW tempview AS \
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
		(SELECT Q.airlineId, count(*) AS tot FROM tempview Q GROUP BY Q.airlineId) A LEFT OUTER JOIN \
		(SELECT Q.airlineId, count(*) AS del FROM tempview Q WHERE EXISTS (SELECT * FROM flight_delayed FD WHERE FD.flightId=Q.flightId) GROUP BY Q.airlineId) B ON A.airlineId = B.airlineId LEFT OUTER JOIN \
		(SELECT Q.airlineId, count(*) AS can FROM tempview Q WHERE EXISTS (SELECT * FROM flight_canceled FC WHERE FC.flightId=Q.flightId) GROUP BY Q.airlineId) C ON A.airlineId = C.airlineId LEFT OUTER JOIN \
		(SELECT Q.airlineId, ROUND(AVG(FD.duration)) AS avg FROM tempview Q, flight_delayed FD WHERE Q.flightId=FD.flightId GROUP BY Q.airlineId) D ON A.airlineId = D.airlineId LEFT OUTER JOIN \
		airline Air ON A.airlineId = Air.airlineId \
	ORDER BY A.tot DESC \
	; \
	SELECT C.type, SUM(A.total) AS total \
	FROM ( \
	SELECT IFNULL(FD.delayId, "0") AS delayId, IFNULL(FC.cancelId, "0") AS cancelId, COUNT(*) AS total \
	FROM tempview Q LEFT OUTER JOIN flight_delayed FD ON Q.flightId = FD.flightId \
	LEFT OUTER JOIN flight_canceled FC ON Q.flightId = FC.flightId \
	GROUP BY FD.delayId, FC.cancelId \
	) A LEFT JOIN delaycancel C ON A.cancelId = C.cancelId AND A.delayId = C.delayId \
	GROUP BY C.type \
	ORDER BY total DESC \
	; \
	SELECT A.flightDate, C.type, SUM(A.total) AS total \
	FROM ( \
	SELECT EXTRACT(YEAR_MONTH FROM Q.flightDate) AS flightDate, IFNULL(FD.delayId, "0") AS delayId, IFNULL(FC.cancelId, "0") AS cancelId, COUNT(*) AS total \
	FROM tempview Q LEFT OUTER JOIN flight_delayed FD ON Q.flightId = FD.flightId \
	LEFT OUTER JOIN flight_canceled FC ON Q.flightId = FC.flightId \
	GROUP BY EXTRACT(YEAR_MONTH FROM Q.flightDate), FD.delayId, FC.cancelId \
	) A LEFT JOIN delaycancel C ON A.cancelId = C.cancelId AND A.delayId = C.delayId \
	GROUP BY A.flightDate, C.type \
	; \
	SELECT AVG(P.price) AS price \
	FROM pricing P \
	WHERE P.flightId IN (SELECT Q.flightId FROM tempview Q) \
	; \
	DROP VIEW IF EXISTS tempview \
	;'

}

/* GET route page BEFORE user's choice */
router.get('/', function(req, res) {
	connection.query(sql.selectRoutes, function(err, routes) {
		console.log(routes[1])
		res.render('routechoice', {
			title: 'By route',
			allroutes: routes[0],
			toproutes: routes[1]
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
		console.log(results[3])
		//console.log(JSON.stringify(_.compact(results[4])))
		//console.log(results[5][0]['price'])
		
		timeDist = results[0]
		airlineStats = results[2]
		ontimeStats = []
		yearStats = []
		tmp2 = {
			'Ontime': Array.apply(null, new Array(12)).map(function(){return 0}),
			'Weather delay': Array.apply(null, new Array(10)).map(function(){return 0}),
			'Carrier delay': Array.apply(null, new Array(10)).map(function(){return 0}),
			'Late aircraft delay': Array.apply(null, new Array(10)).map(function(){return 0}),
			'National Air System delay': Array.apply(null, new Array(10)).map(function(){return 0}),
			'Canceled': Array.apply(null, new Array(10)).map(function(){return 0}),
			'Total': []
		}
		tmp = {}
		results[3].forEach(function(item) {
			ontimeStats.push([item.type, item.total])
		})
		results[4].forEach(function(item) {
			tmp[item['flightDate']] = [{}]
		})
		results[4].forEach(function(item) {
			tmp[item['flightDate']][0][item['type']] = item['total']
		})
		var dates = Object.keys(tmp).sort()
		for (var i=0; i<dates.length; i++) {
			date = dates[i]
			if (_.has(tmp[date][0], 'Ontime')) tmp2['Ontime'][i] = tmp[date][0]['Ontime']
			if (_.has(tmp[date][0], 'Weather delay')) tmp2['Weather delay'][i] = tmp[date][0]['Weather delay']
			if (_.has(tmp[date][0], 'Carrier delay')) tmp2['Carrier delay'][i] = tmp[date][0]['Carrier delay']
			if (_.has(tmp[date][0], 'Late aircraft delay')) tmp2['Late aircraft delay'][i] = tmp[date][0]['Late aircraft delay']
			if (_.has(tmp[date][0], 'National Air System delay')) tmp2['National Air System delay'][i] = tmp[date][0]['National Air System delay']
			if (_.has(tmp[date][0], 'Canceled')) tmp2['Canceled'][i] = tmp[date][0]['Canceled']
		}
		for (var i=0; i < 12; i++) {
			tmp2['Total'].push(tmp2['Ontime'][i]+tmp2['Weather delay'][i]+tmp2['Carrier delay'][i]+tmp2['Late aircraft delay'][i]+tmp2['National Air System delay'][i]+tmp2['Canceled'][i])
		}
		for (var i=0; i < 12; i++) {
			tmp2['Ontime'][i] = 100*(tmp2['Ontime'][i] / tmp2['Total'][i])
			tmp2['Weather delay'][i] = 100*(tmp2['Weather delay'][i] / tmp2['Total'][i])
			tmp2['Carrier delay'][i] = 100*(tmp2['Carrier delay'][i] / tmp2['Total'][i])
			tmp2['Late aircraft delay'][i] = 100*(tmp2['Late aircraft delay'][i] / tmp2['Total'][i])
			tmp2['National Air System delay'][i] = 100*(tmp2['National Air System delay'][i] / tmp2['Total'][i])
			tmp2['Canceled'][i] = 100*(tmp2['Canceled'][i] / tmp2['Total'][i])
		}
		for (var item in tmp2) {
			if (item != 'Total') {yearStats.push({'name': item, 'data': tmp2[item]})}
		}

		res.render('route', {
			title: req.params.id,
			timeDist: timeDist,
			airlineStats: airlineStats,
			ontimeStats: ontimeStats,
			yearStats: yearStats,
			price: results[5][0]['price']
		})
	})
})

module.exports = router
