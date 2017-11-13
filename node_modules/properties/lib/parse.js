"use strict";

var hex = function (c){
	switch (c){
		case "0": return 0;
		case "1": return 1;
		case "2": return 2;
		case "3": return 3;
		case "4": return 4;
		case "5": return 5;
		case "6": return 6;
		case "7": return 7;
		case "8": return 8;
		case "9": return 9;
		case "a": case "A": return 10;
		case "b": case "B": return 11;
		case "c": case "C": return 12;
		case "d": case "D": return 13;
		case "e": case "E": return 14;
		case "f": case "F": return 15;
	}
};

module.exports = function (data, options, handlers, control){
	var c;
	var code;
	var escape;
	var skipSpace = true;
	var isCommentLine;
	var isSectionLine;
	var newLine = true;
	var multiLine;
	var isKey = true;
	var key = "";
	var value = "";
	var section;
	var unicode;
	var unicodeRemaining;
	var escapingUnicode;
	var keySpace;
	var sep;
	var ignoreLine;
	
	var line = function (){
		if (key || value || sep){
			handlers.line (key, value);
			key = "";
			value = "";
			sep = false;
		}
	};
	
	var escapeString = function (key, c, code){
		if (escapingUnicode && unicodeRemaining){
			unicode = (unicode << 4) + hex (c);
			if (--unicodeRemaining) return key;
			escape = false;
			escapingUnicode = false;
			return key + String.fromCharCode (unicode);
		}
		
		//code 117: u
		if (code === 117){
			unicode = 0;
			escapingUnicode = true;
			unicodeRemaining = 4;
			return key;
		}
		
		escape = false;
		
		//code 116: t
		//code 114: r
		//code 110: n
		//code 102: f
		if (code === 116) return key + "\t";
		else if (code === 114) return key + "\r";
		else if (code === 110) return key + "\n";
		else if (code === 102) return key + "\f";
		
		return key + c;
	};
	
	var isComment;
	var isSeparator;
	
	if (options._strict){
		isComment = function (c, code, options){
			return options._comments[c];
		};

		isSeparator = function (c, code, options){
			return options._separators[c];
		};
	}else{
		isComment = function (c, code, options){
			//code 35: #
			//code 33: !
			return code === 35 || code === 33 || options._comments[c];
		};

		isSeparator = function (c, code, options){
			//code 61: =
			//code 58: :
			return code === 61 || code === 58 || options._separators[c];
		};
	}
	
	for (var i=~~control.resume; i<data.length; i++){
		if (control.abort) return;
		if (control.pause){
			//The next index is always the start of a new line, it's a like a fresh
			//start, there's no need to save the current state
			control.resume = i;
			return;
		}
		
		c = data[i];
		code = data.charCodeAt (i);
		
		//code 13: \r
		if (code === 13) continue;
		
		if (isCommentLine){
			//code 10: \n
			if (code === 10){
				isCommentLine = false;
				newLine = true;
				skipSpace = true;
			}
			continue;
		}
		
		//code 93: ]
		if (isSectionLine && code === 93){
			handlers.section (section);
			//Ignore chars after the section in the same line
			ignoreLine = true;
			continue;
		}
		
		if (skipSpace){
			//code 32: " " (space)
			//code 9: \t
			//code 12: \f
			if (code === 32 || code === 9 || code === 12){
				continue;
			}
			//code 10: \n
			if (!multiLine && code === 10){
				//Empty line or key w/ separator and w/o value
				isKey = true;
				keySpace = false;
				newLine = true;
				line ();
				continue;
			}
			skipSpace = false;
			multiLine = false;
		}
		
		if (newLine){
			newLine = false;
			if (isComment (c, code, options)){
				isCommentLine = true;
				continue;
			}
			//code 91: [
			if (options.sections && code === 91){
				section = "";
				isSectionLine = true;
				control.skipSection = false;
				continue;
			}
		}
		
		//code 10: \n
		if (code !== 10){
			if (control.skipSection || ignoreLine) continue;
			
			if (!isSectionLine){
				if (!escape && isKey && isSeparator (c, code, options)){
					//sep is needed to detect empty key and empty value with a
					//non-whitespace separator
					sep = true;
					isKey = false;
					keySpace = false;
					//Skip whitespace between separator and value
					skipSpace = true;
					continue;
				}
			}
			
			//code 92: "\" (backslash)
			if (code === 92){
				if (escape){
					if (escapingUnicode) continue;
					
					if (keySpace){
						//Line with whitespace separator
						keySpace = false;
						isKey = false;
					}
				
					if (isSectionLine) section += "\\";
					else if (isKey) key += "\\";
					else value += "\\";
				}
				escape = !escape;
			}else{
				if (keySpace){
					//Line with whitespace separator
					keySpace = false;
					isKey = false;
				}
				
				if (isSectionLine){
					if (escape) section = escapeString (section, c, code);
					else section += c;
				}else if (isKey){
					if (escape){
						key = escapeString (key, c, code);
					}else{
						//code 32: " " (space)
						//code 9: \t
						//code 12: \f
						if (code === 32 || code === 9 || code === 12){
							keySpace = true;
							//Skip whitespace between key and separator
							skipSpace = true;
							continue;
						}
						key += c;
					}
				}else{
					if (escape) value = escapeString (value, c, code);
					else value += c;
				}
			}
		}else{
			if (escape){
				if (!escapingUnicode){
					escape = false;
				}
				skipSpace = true;
				multiLine = true;
			}else{
				if (isSectionLine){
					isSectionLine = false;
					if (!ignoreLine){
						//The section doesn't end with ], it's a key
						control.error = new Error ("The section line \"" + section +
								"\" must end with \"]\"");
						return;
					}
					ignoreLine = false;
				}
				newLine = true;
				skipSpace = true;
				isKey = true;
				
				line ();
			}
		}
	}
	
	control.parsed = true;
	
	if (isSectionLine && !ignoreLine){
		//The section doesn't end with ], it's a key
		control.error = new Error ("The section line \"" + section + "\" must end" +
				"with \"]\"");
		return;
	}
	line ();
};