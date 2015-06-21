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

}

/* GET route page BEFORE user's choice */
router.get('/', function(req, res) {
	connection.query(sql.selectAirlines, function(err, airlines) {
		res.render('userchoice', {
			title: 'User',
			topairlines: airlines
		})
	})
})

/* POST user choice */
router.post('/', function(req, res) {
	console.log(req.body)
	res.render('userthank', {
		title: 'Thank you'
	})
	//res.redirect('/routes/' + req.body.route)
})

module.exports = router
