var express = require('express')
var mysql = require('mysql')
var connection = require('./connection')
var router = express.Router()

var sql = {
	'selectRoutes': 'SELECT DISTINCT A1.airportCode AS orig, A2.airportCode AS dest FROM route R, airport A1, airport A2 WHERE R.orig=A1.airportId AND R.dest=A2.airportId',
	'selectTimeDist': 'SELECT R.airTime, R.distance FROM route R, airport A1, airport A2 WHERE A1.airportId=R.orig AND A2.airportId=R.dest AND A1.airportCode=? and A2.airportCode=?'
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
	connection.query(mysql.format(sql.selectTimeDist, [orig, dest]), function(err, results) {
		timeDist = results[0]
		res.render('route', {
			title: req.params.id,
			timeDist: timeDist
		})
	})
})

module.exports = router
