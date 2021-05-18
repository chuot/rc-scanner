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

import { unknown } from './models.js';

export class Config {
    constructor(app) {
        const config = app.config.rcScanner;

        this.audio = {
            deviceId: typeof config?.audio?.deviceId === 'number'
                ? config.audio.deviceId
                : parseInt(process.env.RC_AUDIO_DEVICE_ID, 10) || -1,
            reconnectInterval: typeof config?.audio?.reconnectInterval === 'number'
                ? config.audio.reconnectInterval
                : parseInt(process.env.RC_AUDIO_RECONNECT_INTERVAL, 10) || 2000,
            sampleRate: typeof config?.audio?.sampleRate === 'number'
                ? config.audio.sampleRate
                : parseInt(process.env.RC_AUDIO_SAMPLE_RATE, 10) || 44100,
            squelch: typeof config?.audio?.squelch === 'number'
                ? config.audio.squelch
                : parseInt(process.env.RC_AUDIO_SQUELCH, 10) || 100,
        };

        this.com = {
            baudRate: typeof config?.com?.baudRate === 'number'
                ? config.com.baudRate
                : parseInt(process.env.RC_COM_BAUDRATE, 10) || 115200,
            dataBits: typeof config?.com?.dataBits === 'number'
                ? config.com.dataBits
                : parseInt(process.env.RC_COM_DATABITS, 10) || 8,
            parity: typeof config?.com?.parity === 'string'
                ? config.com.parity
                : process.env.RC_COM_PARITY || 'none',
            pollingInterval: typeof config?.com?.pollingInterval === 'number'
                ? config.com.pollingInterval
                : parseInt(process.env.RC_COM_POLLING_INTERVAL, 10) || 500,
            port: typeof config?.com?.port === 'string'
                ? config.com.port
                : process.env.RC_COM_PARITY || process.platform === 'win32' ? 'com1' : '/dev/ttyACM0',
            reconnectInterval: typeof config?.com?.reconnectInterval === 'number'
                ? config.com.reconnectInterval
                : parseInt(process.env.RC_RECONNECT_INTERVAL, 10) || 5000,
            rtscts: (config?.com?.rtscts || '').toLowerCase() === 'true'
                ? true
                : (process.env.RC_COM_RTSCTS || '').toLowerCase() === 'true' ? true : false,
            stopBits: typeof config?.com?.stopBits === 'number'
                ? config.com.stopBits
                : parseInt(process.env.RC_COM_STOPBITS, 10) || 1,
        };

        this.hideSerialNumber = typeof config?.hideSerialNumber === 'boolean'
            ? config.hideSerialNumber
            : (process.env.RC_HIDE_SERIAL_NUMBER || '').toLowerCase() === 'true' ? true : false;

        this.model = typeof config?.model === 'string' && config.model.length
            ? config.model.toLowerCase()
            : process.env.RC_MODEL || unknown;

        this.webSocket = {
            keepAlive: typeof config?.webSocket?.keepAlive === 'number'
                ? config.webSocket.keepAlive
                : parseInt(process.env.RC_WEBSOCKET_KEEP_ALIVE, 10) || 30000,
            reconnectInterval: typeof config?.webSocket?.reconnectInterval === 'number'
                ? config.webSocket.reconnectInterval
                : parseInt(process.env.RC_WEBSOCKET_RECONNECT_INTERVAL, 10) || 2000,
        };

        app.router.get('/config', (req, res) => {
            res.send({
                model: this.model,
                reconnectInterval: this.webSocket.reconnectInterval,
                sampleRate: this.audio.sampleRate,
            });
        });
    }
}
