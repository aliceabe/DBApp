var mysql = require('mysql')

var connection = mysql.createConnection({
  host     : 'cs4111.ciu0ibzbcgnr.us-west-2.rds.amazonaws.com',
  user     : 'ec3074',
  password : 'esha1234',
  database : 'stats',
  multipleStatements: true
})

connection.connect()

module.exports = connection