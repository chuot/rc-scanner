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

import { Component, ElementRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppRcScannerConfig, AppRcScannerService } from './rc-scanner.service';

@Component({
    selector: 'app-rc-scanner',
    styleUrls: ['./rc-scanner.component.scss'],
    templateUrl: './rc-scanner.component.html',
})
export class AppRcScannerComponent implements OnDestroy {
    model: string | undefined;

    private subscription: Subscription;

    constructor(private ngElementRef: ElementRef, private rcScannerService: AppRcScannerService) {
        this.subscription = this.rcScannerService.config.subscribe((config: AppRcScannerConfig) => this.model = config.model);

        rcScannerService.rootElement = ngElementRef.nativeElement;
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }
}
