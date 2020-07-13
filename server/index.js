/*
 * *****************************************************************************
 * Copyright (C) 2019-2020 Chrystian Huot
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
