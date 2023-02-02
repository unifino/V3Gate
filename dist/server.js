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
// ! MAIN ACTIONS DEFINES HERE
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        yield ARGvController();
        DBs = yield DBs_Loader(dbs_name);
        yield ARGvCommandsController();
        // await userTimer( DBs, "Mojtaba", new Date( 2023,1,30,0,0 ) )
        // await resetTraffic( DBs );
        // await removeUser( DBs, "T~T" );
        // await new Promise( _ => setTimeout( _ , 500 ) );
        // await userTimer( DBs, "HashemiRad", new Date( 2023,1,29,0,0 ) )
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
            .command({
            command: 'report',
            handler: (argv) => __awaiter(this, void 0, void 0, function* () {
                let dbs_bak_name = dbs_name.reduce((x, i) => [...x, "BackUP/" + i + ".bak"], []);
                let DBs_bak = yield DBs_Loader(dbs_bak_name);
                let report = reporter(yield grouper(DBs), yield grouper(DBs_bak));
                console.log(report);
            })
        })
            .command({
            command: 'add',
            describe: "Adding a New User",
            handler: (argv) => __awaiter(this, void 0, void 0, function* () {
                if (!argv.name) {
                    console.log("Please give me a Name!! \n");
                    return;
                }
                yield refreshTable(DBs);
                yield newTempUser();
                yield userRename(DBs, "TMP", argv.name);
            })
        })
            .command({
            command: 'timer',
            describe: "Set a Time for User",
            handler: (argv) => __awaiter(this, void 0, void 0, function* () {
                if (!argv.name) {
                    console.log("Please give me the name of User';;''';'''';;''/!! \n");
                    return;
                }
                yield refreshTable(DBs);
                yield newTempUser();
                yield userRename(DBs, "TMP", argv.name);
            })
        })
            .parse();
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
        if (days < 0)
            validFor = "--------- | -----------";
        // .. nur Verschönerer
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
        // .. loop over dbs
        for (let db of DBs)
            yield groupName(db, result_tmp);
        return result_tmp;
    });
}
// -- =====================================================================================
function userRename(DBs, oldName, newName) {
    return __awaiter(this, void 0, void 0, function* () {
        let result_tmp = {};
        // .. loop over dbs
        for (let db of DBs)
            yield rename(db, oldName, newName);
        console.log(oldName, " -> ", newName);
    });
}
// -- =====================================================================================
function userTimer(DBs, user, date) {
    return __awaiter(this, void 0, void 0, function* () {
        // .. loop over dbs
        for (let db of DBs)
            yield timer(db, user, date);
        console.log(`Die Benutzer: ${user} ist bis ${date} verfügbar`);
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
        return new Promise((rs, rx) => {
            let qry;
            qry = "UPDATE inbounds SET expiry_time=" +
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
        let aPort;
        // .. Letzte ID erhalten
        let lastID = yield getLastID(DBs[0]);
        let newCNXs_count = yield getCount(db_demo);
        let myPorts = yield newPorts(DBs[0], newCNXs_count);
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
        console.log("Neue Benutzer wurden hinzugefügt");
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
        qry_1 = "CREATE TABLE `inbounds_tmp` (`id` integer,`user_id` integer,`up` integer,`down` integer,`total` integer,`remark` text,`enable` numeric,`expiry_time` integer,`listen` text,`port` integer UNIQUE,`protocol` text,`settings` text,`stream_settings` text,`tag` text UNIQUE,`sniffing` text, up_1674835094547, down_1674835094547,PRIMARY KEY (`id`))";
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
function removeUser(DBs, user) {
    return __awaiter(this, void 0, void 0, function* () {
        let qry = "DELETE FROM inbounds WHERE remark LIKE '" + user + " PPS%'";
        for (let db of DBs)
            yield syncQry(db, qry);
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
        let append = (new Date()).getTime();
        let addColumnUpQry = `ALTER TABLE inbounds ADD COLUMN up_${append}`;
        let addColumnDownQry = `ALTER TABLE inbounds ADD COLUMN down_${append}`;
        let copyQry = `UPDATE inbounds SET up_${append}=up, down_${append}=down`;
        for (let db of DBs) {
            yield syncQry(db, addColumnUpQry);
            yield syncQry(db, addColumnDownQry);
            yield syncQry(db, copyQry);
            yield syncQry(db, qry);
        }
        console.log(`All Traffics has been RESET!`);
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
// fs.writeFile( 'xxx.json', JSON.stringify( "DATA" ), function (err) {
//     if (err) return console.log(err);
//     console.log('+ Simple : Quran > Quran.json');
// });
//# sourceMappingURL=server.js.map