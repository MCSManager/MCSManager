properties
==========

#### .properties parser/stringifier ####

[![NPM version](https://badge.fury.io/js/properties.png)](http://badge.fury.io/js/properties "Fury Version Badge")
[![Build Status](https://secure.travis-ci.org/gagle/node-properties.png)](http://travis-ci.org/gagle/node-properties "Travis CI Badge")

[![NPM installation](https://nodei.co/npm/properties.png?mini=true)](https://nodei.co/npm/properties "NodeICO Badge")

[.properties specification](http://docs.oracle.com/javase/7/docs/api/java/util/Properties.html#load%28java.io.Reader%29)

This module implements the Java .properties specification and adds additional features like [ini](#ini) sections, variables (key referencing), namespaces, importing files and much more.

#### Quick example ####

```
# file
a = 1
b: 2
```

```javascript
var properties = require ("properties");

properties.parse ("file", { path: true }, function (error, obj){
  if (error) return console.error (error);
  
  console.log (obj);
  //{ a: 1, b: 2 }
});
```

#### Documentation ####

- [Sections](#sections)
- [Variables](#variables)
  - [Environment](#environment)
- [Namespaces](#namespaces)
- [INI](#ini)
- [Importing files](#include)
- [Useful options that you should always use](#useful)

#### Functions ####

- [_module_.parse(data[, options][, callback]) : undefined | Object](#parse)
- [_module_.createStringifier() : Stringifier](#createStringifier)
- [_module_.stringify(obj[, options][, callback]) : undefined | String](#stringify)

#### Objects ####

- [Stringifier](#Stringifier)

---

<a name="sections"></a>
__Sections__

INI sections can be enabled with the `sections` option. With them you can better organize your configuration data.

```
app_name App

[web]
hostname 10.10.10.10
port 1234

[db]
hostname 10.10.10.20
port 4321
```

Creates:

```javascript
{
  app_name: "App",
  web: {
    hostname: "10.10.10.10",
    port: 1234
  },
  db: {
    hostname: "10.10.10.20",
    port: 4321
  }
}
```

---

<a name="variables"></a>
__Variables__

When the `variables` option is enabled you can get the value of another key. The value is read __before__ the type conversion. Imagine them like the C macros. They simply copy the characters, they don't care if the value is a number or a string.

```
a = 1
# b = 1
b = ${a}
```

Note: If you are using the `include` option, take into account that the variables are local to the file, they cannot be used to access the properties of other files.

If you need to get the value of a key that belongs to a section, prefix the key with the section followed by `|`.

```
a = 1
[section]
a = 2
# b = 2
b = ${section|a}
```

You can use the variables anywhere including the variable itself. Look at the [variables](https://github.com/gagle/node-properties/blob/master/examples/variables/variables.js) example for further details.

```
a = 1
# s1
[s${a}]
a = b
b = c
# d = c
d = ${s${a}|${s${a}|a}}
```

<a name="environment"></a>
__Environment__

You can also pass external variables with the `vars` option and use their value while the file is being parsed. This is an extremly useful feature because you don't need to change anything from your configuration files if you want to dynamically assign the value of the properties. It could be used to load different configurations depending on the environment. Look at the [vars](https://github.com/gagle/node-properties/blob/master/examples/variables/vars.js) and [environment-vars](https://github.com/gagle/node-properties/blob/master/examples/variables/environment-vars.js) examples for further details.

---

<a name="namespaces"></a>
__Namespaces__

When the `namespaces` option is enabled dot separated keys and sections are parsed as namespaces, that is, they are interpreted as JavaScript objects.

```
a.b = 1
a.c.d = 2

```

These properties create the following object:

```javascript
{
  a: {
    b: 1,
    c: {
      d: 2
    }
  }
}
```

You can also use sections and variables:

```
[s1.x]
a.b = 1
# a.c.d = 1
a.c.d = ${s1.x|a.b}

```

```javascript
{
  s1: {
    x: {
      a: {
        b: 1,
        c: {
          d: 1
        }
      }
    }
  }
}
```

The external variables can be also read using namespaces:

```javascript
var options = {
  vars: {
    a: {
      b: 1
    }
  }
};
```

```
# a = 1
a = ${a.b}
```

Look at the [namespaces](https://github.com/gagle/node-properties/blob/master/examples/namespaces/namespaces.js) example for further details.

---

<a name="ini"></a>
__INI__

This module implements the .properties specification but there are some options that can be enabled, some of them are the `sections`, `comments`, `separators` and `strict`. With these four options this module can parse INI files. There isn't an official INI specification, each program implements its own features, but there is a de facto standard that says that INI files are just .properties files with sections and the `=` token as a separator.

If you want to parse INI files, then enable these options:

```javascript
var options = {
  sections: true,
  comments: ";", //Some INI files also consider # as a comment, if so, add it, comments: [";", "#"]
  separators: "=",
  strict: true
};
```

The `strict` option says that __only__ the tokens that are specified in the `comments` and `separators` options are used to parse the file. If `strict` is not enabled, the default .properties comment (`#`, `!`) and separator (`=`, `:`) tokens are also used to parse comments and separators. Look at the [ini](https://github.com/gagle/node-properties/tree/master/examples/ini) examples for further details.

Note: The whitespace (`<space>`, `\t`, `\f`) is still considered a separator even if `strict` is true.

---

<a name="include"></a>
__Importing files__

When the `include` option is enabled, the `include` key allow you import files. If the path is a directory, it tries to load the file `index.properties`. The paths are relative to the __current__ .properties file.

The imported files are merged with the current file, they can replace old data.

The _include_ keyword cannot appear inside a section, it must be a global property.

```
include a/file

# Load a/dir/index.properties
include a/dir
```

Note: You can include files using a simple key-value string:

```javascript
properties.parse ("include my/file", function (error, data){
	...
})
```

In this case the files are __always__ relative to `.`. You cannot use `__dirname` like this: `"include " + __dirname + "/my/file"`.

---

<a name="useful"></a>
__Useful options that you should always use__

There are too many options that you can enable but, which of them should you use? Well, this depends on what you need but I like to enable the following ones:

- __namespaces__: Extremly useful if you want to organize your configuration files using namespaces and access the data using JavaScript objects. For example:
  
  ```
  db.pool.min 5
  db.pool.max 10
  ```

  Instead of:
  
  ```
  db_pool_min 5
  db_pool_max 10
  ```
- __sections__: More organization. You don't need to write all the namespace chain. For example:

  ```
  [db]
  host 1.2.3.4
  port 1234
  
  [db.pool]
  min 5
  max 10
  ```
  
  Instead of:
  
  ```
  db.host 1.2.3.4
  db.port 1234
  db.pool.min 5
  db.pool.max 10
  ```
- __variables__: Writing the same thing again and again is a bad practice. Write it once and use a variable to copy the value wherever you want. With the variables enabled you can pass external variables to the file using the __vars__ option, which is pretty useful as shown in the [environment-vars](https://github.com/gagle/node-properties/blob/master/examples/variables/environment-vars.js) example.
- __include__: Even more organization. I don't like to have a huge configuration file, I tend to have multiple smaller files. With this option I don't need to load all the files, I simply load the index file which includes all the files.

Wrapping this module it's also a good idea. This is a good starting point:

```javascript
//config.js

var properties = require ("properties");

var options = {
  path: true,
  namespaces: true,
  sections: true,
  variables: true,
  include: true
};

var configDir = "./path/to/config/dir";

module.exports.load = function (path, cb){
  //NODE_ENV can be "production" or "development"
  //Load specific configuration depending on the environment
  properties.parse (configDir + "/" + process.env.NODE_ENV, options,
      function (error, env){
    if (error) return cb (error);
    
    //Pass the specific configuration as external variables to the common
    //configuration
    options.vars = env;
    
    //If the path is a directory it tries to load the "index.properties" file
    properties.parse (configDir, options, cb);
  });
};
```

Usage:

```javascript
var config = require ("./config");

config.load (function (error, obj){
  if (error) return console.error (error);
  
  ...
});
```

Note: You can also use a configuration loader like [seraphim](https://github.com/gagle/node-seraphim).

---

<a name="parse"></a>
___module_.parse(data[, options][, callback]) : undefined | Object__  

Parses a .properties string.

If a callback is given, the result is returned as the second parameter. Some options will require a callback.

```javascript
try{
  //Certain options can throw errors, so if the callback is not used, try-catch
  //the function
  obj = properties.parse ({ ... });
}catch (error){
  ...
}

properties.parse ({ ... }, function (error, obj){
  //The callback must be used if the "path" option is used
});
```

Options:

- __path__ - _Boolean_  
  By default `parse()` reads a String. If you want to read a file, set this option to true. If this option is used, the callback is mandatory. It gets 2 parameters, a possible error and the object with all the properties.
- __comments__ - _String_ | _Array_  
  Allows you to add additional comment tokens. The token must be a single printable non-whitespae ascii character. If the `strict` option is not set, the tokens `#` and `!` are parsed as comment tokens.
  
  ```javascript
  comments: ";"
  comments: [";", "@"]
  ```
- __separators__ - _String_ | _Array_  
  Allows you to add additional separator tokens. The token must be a single printable non-whitespae ascii character. If the `strict` option is not set, the tokens `=` and `:` are parsed as comment tokens.
  
  ```javascript
  separators: "-"
  separators: ["-", ">"]
  ```
- __strict__ - _Boolean_  
  This option can be used with the `comments` and `separators` options. If true, __only__ the tokens specified in these options are used to parse comments and separators.
- __sections__ - _Boolean_  
  Parses INI sections. Read the [INI](#ini) section for further details.
- __namespaces__ - _Boolean_  
  Parses dot separated keys as JavaScript objects. Look at the [namespaces](#namespaces) section for further details.
- __variables__ - _Boolean_  
  Allows you to read the value of a key while the file is being parsed. Look at the [variables](#variables) section for further details.
- __vars__ - _Boolean_  
  External variables can be passed to the file if the variables option is enabled. Look at the [variables](#variables) section for further details.
- __include__ - _Boolean_  
  Files can be linked and imported with the `include` key. If this option is used, the callback is mandatory. Look at the [include](#include) section for further details.
- __reviver__ - _Function_  
  Each property or section can be removed or modified from the final object. It's similar to the reviver of the `JSON.parse()` function.

  The reviver it's exactly the same as the replacer from [stringify()](#stringify). The same function can be reused.

  The callback gets 3 parameters: key, value and section.
  
  A property has a key and a value and can belong to a section. If it's a global property, the section is set to null. If __undefined__ is returned, the property will be removed from the final object, otherwise the returned value will be used as the property value.
  
  If the key and the value are set to null, then it's a section line. If it returns a falsy value, it won't be added to the final object, the entire section -including all the properties- will be discarded. If it returns a truthy value, the section is parsed.
  
  For your convenience, to know whether the line is a property or section you can access to `this.isProperty` and `this.isSection` from inside the replacer function. Also, `this.assert()` can be used to return the _default_ value, the unmodified value that will be used to parse the line.
  
  `this.assert()` it's the same as:
  
    ```javascript
    if (this.isProperty){
      return value;
    }else{
      //isSection
      return true;
    }
    ```
  
  For example, a reviver that does nothing and a reviver that removes all the lines:
  
    ```javascript
    function (key, value, section){
      //Returns all the lines
      return this.assert ();
    }
    ```
    
    ```javascript
    function (key, value, section){
      //Removes all the lines
    }
    ```
  
  The reviver is called just after the value is casted to the proper data type. This means that the `value` parameter can be null, true, false or any data type.
  
  This module doesn't parse arrays but you can actually parse comma-separated values using a reviver:
  
  ```javascript
  var options = {
    sections: true,
    reviver: function (key, value, section){
      //Do not split section lines
      if (this.isSection) return this.assert ();
      
      //Split all the string values by a comma
      if (typeof value === "string"){
        var values = value.split (",");
        return values.length === 1 ? value : values;
      }
      
      //Do not split the rest of the lines
      return this.assert ();
    }
  };
  
  /*
  [sec,tion]
  key1 a,b,c
  key2 true
  */
  console.log (properties.parse ("[sec,tion]\n key1 a,b,c\n key2 true", options));
  
  /*
  {
    "sec,tion": {
      key1: ["a", "b", "c" ],
      key2: true
    }
  }
  */
  ```
  
  Look at the [reviver](https://github.com/gagle/node-properties/blob/master/examples/reviver/reviver.js) example for further details.

---

<a name="createStringifier"></a>
___module_.createStringifier() : Stringifier__

Returns a new [Stringifier](#Stringifier) instance.

---

<a name="stringify"></a>
___module_.stringify(obj[, options][, callback]) : undefined | String__

Stringifies an object or a [Stringifier](#Stringifier).

If you don't need to add sections or comments simply pass an object, otherwise use a [Stringifier](#Stringifier).

The callback is only necessary when the `path` option is used.

Nested objects and arrays cannot be stringified like in JSON.stringify:

```javascript
properties.stringify ({
  a: [1, "a"],
  b: {}
});

/*
a = 1,a
b = [object Object]
*/
```

This also applies to the [Stringifier](#Stringifier) keys and values.

Options:

- __path__ - _String_  
  By default `stringify()` returns a string. If you want to write it to a file, use this option and pass the path of a file. If this option is used, the callback is mandatory. It gets two parameters, a possible error and the string.
- __comment__ - _String_  
  The token to use to write comments. It must be a single printable non-whitespace ascii character. Default is `#`.
- __separator__ - _String_  
  The token to use to separate keys from values. It must be a single printable non-whitespace ascii character. Default is `=`.
- __unicode__ - _Boolean_  
  The .properties specification uses iso 8859-1 (latin-1) as a default encoding. In the other hand, Node.js has a utf8 default encoding. This means that if you want a full compatibility with Java, that is, you are generating a .properties file that is going to be read by a Java program, then set this option to true. This will encode all ascii extended and multibyte characters to their unicode string representation (`\uXXXX`).

  Non-printable control codes (control sets 0 and 1) are always encoded as unicode strings except `\t`, `\n`, `\f` and `\r`.
  
  If you are in a platform that can handle utf8 strings, e.g. Node.js, you don't need to use this option.
- __replacer__ - _Function_  
  Each property or section can be removed or modified from the final string. It's similar to the replacer of the `JSON.stringify()` function.

  The replacer it's exatcly the same as the reviver from [parse()](#parse). The same function can be reused.

  The callback gets three parameters: key, value and section.
  
  A property has a key and a value and can belong to a section. If it's a global property, the section is set to null. If __undefined__ is returned, the property won't be stringified, otherwise the returned value will be used as the property value.
  
  If the key and the value are set to null, then it's a section line. If it returns a falsy value, it won't be added to the final string, the entire section -including all the properties- will be discarded. If it returns a truthy value, the section is stringified.
  
  For your convenience, to know whether the line is a property or section you can access to `this.isProperty` and `this.isSection` from inside the replacer function. Also, `this.assert()` can be used to return the _default_ value, the unmodified value that will be used to stringify the line.
  
  `this.assert()` it's the same as:
  
    ```javascript
    if (this.isProperty){
      return value;
    }else{
      //isSection
      return true;
    }
    ```
  
  For example, a replacer that does nothing and a replacer that removes all the lines:
    
    ```javascript
    function (key, value, section){
      //Returns all the lines
      return this.assert ();
    }
    ```
    
    ```javascript
    function (key, value, section){
      //Removes all the lines
    }
    ```
  
  Look at the [replacer](https://github.com/gagle/node-properties/blob/master/examples/replacer.js) example for further details.

---

<a name="Stringifier"></a>
__Stringifier__

This class is used when you want to add sections or comments to the final string.

To create a Stringifier use the [createStringifier()](#createStringifier) function.

__Methods__

- [Stringifier#header(comment) : Stringifier](#Stringifier_header)
- [Stringifier#property(obj) : Stringifier](#Stringifier_property)
- [Stringifier#section(obj) : Stringifier](#Stringifier_section)

<a name="Stringifier_header"></a>
__Stringifier#header(comment) : Stringifier__

Writes a header comment. It will be written to the top of the final string. Returns the Stringifier being used.

<a name="Stringifier_property"></a>
__Stringifier#property(obj) : Stringifier__

Writes a property line. It takes an object with three options: `key`, `value` and `comment`. Both the key and the value are converted into a string automatically. Returns the Stringifier being used.

```javascript
stringifier
  //No value
  .property ({ key: "a" })
  .property ({ key: "b", value: [1, 2, 3] })
  //No key and no value
  .property ({ comment: "empty" })

/*
a = 
b = 1,2,3
# empty
 = 
*/
```

<a name="Stringifier_section"></a>
__Stringifier#section(obj) : Stringifier__

Writes a section line. It gets an object with two options: `name` and `comment`. The name is converted into a string. If you don't need to write a comment, you can pass the name instead of an object. Returns the stringifier being used.

```javascript
stringifier.section ("my section");

/*
[my section]
*/

stringifier.section ({ name: "my section", comment: "My Section" });

/*
# My Section
[my section]
*/
```

Look at the [stringify-ini](https://github.com/gagle/node-properties/blob/master/examples/ini/stringify-ini.js) example for further details.