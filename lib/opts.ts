import _ from 'lodash'
import { ServerOptions as ProxyOpts } from 'http-proxy'

const supportedOpts = [
  'target',
  'forward', // https://github.com/http-party/node-http-proxy/issues/773
  'agent',
  'ssl',
  // 'ws',
  'xfwd',
  'secure',
  'toProxy',
  'prependPath',
  'ignorePath',
  'localAddress',
  'changeOrigin',
  'preserveHeaderKeyCase',
  'auth',
  'hostRewrite',
  'autoRewrite',
  'protocolRewrite',
  'cookieDomainRewrite',
  'cookiePathRewrite',
  'headers',
  'proxyTimeout',
  'timeout',
  'followRedirects',
  // 'selfHandleResponse',
  'buffer',
] as const

export type MiddlewareOpts = Pick<ProxyOpts, typeof supportedOpts[number]>
export type InitOpts = Required<Pick<MiddlewareOpts, 'target'>> & Omit<MiddlewareOpts, 'target' | 'buffer'>
export type UnsupportedOpts = Record<string, any>

export function partitionSupportedOpts(opts?: MiddlewareOpts & UnsupportedOpts): readonly [MiddlewareOpts, UnsupportedOpts] {
  return [
    _.pick(opts, ...supportedOpts),
    _.omit(opts, ...supportedOpts),
  ] as const
}
