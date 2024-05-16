#!/bin/bash
#NODE_OPTIONS=--max-old-space-size=8192
while :
do
	ts-node packages/backend/utils/workers.ts
done