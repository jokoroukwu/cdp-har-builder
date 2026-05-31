import type {Headers, RequestState} from "./../recorder/CdpNetworkTypes.js";
import type {HarEntry, HarFile, HarHeader, HarQueryParam, HarTimings} from "./HarTypes.js";

export class HarBuilder {
    static readonly UNKNOWN_TIMING: number = -1;

    build(requests: RequestState[]): HarFile {
        const harEntries: HarEntry[] = requests.map(rq => this.toHarEntry(rq));
        return {
            log: {
                version: "1.2",
                creator: {
                    name: "cdp-har-builder",
                    version: "0.1.0",
                },
                entries: harEntries
            },
        };
    }

    private toHarEntry(req: RequestState): HarEntry {
        const httpVersion: string = this.mapProtocolToHar(req.protocol);
        return {
            startedDateTime: req.startedDateTime,
            time: this.calculateHarTime(req),
            request: {
                method: req.method ?? "",
                url: req.url ?? "",
                httpVersion,
                headers: this.toHarHeaders(req.requestHeaders),
                queryString: this.toHarQueryParams(req.url),
                cookies: [],
                headersSize: -1,
                bodySize: req.postData?.length ?? 0,
                postData: req.postData
                    ? {
                        mimeType: this.getHeader(req.requestHeaders, "content-type") ?? "",
                        text: req.postData,
                    }
                    : undefined,
            },
            response: {
                status: req.status ?? 0,
                statusText: req.statusText ?? "",
                httpVersion,
                headers: this.toHarHeaders(req.responseHeaders),
                cookies: [],
                content: {
                    size: req.responseBody?.length ?? 0,
                    mimeType: req.mimeType ?? "",
                    text: req.responseBody,
                    encoding: req.responseBodyBase64Encoded ? "base64" : undefined,
                },
                redirectURL: "",
                headersSize: -1,
                bodySize: req.responseBody?.length ?? -1,
            },
            cache: {},
            timings: this.calculateHarTimings(req),
            _resourceType: this.mapResourceTypeToDevTools(req.resourceType),
            _initiator: this.toHarInitiator(req.initiator),
            _meta: {
                requestId: req.requestId,
                protocol: req.protocol,
                hasResponse: req.hasResponse,
                isFinished: req.isFinished,
                isHttpError: req.status !== undefined && req.status >= 400,
            },
            _webSocketMessages: req.webSocketMessages.length > 0 ? req.webSocketMessages : undefined,
        };
    }

    private toHarQueryParams(url?: string): HarQueryParam[] {
        if (!url) {
            return [];
        }
        try {
            const parsedUrl: URL = new URL(url);
            return [...parsedUrl.searchParams.entries()].map(([name, value]) => ({
                name,
                value,
            }));
        } catch {
            return [];
        }
    }

    private toHarHeaders(headers: Headers = {}): HarHeader[] {
        const result: HarHeader[] = [];
        for (const [name, value] of Object.entries(headers)) {
            result.push({name, value});
        }
        return result;
    }

    private getHeader(headers: Headers | undefined, name: string,): string | undefined {
        if (!headers) {
            return undefined;
        }
        const targetName: string = name.toLowerCase();
        for (const [headerName, headerValue] of Object.entries(headers)) {
            if (headerName.toLowerCase() === targetName) {
                return headerValue;
            }
        }
        return undefined;
    }

    private mapProtocolToHar(protocol?: string): string {
        switch (protocol) {
            case "http/1.0":
                return "HTTP/1.0";
            case "http/1.1":
                return "HTTP/1.1";
            case "h2":
                return "HTTP/2";
            case "h3":
                return "HTTP/3";
            default:
                return protocol ?? "unknown";
        }
    }

    private mapResourceTypeToDevTools(type?: string): string {
        const actualType: string | undefined = type?.toLowerCase();
        switch (actualType) {
            case "xhr":
            case "fetch":
            case "document":
            case "script":
            case "stylesheet":
            case "image":
            case "font":
            case "websocket":
                return actualType;
            default:
                return "other";
        }
    }

    private calculateHarTime(req: RequestState): number {
        if (!req.requestTimestamp || !req.loadingFinishedTimestamp) {
            return 0;
        }

        return Math.max(
            0,
            Math.round((req.loadingFinishedTimestamp - req.requestTimestamp) * 1000),
        );
    }

    private calculateHarTimings(req: RequestState): HarTimings {
        let wait: number = 0;
        if (req.requestTimestamp && req.responseTimestamp) {
            wait = Math.max(0, Math.round((req.responseTimestamp - req.requestTimestamp) * 1000));
        }

        let receive: number = 0;
        if (req.responseTimestamp && req.loadingFinishedTimestamp) {
            receive = Math.max(0, Math.round((req.loadingFinishedTimestamp - req.responseTimestamp) * 1000));
        }

        return {
            blocked: HarBuilder.UNKNOWN_TIMING,
            dns: HarBuilder.UNKNOWN_TIMING,
            connect: HarBuilder.UNKNOWN_TIMING,
            ssl: HarBuilder.UNKNOWN_TIMING,
            send: 0,
            wait,
            receive,
        };
    }

    private toHarInitiator(initiator?: any): unknown {
        if (!initiator) {
            return undefined;
        }

        return {
            type: initiator.type,
            url: initiator.url,
            lineNumber: initiator.lineNumber,
            columnNumber: initiator.columnNumber,
            stack: initiator.stack
        };
    }
}