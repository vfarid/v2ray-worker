import { UUID } from "crypto"
import { Config } from "./interfaces"

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
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)
}

export function GetVlessConfig(no: number, uuid: UUID, sni: string, address: string, port: number) {
	return {
		name: `${no}-vless-worker-${address}`,
		type: "vless",
		tls: true,
		network: "ws",
		port: port,
		servername: sni,
		uuid: uuid,
		fp: "randomized",
		alpn: "h2,http/1.1",
		host: sni,
		"ws-opts": {
			path: "vless-ws/?ed=2048",
			headers: {
				Host: sni,
			},
		},
		server: address,
		path: "vless-ws/?ed=2048",
	} as Config
	// return `vless://${uuid}@${address}:${port}?encryption=none&security=tls&sni=${sni}&fp=${fp}&alpn=${alpn}&type=ws&host=${sni}&path=vless-ws%2F%3Fed%3D2048#${no}-vless-worker-${address}`
}

export function IsBase64(str: string): boolean {
	return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/.test(str)
}

export function RemoveDuplicateConfigs(configList: Array<Config>): Array<Config> {
  const seen: { [key: string]: boolean } = {}

  return configList.filter((conf: Config) => {
    const key = conf.name + conf.port + conf.server + (conf.uuid || conf.password)
    if (!seen[key]) {
      seen[key] = true
      return true
    }
    return false
  })
}

export function GenerateToken(length: number = 32): string {
  const buffer = new Uint8Array(length)
  for (let i = 0; i < length; i++) {
    buffer[i] = Math.floor(Math.random() * 256)
  }
  return Array.from(buffer).map(byte => byte.toString(16).padStart(2, '0')).join('')
}

export function Delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
