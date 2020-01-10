import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { AppRcScannerModule } from './components/rc-scanner/rc-scanner.module';

@NgModule({
    bootstrap: [AppComponent],
    declarations: [AppComponent],
    imports: [
        AppRcScannerModule,
        BrowserAnimationsModule,
        BrowserModule,
        HttpClientModule,
    ],
})
export class AppModule { }
