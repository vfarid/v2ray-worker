import yaml from 'js-yaml'
import { defaultClashConfig } from "./variables"
import { Config, ClashConfig } from './interfaces';

export function ToYamlSubscription(configList: Array<Config>): string {
    let clash = defaultClashConfig
    clash.proxies = configList.map((conf: Config) => {
        let {
            configType,
            type,
            remarks,
            address,
            tls,
            alpn,
            merged,
            ...rest
        } = conf
        if (conf.type) {
            rest.network = conf.type
        }
        let config: ClashConfig = {
            name: conf.remarks,
            server: conf.address,
            type: conf.configType,
            tls: conf.tls == "tls",
            cipher: "auto",
            ...rest
        }
        return config
    })
    let proxyTiers: {
        "All": Array<string>,
        "Built-in": Array<string>,
        "Merged": Array<string>,
        "Original": Array<string>,
    } = {
        "All": [],
        "Built-in": [],
        "Merged": [],
        "Original": [],
    }
    configList.forEach((conf: Config) => {
        const grp = ["vless-ws", "trojan-ws"].includes(conf.path.split("?")[0].split("/")[0]) ? "Built-in" : (conf?.merged ? 'Merged' : 'Original')
        proxyTiers[grp].push(conf.remarks)
        proxyTiers["All"].push(conf.remarks)
    });

    clash['proxy-groups'] = [
        {
            name: "All",
            type: "select",
            proxies: [
                "All - UrlTest",
                "All - Fallback",
                "All - LoadBalance(ch)",
                "All - LoadBalance(rr)",
                "Built-in - UrlTest",
                "Merged - UrlTest",
                "Original - UrlTest",
            ].concat(proxyTiers["All"]),
        },
        {
            name: "All - UrlTest",
            type: "url-test",
            url: "http://clients3.google.com/generate_204",
            interval: 600,
            proxies: proxyTiers["All"],
        },
        {
            name: "All - Fallback",
            type: "fallback",
            url: "http://clients3.google.com/generate_204",
            interval: 600,
            proxies: proxyTiers["All"],
        },
        {
            name: "All - LoadBalance(ch)",
            type: "load-balance",
            strategy: "consistent-hashing",
            url: "http://clients3.google.com/generate_204",
            interval: 600,
            proxies: proxyTiers["All"],
        },
        {
            name: "All - LoadBalance(rr)",
            type: "load-balance",
            strategy: "round-robin",
            url: "http://clients3.google.com/generate_204",
            interval: 600,
            proxies: proxyTiers["All"],
        },
        {
            name: "Built-in - UrlTest",
            type: "url-test",
            url: "http://clients3.google.com/generate_204",
            interval: 600,
            proxies: proxyTiers["Built-in"],
        },
        {
            name: "Merged - UrlTest",
            type: "url-test",
            url: "http://clients3.google.com/generate_204",
            interval: 600,
            proxies: proxyTiers["Merged"],
        },
        {
            name: "Original - UrlTest",
            type: "url-test",
            url: "http://clients3.google.com/generate_204",
            interval: 600,
            proxies: proxyTiers["Original"],
        },
    ]

    return yaml.dump(clash)
}