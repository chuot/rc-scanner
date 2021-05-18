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

import { DriverInterface } from './interface.js';

export class UnidenSts extends DriverInterface {
    constructor(ctx) {
        super();

        this.com = ctx.com;

        this.com.on('data', (dataArray) => {
            let data = dataArray.toString();

            if (this.config.hideSerialNumber) {
                data = data.replace(/SN[0-9]{14}/, 'SN00000000000000').replace(/SUM=[0-9|A-Z]{3}/, 'SUM=000');
            }

            this.emit('data', data);
        });

        this.config = ctx.config;

        this.pollInterval = null;
    }

    start() {
        if (!this.pollInterval) {
            this.pollInterval = setInterval(() => this.com.write('STS'), this.config.com.pollingInterval);
        }
    }

    stop() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);

            this.pollInterval = null;
        }
    }

    write(data) {
        this.com.write(data);
    }
}
