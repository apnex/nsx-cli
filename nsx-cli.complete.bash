#!/bin/bash
temp-bind() {
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
_nsx-cli_complete() {
	## init
	local CUR PRV
	COMPREPLY=()
	CUR="${COMP_WORDS[COMP_CWORD]}"
	PRV="${COMP_WORDS[COMP_CWORD-1]}"

	temp-bind
	NC='\033[0m' # no colour
	BLACK='\033[0;30m' # black
	RED='\033[0;31m' # red
	GREEN='\033[0;32m' # green
	CYAN='\033[0;36m' # cyan

	local ARRAY=()
	if [[ ${PRV} != "get" ]]; then
		local IFS=$'\n'
		if [[ ${#COMP_WORDS[@]} -ge 2 ]]; then
			ARRAY=($(nsx-cli "[]" "${COMP_WORDS[@]:1:${#COMP_WORDS[@]}-2}" 2>/dev/null | tr -d '\r')) # handle CRLF in tty
		else
			ARRAY=($(nsx-cli "[]" 2>/dev/null | tr -d '\r')) # handle CRLF in tty
		fi

		local HEADER="${ARRAY[0]}"
		local VALUES=("${ARRAY[@]:1}")
		#printf "%s\n" "[${HEADER[@]}]" | uniq 1>&2
		#printf "%s\n" "[${VALUES[@]}]" | uniq 1>&2

		local SUGGESTIONS=($(compgen -W "${VALUES[*]}" -- "${CUR}"))
		if [ "${#SUGGESTIONS[@]}" -ge "2" ]; then #print header/values
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
complete -F _nsx-cli_complete nsx-cli
