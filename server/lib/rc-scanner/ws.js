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
import { URL } from 'url';
import WebSocket from 'ws';

export class Ws extends EventEmitter {
    constructor(ctx) {
        super();

        this.config = ctx.config.webSocket;

        this.audio = ctx.audio;

        this.audioSocket = new WebSocket.Server({ noServer: true });

        this.audioSocket.on('connection', (ws) => {
            const audioHandler = (data) => ws.send(data);

            this.audio.on('data', audioHandler);

            ws.isAlive = true;

            ws.on('close', () => {
                this.audio.removeListener('data', audioHandler);
            });

            ws.on('pong', () => ws.isAlive = true);
        });

        this.controlCount = 0;

        this.controlSocket = new WebSocket.Server({ noServer: true });

        this.controlSocket.on('connection', (ws) => {
            let previousData;

            const driverHandler = (data) => {
                if (data !== previousData) {
                    previousData = data;

                    ws.send(data);
                }
            };

            this.controlCount++;

            this.driver.on('data', driverHandler);

            if (this.controlCount === 1) {
                this.driver.start();
            }

            ws.isAlive = true;

            ws.on('close', () => {
                this.controlCount--;

                this.driver.removeListener('data', driverHandler);

                if (this.controlCount === 0) {
                    this.driver.stop();
                }
            });

            ws.on('message', (message) => this.driver.write(message));

            ws.on('pong', () => {
                ws.isAlive = true;
            });
        });


        this.driver = ctx.driver;

        this.httpServer = ctx.httpServer;

        this.httpServer.on('upgrade', (req, socket, head) => {
            const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;

            if (pathname === '/audio') {
                this.audioSocket.handleUpgrade(req, socket, head, (ws) => this.audioSocket.emit('connection', ws, req));

            } else if (pathname === '/control') {
                this.controlSocket.handleUpgrade(req, socket, head, (ws) => this.controlSocket.emit('connection', ws, req));

            } else {
                socket.destroy();
            }
        });

        setInterval(() => {
            const check = (ws) => {
                if (!ws.isAlive) {
                    ws.terminate();
                }

                ws.isAlive = false;

                ws.ping();
            };

            this.audioSocket.clients.forEach(check);

            this.controlSocket.clients.forEach(check);
        }, this.config.keepAlive);
    }
}
