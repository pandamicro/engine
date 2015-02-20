#!/bin/bash
echo Run unit tests in Chrome
echo \(You may need to run gulp dev before testing.\)
echo
sh open\ in\ chrome.sh &
node test/server.js
