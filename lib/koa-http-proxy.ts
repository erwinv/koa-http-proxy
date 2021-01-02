import _ from 'lodash'
import { OutgoingMessage, ServerResponse } from 'http'
import { PassThrough, Readable } from 'stream'

import { Middleware, Request, Response, DefaultState } from 'koa'
import { createProxy } from 'http-proxy'

import {
  MiddlewareOpts,
  InitOpts,
  UnsupportedOpts,
  partitionSupportedOpts,
} from './opts'

const _isNotNil = _.negate(_.isNil)

export interface StateWithProxyOpts extends DefaultState {
  // opts that may be set dynamically at runtime (per request context)
  proxyOpts?: MiddlewareOpts & UnsupportedOpts
}

export function HttpProxyMiddleware(opts: InitOpts, bufferRespBody = false): Middleware<StateWithProxyOpts> {
  const proxy = createProxy(opts) // opts set at init/start-up

  return async (ctx, next) => {
    const [opts, unsupportedOpts] = partitionSupportedOpts(ctx.state.proxyOpts)

    ctx.assert(_.isEmpty(unsupportedOpts), 500, `Unsupported proxy options: ${_.keys(unsupportedOpts)}`)

    await new Promise((resolve, reject) => {
      const reqBodyAdapter = maybeRestreamRequestBody(ctx.request)
      const resAdapter = makeProxyResponseAdapter(ctx.response, resolve)

      const runtimeOpts = _.pickBy<MiddlewareOpts>({
        ...opts,
        buffer: reqBodyAdapter,
      }, _isNotNil)

      proxy.web(ctx.req, resAdapter, runtimeOpts, reject)
    })

    if (bufferRespBody) {
      await bufferResponseBody(ctx.response)
    }

    return next()
  }
}

interface RequestWithAlreadyParsedBody extends Request {
  rawBody?: string
  body?: string | object
}

function maybeRestreamRequestBody(request: RequestWithAlreadyParsedBody): Readable | undefined {
  if (_.isString(request.rawBody)) {
    // this could very easily cause bugs if API implementers
    // (1) use a request body parser; AND
    // (2) modify/override the parsed body WITHOUT updating the rawBody
    // still we prefer the rawBody over the parsed body to avoid calling JSON.stringify as much as possible
    return Readable.from(request.rawBody)
  }

  if (_.isNil(request.body)) {
    return undefined
  }

  const reqBodyStr = _.isString(request.body) ? request.body : JSON.stringify(request.body)
  return Readable.from(reqBodyStr)
}

function makeProxyResponseAdapter(response: Response, done: (v?: any) => void): ServerResponse {
  const resAdapter = new OutgoingMessage() as ServerResponse

  resAdapter.on('pipe', (proxyRes) => {
    proxyRes.unpipe(resAdapter)

    response.status = resAdapter.statusCode
    response.message = resAdapter.statusMessage

    for (const [headerName, headerVal] of Object.entries(resAdapter.getHeaders())) {
      if (_.isNil(headerVal)) {
        continue
      }
      response.set(headerName, _.isNumber(headerVal) ? _.toString(headerVal) : headerVal)
    }

    response.body = proxyRes.pipe(new PassThrough())

    done()
  })

  return resAdapter
}

async function bufferResponseBody(response: Response) {
  const responseBodyStream = response.body as PassThrough

  const bufferedResponseBody = await new Promise<Buffer>((resolve, reject) => {
    let chunks = [] as Uint8Array[]

    responseBodyStream
      .on('error', reject)
      .on('data', chunk => chunks.push(chunk))
      .on('end', () => {
        resolve(Buffer.concat(chunks))
      })
  })

  response.body = bufferedResponseBody
}
