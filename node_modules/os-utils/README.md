os-utils
========

an operating-system utility library. Some methods are wrappers of Node libraries
and others are calculation made by the module.


## Instalation

One line instaltion with [npm](http://npmjs.org). 

	npm install os-utils

Then in your code 
	
	var os 	= require('os-utils');


	os.cpuUsage(function(v){
		console.log( 'CPU Usage (%): ' + v );
	});

	os.cpuFree(function(v){




## Usage

The follwoing methods are available:


### Calculate CPU usage in the next second. This is not an average of CPU usage like in the "os" module. The callback will receive a parameter with the value

	os.cpuUsage( callback );
	

### Calculate free CPU in the next second. This is not based on average CPU usage like in the "os" module. The callback will receive a parameter with the value

	os.cpuFree( callback );

	
### Get the platform name

	os.platform();


### Get number of CPU

	os.countCPUs()


### Get current free memory

	os.freemem()


### Get total memory

	os.totalmem()


### Get a percentage reporesentinf the free memory

	os.freememPercentage()


### Get the number of miliseconds that the system has been running for.

	os.sysUptime();
	
	
### Get the number of miliseconds that the process has been running for.

	os.processUptime() 


### Get average load for the 1, 5 or 15 minutes

	os.loadavg(1)
	os.loadavg(5)
	os.loadavg(15)
	
