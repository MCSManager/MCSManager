"use strict";

var fs = require ("fs");
var stringify = require ("./stringify");

module.exports = function (stringifier, options, cb){
	if (typeof options === "function"){
		cb = options;
		options = {};
	}
	
	options = options || {};
	var code;
	
	if (options.comment){
		code = options.comment.charCodeAt (0);
		if (options.comment.length > 1 || code < 33 || code > 126){
			throw new Error ("The comment token must be a single printable ASCII " +
					"character");
		}
		options._comment = options.comment;
	}else{
		options._comment = "#";
	}
	
	options._comment += " ";
	
	if (options.separator){
		code = options.separator.charCodeAt (0);
		if (options.separator.length > 1 || code < 33 || code > 126){
			throw new Error ("The separator token must be a single printable ASCII " +
					"character");
		}
		options._separator = options.separator;
	}else{
		options._separator = "=";
	}
	
	options._separator = " " + options._separator + " ";
	
	var data = stringify (stringifier, options);
	
	if (options.path){
		if (!cb) throw new TypeError ("A callback must be passed if the data is " +
				"stored into a file");
		fs.writeFile (options.path, data, function (error){
			if (error) return cb (error);
			cb (null, data);
		});
	}else{
		return data;
	}
};