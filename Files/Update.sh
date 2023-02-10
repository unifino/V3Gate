#!/bin/bash

v1="91.107.192.80"
v2="65.109.229.223"
v3="5.75.178.218"
# v4="5.75.198.227"

vi="5.160.179.91"

echo ""
echo "Uploading ...."
echo ""

sshpass -p "'" scp ./db/x-ui_1.db unifino@$v1:/etc/x-ui/x-ui.db &&
echo "VPS1 ... Done!" &
sshpass -p "'" scp ./db/x-ui_2.db unifino@$v2:/etc/x-ui/x-ui.db &&
echo "VPS2 ... Done!" &
sshpass -p "'" scp ./db/x-ui_3.db unifino@$v3:/etc/x-ui/x-ui.db &&
echo "VPS3 ... Done!"
# & sshpass -p "'" scp ../db/x-ui_4.db unifino@$v4:/etc/x-ui/x-ui.db &&
# echo "VPS4 ... Done!"

wait

echo ""