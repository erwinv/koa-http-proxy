# koa-http-proxy
Koa HTTP proxy middleware powered by [http-party/node-http-proxy](https://github.com/http-party/node-http-proxy).

## Installation

```shell
npm install --save @erwinv/koa-http-proxy
```

## Usage

```typescript
import Koa from 'koa'
import mount from 'koa-mount'
import { KoaHttpProxy } from '@erwinv/koa-http-proxy'

const proxy = KoaHttpProxy('https://www.example.com', {
  xfwd: true,
  changeOrigin: true,
  followRedirects: true,
  proxyTimeout: 60 * 1000,
})

new Koa()
  .use(mount('/proxy/example', proxy))
  .listen(process.env.PORT)
```

## Options

### Inherited from third-party dependency

These options are the same as those of [http-party/node-http-proxy](https://github.com/http-party/node-http-proxy#options) with the following exceptions:

- `target`: same type but is moved outside of the options object and should be passed as first argument to the middleware factory function instead
- `ws`: WebSockets not supported
- `selfHandleResponse`: not supported (middleware internals depends on this being always false)

### Own

- `bufferResponseBody`: boolean, default: false - if true, the proxied response will be buffered in full before sending it to client (useful for proxies that need to modify/decorate the JSON response body for example). Otherwise (if false), the proxied response is streamed directly to the client. Note: the buffered response body is a `Buffer` and may need to be decompressed (depending on `Content-Encoding`), stringified, and/or parsed (depending on `Content-Type`) before it can be read or modified.
