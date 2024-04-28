export const version: string = "2.3"
export const providersUri: string = "https://raw.githubusercontent.com/vfarid/v2ray-worker/main/resources/provider-list.txt"
export const proxiesUri: string = "https://raw.githubusercontent.com/vfarid/v2ray-worker/main/resources/proxy-list.txt"

export const defaultProtocols: Array<string> = [
  "vmess",
  "built-in-vless",
  "vless",
]

export const defaultALPNList: Array<string> = [
  "h3,h2,http/1.1",
  "h3,h2,http/1.1",
  "h3,h2,http/1.1",
  "h3,h2",
  "h2,http/1.1",
  "h2",
  "http/1.1",
]

export const defaultPFList: Array<string> = [
  "chrome",
  "firefox",
  "randomized",
  "safari",
  "chrome",
  "edge",
  "randomized",
  "ios",
  "chrome",
  "android",
  "randomized",
]

export const cfPorts: Array<number> = [
	443,
	2053,
	2083,
	2087,
	2096,
	8443,
]

export const supportedCiphers: Array<string> = [
	"none",
	"auto",
	"plain",
	"aes-128-cfb",
	"aes-192-cfb",
	"aes-256-cfb",
	"rc4-md5",
	"chacha20-ietf",
	"xchacha20",
	"chacha20-ietf-poly1305",
]

export const fragmentsLengthList: Array<string> = [
  "10-20",
  "10-50",
  "20-50",
  "30-80",
  "50-100",
]

export const fragmentsIntervalList: Array<string> = [
  "10-20",
  "10-50",
  "20-50",
]

export const defaultClashConfig = {
  port: 7890,
  "socks-port": 7891,
  "allow-lan": false,
  mode: "rule",
  "log-level": "info",
  "external-controller": "127.0.0.1:9090",
  dns: {
      "enable": true,
      "ipv6": false,
      "enhanced-mode": "fake-ip",
      "nameserver": [
          "114.114.114.114",
          "223.5.5.5",
          "8.8.8.8",
          "9.9.9.9",
          "1.1.1.1",
          "https://dns.google/dns-query",
          "tls://dns.google:853"
      ]
  },
  proxies: <object>[],
  "proxy-groups": <object>[],
  rules: [
      "GEOIP,IR,DIRECT",
      "DOMAIN-SUFFIX,ir,DIRECT",
      "IP-CIDR,127.0.0.0/8,DIRECT",
      "IP-CIDR,192.168.0.0/16,DIRECT",
      "IP-CIDR,172.16.0.0/12,DIRECT",
      "IP-CIDR,10.0.0.0/8,DIRECT",
      "MATCH,All"
  ],
}

export const defaultV2rayConfig = {
  "stats":{},
  "log": {
    "loglevel": "warning"
  },
  "policy":{
      "levels": {
        "8": {
          "handshake": 4,
          "connIdle": 300,
          "uplinkOnly": 1,
          "downlinkOnly": 1
        }
      },
      "system": {
        "statsOutboundUplink": true,
        "statsOutboundDownlink": true
      }
  },
  "inbounds": [{
    "tag": "socks",
    "port": 10808,
    "protocol": "socks",
    "settings": {
      "auth": "noauth",
      "udp": true,
      "userLevel": 8
    },
    "sniffing": {
      "enabled": true,
      "destOverride": [
        "http",
        "tls"
      ]
    }
  },
  {
    "tag": "http",
    "port": 10809,
    "protocol": "http",
    "settings": {
      "userLevel": 8
    }
  }
],
  "outbounds": [{
    "tag": "proxy",
    "protocol": "",
    "settings": {
      "vnext": [
        {
          "address": "",
          "port": 443,
          "users": [
            {
              "id": "",
              "alterId": 0,
              "security": "auto",
              "level": 8,
              "encryption": "none",
              "flow": "",
            }
          ]
        }
      ],
    },
    "streamSettings": {
      "network": "tcp",
      "security": "",
      "sockopts": {},
    },
    "mux": {
      "enabled": false
    }
  },
  {
    "protocol": "freedom",
    "settings": {},
    "tag": "direct"
  },
  {
    "protocol": "blackhole",
    "tag": "block",
    "settings": {
      "response": {
        "type": "http"
      }
    }
  }
  ],
  "routing": {
      "domainStrategy": "IPIfNonMatch",
      "rules": []
  },
  "dns": {
      "hosts": {},
      "servers": []
  }
}

