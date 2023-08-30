import { connect } from 'cloudflare:sockets'
import { Stringify } from "./helpers"
import { RemoteSocketWrapper, Env } from "./interfaces"

const WS_READY_STATE_OPEN = 1
const WS_READY_STATE_CLOSING = 2

export async function VlessOverWSHandler(request: Request, env: Env) {
    const uuid: string = await env.settings.get("UUID") || "d342d11e-d424-4583-b36e-524ab1f0afa4"
	console.log(uuid)
	const [client, webSocket]: Array<WebSocket> = Object.values(new WebSocketPair)

	webSocket.accept()

	var address: string = ""
	var portWithRandomLog: string = ""
	const earlyDataHeader: string = request.headers.get("sec-websocket-protocol") || ""
	const readableWebSocketStream = MakeReadableWebSocketStream(webSocket, earlyDataHeader)

	var remoteSocketWapper: RemoteSocketWrapper = {
		value: null,
	}
	var udpStreamWrite: CallableFunction | null = null
	var isDns = false

	readableWebSocketStream.pipeTo(new WritableStream({
		async write(chunk, controller) {
			if (isDns && udpStreamWrite) {
				return udpStreamWrite(chunk)
			}
			if (remoteSocketWapper.value) {
				const writer = remoteSocketWapper.value.writable.getWriter()
				await writer.write(chunk)
				writer.releaseLock()
				return
			}

			const {
				hasError,
				message,
				portRemote = 443,
				addressRemote = '',
				rawDataIndex,
				vlessVersion = new Uint8Array([0, 0]),
				isUDP,
			} = ProcessVlessHeader(chunk, uuid)
			address = addressRemote
			portWithRandomLog = `${portRemote}--${Math.random()} ${isUDP ? 'udp ' : 'tcp '} `
			if (hasError) {
				throw new Error(message)
			}

            if (isUDP) {
				if (portRemote === 53) {
					isDns = true
				} else {
					throw new Error('UDP proxy only enable for DNS which is port 53')
				}
			}
			const vlessResponseHeader: Uint8Array = new Uint8Array([vlessVersion[0], 0])
			const rawClientData = chunk.slice(rawDataIndex)

			if (isDns) {
				const { write } = await HandleUDPOutBound(webSocket, vlessResponseHeader)
				udpStreamWrite = write
				udpStreamWrite(rawClientData)
				return
			}
			HandvarCPOutBound(remoteSocketWapper, addressRemote, portRemote, rawClientData, webSocket, vlessResponseHeader)
		}
	})).catch((err) => {
		//
	})

	return new Response(null, {
		status: 101,
		webSocket: client,
	})
}

function MakeReadableWebSocketStream(webSocketServer: WebSocket, earlyDataHeader: string) {
	var readableStreamCancel: boolean = false
	const stream: ReadableStream = new ReadableStream({
		start(controller) {
			webSocketServer.addEventListener('message', (event) => {
				if (readableStreamCancel) {
					return
				}
				const message: string | ArrayBuffer = event.data
				controller.enqueue(message)
			})

			webSocketServer.addEventListener('close', () => {
				SafeCloseWebSocket(webSocketServer)
				if (readableStreamCancel) {
					return
				}
				controller.close()
			}
			)
			webSocketServer.addEventListener('error', (err) => {
				controller.error(err)
			}
			)
			// for ws 0rtt
			const { earlyData, error } = Base64ToArrayBuffer(earlyDataHeader)
			if (error) {
				controller.error(error)
			} else if (earlyData) {
				controller.enqueue(earlyData)
			}
		},
		cancel(reason) {
			if (readableStreamCancel) {
				return
			}
			readableStreamCancel = true
			SafeCloseWebSocket(webSocketServer)
		}
	})

	return stream
}

function ProcessVlessHeader(vlessBuffer: ArrayBuffer, uuid: string) {
	if (vlessBuffer.byteLength < 24) {
		return {
			hasError: true,
			message: 'Invalid data',
		}
	}
	const version: Uint8Array = new Uint8Array(vlessBuffer.slice(0, 1))
	var isValidUser: boolean = false
	var isUDP: boolean = false
	if (Stringify(new Uint8Array(vlessBuffer.slice(1, 17))) === uuid) {
		isValidUser = true
	}
	if (!isValidUser) {
		return {
			hasError: true,
			message: 'Invalid user',
		}
	}

	const optLength: number = new Uint8Array(vlessBuffer.slice(17, 18))[0]

	const command: number = new Uint8Array(
		vlessBuffer.slice(18 + optLength, 18 + optLength + 1)
	)[0]

	if (command === 1) {
	} else if (command === 2) {
		isUDP = true
	} else {
		return {
			hasError: true,
			message: `Command ${command} is not support, command 01-tcp, 02-udp, 03-mux`,
		}
	}
	const portIndex: number = 18 + optLength + 1
	const portBuffer: ArrayBuffer = vlessBuffer.slice(portIndex, portIndex + 2)
	const portRemote: number = new DataView(portBuffer).getUint16(0)

	var addressIndex: number = portIndex + 2
	const addressBuffer: Uint8Array = new Uint8Array(
		vlessBuffer.slice(addressIndex, addressIndex + 1)
	)

	const addressType: number = addressBuffer[0]
	var addressLength: number = 0
	var addressValueIndex: number = addressIndex + 1
	var addressValue: string = ""
	switch (addressType) {
		case 1:
			addressLength = 4
			addressValue = new Uint8Array(
				vlessBuffer.slice(addressValueIndex, addressValueIndex + addressLength)
			).join(".")
			break
		case 2:
			addressLength = new Uint8Array(
				vlessBuffer.slice(addressValueIndex, addressValueIndex + 1)
			)[0]
			addressValueIndex += 1
			addressValue = new TextDecoder().decode(
				vlessBuffer.slice(addressValueIndex, addressValueIndex + addressLength)
			)
			break
		case 3:
			addressLength = 16
			const dataView = new DataView(
				vlessBuffer.slice(addressValueIndex, addressValueIndex + addressLength)
			)
			const ipv6: Array<string> = []
			for (var i = 0; i < 8; i++) {
				ipv6.push(dataView.getUint16(i * 2).toString(16))
			}
			addressValue = ipv6.join(":")
			break
		default:
			return {
				hasError: true,
				message: `invild  addressType is ${addressType}`,
			}
	}
	if (!addressValue) {
		return {
			hasError: true,
			message: `addressValue is empty, addressType is ${addressType}`,
		}
	}

	return {
		hasError: false,
		addressRemote: addressValue,
		addressType,
		portRemote,
		rawDataIndex: addressValueIndex + addressLength,
		vlessVersion: version,
		isUDP,
	}
}

async function HandleUDPOutBound(webSocket: WebSocket, vlessResponseHeader: ArrayBuffer) {

	var isVlessHeaderSent = false
	const transformStream = new TransformStream({
		transform(chunk, controller) {
			for (var index: number = 0; index < chunk.byteLength;) {
				const lengthBuffer = chunk.slice(index, index + 2)
				const udpPakcetLength = new DataView(lengthBuffer).getUint16(0)
				const udpData = new Uint8Array(
					chunk.slice(index + 2, index + 2 + udpPakcetLength)
				)
				index = index + 2 + udpPakcetLength
				controller.enqueue(udpData)
			}
		}
	})

	// only handle dns udp for now
	transformStream.readable.pipeTo(new WritableStream({
		async write(chunk: any) {
			const resp = await fetch('https://1.1.1.1/dns-query',
				{
					method: 'POST',
					headers: {
						'content-type': 'application/dns-message',
					},
					body: chunk,
				})
			const dnsQueryResult: ArrayBuffer = await resp.arrayBuffer()
			const udpSize: number = dnsQueryResult.byteLength
			const udpSizeBuffer: Uint8Array = new Uint8Array([(udpSize >> 8) & 0xff, udpSize & 0xff])
			if (webSocket.readyState === WS_READY_STATE_OPEN) {
				if (isVlessHeaderSent) {
					webSocket.send(await new Blob([udpSizeBuffer, dnsQueryResult]).arrayBuffer())
				} else {
					webSocket.send(await new Blob([vlessResponseHeader, udpSizeBuffer, dnsQueryResult]).arrayBuffer())
					isVlessHeaderSent = true
				}
			}
		}
	})).catch((error) => { })

	const writer: WritableStreamDefaultWriter<Uint8Array> = transformStream.writable.getWriter()
	return {
		write(chunk: Uint8Array) {
			writer.write(chunk)
		}
	}
}

async function HandvarCPOutBound(remoteSocket: RemoteSocketWrapper, addressRemote: string, portRemote: number, rawClientData: Uint8Array, webSocket: WebSocket, vlessResponseHeader: Uint8Array) {
	async function connectAndWrite(address: string, port: number) {
		const tcpSocket: Socket = connect({
			hostname: address,
			port: port,
		})
		remoteSocket.value = tcpSocket
		const writer: WritableStreamDefaultWriter<Uint8Array> = tcpSocket.writable.getWriter()
		await writer.write(rawClientData)
		writer.releaseLock()
		return tcpSocket
	}

	async function retry() {
		const tcpSocket: Socket = await connectAndWrite(addressRemote, portRemote)
		tcpSocket.closed.catch((error: any) => { }).finally(() => {
			SafeCloseWebSocket(webSocket)
		})
		RemoteSocketToWS(tcpSocket, webSocket, vlessResponseHeader, null)
	}

	const tcpSocket: Socket = await connectAndWrite(addressRemote, portRemote)
	RemoteSocketToWS(tcpSocket, webSocket, vlessResponseHeader, retry)
}

async function RemoteSocketToWS(remoteSocket: Socket, webSocket: WebSocket, vlessResponseHeader: ArrayBuffer, retry: (() => Promise<void>) | null) {
	var vlessHeader: ArrayBuffer | null = vlessResponseHeader
	var hasIncomingData: boolean = false
	await remoteSocket.readable
		.pipeTo(
			new WritableStream({
				async write(chunk: Uint8Array, controller: WritableStreamDefaultController) {
					hasIncomingData = true
					if (webSocket.readyState !== WS_READY_STATE_OPEN) {
						controller.error("webSocket.readyState is not open, maybe close")
					}
					if (vlessHeader) {
						webSocket.send(await new Blob([vlessHeader, chunk]).arrayBuffer())
						vlessHeader = null
					} else {
						webSocket.send(chunk)
					}
				},
				abort(reason: any) {
					console.error("remoteConnection!.readable abort", reason)
				},
			})
		)
		.catch((error) => {
			console.error("remoteSocketToWS has exception ", error.stack || error)
			SafeCloseWebSocket(webSocket)
		})

	if (hasIncomingData === false && retry) {
		retry()
	}
}

function SafeCloseWebSocket(socket: WebSocket) {
	try {
		if (socket.readyState === WS_READY_STATE_OPEN || socket.readyState === WS_READY_STATE_CLOSING) {
			socket.close()
		}
	} catch (error) { }
}

function Base64ToArrayBuffer(base64Str: string) {
	if (!base64Str) {
		return {
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
            error
        }
	}
}
