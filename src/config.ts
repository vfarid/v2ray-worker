import { Buffer } from 'buffer'
import { IsIp, IsValidUUID, MuddleDomain } from "./helpers"
import { cfPorts, supportedCiphers } from "./variables"
import { Config } from "./interfaces"

export function MixConfig(cnf: Config, url: URL, address: string, provider: string): Config | null {
	const hostname: string = MuddleDomain(url.hostname)
  try {
		let conf = {...cnf};
		if (!["ws", "h2", "http"].includes(conf.network)) {
			throw new Error("Network is not supported!")
		} else if (!cfPorts.includes(conf.port)) {
			throw new Error("Port is not matched!")
		}

		let addr = conf.sni || conf.host || conf.address
		if (IsIp(addr)) {
			throw new Error("Invalid SNI!")
		}

		if (addr.toLocaleLowerCase().endsWith('.workers.dev') || addr.toLocaleLowerCase().endsWith('.pages.dev')) {
			throw new Error("Config is running on Cloudflare, Skipped!")
		}

		conf.remarks = conf.remarks + "-worker"
    const path = conf.path
		conf.host = hostname
		conf.sni = hostname
		conf.address = address
		conf.path = `/${addr}:${conf.port}/${path.replace(/^\//g, "")}`
		conf.merged = true
		return conf
	} catch (e) {
		return null
	}
}

export function EncodeConfig(conf: Config): string {
  try {
    if (conf.configType == "vmess") {
      const config = {
        type: conf.type,
        ps: conf.remarks,
        add: conf.address,
        port: conf.port,
        id: conf.uuid,
        aid: conf.alterId || 0,
        tls: conf.tls,
        sni: conf.sni,
        net: conf.network,
        path: conf.path,
        host: conf.host,
        alpn: conf.alpn,
        fp: conf.fp,
      }
      return `vmess://${Buffer.from(JSON.stringify(config), "utf-8").toString("base64")}`
    } else if (conf.configType == "vless") {
      return `vless://${
        conf.uuid
      }@${
        conf.address
      }:${
        conf.port
      }?encryption=${
        encodeURIComponent(conf.encryption || "none")
      }&type=${
        conf.network
      }${
        conf.path ? "&path=" + encodeURIComponent(conf.path) : ""
      }${
        conf.host ? "&host=" + encodeURIComponent(conf.host) : ""
      }${
        conf.security ? "&security=" + encodeURIComponent(conf.security) : ""
      }${
        conf.flow ? "&flow=" + encodeURIComponent(conf.flow) : ""
      }${
        conf.pbk ? "&pbk=" + encodeURIComponent(conf.pbk) : ""
      }${
        conf.sid ? "&sid=" + encodeURIComponent(conf.sid) : ""
      }${
        conf.spx ? "&spx=" + encodeURIComponent(conf.spx) : ""
      }${
        conf.seed ? "&seed=" + encodeURIComponent(conf.seed) : ""
      }${
        conf.quicSecurity ? "&quicSecurity=" + encodeURIComponent(conf.quicSecurity) : ""
      }${
        conf.key ? "&key=" + encodeURIComponent(conf.key) : ""
      }${
        conf.mode ? "&mode=" + encodeURIComponent(conf.mode) : ""
      }${
        conf.authority ? "&authority=" + encodeURIComponent(conf.authority) : ""
      }${
        conf.headerType ? "&headerType=" + encodeURIComponent(conf.headerType) : ""
      }${
        conf.alpn ? "&alpn=" + encodeURIComponent(conf.alpn) : ""
      }${
        conf.fp ? "&fp=" + encodeURIComponent(conf.fp) : ""
      }${
        conf.fragment ? "&fragment=" + encodeURIComponent(conf.fragment) : ""
      }&sni=${
        encodeURIComponent(conf.sni || conf.host || conf.address)
      }#${
        encodeURIComponent(conf.remarks)
      }`;

    // } else if (conf.type == "trojan") {
    //   return `${
    //     conf.type
    //   }://${
    //     conf.password || conf.uuid
    //   }@${
    //     conf.server
    //   }:${
    //     conf.port
    //   }?type=${
    //     conf.network
    //   }${
    //     conf.cipher ? "&cipher=" + encodeURIComponent(conf.cipher) : ""
    //   }${
    //     conf.path ? "&path=" + conf.path : ""
    //   }${
    //     conf.host ? "&Host=" + conf.host : ""
    //   }${
    //     conf.alpn ? "&alpn=" + encodeURIComponent(conf.alpn) : ""
    //   }${
    //     conf.fp ? "&fp=" + encodeURIComponent(conf.fp) : ""
    //   }${
    //     conf.tls ? "&tls=1" : ""
    //   }&sni=${
    //     encodeURIComponent(conf.servername || conf.host || conf.server)
    //   }#${
    //     encodeURIComponent(conf.name)
    //   }`;
    // } else if (conf.type == "ss") {
    //   return `${
    //     conf.type
    //   }://${
    //     conf.password || conf.uuid
    //   }@${
    //     conf.server
    //   }:${
    //     conf.port || "80"
    //   }?cipher=${
    //     conf.cipher || "none"
    //   }${
    //     conf.path ? "&path=" + encodeURIComponent(conf.path) : ""
    //   }${
    //     conf.host ? "&host=" + encodeURIComponent(conf.host) : ""
    //   }${
    //     conf.tfo ? "&tfo=1" : ""
    //   }${
    //     conf.obfs ? "&obfs=" + encodeURIComponent(conf.obfs) : ""
    //   }${
    //     conf.protocol ? "&protocol=" + encodeURIComponent(conf.protocol) : ""
    //   }${
    //     conf["protocol-param"] ? "&protocol-param=" + encodeURIComponent(conf["protocol-param"]) : ""
    //   }${
    //     conf["obfs-param"] ? "&obfs-param=" + encodeURIComponent(conf["obfs-param"]) : ""
    //   }#${
    //     encodeURIComponent(conf.name)
    //   }`;
    // // } else if (conf.type == "ssr") {
    // //   return `${conf.type}://${Buffer.from(
    // //   `${conf.server}:${conf.port}:origin:${conf.cipher}:${conf["protocol-param"]}
    // //   , "utf-8").toString("base64")}`
    }
  } catch (e) {
    // console.log(e, conf)
  }
  return ""
}
  
export function DecodeConfig(configStr: string): Config {
	let conf: any = null
	if (configStr.startsWith("vmess://")) {
	  try {
      conf = JSON.parse(Buffer.from(configStr.substring(8), "base64").toString("utf-8"))
      const network = conf?.net || conf?.type || "tcp"
      const type = conf?.type || ""
      conf = {
        configType: "vmess",
        remarks: conf?.ps,
        address: conf.add,
        port: parseInt(conf?.port || (conf?.tls == "tls" ? "443" : "80")),
        uuid: conf.id,
        alterId: conf?.aid || 0,
        security: conf?.scy || "auto",
        network: network,
        type: type == network ? "" : type,
        host: conf?.host,
        path: conf?.path || "",
        tls: conf?.tls || "",
        sni: conf?.sni || conf?.host,
      } as Config
    } catch (e) { }
	} else if (configStr.startsWith("vless://")) {
	  try {
      const url: URL = new URL(configStr)
      const network = url.searchParams.get('network') || url.searchParams.get('type') || "tcp"
      const type = url.searchParams.get('type') || ""
      conf = {
        configType: "vless",
        remarks: decodeURIComponent(url.hash.substring(1)),
        address: url.hostname,
        port: parseInt(url.port || (url.searchParams.get('tls') == "tls" ? "443" : "80")),
        uuid: url.username,
        security: url.searchParams.get('security') || "",
        encryption: url.searchParams.get('encryption') || "none",
        network: network,
        type: type == network ? "" : type,
        serviceName: url.searchParams.get('serviceName') || "",
        host: url.searchParams.get('host') || "",
        path: url.searchParams.get('path') || "",
        tls: url.searchParams.get('security') == "tls" ? "tls" : "",
        sni: url.searchParams.get('sni') || "",
        flow: url.searchParams.get('flow') || "",
        pbk: url.searchParams.get('pbk') || "",
        sid: url.searchParams.get('sid') || "",
        spx: url.searchParams.get('spx') || "",
        headerType: url.searchParams.get('headerType') || "",
        seed: url.searchParams.get('seed') || "",
        quicSecurity: url.searchParams.get('quicSecurity') || "",
        key: url.searchParams.get('key') || "",
        mode: url.searchParams.get('mode') || "",
        authority: url.searchParams.get('authority') || "",
      } as Config
	  } catch (e) {
      // console.log(e, configStr)
    }
	}
	return conf
}

export function ValidateConfig(conf: Config): boolean {
	try {
		if (["vmess", "vless"].includes(conf.configType) && IsValidUUID(conf.uuid as string) && conf.remarks) {
      return !!(conf.address || conf.sni)
		// } else if (["trojan"].includes(conf.configType) && (conf.uuid || conf.password) && conf.remarks) {
    //   return !!(conf.server || conf.servername)
		// } else if (["ss", "ssr"].includes(conf.type) && supportedCiphers.includes(conf.cipher as string)) {
    //   return !!(conf.server || conf.servername)
		}
	} catch (e) { }

  return false
}
