import type {WebSocketMessage} from "../recorder/CdpNetworkTypes.js";

export interface HarHeader {
    name: string;
    value: string;
}

export interface HarQueryParam {
    name: string;
    value: string;
}

export interface HarPostData {
    mimeType: string;
    text: string;
}

export interface HarContent {
    size: number;
    mimeType: string;
    text?: string;
    encoding?: string;
}

export interface HarRequest {
    method: string;
    url: string;
    httpVersion: string;
    headers: HarHeader[];
    queryString: HarQueryParam[];
    cookies: unknown[];
    headersSize: number;
    bodySize: number;
    postData?: HarPostData;
}

export interface HarResponse {
    status: number;
    statusText: string;
    httpVersion: string;
    headers: HarHeader[];
    cookies: unknown[];
    content: HarContent;
    redirectURL: string;
    headersSize: number;
    bodySize: number;
}

export interface HarTimings {
    blocked: number;
    dns: number;
    connect: number;
    ssl: number;
    send: number;
    wait: number;
    receive: number;
}

export interface HarMeta {
    requestId: string;
    protocol?: string;
    hasResponse?: boolean;
    isFinished?: boolean;
    isHttpError: boolean;
}

export interface HarEntry {
    startedDateTime?: string;
    request: HarRequest;
    response: HarResponse;
    cache: Record<string, never>;
    timings: HarTimings;
    time: number;
    // custom extension
    _meta: HarMeta;
    _resourceType: string;
    _initiator?: any;
    _webSocketMessages?: WebSocketMessage[];
}

export interface HarCreator {
    name: string;
    version: string;
}

export interface HarLog {
    version: string;
    creator: HarCreator;
    entries: HarEntry[];
}

export interface HarFile {
    log: HarLog;
}