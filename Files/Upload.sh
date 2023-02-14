#!/bin/bash

. ~/Documents/V3Gate/Files/VPSIPs.sh

echo ""
echo "Uploading ...."
echo ""

sshpass -p "'" scp ./db/x-ui_1.db unifino@$v1:/etc/x-ui/x-ui.db &&
echo "VPS1 ... Done!" &
sshpass -p "'" scp ./db/x-ui_2.db unifino@$v2:/etc/x-ui/x-ui.db &&
echo "VPS2 ... Done!" &
sshpass -p "'" scp ./db/x-ui_3.db unifino@$v3:/etc/x-ui/x-ui.db &&
echo "VPS3 ... Done!"
sshpass -p "'" scp ./db/x-ui_4.db unifino@$v4:/etc/x-ui/x-ui.db &&
echo "VPS4 ... Done!"

wait

echo ""