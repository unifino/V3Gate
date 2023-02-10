"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const shell = require('shelljs');
const { Console } = require('console');
const { Transform } = require('stream');
const SQL_lite_3 = require("sqlite3");
const ARGv_1 = require("./ARGv");
// -- =====================================================================================
let now = new Date().getTime();
let hourFactor = 60 * 1000 * 60;
let dayFactor = hourFactor * 24;
let dbs_name = [
    'x-ui_1.db',
    'x-ui_2.db',
    'x-ui_3.db'
];
let iDBbs = dbs_name.reduce((x, i) => {
    x.push(Number(i.replace('x-ui_', '').replace('.db', '')));
    return x;
}, []);
let DBs = [];
let downloadCmd = "./Files/Download.sh";
let uploadCmd = "./Files/Update.sh";
// -- =====================================================================================
init();
// -- =====================================================================================
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        yield ARGvController();
        DBs = yield DBs_Loader(dbs_name);
        yield ARGvCommandsController();
        if ((ARGv_1.ARGv.update || ARGv_1.ARGv.U) && !ARGv_1.ARGv.x)
            runShellCmd(uploadCmd);
    });
}
// -- =====================================================================================
function DBs_Loader(dbs_name) {
    return __awaiter(this, void 0, void 0, function* () {
        let db_tmp;
        let db_address;
        let myDBs = [];
        for (let db_name of dbs_name) {
            db_address = `./db/${db_name}`;
            db_tmp = yield new SQL_lite_3.Database(db_address, SQL_lite_3.OPEN_READWRITE);
            myDBs.push(db_tmp);
        }
        return myDBs;
    });
}
// -- =====================================================================================
function ARGvController() {
    return __awaiter(this, void 0, void 0, function* () {
        // .. clear the terminal
        if (ARGv_1.ARGv.clear)
            console.clear();
        // .. (Full)Refreshing Command
        if ((ARGv_1.ARGv.refresh || ARGv_1.ARGv.fullRefresh) && !ARGv_1.ARGv.noRefresh) {
            let append = (ARGv_1.ARGv.f === "Full") || ARGv_1.ARGv.fullRefresh ? " y" : "";
            yield runShellCmd(downloadCmd + append);
        }
        if (ARGv_1.ARGv.sa)
            ARGv_1.ARGv.sort = "activity";
        if (ARGv_1.ARGv.sc)
            ARGv_1.ARGv.sort = "usage";
        if (ARGv_1.ARGv.sv)
            ARGv_1.ARGv.sort = "valid";
        if (ARGv_1.ARGv.su)
            ARGv_1.ARGv.sort = "user";
    });
}
// -- =====================================================================================
function ARGvCommandsController() {
    return __awaiter(this, void 0, void 0, function* () {
        const ARGvs = require('yargs');
        ARGvs
            .command({ command: 'report',
            handler: (argv) => __awaiter(this, void 0, void 0, function* () {
                let dbs_bak_name = dbs_name.reduce((x, i) => [...x, "BackUP/" + i + ".bak"], []);
                let DBs_bak = yield DBs_Loader(dbs_bak_name);
                let report = reporter(yield grouper(DBs), yield grouper(DBs_bak));
                console.log(report);
            })
        })
            .command({ command: 'add',
            describe: "Adding a New User",
            handler: (argv) => __awaiter(this, void 0, void 0, function* () {
                if (!argv.name && argv.all) {
                    yield refreshTable(DBs);
                    let groups = yield grouper(DBs);
                    let data = info(groups);
                    for (let x of data) {
                        yield newTempUser();
                        yield userRename(DBs, "TMP", x.Name.replace("OLD_", ""));
                        if (x.Days !== null)
                            yield userTimer(DBs, x.Name.replace("OLD_", ""), x.Days);
                    }
                }
                else if (!argv.name)
                    console.log("Please give me a Name!! \n");
                else {
                    yield refreshTable(DBs);
                    yield newTempUser();
                    yield userRename(DBs, "TMP", argv.name);
                    if (argv.days)
                        userTimer(DBs, argv.name, argv.days);
                }
            })
        })
            .command({ command: 'timer',
            describe: "Set a Time for User",
            handler: (argv) => __awaiter(this, void 0, void 0, function* () {
                if (!argv.name || !argv.days) {
                    if (!argv.name)
                        console.log("Please give me the name of User!!");
                    if (!argv.days)
                        console.log("Bitte geben Sie mir die Zeit!!");
                    console.log();
                    return;
                }
                yield userTimer(DBs, argv.name, argv.days);
            })
        })
            .command({ command: 'rename',
            describe: 'Eine Nutzer Umbenennen!',
            handler: (argv) => __awaiter(this, void 0, void 0, function* () {
                if (!argv.old && !argv.new && argv.all)
                    yield userRename(DBs);
                else if (!argv.old || !argv.new) {
                    if (!argv.old)
                        console.log("Please give me the name of User!!");
                    if (!argv.new)
                        console.log("Bitte geben Sie mir eine Name!!");
                    console.log();
                }
                else
                    yield userRename(DBs, argv.old, argv.new);
            })
        })
            .command({ command: 'remove',
            describe: 'Eine Nutzer Löschen',
            handler: (argv) => __awaiter(this, void 0, void 0, function* () {
                yield userRemove(DBs, argv.name);
            })
        })
            .command({ command: 'connections',
            describe: 'Alle Verbindungen des Benutzers Melden',
            handler: (argv) => __awaiter(this, void 0, void 0, function* () {
                yield userConnections(DBs, argv.name);
            })
        })
            .command({ command: 'deactive',
            describe: 'Eine Nutzer Deaktivieren',
            handler: (argv) => __awaiter(this, void 0, void 0, function* () {
                yield userDeactivate(DBs, argv.name);
            })
        })
            .command({ command: 'analysis',
            describe: 'Nutzungsanalyse',
            handler: (argv) => __awaiter(this, void 0, void 0, function* () {
                yield analysis(DBs, argv.name);
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
            })
        })
            .parse();
    });
}
// -- =====================================================================================
function userCheck(db, user) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((rs, rx) => {
            let qry;
            qry = "SELECT * from inbounds WHERE remark LIKE '" + user + " PPS%'";
            db.all(qry, (e, rows) => {
                // .. report any error
                if (e)
                    rx([e, qry]);
                else
                    rows.length ? rs("Gefunden!") : rx(`Keine ${user} !!!`);
            });
        });
    });
}
// -- =====================================================================================
function info(groups, oldData) {
    let table = [];
    let downloadAmount;
    let validFor;
    let days;
    for (let group of Object.keys(groups)) {
        downloadAmount = 0;
        validFor = "                                ";
        validFor = "::::::::: | ::::::::::::::::::::";
        validFor = "          |             ";
        days = 0;
        for (let c of groups[group])
            downloadAmount += c.down;
        if (groups[group][0].expiry_time) {
            days = (groups[group][0].expiry_time - now) / dayFactor | 0;
            validFor = days + " Day(s) | ";
            validFor += new Date(groups[group][0].expiry_time).toString()
                .split(" ").filter((x, i) => iDBbs.includes(i))
                // .. put Day at begging
                .sort(x => x.length === 2 ? -1 : 1)
                .join(" ");
        }
        else
            days = null;
        if (groups[group][0].expiry_time && groups[group][0].expiry_time < now)
            validFor = "--------- | -----------";
        // .. nur Verschönere
        if (validFor.length === 31)
            validFor = " " + validFor;
        table.push({
            Name: group,
            CNX: groups[group].length / dbs_name.length,
            usage: downloadAmount,
            Traffic: (downloadAmount / 1024 / 1024 / 1024).toFixed(1) + " GB",
            Valid: validFor,
            Days: days
        });
    }
    return table;
}
// -- =====================================================================================
function grouper(DBs) {
    return __awaiter(this, void 0, void 0, function* () {
        let result_tmp = {};
        // .. Schleife über DBs
        for (let db of DBs)
            yield groupName(db, result_tmp);
        return result_tmp;
    });
}
// -- =====================================================================================
function userRename(DBs, oldName, newName) {
    return __awaiter(this, void 0, void 0, function* () {
        // .. Schleife über dbs für Alle
        if (!oldName && !newName) {
            let groups = yield grouper(DBs);
            for (let username of Object.keys(groups))
                yield userRename(DBs, username, "OLD_" + username);
            return;
        }
        // .. Schleife über dbs
        for (let db of DBs) {
            yield userCheck(db, oldName);
            yield rename(db, oldName, newName);
        }
        if (oldName !== "TMP")
            console.log(oldName, " -> ", newName);
    });
}
// -- =====================================================================================
function userTimer(DBs, user, days) {
    return __awaiter(this, void 0, void 0, function* () {
        let now = new Date().getTime();
        let later = new Date(now + (days * 24 * 60 * 60 * 1000));
        let lastTime = new Date(later.getUTCFullYear(), later.getUTCMonth(), later.getUTCDate() + 1);
        // .. loop over dbs
        for (let db of DBs)
            yield timer(db, user, lastTime);
        console.log(`Die Benutzer: ${user} ist bis ${lastTime} verfügbar`);
    });
}
// -- =====================================================================================
function groupName(db, container) {
    let qry = 'select * from inbounds';
    let tmpName = "";
    return new Promise((rs, rx) => {
        // .. Read Query
        db.all(qry, (e, rows) => {
            // .. loop over results
            for (let i = 0; i < rows.length; i++) {
                tmpName = rows[i].remark.split('PPS')[0].trim();
                // .. create new user
                if (!container[tmpName])
                    container[tmpName] = [];
                // .. store download amounts in myUsers
                container[tmpName].push(rows[i]);
            }
            // .. report any error
            if (e)
                rx(e);
            // .. resolve
            rs(container);
        });
    });
}
// -- =====================================================================================
function rename(db, oldName, newName) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((rs, rx) => {
            let qry, tmpName;
            qry = 'select * from inbounds';
            // .. Read Query
            db.all(qry, (e, rows) => {
                // .. loop over results
                for (let i = 0; i < rows.length; i++) {
                    tmpName = rows[i].remark.split('PPS')[0].trim();
                    // .. find suitable row
                    if (tmpName === oldName) {
                        qry = "UPDATE inbounds SET remark='" +
                            rows[i].remark.replace(oldName, newName) +
                            "' WHERE id = " + rows[i].id;
                        // .. apply rename action
                        db.all(qry, (e, rows) => { if (e)
                            rx(e); });
                    }
                }
                // .. report any error
                if (e)
                    rx([e, qry]);
                // .. resolve
                rs(db);
            });
        });
    });
}
// -- =====================================================================================
function timer(db, user, date) {
    return __awaiter(this, void 0, void 0, function* () {
        // .. first check the user existence
        yield userCheck(db, user);
        return new Promise((rs, rx) => {
            let qry;
            qry = "UPDATE inbounds SET enable=1, expiry_time=" +
                date.getTime() +
                " WHERE remark LIKE '" + user + " PPS%'";
            // .. Read Query
            db.all(qry, (e) => {
                // .. report any error
                if (e)
                    rx([e, qry]);
                else
                    rs("OK? for: ");
            });
        });
    });
}
// -- =====================================================================================
function reporter(groups, oldGroups) {
    let table;
    let oldTable;
    table = info(groups);
    oldTable = info(oldGroups);
    // .. Berechnung der Differenz
    for (let row of table) {
        try {
            row.Diff = row.usage - oldTable.find(x => x.Name === row.Name).usage;
        }
        catch (e) {
            row.Diff = 0;
        }
        row.Diff /= 1024 * 1024;
        row.Diff = row.Diff | 0;
        if (!row.Diff)
            row.Diff = "";
    }
    // .. report
    switch (ARGv_1.ARGv.sort) {
        case "usage":
            table = table.sort((a, b) => a.usage > b.usage ? -1 : 1);
            break;
        case "user":
            table = table.sort((a, b) => a.Name > b.Name ? 1 : -1);
            break;
        case "valid":
            table = table.sort((a, b) => a.Days > b.Days ? 1 : -1);
            table = table.sort((a, b) => a.Days === null ? -1 : 1);
            break;
        case "activity":
            table = table.sort((a, b) => a.Diff > b.Diff ? -1 : 1);
            break;
        default:
            console.log("Sorting is not Activated!");
            break;
    }
    // .. remove not activated users
    if (!ARGv_1.ARGv.all)
        table = table.filter(x => x.usage > 10000);
    if (!ARGv_1.ARGv.all)
        table = table.filter(x => x.Days >= 0);
    // .. remove usage column
    for (let row of table)
        delete row.usage;
    // .. report it
    return myTable(table);
}
// -- =====================================================================================
function myTable(table) {
    // .. reorder tha current Table
    table = table.reduce((x, i) => {
        x.push({
            "👤": i.Name,
            "🖥": i.CNX,
            "∑": i.Traffic,
            [ARGv_1.ARGv.fullRefresh ? "⏱" : "⏲"]: i.Diff,
            "♻": i.Valid
        });
        return x;
    }, []);
    let result = '';
    let r;
    const ts = new Transform({ transform(chunk, enc, cb) { cb(null, chunk); } });
    const logger = new Console({ stdout: ts });
    logger.table(table);
    const tableString = (ts.read() || '').toString();
    for (let row of tableString.split(/[\r\n]+/)) {
        r = row.replace(/[^┬]*┬/, '┌');
        r = r.replace(/^├─*┼/, '├');
        r = r.replace(/│[^│]*/, '');
        r = r.replace(/^└─*┴/, '└');
        r = r.replace(/'/g, ' ');
        result += `${r}\n`;
    }
    return result.slice(0, result.length - 2);
}
// -- =====================================================================================
function newTempUser() {
    return __awaiter(this, void 0, void 0, function* () {
        let db_demo = yield new SQL_lite_3.Database("./db/BackUP/TMO.db.demo", SQL_lite_3.OPEN_READWRITE);
        let qry;
        let CNX;
        let aPort;
        // .. Letzte ID Erhalten
        let lastID = yield getLastID(DBs[0]);
        let newCNXs_count = yield getCount(db_demo);
        // .. Neu Ports Erhalten
        let myPorts = yield newPorts(DBs[0], newCNXs_count);
        // .. IDs der Demo-Datenbank Aktualisieren
        for (let i = 1; i <= newCNXs_count; i++) {
            CNX = yield syncQry(db_demo, `SELECT * from inbounds WHERE id=${i}`);
            CNX[0].settings = JSON.parse(CNX[0].settings);
            CNX[0].settings.clients[0].id = uuid();
            aPort = myPorts.pop();
            qry = `UPDATE inbounds SET
            id=${(i + lastID)},
            port="${aPort}",
            settings='${JSON.stringify(CNX[0].settings, null, "\t")}',
            tag="inbound-${aPort}"
            WHERE id=${i}`;
            yield syncQry(db_demo, qry);
        }
        // .. BDs anhängen und Hinzufügen von Benutzern
        for (let i of iDBbs) {
            qry = "ATTACH DATABASE 'file:./../db/x-ui_" + i + ".db' AS db" + i;
            yield syncQry(db_demo, qry);
            qry = `INSERT INTO db${i}.inbounds SELECT * FROM inbounds WHERE id<=${(lastID + 19)}`;
            yield syncQry(db_demo, qry);
        }
        // .. IDs der Demo-Datenbank zurücksetzen
        for (let i = 1; i <= newCNXs_count; i++) {
            qry = "UPDATE inbounds SET id=" + i + " WHERE id=" + (i + lastID);
            yield syncQry(db_demo, qry);
        }
        console.log(`Neue TMP Benutzer: wurden hinzugefügt`);
    });
}
// -- =====================================================================================
function getLastID(db) {
    return __awaiter(this, void 0, void 0, function* () {
        let qry = "SELECT id FROM inbounds ORDER BY id DESC LIMIT 1";
        let answer = yield syncQry(db, qry);
        return answer[0].id;
    });
}
// -- =====================================================================================
function getCount(db) {
    return __awaiter(this, void 0, void 0, function* () {
        let qry = "SELECT id FROM inbounds";
        let answer = yield syncQry(db, qry);
        return answer.length;
    });
}
// -- =====================================================================================
function resetIDs(db, start, end) {
    return __awaiter(this, void 0, void 0, function* () {
        // for ( let i=start; i<=end; i++ ) {
        //     let qry = "UPDATE inbounds SET id="+ (i+start) +" WHERE id="+i;
        //     db.all( qry, e => console.log(e)  );
        // }
        return new Promise((rs, rx) => {
            //     db.all( qry, (e, rows: TS.CNX[]) => {
            //         !e ? rs(rows[0].id) : rx(e);
            //     } )
        });
    });
}
// -- =====================================================================================
function refreshTable(DBs) {
    return __awaiter(this, void 0, void 0, function* () {
        let qry_1, qry_2, qry_3, qry_4;
        qry_1 = "CREATE TABLE `inbounds_tmp` (`id` integer,`user_id` integer,`up` integer,`down` integer,`total` integer,`remark` text,`enable` numeric,`expiry_time` integer,`listen` text,`port` integer UNIQUE,`protocol` text,`settings` text,`stream_settings` text,`tag` text UNIQUE,`sniffing` text ,PRIMARY KEY (`id`))";
        qry_2 = "INSERT INTO inbounds_tmp SELECT * FROM inbounds";
        qry_3 = "DROP TABLE inbounds";
        qry_4 = "ALTER TABLE `inbounds_tmp` RENAME TO `inbounds`";
        for (let db of DBs) {
            // .. Neue Tabellen erstellen
            yield syncQry(db, qry_1);
            // .. Kopieren von Daten
            yield syncQry(db, qry_2);
            // .. Tabellen löschen
            yield syncQry(db, qry_3);
            // .. Tabellen umbenennen
            yield syncQry(db, qry_4);
        }
    });
}
// -- =====================================================================================
function userRemove(DBs, user) {
    return __awaiter(this, void 0, void 0, function* () {
        let qry = "DELETE FROM inbounds WHERE remark LIKE '" + user + " PPS%'";
        for (let db of DBs) {
            yield userCheck(db, user);
            yield syncQry(db, qry);
        }
        console.log(`Nutzer: ${user} :: wurde gelöscht!`);
    });
}
// -- =====================================================================================
function userConnections(DBs, user) {
    return __awaiter(this, void 0, void 0, function* () {
        let qry = "SELECT * FROM inbounds WHERE remark LIKE '" + user + " PPS%'";
        let entries = [];
        let connection;
        let connections = [];
        for (let db of DBs) {
            yield userCheck(db, user);
            entries.push(...yield syncQry(db, qry));
        }
        for (let entry of entries) {
            connection = connectionStringify(entry);
            // .. Nur neu Verbindungen
            if (!connections.includes(connection))
                connections.push(connection);
        }
        console.log(connections.join("\n"));
    });
}
// -- =====================================================================================
function connectionStringify(cnx) {
    // .. Zeichenfolge in JSON Analysieren
    cnx.settings = JSON.parse(cnx.settings);
    cnx.stream_settings = JSON.parse(cnx.stream_settings);
    let myCNX = null;
    if (cnx.protocol === "vmess")
        myCNX = vmessStringify(cnx);
    if (cnx.protocol === "vless")
        myCNX = vlessStringify(cnx);
    return myCNX;
}
// -- =====================================================================================
function vlessStringify(cnx) {
    let template = {
        type: cnx.stream_settings.network,
        tls: cnx.stream_settings.security
    };
    let myCNX = "vless://";
    let sn = "pps.fitored.xyz";
    try {
        sn = cnx.stream_settings.tlsSettings.serverName;
    }
    catch (_a) { }
    try {
        sn = cnx.stream_settings.xtlsSettings.serverName;
    }
    catch (_b) { }
    myCNX += cnx.settings.clients[0].id + "@" + sn + ":" + cnx.port + "?";
    myCNX += "type=" + cnx.stream_settings.network + "&";
    myCNX += "security=" + cnx.stream_settings.security + "&";
    switch (cnx.stream_settings.network) {
        case "tcp":
            if (cnx.stream_settings.security === "tls")
                myCNX += "sni=" + cnx.stream_settings.tlsSettings.serverName;
            else
                myCNX += "flow=" + cnx.settings.clients[0].flow;
            break;
        case "kcp":
            myCNX += "headerType=" + cnx.stream_settings.kcpSettings.header.type;
            myCNX += "&seed=" + cnx.stream_settings.kcpSettings.seed;
            break;
        case "ws":
            myCNX += "path=" + cnx.stream_settings.wsSettings.path;
            myCNX += "&sni=" + cnx.stream_settings.tlsSettings.serverName;
            break;
        case "quic":
            myCNX += "quicSecurity=" + cnx.stream_settings.quicSettings.security;
            myCNX += "&key=" + cnx.stream_settings.quicSettings.key;
            myCNX += "&headerType=" + cnx.stream_settings.quicSettings.header.type;
            myCNX += "&sni=" + cnx.stream_settings.tlsSettings.serverName;
            break;
        default:
            // .. wenn es nicht bekannt ist, wird NULL zurückgegeben
            return null;
    }
    return myCNX + "#" + encodeURIComponent(cnx.remark);
}
// -- =====================================================================================
function vmessStringify(cnx) {
    let type = null;
    let path = null;
    let prefix = "vmess://";
    switch (cnx.stream_settings.network) {
        case "tcp":
            path = "";
            type = cnx.stream_settings.tcpSettings.header.type;
            break;
        case "kcp":
            path = cnx.stream_settings.kcpSettings.seed;
            type = cnx.stream_settings.kcpSettings.header.type;
            break;
        case "ws":
            path = cnx.stream_settings.wsSettings.path;
            type = cnx.stream_settings.idk || "none";
            break;
        case "quic":
            path = "";
            type = cnx.stream_settings.quicSettings.header.type;
            break;
    }
    // .. wenn es nicht bekannt ist, wird NULL zurückgegeben
    if (type === null)
        return null;
    let template = {
        v: "2",
        ps: cnx.remark,
        add: "pps.fitored.site",
        port: cnx.port,
        id: cnx.settings.clients[0].id,
        aid: 0,
        net: cnx.stream_settings.network,
        type: type,
        host: cnx.stream_settings.idk || "",
        path: encodeURI(path),
        tls: cnx.stream_settings.security
    };
    return prefix + Buffer.from(JSON.stringify(template), "utf8").toString('base64');
}
// -- =====================================================================================
function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
// -- =====================================================================================
function newPorts(db, qty) {
    return __awaiter(this, void 0, void 0, function* () {
        let qry = "SELECT port FROM inbounds";
        let rows = yield syncQry(db, qry);
        let ports = rows.reduce((c, i) => { c.push(i.port); return c; }, []);
        let randPorts = [];
        let aNewPort;
        do {
            aNewPort = Math.floor(Math.random() * 65535);
            if (!ports.includes(aNewPort)) {
                ports.push(aNewPort);
                randPorts.push(aNewPort);
            }
        } while (randPorts.length < qty);
        return randPorts;
    });
}
// -- =====================================================================================
function syncQry(db, qry) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((rs, rx) => {
            db.all(qry, (e, rows) => {
                if (e) {
                    console.log(e, qry);
                    rx([e, qry]);
                }
                else
                    rs(rows);
            });
        });
    });
}
// -- =====================================================================================
function resetTraffic(DBs) {
    return __awaiter(this, void 0, void 0, function* () {
        let qry = "UPDATE inbounds SET up=0, down=0";
        // let append = ( new Date() ).getTime();
        // let addColumnUpQry = `ALTER TABLE inbounds ADD COLUMN up_${append}`;
        // let addColumnDownQry = `ALTER TABLE inbounds ADD COLUMN down_${append}`;
        // let copyQry = `UPDATE inbounds SET up_${append}=up, down_${append}=down`;
        for (let db of DBs) {
            // await syncQry( db, addColumnUpQry );
            // await syncQry( db, addColumnDownQry );
            // await syncQry( db, copyQry );
            yield syncQry(db, qry);
        }
        console.log(`All Traffics has been RESET!`);
    });
}
// -- =====================================================================================
function userDeactivate(DBs, user) {
    return __awaiter(this, void 0, void 0, function* () {
        let qry = "UPDATE inbounds SET enable=0 WHERE remark LIKE '" + user + " PPS%'";
        for (let db of DBs) {
            yield userCheck(db, user);
            yield syncQry(db, qry);
        }
        console.log(`Nutzer: ${user} :: wurde deaktiviert!`);
    });
}
// -- =====================================================================================
// let miniOutPut = [];
function analysis(DBs, user) {
    return __awaiter(this, void 0, void 0, function* () {
        let qry = "SELECT * FROM inbounds";
        if (user)
            qry += " WHERE remark LIKE '" + user + " PPS%'";
        else {
            let groups = yield grouper(DBs);
            for (let user of Object.keys(groups))
                analysis(DBs, user);
            return;
        }
        let entries = [];
        for (let db of DBs) {
            if (user)
                yield userCheck(db, user);
            entries.push(...yield syncQry(db, qry));
        }
        let sum = entries.reduce((x, i) => x + i.down, 0);
        let output = entries.reduce((x, i) => {
            if ((i.down / sum * 100) | 0) {
                let existiert = x.find(y => y[1] === i.remark);
                if (existiert)
                    existiert[0] += (i.down / sum * 100) | 0;
                else
                    x.push([((i.down / sum * 100) | 0), i.remark]);
            }
            return x;
        }, []);
        output = output.sort((a, b) => a[0] < b[0] ? 1 : -1);
        // output = output.filter( x => x[0]>10 );
        // console.log( output.reduce( (x,i) => x+=i[0], 0 ) );
        // let mot = output.reduce( (x,i) => {
        //     x.push( i[1].split( 'PPS' )[1].trim() );
        //     return x;
        // } , [] );
        // miniOutPut.push( ...mot );
        if (output.length)
            console.log(output);
    });
}
// -- =====================================================================================
function runShellCmd(cmd) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((rs, rx) => {
            shell.exec(cmd, (code, stdout, stderr) => __awaiter(this, void 0, void 0, function* () {
                if (!code)
                    return rs(stdout);
                return rx(stderr);
            }));
        });
    });
}
// -- =====================================================================================
//# sourceMappingURL=server.js.map