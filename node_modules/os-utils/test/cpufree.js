var os = require('../lib/OSUtils');

console.log('\n');
console.log( 'OS Utils');
console.log('\n');
  
setInterval(function() {
	
	os.cpuFree(function(v){
		console.log( 'CPU Free (%): ' + v );
	});

}, 1000 );
