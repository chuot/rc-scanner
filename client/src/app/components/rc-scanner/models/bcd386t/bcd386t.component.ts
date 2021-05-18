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
import { Subscription, timer } from 'rxjs';
import { AppRcScannerMessage, AppRcScannerService } from '../../rc-scanner.service';

// @ts-ignore
import * as glyphs from './bcd386t.js';

interface Display {
    mode: string[];
    size: number;
    text: string[];
}

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'rc-scanner-bcd386t',
    styleUrls: ['./bcd386t.component.scss'],
    templateUrl: './bcd386t.component.html',
})
export class AppRcScannerBcd386tComponent implements OnDestroy, OnInit {
    backlight = false;

    powerOn = false;

    readonly display: Display[] = [];

    private fnKeyTimerSubscription: Subscription | null = null;

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
        if (this.fnKeyTimerSubscription) {
            this.fnKeyTimerSubscription?.unsubscribe();
            this.fnKeyTimerSubscription = null;

            this.rcScannerService.send('KEY,F,R');

        } else {
            this.fnKeyTimerSubscription = timer(3000).subscribe(() => {
                this.fnKeyTimerSubscription = null;

                this.rcScannerService.send('KEY,F,R');
            });

            this.rcScannerService.send('KEY,F,H');
        }
    }

    @HostListener('document:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        if (event.code === 'NumpadDecimal') {
            this.rcScannerService.send('KEY,.,P');
        }
    }

    @HostListener('document:keydown.h')
    onHold(): void {
        this.rcScannerService.send('KEY,H,P');
    }

    // @HostListener('document:keydown.l')
    onLightPower(): void {
        if (this.powerOn) {
            this.rcScannerService.send('KEY,P,P');

        } else {
            this.powerOn = true;

            this.rcScannerService.powerOn();
        }
    }

    @HostListener('document:keydown.l')
    onLockOut(): void {
        this.rcScannerService.send('KEY,L,P');
    }

    @HostListener('document:keydown.m')
    onMenu(): void {
        this.rcScannerService.send('KEY,M,P');
    }

    @HostListener('document:keydown.s')
    onScan(): void {
        this.rcScannerService.send('KEY,S,P');
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
        const lineLength = 16;

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

            this.backlight = data[0] === '1';

            this.display.splice(0, this.display.length, ...display);

            this.ngChangeDetectorReg.markForCheck();
        }
    }
}
