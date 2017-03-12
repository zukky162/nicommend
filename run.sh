#!/bin/bash
export HUBOT_SLACK_TOKEN=''
export NICONICO_ACCOUNT_MAIL=''
export NICONICO_ACCOUNT_PASSWORD=''
export NICONICO_MYLIST_ID=''
export NICONICO_MYLIST_SIZE=''
forever start -c coffee node_modules/.bin/hubot -a slack
