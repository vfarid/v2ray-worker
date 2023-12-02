import { Buffer } from 'buffer'
import { IsIp, IsValidUUID, MuddleDomain } from "./helpers"
import { cfPorts, supportedCiphers } from "./variables"
import { Config } from "./interfaces"

export function MixConfig(cnf: Config, url: URL, address: string, provider: string): Config | null {
	const hostname: string = MuddleDomain(url.hostname)
  try {
		let conf = {...cnf};
		if (!conf.tls || conf.network != "ws") {
			return null
		}

		let addr = ""
		if (conf.servername) {
			addr = conf.servername
		} else if (conf["ws-opts"] && conf["ws-opts"].headers.Host && !IsIp(conf["ws-opts"].headers.Host)) {
			addr = conf["ws-opts"].headers.Host
		} else if (conf.server && !IsIp(conf.server)) {
			addr = conf.server
		}
		if (!addr) {
			return null
		}
		if (!conf.port) {
			conf.port = 443
		}

		if (!cfPorts.includes(conf.port)) {
			return null
		}

		if (addr.toLocaleLowerCase().endsWith('.workers.dev') && conf.path) {
      return null
		}

		conf.name = conf.name + "-worker"
    const path = conf["ws-opts"]?.path || conf.path
    conf["ws-opts"] = {
      path: "",
      headers: {
        Host: hostname
      }
    }
		conf.host = hostname
		conf.servername = hostname
		conf.server = address
		conf.path = "/" + addr + (path ? "/" + path.replace(/^\//g, "") : "")
    conf["ws-opts"].path = conf.path
		conf.merged = true
		return conf
	} catch (e) {
		return null
	}
}

export function EncodeConfig(conf: Config): string {
  try {
    if (conf.type == "vmess") {
      const config = {
        type: conf.type,
        ps: conf.name,
        add: conf.server,
        port: conf.port,
        id: conf.uuid,
        aid: conf.alterId || 0,
        cipher: conf.cipher || "none",
        tls: conf.tls ? "tls" : null,
        "skip-cert-verify": conf["skip-cert-verify"],
        sni: conf.servername,
        net: conf.network,
        path: conf.path,
        host: conf.host,
        alpn: conf.alpn,
        fp: conf.fp,
        "ws-opts": conf["ws-opts"],
        udp: conf.udp,
        merged: conf.merged || false,
      }
      return `${config.type}://${Buffer.from(JSON.stringify(config), "utf-8").toString("base64")}`
    } else if (conf.type == "vless") {
      return `${
        conf.type
      }://${
        conf.uuid || conf.password
      }@${
        conf.server
      }:${
        conf.port
      }?encryption=${
        encodeURIComponent(conf.cipher || "none")
      }&type=${
        conf.network || "tcp"
      }${
        conf.path ? "&path=" + encodeURIComponent(conf.path) : ""
      }${
        conf.host ? "&host=" + encodeURIComponent(conf.host) : ""
      }${
        conf.security ? "&security=" + encodeURIComponent(conf.security) : ""
      }${
        conf.pbk ? "&pbk=" + encodeURIComponent(conf.pbk) : ""
      }${
        conf.headerType ? "&headerType=" + encodeURIComponent(conf.headerType) : ""
      }${
        conf.alpn ? "&alpn=" + encodeURIComponent(conf.alpn) : ""
      }${
        conf.fp ? "&fp=" + encodeURIComponent(conf.fp) : ""
      }${
        conf.tls ? "&security=tls" : ""
      }&sni=${
        encodeURIComponent(conf.servername || conf.host || conf.server)
      }#${
        encodeURIComponent(conf.name)
      }`;
    } else if (conf.type == "trojan") {
      return `${
        conf.type
      }://${
        conf.password || conf.uuid
      }@${
        conf.server
      }:${
        conf.port
      }?cipher=${
        encodeURIComponent(conf.cipher || "none")
      }&type=${
        conf.type
      }${
        conf.path ? "&path=" + encodeURIComponent(conf.path) : ""
      }&host=${
        encodeURIComponent(conf.host || conf.server)
      }${
        conf.alpn ? "&alpn=" + encodeURIComponent(conf.alpn) : ""
      }${
        conf.fp ? "&fp=" + encodeURIComponent(conf.fp) : ""
      }${
        conf.tls ? "&tls=1" : ""
      }&sni=${
        encodeURIComponent(conf.servername || conf.host || conf.server)
      }#${
        encodeURIComponent(conf.name)
      }`;
    } else if (conf.type == "ss") {
      return `${
        conf.type
      }://${
        conf.password || conf.uuid
      }@${
        conf.server
      }:${
        conf.port
      }?cipher=${
        encodeURIComponent(conf.cipher || "none")
      }&type=${
        conf.type
      }${
        conf.path ? "&path=" + encodeURIComponent(conf.path) : ""
      }${
        conf.host ? "&host=" + encodeURIComponent(conf.host) : ""
      }${
        conf.tfo ? "&tfo=1" : ""
      }${
        conf.servername ? "&sni=" + encodeURIComponent(conf.servername) : ""
      }${
        conf.obfs ? "&obfs=" + encodeURIComponent(conf.obfs) : ""
      }${
        conf.protocol ? "&protocol=" + encodeURIComponent(conf.protocol) : ""
      }${
        conf["protocol-param"] ? "&protocol-param=" + encodeURIComponent(conf["protocol-param"]) : ""
      }${
        conf["obfs-param"] ? "&obfs-param=" + encodeURIComponent(conf["obfs-param"]) : ""
      }#${
        encodeURIComponent(conf.name)
      }`;
    // } else if (conf.type == "ssr") {
    //   return `${conf.type}://${Buffer.from(
    //   `${conf.server}:${conf.port}:origin:${conf.cipher}:${conf["protocol-param"]}
    //   , "utf-8").toString("base64")}`
    }
  } catch (e) {
    // console.log(e)
  }
  return ""
}
  
export function DecodeConfig(configStr: string): Config {
	let match: any = null
	let conf: any = null
	if (configStr.startsWith("vmess://")) {
	  try {
      conf = JSON.parse(Buffer.from(configStr.substring(8), "base64").toString("utf-8"))
      conf = {
        name: conf?.ps || conf?.name,
        server: conf?.add,
        port: conf?.port || 443,
        type: "vmess",
        uuid: conf?.id || conf?.password,
        alterId: conf?.aid || 0,
        cipher: conf?.cipher || "auto",
        tls: conf?.tls == "tls",
        "skip-cert-verify": true,
        servername: conf?.sni || conf?.host,
        network: conf?.net,
        path: conf?.path || "",
        host: conf?.host || conf?.sni,
        alpn: conf?.alpn,
        fp: conf["client-fingerprint"] || conf?.fp,
        "ws-opts": {
          path: conf?.path || "",
          headers: {
            Host: conf?.host || conf?.sni,
          }
        },
        udp: true,
      } as Config
    } catch (e) { }
	} else if ((match = configStr.match(/^(?<type>trojan|vless):\/\/(?<id>.*)@(?<server>.*):(?<port>\d+)\??(?<options>.*)#(?<ps>.*)$/)) && match.groups) {
	  try {
      const optionsArr = match.groups.options.split('&') ?? []
      const optionsObj = optionsArr.reduce((obj: Record<string, string>, option: string) => {
        const [key, value] = option.split('=')
        obj[key] = decodeURIComponent(value)
        return obj
      }, {} as Record<string, string>)
    
      conf = {
        name: match.groups.ps,
        server: match.groups.server,
        port: match.groups.port || 443,
        type: match.groups.type,
        uuid: match.groups.id,
        alterId: optionsObj.aid || 0,
        cipher: "auto",
        security: optionsObj.security || "",
        tls: (optionsObj.security || "none") == "tls",
        "skip-cert-verify": true,
        servername: optionsObj.sni || "",
        network: optionsObj.type || (optionsObj.net || "tcp"),
        path: optionsObj.path || "",
        host: optionsObj.host || "",
        alpn: optionsObj.alpn || "",
        fp: optionsObj.fp || "",
        pbk: optionsObj.pbk || "",
        headerType: optionsObj.headerType || "",
        "ws-opts": {
          path: optionsObj.path || "",
          headers: {
            Host: optionsObj.host || optionsObj.sni,
          }
        },
        udp: true,
      } as Config
	  } catch (e) {
      // console.log(e, conf)
    }
	}
  console.log("OK", conf)
	return conf
}

export function ValidateConfig(conf: Config): boolean {
	try {
		if (["vmess", "vless"].includes(conf.type) && IsValidUUID(conf.uuid as string) && conf.name) {
      return !!(conf.server || conf.servername)
		} else if (["trojan"].includes(conf.type) && (conf.uuid || conf.password) && conf.name) {
      return !!(conf.server || conf.servername)
		} else if (["ss", "ssr"].includes(conf.type) && supportedCiphers.includes(conf.cipher as string)) {
      return !!(conf.server || conf.servername)
		}
	} catch (e) { }

  return false
}
