'use strict';

require('dotenv').config();

const EventEmitter = require('events');
const SerialPort = require('serialport');

class Com extends EventEmitter {
    constructor() {
        super();

        if (!(this instanceof Com)) {
            return new Com();
        }

        this.config = {
            baudrate: parseInt(process.env.RC_COM_BAUDRATE, 10) || 115200,
            dataBits: parseInt(process.env.RC_COM_DATABITS, 10) || 8,
            parity: process.env.RC_COM_PARITY || 'none',
            port: process.env.RC_COM_PORT || (process.platform === 'win32' ? 'com1' : '/dev/ttyACM0'),
            reconnectInterval: parseInt(process.env.RC_COM_RECONNECT_INTERVAL, 10) || 2000,
            rtscts: typeof process.env.RC_COM_RTSCTS === 'string' && process.env.RC_COM_RTSCTS.toLowerCase() === 'true',
            stopBits: parseInt(process.env.RC_COM_STOPBITS, 10) || 1,
        };

        this._readLine = new SerialPort.parsers.Readline({ delimiter: '\r', encoding: 'binary' });

        this.open();
    }

    close() {
        if (this._serialPort instanceof SerialPort) {
            if (this._serialPort.isOpen) {
                this._serialPort.close();
            }

            this._serialPort = undefined;
        }
    }

    open() {
        let opening = true;

        if (this._serialPort instanceof SerialPort) {
            this.close();
        }

        this._serialPort = new SerialPort(this.config.port, {
            baudRate: this.config.baudrate,
            dataBits: this.config.dataBits,
            parity: this.config.parity,
            rtscts: this.config.rtscts,
            stopBits: this.config.stopBits,
        });

        const serialParser = this._serialPort.pipe(this._readLine);

        this._serialPort.on('close', (err) => {
            this._readLine.removeAllListeners();

            this._serialPort.removeAllListeners();

            this.emit('status', `Disconnected from ${this.config.port}`);

            if (err.disconnected) {
                setTimeout(() => this.open(), this.config.reconnectInterval);
            }
        });

        this._serialPort.on('error', () => {
            this._readLine.removeAllListeners();

            this._serialPort.removeAllListeners();

            if (opening) {
                this.emit('status', `Error connecting to ${this.config.port}, will retry...`);

                setTimeout(() => this.open(), this.config.reconnectInterval);
            }
        });

        this._serialPort.on('open', () => {
            this.emit('status', `Connected to ${this.config.port}`);

            opening = false;
        });

        serialParser.on('data', (data) => this.emit('data', (data)));
    }

    write(data) {
        this._serialPort.write(`${data}\r`);
    }
}

module.exports = { Com };
