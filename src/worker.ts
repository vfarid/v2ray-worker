/*
 * V2RAY Worker v2.0
 * Copyright 2023 Vahid Farid (https://twitter.com/vahidfarid)
 * Licensed under GPLv3 (https://github.com/vfarid/v2ray-worker/blob/main/Licence.md)
 */

import { VlessOverWSHandler } from "./vless"
import { GetPanel, PostPanel } from "./panel"
import { GetConfigList } from "./sub"
import { Env } from "./interfaces"

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url: URL = new URL(request.url)
    const path: string = url.pathname.replace(/^\/|\/$/g, "")
    if (path.toLowerCase() == "sub") {
      const outputType: string = (await env.settings.get("OutputType")) || "base64"
      const configList: Array<object> = await GetConfigList(url, env)
      if (outputType == 'yaml') {
        return new Response('YAML');
      } else {
        return new Response('Base64');
      }
    } else if (path.toLowerCase() == 'vless-ws') {
      return VlessOverWSHandler(request, env);
    } else if (path) {
      return fetch(new Request(new URL("https://" + path), request))
    } else if (request.method === 'GET') {
      return GetPanel(url, env)
    } else if (request.method === 'POST') {
      return PostPanel(request, env)
    } else {
      return new Response('Invalid request!');
    }
  }
}
