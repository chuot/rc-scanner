/*
 * *****************************************************************************
 * Copyright (C) 2019-2021 Chrystian Huot <chrystian.huot@saubeo.solutions>
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

import { UnidenSts } from './drivers/uniden-sts.js';
import { Unknown } from './drivers/unknown.js';

import { models, unknown, unidenSts } from './models.js';

export class Driver {
    constructor(ctx) {
        const model = models.find((m) => m.name === ctx.config.model.toLowerCase()) || null;

        if (model !== null) {
            if (model.driver === unidenSts) {
                return new UnidenSts(ctx);
            }

        } else {
            if (ctx.config.model === unknown) {
                console.error('\n!!! WARNING: Unknown scanner model defined in config.json !!!\n');

            } else {
                console.error(`\n!!! WARNING: Unknown scanner model: ${ctx.config.model} !!!\n`);
            }

            return new Unknown(ctx);
        }
    }
}
