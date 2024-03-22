import { UUID } from "crypto"
import { Config } from "./interfaces"
import { providersUri, proxiesUri } from "./variables"

export function GetMultipleRandomElements(arr: Array<any>, num: number): Array<any> {
	let shuffled = arr.sort(() => 0.5 - Math.random())
	return shuffled.slice(0, num)
}

export function IsIp(str: string): boolean {
	try {
		if (str == "" || str == undefined) return false
		if (!/^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])(\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])){2}\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-4])$/.test(str)) {
			return false
		}
		let ls = str.split('.')
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
	if (address.toLowerCase() == sni.toLowerCase()) {
    address = sni
  }
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

export function AddNumberToConfigs(configList: Array<Config>, start: number): Array<Config> {
  const seen: { [key: string]: boolean } = {}

  return configList.map((conf: Config, index: number) => {
    conf.name = (index + start) + "-" + conf.name 
    return conf
  })
}

export function GenerateToken(length: number = 32): string {
  const buffer: Uint8Array = new Uint8Array(length)
  for (let i = 0; i < length; i++) {
    buffer[i] = Math.floor(Math.random() * 256)
  }
  return Array.from(buffer).map(byte => byte.toString(16).padStart(2, '0')).join('')
}

export function Delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function MuddleDomain(hostname: string): string {
  const parts: string[] = hostname.split(".")
  const subdomain: string = parts.slice(0, parts.length -2).join(".")
  const domain: string = parts.slice(-2).join(".")

  const muddledDomain: string = domain.split("").map(
	  char => Math.random() < 0.5 ? char.toLowerCase() : char.toUpperCase()
  ).join("")
  
  return subdomain + "." + muddledDomain
}

export async function getDefaultProviders(): Promise<Array<string>> {
	return fetch(providersUri).then(r => r.text()).then(t => t.trim().split("\n"))
}

export async function getDefaultProxies(): Promise<Array<string>> {
	return fetch(proxiesUri).then(r => r.text()).then(t => t.trim().split("\n").filter(t => t.trim().length > 0))
}