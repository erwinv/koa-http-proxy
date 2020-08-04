# koa-http-proxy
Koa HTTP proxy middleware powered by [http-party/node-http-proxy](https://github.com/http-party/node-http-proxy).

## Installation

```shell
npm install --save @erwinv/koa-http-proxy
```

## Usage

```typescript
import { default as Koa } from 'koa'
import {
  KoaHttpProxy as Proxy,
  KoaHttpProxyOpts as ProxyOpts,
} from '@erwinv/koa-http-proxy'

new Koa()
  .use(async (ctx, next) => {
    const authMissing = (ctx.get('Authorization')?.trim() ?? '') === ''

    if (authMissing) {
      ctx.state.proxyOpts = <ProxyOpts>{
        headers: {
          Authorization: `Basic ${process.env.PROXY_AUTH}`,
        },
      }
    }

    return next();
  })
  .use(Proxy(new URL(process.env.PROXY_TARGET), {
    xfwd: process.env.PROXY_TARGET_ISEXTERNAL?.toLowerCase() !== 'true',
    proxyTimeout: 60 * 1000,
  }))
  .listen(process.env.PORT)
```

`KoaHttpProxyOpts` is the `ServerOptions` from `http-party/node-http-proxy` but without the `target` and `ws` properties. TypeScript autocompletion is your friend.

These opts can be passed to the proxy middleware factory function (as a base config), and also via `ctx.state.proxyOpts` (as dynamic config that depends on the proxied request).
