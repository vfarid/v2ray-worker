import { connect } from 'cloudflare:sockets'
import { GetTrojanConfig, MuddleDomain, getSHA224Password, getUUID } from "./helpers"
import { cfPorts, proxiesUri } from "./variables"
import { RemoteSocketWrapper, CustomArrayBuffer, VlessHeader, UDPOutbound, Config, Env } from "./interfaces"
import { encodeBase64 } from 'bcryptjs'

const WS_READY_STATE_OPEN: number = 1
const WS_READY_STATE_CLOSING: number = 2
let proxyIP: string = ""
let proxyList: Array<string> = []
let filterCountries: string = ""
let countries: Array<string> = []

export async function GetTrojanConfigList(sni: string, addressList: Array<string>, start: number, max: number, env: Env) {
  filterCountries = ""
  proxyList = []
  let configList: Array<Config> = []
  for (let i = 0; i < max; i++) {
    configList.push(GetTrojanConfig(
      i + start,
      getUUID(sni),
      MuddleDomain(sni),
      addressList[Math.floor(Math.random() * addressList.length)],
      cfPorts[Math.floor(Math.random() * cfPorts.length)]
    ))
  }

  return configList
}

export async function TrojanOverWSHandler(request: Request, sni: string, env: Env) {
  const sha224Password = getSHA224Password(getUUID(sni))
  const [client, webSocket]: Array<WebSocket> = Object.values(new WebSocketPair)
  webSocket.accept()

  let address: string = ""
  const earlyDataHeader: string = request.headers.get("sec-websocket-protocol") || ""
  const readableWebSocketStream = MakeReadableWebSocketStream(webSocket, earlyDataHeader)

  let remoteSocketWapper: RemoteSocketWrapper = {
    value: null,
  }

  readableWebSocketStream.pipeTo(new WritableStream({
    async write(chunk, controller) {
      if (remoteSocketWapper.value) {
        const writer = remoteSocketWapper.value.writable.getWriter();
        await writer.write(chunk);
        writer.releaseLock();
        return;
      }
      const {
        hasError,
        message,
        portRemote = 443,
        addressRemote = "",
        rawClientData,
      } = await ParseTrojanHeader(chunk, sha224Password);
      address = addressRemote;
      if (hasError) {
        throw new Error(message);
      }
      HandleTCPOutbound(remoteSocketWapper, addressRemote, portRemote, rawClientData, webSocket, env);
    },
  })).catch((err) => { });
  return new Response(null, {
    status: 101,
    webSocket: client
  });
}

async function ParseTrojanHeader(buffer: ArrayBuffer, sha224Password: string) {
    if (buffer.byteLength < 56) {
        return {
            hasError: true,
            message: "invalid data"
        };
    }
    let crLfIndex: number = 56;
    if (new Uint8Array(buffer.slice(56, 57))[0] !== 0x0d || new Uint8Array(buffer.slice(57, 58))[0] !== 0x0a) {
        return {
            hasError: true,
            message: "invalid header format (missing CR LF)"
        };
    }
    const password: string = new TextDecoder().decode(buffer.slice(0, crLfIndex));
    if (password !== sha224Password) {
        return {
            hasError: true,
            message: "invalid password"
        };
    }

    const socks5DataBuffer: ArrayBuffer = buffer.slice(crLfIndex + 2);
    if (socks5DataBuffer.byteLength < 6) {
        return {
            hasError: true,
            message: "invalid SOCKS5 request data"
        };
    }

    const view: DataView = new DataView(socks5DataBuffer);
    const cmd: number = view.getUint8(0);
    if (cmd !== 1) {
        return {
            hasError: true,
            message: "unsupported command, only TCP (CONNECT) is allowed"
        };
    }

    const atype: number = view.getUint8(1);
    let addressLength: number = 0;
    let addressIndex: number = 2;
    let address: string = "";
    switch (atype) {
        case 1:
            addressLength = 4;
            address = new Uint8Array(
              socks5DataBuffer.slice(addressIndex, addressIndex + addressLength)
            ).join(".");
            break;
        case 3:
            addressLength = new Uint8Array(
              socks5DataBuffer.slice(addressIndex, addressIndex + 1)
            )[0];
            addressIndex += 1;
            address = new TextDecoder().decode(
              socks5DataBuffer.slice(addressIndex, addressIndex + addressLength)
            );
            break;
        case 4:
            addressLength = 16;
            const dataView = new DataView(socks5DataBuffer.slice(addressIndex, addressIndex + addressLength));
            const ipv6 = [];
            for (let i = 0; i < 8; i++) {
                ipv6.push(dataView.getUint16(i * 2).toString(16));
            }
            address = ipv6.join(":");
            break;
        default:
            return {
                hasError: true,
                message: `invalid addressType is ${atype}`
            };
    }

    if (!address) {
        return {
            hasError: true,
            message: `address is empty, addressType is ${atype}`
        };
    }

    const portIndex: number = addressIndex + addressLength;
    const portBuffer: ArrayBuffer = socks5DataBuffer.slice(portIndex, portIndex + 2);
    const portRemote: number = new DataView(portBuffer).getUint16(0);
    return {
        hasError: false,
        addressRemote: address,
        portRemote,
        rawClientData: socks5DataBuffer.slice(portIndex + 4),
    };
}

async function HandleTCPOutbound(remoteSocket: RemoteSocketWrapper, addressRemote: string, portRemote: number, rawClientData: ArrayBuffer | undefined, webSocket: WebSocket, env: Env): Promise<void> {
  const maxRetryCount = 5
  let retryCount = 0;
  
  async function connectAndWrite(address: string, port: number) {
    const socketAddress: SocketAddress = {
      hostname: address,
      port: port,
    }
    const tcpSocket: Socket = connect(socketAddress)
    remoteSocket.value = tcpSocket
    // console.log(`connected to ${address}:${port}`);
    const writer: WritableStreamDefaultWriter<ArrayBuffer> = tcpSocket.writable.getWriter()
    await writer.write(rawClientData)
    writer.releaseLock()
    return tcpSocket
  }

  async function retry() {
    retryCount++
    if (retryCount > maxRetryCount) {
      return
    }

    if (!proxyList.length) {
      countries = (await env.settings.get("Countries"))?.split(",").filter(t => t.trim().length > 0) || []        
      proxyList = await fetch(proxiesUri).then(r => r.text()).then(t => t.trim().split("\n").filter(t => t.trim().length > 0))
      if (countries.length > 0) {
        proxyList = proxyList.filter(t => {
          const arr = t.split(",")
          if (arr.length > 0) {
            return countries.includes(arr[1])
          }
        })
      }
      proxyList = proxyList.map(ip => ip.split(",")[0])
    }
    if (proxyList.length > 0) {
      proxyIP = proxyList[Math.floor(Math.random() * proxyList.length)]
      const tcpSocket: Socket = await connectAndWrite(proxyIP, portRemote)
      RemoteSocketToWS(tcpSocket, webSocket, retry)
    }
  }

  const tcpSocket: Socket = await connectAndWrite(addressRemote, portRemote)
  RemoteSocketToWS(tcpSocket, webSocket, retry)
}

function MakeReadableWebSocketStream(webSocketServer: WebSocket, earlyDataHeader: string): ReadableStream {
  let readableStreamCancel = false;
    const stream = new ReadableStream({
        start(controller) {
            webSocketServer.addEventListener("message", (event) => {
                if (readableStreamCancel) {
                    return;
                }
                const message = event.data;
                controller.enqueue(message);
            });
            webSocketServer.addEventListener("close", () => {
                SafeCloseWebSocket(webSocketServer);
                if (readableStreamCancel) {
                    return;
                }
                controller.close();
            });
            webSocketServer.addEventListener("error", (err) => {
                controller.error(err);
            });
            const { earlyData, error } = Base64ToArrayBuffer(earlyDataHeader);
            if (error) {
                controller.error(error);
            } else if (earlyData) {
                controller.enqueue(earlyData);
            }
        },
        pull(controller) {},
        cancel(reason) {
            if (readableStreamCancel) {
                return;
            }
            readableStreamCancel = true;
            SafeCloseWebSocket(webSocketServer);
        }
    });
    return stream;
}

async function RemoteSocketToWS(remoteSocket: Socket, webSocket: WebSocket, retry: (() => Promise<void>) | null): Promise<void> {
  let hasIncomingData: boolean = false
  await remoteSocket.readable
    .pipeTo(
      new WritableStream({
        async write(chunk: Uint8Array, controller: WritableStreamDefaultController) {
          try {
            hasIncomingData = true
            if (webSocket.readyState !== WS_READY_STATE_OPEN) {
              controller.error("webSocket.readyState is not open, maybe close")
            }
            webSocket.send(chunk)
          } catch (e) { }
        },
        abort(reason: any) {
          // console.error("remoteConnection!.readable abort", reason)
        },
      })
    )
    .catch((error) => {
      // console.error("RemoteSocketToWS has exception ", error.stack || error)
      SafeCloseWebSocket(webSocket)
    })

  if (hasIncomingData === false && retry) {
    retry()
  }
}

function IsValidSHA224(hash: string): boolean {
    const sha224Regex = /^[0-9a-f]{56}$/i;
    return sha224Regex.test(hash);
}

function Base64ToArrayBuffer(base64Str: string): CustomArrayBuffer {
  if (!base64Str) {
    return {
      earlyData: null,
      error: null
    }
  }
  try {
    base64Str = base64Str.replace(/-/g, '+').replace(/_/g, '/')
    const decode: string = atob(base64Str)
    const arryBuffer: Uint8Array = Uint8Array.from(decode, (c) => c.charCodeAt(0))
    return {
      earlyData: arryBuffer.buffer,
      error: null
    }
  } catch (error) {
    return {
      earlyData: null,
      error
    }
  }
}

function SafeCloseWebSocket(socket: WebSocket): void {
  try {
    if (socket.readyState === WS_READY_STATE_OPEN || socket.readyState === WS_READY_STATE_CLOSING) {
      socket.close()
    }
  } catch (error) { }
}
