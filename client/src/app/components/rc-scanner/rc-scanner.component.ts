import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppRcScannerConfig, AppRcScannerService } from './rc-scanner.service';

@Component({
    selector: 'app-rc-scanner',
    styleUrls: ['./rc-scanner.component.scss'],
    templateUrl: './rc-scanner.component.html',
})
export class AppRcScannerComponent implements OnDestroy, OnInit {
    get model() {
        return this._model;
    }

    private _model: string;

    private subscription: Subscription;

    constructor(private rcScannerService: AppRcScannerService) { }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
        this.subscription = undefined;
    }

    ngOnInit(): void {
        this.subscription = this.rcScannerService.config.subscribe((config: AppRcScannerConfig) => this._model = config.model);
    }
}
