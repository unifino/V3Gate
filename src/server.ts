let fs = require('fs');
const yargs = require('yargs');
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

type Table = {
    index?: number,
    Name: string,
    CNXc: number,
    usage: number,
    Traffic: string,
    Valid: string
}[]

// -- =====================================================================================

let now = new Date().getTime();
let hourFactor = 60*1000*60;
let dayFactor = hourFactor*24;

// -- =====================================================================================

let dbs = [ 'x-ui_1.db', 'x-ui_3.db', 'x-ui_4.db' ];
init();

// -- =====================================================================================

// ! MAIN ACTIONS DEFINES HERE
async function init () {

    console.clear();

    // await userRename( dbs, "Barani", "Fa X1" );

    // await userTimer( dbs, "Fa X1", new Date( 2023,1,5,0,0 ) )
    // .then( msg => console.log( msg ) )
    // .catch( e => console.log( "err:", e ) );

    const argv = yargs

    .option( 'sort', {
        alias: 's',
        description: 'Sort result by ...',
        type: [ 'Usage', 'User' ]
    } )
    .option( 'all', {
        alias: 'a',
        description: 'Report all users including not activated ones.',
        type: Boolean
    } )
    .help().alias( 'help', 'h' )
    .parse();


    info ( dbs )
    .then( groups => {

        let table: Table = [];
        let downloadAmount: number;
        let validFor: string;

        Object.keys( groups ).forEach( group => {

            downloadAmount = 0;
            validFor = "                                ";
            validFor = "::::::::: | ::::::::::::::::::::";

            for ( let c of groups[ group ] ) downloadAmount += c.down;
            if ( groups[ group ][0].expiry_time ) {
                validFor = ((groups[ group ][0].expiry_time-now)/dayFactor|0) + " Day(s)";
                validFor += " | " + new Date( groups[ group ][0].expiry_time )
                .toString()
                .split( " " )
                .filter( (x,i) => [1,2,3,4].includes(i) )
                .join( " " )
            }

            // .. nur Verschönerer
            if ( validFor.length === 31 ) validFor = " " + validFor;

            table.push( {
                Name: group,
                CNXc: groups[ group ].length/ dbs.length,
                usage: downloadAmount,
                Traffic: (downloadAmount/1024/1024/1024).toFixed(1) + " GB",
                Valid: validFor
            } );

        } );

        // .. report
        switch (argv.sort) {

            case "usage":
                table = table.sort( (a,b)=>a.usage>b.usage ? -1:1 );
                // .. put aside Not activated Users
                table.sort( a=>a.usage<100000 ? -1:1 );
                break;

            case "user":
                table = table.sort( (a,b)=>a.Name>b.Name ? 1:-1 );
                break;

            case "valid":
                table = table.sort( (a,b)=>a.Valid>b.Valid ? 1:-1 );
                break;

            default: 
                console.log( "Sorting is not Activated!" );
                break;

        }

        // .. remove not activated users
        if ( !argv.all ) table = table.filter( x => x.usage > 10000 );

        // .. remove usage column
        for ( let row of table ) delete row.usage;

        console.table( table );

    } )
    .catch( e => console.log(e) );

}

// -- =====================================================================================

async function info ( dbs: string[] ) {

    let db_tmp: SQL_lite_3.Database, result_tmp: Users = {};

    // .. loop over dbs
    for ( let db of dbs ) {
        // .. open db
        db_tmp = await new SQL_lite_3.Database( "../db/"+db, SQL_lite_3.OPEN_READWRITE );
        // .. get info
        await groupName( db_tmp, result_tmp );
    }

    return result_tmp;

}

// -- =====================================================================================

async function userRename ( dbs: string[], oldName: string, newName: string ) {

    let db_tmp: SQL_lite_3.Database, result_tmp: Users = {};

    // .. loop over dbs
    for ( let db of dbs ) {
        // .. open db
        db_tmp = await new SQL_lite_3.Database( "../db/"+db, SQL_lite_3.OPEN_READWRITE );
        // .. modify
        await rename( db_tmp, oldName, newName );
    }

    console.log( oldName, " -> ", newName );

}

// -- =====================================================================================

async function userTimer ( dbs: string[], user: string, date: Date ) {

    let db_tmp: SQL_lite_3.Database, result_tmp: Users = {};

    // .. loop over dbs
    for ( let db of dbs ) {
        // .. open db
        db_tmp = await new SQL_lite_3.Database( "../db/"+db, SQL_lite_3.OPEN_READWRITE );
        // .. modify
        await timer( db_tmp, user, date );
    }

    // console.log( user, " is valid until ", day );

}

// -- =====================================================================================

function groupName( db: SQL_lite_3.Database, container: Users ): Promise<Users> {

    let qry = 'select * from inbounds';
    let tmpName = "";

    return new Promise ( (rs, rx) => {

        // .. Read Query
        db.all( qry, ( e, rows:CNX[] ) => {

            // .. loop over results
            for( let i=0; i<rows.length; i++ ) {

                tmpName = rows[i].remark.split( 'PPS' )[0].trim();

                // .. create new user
                if ( !container[ tmpName ] ) container[ tmpName ] = [];
                // .. store download amounts in myUsers
                container[ tmpName ].push( rows[i] );

            }

            // .. report any error
            if (e) rx(e)

            // .. resolve
            rs( container );

        } );

    } );

}

// -- =====================================================================================

async function rename ( db: SQL_lite_3.Database, oldName: string, newName: string ) {

    return new Promise ( (rs, rx) => {

        let qry: string, tmpName: string;

        qry = 'select * from inbounds';

        // .. Read Query
        db.all( qry, ( e, rows:CNX[] ) => {

            // .. loop over results
            for( let i=0; i<rows.length; i++ ) {

                tmpName = rows[i].remark.split( 'PPS' )[0].trim();

                // .. find suitable row
                if ( tmpName === oldName ) {

                    qry = "UPDATE inbounds SET remark='" +
                    rows[i].remark.replace( oldName, newName ) +
                    "' WHERE id = " + rows[i].id;

                    // .. apply rename action
                    db.all( qry, ( e, rows:CNX[] ) => { if (e) rx(e) } );

                }

            }

            // .. report any error
            if (e) rx(e);

            // .. resolve
            rs( db );

        } );

    } );

}


// -- =====================================================================================

async function timer ( db: SQL_lite_3.Database, user: string, date: Date ) {

    return new Promise ( (rs, rx) => {

        let qry: string, tmpName: string;

        qry = "UPDATE inbounds SET expiry_time=" + 
            date.getTime() + 
            " where remark LIKE '" + user + " PPS%'";

            // .. Read Query
        db.all( qry, ( e ) => {

            // .. report any error
            if (e) rx(e);

            else rs( "OK? for: "  );

        } );

    } );

}

// -- =====================================================================================

// fs.writeFile( 'xxx.json', JSON.stringify( "DATA" ), function (err) {
//     if (err) return console.log(err);
//     console.log('+ Simple : Quran > Quran.json');
// });
