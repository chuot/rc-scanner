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

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppRcScannerMessage, AppRcScannerService } from '../../rc-scanner.service';

// @ts-ignore
import * as glyphs from './bcd436hp.js';

interface Display {
    mode: string[];
    size: number;
    text: string[];
}

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'rc-scanner-bcd436hp',
    styleUrls: ['./bcd436hp.component.scss'],
    templateUrl: './bcd436hp.component.html',
})
export class AppRcScannerBcd436hpComponent implements OnDestroy, OnInit {
    dimmer = 0;

    led = 'OFF';

    powerOn = false;

    readonly display: Display[] = [];

    private unknownGlyphs: string[] = [];

    private subscription: Subscription | null = null;

    constructor(
        private ngChangeDetectorReg: ChangeDetectorRef,
        private rcScannerService: AppRcScannerService,
    ) { }

    ngOnDestroy(): void {
        if (this.subscription instanceof Subscription) {
            this.subscription.unsubscribe();

            this.subscription = null;
        }
    }

    ngOnInit(): void {
        this.subscription = this.rcScannerService.message.subscribe((message: AppRcScannerMessage) => {
            if (typeof message.data === 'string') {
                this.parseData(message.data);
            }
        });
    }

    @HostListener('document:keydown.a')
    onAvoid(): void {
        this.rcScannerService.send('KEY,L,P');
    }

    @HostListener('document:keydown.h')
    onChan(): void {
        this.rcScannerService.send('KEY,C,P');
    }

    @HostListener('document:keydown.d')
    onDept(): void {
        this.rcScannerService.send('KEY,B,P');
    }

    @HostListener('document:keydown.1')
    onDigitOne(): void {
        this.rcScannerService.send('KEY,1,P');
    }

    @HostListener('document:keydown.2')
    onDigitTwo(): void {
        this.rcScannerService.send('KEY,2,P');
    }

    @HostListener('document:keydown.3')
    onDigitThree(): void {
        this.rcScannerService.send('KEY,3,P');
    }

    @HostListener('document:keydown.4')
    onDigitFour(): void {
        this.rcScannerService.send('KEY,4,P');
    }

    @HostListener('document:keydown.5')
    onDigitFive(): void {
        this.rcScannerService.send('KEY,5,P');
    }

    @HostListener('document:keydown.6')
    onDigitSix(): void {
        this.rcScannerService.send('KEY,6,P');
    }

    @HostListener('document:keydown.7')
    onDigitSeven(): void {
        this.rcScannerService.send('KEY,7,P');
    }

    @HostListener('document:keydown.8')
    onDigitEight(): void {
        this.rcScannerService.send('KEY,8,P');
    }

    @HostListener('document:keydown.9')
    onDigitNine(): void {
        this.rcScannerService.send('KEY,9,P');
    }

    @HostListener('document:keydown.0')
    onDigitZero(): void {
        this.rcScannerService.send('KEY,0,P');
    }

    @HostListener('document:keydown.dot')
    onDot(): void {
        this.rcScannerService.send('KEY,.,P');
    }

    @HostListener('document:keydown.enter', ['$event'])
    onEnter(event?: Event): void {
        if (event instanceof Event) {
            event.preventDefault();
        }

        this.rcScannerService.send('KEY,E,P');
    }

    @HostListener('document:keydown.tab', ['$event'])
    onFullscreen(event?: Event): void {
        if (event instanceof Event) {
            event.preventDefault();
        }

        this.rcScannerService.toggleFullscreen();
    }

    @HostListener('document:keydown.f')
    onFunction(): void {
        this.rcScannerService.send('KEY,F,P');
    }

    @HostListener('document:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        if (event.code === 'NumpadDecimal') {
            this.rcScannerService.send('KEY,.,P');
        }
    }

    @HostListener('document:keydown.l')
    onLightPower(): void {
        if (this.powerOn) {
            this.rcScannerService.send('KEY,V,P');

        } else {
            this.powerOn = true;

            this.rcScannerService.powerOn();
        }
    }

    @HostListener('document:keydown.m')
    onMenu(): void {
        this.rcScannerService.send('KEY,M,P');
    }

    @HostListener('document:keydown.r')
    onReplayRecord(): void {
        this.rcScannerService.send('KEY,Y,P');
    }

    @HostListener('document:keydown.s')
    onSystem(): void {
        this.rcScannerService.send('KEY,A,P');
    }

    @HostListener('document:keydown.arrowleft')
    onVfoLeft(): void {
        this.rcScannerService.send('KEY,<,P');
    }

    @HostListener('document:keydown.arrowright')
    onVfoRight(): void {
        this.rcScannerService.send('KEY,>,P');
    }

    @HostListener('document:keydown.space', ['$event'])
    onVfoPush(event?: Event): void {
        if (event instanceof Event) {
            event.preventDefault();
        }

        this.rcScannerService.send('KEY,^,P');
    }

    @HostListener('document:keydown.z')
    onZipServices(): void {
        this.rcScannerService.send('KEY,Z,P');
    }

    toggleFullscreen(): void {
        this.rcScannerService.toggleFullscreen();
    }

    private parseData(message: string): void {
        if (typeof message === 'string' && message.indexOf('STS,') === 0) {
            this.processStatus(message);
        }
    }

    private processStatus(message: string): void {
        const sep = ',';
        const lineLength = 24;

        let data: string | string[] = message;

        const command = data.slice(0, data.indexOf(sep));

        if (command === 'STS') {
            data = data.substr(data.indexOf(sep) + 1);

            const displayMode = data.slice(0, data.indexOf(sep));

            const linesCount = displayMode.length;

            data = data.substr(data.indexOf(sep) + 1);

            const display: Display[] = [];

            for (let i = 0; i < linesCount; i++) {
                const size = parseInt(displayMode[i], 10);

                const text = data.slice(0, lineLength).split('').map((code, j) => {
                    const glyph = glyphs[code] && (glyphs[code][size] || (glyphs[code][size] !== null && glyphs[code][0]));

                    if (!glyph) {
                        const unknownGlyph = `${size}:${code.charCodeAt(0).toString(16)}`;

                        if (!this.unknownGlyphs.includes(unknownGlyph)) {
                            this.unknownGlyphs.push(unknownGlyph);

                            console.warn(`Unknown glyph: ${unknownGlyph} position: ${i},${j} message: ${message}`);
                        }
                    }

                    return glyph ? glyph[0] : '\u0020';
                });

                data = data.substr(lineLength + 1);

                const mode = data.slice(0, data.indexOf(sep)).split('');

                data = data.substr(data.indexOf(sep) + 1);

                display.push({ mode, size, text });
            }

            data = data.split(sep);

            this.led = data[7]?.toLowerCase();

            this.dimmer = parseInt(data[8], 10);

            this.display.splice(0, this.display.length, ...display);

            this.ngChangeDetectorReg.markForCheck();
        }
    }
}
