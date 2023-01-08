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
// -- =====================================================================================
let dbs = ['x-ui_1.db', 'x-ui_3.db', 'x-ui_4.db'];
let refreshCmd = "~/Documents/VPS/Download.sh";
let uploadCmd = "~/Documents/VPS/Update.sh";
init();
// -- =====================================================================================
// ! MAIN ACTIONS DEFINES HERE
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        yield ARGvController();
        // await userRename( dbs, "Barani", "Fa X1" );
        // await userTimer( dbs, "Mohsen", new Date( 2023,0,25,0,0 ) )
        // .then( msg => console.log( msg ) )
        // .catch( e => console.log( "err:", e ) );
        grouper(dbs)
            .then(groups => {
            grouper(dbs.reduce((x, i) => {
                x.push(i + ".bak");
                return x;
            }, []))
                .then(oldGroup => console.log(reporter(groups, oldGroup)));
        })
            .catch(e => console.log(e));
    });
}
// -- =====================================================================================
function ARGvController() {
    return __awaiter(this, void 0, void 0, function* () {
        // .. clear the terminal
        if (ARGv_1.ARGv.clear)
            console.clear();
        // .. (Full)Refreshing Command
        if (ARGv_1.ARGv.refresh || ARGv_1.ARGv.fullRefresh) {
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
    for (let group of Object.keys(groups)) {
        downloadAmount = 0;
        validFor = "                                ";
        validFor = "::::::::: | ::::::::::::::::::::";
        validFor = "          |                 ";
        for (let c of groups[group])
            downloadAmount += c.down;
        if (groups[group][0].expiry_time) {
            validFor = ((groups[group][0].expiry_time - now) / dayFactor | 0) + " Day(s)";
            validFor += " | " + new Date(groups[group][0].expiry_time)
                .toString()
                .split(" ")
                .filter((x, i) => [1, 2, 4].includes(i))
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
            Valid: validFor
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
        let db_tmp, result_tmp = {};
        // .. loop over dbs
        for (let db of dbs) {
            // .. open db
            db_tmp = yield new SQL_lite_3.Database("../db/" + db, SQL_lite_3.OPEN_READWRITE);
            // .. modify
            yield timer(db_tmp, user, date);
        }
        // console.log( user, " is valid until ", day );
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
            let qry, tmpName;
            qry = "UPDATE inbounds SET expiry_time=" +
                date.getTime() +
                " where remark LIKE '" + user + " PPS%'";
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
        row.Diff = row.usage - oldTable.find(x => x.Name === row.Name).usage;
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
            table = table.sort((a, b) => a.Valid > b.Valid ? 1 : -1);
            break;
        default:
            console.log("Sorting is not Activated!");
            break;
    }
    // .. remove not activated users
    if (!ARGv_1.ARGv.all)
        table = table.filter(x => x.usage > 10000);
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
        x.push({ "👤": i.Name, "⛖": i.CNX, "∑": i.Traffic, "~": i.Diff, "♻": i.Valid });
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
// fs.writeFile( 'xxx.json', JSON.stringify( "DATA" ), function (err) {
//     if (err) return console.log(err);
//     console.log('+ Simple : Quran > Quran.json');
// });
//# sourceMappingURL=server.js.map