"use strict";

var fs = require ("fs");
var path = require ("path");
var parse = require ("./parse");

var INCLUDE_KEY = "include";
var INDEX_FILE = "index.properties";

var cast = function (value){
	if (value === null || value === "null") return null;
	if (value === "undefined") return undefined;
	if (value === "true") return true;
	if (value === "false") return false;
	var v = Number (value);
	return isNaN (v) ? value : v;
};

var expand = function  (o, str, options, cb){
	if (!options.variables || !str) return cb (null, str);
	
	var stack = [];
	var c;
	var cp;
	var key = "";
	var section = null;
	var v;
	var holder;
	var t;
	var n;
	
	for (var i=0; i<str.length; i++){
		c = str[i];
		
		if (cp === "$" && c === "{"){
			key = key.substring (0, key.length - 1);
			stack.push ({
				key: key,
				section: section
			});
			key = "";
			section = null;
			continue;
		}else if (stack.length){
			if (options.sections && c === "|"){
				section = key;
				key = "";
				continue;
			}else if (c === "}"){
				holder = section !== null ? searchValue (o, section, true) : o;
				if (!holder){
					return cb (new Error ("The section \"" + section + "\" does not " +
							"exist"));
				}
				
				v = options.namespaces ? searchValue (holder, key) : holder[key];
				if (v === undefined){
					//Read the external vars
					v = options.namespaces
							? searchValue (options._vars, key)
							: options._vars[key]
					
					if (v === undefined){
						return cb (new Error ("The property \"" + key + "\" does not " +
								"exist"));
					}
				}
				
				t = stack.pop ();
				section = t.section;
				key = t.key + (v === null ? "" : v);
				continue;
			}
		}
		
		cp = c;
		key += c;
	}
	
	if (stack.length !== 0){
		return cb (new Error ("Malformed variable: " + str));
	}
	
	cb (null, key);
};

var searchValue = function (o, chain, section){
	var n = chain.split (".");
	var str;
	
	for (var i=0; i<n.length-1; i++){
		str = n[i];
		if (o[str] === undefined) return;
		o = o[str];
	}
	
	var v = o[n[n.length - 1]];
	if (section){
		if (typeof v !== "object") return;
		return v;
	}else{
		if (typeof v === "object") return;
		return v;
	}
};

var namespaceKey = function (o, key, value){
	var n = key.split (".");
	var str;
	
	for (var i=0; i<n.length-1; i++){
		str = n[i];
		if (o[str] === undefined){
			o[str] = {};
		}else if (typeof o[str] !== "object"){
			throw new Error ("Invalid namespace chain in the property name '" +
					key + "' ('" + str + "' has already a value)");
		}
		o = o[str];
	}
	
	o[n[n.length - 1]] = value;
};

var namespaceSection = function (o, section){
	var n = section.split (".");
	var str;
	
	for (var i=0; i<n.length; i++){
		str = n[i];
		if (o[str] === undefined){
			o[str] = {};
		}else if (typeof o[str] !== "object"){
			throw new Error ("Invalid namespace chain in the section name '" +
					section + "' ('" + str + "' has already a value)");
		}
		o = o[str];
	}
	
	return o;
};

var merge = function (o1, o2){
	for (var p in o2){
		try{
			if (o1[p].constructor === Object){
				o1[p] = merge (o1[p], o2[p]);
			}else{
				o1[p] = o2[p];
			}
		}catch (e){
			o1[p] = o2[p];
		}
	}
	return o1;
}

var build = function (data, options, dirname, cb){
	var o = {};
	
	if (options.namespaces){
		var n = {};
	}
	
	var control = {
		abort: false,
		skipSection: false
	};
	
	if (options.include){
		var remainingIncluded = 0;
		
		var include = function (value){
			if (currentSection !== null){
				return abort (new Error ("Cannot include files from inside a " +
						"section: " + currentSection));
			}
			
			var p = path.resolve (dirname, value);
			if (options._included[p]) return;
			
			options._included[p] = true;
			remainingIncluded++;
			control.pause = true;
			
			read (p, options, function (error, included){
				if (error) return abort (error);
				
				remainingIncluded--;
				merge (options.namespaces ? n : o, included);
				control.pause = false;
				
				if (!control.parsed){
					parse (data, options, handlers, control);
					if (control.error) return abort (control.error);
				}
				
				if (!remainingIncluded) cb (null, options.namespaces ? n : o);
			});
		};
	}
	
	if (!data){
		if (cb) return cb (null, o);
		return o;
	}
	
	var currentSection = null;
	var currentSectionStr = null;
	
	var abort = function (error){
		control.abort = true;
		if (cb) return cb (error);
		throw error;
	};
	
	var handlers = {};
	var reviver = {
		assert: function (){
			return this.isProperty ? reviverLine.value : true;
		}
	};
	var reviverLine = {};
	
	//Line handler
	//For speed reasons, if namespaces are enabled the old object is still
	//populated, e.g.: ${a.b} reads the "a.b" property from { "a.b": 1 }, instead
	//of having a unique object { a: { b: 1 } } which is slower to search for
	//the "a.b" value
	//If "a.b" is not found, then the external vars are read. If "namespaces" is
	//enabled the var "a.b" is split and it searches for a.b. If it is not enabled
	//then the var "a.b" searches for "a.b"
	
	var line;
	var error;
	
	if (options.reviver){
		if (options.sections){
			line = function (key, value){
				if (options.include && key === INCLUDE_KEY) return include (value);
				
				reviverLine.value = value;
				reviver.isProperty = true;
				reviver.isSection = false;
				
				value = options.reviver.call (reviver, key, value, currentSectionStr);
				if (value !== undefined){
					if (options.namespaces){
						try{
							namespaceKey (currentSection === null ? n : currentSection,
									key, value);
						}catch (error){
							abort (error);
						}
					}else{
						if (currentSection === null) o[key] = value;
						else currentSection[key] = value;
					}
				}
			};
		}else{
			line = function (key, value){
				if (options.include && key === INCLUDE_KEY) return include (value);
				
				reviverLine.value = value;
				reviver.isProperty = true;
				reviver.isSection = false;
				
				value = options.reviver.call (reviver, key, value);
				if (value !== undefined){
					if (options.namespaces){
						try{
							namespaceKey (n, key, value);
						}catch (error){
							abort (error);
						}
					}else{
						o[key] = value;
					}
				}
			};
		}
	}else{
		if (options.sections){
			line = function (key, value){
				if (options.include && key === INCLUDE_KEY) return include (value);
				
				if (options.namespaces){
					try{
						namespaceKey (currentSection === null ? n : currentSection, key,
								value);
					}catch (error){
						abort (error);
					}
				}else{
					if (currentSection === null) o[key] = value;
					else currentSection[key] = value;
				}
			};
		}else{
			line = function (key, value){
				if (options.include && key === INCLUDE_KEY) return include (value);
				
				if (options.namespaces){
					try{
						namespaceKey (n, key, value);
					}catch (error){
						abort (error);
					}
				}else{
					o[key] = value;
				}
			};
		}
	}
	
	//Section handler
	var section;
	if (options.sections){
		if (options.reviver){
			section = function (section){
				currentSectionStr = section;
				reviverLine.section = section;
				reviver.isProperty = false;
				reviver.isSection = true;
				
				var add = options.reviver.call (reviver, null, null, section);
				if (add){
					if (options.namespaces){
						try{
							currentSection = namespaceSection (n, section);
						}catch (error){
							abort (error);
						}
					}else{
						currentSection = o[section] = {};
					}
				}else{
					control.skipSection = true;
				}
			};
		}else{
			section = function (section){
				currentSectionStr = section;
				if (options.namespaces){
					try{
						currentSection = namespaceSection (n, section);
					}catch (error){
						abort (error);
					}
				}else{
					currentSection = o[section] = {};
				}
			};
		}
	}
	
	//Variables
	if (options.variables){
		handlers.line = function (key, value){
			expand (options.namespaces ? n : o, key, options, function (error, key){
				if (error) return abort (error);
				
				expand (options.namespaces ? n : o, value, options,
						function (error, value){
					if (error) return abort (error);
					
					line (key, cast (value || null));
				});
			});
		};
		
		if (options.sections){
			handlers.section = function (s){
				expand (options.namespaces ? n : o, s, options, function (error, s){
					if (error) return abort (error);
					
					section (s);
				});
			};
		}
	}else{
		handlers.line = function (key, value){
			line (key, cast (value || null));
		};
		
		if (options.sections){
			handlers.section = section;
		}
	}
	
	parse (data, options, handlers, control);
	if (control.error) return abort (control.error);
	
	if (control.abort || control.pause) return;
	
	if (cb) return cb (null, options.namespaces ? n : o);
	return options.namespaces ? n : o;
};

var read = function (f, options, cb){
	fs.stat (f, function (error, stats){
		if (error) return cb (error);
		
		var dirname;
		
		if (stats.isDirectory ()){
			dirname = f;
			f = path.join (f, INDEX_FILE);
		}else{
			dirname = path.dirname (f);
		}
		
		fs.readFile (f, { encoding: "utf8" }, function (error, data){
			if (error) return cb (error);
			build (data, options, dirname, cb);
		});
	});
};

module.exports = function (data, options, cb){
	if (typeof options === "function"){
		cb = options;
		options = {};
	}
	
	options = options || {};
	var code;
	
	if (options.include){
		if (!cb) throw new Error ("A callback must be passed if the 'include' " +
				"option is enabled");
		options._included = {};
	}
	
	options = options || {};
	options._strict = options.strict && (options.comments || options.separators);
	options._vars = options.vars || {};
	
	var comments = options.comments || [];
	if (!Array.isArray (comments)) comments = [comments];
	var c = {};
	comments.forEach (function (comment){
		code = comment.charCodeAt (0);
		if (comment.length > 1 || code < 33 || code > 126){
			throw new Error ("The comment token must be a single printable ASCII " +
					"character");
		}
		c[comment] = true;
	});
	options._comments = c;
	
	var separators = options.separators || [];
	if (!Array.isArray (separators)) separators = [separators];
	var s = {};
	separators.forEach (function (separator){
		code = separator.charCodeAt (0);
		if (separator.length > 1 || code < 33 || code > 126){
			throw new Error ("The separator token must be a single printable ASCII " +
					"character");
		}
		s[separator] = true;
	});
	options._separators = s;
	
	if (options.path){
		if (!cb) throw new Error ("A callback must be passed if the 'path' " +
				"option is enabled");
		if (options.include){
			read (data, options, cb);
		}else{
			fs.readFile (data, { encoding: "utf8" }, function (error, data){
				if (error) return cb (error);
				build (data, options, ".", cb);
			});
		}
	}else{
		return build (data, options, ".", cb);
	}
};