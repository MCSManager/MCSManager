"use strict";

var Stringifier = require ("./stringifier");

module.exports = {
	parse: require ("./read"),
	stringify: require ("./write"),
	createStringifier: function (){
		return new Stringifier ();
	}
};