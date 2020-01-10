'use strict';

const EventEmitter = require('events');

class Driver extends EventEmitter {
    constructor() {
        super();
    }

    start() { }

    stop() { }

    write() { }
}

module.exports = { Driver };
