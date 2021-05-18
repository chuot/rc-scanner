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
import portAudio from 'naudiodon';

export class Audio extends EventEmitter {
    constructor(ctx) {
        super();

        this.config = ctx.config.audio;
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
                    this.emit('status', 'Audio stream error, restarting...');

                    this._stream.abort(() => {
                        setTimeout(() => this._stream = newStream(), this.config.reconnectInterval);
                    });
                });

                stream.start();

                return stream;

            } catch (error) {
                return undefined;
            }
        };

        this.stream = newStream();

        if (!this.stream) {
            const interval = setInterval(() => {
                this.stream = newStream();

                if (this.stream) {
                    clearInterval(interval);
                }
            }, this.config.reconnectInterval);
        }
    }

    stop() {
        if (this.stream) {
            this.stream.destroy();
        }
    }
}
