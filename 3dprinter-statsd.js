var http = require('http'),
    udp   = require('dgram').createSocket('udp4');

var ACCESS_TOKEN = (process.env.ACCESS_TOKEN ? process.env.ACCESS_TOKEN : '').trim();
var OCTO_HOST = (process.env.OCTO_HOST ? process.env.OCTO_HOST : '').trim();
var OCTO_PORT = (process.env.OCTO_PORT ? process.env.OCTO_PORT : 80);
var INTERVAL = (process.env.INTERVAL ? process.env.INTERVAL: 15);
var STATSD_HOST = (process.env.STATSD_HOST ? process.env.STATSD_HOST : '127.0.0.1');
var STATSD_PORT = (process.env.STATSD_PORT ? process.env.STATSD_PORT : 8125);

var opts = {
	hostname: OCTO_HOST,
	port: OCTO_PORT,
	path: '/api/printer',
	method: 'GET',
	headers: {
		'X-Api-Key': ACCESS_TOKEN
	}
};

var req;

get_api_printer();

setInterval(get_api_printer, INTERVAL*1000);


function get_api_printer() {
	req = http.request(opts, function(res) {
		var data = undefined;
	
		res.on('data', function(d) {
			d = d.toString().trim();
			//console.log(">>>", d);

			try {
				d = JSON.parse(d);

				doStats('3dprinter.temperature.tool0.actual', d.temperature.tool0.actual, 'g');
				doStats('3dprinter.temperature.tool0.target', d.temperature.tool0.target, 'g');
				doStats('3dprinter.temperature.bed.actual', d.temperature.bed.actual, 'g');
				doStats('3dprinter.temperature.bed.target', d.temperature.bed.target, 'g');

				doStats('3dprinter.state.flags.operational', (d.state.flags.operational ? 1 : 0), 'g');
				doStats('3dprinter.state.flags.paused', (d.state.flags.paused ? 1 : 0), 'g');
				doStats('3dprinter.state.flags.printing', (d.state.flags.printing ? 1 : 0), 'g');
				doStats('3dprinter.state.flags.sdReady', (d.state.flags.sdReady ? 1 : 0), 'g');
				doStats('3dprinter.state.flags.error', (d.state.flags.error ? 1 : 0), 'g');
				doStats('3dprinter.state.flags.ready', (d.state.flags.ready ? 1 : 0), 'g');
				doStats('3dprinter.state.flags.closedOnError', (d.state.flags.closedOnError ? 1 : 0), 'g');
			} catch(e) {
				// Do nothing
			}
		});
	});

	req.end();
}


function doStats(metric, value, type) {
	var msg;

	msg = metric+':'+value+'|'+type;
	msg = new Buffer(msg);
	udp.send(msg, 0, msg.length, STATSD_PORT, STATSD_HOST);
	console.log("<<<", msg.toString());
}
