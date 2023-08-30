// import { Buffer } from 'buffer'

export function EncodeConfig(conf: any): string|null {
  var configStr: string|null = null
  
  try {
    if (conf.protocol === "vmess") {
      delete conf.protocol
      configStr = "vmess://" + Buffer.from(JSON.stringify(conf), "utf-8").toString("base64")
    } else if (["vless", "trojan"].includes(conf?.protocol)) {
      configStr = `${conf.protocol}://${conf.id}@${conf.add}:${conf.port}?security=${conf.tls}&type=${conf.net}&path=${encodeURIComponent(conf.path)}&host=${encodeURIComponent(conf.host)}&tls=${conf.tls}&sni=${conf.sni}#${encodeURIComponent(conf.ps)}`;
    }
  } catch (e) { }

  return configStr
}
  
export function DecodeConfig(configStr: string): any {
  var match: any = null
  var conf: any = null
  if (configStr.startsWith("vmess://")) {
    try {
      conf = JSON.parse(Buffer.from(configStr.substring(8), "base64").toString("utf-8"))
      conf.protocol = "vmess"
    } catch (e) { }
  } else if (match = configStr.match(/^(?<protocol>trojan|vless):\/\/(?<id>.*)@(?<add>.*):(?<port>\d+)\??(?<options>.*)#(?<ps>.*)$/)) {
    try {
      const optionsArr = match.groups.options.split('&') ?? []
      const optionsObj = optionsArr.reduce((obj: Record<string, string>, option: string) => {
        const [key, value] = option.split('=')
        obj[key] = decodeURIComponent(value)
        return obj
      }, {} as Record<string, string>)

      conf = {
        protocol: match.groups.protocol,
        id: match.groups.id,
        add: match.groups?.add,
        port: match.groups.port ?? 443,
        ps: match.groups?.ps,
        net: optionsObj.type ?? (optionsObj.net ?? "tcp"),
        host: optionsObj?.host,
        path: optionsObj?.path,
        tls: optionsObj.security ?? "none",
        sni: optionsObj?.sni,
        alpn: optionsObj?.alpn,
      }
    } catch (e) {
      // console.log(`Failed to decode ${configStr}`, e)
    }
  }
  return conf
}
  