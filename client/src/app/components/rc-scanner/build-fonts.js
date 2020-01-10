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

