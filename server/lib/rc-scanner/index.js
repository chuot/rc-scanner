/*
 * *****************************************************************************
 * Copyright (C) 2019-2020 Chrystian Huot
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>
 * ****************************************************************************
 */

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

const clientRoot = path.join(__dirname, '../../../client/dist/rc-scanner');
const clientMain = 'index.html';

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
