# koa-http-proxy
Koa HTTP proxy middleware powered by [http-party/node-http-proxy](https://github.com/http-party/node-http-proxy).

## Installation

```shell
npm install --save @erwinv/koa-http-proxy
```

## Usage

```typescript
import { KoaHttpProxy } from '@erwinv/koa-http-proxy'

import { default as Koa, Middleware } from 'koa'

new Koa()
  .use(KoaHttpProxy(process.env.PROXY_TARGET, {
    xfwd: true,
    changeOrigin: true,
    followRedirects: true,
    proxyTimeout: 60 * 1000,
  }))
  .listen(process.env.PORT)
```
