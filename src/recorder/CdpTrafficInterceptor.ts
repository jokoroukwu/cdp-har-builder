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

export type EventHandler = (payload: any) => void

export interface CdpSession {
    send(method: string, params?: object): Promise<any>;

    on(event: string, handler: EventHandler): void;

    off(event: string, handler: EventHandler): void;
}

export interface CdpEventHandler {
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
    private subscribed: boolean = false;

    constructor(
        private readonly client: CdpSession,
        private readonly cdpEventHandler: CdpEventHandler,
    ) {
    }

    private readonly onRequestWillBeSent: EventHandler = (event) => {
        if (this.shouldAcceptNewRequests) {
            this.cdpEventHandler.onRequestWillBeSent(event);
        }
    };

    private readonly onResponseReceived: EventHandler = (event) => {
        this.cdpEventHandler.onResponseReceived(event);
    };

    private readonly onLoadingFinished: EventHandler = (event) => {
        this.cdpEventHandler.onLoadingFinished(event, (params) => {
            return this.client.send("Network.getResponseBody", params);
        });
    };

    private readonly onLoadingFailed: EventHandler = (event) => {
        this.cdpEventHandler.onLoadingFailed(event);
    };

    private readonly onWebSocketCreated: EventHandler = (event) => {
        if (this.shouldAcceptNewRequests) {
            this.cdpEventHandler.onWebSocketCreated(event);
        }
    };

    private readonly onWebSocketWillSendHandshakeRequest: EventHandler = (event) => {
        this.cdpEventHandler.onWebSocketWillSendHandshakeRequest(event);
    };

    private readonly onWebSocketHandshakeResponseReceived: EventHandler = (event) => {
        this.cdpEventHandler.onWebSocketHandshakeResponseReceived(event);
    };

    private readonly onWebSocketFrameSent: EventHandler = (event) => {
        this.cdpEventHandler.onWebSocketFrameSent(event);
    };

    private readonly onWebSocketFrameReceived: EventHandler = (event) => {
        this.cdpEventHandler.onWebSocketFrameReceived(event);
    };

    subscribe(): void {
        if (this.subscribed) {
            return;
        }
        this.client.on("Network.requestWillBeSent", this.onRequestWillBeSent);
        this.client.on("Network.responseReceived", this.onResponseReceived);
        this.client.on("Network.loadingFinished", this.onLoadingFinished);
        this.client.on("Network.loadingFailed", this.onLoadingFailed);
        this.client.on("Network.webSocketCreated", this.onWebSocketCreated);
        this.client.on("Network.webSocketWillSendHandshakeRequest", this.onWebSocketWillSendHandshakeRequest);
        this.client.on("Network.webSocketHandshakeResponseReceived", this.onWebSocketHandshakeResponseReceived);
        this.client.on("Network.webSocketFrameSent", this.onWebSocketFrameSent);
        this.client.on("Network.webSocketFrameReceived", this.onWebSocketFrameReceived);
        this.subscribed = true;
    }

    unsubscribe(): void {
        if (!this.subscribed) {
            return;
        }
        this.client.off("Network.requestWillBeSent", this.onRequestWillBeSent);
        this.client.off("Network.responseReceived", this.onResponseReceived);
        this.client.off("Network.loadingFinished", this.onLoadingFinished);
        this.client.off("Network.loadingFailed", this.onLoadingFailed);
        this.client.off("Network.webSocketCreated", this.onWebSocketCreated);
        this.client.off("Network.webSocketWillSendHandshakeRequest", this.onWebSocketWillSendHandshakeRequest);
        this.client.off("Network.webSocketHandshakeResponseReceived", this.onWebSocketHandshakeResponseReceived);
        this.client.off("Network.webSocketFrameSent", this.onWebSocketFrameSent);
        this.client.off("Network.webSocketFrameReceived", this.onWebSocketFrameReceived);
        this.subscribed = false;
    }

    get isSubscribed(): boolean {
        return this.subscribed;
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