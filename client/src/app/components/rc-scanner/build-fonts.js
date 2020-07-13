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

const fs = require('fs');
const path = require('path');
const svg2ttf = require('svg2ttf');
const SVGIcons2SVGFontStream = require('svgicons2svgfont');
const ttf2woff2 = require('ttf2woff2');

const packageJson = require('../../../../../package.json');

const bcd436hp = require('./models/bcd436hp/bcd436hp');

function buildFont({ fontId, fontName, glyphs, inputDir, metadata, outputDir }) {
    const fontStream = new SVGIcons2SVGFontStream({ fixedWidth: true, fontId, fontName, metadata });

    let svgFont = '';

    fontStream.on('data', (chunk) => svgFont += chunk.toString());

    Object.keys(glyphs).forEach((code) => {
        if (Array.isArray(glyphs[code])) {
            glyphs[code].forEach((variant) => {
                if (Array.isArray(variant)) {
                const file = variant[1];

                const name = variant[2] || file;

                const svg = path.resolve(__dirname, inputDir, file) + '.svg';

                const glyph = fs.createReadStream(svg);

                glyph.metadata = { name, unicode: [variant[0]] };

                fontStream.write(glyph);
                }
            });
        }
    });

    fontStream.end(() => {
        const ttf = svg2ttf(svgFont, {
            description: `${fontName} for ${packageJson.name} ${packageJson.version}`,
            ts: Math.round(Date.now() / 1000),
            url: packageJson.homepage,
            version: packageJson.version.replace(/^([0-9]+\.[0-9]+).*$/, '$1'),
        });

        const woff2 = ttf2woff2(ttf.buffer);

        fs.writeFileSync(path.resolve(__dirname, outputDir, fontId) + '.woff2', woff2);
    });
}

buildFont({
    fontId: 'bcd436hp',
    fontName: 'Uniden BCD436HP Font',
    glyphs: bcd436hp,
    inputDir: './svgs/modern',
    metadata: `${packageJson.name} ${packageJson.version}`,
    outputDir: '../../../assets/fonts',
});

