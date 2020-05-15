/*
 * *****************************************************************************
 *  Copyright (C) 2019-2020 Chrystian Huot
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
const portAudio = require('naudiodon');

class Audio extends EventEmitter {
    constructor() {
        const config = {
            deviceId: parseInt(process.env.RC_AUDIO_DEVICE_ID, 10) || -1,
            reconnectInterval: parseInt(process.env.RC_AUDIO_RECONNECT_INTERVAL, 10) || 5000,
            sampleRate: parseInt(process.env.RC_AUDIO_SAMPLE_RATE, 10) || 44100,
            squelch: parseInt(process.env.RC_AUDIO_SQUELCH, 10) || 100,
        };

        super();

        this.config = config;

        if (!(this instanceof Audio)) {
            return new Audio();
        }
    }

    start() {
        const newStream = () => {
            let stream;

            try {
                stream = new portAudio.AudioIO({
                    inOptions: {
                        channelCount: 1,
                        closeOnError: false,
                        deviceId: this.config.deviceId,
                        sampleFormat: portAudio.SampleFormat16Bit,
                        sampleRate: this.config.sampleRate,
                    },
                });

                stream.on('data', (data) => {
                    if (this.config.squelch > 0) {
                        const array = new Int16Array(data.buffer);

                        if (array.some((pcm) => pcm >= this.config.squelch)) {
                            this.emit('data', data.buffer);
                        }

                    } else {
                        this.emit('data', data.buffer);
                    }
                });

                stream.on('error', () => {
                    this._stream.abort(() => {
                        setTimeout(() => {
                            this._stream = newStream();
                        }, this.config.reconnectInterval);
                    });
                });

                stream.start();

                return stream;

            } catch (error) {
                return undefined;
            }
        };

        this._stream = newStream();

        if (!this._stream) {
            const interval = setInterval(() => {
                this._stream = newStream();

                if (this._stream) {
                    clearInterval(interval);
                }
            }, this.config.connectionRetryDelay);
        }
    }

    stop() {
        if (this._stream) {
            this._stream.destroy();
        }
    }
}

module.exports = { Audio };
