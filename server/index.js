'use strict';

require('dotenv').config();

const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const http = require('http');
const path = require('path');

const { RcScanner } = require('./lib/rc-scanner');

const env = process.env.NODE_ENV || 'development';
const host = process.env.NODE_HOST || '0.0.0.0';
const port = parseInt(process.env.NODE_PORT, 10) || 3000;

const app = express();

const clientRoot = path.join(__dirname, '../client/dist');

const httpServer = http.createServer(app);

app.rcScanner = new RcScanner({ app, httpServer });

if (app.rcScanner) {

    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(express.static(clientRoot));

    app.set('port', port);

    if (env !== 'development') {
        app.disable('x-powered-by');

        app.use(helmet());
    }

    httpServer.listen(port, host, () => console.log(`Remote Controlled Scanner is running at http://${host}:${port}/`));
}

module.exports = app;
