var express = require('express')
var mysql = require('mysql')
var connection = require('./connection')
var router = express.Router()

var sql = {

	'checkUserPass': '' +
	'SELECT * FROM user U \
	WHERE U.username = ?;',

	'insertUser': '' +
	'INSERT INTO user (password, info, username) \
	VALUES (?, ?, ?);'

}

/* GET route page BEFORE user's choice */
router.get('/', function(req, res) {
	res.render('account', {
		title: 'Account',
		wronguserpass: ''
	})
})

/* POST user choice */
router.post('/', function(req, res) {
	console.log(req.body)
	connection.query(mysql.format(sql.checkUserPass, [req.body.username]), function(err, user) {
		if (user.length) {
			wronguserpass = 'yes'
		} else {
			wronguserpass = 'no'
			connection.query(mysql.format(sql.insertUser, [req.body.password, req.body.info, req.body.username]), function(err, user) {
				console.log(user)
			})
		}
		res.render('account', {
			title: 'Account',
			wronguserpass: wronguserpass
		})
	})
})

module.exports = router
