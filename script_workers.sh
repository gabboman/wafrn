#!/bin/bash
#NODE_OPTIONS=--max-old-space-size=8192
while :
do
	./node_modules/.bin/tsx packages/backend/utils/workers.ts
done
