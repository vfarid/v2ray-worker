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

export interface Env {
    settings: KVNamespace
}
