export interface RemoteSocketWrapper {
  value: Socket | null;
}

export interface CustomArrayBuffer {
  earlyData: ArrayBufferLike | null,
  error: any
}

export interface VlessHeader {
  hasError: boolean,
  message: string | undefined,
  addressRemote: string,
  addressType: number,
  portRemote: number,
  rawDataIndex: number,
  vlessVersion: Uint8Array,
  isUDP: boolean,
  isMUX: boolean,
}

export interface UDPOutbound {
  write: CallableFunction
}

export interface Config {
  configType: string,
  remarks: string,
  address: string,
  port: number,
  uuid?: string,
  type?: string,
  password?: string,
  alterId?: number,
  cipher?: string,
  security?: string,
  encryption?: string,
  tls?: string,
  sni?: string,
  network: string,
  path: string,
  host?: string,
  alpn?: string,
  fp?: string,
  obfs?: string,
  protocol?: string,
  fragment?: string,
  tfo?: string,
  pbk?: string,
  spx?: string,
  sid?: string,
  headerType?: string,
  flow?: string,
  serviceName?: string,
  seed?: string,
  quicSecurity?: string,
  key?: string,
  mode?: string,
  authority?: string,
  merged?: boolean,
}

export interface ClashConfig {
  name: string,
  type: string,
  server: string,
  port: number,
  uuid?: string,
  password?: string,
  alterId?: number,
  cipher?: string,
  security?: string,
  encryption?: string,
  tls?: boolean,
  sni?: string,
  network: string,
  path: string,
  host?: string,
  alpn?: string,
  fp?: string,
  obfs?: string,
  protocol?: string,
  fragment?: string,
  tfo?: string,
  pbk?: string,
  spx?: string,
  sid?: string,
  headerType?: string,
  flow?: string,
  serviceName?: string,
  seed?: string,
  quicSecurity?: string,
  key?: string,
  mode?: string,
  authority?: string,
  merged?: boolean,
  "skip-cert-verify"?: boolean,
}

export interface WSOpts {
  path: string,
  headers: WSHeaders,
}

export interface WSHeaders {
  Host: string,
}

export interface Env {
  settings: KVNamespace
}
