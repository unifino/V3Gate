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
const FS = require("fs");
const SQL_lite_3 = require("sqlite3");
const ARGv_1 = require("./ARGv");
// -- =====================================================================================
let now = new Date().getTime();
let hourFactor = 60 * 1000 * 60;
let dayFactor = hourFactor * 24;
let dbs_name = [
    'x-ui_1.db',
    'x-ui_2.db',
    'x-ui_3.db',
    'x-ui_4.db',
    'x-ui_5.db'
];
let iDBbs = dbs_name.reduce((x, i) => {
    x.push(Number(i.replace('x-ui_', '').replace('.db', '')));
    return x;
}, []);
let DBs = [];
let Schattendaten;
let downloadCmd = "./Files/Download.sh";
let uploadCmd = "./Files/Upload.sh";
// -- =====================================================================================
init();
// -- =====================================================================================
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        DBs = yield DBs_Loader(dbs_name);
        Schattendaten = yield grouper(DBs);
        yield ARGvController();
        yield ARGvCommandsController();
        if ((ARGv_1.ARGv.update || ARGv_1.ARGv.U) && !ARGv_1.ARGv.x)
            runShellCmd(uploadCmd);
        yield new Promise(_ => setTimeout(_, 500));
        for (let d of [...new Set(dux)])
            console.log(d);
    });
}
// -- =====================================================================================
function DBs_Loader(dbs_name) {
    return __awaiter(this, void 0, void 0, function* () {
        let db_tmp;
        let db_address;
        let myDBs = [];
        for (let db_name of dbs_name) {
            db_address = `./DBs/${db_name}`;
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
            .command({ command: 'userEdit',
            handler: (argv) => __awaiter(this, void 0, void 0, function* () {
                console.clear();
                argv.name = "OLD_Saba";
                argv.cnxID = 49;
                argv.cmd = "delete-party";
                argv.newName = "nH PPS test";
                let exData = {};
                if (argv.newName)
                    exData.newName = argv.newName;
                cnxEditor(argv.name, argv.cnx, argv.cnxID, argv.cmd, exData);
            })
        })
            .command({ command: 'report',
            handler: (argv) => __awaiter(this, void 0, void 0, function* () {
                let dbs_bak_name = dbs_name.reduce((x, i) => [...x, "BackUP/" + i + ".bak"], []);
                let DBs_bak = yield DBs_Loader(dbs_bak_name);
                let report = reporter(yield grouper(DBs), yield grouper(DBs_bak), Schattendaten);
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
            .command({ command: 'spy',
            describe: 'Spion',
            handler: (argv) => __awaiter(this, void 0, void 0, function* () {
                yield spy_mission(DBs, argv.name);
            })
        })
            .command({ command: '007',
            describe: 'Spion',
            handler: (argv) => __awaiter(this, void 0, void 0, function* () {
                spy_agent();
            })
        })
            .command({ command: 'HQ',
            describe: 'Hauptquartier',
            handler: (argv) => __awaiter(this, void 0, void 0, function* () {
                HQ(argv.name || "");
            })
        })
            .command({ command: 'resetIDs',
            describe: 'IDs zurücksetzen',
            handler: (argv) => __awaiter(this, void 0, void 0, function* () {
                yield resetIDs(DBs);
            })
        })
            .command({ command: 'resetTraffic',
            describe: 'IDs zurücksetzen',
            handler: (argv) => __awaiter(this, void 0, void 0, function* () {
                yield resetTraffic(DBs);
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
let dux = [];
function info(groups) {
    let table = [];
    let downloadAmount;
    let validFor;
    let days;
    for (let group of Object.keys(groups)) {
        downloadAmount = 0;
        validFor = "";
        days = 0;
        for (let c of groups[group])
            downloadAmount += c.down;
        downloadAmount += oldTrafficInserter(group);
        if (groups[group][0].expiry_time) {
            days = (groups[group][0].expiry_time - now) / dayFactor | 0;
            validFor = days + "";
        }
        else
            days = null;
        if (groups[group][0].expiry_time && groups[group][0].expiry_time < now)
            validFor = "---------";
        // .. nur Verschönere
        if (validFor.length === 31)
            validFor = " " + validFor;
        for (let entry of groups[group])
            if (!entry.enable)
                dux.push(group);
        table.push({
            Name: group.replace("OLD_", ". "),
            CNX: groups[group].length / dbs_name.length,
            usage: downloadAmount,
            Traffic: (downloadAmount / 1024 / 1024 / 1024).toFixed(1),
            Valid: validFor,
            Days: days,
            active: groups[group][0].enable === 1 ? true : false
        });
    }
    return table;
}
// -- =====================================================================================
function oldTrafficInserter(user) {
    let myData = {
        // "Rasul X08" : 7.4+11.4,
        // "Rasul X09" : 1.6+10.2,
        // "Rasul X10" : 6.1+25.8,
        "Rasul X08": 51.5,
        "Rasul X09": 62.5,
        "Rasul X10": 81.6,
        "Ramin": -28.3,
        "Sargol": 15.6,
        "Miramin": 8.1,
        "ASH": 109.4,
        "Mahsa": 1.7,
        "Mohaddese": .6,
        "Ali": 14.3,
        "Farhad": 2.5,
    };
    return myData[user] ? myData[user] * 1024 * 1024 * 1024 : 0;
}
// -- =====================================================================================
function grouper(DBs) {
    return __awaiter(this, void 0, void 0, function* () {
        let group = {};
        // .. Schleife über DBs
        for (let db of DBs)
            yield groupName(db, group);
        return group;
    });
}
// -- =====================================================================================
function groupName(db, container) {
    return __awaiter(this, void 0, void 0, function* () {
        let qry = 'select * from inbounds';
        let tmpName = "";
        let rows = yield syncQry(db, qry);
        // .. loop over results
        for (let i = 0; i < rows.length; i++) {
            tmpName = rows[i].remark.split('PPS')[0].trim();
            // .. create new user
            if (!container[tmpName])
                container[tmpName] = [];
            // .. store download amounts in myUsers
            container[tmpName].push(rows[i]);
        }
        return container;
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
function IranTimeZone(date, zone = "Asia/Tehran") {
    date = typeof date === "string" ? new Date(date) : date;
    return new Date(date).toLocaleString("en-US", { timeZone: zone });
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
function reporter(groups, oldGroups, Spur) {
    let table, oldTable, SpurTabelle;
    table = info(groups);
    oldTable = info(oldGroups);
    SpurTabelle = info(Spur);
    // .. Berechnung der Differenz
    for (let row of table) {
        try {
            row.Spur = row.usage - SpurTabelle.find(x => x.Name === row.Name).usage;
        }
        catch (e) {
            row.Spur = 0;
        }
        row.Spur /= 1024;
        row.Spur = row.Spur | 0;
        if (!row.Spur)
            row.Spur = "";
    }
    for (let row of table) {
        try {
            row.DDC = row.usage - oldTable.find(x => x.Name === row.Name).usage;
        }
        catch (e) {
            row.DDC = 0;
        }
        row.DDC /= 1024 * 1024;
        row.DDC = row.DDC | 0;
        if (!row.DDC)
            row.DDC = "";
    }
    // .. Warnung
    let u = ["Rasul X08", "Rasul X09", "Rasul X10"];
    let m = -20 - 20 - 20 - 20 - 45 - 120;
    for (let o of u) {
        try {
            m += Number(table.find(x => x.Name === o).Traffic);
        }
        catch (e) {
            console.log(`Keine ${o} gefunden!`);
        }
    }
    console.log(`Rasul X0x: ${m.toFixed(1)}`);
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
            table = table.sort((a, b) => a.DDC > b.DDC ? -1 : 1);
            table = table.sort((a, b) => a.Spur > b.Spur ? -1 : 1);
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
    if (!ARGv_1.ARGv.all)
        table = table.filter(x => x.active);
    if (ARGv_1.ARGv.sa && !ARGv_1.ARGv.all)
        table = table.filter(x => x.DDC || x.Spur);
    // .. remove usage column
    for (let row of table)
        delete row.usage;
    // .. report it
    return myTable(table);
}
// -- =====================================================================================
function myTable(table) {
    let s1 = ((table.reduce((x, i) => { x += Number(i.Traffic); return x; }, 0)) | 0) + " GB";
    let sx = table.reduce((x, i) => { x += i.DDC; return x; }, 0);
    let s2 = (sx > 1024 ? sx / 1024 | 0 : 0) + " GB";
    // .. reorder tha current Table
    table = table.reduce((x, i) => {
        if (i.Spur > 999)
            i.Spur = ((i.Spur / 1024).toFixed(0) + " MB");
        x.push({
            "": i.Name,
            // "🖥": i.CNX,
            ["∑: " + s1]: i.Traffic + " GB",
            ["D: " + s2]: i.DDC + (i.DDC ? " MB" : ""),
            [ARGv_1.ARGv.fullRefresh ? "⏱" : "⏲"]: i.Spur,
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
        let db_demo = yield new SQL_lite_3.Database("./DBs/BackUP/TMO.db.demo", SQL_lite_3.OPEN_READWRITE);
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
            qry = "ATTACH DATABASE 'file:./../DBs/x-ui_" + i + ".db' AS db" + i;
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
function resetIDs(DBs) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let db of DBs) {
            let qry = "SELECT id from inbounds";
            let ids = (yield syncQry(db, qry)).reduce((x, i) => { x.push(i.id); return x; }, []);
            ids = ids.sort((a, b) => a > b ? 1 : -1);
            for (let i = 1; i <= ids.length; i++) {
                qry = `UPDATE inbounds SET id=${i} WHERE id=${ids[i - 1]}`;
                yield syncQry(db, qry);
            }
        }
        console.log("Fertig!");
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
function vlessStringify(cnx, serverName = "pps.fitored.xyz") {
    let myCNX = "vless://";
    try {
        serverName = cnx.stream_settings.tlsSettings.serverName;
    }
    catch (_a) { }
    try {
        serverName = cnx.stream_settings.xtlsSettings.serverName;
    }
    catch (_b) { }
    myCNX += cnx.settings.clients[0].id + "@" + serverName + ":" + cnx.port + "?";
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
function vmessStringify(cnx, serverName = "pps.fitored.site") {
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
        add: serverName,
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
        // .. Erhaltene Ports
        ports.push(7333, 22);
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
        for (let db of DBs)
            yield syncQry(db, qry);
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
function spy_mission(DBs, user) {
    return __awaiter(this, void 0, void 0, function* () {
        let qry = "SELECT * FROM inbounds";
        if (user) {
            qry += " WHERE remark LIKE '" + user + " PPS%'";
            yield userCheck(DBs[0], user);
        }
        let answer = yield syncQry(DBs[0], qry);
        let cmd;
        console.log(answer.length);
        for (let x of answer) {
            cmd = `sudo iptables -I INPUT -p tcp --dport ${x.port} --syn -j LOG --log-prefix "${x.remark.split(" PPS ")[0]} SPY: "`;
            runShellCmd(cmd);
            yield new Promise(_ => setTimeout(_, 14));
        }
    });
}
// -- =====================================================================================
function spy_agent() {
    const lines = FS.readFileSync("/var/log/syslog", "utf-8").split("\n");
    let exLines = "";
    for (let line of lines) {
        if (line.includes(" SPY: ")) {
            exLines += line.slice(0, 15) + " ";
            let tmp = line.split(" ");
            exLines += tmp.find(x => x.includes("SRC=")).replace("SRC=", "") + " ";
            exLines += tmp.find(x => x.includes("DPT=")).replace("DPT=", "") + " ";
            exLines += line.slice(line.indexOf("]") + 2, line.indexOf(" SPY: ")) + "\n";
        }
    }
    if (!FS.existsSync("exSpy")) {
        FS.createWriteStream("exSpy");
        console.log("Neue exSpy Datei wird erstellt");
    }
    FS.appendFileSync("exSpy", exLines);
    FS.writeFileSync("/var/log/syslog", "");
    console.log("Mission erfüllt.");
}
// -- =====================================================================================
function HQ(ver) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!ver) {
            console.log("touch Report");
            for (let v of ['vps1', 'vps2', 'vps3', 'vpx1', 'vpx2'])
                console.log(v + ' "cat ~/Documents/V3Gate/exSpy" >> Report');
        }
        else {
            let lines = FS.readFileSync("./Report", "utf-8").split("\n");
            let parts;
            let ips = [];
            let user;
            for (let line of lines) {
                parts = line.split(" ");
                user = parts.slice(5).join(" ");
                if (ver === user) {
                    if (parts[1] === "21")
                        ips.push(parts.slice(3, 4).join(" "));
                }
            }
            for (let ip of new Set(ips))
                console.log(ip);
        }
    });
}
// -- =====================================================================================
function cnxEditor(name, cnxN, cnxID, cmd, exData) {
    return __awaiter(this, void 0, void 0, function* () {
        let cnx;
        let groups;
        if (!name) {
            console.log("Pick One:", Object.keys(yield grouper(DBs)));
            return;
        }
        else {
            groups = yield grouper(DBs);
            if (!cnxN && !cnxID) {
                console.log("Which One ?\n");
                for (let cnx of groups[name])
                    console.log(cnx.id, cnx.remark);
                return;
            }
            else {
                if (cnx)
                    cnx = groups[name].find(x => x.remark === cnxN);
                else
                    cnx = groups[name].find(x => x.id === cnxID);
                if (!cmd)
                    console.log(cnx);
            }
        }
        switch (cmd) {
            case "copy":
                console.log("Es wird codiert...");
                break;
            case "rename":
                if (!exData.newName)
                    console.log("Geben Sie mir eine neue Name bitte...");
                else {
                    // .. Der neuName muss " PPS " enthalten
                    if (exData.newName.includes(" PPS ")) {
                        let qry = `UPDATE inbounds SET remark='${exData.newName}' WHERE id=${cnx.id}`;
                        // for ( let db of DBs ) await syncQry( db, qry );
                    }
                    else
                        console.log("Der Name muss 'PPS' enthalten!");
                }
                break;
            case "delete":
                console.log("Es wird codiert...");
                break;
            case "delete-party":
                for (let cnx of groups[name])
                    console.log(cnx.id, cnx.remark);
                break;
            default:
                console.log("Geben Sie mir bitte eine cmd!");
                break;
        }
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