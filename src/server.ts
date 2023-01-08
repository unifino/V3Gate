let fs = require('fs');
const shell = require('shelljs');
const { Console } = require('console');
const { Transform } = require('stream');

import * as SQL_lite_3                  from "sqlite3"
import * as TS                          from "./types/myTypes"
import { ARGv }                         from "./ARGv"

// -- =====================================================================================

let now = new Date().getTime();
let hourFactor = 60*1000*60;
let dayFactor = hourFactor*24;

// -- =====================================================================================

let dbs = [ 'x-ui_1.db', 'x-ui_3.db', 'x-ui_4.db' ];
let refreshCmd = "~/Documents/VPS/Download.sh";
let uploadCmd = "~/Documents/VPS/Update.sh";

init();

// -- =====================================================================================

// ! MAIN ACTIONS DEFINES HERE
async function init () {

    await ARGvController();

    // await userRename( dbs, "Barani", "Fa X1" );

    // await userTimer( dbs, "Fa X1", new Date( 2023,1,5,0,0 ) )
    // .then( msg => console.log( msg ) )
    // .catch( e => console.log( "err:", e ) );

    grouper ( dbs )
    .then( groups => console.log( reporter( groups ) ) )
    .catch( e => console.log(e) );

}

// -- =====================================================================================

async function ARGvController () {

    // .. clear the terminal
    if ( ARGv.clear ) console.clear();

    // .. (Full)Refreshing Command
    if ( ARGv.refresh || ARGv.fullRefresh ) {
        let append = (ARGv.f === "Full") || ARGv.fullRefresh ? " y" : "";
        await runShellCmd( refreshCmd + append );
    }

}

// -- =====================================================================================

function info ( groups ): TS.Table {

    let table: TS.Table = [];
    let downloadAmount: number;
    let validFor: string;

    for( let group of Object.keys( groups ) ) {

        downloadAmount = 0;
        validFor = "                                ";
        validFor = "::::::::: | ::::::::::::::::::::";
        validFor = "          |                 ";

        for ( let c of groups[ group ] ) downloadAmount += c.down;
        if ( groups[ group ][0].expiry_time ) {
            validFor = ((groups[ group ][0].expiry_time-now)/dayFactor|0) + " Day(s)";
            validFor += " | " + new Date( groups[ group ][0].expiry_time )
            .toString()
            .split( " " )
            .filter( (x,i) => [1,2,4].includes(i) )
            // .. put Day at begging
            .sort( x => x.length === 2 ? -1:1 )
            .join( " " )
        }

        // .. nur Verschönerer
        if ( validFor.length === 31 ) validFor = " " + validFor;

        table.push( {
            Name: group,
            CNX: groups[ group ].length/ dbs.length,
            usage: downloadAmount,
            Traffic: (downloadAmount/1024/1024/1024).toFixed(1) + " GB",
            Valid: validFor
        } );

    }

    return table;

}

// -- =====================================================================================

async function grouper ( dbs: string[] ) {

    let db_tmp: SQL_lite_3.Database, result_tmp: TS.Users = {};

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

    let db_tmp: SQL_lite_3.Database, result_tmp: TS.Users = {};

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

    let db_tmp: SQL_lite_3.Database, result_tmp: TS.Users = {};

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

function groupName( db: SQL_lite_3.Database, container: TS.Users ): Promise<TS.Users> {

    let qry = 'select * from inbounds';
    let tmpName = "";

    return new Promise ( (rs, rx) => {

        // .. Read Query
        db.all( qry, ( e, rows:TS.CNX[] ) => {

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
        db.all( qry, ( e, rows:TS.CNX[] ) => {

            // .. loop over results
            for( let i=0; i<rows.length; i++ ) {

                tmpName = rows[i].remark.split( 'PPS' )[0].trim();

                // .. find suitable row
                if ( tmpName === oldName ) {

                    qry = "UPDATE inbounds SET remark='" +
                    rows[i].remark.replace( oldName, newName ) +
                    "' WHERE id = " + rows[i].id;

                    // .. apply rename action
                    db.all( qry, ( e, rows:TS.CNX[] ) => { if (e) rx(e) } );

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

async function runShellCmd( cmd: string ) {
    return new Promise( (rs, rx) => {
        shell.exec( cmd, async ( code, stdout, stderr ) => {
        if ( !code ) return rs( stdout );
        return rx( stderr );
        } );
    } );
}

// -- =====================================================================================

function reporter ( groups: TS.Users ) {

    let table: TS.Table = [];

    table = info ( groups );

    // .. report
    switch (ARGv.sort) {

        case "usage":
            table = table.sort( (a,b)=>a.usage>b.usage ? -1:1 );
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
    if ( !ARGv.all ) table = table.filter( x => x.usage > 10000 );

    // // .. put at Top Not activated Users
    // table.sort( a=>a.usage<100000 ? -1:1 );

    // .. remove usage column
    for ( let row of table ) delete row.usage;

    // .. report it
    return myTable( table );

}

// -- =====================================================================================

function myTable( input: []|{} ) {

    let result: string = '';
    let r: string;

    const ts = new Transform( { transform(chunk, enc, cb) { cb(null, chunk) } } );
    const logger = new Console( { stdout: ts } );

    logger.table(input);

    const table = ( ts.read() || '' ).toString();

    for ( let row of table.split(/[\r\n]+/) ) {
        r = row.replace( /[^┬]*┬/, '┌' );
        r = r.replace( /^├─*┼/, '├' );
        r = r.replace( /│[^│]*/, '' );
        r = r.replace( /^└─*┴/, '└' );
        r = r.replace( /'/g, ' ' );
        result += `${r}\n`;
    }

    return result;

}

// -- =====================================================================================

// fs.writeFile( 'xxx.json', JSON.stringify( "DATA" ), function (err) {
//     if (err) return console.log(err);
//     console.log('+ Simple : Quran > Quran.json');
// });
