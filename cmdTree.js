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
filter(item);

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
