import type {
    CdpLoadingFailedEvent,
    CdpLoadingFinishedEvent,
    CdpRequestWillBeSentEvent,
    CdpResponseReceivedEvent,
    CdpWebSocketCreatedEvent,
    CdpWebSocketFrameEvent,
    CdpWebSocketHandshakeResponseReceivedEvent,
    CdpWebSocketWillSendHandshakeRequestEvent,
    GetResponseBody,
    RequestState,
    WaitOptions,
    WebSocketMessage
} from "./CdpNetworkTypes.js";


export class CdpNetworkRecorder {
    static readonly WEBSOCKET_METHOD: string = "GET";
    static readonly WEBSOCKET_RESOURCE_TYPE: string = "websocket";

    private readonly activeRequests = new Map<string, RequestState>();
    private readonly completedRequests = new Map<string, RequestState>();
    private readonly failedRequests = new Map<string, RequestState>();

    constructor() {
    }

    onRequestWillBeSent(event: CdpRequestWillBeSentEvent): void {
        this.activeRequests.set(event.requestId, {
            requestId: event.requestId,

            url: event.request.url,
            method: event.request.method,
            requestHeaders: event.request.headers,
            postData: event.request.postData,
            resourceType: event.type,
            initiator: event.initiator,

            requestTimestamp: event.timestamp,
            startedDateTime: event.wallTime ? new Date(event.wallTime * 1000).toISOString() : new Date().toISOString(),

            hasResponse: false,
            isFinished: false,
            isFailed: false,
            webSocketMessages: []
        });
    }

    onResponseReceived(event: CdpResponseReceivedEvent): void {
        const req: RequestState | undefined = this.activeRequests.get(event.requestId);
        if (!req) return;

        req.hasResponse = true;
        req.status = event.response.status;
        req.statusText = event.response.statusText;
        req.responseHeaders = event.response.headers;
        req.mimeType = event.response.mimeType;
        req.protocol = event.response.protocol;
        req.responseTimestamp = event.timestamp;

        if (event.type && !req.resourceType) {
            req.resourceType = event.type;
        }
    }

    onLoadingFinished(event: CdpLoadingFinishedEvent, callback: GetResponseBody): void {
        const req: RequestState | undefined = this.activeRequests.get(event.requestId);
        if (!req) return;

        req.isFinished = true;
        req.loadingFinishedTimestamp = event.timestamp;

        callback({requestId: event.requestId})
            .then(body => {
                req.responseBody = body.body;
                req.responseBodyBase64Encoded = body.base64Encoded;
            })
            .catch(() => {
                // response body can be unavailable.
            })
            .finally(() => {
                this.activeRequests.delete(req.requestId);
                this.completedRequests.set(req.requestId, req);
            });
    }

    onLoadingFailed(event: CdpLoadingFailedEvent): void {
        const req: RequestState | undefined = this.activeRequests.get(event.requestId);
        if (!req) return;

        req.isFailed = true;
        req.errorText = event.errorText;
        req.canceled = event.canceled;

        this.activeRequests.delete(event.requestId);
        this.failedRequests.set(event.requestId, req);
    }

    onWebSocketCreated(event: CdpWebSocketCreatedEvent): void {
        this.activeRequests.set(event.requestId, {
            requestId: event.requestId,

            url: event.url,
            method: CdpNetworkRecorder.WEBSOCKET_METHOD,
            requestHeaders: {},
            resourceType: CdpNetworkRecorder.WEBSOCKET_RESOURCE_TYPE,
            initiator: event.initiator,

            startedDateTime: new Date().toISOString(),

            hasResponse: false,
            isFinished: false,
            isFailed: false,
            webSocketMessages: [],
        });
    }

    onWebSocketWillSendHandshakeRequest(event: CdpWebSocketWillSendHandshakeRequestEvent): void {
        const request: RequestState | undefined = this.activeRequests.get(event.requestId);
        if (!request) {
            return;
        }
        request.requestTimestamp = event.timestamp;
        request.startedDateTime = event.wallTime ? new Date(event.wallTime * 1000).toISOString() : request.startedDateTime;
        request.requestHeaders = event.request.headers;
    }

    onWebSocketHandshakeResponseReceived(event: CdpWebSocketHandshakeResponseReceivedEvent): void {
        const request: RequestState | undefined = this.activeRequests.get(event.requestId);
        if (!request) {
            return;
        }

        request.resourceType = CdpNetworkRecorder.WEBSOCKET_RESOURCE_TYPE;
        request.responseTimestamp = event.timestamp;
        request.loadingFinishedTimestamp = event.timestamp;

        request.status = event.response.status;
        request.statusText = event.response.statusText;
        request.responseHeaders = event.response.headers;

        request.hasResponse = true;
        request.isFinished = true;

        this.activeRequests.delete(event.requestId);
        this.completedRequests.set(event.requestId, request);
    }

    onWebSocketFrameSent(event: CdpWebSocketFrameEvent): void {
        this.addWebSocketMessage(
            event.requestId,
            {
                type: "send",
                time: event.timestamp,
                opcode: event.response.opcode,
                data: event.response.payloadData,
            },
        );
    }

    onWebSocketFrameReceived(event: CdpWebSocketFrameEvent): void {
        this.addWebSocketMessage(
            event.requestId,
            {
                type: "receive",
                time: event.timestamp,
                opcode: event.response.opcode,
                data: event.response.payloadData,
            },
        );
    }

    private addWebSocketMessage(requestId: string, message: WebSocketMessage): void {
        const request: RequestState | undefined = this.completedRequests.get(requestId);
        if (!request) {
            return;
        }
        request.webSocketMessages.push(message);
    }

    hasPendingRequests(): boolean {
        return this.activeRequests.size > 0;
    }

    async waitForPendingRequests(options: WaitOptions = {}): Promise<void> {
        const intervalMs: number = options.intervalMs ?? 50;
        const timeoutMs: number = options.timeoutMs ?? 5000;
        const startedAt: number = Date.now();

        while (this.hasPendingRequests()) {
            if (Date.now() - startedAt > timeoutMs) {
                throw new Error("Timed out waiting for pending requests");
            }
            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
    }

    clear(): void {
        this.activeRequests.clear();
        this.completedRequests.clear();
        this.failedRequests.clear();
    }

    getActiveRequests(): RequestState[] {
        return [...this.activeRequests.values()];
    }

    getCompletedRequests(): RequestState[] {
        return [...this.completedRequests.values()];
    }

    getFailedRequests(): RequestState[] {
        return [...this.failedRequests.values()];
    }
}