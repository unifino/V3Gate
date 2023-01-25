"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ARGv = void 0;
const ARGvs = require('yargs');
exports.ARGv = ARGvs
    .command({
    command: 'add',
    describe: "Adding a Note",
    builder: {
        title: {
            describe: 'Note Title'
        }
    },
    handler: function (argv) {
        console.log("\n Adding a New Note! ", argv.title);
    }
})
    .option('clear', {
    alias: 'c',
    description: 'Clear Terminal',
    type: Boolean
})
    .option('sort', {
    alias: 's',
    description: 'Sort result by ...',
    type: ['Usage', 'User', 'valid']
})
    .option('all', {
    alias: 'a',
    description: 'Report all users including not activated ones.',
    type: Boolean
})
    .option('refresh', {
    alias: 'f',
    description: 'Refreshing DBs',
    type: ["justDBs", "Full"]
})
    .option('fullRefresh', {
    alias: 'F',
    description: 'Refreshing DBs including BackedUp ones',
    type: Boolean
})
    .option('noRefresh', {
    alias: 'x',
    description: 'Refuse to Refreshing DBs',
    type: Boolean
})
    .help().alias('help', 'h')
    .parse();
//# sourceMappingURL=ARGv.js.map