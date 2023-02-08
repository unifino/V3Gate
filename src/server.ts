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
let dbs_name = [
    'x-ui_1.db',
    'x-ui_2.db',
    'x-ui_3.db'
];
let iDBbs = dbs_name.reduce( (x,i) => {
    x.push( Number( i.replace( 'x-ui_', '' ).replace( '.db', '' ) ) );
    return x;
}, [] );

let DBs: SQL_lite_3.Database[] = [];
let downloadCmd = "./Files/Download.sh";
let uploadCmd = "./Files/Update.sh";

// -- =====================================================================================

init();

// -- =====================================================================================

async function init () {

    await ARGvController();

    DBs = await DBs_Loader( dbs_name );

    await ARGvCommandsController();

    if ( ( ARGv.update || ARGv.U ) && !ARGv.x ) runShellCmd( uploadCmd );

}

// -- =====================================================================================

async function DBs_Loader ( dbs_name: string[] ): Promise<SQL_lite_3.Database[]> {

    let db_tmp: SQL_lite_3.Database;
    let db_address: string;
    let myDBs: SQL_lite_3.Database[] = [];

    for ( let db_name of dbs_name ) {
        db_address = `./db/${db_name}`;
        db_tmp = await new SQL_lite_3.Database( db_address, SQL_lite_3.OPEN_READWRITE );
        myDBs.push ( db_tmp );
    }

    return myDBs;

}

// -- =====================================================================================

async function ARGvController () {

    // .. clear the terminal
    if ( ARGv.clear ) console.clear();

    // .. (Full)Refreshing Command
    if ( (ARGv.refresh || ARGv.fullRefresh) && !ARGv.noRefresh ) {
        let append = (ARGv.f === "Full") || ARGv.fullRefresh ? " y" : "";
        await runShellCmd( downloadCmd + append );
    }

    if ( ARGv.sa ) ARGv.sort = "activity";
    if ( ARGv.sc ) ARGv.sort = "usage";
    if ( ARGv.sv ) ARGv.sort = "valid";
    if ( ARGv.su ) ARGv.sort = "user";

}

// -- =====================================================================================

async function ARGvCommandsController () {

    const ARGvs = require('yargs');

    ARGvs

    .command( { command: 'report',
        handler: async argv => {
            let dbs_bak_name = dbs_name.reduce( (x,i) => [ ...x, "BackUP/"+i+".bak" ] ,[] );
            let DBs_bak = await DBs_Loader( dbs_bak_name );
            let report = reporter( await grouper ( DBs ), await grouper ( DBs_bak ) );
            console.log(report);
        }
    } )

    .command( { command: 'add',
        describe: "Adding a New User",
        handler: async argv => {
            if ( !argv.name ) {
                console.log( "Please give me a Name!! \n" );
                return;
            }
            await refreshTable( DBs );
            await newTempUser();
            await userRename( DBs, "TMP", argv.name );
            if ( argv.days ) userTimer( DBs, argv.name, argv.days );
        }
    } )

    .command( { command: 'timer',
        describe: "Set a Time for User",
        handler: async argv => {
            if ( !argv.name || !argv.days ) {
                if ( !argv.name ) console.log( "Please give me the name of User!!" );
                if ( !argv.days ) console.log( "Bitte geben Sie mir die Zeit!!" );
                console.log();
                return;
            }
            await userTimer( DBs, argv.name, argv.days );
        }
    } )

    .command( { command: 'rename',
        describe: 'Eine Nutzer Umbenennen!',
        handler: async argv => {
            if ( !argv.old || !argv.new ) {
                if ( !argv.old ) console.log( "Please give me the name of User!!" );
                if ( !argv.new ) console.log( "Bitte geben Sie mir eine Name!!" );
                console.log();
                return;
            }
            await userRename( DBs, argv.old, argv.new );
        }
    } )

    .command( { command: 'remove',
        describe: 'Eine Nutzer Löschen',
        handler: async argv => {
            await userRemove( DBs, argv.name )
        }
    } )

    .command( { command: 'connections',
        describe: 'Alle Verbindungen des Benutzers Melden',
        handler: async argv => {
            await userConnections( DBs, argv.name )
        }
    } )

    .command( { command: 'deactive',
        describe: 'Eine Nutzer Deaktivieren',
        handler: async argv => {
            await userDeactivate( DBs, argv.name )
        }
    } )

    .command( { command: 'analysis',
        describe: 'Nutzungsanalyse',
        handler: async argv => {
            await analysis( DBs, argv.name );
            // await new Promise( _ => setTimeout( _, 500 ) );
            // console.log( 
            //     [ ...new Set( miniOutPut ) ]
            //     .filter( 
            //         x => x!=="Fast" &&
            //         x!=="Fast 2" &&
            //         x!=="🛡 1" &&
            //         x!=="🛡 2" &&
            //         x!=="🛡 3" &&
            //         x!=="🛡 4"
            //     )
            //     .sort( (a,b) => a>b ? 1:-1 ) 
            // );
        }
    } )

    .parse();

}

// -- =====================================================================================

async function userCheck ( db: SQL_lite_3.Database, user: string ) {

    return new Promise ( (rs, rx) => { 

        let qry: string;

        qry = "SELECT * from inbounds WHERE remark LIKE '" + user + " PPS%'";

        db.all( qry, ( e, rows ) => {
            // .. report any error
            if (e) rx([e,qry]);
            else rows.length ? rs( "Gefunden!") : rx( `Keine ${user} !!!` );
        } )

    } )

}

// -- =====================================================================================

function info ( groups: TS.Users, oldData?: TS.Users ): TS.Table {

    let table: TS.Table = [];
    let downloadAmount: number;
    let validFor: string;
    let days: number;

    for( let group of Object.keys( groups ) ) {

        downloadAmount = 0;
        validFor = "                                ";
        validFor = "::::::::: | ::::::::::::::::::::";
        validFor = "          |             ";
        days = 0;

        for ( let c of groups[ group ] ) downloadAmount += c.down;
        if ( groups[ group ][0].expiry_time ) {
            days = (groups[ group ][0].expiry_time-now) / dayFactor |0;
            validFor = days + " Day(s) | ";
            validFor += new Date( groups[ group ][0].expiry_time ).toString()
            .split( " " ).filter( (x,i) => iDBbs.includes(i) )
            // .. put Day at begging
            .sort( x => x.length === 2 ? -1:1 )
            .join( " " )
        }
        else days = null;

        if ( groups[ group ][0].expiry_time && groups[ group ][0].expiry_time < now )
            validFor = "--------- | -----------";

        // .. nur Verschönere
        if ( validFor.length === 31 ) validFor = " " + validFor;

        table.push( {
            Name: group,
            CNX: groups[ group ].length/ dbs_name.length,
            usage: downloadAmount,
            Traffic: (downloadAmount/1024/1024/1024).toFixed(1) + " GB",
            Valid: validFor,
            Days: days
        } );

    }

    return table;

}

// -- =====================================================================================

async function grouper ( DBs: SQL_lite_3.Database[] ) {

    let result_tmp: TS.Users = {};

    // .. Schleife über DBs
    for ( let db of DBs ) await groupName( db, result_tmp );

    return result_tmp;

}

// -- =====================================================================================

async function userRename ( DBs: SQL_lite_3.Database[], oldName: string, newName: string ) {

    // .. loop over dbs
    for ( let db of DBs ) {
        await userCheck( db, oldName );
        await rename( db, oldName, newName );
    }

    if ( oldName !== "TMP" ) console.log( oldName, " -> ", newName );

}

// -- =====================================================================================

async function userTimer ( DBs: SQL_lite_3.Database[], user: string, days: number ) {

    let now = new Date().getTime();
    let later = new Date( now + ( days *24*60*60*1000 ) );

    let lastTime = new Date(
        later.getUTCFullYear(),
        later.getUTCMonth(),
        later.getUTCDate()+1,
    )

    // .. loop over dbs
    for ( let db of DBs ) await timer( db, user, lastTime );

    console.log( `Die Benutzer: ${user} ist bis ${lastTime} verfügbar` );

}

// -- =====================================================================================

function groupName ( db: SQL_lite_3.Database, container: TS.Users ): Promise<TS.Users> {

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
            if (e) rx([e,qry]);

            // .. resolve
            rs( db );

        } );

    } );

}

// -- =====================================================================================

async function timer ( db: SQL_lite_3.Database, user: string, date: Date ) {

    // .. first check the user existence
    await userCheck( db, user );

    return new Promise ( (rs, rx) => {

        let qry: string;

        qry = "UPDATE inbounds SET enable=1, expiry_time=" +
            date.getTime() +
            " WHERE remark LIKE '" + user + " PPS%'";

        // .. Read Query
        db.all( qry, ( e ) => {

            // .. report any error
            if (e) rx([e,qry]);

            else rs( "OK? for: "  );

        } );

    } );

}

// -- =====================================================================================

function reporter ( groups: TS.Users, oldGroups: TS.Users ) {

    let table: TS.Table;
    let oldTable: TS.Table;

    table = info ( groups );
    oldTable = info ( oldGroups );

    // .. Berechnung der Differenz
    for ( let row of table ) {
        try {
            row.Diff = row.usage - oldTable.find( x => x.Name === row.Name ).usage;
        }  catch (e) { row.Diff = 0; }
        row.Diff /= 1024*1024;
        row.Diff = row.Diff | 0;
        if ( !row.Diff ) row.Diff = <any>"";
    }

    // .. report
    switch (ARGv.sort) {

        case "usage":
            table = table.sort( (a,b)=>a.usage>b.usage ? -1:1 );
            break;

        case "user":
            table = table.sort( (a,b)=>a.Name>b.Name ? 1:-1 );
            break;

        case "valid":
            table = table.sort( (a,b)=> a.Days > b.Days ? 1:-1 );
            table = table.sort( (a,b)=> a.Days === null ? -1:1 );
            break;

        case "activity":
            table = table.sort( (a,b)=> a.Diff > b.Diff ? -1:1 );
            break;

        default: 
            console.log( "Sorting is not Activated!" );
            break;

    }

    // .. remove not activated users
    if ( !ARGv.all ) table = table.filter( x => x.usage > 10000 );
    if ( !ARGv.all ) table = table.filter( x => x.Days >= 0 );

    // .. remove usage column
    for ( let row of table ) delete row.usage;

    // .. report it
    return myTable( table );

}

// -- =====================================================================================

function myTable ( table: TS.Table ) {

    // .. reorder tha current Table
    table = table.reduce( (x,i) => {
        x.push( {
            "👤": i.Name,
            "🖥": i.CNX,
            "∑": i.Traffic,
            [ ARGv.fullRefresh ? "⏱" : "⏲" ]: i.Diff,
            "♻": i.Valid
        } )
        return x;
    }, [] );

    let result: string = '';
    let r: string;

    const ts = new Transform( { transform(chunk, enc, cb) { cb(null, chunk) } } );
    const logger = new Console( { stdout: ts } );

    logger.table(table);

    const tableString = ( ts.read() || '' ).toString();

    for ( let row of tableString.split(/[\r\n]+/) ) {
        r = row.replace( /[^┬]*┬/, '┌' );
        r = r.replace( /^├─*┼/, '├' );
        r = r.replace( /│[^│]*/, '' );
        r = r.replace( /^└─*┴/, '└' );
        r = r.replace( /'/g, ' ' );
        result += `${r}\n`;
    }

    return result.slice( 0, result.length-2 );

}

// -- =====================================================================================

async function newTempUser () {

    let db_demo = await new SQL_lite_3.Database( "./db/BackUP/TMO.db.demo", SQL_lite_3.OPEN_READWRITE );
    let qry:string;
    let CNX: TS.CNX[];
    let aPort: number;

    // .. Letzte ID Erhalten
    let lastID = await getLastID( DBs[0] );
    let newCNXs_count = await getCount( db_demo );

    // .. Neu Ports Erhalten
    let myPorts = await newPorts( DBs[0], newCNXs_count );

    // .. IDs der Demo-Datenbank Aktualisieren
    for ( let i=1;i<=newCNXs_count;i++ ) {
        CNX = await syncQry( db_demo, `SELECT * from inbounds WHERE id=${i}` );
        CNX[0].settings = JSON.parse( CNX[0].settings as any );
        CNX[0].settings.clients[0].id = uuid();
        aPort = myPorts.pop();
        qry = `UPDATE inbounds SET
            id=${(i+lastID)},
            port="${aPort}",
            settings='${JSON.stringify( CNX[0].settings, null, "\t" )}',
            tag="inbound-${aPort}"
            WHERE id=${i}`;
        await syncQry( db_demo, qry );
    }

    // .. BDs anhängen und Hinzufügen von Benutzern
    for ( let i of iDBbs ) {
        qry = "ATTACH DATABASE 'file:./../db/x-ui_" + i + ".db' AS db" + i;
        await syncQry( db_demo, qry );
        qry = `INSERT INTO db${i}.inbounds SELECT * FROM inbounds WHERE id<=${(lastID+19)}`
        await syncQry( db_demo, qry );
    }

    // .. IDs der Demo-Datenbank zurücksetzen
    for ( let i=1;i<=newCNXs_count;i++ ) {
        qry = "UPDATE inbounds SET id="+ i +" WHERE id="+(i+lastID);
        await syncQry( db_demo, qry );
    }

    console.log( `Neue TMP Benutzer: wurden hinzugefügt` );

}

// -- =====================================================================================

async function getLastID ( db: SQL_lite_3.Database ): Promise<number>{

    let qry = "SELECT id FROM inbounds ORDER BY id DESC LIMIT 1";

    let answer = await syncQry ( db, qry  )

    return answer[0].id;

}

// -- =====================================================================================

async function getCount ( db: SQL_lite_3.Database ): Promise<number>{

    let qry = "SELECT id FROM inbounds";

    let answer = await syncQry ( db, qry  )

    return answer.length;

}

// -- =====================================================================================

async function resetIDs ( db: SQL_lite_3.Database, start: number, end: number ): Promise<number>{

    // for ( let i=start; i<=end; i++ ) {
    //     let qry = "UPDATE inbounds SET id="+ (i+start) +" WHERE id="+i;
    //     db.all( qry, e => console.log(e)  );

    // }

    return new Promise( (rs, rx) => {
    //     db.all( qry, (e, rows: TS.CNX[]) => {
    //         !e ? rs(rows[0].id) : rx(e);
    //     } )
    } )

}

// -- =====================================================================================

async function refreshTable ( DBs: SQL_lite_3.Database[] ) {

    let qry_1: string, qry_2: string, qry_3: string, qry_4: string;

    qry_1 = "CREATE TABLE `inbounds_tmp` (`id` integer,`user_id` integer,`up` integer,`down` integer,`total` integer,`remark` text,`enable` numeric,`expiry_time` integer,`listen` text,`port` integer UNIQUE,`protocol` text,`settings` text,`stream_settings` text,`tag` text UNIQUE,`sniffing` text, up_1674835094547, down_1674835094547,PRIMARY KEY (`id`))";
    qry_2 = "INSERT INTO inbounds_tmp SELECT * FROM inbounds";
    qry_3 = "DROP TABLE inbounds";
    qry_4 = "ALTER TABLE `inbounds_tmp` RENAME TO `inbounds`";

    for ( let db of DBs ) {
        // .. Neue Tabellen erstellen
        await syncQry ( db, qry_1 );
        // .. Kopieren von Daten
        await syncQry ( db, qry_2 );
        // .. Tabellen löschen
        await syncQry ( db, qry_3 );
        // .. Tabellen umbenennen
        await syncQry ( db, qry_4 );
    }

}

// -- =====================================================================================

async function userRemove ( DBs: SQL_lite_3.Database[], user: string ) {

    let qry = "DELETE FROM inbounds WHERE remark LIKE '" + user + " PPS%'";

    for ( let db of DBs ) {
        await userCheck( db, user );
        await syncQry( db, qry );
    }

    console.log( `Nutzer: ${user} :: wurde gelöscht!` );

}

// -- =====================================================================================

async function userConnections ( DBs: SQL_lite_3.Database[], user: string ) {

    let qry = "SELECT * FROM inbounds WHERE remark LIKE '" + user + " PPS%'";
    let entries: TS.CNX[] = [];
    let connection: string;
    let connections: string[] = [];

    for ( let db of DBs ) {
        await userCheck( db, user );
        entries.push( ...await syncQry( db, qry ) );
    }

    for ( let entry of entries ) {
        connection = connectionStringify( entry );
        // .. Nur neu Verbindungen
        if ( !connections.includes( connection ) ) connections.push( connection );
    }

    console.log( connections.join( "\n" ) );

}

// -- =====================================================================================

function connectionStringify ( cnx: TS.CNX ) {

    // .. Zeichenfolge in JSON Analysieren
    cnx.settings = JSON.parse( cnx.settings as any );
    cnx.stream_settings = JSON.parse( cnx.stream_settings as any );

    let myCNX: string = null;

    if ( cnx.protocol === "vmess" ) myCNX = vmessStringify( cnx );
    if ( cnx.protocol === "vless" ) myCNX = vlessStringify( cnx );

    return myCNX;

}

// -- =====================================================================================

function vlessStringify ( cnx: TS.CNX ) {

    let template = {
        type: cnx.stream_settings.network,
        tls: cnx.stream_settings.security
    }

    let myCNX = "vless://";

    let sn = "pps.fitored.xyz";
    try { sn = cnx.stream_settings.tlsSettings.serverName } catch {}
    try { sn = cnx.stream_settings.xtlsSettings.serverName } catch {}

    myCNX += cnx.settings.clients[0].id + "@" + sn + ":" + cnx.port + "?";
    myCNX += "type=" + cnx.stream_settings.network + "&";
    myCNX += "security=" + cnx.stream_settings.security + "&";

    switch ( cnx.stream_settings.network ) {

        case "tcp"  :
            if ( cnx.stream_settings.security === "tls" ) 
                myCNX += "sni=" + cnx.stream_settings.tlsSettings.serverName;
            else 
                myCNX += "flow=" + cnx.settings.clients[0].flow;
            break;

        case "kcp"  :
            myCNX += "headerType=" + cnx.stream_settings.kcpSettings.header.type;
            myCNX += "&seed=" + cnx.stream_settings.kcpSettings.seed;
            break;

        case "ws"   :
            myCNX += "path=" + cnx.stream_settings.wsSettings.path;
            myCNX += "&sni=" + cnx.stream_settings.tlsSettings.serverName;
            break;

        case "quic" :
            myCNX += "quicSecurity=" + cnx.stream_settings.quicSettings.security;
            myCNX += "&key=" + cnx.stream_settings.quicSettings.key;
            myCNX += "&headerType=" + cnx.stream_settings.quicSettings.header.type;
            myCNX += "&sni=" + cnx.stream_settings.tlsSettings.serverName;
            break;

        default:
            // .. wenn es nicht bekannt ist, wird NULL zurückgegeben
            return null;

    }

    return myCNX + "#" + encodeURIComponent( cnx.remark );

}

// -- =====================================================================================

function vmessStringify ( cnx: TS.CNX ) {

    let type: string = null;
    let path: string = null;
    let prefix = "vmess://";

    switch ( cnx.stream_settings.network ) {

        case "tcp"  :
            path = "";
            type = cnx.stream_settings.tcpSettings.header.type;
            break;

        case "kcp"  :
            path = cnx.stream_settings.kcpSettings.seed;
            type = cnx.stream_settings.kcpSettings.header.type;
            break;

        case "ws"   :
            path = cnx.stream_settings.wsSettings.path;
            type = cnx.stream_settings.idk || "none";
            break;

        case "quic" :
            path = "";
            type = cnx.stream_settings.quicSettings.header.type;
            break;

    }

    // .. wenn es nicht bekannt ist, wird NULL zurückgegeben
    if ( type === null ) return null;
 
    let template = {
        v: "2",
        ps: cnx.remark,
        add: "pps.fitored.xyz",
        port: cnx.port,
        id: cnx.settings.clients[0].id,
        aid: 0,
        net: cnx.stream_settings.network,
        type: type,
        host: cnx.stream_settings.idk || "",
        path: encodeURI( path ),
        tls: cnx.stream_settings.security
    }

    return prefix + Buffer.from( JSON.stringify( template ), "utf8" ).toString( 'base64' );

}

// -- =====================================================================================

function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, c => {
        let r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    } );
}

// -- =====================================================================================

async function newPorts ( db: SQL_lite_3.Database, qty: number ): Promise<number[]> {

    let qry = "SELECT port FROM inbounds";
    let rows = await syncQry( db, qry );
    let ports: number[] = rows.reduce( (c,i) => { c.push(i.port); return c; }, [] );
    let randPorts: number[] = [];
    let aNewPort: number;

    do {
        aNewPort = Math.floor( Math.random() * 65535 );
        if ( !ports.includes( aNewPort ) ) {
            ports.push( aNewPort );
            randPorts.push( aNewPort );
        }
    }
    while ( randPorts.length < qty )

    return randPorts;

}

// -- =====================================================================================

async function syncQry ( db: SQL_lite_3.Database, qry: string ): Promise<TS.CNX[]> {
    return new Promise( (rs, rx) => {
        db.all( qry, (e, rows:TS.CNX[]) => {
            if (e) {
                console.log(e, qry);
                rx([e, qry]);
            }
            else rs( rows )
        } );
    } );
}

// -- =====================================================================================

async function resetTraffic ( DBs: SQL_lite_3.Database[] ) {

    let qry = "UPDATE inbounds SET up=0, down=0";
    let append = ( new Date() ).getTime();
    let addColumnUpQry = `ALTER TABLE inbounds ADD COLUMN up_${append}`;
    let addColumnDownQry = `ALTER TABLE inbounds ADD COLUMN down_${append}`;
    let copyQry = `UPDATE inbounds SET up_${append}=up, down_${append}=down`;

    for ( let db of DBs ) {
        await syncQry( db, addColumnUpQry );
        await syncQry( db, addColumnDownQry );
        await syncQry( db, copyQry );
        await syncQry( db, qry );
    }

    console.log( `All Traffics has been RESET!` );

}

// -- =====================================================================================

async function userDeactivate ( DBs: SQL_lite_3.Database[], user: string ) {

    let qry = "UPDATE inbounds SET enable=0 WHERE remark LIKE '" + user + " PPS%'";

    for ( let db of DBs ) {
        await userCheck( db, user );
        await syncQry( db, qry );
    }

    console.log( `Nutzer: ${user} :: wurde deaktiviert!` );

}

// -- =====================================================================================

// let miniOutPut = [];
async function analysis  ( DBs: SQL_lite_3.Database[], user?: string ) {

    let qry = "SELECT * FROM inbounds";
    if ( user ) qry +=  " WHERE remark LIKE '" + user + " PPS%'";
    else {
        let groups = await grouper( DBs );
        for ( let user of Object.keys( groups ) ) analysis( DBs, user );
        return;
    }

    let entries: TS.CNX[] = [];

    for ( let db of DBs ) {
        if ( user ) await userCheck( db, user );
        entries.push( ...await syncQry( db, qry ) );
    }

    let sum = entries.reduce( (x,i) => x + i.down, 0 );

    let output = entries.reduce( (x,i) => {
        if ( (i.down/sum*100) | 0 ) {
            let existiert = x.find( y => y[1] === i.remark );
            if ( existiert ) existiert[0] += (i.down/sum*100) | 0;
            else x.push( [ ( (i.down/sum*100) | 0 ), i.remark ] )
        }
        return x;
    }, [] );

    output = output.sort( (a,b) => a[0]<b[0] ? 1:-1 );
    // output = output.filter( x => x[0]>10 );
    // console.log( output.reduce( (x,i) => x+=i[0], 0 ) );

    // let mot = output.reduce( (x,i) => {
    //     x.push( i[1].split( 'PPS' )[1].trim() );
    //     return x;
    // } , [] );
    // miniOutPut.push( ...mot );

    if ( output.length ) console.log( output );

}

// -- =====================================================================================

async function runShellCmd ( cmd: string ) {
    return new Promise( (rs, rx) => {
        shell.exec( cmd, async ( code, stdout, stderr ) => {
        if ( !code ) return rs( stdout );
        return rx( stderr );
        } );
    } );
}

// -- =====================================================================================