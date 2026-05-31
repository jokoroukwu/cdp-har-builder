# cdp-har-builder

A lightweight TypeScript library for building HAR files from Chromium DevTools Protocol (CDP) network events.

The library collects HTTP and WebSocket traffic and converts it into HAR 1.2-compatible objects.
These objects can then be serialized to JSON, written to HAR files, and imported into tools that support the HAR format.

## Features

- HAR 1.2 generation
- WebSocket support
- Chromium DevTools compatible
- No external dependencies

## Installation

```bash
npm install cdp-har-builder
```
## Basic usage

```typescript
import { writeFile } from "node:fs/promises";
import {
    CdpNetworkRecorder,
    CdpTrafficInterceptor,
    HarBuilder,
} from "cdp-har-builder";

// `cdpSession` is any CDP-compatible session with:
// send(method, params)
// on(event, handler)
// off(event, handler) optional

const recorder = new CdpNetworkRecorder();
const interceptor = new CdpTrafficInterceptor(cdpSession, recorder);

await interceptor.subscribe();
interceptor.acceptNewRequests();

// ...

// discard new requests when you're ready to export data
interceptor.discardNewRequests();
// give pending requests some time to complete
await recorder.waitForPendingRequests();

const har = new HarBuilder().build(recorder.getCompletedRequests());

await writeFile(
    "network.har",
    JSON.stringify(har, null, 2),
    "utf-8",
);
```