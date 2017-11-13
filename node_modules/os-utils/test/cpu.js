var os = require('../lib/OSUtils');

console.log('\n');
console.log( 'OS Utils');
console.log('\n');
  
setInterval(function() {
	
	os.cpuUsage(function(v){
		console.log( 'CPU Usage (%): ' + v );
	});

}, 1000 );
