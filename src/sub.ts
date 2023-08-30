import yaml from 'js-yaml'
import { MixConfig, ValidateConfig } from "./config"
import { GetMultipleRandomElements } from "./helpers"
import { defaultProviders, defaultProtocols, defaultALPNList, defaultPFList, defaultDomainList } from "./variables"

interface Env {settings: any}

export async function GetConfigList(url: URL, env: Env): Promise<Array<object>> {
  var maxConfigs: number = parseInt(await env.settings.get("MaxConfigs") || "200")
  const protocols: Array<string> = (await env.settings.get("Protocols"))?.split("\n") || defaultProtocols
  const alpnList: Array<string> = (await env.settings.get("ALPNs"))?.split("\n") || defaultALPNList
  const fingerPrints: Array<string> = (await env.settings.get("FingerPrints"))?.split("\n") || defaultPFList
  const providers: Array<string> = (await env.settings.get("Providers"))?.split("\n") || defaultProviders
  const configs: Array<string> = (await env.settings.get("Configs"))?.split("\n") || []
  const includeOriginalConfigs: boolean = (await env.settings.get("IncludeOriginalConfigs") || "yes") == "yes"
  const includeMergedConfigs: boolean = (await env.settings.get("IncludeMergedConfigs") || "yes") == "yes"
  var cleanDomainIPs: Array<string> = (await env.settings.get("CleanDomainIPs"))?.split("\n") || []

  if (includeOriginalConfigs && includeMergedConfigs) {
      maxConfigs = Math.floor(maxConfigs / 2)
  }

  var configList: Array<any> = []
  var acceptableConfigList: Array<any> = []
  var finalConfigList: Array<object> = []
  var newConfigs: Array<any> = []
  const configPerList: number = Math.floor(maxConfigs / Object.keys(providers).length)
  for (const providerUrl of providers) {
    try {
      const content: string = await fetch(providerUrl).then(r => r.text())
      const json: any = yaml.load(content)
      newConfigs = json.proxies;
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
          configs: newConfigs.filter((cnf: any) => protocols.includes(cnf.type)),
          renamedConfigs: null,
        })
      }
    } catch (e) { }
  }

  if (!cleanDomainIPs.length) {
    cleanDomainIPs = defaultDomainList
  }

  var address: string = cleanDomainIPs[Math.floor(Math.random() * cleanDomainIPs.length)]
  for (const i in acceptableConfigList) {
    const el: any = acceptableConfigList[i]
    acceptableConfigList[i].mergedConfigs = el.configs
      .map((cnf: any) => MixConfig(cnf, url, address, el.name))
      .filter((cnf: any) => cnf.merged && cnf.name)
  }
  var remaining: number = 0
  for (var i: number = 0; i < 5; i++) {
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
    for (const i in configList) {
      const el = configList[i]
      configList[i].renamedConfigs = el.configs
        .map((cnf: any) => ValidateConfig(cnf, el.name))
        .filter((cnf: any) => cnf.name)
    }
    var remaining = 0
    for (var i = 0; i < 5; i++) {
      for (const el of configList) {
        if (el.count > el.renamedConfigs.length) {
          remaining = remaining + el.count - el.renamedConfigs.length
          el.count = el.renamedConfigs.length
        } else if (el.count < el.renamedConfigs.length && remaining > 0) {
          el.count = el.count + Math.ceil(remaining / 3)
          remaining = remaining - Math.ceil(remaining / 3)
        }
      }
    }
    for (const el of configList) {
      finalConfigList = finalConfigList.concat(
        GetMultipleRandomElements(el.renamedConfigs, el.count)
      )
    }
  }
  return finalConfigList
}