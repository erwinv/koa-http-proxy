import { OutgoingMessage, ServerResponse } from 'http'
import { PassThrough } from 'stream'

import { Middleware, Response } from 'koa'
import { createProxy } from 'http-proxy'

function makeProxyResponseAdapter(response: Response, done: (v?: unknown) => void): ServerResponse {
  const resAdapter: ServerResponse = new OutgoingMessage() as any

  resAdapter.on('pipe', (proxyRes) => {
    proxyRes.unpipe(resAdapter)

    // copy status code
    response.status = resAdapter.statusCode

    // copy status message
    if (resAdapter.statusMessage) {
      response.message = resAdapter.statusMessage
    }

    // copy headers
    for (const [headerName, headerval] of Object.entries(resAdapter.getHeaders())) {
      if (headerval) {
        if (typeof headerval == 'number') {
          response.set(headerName, headerval.toString())
        } else {
          response.set(headerName, headerval)
        }
      }
    }

    // stream body
    response.body = proxyRes.pipe(new PassThrough())
    done()
  })

  return resAdapter
}

export default function(target: URL): Middleware {
  const proxy = createProxy({ target })

  return async(ctx, next) => {
    await new Promise((resolve, reject) => {
      const resAdapter = makeProxyResponseAdapter(ctx.response, resolve)
      proxy.web(ctx.req, resAdapter, reject)
    })

    return next()
  }
}

