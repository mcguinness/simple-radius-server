var radius = require('radius');
var speakeasy = require('speakeasy');
var dgram = require("dgram");
var server = dgram.createSocket("udp4");


var argv = require('yargs')
    .usage('Simple RADIUS Server\nUsage: $0')
    .example('$0 --u user@example --p 123456 --t false')
    .default({ port: 1812, s: 'grumble,grumble', username: 'administrator1@clouditude.net', password: '123456', totp: false})
    .describe('port', 'RADIUS server listener port')
    .alias('s', 'secret')
    .describe('secret', 'RADIUS secret')
    .alias('u', 'username')
    .describe('username', 'RADIUS User-Name for Access-Request')
    .alias('p', 'password')
    .describe('password', 'Static password (totp=false) or base32-encoded TOTP shared secret (totp=true) for Access-Request')
    .string(['secret', 'username', 'password'])
    .alias('t', 'totp')
    .describe('totp', 'Determines whether to compute TOTP (true) or use static value (false) to validate Access-Request')
    .demand('secret', 'username', 'password')
    .argv
;

console.log();
console.log('loading configuration...');
console.log();
console.log('Listener Port:\n\t' + argv.port);
console.log('RADIUS Secret:\n\t' + argv.secret);
console.log('RADIUS User-Name:\n\t' + argv.username);
console.log('TOTP:\n\t' + argv.totp);
if (argv.totp) {
  console.log('TOTP Shared Secret:\n\t' + argv.password);
} else {
  console.log('RADIUS User-Password:\n\t' + argv.password);
}

console.log();


server.on("message", function (msg, rinfo) {
  var code, username, password, packet, otp;
  packet = radius.decode({packet: msg, secret: argv.secret});

  if (packet.code != 'Access-Request') {
    console.log('unknown packet type: ', packet.code);
    return;
  }

  username = packet.attributes['User-Name'];
  password = packet.attributes['User-Password'];

  console.log('Access-Request for ' + username);

  otp = argv.totp ? speakeasy.totp({key: argv.password, encoding: 'base32'}) : argv.password

  if (username.toLowerCase() === argv.username.toLowerCase()  && password === otp) {
    code = 'Access-Accept';
  } else {
    code = 'Access-Reject';
    console.log("Request User-Password: " + password + " doesn't match OTP: " + otp)
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