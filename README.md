Simple TOTP RADIUS Server for node.js.

## Installation

    npm install

## Introduction

This app provides a simple RADIUS server for testing an OTP RADIUS client with either a static or computed TOTP (Time-Based One-Time Password Algorithm) [RFC 6238](http:tools.ietf.org/html/rfc6238)

## Usage

You can specify a static username and password to validate an `Access-Request`.  If the `User-Name` and `User-Password` doesn't match the static values the server will respond with an `Access-Reject` message.

	node app.js --secret {RADIUS secret} --username {UserName} --password {Password}

If you want to validate an `Access-Request` with a computed TOTP, you must opt-in to TOTP mode and specify the base32-encoded TOTP shared secret as the password 

	node app.js --secret {RADIUS secret} --username {UserName} --password {base32-encoded TOTP shared secret} --totp true