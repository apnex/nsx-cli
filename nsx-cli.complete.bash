#!/bin/bash
_nsx-cli_complete() {
	## init
	local CUR PRV
	COMPREPLY=()
	CUR="${COMP_WORDS[COMP_CWORD]}"
	PRV="${COMP_WORDS[COMP_CWORD-1]}"

	## temporary bind settings
	#local WIDTH=$(bind -v | sed -n 's/^set completion-display-width //p')
	#local POINT=$(bind -v | sed -n 's/^set history-preserve-point //p')
	#local AMBIG=$(bind -v | sed -n 's/^set show-all-if-ambiguous //p')
	#local UNMOD=$(bind -v | sed -n 's/^set show-all-if-unmodified //p')
	#local COLOR=$(bind -v | sed -n 's/^set colored-completion-prefix //p')
	bind "set completion-display-width 0"
	bind "set history-preserve-point on"
	bind "set show-all-if-ambiguous on"
	bind "set show-all-if-unmodified on"
	bind "set colored-completion-prefix on"
	#PROMPT_COMMAND="PROMPT_COMMAND=$(printf %q "${PROMPT_COMMAND}")"
	#PROMPT_COMMAND+="; bind 'set completion-display-width ${WIDTH}'"
	#PROMPT_COMMAND+="; bind 'set history-preserve-point ${POINT}'"
	#PROMPT_COMMAND+="; bind 'set show-all-if-ambiguous ${AMBIG}'"
	#PROMPT_COMMAND+="; bind 'set show-all-if-unmodified ${UNMOD}'"
	#PROMPT_COMMAND+="; bind 'set colored-completion-prefix ${COLOR}'"

	NC='\033[0m' # no colour
	BLACK='\033[0;30m' # black
	RED='\033[0;31m' # red
	GREEN='\033[0;32m' # green

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
