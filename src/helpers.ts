import { UUID } from "crypto";

const byteToHex: Array<string> = [];
for (var i = 0; i < 256; ++i) {
	byteToHex.push((i + 256).toString(16).slice(1));
}

export function GetMultipleRandomElements(arr: Array<any>, num: number): Array<any> {
	var shuffled = arr.sort(() => 0.5 - Math.random())
	return shuffled.slice(0, num)
}

export function IsIp(str: string): boolean {
	try {
		if (str == "" || str == undefined) return false
		if (!/^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])(\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])){2}\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-4])$/.test(str)) {
			return false
		}
		var ls = str.split('.')
		if (ls == null || ls.length != 4 || ls[3] == "0" || parseInt(ls[3]) === 0) {
			return false
		}
		return true
	} catch (e) { }
	return false
}

export function IsValidUUID(uuid: string): boolean {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
}

export function Stringify(arr: Uint8Array, offset: number = 0): UUID {
	const uuid: UUID = UnsafeStringify(arr, offset);
	if (!IsValidUUID(uuid)) {
		throw TypeError("Stringified UUID is invalid");
	}
	return uuid;
}

function UnsafeStringify(arr: Uint8Array, offset = 0) : UUID {
	return `${
		byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]]
	}-${
		byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]]
	}-${
		byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]]
	}-${
		byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]]
	}-${
		byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]
	}`.toLowerCase() as UUID;
}

export function GetVlessConfig(no: number, uuid: UUID, sni: string, address: string, port: number, fp: string, alpn: string) {
	return {
		name: `${no}-vless-worker-${address}`,
		tls: true,
		network: "ws",
		port: port,
		servername: sni,
		uuid: uuid,
		fp: fp,
		alpn: alpn,
		"ws-opts": {
			headers: {
				Host: sni,
			},
		},
		server: address,
		path: "vless-ws/?ed=2048",
	}
	// return `vless://${uuid}@${address}:${port}?encryption=none&security=tls&sni=${sni}&fp=${fp}&alpn=${alpn}&type=ws&host=${sni}&path=vless-ws%2F%3Fed%3D2048#${no}-vless-worker-${address}`
}