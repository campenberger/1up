#!/bin/sh
cd /svc
if [ "$1" = "run" ]; then
	shift
	if [ -z "$APP_USER_ID" -o -z "$CLIENT_ID" -o -z "$CLIENT_SECRET" ]; then
		echo "Not all mandatory variables (APP_USER_ID, CLIENT_ID, or CLIENT_SECRET) are set"
		exit 2
	else
		exec node ./build/start.js $@
	fi
else
	exec $@
fi
