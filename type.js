#!/usr/bin/env node
let args = process.argv;
//const apiSpec = require('./nsx-api.json');
const apiSpec = require('./nsx-api-2-4.json');
//const apiSpec = require('./vcenter.json');
//const apiSpec = require('./oms-api-5.1.json');
const paths = apiSpec.paths;

// cli switch
var item = args[2];
var method = args[3];
/*
if(route = paths['/' + item]) {
	switch(method) {
		case "get":
			search(route, 'get');
		break;
		case "put":
			search(route, 'put');
		break;
		case "post":
			search(route, 'post');
		break;
		case "delete":
			search(route, 'delete');
		break;
		default:
			console.log(JSON.stringify(route, null, "\t"));
			console.log("No method specified");
		break;
	}
} else {
*/
	filter(item);
	//nested(item);
//}

function search(path, method) {
	if(method == "get") {
		let call = path["get"];
		let params = call.responses["200"];
		console.log("GET");
		if(call.parameters) {
			console.log(JSON.stringify(call.parameters, null, "\t"));
		}
	}
	if(method == "put") {
		let call = path["get"];
		let params = call.responses["200"];
		console.log("PUT");
		if(call.parameters) {
			console.log(JSON.stringify(call.parameters, null, "\t"));
		}
	}
	if(method == "post") {
		let call = path["post"];
		let params = call.responses["201"];
		console.log("POST");
		if(call.parameters) {
			console.log(JSON.stringify(call.parameters, null, "\t"));
		}
	}
	if(method == "delete") {
		let call = path["delete"];
		let params = call.responses["201"];
		console.log("DELETE");
		if(call.parameters) {
			console.log(JSON.stringify(call.parameters, null, "\t"));
		}
	}
}

function filter(value) {
	// construct input
	let data = [];
	Object.keys(paths).sort().forEach((value) => {
		data.push({
			key: value
		});
	});

	// filter and print
	const xcell = require('./xcell.js');
	cell = new xcell({
		data: data
	});
	cell.addFilter({
		'field': 'key',
		'value': value
	});
	cell.run().forEach((item) => {
		//console.log('key [' + item.key + ']');
	});

	// tree merge
	nested(cell.view)
}

function nested(paths) {
	let cache = {};
	paths.forEach((path) => {
		//console.log('TESTING: ' + path.key);
		let matches = path.key.match(/([^/]+)/g)
		tree(cache, matches);
	});
	console.log(JSON.stringify(cache, null, "\t"));
}

function tree(cache, array) {
	let item = array.shift();
	if(!item.match(/\?/g)) {
		if(typeof cache[item] === 'undefined') {
			cache[item] = {};
		}
		if(array.length) {
			tree(cache[item], array);
		} else {
			cache[item]['get'] = 1;
		}
	}
}
