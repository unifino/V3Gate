#!/bin/bash

echo ""
. ~/Documents/V3Gate/Files/VPSIPs.sh

# .. redirectcd 
cd ./DBs

# .. backup
if [[ $1 == "y" ]]
    then
    for i in *.db
        do
        mv $i ./BackUP/$i.bak
    done
    echo "Counter reset!"
    echo ""
else
    echo "Counter is running ..."
    echo ""
fi

# .. remove old files
# rm -rf *.db

# .. download DB files
    sshpass -p "'" scp -P 7333 -o StrictHostKeyChecking=no unifino@$v1:/etc/x-ui/x-ui.db ../DBs/x-ui_1.db &&
    echo "VPS1 ... Done!" &
    sshpass -p "'" scp -P 7333 -o StrictHostKeyChecking=no unifino@$v2:/etc/x-ui/x-ui.db ../DBs/x-ui_2.db &&
    echo "VPS2 ... Done!" &
    sshpass -p "'" scp -P 7333 -o StrictHostKeyChecking=no unifino@$x1:/etc/x-ui/x-ui.db ../DBs/x-ui_4.db &&
    echo "VPX1 ... Done!" &
    sshpass -p "'" scp -P 7333 -o StrictHostKeyChecking=no unifino@$x2:/etc/x-ui/x-ui.db ../DBs/x-ui_5.db &&
    echo "VPX2 ... Done!"

# .. wait until all dbs be downloaded
wait

echo ""

# .. run node
# npm run start