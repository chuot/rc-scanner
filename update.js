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

const childProcess = require('child_process');
const path = require('path');

const clientPath = path.resolve(__dirname, 'client');
const serverPath = path.resolve(__dirname, 'server');

process.stdout.write('Pulling new version from github...');
childProcess.execSync('git reset --hard', { stdio: ['ignore', 'ignore', 'pipe'] });
childProcess.execSync('git pull', { stdio: ['ignore', 'ignore', 'pipe'] });
process.stdout.write(' done\n');

process.stdout.write('Updating node modules...');
childProcess.execSync('npm install', { cwd: clientPath, stdio: ['ignore', 'ignore', 'pipe'] });
childProcess.execSync('npm prune', { cwd: clientPath, stdio: ['ignore', 'ignore', 'pipe'] });
childProcess.execSync('npm install', { cwd: serverPath, stdio: ['ignore', 'ignore', 'pipe'] });
childProcess.execSync('npm prune', { cwd: serverPath, stdio: ['ignore', 'ignore', 'pipe'] });
process.stdout.write(' done\n');

process.stdout.write('Building client app...');
childProcess.execSync('npm run build', { cwd: clientPath, stdio: ['ignore', 'ignore', 'pipe'] });
process.stdout.write(' done\n');

process.stdout.write('Please restart RC Scanner\n')