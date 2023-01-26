var http = require('http');
let ip = "135.181.46.211";
let meta = '<meta http-equiv="Refresh" content="0; URL=https://fitored.ir/" />';
http.createServer( function (req, res) {
    res.writeHead( 200, {'Content-Type': 'text/html'} );
    res.end( '<head>' + meta + '</head>' );
} ).listen(80, ip);
console.log('Server running at http://' + ip);

const https = require('https');
const fs = require('fs');
let meta = '<meta http-equiv="Refresh" content="0; URL=https://fitored.ir/" />';

const options = {
  key: fs.readFileSync('/root/private.key'),
  cert: fs.readFileSync('/root/cert.crt')
};

https.createServer(options, (req, res) => {
  console.log('req', req)
  res.writeHead(200);
  res.end( '<head>' + meta + '</head>' );
}).listen(443, () => console.log('running'));


