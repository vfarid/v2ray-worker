import { IsIp, IsValidUUID } from "./helpers"
import { cfPorts, supportedCiphers } from "./variables"

export function MixConfig(cnf: any, url: URL, address: string, provider: string): object {
	try {
		var conf = {...cnf};
		if (!conf.tls && conf.network == "ws") {
			return {}
		}

		var addr = null
		if (conf.servername) {
			addr = conf.servername
		} else if (conf["ws-opts"] && conf["ws-opts"].headers.Host && !IsIp(conf["ws-opts"].headers.Host)) {
			addr = conf["ws-opts"].headers.Host
		} else if (conf.server && !IsIp(conf.server)) {
			addr = conf.server
		}
		if (!addr) {
			return {}
		}
		if (!conf.port) {
			conf.port = 443
		}

		if (!cfPorts.includes(conf.port)) {
			return {}
		}

		if (addr.endsWith('.workers.dev')) {
			const part1 = conf["ws-opts"].path.split("/").pop()
			const part2 = conf["ws-opts"].path.substring(0, conf["ws-opts"].path.length - part1.length - 1)
			var path = ""
			if (part1.includes(":")) {
				addr = part1.replace(/^\//g, "").split(":")
				conf.port = parseInt(addr[1])
				addr = addr[0]
				path = "/" + part2.replace(/^\//g, "")
			} else if (part2.includes(":")) {
				addr = part2.replace(/^\//g, "").split(":")
				conf.port = parseInt(addr[1])
				addr = addr[0]
				path = "/" + part1.replace(/^\//g, "")
			} else if (part1.includes(".")) {
				addr = part1.replace(/^\//g, "")
				conf.port = 443
				path = "/" + part2.replace(/^\//g, "")
			} else {
				addr = part2.replace(/^\//g, "")
				conf.port = 443
				path = "/" + part1.replace(/^\//g, "")
			}
			conf["ws-opts"].path = path
		}

		if (provider) {
			conf.name =  conf.name + "-" + provider
		}

		conf.name = conf.name + "-worker"
		conf["ws-opts"].headers.Host = url.hostname
		conf.servername = url.hostname
		conf.server = address
		conf.path = "/" + addr + (conf["ws-opts"].path ? "/" + conf["ws-opts"].path.replace(/^\//g, "") : "")
		conf.provider = provider
		conf.merged = true
		return conf
	} catch (e) {
		return {}
	}
}

export function ValidateConfig(
	cnf: any,
	provider: string
): object {
	try {
		var conf = {...cnf};

		if (["ss", "ssr"].includes(conf.type) && !supportedCiphers.includes(conf.cipher)) {
			return {}
		}
		if (conf.uuid && !IsValidUUID(conf.uuid)) {
			console.log("invalid uuid", conf.uuid)
			return {}
		}

		conf.name = conf.name + "-" + provider
		conf.provider = provider
		conf.merged = false
		return conf
	} catch (e) {
		return {}
	}
}
