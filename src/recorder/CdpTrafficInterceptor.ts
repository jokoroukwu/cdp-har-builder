import type {
    CdpLoadingFailedEvent,
    CdpLoadingFinishedEvent,
    CdpRequestWillBeSentEvent,
    CdpResponseReceivedEvent,
    CdpWebSocketCreatedEvent,
    CdpWebSocketFrameEvent,
    CdpWebSocketHandshakeResponseReceivedEvent,
    CdpWebSocketWillSendHandshakeRequestEvent,
    GetResponseBody
} from "./CdpNetworkTypes.js";


export type CdpSession = {
    send(method: string, params?: object): Promise<any>
    on(event: string, handler: (payload: any) => void): void
    off?(event: string, handler: (payload: any) => void): void
    detach?(): Promise<void>
}

export interface EventHandler {
    onRequestWillBeSent(event: CdpRequestWillBeSentEvent): void;

    onResponseReceived(event: CdpResponseReceivedEvent): void;

    onLoadingFinished(event: CdpLoadingFinishedEvent, callback: GetResponseBody): void;

    onLoadingFailed(event: CdpLoadingFailedEvent): void;

    onWebSocketCreated(event: CdpWebSocketCreatedEvent): void;

    onWebSocketWillSendHandshakeRequest(event: CdpWebSocketWillSendHandshakeRequestEvent): void;

    onWebSocketHandshakeResponseReceived(event: CdpWebSocketHandshakeResponseReceivedEvent): void;

    onWebSocketFrameSent(event: CdpWebSocketFrameEvent): void;

    onWebSocketFrameReceived(event: CdpWebSocketFrameEvent): void;
}

export class CdpTrafficInterceptor {
    private shouldAcceptNewRequests: boolean = false;

    constructor(
        private readonly client: CdpSession,
        private readonly eventHandler: EventHandler,
    ) {
    }

    async subscribe(): Promise<void> {
        await this.client.send("Network.enable");

        this.client.on("Network.requestWillBeSent", (event) => {
            if (this.shouldAcceptNewRequests) {
                this.eventHandler.onRequestWillBeSent(event);
            }
        });

        this.client.on("Network.responseReceived", (event) => {
            this.eventHandler.onResponseReceived(event);
        });

        this.client.on("Network.loadingFinished", (event) => {
            this.eventHandler.onLoadingFinished(event, (params) => {
                return this.client.send("Network.getResponseBody", params);
            });
        });

        this.client.on("Network.loadingFailed", (event) => {
            this.eventHandler.onLoadingFailed(event);
        });

        this.client.on("Network.webSocketCreated", (event) => {
            if (this.shouldAcceptNewRequests) {
                this.eventHandler.onWebSocketCreated(event);
            }
        });

        this.client.on("Network.webSocketWillSendHandshakeRequest", (event) => {
            this.eventHandler.onWebSocketWillSendHandshakeRequest(event);
        });

        this.client.on("Network.webSocketHandshakeResponseReceived", (event) => {
            this.eventHandler.onWebSocketHandshakeResponseReceived(event);
        });

        this.client.on("Network.webSocketFrameSent", (event) => {
            this.eventHandler.onWebSocketFrameSent(event);
        });

        this.client.on("Network.webSocketFrameReceived", (event) => {
            this.eventHandler.onWebSocketFrameReceived(event);
        });
    }

    get isAcceptingNewRequests(): boolean {
        return this.shouldAcceptNewRequests;
    }

    acceptNewRequests(): void {
        this.shouldAcceptNewRequests = true;
    }

    discardNewRequests(): void {
        this.shouldAcceptNewRequests = false;
    }
}