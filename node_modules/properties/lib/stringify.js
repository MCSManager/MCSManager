"use strict";

var escape = require ("./escape");
var Stringifier = require ("./stringifier");

//The data doesn't need to be buffered because .properties files typically
//have a size less than a block (default is 16KB)

var EOL = process.platform === "win32" ? "\r\n" : "\n";

var stringifyComment = function (comment, meta, options){
	var c;
	var code;
	var str = options._comment;
	
	for (var i=0; i<comment.length; i++){
		c = comment[i];
		code = comment.charCodeAt (i);
		
		//code 13: \r
		if (code === 13) continue;
		
		if (code === 10){
			//code 10: \n
			str += EOL + options._comment;
		}else{
			str += escape (c, code, meta, options);
		}
	}
	
	return str;
};

var stringifyKey = function (s, meta, options){
	var c;
	var code;
	var str = "";
	
	for (var i=0; i<s.length; i++){
		c = s[i];
		code = s.charCodeAt (i);
		str += escape (c, code, meta, options);
	}
	
	return str;
};

var stringifyValue = function (s, meta, options){
	var c;
	var code;
	var str = "";
	
	for (var i=0; i<s.length; i++){
		c = s[i];
		code = s.charCodeAt (i);
		
		//code 32: " " (space)
		//code 9: \t
		//code 12: \f
		if (code !== 32 && code !== 9 && code !== 12){
			meta.whitespace = false;
		}
		
		str += escape (c, code, meta, options);
	}
	
	return str;
};

var stringifyObject = function (obj, options){
	var str = "";
	var meta = {
		separator: options._separator.charCodeAt (0)
	};
	var value;
	var first = true;
	
	if (options.replacer){
		var o = {
			assert: function (){
				return replace.property ? replace.value : true;
			},
			isProperty: true,
			isSection: false
		};
	}

	for (var p in obj){
		value = obj[p];
		
		if (options.replacer){
			value = options.replacer.call (o, p, value, null);
			if (value === undefined) continue;
		}
		
		if (!first) str += EOL;
		
		meta.whitespace = true;
		
		meta.key = true;
		str += stringifyKey (p, meta, options);
		meta.key = false;
		
		str += options._separator;
		
		if (value !== null && value !== undefined){
			str += stringifyValue (value + "", meta, options);
		}
		
		meta.whitespace = false;
		
		first = false;
	}
	
	return str;
};

var stringifyStringifier = function (stringifier, options){
	var str = "";
	var meta = {
		separator: options._separator.charCodeAt (0)
	};
	var first = true;
	var currentSection = null;
	var skipSection;
	var value;
	var replace;
	
	if (options.replacer){
		var o = {
			assert: function (){
				return replace.property ? replace.value : true;
			}
		};
	}
	
	if (stringifier._header){
		meta.comment = true;
		str += stringifyComment (stringifier._header, meta, options) + EOL + EOL;
		meta.comment = false;
	}
	
	stringifier._lines.forEach (function (line){
		replace = line;
	
		if (options.replacer){
			if (line.property){
				if (skipSection) return;
				o.isProperty = true;
				o.isSection = false;
				value = options.replacer.call (o, line.key, line.value, currentSection);
				if (value === undefined) return;
				line.value = value;
			}else{
				skipSection = false;
				o.isProperty = false;
				o.isSection = true;
				if (options.replacer.call (o, null, null, line.name)){
					currentSection = line.name;
				}else{
					skipSection = true;
					return;
				}
			}
		}
	
		if (!first) str += line.property ? EOL : EOL + EOL;
		
		if (line.comment){
			meta.comment = true;
			str += stringifyComment (line.comment, meta, options) + EOL;
			meta.comment = false;
		}
		
		if (line.property){
			meta.whitespace = true;
			
			if (line.key !== null && line.key !== undefined){
				meta.key = true;
				str += stringifyKey (line.key + "", meta, options);
				meta.key = false;
			}
			
			str += options._separator;
			
			if (line.value !== null && line.value !== undefined){
				str += stringifyValue (line.value + "", meta, options);
			}
			
			meta.whitespace = false;
		}else{
			if (line.name){
				str += "[" + stringifyKey (line.name + "", meta, options) +
						"]";
			}else{
				str += "[]";
			}
		}
		
		first = false;
	});
	
	return str;
};

module.exports = function (stringifier, options){
	if (!(stringifier instanceof Stringifier)){
		return stringifyObject (stringifier, options);
	}else{
		return stringifyStringifier (stringifier, options);
	}
};