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
}

export interface UDPOutbound {
  write: CallableFunction
}

export interface Config {
  type: string,
  name: string,
  server: string,
  port: number,
  uuid?: string,
  password?: string,
  alterId?: number,
  cipher?: string,
  tls?: boolean,
  "skip-cert-verify"?: boolean,
  servername?: string,
  network: string,
  path: string,
  host?: string,
  alpn?: string,
  fp?: string,
  "ws-opts"?: WSOpts,
  udp?: boolean,
  obfs?: string,
  protocol?: string,
  "protocol-param"?: string,
  "obfs-param"?: string,
  tfo?: string,
  merged?: boolean,
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
