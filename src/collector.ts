import yaml from 'js-yaml'
import { Buffer } from 'buffer'
import { GetVlessConfigList } from './vless'
import { MixConfig, ValidateConfig, DecodeConfig } from "./config"
import { GetMultipleRandomElements, RemoveDuplicateConfigs, AddNumberToConfigs, IsBase64, MuddleDomain } from "./helpers"
import { defaultProtocols, defaultALPNList, defaultPFList } from "./variables"
import { Env, Config } from "./interfaces"


export async function GetConfigList(url: URL, env: Env): Promise<Array<Config>> {
  let maxConfigs: number = 200
  let maxVlessConfigs: number = 10
  let protocols: Array<string> = []
  let providers: Array<string> = []
  let alpnList: Array<string> = []
  let fingerPrints: Array<string> = []
  let includeOriginalConfigs: boolean = true
  let includeMergedConfigs: boolean = true
  let cleanDomainIPs: Array<string> = []
  let myConfigs: Array<string> = []
  let settingsNotAvailable: boolean = true

  try {
    maxConfigs = parseInt(await env.settings.get("MaxConfigs") || "200")
    if (maxConfigs > 200) {
      maxVlessConfigs = Math.ceil(maxConfigs / 20)
    }
    protocols = await env.settings.get("Protocols").then(val => {return val ? val.split("\n") : []})
    if (protocols.includes("vless")) {
      maxConfigs = maxConfigs - maxVlessConfigs
    }
    providers = await env.settings.get("Providers").then(val => {return val ? val.split("\n") : []})
    alpnList = await env.settings.get("ALPNs").then(val => {return val ? val.split("\n") : []})
    fingerPrints = await env.settings.get("FingerPrints").then(val => {return val ? val.split("\n") : []})
    includeOriginalConfigs = (await env.settings.get("IncludeOriginalConfigs") || "yes") == "yes"
    includeMergedConfigs = ((await env.settings.get("IncludeMergedConfigs") || "yes") == "yes") && protocols.includes("vmess")
    cleanDomainIPs = await env.settings.get("CleanDomainIPs").then(val => {return val ? val.split("\n") : []})
    settingsNotAvailable = (await env.settings.get("MaxConfigs")) === null
    myConfigs = (await env.settings.get("Configs"))?.split("\n") || []
  } catch { }
  
  if (settingsNotAvailable) {
    protocols = defaultProtocols
    providers = []
    alpnList = defaultALPNList
    fingerPrints = defaultPFList
    includeOriginalConfigs = true
    includeMergedConfigs = true
    cleanDomainIPs = [MuddleDomain(url.hostname)]
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
          configs: newConfigs.filter((cnf: any) => cnf.type == "vmess"),
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
      .filter((cnf: any) => cnf?.merged && cnf?.name)
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

  if (protocols.includes("vless")) {
    finalConfigList = AddNumberToConfigs(finalConfigList, maxVlessConfigs + 1)
    finalConfigList = (await GetVlessConfigList(url.hostname, cleanDomainIPs, maxVlessConfigs, env)).concat(finalConfigList)
  } else {
    finalConfigList = AddNumberToConfigs(finalConfigList, 1)
  }
  
  if (alpnList.length) {
    finalConfigList = finalConfigList.map((conf: Config) => {
      if (["vless", "vmess"].includes(conf.type) && conf.security != "reality") {
        conf.alpn = alpnList[Math.floor(Math.random() * alpnList.length)]
      }
      return conf
    })
  }

  if (fingerPrints.length) {
    finalConfigList = finalConfigList.map((conf: Config) => {
      conf.fp = fingerPrints[Math.floor(Math.random() * fingerPrints.length)]
      return conf
    })
  }

  return finalConfigList
}