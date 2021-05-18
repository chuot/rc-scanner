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
import SerialPort from 'serialport';

export class Com extends EventEmitter {
    constructor(ctx) {
        super();

        this.config = ctx.config.com;

        this.readLine = new SerialPort.parsers.Readline({ delimiter: '\r', encoding: 'binary' });

        this.open();
    }

    close() {
        if (this.serialPort instanceof SerialPort) {
            if (this.serialPort.isOpen) {
                this.serialPort.close();
            }

            this.serialPort = undefined;
        }
    }

    open() {
        let opening = true;

        if (this.serialPort instanceof SerialPort) {
            this.close();
        }

        this.serialPort = new SerialPort(this.config.port, {
            baudRate: this.config.baudRate,
            dataBits: this.config.dataBits,
            parity: this.config.parity,
            rtscts: this.config.rtscts,
            stopBits: this.config.stopBits,
        });

        const serialParser = this.serialPort.pipe(this.readLine);

        this.serialPort.on('close', (err) => {
            this.readLine.removeAllListeners();

            this.serialPort.removeAllListeners();

            this.emit('status', `Disconnected from ${this.config.port}`);

            if (err.disconnected) {
                setTimeout(() => this.open(), this.config.reconnectInterval);
            }
        });

        this.serialPort.on('error', (error) => {
            this.readLine.removeAllListeners();

            this.serialPort.removeAllListeners();

            if (opening) {
                this.emit('status', error.message);

                setTimeout(() => this.open(), this.config.reconnectInterval);
            }
        });

        this.serialPort.on('open', () => {
            this.emit('status', `Connected to ${this.config.port}`);

            opening = false;
        });

        serialParser.on('data', (data) => this.emit('data', (data)));
    }

    write(data) {
        this.serialPort.write(`${data}\r`);
    }
}
