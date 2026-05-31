export type Headers = Record<string, string>;

export interface CdpRequestWillBeSentEvent {
    requestId: string;
    timestamp: number;
    wallTime?: number;
    type?: string;
    initiator?: any;
    request: {
        url: string;
        method: string;
        headers?: Headers;
        postData?: string;
    };
}

export interface CdpResponseReceivedEvent {
    requestId: string;
    timestamp: number;
    type?: string;
    response: {
        status: number;
        statusText?: string;
        headers?: Headers;
        mimeType?: string;
        protocol?: string;
    };
}

export interface CdpLoadingFinishedEvent {
    requestId: string;
    timestamp: number;
}

export interface CdpLoadingFailedEvent {
    requestId: string;
    timestamp: number;
    errorText?: string;
    canceled?: boolean;
}

export interface ResponseBody {
    body: string;
    base64Encoded: boolean;
}

export type GetResponseBody = (params: object) => Promise<ResponseBody>;

export interface CdpNetworkRecorderOptions {
    getResponseBody: GetResponseBody;
}

export interface WaitOptions {
    intervalMs?: number;
    timeoutMs?: number;
}


export interface CdpWebSocketCreatedEvent {
    requestId: string;
    url: string;
    initiator?: any;
}

export interface CdpWebSocketHandshakeRequest {
    headers?: Headers;
}

export interface CdpWebSocketHandshakeResponse {
    status: number;
    statusText?: string;
    headers?: Headers;
}

export interface CdpWebSocketWillSendHandshakeRequestEvent {
    requestId: string;
    timestamp: number;
    wallTime?: number;
    request: CdpWebSocketHandshakeRequest;
}

export interface CdpWebSocketHandshakeResponseReceivedEvent {
    requestId: string;
    timestamp: number;
    response: CdpWebSocketHandshakeResponse;
}

export interface CdpWebSocketFrame {
    opcode: number;
    mask: boolean;
    payloadData: string;
}

export interface CdpWebSocketFrameEvent {
    requestId: string;
    timestamp: number;
    response: CdpWebSocketFrame;
}

export interface WebSocketMessage {
    type: "send" | "receive";
    time: number;
    opcode: number;
    data: string;
}

export interface RequestState {
    requestId: string;
    url?: string;
    method?: string;
    requestHeaders?: Headers;
    postData?: string;
    resourceType?: string;
    initiator?: any;

    status?: number;
    statusText?: string;
    responseHeaders?: Headers;
    mimeType?: string;
    protocol?: string;

    responseBody?: string;
    responseBodyBase64Encoded?: boolean;

    startedDateTime?: string;
    requestTimestamp?: number;
    responseTimestamp?: number;
    loadingFinishedTimestamp?: number;

    hasResponse: boolean;
    isFinished: boolean;
    isFailed: boolean;

    errorText?: string;
    canceled?: boolean;

    webSocketMessages: WebSocketMessage[];
}