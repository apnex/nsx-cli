#!/usr/bin/env node
const hd = require('heredoc');
const apiSpec = require('../spec/nsx-api-2-4.json');
const paths = apiSpec.paths;

// colours
const chalk = require('chalk');
const red = chalk.bold.red;
const orange = chalk.keyword('orange');
const green = chalk.green;
const blue = chalk.blueBright;

// cli switch
var params = [];
var ids = [
	'deadbeef01',
	'deadbeef02',
	'deadbeef03'
];
var index = 0;

// called from shell
if(process.argv[1].match(/carbon/g)) {
	let cmd = process.argv[2];
	let args = process.argv.slice(3);
	switch(cmd) {
		case 'complete':
			if(args.length > 0) {
				let cmdSpec = require(args[0]);
				chain(args.slice(1));
				run(args.slice(1), cmdSpec);
			} else {
				console.log('[' + orange('ERROR') + ']: command usage: ' + green('cmdrun complete') + ' ' + blue('<cmdfile.json> [ <cmds> ... ]'));
			}
		break;
		case 'generate':
			if(args.length > 1) {
				let opts = {
					'CMDFILE': args[0],
					'CMDNAME': args[1],
				};
				makeComplete(opts);
			} else {
				console.log('[' + orange('ERROR') + ']: command usage: ' + green('cmdrun generate') + ' ' + blue('<cmdfile.json> <cmdname>'));
			}
		break;
		case 'build':
			build(args[0]);
		break;
		default:
			console.log('No command specified [complete, generate, build]');
			// improve help output
	}
}



function run(cmds, body) {
	if(index < cmds.length) {

		// command - parse
		let cmd = cmds[index++];

		// check if dynamic variable
		if(m = cmd.match(/^.+\[\]$/)) {

			// variable - convert variable[] to {variable}
			cmd = '{' + cmd.replace(/\[\]$/, "") + '}';

			// check if in body?
			if(item = body[cmd]) {

				// check if parameter
				if(index < cmds.length) {

					// parameter - extract and recurse
					params.push(cmds[index++]);
					run(cmds, item);
				} else {

					// no parameter - obtain dynamic id list
					ids.forEach((id) => {
						console.log(id);
					});
				}
			}
		} else {

			// no variable - recurse
			if(item = body[cmd]) {
				run(cmds, item);
			}
		}
	} else {

		// no command - print available commands
		Object.keys(body).forEach((cmd) => {
			var regex = /^\{.+\}$/;
			if(m = cmd.match(regex)) {
				cmd = cmd.replace(/^\{/, "");
				cmd = cmd.replace(/\}$/, "[]");
			}
			console.log(cmd);
		});
	}
}

function chain(args) {
	let chain = '';
	if(args.length > 0) {
		args.forEach((key) => {
			if(!key.match(/^.+\[\]$/)) {
				chain += '/' + key;
			}
		});
	} else {
		chain = '/';
	}
	console.log('--[ ' + chain + ' ]--');
}

function makeComplete(opts) {
	let body = hd.strip(() => {/*
		#!/bin/bash
		_temp_bind() {
			## temporarily change a bunch of bind terminal settings
			local OLDSETTINGS
			local WIDTH=$(bind -v | sed -n 's/^set completion-display-width //p')
			local POINT=$(bind -v | sed -n 's/^set history-preserve-point //p')
			local AMBIG=$(bind -v | sed -n 's/^set show-all-if-ambiguous //p')
			local UNMOD=$(bind -v | sed -n 's/^set show-all-if-unmodified //p')
			local COLOR=$(bind -v | sed -n 's/^set colored-completion-prefix //p')
			if [[ "${WIDTH}" -ne 0 ]]; then
				bind "set completion-display-width 0"
				OLDSETTINGS+="; bind 'set completion-display-width ${WIDTH}'"
			fi
			if [[ "${AMBIG}" == "off" ]]; then
				bind "set show-all-if-ambiguous on"
				OLDSETTINGS+="; bind 'set show-all-if-ambiguous ${AMBIG}'"
			fi
			if [[ "${POINT}" == "off" ]]; then
				bind "set history-preserve-point on"
				OLDSETTINGS+="; bind 'set history-preserve-point ${POINT}'"
			fi
			if [[ "${UNMOD}" == "off" ]]; then
				bind "set show-all-if-unmodified on"
				OLDSETTINGS+="; bind 'set show-all-if-unmodified ${UNMOD}'"
			fi
			if [[ "${COLOR}" == "off" ]]; then
				bind "set colored-completion-prefix on"
				OLDSETTINGS+="; bind 'set colored-completion-prefix ${COLOR}'"
			fi
			if [[ -n "${OLDSETTINGS}" ]]; then # reset bind settings to previous
				PROMPT_COMMAND="PROMPT_COMMAND=$(printf %q "${PROMPT_COMMAND}")"
				PROMPT_COMMAND+="${OLDSETTINGS}"
			fi
		}
		_temp_base_complete() {
			local CMDFILE=$1
			local CUR PRV
			local ARRAY=()
			COMPREPLY=()
			CUR="${COMP_WORDS[COMP_CWORD]}"
			PRV="${COMP_WORDS[COMP_CWORD-1]}"
			CYAN='\033[0;36m' # cyan
			NC='\033[0m' # no colour
			_temp_bind
			if [[ ${PRV} != "get" ]]; then
				local IFS=$'\n'
				if [[ ${#COMP_WORDS[@]} -ge 1 ]]; then
					ARRAY=($(carbon complete "${CMDFILE}" "${COMP_WORDS[@]:1:${#COMP_WORDS[@]}-2}" 2>/dev/null | tr -d '\r')) # handle CRLF in tty
				else
					ARRAY=($(carbon complete "${CMDFILE}" 2>/dev/null | tr -d '\r')) # handle CRLF in tty
				fi
				local HEADER="${ARRAY[0]}"
				local VALUES=("${ARRAY[@]:1}")
				local SUGGESTIONS=($(compgen -W "${VALUES[*]}" -- "${CUR}"))
				if [ "${#SUGGESTIONS[@]}" -ge "2" ]; then # print header/values
					printf "\n${CYAN}${HEADER}${NC}" 1>&2
					for I in "${!SUGGESTIONS[@]}"; do
						SUGGESTIONS[$I]="$(printf '%*s' "-$COLUMNS"  "${SUGGESTIONS[$I]}")"
					done
					COMPREPLY=("${SUGGESTIONS[@]}")
				else
					if [ "${#SUGGESTIONS[@]}" == "1" ]; then
						local ID="${SUGGESTIONS[0]%%\ *}"
						COMPREPLY=("$ID")
					fi
				fi
			fi
			return 0
		}
	*/});
	body += "_" + opts['CMDNAME'] + "_complete() {\n";
	body += "\t_temp_base_complete '" + opts['CMDFILE'] + "'\n"
	body += "}\n"
	body += "complete -F _" + opts['CMDNAME'] + "_complete " + opts['CMDNAME'];
	console.log(body);
}

function status(opts) {
	/*{
		type: 'ERROR',
		keys: [
			{
				type: 0,
				key: 'cmdrun'
			},
			{
				type: 0,
				key: 'generate'
			},
			{
				type: 1,
				key: 'cmdfile.json'
			}
		]
	}*/
	console.log('[' + orange('ERROR') + ']: command usage: ' + green('cmdrun generate') + ' ' + blue('<cmdfile.json> <cmdname>'));
}
function build(value) {
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

