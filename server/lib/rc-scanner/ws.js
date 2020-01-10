'use strict';

const EventEmitter = require('events');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');


const { Audio } = require('./audio');
const { Driver } = require('./drivers');

class Ws extends EventEmitter {
    constructor(options = {}) {
        super();

        if (!(this instanceof Ws)) {
            return new Ws(options);
        }

        if (!(options.audio instanceof Audio)) {
            throw new Error('options.audio must be an instance of Audio');
        }

        if (!(options.driver instanceof Driver)) {
            throw new Error('options.driver must be an instance of Driver');
        }

        if (!(options.httpServer instanceof http.Server)) {
            throw new Error('options.httpServer must be an instance of http.Server');
        }

        if (typeof options.model !== 'string') {
            throw new Error('options.model must be a an instance of String');
        }

        this.config = {
            keepAlive: parseInt(process.env.RC_WEBSOCKET_KEEP_ALIVE, 10) || 60000,
            reconnectInterval: parseInt(process.env.RC_WEBSOKECT_RECONNECT_INTERVAL, 10) || 5000,
        };

        this._audio = options.audio;

        this._audioSocket = new WebSocket.Server({ noServer: true });

        this._audioSocket.on('connection', (ws) => {
            const audioHandler = (data) => ws.send(data);

            this._audioCount++;

            this._audio.on('data', audioHandler);

            if (this._audioCount === 1) {
                this._audio.start();
            }

            ws.isAlive = true;

            ws.on('close', () => {
                this._audioCount--;

                this._audio.removeListener('data', audioHandler);

                if (this._audioCount === 0) {
                    this._audio.stop();
                }
            });

            ws.on('pong', () => ws.isAlive = true);
        });

        this._audioCount = 0;

        this._controlSocket = new WebSocket.Server({ noServer: true });

        this._controlSocket.on('connection', (ws) => {
            let previousData;

            const driverHandler = (data) => {
                if (data !== previousData) {
                    previousData = data;

                    ws.send(data);
                }
            }

            this._controlCount++;

            this._driver.on('data', driverHandler);

            if (this._controlCount === 1) {
                this._driver.start();
            }

            ws.isAlive = true;

            ws.on('close', () => {
                this._controlCount--;

                this._driver.removeListener('data', driverHandler);

                if (this._controlCount === 0) {
                    this._driver.stop();
                }

            });

            ws.on('message', (message) => this._driver.write(message));

            ws.on('pong', () => {
                ws.isAlive = true;
            });
        });

        this._controlCount = 0;

        this._driver = options.driver;

        this._httpServer = options.httpServer;

        this._httpServer.on('upgrade', (req, socket, head) => {
            const path = url.parse(req.url).pathname;

            if (path === '/audio') {
                this._audioSocket.handleUpgrade(req, socket, head, (ws) => this._audioSocket.emit('connection', ws, req));

            } else if (path === '/control') {
                this._controlSocket.handleUpgrade(req, socket, head, (ws) => this._controlSocket.emit('connection', ws, req));

            } else {
                socket.destroy();
            }
        });

        this._model = options.model;

        setInterval(() => {
            const check = (ws) => {
                if (!ws.isAlive) {
                    ws.terminate();
                }

                ws.isAlive = false;

                ws.ping();
            }

            this._audioSocket.clients.forEach(check);

            this._controlSocket.clients.forEach(check);
        }, this.config.keepAlive);
    }
}

module.exports = { Ws };
