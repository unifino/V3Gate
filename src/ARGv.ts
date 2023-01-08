import * as TS                          from "./types/myTypes"

const ARGvs = require('yargs');

export const ARGv: TS.ARGv = ARGvs

.command( {
    command : 'add',
    describe: "Adding a Note",
    builder: {
        title : {
            describe: 'Note Title'
        }
    },
    handler: function(argv) {
        console.log("\n Adding a New Note! ",argv.title);
    }
} )

.option( 'clear', {
    alias: 'c',
    description: 'Clear Terminal',
    type: Boolean
} )

.option( 'sort', {
    alias: 's',
    description: 'Sort result by ...',
    type: [ 'Usage', 'User', 'valid' ]
} )

.option( 'all', {
    alias: 'a',
    description: 'Report all users including not activated ones.',
    type: Boolean
} )

.option( 'refresh', {
    alias: 'f',
    description: 'Refreshing DBs',
    type: [ "justDBs" , "Full" ]
} )

.option( 'fullRefresh', {
    alias: 'F',
    description: 'Refreshing DBs including BackedUp ones',
    type: Boolean
} )

.help().alias( 'help', 'h' )

.parse();
