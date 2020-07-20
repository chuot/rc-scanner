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

import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable, OnDestroy } from '@angular/core';

declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}

export interface AppRcScannerConfig {
    model: string;
    reconnectInterval: number;
    sampleRate: number;
}

export interface AppRcScannerMessage {
    close?: boolean;
    data?: string;
    error?: Event;
    ready?: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class AppRcScannerService implements OnDestroy {
    rootElement: HTMLElement = document.documentElement;

    readonly config = new EventEmitter<AppRcScannerConfig>();

    readonly message = new EventEmitter<AppRcScannerMessage>();

    private audioContext: AudioContext | undefined;

    private audioReady = new EventEmitter<void>();

    private audioStartTime = NaN;

    private isPowerOn = false;

    private scannerConfig: AppRcScannerConfig | undefined;

    private wsAudio: WebSocket | undefined;

    private wsControl: WebSocket | undefined;

    constructor(private httpClient: HttpClient) {
        this.bootstrapAudio();

        this.bootstrapControl();

        this.getConfig();
    }

    async powerOn(): Promise<void> {
        if (!this.isPowerOn) {
            await this.audioReady.toPromise();

            this.isPowerOn = true;

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
            const el: {
                exitFullscreen?: () => void;
                mozCancelFullScreen?: () => void;
                msExitFullscreen?: () => void;
                webkitExitFullscreen?: () => void;
            } = document;

            if (el.exitFullscreen) {
                el.exitFullscreen();
            } else if (el.mozCancelFullScreen) {
                el.mozCancelFullScreen();
            } else if (el.msExitFullscreen) {
                el.msExitFullscreen();
            } else if (el.webkitExitFullscreen) {
                el.webkitExitFullscreen();
            }

        } else {
            const el: {
                requestFullscreen?: () => void;
                mozRequestFullScreen?: () => void;
                msRequestFullscreen?: () => void;
                webkitRequestFullscreen?: () => void;
            } = this.rootElement || document;

            if (el.requestFullscreen) {
                el.requestFullscreen();
            } else if (el.mozRequestFullScreen) {
                el.mozRequestFullScreen();
            } else if (el.msRequestFullscreen) {
                el.msRequestFullscreen();
            } else if (el.webkitRequestFullscreen) {
                el.webkitRequestFullscreen();
            }
        }
    }

    private bootstrapAudio(): void {
        const events = ['keydown', 'mousedown', 'touchdown'];

        const bootstrap = () => {
            if (!this.audioContext) {
                const options: AudioContextOptions = {
                    latencyHint: 'playback',
                };

                if (window.webkitAudioContext) {
                    this.audioContext = new window.webkitAudioContext(options);

                } else {
                    this.audioContext = new AudioContext(options);
                }
            }

            if (this.audioContext) {
                this.audioContext.resume().then(() => {
                    events.forEach((event) => document.body.removeEventListener(event, bootstrap));

                    setTimeout(() => this.audioReady.complete());
                });
            }
        };

        events.forEach((event) => document.body.addEventListener(event, bootstrap));
    }

    private bootstrapControl(): void {
        document.addEventListener('visibilitychange', () => {
            if (this.isPowerOn) {
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
            this.wsAudio.onclose = null;
            this.wsAudio.onerror = null;
            this.wsAudio.onopen = null;

            this.wsAudio.close();

            this.wsAudio = undefined;
        }
    }

    private closeControlWebSocket(): void {
        if (this.wsControl instanceof WebSocket) {
            this.wsControl.onclose = null;
            this.wsControl.onerror = null;
            this.wsControl.onopen = null;

            this.wsControl.close();

            this.wsControl = undefined;
        }
    }

    private getConfig(): void {
        const url = this.getUrl('config');

        this.httpClient.get<AppRcScannerConfig>(url).subscribe((config) => {
            this.scannerConfig = config;

            this.config.emit(config);
        });
    }

    private getUrl(path: string, options: { ws?: boolean } = {}): string {
        let url = window.location.href.replace(/[^\/]+$/, '') + path.replace(/^\//, '');

        if (options.ws) {
            url = url.replace(/^http/, 'ws');
        }

        return url;
    }

    private openAudioWebSocket(): void {
        const url = this.getUrl('audio', { ws: true });

        this.audioStartTime = this.audioContext?.currentTime || NaN;

        this.wsAudio = new WebSocket(url);

        this.wsAudio.binaryType = 'arraybuffer';

        this.wsAudio.onclose = (ev: CloseEvent) => {
            if (ev.code !== 1000) {
                this.reconnectAudio();
            }
        };

        this.wsAudio.onopen = () => {
            if (this.wsAudio instanceof WebSocket) {
                this.wsAudio.onmessage = (ev: MessageEvent) => {
                    if (this.audioContext instanceof AudioContext && this.scannerConfig) {
                        const arrayBufferView = new Int16Array(ev.data);

                        const audioBuffer = this.audioContext.createBuffer(1, arrayBufferView.length, this.scannerConfig.sampleRate);

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
                    }
                };
            }
        };
    }

    private openControlWebSocket(): void {
        const url = this.getUrl('control', { ws: true });

        this.wsControl = new WebSocket(url);

        this.wsControl.onclose = (ev: CloseEvent) => {
            if (ev.code !== 1000) {
                this.reconnectControl();
            }

            this.message.emit({ close: true });
        };

        this.wsControl.onerror = (ev: Event) => this.message.emit({ error: ev });

        this.wsControl.onopen = () => {
            if (this.wsControl instanceof WebSocket) {
                this.message.emit({ ready: true });

                this.wsControl.onmessage = (ev: MessageEvent) => this.message.emit({ data: ev.data });
            }
        };
    }

    private reconnectAudio(): void {
        this.closeAudioWebSocket();

        setTimeout(() => this.openAudioWebSocket(), this.scannerConfig?.reconnectInterval);
    }

    private reconnectControl(): void {
        this.closeControlWebSocket();

        setTimeout(() => this.openControlWebSocket(), this.scannerConfig?.reconnectInterval);
    }
}
