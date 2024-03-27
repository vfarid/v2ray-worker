import yaml from 'js-yaml'
import { Buffer } from 'buffer'
import { GetVlessConfigList } from './vless'
import { MixConfig, ValidateConfig, DecodeConfig } from "./config"
import { GetMultipleRandomElements, RemoveDuplicateConfigs, AddNumberToConfigs, IsBase64, MuddleDomain } from "./helpers"
import { version, defaultProtocols, defaultALPNList, defaultPFList, fragmentsLengthList, fragmentsIntervalList } from "./variables"
import { Env, Config } from "./interfaces"


export async function GetConfigList(url: URL, env: Env): Promise<Array<Config>> {
  let maxConfigs: number = 200
  const maxVlessConfigs: number = 20
  let protocols: Array<string> = []
  let providers: Array<string> = []
  let alpnList: Array<string> = []
  let fingerPrints: Array<string> = []
  let includeOriginalConfigs: boolean = true
  let includeMergedConfigs: boolean = true
  let cleanDomainIPs: Array<string> = []
  let myConfigs: Array<string> = []
  let settingsNotAvailable: boolean = true
  let enableFragments = false

  try {
    maxConfigs = parseInt(await env.settings.get("MaxConfigs") || "200")
    const settingsVersion = await env.settings.get("Version") || "2.0"
    if (settingsVersion == version) {
      protocols = await env.settings.get("Protocols").then(val => {return val ? val.split("\n") : []})
    }
    const blockPorn = await env.settings.get("BlockPorn") == "yes"
    
    if (blockPorn) {
      protocols = ["built-in-vless"]
      maxConfigs = 0
    }

    providers = (await env.settings.get("Providers"))?.split("\n").filter(t => t.trim().length > 0) || []
    alpnList = (await env.settings.get("ALPNs"))?.split("\n").filter(t => t.trim().length > 0) || []
    fingerPrints = (await env.settings.get("FingerPrints"))?.split("\n").filter(t => t.trim().length > 0) || []
    includeOriginalConfigs = (await env.settings.get("IncludeOriginalConfigs") || "yes") == "yes"
    includeMergedConfigs = ((await env.settings.get("IncludeMergedConfigs") || "yes") == "yes") && (protocols.includes("vmess") || protocols.includes("vless"))
    cleanDomainIPs = (await env.settings.get("CleanDomainIPs"))?.split("\n").filter(t => t.trim().length > 0) || []
    settingsNotAvailable = (await env.settings.get("MaxConfigs")) === null
    myConfigs = (await env.settings.get("Configs"))?.split("\n").filter(t => t.trim().length > 0) || []
    enableFragments = await env.settings.get("EnableFragments") == "yes"

    let proxies = (await env.settings.get("ManualProxies"))?.split("\n").filter(t => t.trim().length > 0) || []
    if (!proxies.length) {
      proxies = await fetch("https://raw.githubusercontent.com/vfarid/v2ray-worker/main/resources/proxy-list.txt").then(r => r.text()).then(t => t.trim().split("\n").filter(t => t.trim().length > 0))
    }
    await env.settings.put("Proxies", proxies.join("\n"))
  } catch { }
  
  protocols = protocols.length ? protocols : defaultProtocols
  alpnList = alpnList.length ? alpnList : defaultALPNList
  fingerPrints = fingerPrints.length ? fingerPrints : defaultPFList
  cleanDomainIPs = cleanDomainIPs.length ? cleanDomainIPs : [MuddleDomain(url.hostname)]

  if (protocols.includes("built-in-vless")) {
    maxConfigs = maxConfigs - maxVlessConfigs
  }

  if (settingsNotAvailable) {
    includeOriginalConfigs = true
    includeMergedConfigs = true
  }
  if (!providers.length) {
    providers = await fetch("https://raw.githubusercontent.com/vfarid/v2ray-worker/main/resources/provider-list.txt").then(r => r.text()).then(t => t.trim().split("\n").filter(t => t.trim().length > 0))
  }

  if (includeOriginalConfigs && includeMergedConfigs) {
      maxConfigs = Math.floor(maxConfigs / 2)
  }

  let configList: Array<any> = []
  let acceptableConfigList: Array<any> = []
  let finalConfigList: Array<Config> = []
  let newConfigs: Array<any> = []
  const configPerList: number = Math.floor(maxConfigs / Object.keys(providers).length)
  
  for (const providerUrl of providers) {
    try {
      var content: string = await fetch(providerUrl.trim()).then(r => r.text())
      try {
        const json: any = yaml.load(content)
        newConfigs = json.proxies;
        if (!newConfigs.length) {
          throw "no-yaml"
        }
        newConfigs = newConfigs.filter((cnf: any) => protocols.includes(cnf.type)).filter(ValidateConfig)
      } catch (e) {
        if (IsBase64(content)) {
          content = Buffer.from(content, "base64").toString("utf-8")
        }
        newConfigs = content.split("\n").filter((cnf: string) => cnf.match(new RegExp(`^(${protocols.join("|")}):\/\/`, "i")))
        if (newConfigs.length) {
          newConfigs = newConfigs.map(DecodeConfig).filter(ValidateConfig)
        }
      }
      if (includeMergedConfigs) {
        acceptableConfigList.push({
          url: providerUrl,
          count: configPerList,
          configs: newConfigs.filter((cnf: any) => ["vmess", "vless"].includes(cnf.configType)),
          mergedConfigs: null,
        })
      }
      if (includeOriginalConfigs) {
        configList.push({
          url: providerUrl,
          count: configPerList,
          configs: newConfigs,
        })
      }
    } catch (e) { }
  }
  if (!cleanDomainIPs.length) {
    cleanDomainIPs = [MuddleDomain(url.hostname)]
  }

  let address: string = cleanDomainIPs[Math.floor(Math.random() * cleanDomainIPs.length)]
  for (const i in acceptableConfigList) {
    const el: any = acceptableConfigList[i]
    acceptableConfigList[i].mergedConfigs = el.configs
      .map((cnf: any) => MixConfig(cnf, url, address, el.name))
      .filter((cnf: any) => cnf?.merged && cnf?.remarks)
  }
  let remaining: number = 0
  for (let i: number = 0; i < 5; i++) {
    for (const el of acceptableConfigList) {
      if (el.count > el.mergedConfigs.length) {
        remaining = remaining + el.count - el.mergedConfigs.length
        el.count = el.mergedConfigs.length
      } else if (el.count < el.mergedConfigs.length && remaining > 0) {
        el.count = el.count + Math.ceil(remaining / 3)
        remaining = remaining - Math.ceil(remaining / 3)
      }
    }
  }
  for (const el of acceptableConfigList) {
    finalConfigList = finalConfigList.concat(
      GetMultipleRandomElements(el.mergedConfigs, el.count)
    )
  }

  if (includeOriginalConfigs) {
    let remaining = 0
    for (let i = 0; i < 5; i++) {
      for (const el of configList) {
        if (el.count > el.configs.length) {
          remaining = remaining + el.count - el.configs.length
          el.count = el.configs.length
        } else if (el.count < el.configs.length && remaining > 0) {
          el.count = el.count + Math.ceil(remaining / 3)
          remaining = remaining - Math.ceil(remaining / 3)
        }
      }
    }
    for (const el of configList) {
      finalConfigList = finalConfigList.concat(
        GetMultipleRandomElements(el.configs, el.count)
      )
    }
  }

  if (myConfigs.length) {
    finalConfigList = finalConfigList.concat(
      myConfigs.map(DecodeConfig)
    )
  }

  finalConfigList = RemoveDuplicateConfigs(finalConfigList.filter(ValidateConfig))

  if (protocols.includes("built-in-vless")) {
    finalConfigList = AddNumberToConfigs(finalConfigList, maxVlessConfigs + 1)
    finalConfigList = (await GetVlessConfigList(url.hostname, cleanDomainIPs, maxVlessConfigs, env)).concat(finalConfigList)
  } else {
    finalConfigList = AddNumberToConfigs(finalConfigList, 1)
  }
  
  finalConfigList = finalConfigList.map((conf: Config) => {
    conf.fp = fingerPrints[Math.floor(Math.random() * fingerPrints.length)]
    conf.alpn = alpnList[Math.floor(Math.random() * alpnList.length)]
    if (enableFragments && conf.tls == "tls") {
      conf.fragment = `tlshello,${fragmentsLengthList[Math.floor(Math.random() * fragmentsLengthList.length)]},${fragmentsIntervalList[Math.floor(Math.random() * fragmentsIntervalList.length)]}`
    }
    return conf
  })

  return finalConfigList
}