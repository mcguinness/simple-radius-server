var radius = require('radius');
var dgram = require("dgram");
var server = dgram.createSocket("udp4");


var argv = require('yargs')
    .usage('Simple RADIUS Server\nUsage: $0')
    .example('$0 --u user@example --p 123456')
    .default({ port: 1812, s: 'grumble,grumble', username: 'administrator1@clouditude.net', password: '123456'})
    .describe('port', 'Web server listener port')
    .alias('s', 'secret')
    .describe('secret', 'RADIUS secret')
    .alias('u', 'username')
    .describe('username', 'User-Name')
    .alias('p', 'password')
    .describe('password', 'User-Password (OTP)')
    .argv
;

console.log();
console.log('loading configuration...');
console.log();
console.log('Listener Port:\n\t' + argv.port);
console.log('RADIUS Secret:\n\t' + argv.secret);
console.log('RADIUS User-Name:\n\t' + argv.username);
console.log('RADIUS User-Password:\n\t' + argv.password);
console.log();


server.on("message", function (msg, rinfo) {
  var code, username, password, packet;
  packet = radius.decode({packet: msg, secret: argv.secret});

  if (packet.code != 'Access-Request') {
    console.log('unknown packet type: ', packet.code);
    return;
  }

  username = packet.attributes['User-Name'];
  password = packet.attributes['User-Password'];

  console.log('Access-Request for ' + username);

  if (username.toLowerCase() == argv.username.toLowerCase()  && password == argv.password) {
    code = 'Access-Accept';
  } else {
    code = 'Access-Reject';
  }

  var response = radius.encode_response({
    packet: packet,
    code: code,
    secret: argv.secret
  });

  console.log('Sending ' + code + ' for user ' + username);
  server.send(response, 0, response.length, rinfo.port, rinfo.address, function(err, bytes) {
    if (err) {
      console.log('Error sending response to ', rinfo);
    }
  });
});

server.on("listening", function () {
  var address = server.address();
  console.log("radius server listening " +
      address.address + ":" + address.port);
});

server.bind(argv.port);