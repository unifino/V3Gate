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
let fs = require('fs');
const shell = require('shelljs');
const { Console } = require('console');
const { Transform } = require('stream');
const SQL_lite_3 = require("sqlite3");
const ARGv_1 = require("./ARGv");
// -- =====================================================================================
let now = new Date().getTime();
let hourFactor = 60 * 1000 * 60;
let dayFactor = hourFactor * 24;
let iDBbs = [1, 2, 3];
let dbs = [
    'x-ui_1.db',
    'x-ui_2.db',
    'x-ui_3.db'
];
let refreshCmd = "~/Documents/VPS/Download.sh";
let uploadCmd = "~/Documents/VPS/Update.sh";
// -- =====================================================================================
init();
// -- =====================================================================================
// ! MAIN ACTIONS DEFINES HERE
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        yield ARGvController();
        // await userRename( dbs, "Fa X1", "Fox X1" );
        // await userRename( dbs, "FA X2", "Fox X2" );
        // await removeUser( dbs, "T~T" );
        // await userTimer( dbs, "Hosseyni", new Date( 2023,1,22,0,0 ) )
        // refreshTable( dbs );
        // await new Promise( _ => setTimeout( _ , 500 ) );
        // await newTempUser();
        // await new Promise( _ => setTimeout( _ , 500 ) );
        // await userRename( dbs, "TMP", "Hashemi" );
        // await new Promise( _ => setTimeout( _ , 500 ) );
        // await userTimer( dbs, "Mohsen", new Date( 2023,1,25,0,0 ) )
        // await new Promise( _ => setTimeout( _ , 500 ) );
        let oldDBs = dbs.reduce((x, i) => [...x, i + ".bak"], []);
        let report = reporter(yield grouper(dbs), yield grouper(oldDBs));
        console.clear();
        console.log(report);
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
            yield runShellCmd(refreshCmd + append);
        }
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
        // .. nur Verschönerer
        if (validFor.length === 31)
            validFor = " " + validFor;
        table.push({
            Name: group,
            CNX: groups[group].length / dbs.length,
            usage: downloadAmount,
            Traffic: (downloadAmount / 1024 / 1024 / 1024).toFixed(1) + " GB",
            Valid: validFor,
            Days: days
        });
    }
    return table;
}
// -- =====================================================================================
function grouper(dbs) {
    return __awaiter(this, void 0, void 0, function* () {
        let db_tmp, result_tmp = {};
        // .. loop over dbs
        for (let db of dbs) {
            // .. open db
            db_tmp = yield new SQL_lite_3.Database("../db/" + db, SQL_lite_3.OPEN_READWRITE);
            // .. get info
            yield groupName(db_tmp, result_tmp);
        }
        return result_tmp;
    });
}
// -- =====================================================================================
function userRename(dbs, oldName, newName) {
    return __awaiter(this, void 0, void 0, function* () {
        let db_tmp, result_tmp = {};
        // .. loop over dbs
        for (let db of dbs) {
            // .. open db
            db_tmp = yield new SQL_lite_3.Database("../db/" + db, SQL_lite_3.OPEN_READWRITE);
            // .. modify
            yield rename(db_tmp, oldName, newName);
        }
        console.log(oldName, " -> ", newName);
    });
}
// -- =====================================================================================
function userTimer(dbs, user, date) {
    return __awaiter(this, void 0, void 0, function* () {
        let db_tmp;
        // .. loop over dbs
        for (let db of dbs) {
            // .. open db
            db_tmp = yield new SQL_lite_3.Database("../db/" + db, SQL_lite_3.OPEN_READWRITE);
            // .. modify
            yield timer(db_tmp, user, date);
        }
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
                    rx(e);
                // .. resolve
                rs(db);
            });
        });
    });
}
// -- =====================================================================================
function timer(db, user, date) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((rs, rx) => {
            let qry;
            qry = "UPDATE inbounds SET expiry_time=" +
                date.getTime() +
                " WHERE remark LIKE '" + user + " PPS%'";
            // .. Read Query
            db.all(qry, (e) => {
                // .. report any error
                if (e)
                    rx(e);
                else
                    rs("OK? for: ");
            });
        });
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
    return result;
}
// -- =====================================================================================
function newTempUser() {
    return __awaiter(this, void 0, void 0, function* () {
        let db_1 = yield new SQL_lite_3.Database("../db/x-ui_1.db", SQL_lite_3.OPEN_READWRITE);
        let db_demo = yield new SQL_lite_3.Database("../db/TMO.db.demo", SQL_lite_3.OPEN_READWRITE);
        let qry;
        let aPort;
        // .. Letzte ID erhalten
        let lastID = yield getLastID(db_1);
        let newCNXs_count = yield getCount(db_demo);
        let myPorts = yield newPorts(db_1, newCNXs_count);
        // .. IDs der Demo-Datenbank aktualisieren
        for (let i = 1; i <= newCNXs_count; i++) {
            aPort = myPorts.pop();
            qry = `UPDATE inbounds SET
            id=${(i + lastID)},
            port="${aPort}",
            tag="inbound-${aPort}"
            WHERE id=${i}`;
            yield syncQry(db_demo, qry);
        }
        // .. BDs anhängen und Hinzufügen von Benutzern
        for (let i of iDBbs) {
            qry = "ATTACH DATABASE 'file:./../../db/x-ui_" + i + ".db' AS db" + i;
            yield syncQry(db_demo, qry);
            qry = `INSERT INTO db${i}.inbounds SELECT * FROM inbounds WHERE id<=${(lastID + 19)}`;
            yield syncQry(db_demo, qry);
        }
        // .. IDs der Demo-Datenbank zurücksetzen
        for (let i = 1; i <= newCNXs_count; i++) {
            qry = "UPDATE inbounds SET id=" + i + " WHERE id=" + (i + lastID);
            yield syncQry(db_demo, qry);
        }
        console.log("Neue Benutzer wurden hinzugefügt");
    });
}
// -- =====================================================================================
function getLastID(db) {
    return __awaiter(this, void 0, void 0, function* () {
        let qry = "SELECT id FROM inbounds ORDER BY id DESC LIMIT 1";
        return new Promise((rs, rx) => {
            db.all(qry, (e, rows) => {
                !e ? rs(rows[0].id) : rx(e);
            });
        });
    });
}
// -- =====================================================================================
function getCount(db) {
    return __awaiter(this, void 0, void 0, function* () {
        let qry = "SELECT id FROM inbounds";
        return new Promise((rs, rx) => {
            db.all(qry, (e, rows) => {
                !e ? rs(rows.length) : rx(e);
            });
        });
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
function refreshTable(dbs) {
    return __awaiter(this, void 0, void 0, function* () {
        let qry_1, qry_2, qry_3, qry_4;
        let db_tmp;
        qry_1 = "CREATE TABLE `inbounds_tmp` (`id` integer,`user_id` integer,`up` integer,`down` integer,`total` integer,`remark` text,`enable` numeric,`expiry_time` integer,`listen` text,`port` integer UNIQUE,`protocol` text,`settings` text,`stream_settings` text,`tag` text UNIQUE,`sniffing` text,PRIMARY KEY (`id`))";
        qry_2 = "INSERT INTO inbounds_tmp SELECT * FROM inbounds";
        qry_3 = "DROP TABLE inbounds";
        qry_4 = "ALTER TABLE `inbounds_tmp` RENAME TO `inbounds`";
        for (let db of dbs) {
            db_tmp = yield new SQL_lite_3.Database("../db/" + db, SQL_lite_3.OPEN_READWRITE);
            // .. Neue Tabellen erstellen
            yield syncQry(db_tmp, qry_1);
            // .. Kopieren von Daten
            yield syncQry(db_tmp, qry_2);
            // .. Tabellen löschen
            yield syncQry(db_tmp, qry_3);
            // .. Tabellen umbenennen
            yield syncQry(db_tmp, qry_4);
        }
    });
}
// -- =====================================================================================
function removeUser(dbs, user) {
    return __awaiter(this, void 0, void 0, function* () {
        let qry = "DELETE FROM inbounds WHERE remark LIKE '" + user + " PPS%'";
        let db_tmp;
        for (let db of dbs) {
            db_tmp = yield new SQL_lite_3.Database("../db/" + db, SQL_lite_3.OPEN_READWRITE);
            yield syncQry(db_tmp, qry);
        }
        console.log(`Nutzer: ${user} :: wurde gelöscht!`);
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
                    rx(e);
                    console.log(e);
                }
                else
                    rs(rows);
            });
        });
    });
}
// -- =====================================================================================
// fs.writeFile( 'xxx.json', JSON.stringify( "DATA" ), function (err) {
//     if (err) return console.log(err);
//     console.log('+ Simple : Quran > Quran.json');
// });
//# sourceMappingURL=server.js.map