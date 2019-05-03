#!/usr/bin/env node
let args = process.argv;
const hd = require('heredoc');
const fs = require('fs');
//const cmdSpec = require('./vsp-full-spec.json');
const cmdSpec = require('./24-full-spec.json');

// cli switch
var item = args[2];
var method = args[3];
compile(cmdSpec);

function compile(spec) {
	//console.log(JSON.stringify(spec, null, "\t"));
	let dir = './lib';
	if (!fs.existsSync(dir)){
		fs.mkdirSync(dir);
	}
	myTree([], spec);
	fs.copyFile('./cmd', './lib/cmd', () => {});
	fs.copyFile('./drv.core', './lib/drv.core', () => {});
	fs.copyFile('./drv.nsx.client', './lib/drv.nsx.client', () => {});
	fs.copyFile('./drv.vsp.client', './lib/drv.vsp.client', () => {});
	fs.copyFile('./sddc.parameters', './lib/sddc.parameters', () => {});
}

function myTree(keys, cmds) {
	Object.keys(cmds).forEach((key) => {
		let body = cmds[key];
		let newKeys = keys.slice(0);
		if(matches = key.match(/\{(.+)\}/)) {
			key = matches[1] + '[]';
			let drvFile = 'cmd.' + newKeys.join('.') + '.get';
			console.log('summary cmd driver: ' + key + ':::' + drvFile);
			//if(!fs.existsSync(drvFile)) {
				writeList(drvFile);
			//}
		}
		newKeys.push(key);
		//console.log('summary cmd driver: ' + key + '---');
		if(key == 'get') {
			let drvFile = 'drv.' + newKeys.join('.');
			//console.log('moo summary cmd driver: ' + drvFile);
			//if(!fs.existsSync(drvFile)) {
				writeDriver(drvFile);
			//}
		}
		let thisFile = 'cmd.' + newKeys.join('.');
		if(Object.keys(body).length) {
			//if(!fs.existsSync(thisFile)) {
				writeFile(thisFile);
			//}
			myTree(newKeys, body);
		} else {
			//if(!fs.existsSync(thisFile)) {
				writeLeaf(thisFile);
			//}
			console.log('LEAF: ' + newKeys.join('.'));
		}
	});
}

function writeLeaf(fileName) {
	let body = hd.strip(() => {/*
		#!/bin/bash
		FILEPATH=$0
		if [[ -L ${FILEPATH} ]]; then
			FILEPATH=$(readlink $0)
		fi
		if [[ $FILEPATH =~ ^(.*)/([^/]+)$ ]]; then
			WORKDIR="${BASH_REMATCH[1]}"
			CALLED="${BASH_REMATCH[2]}"
		fi
		source ${WORKDIR}/drv.core
		source ${WORKDIR}/cmd
		run() {
			## input driver
			local INPUT=("${@}")
			local ITEM
			if [[ $CALLED =~ cmd[.](.+)$ ]]; then
				ITEM=$(printf "${BASH_REMATCH[1]}")
			fi
			local INPUT=$(${WORKDIR}/drv.${ITEM} "${INPUT[@]}")
			printf "%s" "${INPUT}" | jq --tab .
		}
		IFS=$'\n'
		INPUTS=($(chain "${@}"))
		case "${INPUTS[0]}" in
			run) # run
				run "${INPUTS[@]:1}"
			;;
			*) # tab
				printf "%s\n" "${INPUTS[@]}" | uniq
			;;
		esac
	*/})
	fs.writeFileSync('./lib/' + fileName, body);
	fs.chmodSync('./lib/' + fileName, 0o755);
}

function writeFile(fileName) {
	let body = hd.strip(() => {/*
		#!/bin/bash
		FILEPATH=$0
		if [[ -L ${FILEPATH} ]]; then
			FILEPATH=$(readlink $0)
		fi
		if [[ $FILEPATH =~ ^(.*)/([^/]+)$ ]]; then
			WORKDIR="${BASH_REMATCH[1]}"
			CALLED="${BASH_REMATCH[2]}"
		fi
		source ${WORKDIR}/drv.core
		source ${WORKDIR}/cmd
		run() {
			## input driver
			local INPUT=("${@}")
			local ITEM
			if [[ $CALLED =~ cmd[.](.+)$ ]]; then
				ITEM=$(printf "${BASH_REMATCH[1]}")
			fi
			local INPUT=$(${WORKDIR}/drv.${ITEM} "${INPUT[@]}")
			printf "%s" "${INPUT}" | jq --tab .
		}
		IFS=$'\n'
		INPUTS=($(chain "${@}"))
		case "${INPUTS[0]}" in
			run) # run
				#run "${INPUTS[@]:1}"
			;;
			*) # tab
				printf "%s\n" "${INPUTS[@]}" | uniq
			;;
		esac
	*/})
	fs.writeFileSync('./lib/' + fileName, body);
	fs.chmodSync('./lib/' + fileName, 0o755);
}

function writeDriver(fileName) {
        let body = hd.strip(() => {/*
		#!/bin/bash
		FILEPATH=$0
		if [[ -L ${FILEPATH} ]]; then
			FILEPATH=$(readlink $0)
		fi
		if [[ $FILEPATH =~ ^(.*)/([^/]+)$ ]]; then
			WORKDIR="${BASH_REMATCH[1]}"
			CALLED="${BASH_REMATCH[2]}"
		fi
		source ${WORKDIR}/drv.core
		source ${WORKDIR}/drv.nsx.client
		if [[ $CALLED =~ drv[.](.+)[.][^.]+$ ]]; then
			ITEM=$(printf "${BASH_REMATCH[1]}" | tr '.' '/')
			COUNTER=1
			while [[ $ITEM =~ ([-a-z0-9]+\[\]) ]]; do # replace variables in name
				ITEM="${ITEM/${BASH_REMATCH[1]}/${!COUNTER}}"
				COUNTER=$((COUNTER+1))
			done
		fi
		if [[ -n "${NSXHOST}" ]]; then
			URL=$(buildURL "${ITEM}")
			if [[ -n "${URL}" ]]; then
				printf "[$(cgreen "INFO")]: nsx [$(cgreen "get")] ${ITEM} [$(cgreen "$URL")]... " 1>&2
				nsxGet "${URL}"
			fi
		fi
        */})
	fs.writeFileSync('./lib/' + fileName, body);
	fs.chmodSync('./lib/' + fileName, 0o755);
}

function writeList(fileName) {
	let body = hd.strip(() => {/*
		#!/bin/bash
		FILEPATH=$0
		if [[ -L ${FILEPATH} ]]; then
			FILEPATH=$(readlink $0)
		fi
		if [[ $FILEPATH =~ ^(.*)/([^/]+)$ ]]; then
			WORKDIR="${BASH_REMATCH[1]}"
			CALLED="${BASH_REMATCH[2]}"
		fi
		source ${WORKDIR}/drv.core
		source ${WORKDIR}/cmd
		run() {
			## input driver
			local ITEM
			if [[ $CALLED =~ cmd[.](.+)$ ]]; then
				ITEM=$(printf "${BASH_REMATCH[1]}")
			fi
			local INPUT=$(${WORKDIR}/drv.${ITEM})
			printf "%s" "${INPUT}" | jq --tab .
		}
		IFS=$'\n'
		INPUTS=($(chain "${@}"))
		case "${INPUTS[0]}" in
			#run) # run
			#	run
			#;;
			*) # tab
				INPUT=$(run)
				## build record structure
				read -r -d '' INPUTSPEC <<-CONFIG
					.results | map({
						"id": .id,
						"name": .display_name,
						"resource_type": .resource_type
					})
				CONFIG
				PAYLOAD=$(echo "$INPUT" | jq -r "$INPUTSPEC")
				## output
				buildTable "${PAYLOAD}"
			;;
		esac
	*/})
	fs.writeFileSync('./lib/' + fileName, body);
	fs.chmodSync('./lib/' + fileName, 0o755);
}


