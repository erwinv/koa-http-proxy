import { OutgoingMessage, ServerResponse } from 'http'
import { PassThrough } from 'stream'

import { Middleware, Response } from 'koa'
import { createProxy, ServerOptions } from 'http-proxy'

const hardcodedOpts: ServerOptions = {
  ws: false,  // websockets not supported
  target: '', // explicitly set through 1st arg to the middleware factory function
}
const unsupportedOpts = Object.keys(hardcodedOpts)

type SupportedOpts = Omit<ServerOptions, keyof typeof hardcodedOpts>

const defaultOpts: SupportedOpts = {
  xfwd: true,
}

export default function (target: URL, opts: SupportedOpts = {}): Middleware {
  const proxy = createProxy({
    ...hardcodedOpts,
    ...defaultOpts,
    ...opts,
    target,
  })

  return async (ctx, next) => {
    const opts = ctx.state.proxyOpts as ServerOptions | undefined

    const illegalOpts = Object.keys(opts ?? {}).filter(opt => unsupportedOpts.includes(opt))
    ctx.assert(illegalOpts.length === 0, 500, `Illegal proxy options: ${illegalOpts}`)

    await new Promise((resolve, reject) => {
      const resAdapter = makeProxyResponseAdapter(ctx.response, resolve)
      proxy.web(ctx.req, resAdapter, opts, reject)
    })

    return next()
  }
}

function makeProxyResponseAdapter(response: Response, done: (v?: unknown) => void): ServerResponse {
  const resAdapter: ServerResponse = new OutgoingMessage() as any

  resAdapter.on('pipe', (proxyRes) => {
    proxyRes.unpipe(resAdapter)

    response.status = resAdapter.statusCode
    response.message = resAdapter.statusMessage
    Object.entries(resAdapter.getHeaders())
      .forEach(([headerName, headerVal]) => response.set(headerName, headerVal as string))
    response.body = proxyRes.pipe(new PassThrough())

    done()
  })

  return resAdapter
}
