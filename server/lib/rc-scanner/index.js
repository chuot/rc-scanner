'use strict';

require('dotenv').config();

const EventEmitter = require('events');
const fs = require('fs');
const http = require('http');
const path = require('path');

const { Audio } = require('./audio');
const { Com } = require('./com');
const { models } = require('./models');
const { Ws } = require('./ws');

const clientRoot = path.join(__dirname, '../../../client/dist');
const clientMain = 'main.html';

class RcScanner extends EventEmitter {
    constructor(options = {}) {
        super();

        if (!(this instanceof RcScanner)) {
            return new RcScanner(options);
        }

        if (!(options.app)) {
            throw new Error('app must be an instance of Express');
        }

        if (!(options.httpServer instanceof http.Server)) {
            throw new Error('httpServer must be an instance of http.Server');
        }

        const modelReq = typeof process.env.RC_MODEL === 'string' ? process.env.RC_MODEL.toLowerCase() : 'unspecified';

        const model = models.find((m) => m.name === modelReq);

        if (model) {
            this.app = options.app;

            this.app.get(/^\/$|^\/index.html$/, (req, res) => {
                if (fs.existsSync(path.resolve(clientRoot, clientMain))) {
                    return res.sendFile(clientMain, { root: clientRoot });
                } else {
                    return res.send('A new build of RC Scanner is being prepared. Please check back in a few minutes.');
                }
            });

            this.app.get('/config', (req, res) => {
                res.send({
                    model: this.model,
                    reconnectInterval: this.ws.config.reconnectInterval,
                    sampleRate: this.audio.config.sampleRate,
                });
            });

            this.audio = new Audio();

            this.com = new Com();
            this.com.on('status', console.log);

            const driver = require(path.resolve(__dirname, 'drivers', model.driver));
            this.driver = new driver({ com: this.com });

            this.httpServer = options.httpServer;

            this.model = model.name;

            this.ws = new Ws({
                audio: this.audio,
                driver: this.driver,
                httpServer: this.httpServer,
                model: this.model,
            });

            this.emit('ready');

        } else {
            console.error(`\n!!! WARNING: Unknown scanner model: ${modelReq} !!!\n`);
        }
    }
}

module.exports = { RcScanner };
