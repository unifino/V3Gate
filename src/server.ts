let fs = require('fs');
import * as SQL_lite_3                  from "sqlite3"

// -- =====================================================================================

type CNX = {
    id: number,
    user_id: number,
    up: number,
    down: number,
    total: number,
    remark: string,
    enable: 0|1,
    expiry_time: number,
    listen: string,
    port: number,
    protocol: 'vless'|'vmess',
    settings: { 
        clients: [ {
            id: string,
            flow: "xtls-rprx-direct" 
          }],
        decryption: "none",
        fallbacks: [] 
    },
    stream_settings: {
        network: "kcp",
        security: "none",
        kcpSettings: {
          mtu: number,
          tti: number,
          uplinkCapacity: number,
          downlinkCapacity: number,
          congestion: boolean,
          readBufferSize: number,
          writeBufferSize: number,
          header: {
            type: "none"
          },
          seed: string
        }
      },
    tag: string,
    sniffing: {
        enabled: boolean,
        destOverride: [ "http", "tls" ]
    }
}

type Users = { [key: string]: CNX[] }

// -- =====================================================================================

let now = new Date().getTime();
let hourFactor = 60*1000*60;
let dayFactor = hourFactor*24;

// -- =====================================================================================

let dbs = [ 'x-ui_1.db', 'x-ui_3.db', 'x-ui_4.db' ];

// ! MAIN ACTIONS DEFINES HERE
info ( dbs )
.then( groups => {

    let table = [];
    let downloadAmount: number;

    Object.keys( groups ).forEach( group => {

        downloadAmount = 0;
        for ( let c of groups[ group ] ) downloadAmount += c.down;

        table.push( {
            Name: group,
            CNXc: groups[ group ].length/ dbs.length,
            Traffic: (downloadAmount/1024/1024|0) + " MB"
        } );

    } );

    // .. report
    table = table.sort( (a,b)=>a.Name>b.Name ? 1:-1 );
    console.table( table.sort( a=>a.Traffic.replace( " MB", "" )<10 ? -1:1 ) );

} )
.catch( e => console.log(e) );

// -- =====================================================================================

async function info ( dbs: string[] ) {

    let db_tmp: SQL_lite_3.Database, result_tmp: Users = {};

    // .. loop over dbs
    for ( let db of dbs ) {
        db_tmp = await new SQL_lite_3.Database( "../db/"+db, SQL_lite_3.OPEN_READWRITE );
        await groupName( db_tmp, result_tmp );
    }

    return result_tmp;

}

// -- =====================================================================================

function groupName( db: any, container: Users ): Promise<Users> {

    let qry = 'select * from inbounds';
    let tmpName = "";

    return new Promise ( (rs, rx) => {

        // .. Read Query
        db.all( qry, (e, rows) => {

            // .. loop over results
            for( let i=0; i<rows.length; i++ ) {

                tmpName = rows[i].remark.split( 'PPS' )[0].trim();

                // .. create new user
                if ( !container[ tmpName ] ) container[ tmpName ] = [];
                // .. store download amounts in myUsers
                container[ tmpName ].push( rows[i] );

            }

            rs( container );

        });

    } );

}

// -- =====================================================================================


// fs.writeFile( 'xxx.json', JSON.stringify( "DATA" ), function (err) {
//     if (err) return console.log(err);
//     console.log('+ Simple : Quran > Quran.json');
// });
