const shell = require('shelljs');
const { Console } = require('console');
const { Transform } = require('stream');

import * as FS                          from "fs";
import * as SQL_lite_3                  from "sqlite3"
import * as TS                          from "./types/myTypes"
import { ARGv }                         from "./ARGv"
import { setInterval } from "timers";

// -- =====================================================================================

let now = new Date().getTime();
let hourFactor = 60*1000*60;
let dayFactor = hourFactor*24;
let dbs_name = [
    'x-ui_1.db',
    'x-ui_2.db',
    'x-ui_3.db',
    'x-ui_4.db',
    'x-ui_5.db'
];
let iDBbs = dbs_name.reduce( (x,i) => {
    x.push( Number( i.replace( 'x-ui_', '' ).replace( '.db', '' ) ) );
    return x;
}, [] );

let DBs: SQL_lite_3.Database[] = [];
let downloadCmd = "./Files/Download.sh";
let uploadCmd = "./Files/Upload.sh";

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

    .command( { command: 'tempox',
        handler: async argv => {
            // let dbs_old_name = [1].reduce( (x,i) => [ ...x, "BackUP/OLD/OLD_"+i+".db" ] ,[] );
            // let DBs_OLD = await DBs_Loader( dbs_old_name );
            // let groups = await grouper ( DBs_OLD );
            // for( let c of groups["OLD_Neda"] ) {
                // console.log(c.id);
            // let db_demo = await new SQL_lite_3.Database( "./db/BackUP/OLD/OLD_1.db", SQL_lite_3.OPEN_READWRITE );
            // for ( let i of iDBbs ) {
            //     let qry = "ATTACH DATABASE 'file:./../db/x-ui_" + i + ".db' AS db" + i;
            //     await syncQry( db_demo, qry );
            //     qry = `INSERT INTO db${i}.inbounds SELECT * FROM inbounds WHERE id=43`
            //     await syncQry( db_demo, qry );
            //     qry = `INSERT INTO db${i}.inbounds SELECT * FROM inbounds WHERE id=44`
            //     await syncQry( db_demo, qry );
            //     qry = `INSERT INTO db${i}.inbounds SELECT * FROM inbounds WHERE id=45`
            //     await syncQry( db_demo, qry );
            // }
            // }
        }
    } )

    .command( { command: 'userEdit',
        handler: async argv => {
            console.clear()
            argv.name = "OLD_Saba";
            argv.cnxID = 49;
            argv.cmd = "delete-party";
            argv.newName = "nH PPS test"
            let exData: { newName?: string } = {};
            if ( argv.newName ) exData.newName = argv.newName; 
            cnxEditor ( argv.name, argv.cnx, argv.cnxID, argv.cmd, exData );
        }
    } )

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
            if ( !argv.name && argv.all ) {
                await refreshTable( DBs );
                let groups = await grouper( DBs );
                let data = info( groups );
                for ( let x of data ) {
                    await newTempUser();
                    await userRename( DBs, "TMP", x.Name.replace( "OLD_", "" ) );
                    if ( x.Days !== null ) await userTimer( DBs, x.Name.replace( "OLD_", "" ) , x.Days );
                }
            }
            else if ( !argv.name ) console.log( "Please give me a Name!! \n" );
            else {
                await refreshTable( DBs );
                await newTempUser();
                await userRename( DBs, "TMP", argv.name );
                if ( argv.days ) userTimer( DBs, argv.name, argv.days );
            }
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
            if ( !argv.old && !argv.new && argv.all ) await userRename( DBs );
            else if ( !argv.old || !argv.new ) {
                if ( !argv.old ) console.log( "Please give me the name of User!!" );
                if ( !argv.new ) console.log( "Bitte geben Sie mir eine Name!!" );
                console.log();
            }
            else await userRename( DBs, argv.old, argv.new );
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

    .command( { command: 'spy',
        describe: 'Spion',
        handler: async argv => {
            await spy_mission( DBs, argv.name );
        }
    } )

    .command( { command: '007',
        describe: 'Spion',
        handler: async argv => {
            spy_agent();
        }
    } )

    .command( { command: 'resetIDs',
        describe: 'IDs zurücksetzen',
        handler: async argv => {
            await resetIDs( DBs );
        }
    } )

    .command( { command: 'resetTraffic',
        describe: 'IDs zurücksetzen',
        handler: async argv => {
            await resetTraffic( DBs );
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

function info ( groups: TS.Users ): TS.Table {

    let table: TS.Table = [];
    let downloadAmount: number;
    let validFor: string;
    let days: number;

    for( let group of Object.keys( groups ) ) {

        downloadAmount = 0;
        validFor = "";
        days = 0;

        for ( let c of groups[ group ] ) downloadAmount += c.down;
        downloadAmount += oldTrafficInserter( group );

        if ( groups[ group ][0].expiry_time ) {
            days = (groups[ group ][0].expiry_time-now) / dayFactor |0;
            validFor = days + "";
        }
        else days = null;

        if ( groups[ group ][0].expiry_time && groups[ group ][0].expiry_time < now )
            validFor = "---------";

        // .. nur Verschönere
        if ( validFor.length === 31 ) validFor = " " + validFor;

        for ( let entry of groups[ group ] ) if ( !entry.enable ) console.log( group );

        table.push( {
            Name: group.replace( "OLD_", ". " ),
            CNX: groups[ group ].length/ dbs_name.length,
            usage: downloadAmount,
            Traffic: (downloadAmount/1024/1024/1024).toFixed(1),
            Valid: validFor,
            Days: days,
            active: groups[ group ][0].enable === 1 ? true:false
        } );

    }

    return table;

}

// -- =====================================================================================

function oldTrafficInserter ( user: string ) {

    let myData = {
        "Rasul X08" : 7.4+11.4,
        "Rasul X09" : 1.6+10.2,
        "Rasul X10" : 6.1+25.8,
        "Sargol" : 6.1,
        "Ehsan" : 10.7+3.8,
        "HashemiRad": 6.1+1,
        "Hesam": 7.4+1.8,
        "Hosseyni": 7.3+4.3,
        "Meysam": 4+.3,
        "Mohsen": 2.9+2.1,
        "Mojtaba": 4.4+.3,
        "Mrs. Soheila": 17.1+9.5,
        "Ramin": 6.9,
        "Rasul": 3.8
    }

    return myData[ user ] ? myData[ user ] *1024*1024*1024 : 0;

}

// -- =====================================================================================

async function grouper ( DBs: SQL_lite_3.Database[] ) {

    let group: TS.Users = {};

    // .. Schleife über DBs
    for ( let db of DBs ) await groupName( db, group );

    return group;

}

// -- =====================================================================================

async function groupName ( db: SQL_lite_3.Database, container: TS.Users ): Promise<TS.Users> {

    let qry = 'select * from inbounds';
    let tmpName = "";

    let rows = await syncQry( db, qry );

    // .. loop over results
    for( let i=0; i<rows.length; i++ ) {

        tmpName = rows[i].remark.split( 'PPS' )[0].trim();

        // .. create new user
        if ( !container[ tmpName ] ) container[ tmpName ] = [];
        // .. store download amounts in myUsers
        container[ tmpName ].push( rows[i] );

    }

    return container;

}

// -- =====================================================================================

async function userRename ( DBs: SQL_lite_3.Database[], oldName?: string, newName?: string ) {

    // .. Schleife über dbs für Alle
    if ( !oldName && !newName ) {
        let groups = await grouper( DBs );
        for ( let username of Object.keys( groups ) )
            await userRename( DBs, username, "OLD_" + username );
        return;
    }

    // .. Schleife über dbs
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
    if ( !ARGv.all ) table = table.filter( x => x.active );
    if ( ARGv.sa && !ARGv.all ) table = table.filter( x => x.Diff );

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
            "": i.Name,
            // "🖥": i.CNX,
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

async function resetIDs ( DBs: SQL_lite_3.Database[] ) {

    for ( let db of DBs ) {
        let qry = "SELECT id from inbounds";
        let ids = (await syncQry( db, qry )).reduce( (x,i) => { x.push(i.id); return x } , []);
        ids = ids.sort( (a,b) => a>b ? 1:-1 );
        for ( let i=1; i<=ids.length; i++ ) {
            qry = `UPDATE inbounds SET id=${i} WHERE id=${ids[i-1]}`;
            await syncQry( db, qry );
        }
    }

    console.log( "Fertig!" );

}

// -- =====================================================================================

async function refreshTable ( DBs: SQL_lite_3.Database[] ) {

    let qry_1: string, qry_2: string, qry_3: string, qry_4: string;

    qry_1 = "CREATE TABLE `inbounds_tmp` (`id` integer,`user_id` integer,`up` integer,`down` integer,`total` integer,`remark` text,`enable` numeric,`expiry_time` integer,`listen` text,`port` integer UNIQUE,`protocol` text,`settings` text,`stream_settings` text,`tag` text UNIQUE,`sniffing` text ,PRIMARY KEY (`id`))";
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

function vlessStringify ( cnx: TS.CNX, serverName="pps.fitored.xyz" ) {

    let myCNX = "vless://";

    try { serverName = cnx.stream_settings.tlsSettings.serverName } catch {}
    try { serverName = cnx.stream_settings.xtlsSettings.serverName } catch {}

    myCNX += cnx.settings.clients[0].id + "@" + serverName + ":" + cnx.port + "?";
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

function vmessStringify ( cnx: TS.CNX, serverName="pps.fitored.site" ) {

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
        add: serverName,
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

    // .. Erhaltene Ports
    ports.push(7333,22);

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

    for ( let db of DBs ) await syncQry( db, qry );

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

async function spy_mission ( DBs: SQL_lite_3.Database[], user?: string ) {

    let qry = "SELECT * FROM inbounds"
    if ( user ) {
        qry += " WHERE remark LIKE '" + user + " PPS%'";
        await userCheck( DBs[0], user );
    }

    let answer = await syncQry ( DBs[0], qry  );
    let cmd: string;

    console.log( answer.length );
    for ( let x of answer ) {
        cmd = `sudo iptables -I INPUT -p tcp --dport ${x.port} --syn -j LOG --log-prefix "${x.remark.split( " PPS " )[0]} SPY: "`;
        runShellCmd( cmd );
        await new Promise( _ => setTimeout( _, 7 ) );
    }

}

// -- =====================================================================================

function spy_agent () {

    const lines = FS.readFileSync( "/var/log/syslog", "utf-8" ).split( "\n" );

    let exLines: string = "";

    for ( let line of lines ) {
        if ( line.includes( " SPY: " ) ) {
            exLines += line.slice(0,15) + " ";
            let tmp = line.split( " " );
            exLines += tmp.find( x => x.includes( "SRC=" ) ).replace( "SRC=", "" ) + " ";
            exLines += tmp.find( x => x.includes( "DPT=" ) ).replace( "DPT=", "" ) + " ";
            exLines += line.slice( line.indexOf("]") + 2, line.indexOf( " SPY: ") ) + "\n";
        }
    }

    if ( !FS.existsSync( "exSpy" ) ) {
        FS.createWriteStream( "exSpy" );
        console.log( "Neue exSpy Datei wird erstellt" );
    }
    FS.appendFileSync( "exSpy", exLines );
    FS.writeFileSync( "/var/log/syslog", "" );
    console.log( "Mission erfüllt." );

}

// -- =====================================================================================

async function cnxEditor (
    name: string,
    cnxN: string,
    cnxID: number,
    cmd: string,
    exData: { newName?: string }
) {

    let cnx: TS.CNX;
    let groups: TS.Users;

    if ( !name ) {
        console.log( "Pick One:", Object.keys( await grouper( DBs ) ) );
        return;
    }

    else {
        groups = await grouper( DBs );
        if ( !cnxN && !cnxID ) {
            console.log( "Which One ?\n" );
            for ( let cnx of groups[ name ] ) console.log( cnx.id, cnx.remark );
            return;
        }
        else {
            if ( cnx ) cnx = groups[ name ].find( x => x.remark === cnxN );
            else cnx = groups[ name ].find( x => x.id === cnxID );
            if ( !cmd ) console.log( cnx );
        }
    }

    switch ( cmd ) {

        case "copy": console.log( "Es wird codiert..." ); break;

        case "rename":
            if ( !exData.newName ) console.log( "Geben Sie mir eine neue Name bitte..." );
            else {
                // .. Der neuName muss " PPS " enthalten
                if ( exData.newName.includes( " PPS " ) ) {
                    let qry = `UPDATE inbounds SET remark='${exData.newName}' WHERE id=${cnx.id}`;
                    // for ( let db of DBs ) await syncQry( db, qry );
                }
                else console.log( "Der Name muss 'PPS' enthalten!" );
            }
            break;

        case "delete": console.log( "Es wird codiert..." ); break;

        case "delete-party": 
            for ( let cnx of groups[ name ] ) console.log( cnx.id, cnx.remark );
            break;

        default: console.log( "Geben Sie mir bitte eine cmd!" ); break;

    }

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