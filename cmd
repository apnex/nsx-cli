#!/bin/bash
# detect and resolve symlink
if [[ -L $0 ]]; then
	if [[ $(readlink $0) =~ ^(.*)/([^/]+)$ ]]; then
		WORKDIR="${BASH_REMATCH[1]}"
		CALLED="${BASH_REMATCH[2]}"
	fi
else
	if [[ $0 =~ ^(.*)/([^/]+)$ ]]; then
		WORKDIR="${BASH_REMATCH[1]}"
		CALLED="${BASH_REMATCH[2]}"
	fi
fi

# static cmds
command() {
	local ARRAY=()
	for FILE in ${WORKDIR}/cmd.*; do
		if [[ "${FILE}" =~ "${CALLED}"[.]([^.]+) ]]; then
			ARRAY+=("${BASH_REMATCH[1]}")
		fi
	done
	if [[ ${#ARRAY[@]} -ge 1 ]]; then
		printf "%s\n" "--[ cmd ]--"
		printf "%s\n" "${ARRAY[@]}" | uniq
	fi
}

# dynamic items
localitem() {
	local CALLED="$1"
	printf "%s\n" "--{ ${CALLED} }--" 1>&2
	if [ -f "${WORKDIR}/${CALLED}.list" ]; then
		local LIST=$("${WORKDIR}/${CALLED}.list" "[]" 2>/dev/null)
		if [[ ${#LIST[@]} -ge 1 ]]; then
			printf "%s\n" "${LIST[@]}" | uniq
		fi
	fi
}

# set array
getarray() {
	local MYARR=("${@}")
	local IFS=$','
	printf "${MYARR[*]}"
}

chain() {
	local INPUTS=("${@}")
	local CMD=("${INPUTS[0]}")
	local PARAMS=("${INPUTS[@]:1}")
	local RESPONSE=()
	local OlDIFS=$IFS
	local IFS=$'\n' #split on cr

	if [[ "${CMD}" =~ ^\[([^\]]*)\] ]]; then
		local ITEMS="${BASH_REMATCH[1]}"
		#echo "[${CALLED}]: [${ITEMS}] [${#PARAMS[@]}: [${PARAMS[@]}]]" 1>&2
		if [[ ${#PARAMS[@]} == 0 ]]; then
			## need to check [run] action here - could be a leaf
			local MYARR=($(printf "${ITEMS}" | tr ',' '\n'))
			if [[ "${MYARR[0]}" == "run" ]]; then
				# leaf[run] - at a leaf with no arguments
				RESPONSE=("${MYARR[@]:1}")
			else
				# leaf[] - (tab) at a leaf with no arguments
				RESPONSE=($(command))
			fi
		else
			local FIRST=("${PARAMS[0]}")
			local REST=("${PARAMS[@]:1}")
			if [[ "${FIRST}" =~ (.+)\[\]$ ]]; then
				# variable[]
				if [[ ${#REST[@]} == 0 ]]; then
					# variable[] - call parent.list
					RESPONSE=($(localitem "${CALLED}"))
				else
					# variable[] - extract and append params
					local MYARR=($(printf "${ITEMS}" | tr ',' '\n'))
					MYARR+=("${REST[0]}")
					local VARSTR=$(getarray "${MYARR[@]}")
					local IFS=$'\n' #split on newline
					if [ -f "${WORKDIR}/${CALLED}.${FIRST}" ]; then
						# variable[] - chain to next cmd
						RESPONSE=($(${WORKDIR}/${CALLED}.${FIRST} "[${VARSTR}]" "${REST[@]:1}"))
					else
						# variable[] - next cmd not exist - should not end up here via autocomplete
						RESPONSE=("${VARSTR[@]}") # leaf
					fi
				fi
			else
				# not variable[] - has arguments
				if [ -f "${WORKDIR}/${CALLED}.${FIRST}" ]; then
					# not variable[] - chain to next cmd
					RESPONSE=($(${WORKDIR}/${CALLED}.${FIRST} "[${ITEMS}]" "${REST[@]}"))
				else
					# not variable[] - cmd not found - return with spec for execution
					local MYARR=($(printf "${ITEMS}" | tr ',' '\n'))
					RESPONSE+=("${MYARR[@]:1}")
					RESPONSE+=("${PARAMS[@]}")
				fi
			fi
		fi
	else
		# not an autocomplete path - run
		#printf "%s\n" "ENTER: [${CALLED}]" 1>&2
		RESPONSE=($(chain "[run]" "${INPUTS[@]}"))
	fi
	if [[ ${#RESPONSE[@]} -ge 1 ]]; then
		printf "%s\n" "${RESPONSE[@]}"
	fi
	local IFS=$OLDIFS
}

# only run if at root node with arguments
if [[ "${CALLED}" == "cmd" && "$#" -ge 1 ]]; then
	case "$1" in
		list)
			command
		;;
		*)
			chain "${@}"
		;;
	esac
fi
