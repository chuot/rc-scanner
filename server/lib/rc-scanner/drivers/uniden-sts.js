'use strict';

require('dotenv').config();

const { Com } = require('../com');

const { Driver } = require('./index');

class UnidenSts extends Driver {
    constructor(options = {}) {
        super();

        if (!(this instanceof UnidenSts)) {
            return new UnidenSts(options);
        }

        if (!(options.com instanceof Com)) {
            throw new Error('options.com must be an instanceof Com');
        }

        this.config = {
            hideSerialNumber: typeof process.env.RC_HIDE_SERIAL_NUMBER === 'string' &&
                process.env.RC_HIDE_SERIAL_NUMBER.toLowerCase() === 'true',
            pollingInterval: process.env.RC_POLLING_INTERVAL || 500,
        };

        this._com = options.com;

        this._com.on('data', (dataArray) => {
            let data = dataArray.toString();

            if (this.config.hideSerialNumber) {
                data = data.replace(/SN[0-9]{14}/, 'SN00000000000000').replace(/SUM=[0-9|A-Z]{3}/, 'SUM=000');
            }

            this.emit('data', data);
        });

        this._pollInterval = undefined;
    }

    start() {
        if (!this._pollInterval) {
            this._pollInterval = setInterval(() => this._com.write('STS'), this.config.pollingInterval);
        }
    }

    stop() {
        if (this._pollInterval) {
            clearInterval(this._pollInterval);

            this._pollInterval = undefined;
        }
    }

    write(data) {
        this._com.write(data);
    }
}

module.exports = UnidenSts;
