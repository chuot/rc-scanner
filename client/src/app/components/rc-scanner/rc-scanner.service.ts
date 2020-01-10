import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable, OnDestroy } from '@angular/core';

export interface AppRcScannerConfig {
    model: string;
    reconnectInterval: number;
    sampleRate: number;
}

export interface AppRcScannerMessage {
    close?: boolean;
    data?: any;
    error?: Event;
    ready?: boolean;
}

declare var webkitAudioContext: any;

@Injectable({
    providedIn: 'root',
})
export class AppRcScannerService implements OnDestroy {
    readonly config = new EventEmitter<AppRcScannerConfig>();

    readonly message = new EventEmitter<AppRcScannerMessage>();

    private audioContext: AudioContext;
    private audioStartTime: number;

    private _config: AppRcScannerConfig;

    private _powerOn = false;

    private wsAudio: WebSocket;
    private wsControl: WebSocket;

    constructor(private httpClient: HttpClient) {
        this.bootstrapAudio();

        this.bootstrapControl();

        this.getConfig();
    }

    powerOn(): void {
        if (!this._powerOn) {
            this._powerOn = true;

            this.openAudioWebSocket();

            this.openControlWebSocket();
        }
    }

    ngOnDestroy(): void {
        if (this.audioContext) {
            this.audioContext.close();
        }

        this.config.complete();
        this.message.complete();

        if (this.wsAudio instanceof WebSocket) {
            this.wsAudio.close();
        }

        if (this.wsControl instanceof WebSocket) {
            this.wsControl.close();
        }
    }

    send(message: string): void {
        if (this.wsControl && this.wsControl.readyState === 1) {
            this.wsControl.send(message);
        }
    }

    toggleFullscreen(): void {
        if (document.fullscreenElement) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if ((document as any).mozCancelFullScreen) {
                (document as any).mozCancelFullScreen();
            } else if ((document as any).msExitFullscreen) {
                (document as any).msExitFullscreen();
            } else if ((document as any).mozCancelFullScreen) {
                (document as any).mozCancelFullScreen();
            } else if ((document as any).webkitExitFullscreen) {
                (document as any).webkitExitFullscreen();
            }

        } else {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if ((document.documentElement as any).mozRequestFullScreen) {
                (document.documentElement as any).mozRequestFullscreen();
            } else if ((document.documentElement as any).msRequestFullscreen) {
                (document.documentElement as any).msRequestFullscreen();
            } else if ((document.documentElement as any).webkitRequestFullscreen) {
                (document.documentElement as any).webkitRequestFullscreen();
            }
        }
    }

    private bootstrapAudio(): void {
        const events = ['keydown', 'mousedown', 'touchdown'];

        const bootstrap = () => {
            if (!this.audioContext) {
                if ('webkitAudioContext' in window) {
                    this.audioContext = new webkitAudioContext();
                } else {
                    this.audioContext = new AudioContext();
                }
            }

            if (this.audioContext) {
                this.audioContext.onstatechange = () => {
                    if (this.audioContext.state === 'suspended') {
                        this.audioContext.resume();
                    }
                };

                this.audioContext.resume().then(() => {
                    events.forEach((event) => document.body.removeEventListener(event, bootstrap));
                });
            }
        };

        events.forEach((event) => document.body.addEventListener(event, bootstrap));
    }

    private bootstrapControl(): void {
        document.addEventListener('visibilitychange', () => {
            if (this._powerOn) {
                if (document.hidden) {
                    this.closeControlWebSocket();

                } else {
                    this.openControlWebSocket();
                }
            }
        });
    }

    private closeAudioWebSocket(): void {
        if (this.wsAudio instanceof WebSocket) {
            this.wsAudio.onclose = undefined;
            this.wsAudio.onerror = undefined;
            this.wsAudio.onopen = undefined;

            this.wsAudio.close();

            this.wsAudio = undefined;
        }
    }

    private closeControlWebSocket(): void {
        if (this.wsControl instanceof WebSocket) {
            this.wsControl.onclose = undefined;
            this.wsControl.onerror = undefined;
            this.wsControl.onopen = undefined;

            this.wsControl.close();

            this.wsControl = undefined;
        }
    }

    private getConfig(): void {
        this.httpClient.get(`${window.location.href}config`).subscribe((config: AppRcScannerConfig) => {
            this._config = config;

            this.config.emit(config);
        });
    }

    private openAudioWebSocket(): void {
        this.audioStartTime = this.audioContext.currentTime;

        this.wsAudio = new WebSocket(`${window.location.href.replace(/^http/, 'ws')}audio`);

        this.wsAudio.binaryType = 'arraybuffer';

        this.wsAudio.onclose = (ev: CloseEvent) => {
            if (ev.code !== 1000) {
                this.reconnectAudio();
            }
        };

        this.wsAudio.onopen = () => {
            this.wsAudio.onmessage = (ev: MessageEvent) => {
                const arrayBufferView = new Int16Array(ev.data);

                const audioBuffer = this.audioContext.createBuffer(1, arrayBufferView.length, this._config.sampleRate);

                const audioChannel = audioBuffer.getChannelData(0);

                const audioSource = this.audioContext.createBufferSource();

                for (let i = 0; i < arrayBufferView.length; i++) {
                    audioChannel[i] = arrayBufferView[i] / 32768;
                }

                audioSource.buffer = audioBuffer;

                audioSource.connect(this.audioContext.destination);

                this.audioStartTime = Math.max(this.audioContext.currentTime, this.audioStartTime);

                audioSource.start(this.audioStartTime);

                this.audioStartTime += audioBuffer.duration;
            };
        };
    }

    private openControlWebSocket(): void {
        this.wsControl = new WebSocket(`${window.location.href.replace(/^http/, 'ws')}control`);

        this.wsControl.onclose = (ev: CloseEvent) => {
            if (ev.code !== 1000) {
                this.reconnectControl();
            }

            this.message.emit({ close: true });
        };

        this.wsControl.onerror = (ev: Event) => this.message.emit({ error: ev });

        this.wsControl.onopen = () => {
            this.message.emit({ ready: true });

            this.wsControl.onmessage = (ev: MessageEvent) => this.message.emit({ data: ev.data });
        };
    }

    private reconnectAudio(): void {
        this.closeAudioWebSocket();

        setTimeout(() => this.openAudioWebSocket(), this._config.reconnectInterval);
    }

    private reconnectControl(): void {
        this.closeControlWebSocket();

        setTimeout(() => this.openControlWebSocket(), this._config.reconnectInterval);
    }
}
