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
