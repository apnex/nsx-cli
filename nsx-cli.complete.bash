#!/bin/bash
_nsx-cli_complete() {
	## init
	local CUR PRV
	COMPREPLY=()
	CUR="${COMP_WORDS[COMP_CWORD]}"
	PRV="${COMP_WORDS[COMP_CWORD-1]}"

	## temporarily set WIDTH to 0
	local WIDTH=$(bind -v | sed -n 's/^set completion-display-width //p')
	if [[ ${WIDTH} -ne 0 ]]; then
		bind "set completion-display-width 0"
		PROMPT_COMMAND="PROMPT_COMMAND=$(printf %q "${PROMPT_COMMAND}")"
		PROMPT_COMMAND+="; bind 'set completion-display-width ${WIDTH}'"
	fi

	# bind settings
	bind "set history-preserve-point on"
	bind "set show-all-if-ambiguous on"
	bind "set show-all-if-unmodified on"
	bind "set colored-completion-prefix on"

	NC='\033[0m' # no colour
	BLACK='\033[0;30m' # black
	RED='\033[0;31m' # red
	GREEN='\033[0;32m' # green

	local ARRAY=()
	if [[ ${PRV} != "list" ]]; then
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
			printf "\n${GREEN}${HEADER}${NC}" 1>&2
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
