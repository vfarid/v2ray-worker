import { defaultProviders, defaultProtocols, defaultALPNList, defaultPFList } from "./variables"

interface Env {settings: any}

export async function GetPanel(url: URL, env: Env): Promise<Response> {
  try {
    const outputType: string = await env.settings.get("OutputType") || "base64"
    const maxConfigs: number = parseInt(await env.settings.get("MaxConfigs") || "200")
    const protocols: Array<string> = (await env.settings.get("Protocols"))?.split("\n") || defaultProtocols
    const alpnList: Array<string> = (await env.settings.get("ALPNs"))?.split("\n") || defaultALPNList
    const fingerPrints: Array<string> = (await env.settings.get("FingerPrints"))?.split("\n") || defaultPFList
    const providers: Array<string> = (await env.settings.get("Providers"))?.split("\n") || defaultProviders
    const cleanDomainIPs: Array<string> = (await env.settings.get("CleanDomainIPs"))?.split("\n") || []
    const configs: Array<string> = (await env.settings.get("Configs"))?.split("\n") || []
    const includeOriginalConfigs: string = await env.settings.get("IncludeOriginalConfigs") || "yes"
    const includeMergedConfigs: string = await env.settings.get("IncludeMergedConfigs") || "yes"

    var htmlContent  = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf8" />
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-4bw+/aepP/YC94hEpVNVgiZdgIC5+VKNBQNGCHeKRQN+PtmoHDEXuppvnDJzQIu9" crossorigin="anonymous">
    </head>
    <body dir="ltr">
      <div class="container border p-0">
        <div class="p-3 mb-3 bg-primary text-white">
          <div class="text-nowrap fs-4 fw-bold text-center">V2RAY Worker - Control Panel</div>
          <div class="text-nowrap fs-6 text-center">
            Version 2.0 by
            <a href="https://twitter.com/vahidfarid" target="_blank" class="text-white">Vahid Farid</a>
          </div>
        </div>
        <div class="px-5 py-2 mb-3">
          <label for="sub-link" class="form-label fw-bold">
            Your subscription link / لینک ثبت نام شما:
          </label>
          <div id="sub-link" class="bg-info p-1">
            <input id="link" readonly="" value="https://${url.hostname}/sub" class="m-3 p-1" style="width: calc(100% - 150px)">
            <button onclick="var tmp=document.getElementById('link');tmp.select();tmp.setSelectionRange(0,99999);navigator.clipboard.writeText(tmp.value)" class="btn btn-primary">Copy</button>
          </div>
        </div>
        <form class="px-5 py-4 border-top" method="post">
          <div class="mb-3 pb-2">
            <label for="type" class="form-label fw-bold">
              Output type / نوع خروجی:
            </label>
            <div id="type">
              <div class="mb-3 form-check">
                <input type="radio" name="type" value="base64" class="form-check-input" id="base64-check" ${outputType == "base64" ? "checked" : ""}>
                <label class="form-check-label" for="base64-check">Base64 (v2ray, v2rayN/G, matsuri, nekoray, nekobox, shadowrocket...)</label>
              </div>
              <div class="mb-3 form-check">
                <input type="radio" name="type" value="yaml" class="form-check-input" id="yaml-check" ${outputType == "yaml" ? "checked" : ""}>
                <label class="form-check-label" for="yaml-check">YAML (Clash, ClashX, Clash Meta...)</label>
              </div>
            </div>
          </div>
          <div class="mb-3 pb-2">
            <label for="type" class="form-label fw-bold">
              Merged and original configs / کانفیگ‌های اصلی و ترکیبی:
            </label>
            <div id="type">
              <div class="mb-3 form-check">
                <input type="checkbox" name="merged" value="yes" class="form-check-input" id="merged-ckeck" ${includeMergedConfigs == "yes" ? "checked" : ""}>
                <label class="form-check-label" for="merged-ckeck">Include configs merged with worker / کانفیگ‌های ترکیب شده با ورکر را اضافه کن</label>
              </div>
              <div class="mb-3 form-check">
                <input type="checkbox" name="original" value="yes" class="form-check-input" id="original-ckeck" ${includeOriginalConfigs == "yes" ? "checked" : ""}>
                <label class="form-check-label" for="original-ckeck">Include original config / کانفیگ‌های اصلی را اضافه کن</label>
              </div>
            </div>
          </div>
          <div class="mb-3 pb-2">
            <label for="max-configs" class="form-label fw-bold">
              Max. mumber of configs / حداکثر تعداد کانفیگ:
            </label>
            <input type="number" name="max" class="form-control" id="max-configs" value="${maxConfigs}" min="5"/>
            <div class="form-text"></div>
          </div>
          <div class="mb-3 pb-2">
            <label for="type" class="form-label fw-bold">
              Protocols / پروتکل‌ها:
            </label>
            <div id="type">
              <div class="mb-3 form-check">
                <input type="checkbox" name="protocols" value="vmess" class="form-check-input" id="vmess-protocol-ckeck" ${protocols.includes('vmess') ? "checked" : ""}>
                <label class="form-check-label" for="vmess-protocol-ckeck">VMESS</label>
              </div>
              <div class="mb-3 form-check">
                <input type="checkbox" name="protocols" value="vless" class="form-check-input" id="vless-protocol-ckeck" ${protocols.includes('vless') ? "checked" : ""}>
                <label class="form-check-label" for="vless-protocol-ckeck">VLESS</label>
              </div>
              <div class="mb-3 form-check">
                <input type="checkbox" name="protocols" value="trojan" class="form-check-input" id="vmess-protocol-ckeck" ${protocols.includes('trojan') ? "checked" : ""}>
                <label class="form-check-label" for="vmess-protocol-ckeck">TROJAN</label>
              </div>
            </div>
          </div>
          <div class="mb-3 pb-2">
            <label for="alpn-list" class="form-label fw-bold">
              ALPN List:
            </label>
            <textarea rows="3" name="alpn_list" class="form-control" id="alpn-list">${alpnList.join("\n")}</textarea>
            <div class="form-text">
              One item per line. / در هر سطر یک آیتم وارد کنید.
            </div>
          </div>
          <div class="mb-3 pb-2">
            <label for="pf-list" class="form-label fw-bold">
              FingerPrint List:
            </label>
            <textarea rows="3" name="fp_list" class="form-control" id="fp-list">${fingerPrints.join("\n")}</textarea>
            <div class="form-text">
              One item per line. / در هر سطر یک آیتم وارد کنید.
            </div>
          </div>
          <div class="mb-3 pb-2">
            <label for="providers" class="form-label fw-bold">
              Providers / تامین کنندگان:
            </label>
            <textarea rows="7" name="providers" class="form-control" id="providers">${providers.join("\n")}</textarea>
            <div class="form-text">
              One link per line. / در هر سطر یک لینک وارد کنید.
            </div>
          </div>
          <div class="mb-3 pb-2">
            <label for="clean-ip" class="form-label fw-bold">
              Clean IP or clean subdomain / آی‌پی تمیز یا ساب‌دامین آی‌پی تمیز
            </label>
            <textarea rows="2" name="clean_ips" class="form-control" id="clean-ip">${cleanDomainIPs.join("\n")}</textarea>
            <div class="form-text">
              One IP or subdomain per line. / در هر سطر یک آی‌پی یا ساب‌دامین وارد کنید.
            </div>
          </div>
          <div class="mb-3 pb-2">
            <label for="configs" class="form-label fw-bold">
              Personal configs / کانفیگ‌های شخصی:
            </label>
            <textarea rows="3" name="configs" class="form-control" id="configs">${configs.join("\n")}</textarea>
            <div class="form-text">
              One config per line. / در هر سطر یک کانفیگ وارد کنید.
            </div>
          </div>
          <button type="submit" class="btn btn-primary">Save / ذخیره</button>
        </form>
      </div>
    </body>
    </html>
    `
  
    return new Response(htmlContent, {
      headers: {'Content-Type': 'text/html'},
    });
  } catch (e) {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf8" />
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-4bw+/aepP/YC94hEpVNVgiZdgIC5+VKNBQNGCHeKRQN+PtmoHDEXuppvnDJzQIu9" crossorigin="anonymous">
      </head>
      <body dir="ltr">
        <div class="container border p-0">
          <div class="p-3 mb-3 bg-primary text-white">
            <div class="text-nowrap fs-4 fw-bold text-center">V2RAY Worker - Control Panel</div>
            <div class="text-nowrap fs-6 text-center">
              Version 2.0 by
              <a href="https://twitter.com/vahidfarid" target="_blank" class="text-white">Vahid Farid</a>
            </div>
          </div>
          <div class="px-5 py-2">
            <label for="sub-link" class="form-label fw-bold">
              Your subscription link / لینک ثبت نام شما:
            </label>
            <div id="sub-link" class="bg-info p-1">
              <input id="link" readonly="" value="https://${url.hostname}/sub" class="m-3 p-1" style="width: calc(100% - 150px)">
              <button onclick="var tmp=document.getElementById('link');tmp.select();tmp.setSelectionRange(0,99999);navigator.clipboard.writeText(tmp.value)" class="btn btn-primary">Copy</button>
            </div>
          </div>
          <div class="mx-5 my-2 p-3 border bg-warning text-center">
            <p>The "settings" variable is not defined! Please define a namespace in Workers/KV section and add a variable named "settings" in your worker settings, as described in the video.</p>  
            <p dir="rtl">متغیر settings تغریف نشده است. لطفا مطابق ویدیوی آموزشی، در بخش KV یک namespace تعریف کرده و در بخش متغیرهای ورکر، متغیر settings را اضافه نمایید.</p>
          </div>
          <div class="mx-5 my-2 p-3 border bg-success text-white text-center">
            <p>You can continue using your worker without control panel.</p>  
            <p>شما می‌توانید از ورکر خود بدون کنترل پنل استفاده نمایید.</p>  
          </div>
        </div>
      </body>
    </html>
    `

    return new Response(htmlContent, {
      headers: {'Content-Type': 'text/html'},
    });
  }
}

export async function PostPanel(request: Request, env: Env): Promise<Response> {
  var message
  try {
    const formData = await request.formData();

    await env.settings.put("OutputType", formData.get("type") || "base64")
    await env.settings.put("MaxConfigs", formData.get("max") || "200")
    await env.settings.put("Protocols", formData.getAll("protocols")?.join("\n"))
    await env.settings.put("ALPNs", formData.get("alpn_list"))
    await env.settings.put("FingerPrints", formData.get("fp_list"))
    await env.settings.put("Providers", formData.get("providers"))
    await env.settings.put("CleanDomainIPs", formData.get("clean_ips"))
    await env.settings.put("Configs", formData.get("configs"))
    await env.settings.put("IncludeOriginalConfigs", formData.get("original") || "yes")
    await env.settings.put("IncludeMergedConfigs", formData.get("merged") || "yes")

    message = "Settings saved successfully / تنظیمات با موفقیت ذخیره شد."
  } catch (e) {
    message = "Failed to save settings / خطا در ذخیره‌ی تنظیمات!"
  }

  const htmlContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf8" />
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-4bw+/aepP/YC94hEpVNVgiZdgIC5+VKNBQNGCHeKRQN+PtmoHDEXuppvnDJzQIu9" crossorigin="anonymous">
    </head>
    <body dir="ltr">
      <div class="container p-10 text-center">
        ${message}
      </div>
    </body>
  </html>
  `
  return new Response(htmlContent, {
    headers: {'Content-Type': 'text/html'},
  });
}
