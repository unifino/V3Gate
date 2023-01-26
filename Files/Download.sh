#!/bin/bash

echo ""

v1="23.88.42.50"
v2="162.55.209.69"
v3="65.109.7.231"
# v4="5.75.198.227"

vi="5.160.179.91"

# .. redirectcd 
cd ./db

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
rm -rf *.db

# .. download DB files
    sshpass -p "'" scp unifino@$v1:/etc/x-ui/x-ui.db ../db/x-ui_1.db &&
    echo "VPS1 ... Done!" &
    sshpass -p "'" scp unifino@$v2:/etc/x-ui/x-ui.db ../db/x-ui_2.db &&
    echo "VPS2 ... Done!" &
    sshpass -p "'" scp unifino@$v3:/etc/x-ui/x-ui.db ../db/x-ui_3.db &&
    echo "VPS3 ... Done!"
    # & sshpass -p "'" scp unifino@$v4:/etc/x-ui/x-ui.db ~/Documents/VPS/db/x-ui_4.db &&
    # echo "VPS4 ... Done!"

# .. wait until all dbs be downloaded
wait

echo ""

# .. run node
# npm run start