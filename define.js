#!/usr/bin/env node
const args = process.argv;
//const apiSpec = require('./nsx-api-2-3.json');
const apiSpec = require('./nsx-api-2-4.json');
//const apiSpec = require('./vcenter.json');
var paths = apiSpec.definitions;

// cli switch
var item = args[2];
var method = args[3];
var result;
const defaults = {
	writeOnly: 0,
	required: 0,
	hidden: 0
}
if(route = paths[item]) {
	switch(method) {
		case "read":
			result = defTree(route, {
				writeOnly: 0,
				required: 0
			});
			console.log(JSON.stringify(result, null, "\t"));
		break;
		case "readHidden":
			result = defTree(route, {
				writeOnly: 0,
				required: 0,
				hidden: 1,
				deprecated: 1
			});
			console.log(JSON.stringify(result, null, "\t"));
		break;
		case "write":
			result = defTree(route, {
				writeOnly: 1,
				required: 0
			});
			console.log(JSON.stringify(result, null, "\t"));
		break;
		case "writeMin":
			result = defTree(route, {
				writeOnly: 1,
				required: 1
			});
			console.log(JSON.stringify(result, null, "\t"));
		break;
		default:
			console.log(JSON.stringify(route, null, "\t"));
		break;
	}
} else {
	filter(item);
}

function defTree(spec, opts) {
	let data = {};
	if(typeof spec.allOf !== 'undefined') {
		spec.allOf.forEach((body) => { // merge all
			data = Object.assign(data, selectType(body, opts));
		});
	} else {
		data = Object.assign(data, selectType(spec, opts));
	}
	return data;
}

function selectType(body, opts) {
	let node = {};
	if(typeof body.type !== 'undefined') {
		switch(body.type) {
			case "object":
				node = isObject(body, opts);
			break;
			case "array":
				node = isArray(body, opts);
			break;
			case "string":
				node = isString(body, opts);
			break;
			case "integer":
				node = '<integer>';
			break;
			case "boolean":
				node = '<boolean>';
			break;
			case "discriminator":
				node = isDiscriminator(body, opts);
			break;
		}
	} else { // isRef
		if(typeof body['$ref'] !== 'undefined') {
			node = isRef(body, opts);
		}
	}
	return node;
}

function isIncluded(key, body, opts) {
	let include = 1;
	if(!opts.hidden && key.match(/^_/)) { // hidden fields
		include = 0;
	}
	if(opts.writeOnly && body['readOnly']) { // isReadOnly
		include = 0;
	}
	if(!opts.deprecated && body['x-deprecated']) { // deprecated
		include = 0;
	}
	return include;
}

function isObject(body, opts) {
	let node = {};
	let fields = [];
	if(opts.required) {
		if(typeof body.required !== 'undefined') {
			fields = body.required;
		}
	} else {
		if(typeof body.properties !== 'undefined') {
			fields = Object.keys(body.properties);
		}
	}

	if(typeof body.discriminator !== 'undefined') {
		// do something?
		body.properties[body.discriminator].type = 'discriminator';
	}

	fields.forEach((key) => {
		let value = body.properties[key];
		if(isIncluded(key, value, opts)) {
			node[key] = selectType(value, opts);
		}
	});
	return node;
}

function isRef(body, opts) {
	let node = {};
	let matches;
	let string = body['$ref'];
	if(matches = string.match(/#[\/]definitions[\/](.+)/)) {
		if(value = paths[matches[1]]) {
			node = defTree(value, opts); // recurse
		}
	}
	return node;
}

function isArray(body, opts) {
	let node = [{}];
	if(typeof body['items'] !== 'undefined') {
		node = [selectType(body['items'], opts)];
	}
	return node;
}

function isString(body, opts) {
	let node = "<string>";
	if(typeof body.enum !== 'undefined') {
		node = body.enum;
	}
	return node;
}

function isDiscriminator(body, opts) {
	let node = "<string>";
	if(typeof body.enum !== 'undefined') {
		node = body.enum.map(a => ('$' + a));
	}
	return node;
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
		console.log('object [' + item.key + ']');
	});
}
