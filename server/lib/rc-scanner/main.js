/*
 * *****************************************************************************
 * Copyright (C) 2019-2021 Chrystian Huot
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

import EventEmitter from 'events';
import naudiodon from 'naudiodon';

import { Audio } from './audio.js';
import { Com } from './com.js';
import { Config } from './config.js';
import { Driver } from './driver.js';
import { models } from './models.js';
import { Ws } from './ws.js';

export class RcScanner extends EventEmitter {
    constructor(app = {}) {
        super();

        this.config = app.config.rcScanner = new Config(app);

        if (process.argv[2] === 'init') {
            this.emit('config');

            console.log('config.json created');

            return;

        } else if (process.argv[2] === 'list-audio') {
            console.log(naudiodon.getDevices());

            return;

        } else if (process.argv[2] === 'list-models') {
            models.forEach((model) => console.log(model.name));

            return;
        }

        this.audio = new Audio(this);
        this.audio.on('status', console.log);

        this.com = new Com(this);
        this.com.on('status', console.log);

        this.driver = new Driver(this);

        this.httpServer = app.httpServer;

        this.ws = new Ws(this);

        process.nextTick(() => this.emit('ready'));
    }
}
