/*requiring mysql node modules */
var mysql = require("mysql");

var method = db.prototype;

function db() {
	/*
		creating MySql database connection 
	*/
	var con = mysql.createPool({
		host : 'localhost',
	  	user : 'root',
	  	password : 'data',
	  	database : 'chat'
	});
	this.connection=con;
}
method.getcon = function() {
	return this;
};

module.exports = db;
