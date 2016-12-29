require('jsdom-global')();

var assert = require('assert');
var sinon = require('sinon');

global.assert = assert;
global.sinon = sinon;

global.METAL_VERSION = '2.5.18';
