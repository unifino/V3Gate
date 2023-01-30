import * as TS                          from "./types/myTypes"

const ARGvs = require('yargs');

export const ARGv: TS.ARGv = ARGvs

// .command( {
//     command : 'sort',
//     // alias: 's',
//     description: 'Sort result by ...',
//     type: [ 'Usage', 'User', 'Valid', 'Activity' ]
// } )

// .command( {
//     command : 'add',
//     describe: "Adding a Note",
//     builder: { title : { describe: 'Note Title' } },
//     handler: argv => { console.log( "\nAdding a New User! ", argv.name ); }
// } )

.option( 'clear', {
    alias: 'c',
    description: 'Clear Terminal',
    type: Boolean
} )

.option( 'sortUsage', {
    alias: 'sc',
    description: 'Sort result by TotalUsage',
    type: Boolean
} )

.option( 'sortUser', {
    alias: 'su',
    description: 'Sort result by userName',
    type: Boolean
} )

.option( 'sortActivity', {
    alias: 'sa',
    description: 'Sort result by recentActivity',
    type: Boolean
} )

.option( 'sortValid', {
    alias: 'sv',
    description: 'Sort result by validTime',
    type: Boolean
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

.option( 'noRefresh', {
    alias: 'x',
    description: 'Refuse to Refreshing DBs',
    type: Boolean
} )

.help().alias( 'help', 'h' )

.parse();
