#! /usr/bin/env node
"use strict";

const colors = require('colors');
const Vorpal = require('vorpal');
var express = require('express');
var path = require("path");

var responseListenerActive = false;

var app = express();
const DenonClient = require('./lib/DenonClient');
const setupToolCommands = require('./lib/toolCommands');
const setupDenonCommands = require('./lib/denonCommands');

const denon = new DenonClient();
const cli = Vorpal();

var response = "";

function getResponse(cmd) {
	responseListenerActive = true;
	denon.command(cmd);	
}
//http://first-time-ceo.tumblr.com/post/104273001643/using-promises-with-expressjs

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname+'/index.html'));
});

app.get('/api/volume', function (req, res) {
  getResponse('MV?');
  setTimeout(function() {res.json({volume: response});}, 300);
});

app.get('/api/alarm/on', function (req, res) {
  getResponse('TSEVERY 20740-20840 FA01 12 1');
  setTimeout(function() {res.json({alarm: response});}, 300);
});

app.get('/api/alarm/off', function (req, res) {
  getResponse('TSEVERY 20740-20840 FA01 12 0');
  setTimeout(function() {res.json({alarm: response});}, 300);
});

app.get('/api/alarm', function (req, res) {
  getResponse('TO?');
  setTimeout(function() {res.json({alarm: response});}, 300);
});

app.get('/api/power/on', function (req, res) {
  denon.command('PWON');
  res.json({power:'on'});
});

app.get('/api/power/off', function (req, res) {
  denon.command('PWSTANDBY');
  res.json({power:'off'});
});

app.get('/api/favourite/1', function (req, res) {
  denon.command('FV 01');
  res.json({favourite:'1'});
});

app.get('/api/favourite/3', function (req, res) {
  denon.command('FV 03');
  res.json({favourite:'3'});
});

app.get('/api/power', function (req, res) {
  getResponse('PW?');
  setTimeout(function() {res.json({power:response});},300);
});


app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
});

denon.on('connect', ()=> {
  const address = denon.socket.remoteAddress;
  const port = denon.socket.remotePort;
  cli.log(colors.green(`Successfully connected to ${address}:${port}`));
});

denon.on('error', err => {
  cli.log(colors.red('Something went wrong'), err);
  denon.end();
});

denon.on('close', ()=> {
  cli.log(colors.red('Connection closed'));
});

denon.on('data', buffer => {
  if(responseListenerActive) {
	response = buffer.toString().trim();
	responseListenerActive = false;
  }
  cli.log(colors.magenta(buffer.toString().trim()));
});

cli
  .localStorage('denon-remote-v1')
  .history('denon-remote-v1')
  .delimiter('denon$')
  .show();

setupToolCommands(cli, denon);
setupDenonCommands(cli, denon);

cli.execSync('connect');
