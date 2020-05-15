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

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexModule } from '@angular/flex-layout';
import { AppRcScannerBcd436HpComponent } from './models/bcd436hp/bcd436hp.component';
import { AppRcScannerUnsupportedComponent } from './models/unsupported/unsupported.component';
import { AppRcScannerComponent } from './rc-scanner.component';
import { AppRcScannerService } from './rc-scanner.service';

@NgModule({
    declarations: [
        AppRcScannerBcd436HpComponent,
        AppRcScannerComponent,
        AppRcScannerUnsupportedComponent,
    ],
    exports: [AppRcScannerComponent],
    imports: [
        CommonModule,
        FlexModule,
    ],
    providers: [AppRcScannerService],
})
export class AppRcScannerModule { }
