# V2Ray Worker
 Total solution for v2ray configs over Cloudflare's worker

[نسخه فارسی](https://github.com/vfarid/v2ray-worker/blob/main/README-fa.md)

## How to use

To be completed...

## Deploy 
 1. Fork this Repo and enable Github Action
 2. Open CloudFlare and create KV namespace with name `settings` then copy the ID
 3. Go to this forked repo and set secrets with name `KV_NAME` and fill with KV settings ID
 4. Edit this `README.md` file, then find and replace this button url bellow with yours `https://github.com/USER/REPO_NAME` then save it.
 4. then press `Deploy With Workers` and follow the instruction

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/vfarid/v2ray-worker)

### Credits
Built-in vless config generator is based on [Zizifn Edge Tunnel](https://github.com/zizifn/edgetunnel), re-written using Typescript.
Built-in trojan config generator is based on [ca110us/epeius](https://github.com/ca110us/epeius/tree/main), re-written using Typescript.
Proxy IPs source: https://rentry.co/CF-proxyIP
