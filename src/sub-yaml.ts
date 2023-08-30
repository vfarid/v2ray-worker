import yaml from 'js-yaml'
import { defaultClashConfig } from "./variables"

export function toYAML(configList: Array<object>): string {
    var clash = defaultClashConfig
    clash.proxies = configList.map((conf: any) => (({provider, merged, ...others}) => others)(conf))
    const groupedConfigs:any = configList.reduce((group: {[key: string]: any}, conf: any) => {
        if (!group[conf.merged ? 'Worker' : 'Original']) {
            group[conf.merged ? 'Worker' : 'Original'] = [];
        }
        group[conf.merged ? 'Worker' : 'Original'].push(conf);
        return group;
    }, {});
    var proxyTiers: any = []
    for (const worker in groupedConfigs) {
        groupedConfigs[worker] = groupedConfigs[worker].reduce((group: {[key: string]: any}, conf: any) => {
            if (!group[conf.provider]) {
                group[conf.provider] = [];
            }
            group[conf.provider].push(conf.name);
            return group;
        }, {});

        for (const provider in groupedConfigs[worker]) {
            proxyTiers[worker + "-" + provider] = groupedConfigs[worker][provider]
        }
    }
    var proxyGroups = [
        {
            name: "All",
            type: "select",
            proxies: [
                "All - UrlTest",
                "All - Fallback",
                "All - LoadBalance(ch)",
                "All - LoadBalance(rr)",
            ].concat(Object.keys(proxyTiers)),
        },
        {
            name: "All - UrlTest",
            type: "url-test",
            url: "http://clients3.google.com/generate_204",
            interval: 600,
            proxies: Object.keys(proxyTiers),
        },
        {
            name: "All - Fallback",
            type: "fallback",
            url: "http://clients3.google.com/generate_204",
            interval: 600,
            proxies: Object.keys(proxyTiers),
        },
        {
            name: "All - LoadBalance(ch)",
            type: "load-balance",
            strategy: "consistent-hashing",
            url: "http://clients3.google.com/generate_204",
            interval: 600,
            proxies: Object.keys(proxyTiers),
        },
        {
            name: "All - LoadBalance(rr)",
            type: "load-balance",
            strategy: "round-robin",
            url: "http://clients3.google.com/generate_204",
            interval: 600,
            proxies: Object.keys(proxyTiers),
        },
    ]
    for (const tier in proxyTiers) {
        proxyGroups.push({
            name: tier,
            type: "url-test",
            url: "http://clients3.google.com/generate_204",
            interval: 600,
            proxies: proxyTiers[tier],
        })
    }

    clash['proxy-groups'] = proxyGroups
    return yaml.dump(clash)
}