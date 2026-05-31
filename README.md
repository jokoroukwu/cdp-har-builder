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