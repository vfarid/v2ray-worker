import * as bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from "uuid"
import { IsValidUUID, GenerateToken } from "./helpers"
import { defaultProviders, defaultProtocols, defaultALPNList, defaultPFList } from "./variables"
import { Env } from "./interfaces"

export async function GetPanel(request: Request, env: Env): Promise<Response> {
  const url: URL = new URL(request.url)
  try {
    const hash: string | null = await env.settings.get("Password")
    const token: string | null = await env.settings.get("Token")

    if (hash && url.searchParams.get("token") != token) {
      return Response.redirect(`${url.protocol}//${url.hostname}${url.port != "443" ? ":" + url.port : ""}/login`, 302)
    }

    const maxConfigs: number = parseInt(await env.settings.get("MaxConfigs") || "200")
    const protocols: Array<string> = (await env.settings.get("Protocols"))?.split("\n") || defaultProtocols
    const alpnList: Array<string> = (await env.settings.get("ALPNs"))?.split("\n") || defaultALPNList
    const fingerPrints: Array<string> = (await env.settings.get("FingerPrints"))?.split("\n") || defaultPFList
    const providers: Array<string> = (await env.settings.get("Providers"))?.split("\n") || defaultProviders
    const cleanDomainIPs: Array<string> = (await env.settings.get("CleanDomainIPs"))?.split("\n") || []
    const configs: Array<string> = (await env.settings.get("Configs"))?.split("\n") || []
    const includeOriginalConfigs: string = await env.settings.get("IncludeOriginalConfigs") || "yes"
    const includeMergedConfigs: string = await env.settings.get("IncludeMergedConfigs") || "yes"
    var uuid: string = await env.settings.get("UUID") || ""
    if (!IsValidUUID(uuid)) {
      uuid = uuidv4()
      await env.settings.put("UUID", uuid)
    }
    
    var htmlMessage = ""
    const message = url.searchParams.get("message")
    if (message == "success") {
      htmlMessage = `<div class="p-3 bg-success text-white fw-bold text-center">Settings saved successfully. / تنظیمات با موفقیت ذخیره شد.</div>`
    } else if (message == "error") {
      htmlMessage = `<div class="p-3 bg-danger text-white fw-bold text-center">Failed to save settings! / خطا در ذخیره‌ی تنظیمات!</div>`
    }

    var passwordSection = ""
    if (hash) {
      passwordSection = `
      <div class="mb-3 p-3">
        <button type="submit" name="reset_password" value="1" class="btn btn-danger">Remove Password / حذف کلمه عبور</button>
      </div>
      `
    } else {
      passwordSection = `
      <div class="mb-3 p-3 bg-warning">
        <label for="password" class="form-label fw-bold">
          Enter password, if you want to protect panel / در صورتی که میخواهید از پنل محافظت کنید، یک کلمه‌ی عبور وارد کنید:
        </label>
        <input type="password" name="password" class="form-control" id="password" minlength="6"/>
        <div class="form-text">
          Minimum 6 chars / حداقل ۶ کاراکتر وارد کنید.
        </div>
        <p></p>
        <label for="password-confirmation" class="form-label fw-bold">
          Confirm your password / کلمه عبور را مجددا وارد کنید:
        </label>
        <input type="password" name="password_confirmation" class="form-control" id="password-confirmation" minlength="6"/>
      </div>
      `
    }

    var htmlContent  = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf8" />
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-4bw+/aepP/YC94hEpVNVgiZdgIC5+VKNBQNGCHeKRQN+PtmoHDEXuppvnDJzQIu9" crossorigin="anonymous">
    </head>
    <body dir="ltr">
      <div class="container border p-0">
        <div class="p-3 bg-primary text-white">
          <div class="text-nowrap fs-4 fw-bold text-center">V2RAY Worker - Control Panel</div>
          <div class="text-nowrap fs-6 text-center">
            Version 2.0 by
            <a href="https://twitter.com/vahidfarid" target="_blank" class="text-white">Vahid Farid</a>
          </div>
        </div>
        ${htmlMessage}
        <div class="px-4 py-2 bg-light">
          <label for="sub-link" class="form-label fw-bold">
            Your subscription link for v2ray clients/ <span dir="rtl">لینک ثبت نام شما برای کلاینت‌های v2ray</span>
            (v2rayN, v2rayNG, v2rayA, Matsuri, Nekobox, Nekoray...)
          </label>
          <input id="sub-link" readonly value="https://${url.hostname}/sub" class="p-1" style="width: calc(100% - 150px)">
          <button onclick="var tmp=document.getElementById('sub-link');tmp.select();tmp.setSelectionRange(0,99999);navigator.clipboard.writeText(tmp.value)" class="btn btn-primary p-1 mb-1">Copy</button>
        </div>
        <div class="px-4 py-2 bg-light">
          <label for="clash-link" class="form-label fw-bold">
            Your subscription link for clash clients/ <span dir="rtl">لینک ثبت نام شما برای کلاینت‌های کلش</span>
            (Clash, ClashX, ClashMeta...)
          </label>
          <input id="clash-link" readonly value="https://${url.hostname}/clash" class="p-1" style="width: calc(100% - 150px)">
          <button onclick="var tmp=document.getElementById('clash-link');tmp.select();tmp.setSelectionRange(0,99999);navigator.clipboard.writeText(tmp.value)" class="btn btn-primary p-1 mb-1">Copy</button>
        </div>
        <form class="px-4 py-4 border-top" method="post">
          <div class="mb-3 p-3">
            <label for="includes" class="form-label fw-bold">
              Merged and original configs / کانفیگ‌های اصلی و ترکیبی:
            </label>
            <div id="includes">
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
          <div class="mb-3 p-3">
            <label for="max-configs" class="form-label fw-bold">
              Max. mumber of configs / حداکثر تعداد کانفیگ:
            </label>
            <input type="number" name="max" class="form-control" id="max-configs" value="${maxConfigs}" min="5"/>
            <div class="form-text"></div>
          </div>
          <div class="mb-3 p-3">
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
                <input type="checkbox" name="protocols" value="trojan" class="form-check-input" id="trojan-protocol-ckeck" ${protocols.includes('trojan') ? "checked" : ""}>
                <label class="form-check-label" for="trojan-protocol-ckeck">TROJAN</label>
              </div>
              <div class="mb-3 form-check">
                <input type="checkbox" name="protocols" value="ss" class="form-check-input" id="ss-protocol-ckeck" ${protocols.includes('ss') ? "checked" : ""}>
                <label class="form-check-label" for="ss-protocol-ckeck">ShadowSocks</label>
              </div>
            </div>
          </div>
          <div class="mb-3 p-3">
            <label for="clean-ip" class="form-label fw-bold">
              Clean IP or clean subdomain / آی‌پی تمیز یا ساب‌دامین آی‌پی تمیز
            </label>
            <textarea rows="2" name="clean_ips" class="form-control" id="clean-ip">${cleanDomainIPs.join("\n")}</textarea>
            <div class="form-text">
              One IP or subdomain per line. / در هر سطر یک آی‌پی یا ساب‌دامین وارد کنید.
            </div>
          </div>
          <div class="mb-3 p-3">
            <label for="alpn-list" class="form-label fw-bold">
              ALPN List:
            </label>
            <textarea rows="3" name="alpn_list" class="form-control" id="alpn-list">${alpnList.join("\n")}</textarea>
            <div class="form-text">
              One item per line. / در هر سطر یک آیتم وارد کنید.
            </div>
          </div>
          <div class="mb-3 p-3">
            <label for="pf-list" class="form-label fw-bold">
              FingerPrint List:
            </label>
            <textarea rows="3" name="fp_list" class="form-control" id="fp-list">${fingerPrints.join("\n")}</textarea>
            <div class="form-text">
              One item per line. / در هر سطر یک آیتم وارد کنید.
            </div>
          </div>
          <div class="mb-3 p-3">
            <label for="providers" class="form-label fw-bold">
              Providers / تامین کنندگان:
            </label>
            <textarea rows="7" name="providers" class="form-control" id="providers">${providers.join("\n")}</textarea>
            <div class="form-text">
              One link per line. / در هر سطر یک لینک وارد کنید. (Accepts base64, yaml, raw)
            </div>
          </div>
          <div class="mb-3 p-3">
            <label for="configs" class="form-label fw-bold">
              Personal configs / کانفیگ‌های شخصی:
            </label>
            <textarea rows="3" name="configs" class="form-control" id="configs">${configs.join("\n")}</textarea>
            <div class="form-text">
              One config per line. / در هر سطر یک کانفیگ وارد کنید.
            </div>
          </div>
          ${passwordSection}
          <button type="submit" name="save" value="save" class="btn btn-primary">Save / ذخیره</button>
          <button type="submit" name="reset" value="reset" class="btn btn-warning">Reset / بازنشانی</button>
        </form>
      </div>
    </body>
    </html>
    `
  
    return new Response(htmlContent, {
      headers: {"Content-Type": "text/html"},
    })
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
          <div class="p-3 bg-primary text-white">
            <div class="text-nowrap fs-4 fw-bold text-center">V2RAY Worker - Control Panel</div>
            <div class="text-nowrap fs-6 text-center">
              Version 2.0 by
              <a href="https://twitter.com/vahidfarid" target="_blank" class="text-white">Vahid Farid</a>
            </div>
          </div>
          <div class="px-5 py-2 bg-light">
            <label for="sub-link" class="form-label fw-bold">
              Your subscription link for v2ray clients/ <span dir="rtl">لینک ثبت نام شما برای کلاینت‌های v2ray</span>
              (v2rayN, v2rayNG, v2rayA, Matsuri, Nekobox, Nekoray...)
            </label>
            <input id="sub-link" readonly value="https://${url.hostname}/sub" class="p-1" style="width: calc(100% - 150px)">
            <button onclick="var tmp=document.getElementById('sub-link');tmp.select();tmp.setSelectionRange(0,99999);navigator.clipboard.writeText(tmp.value)" class="btn btn-primary p-1 mb-1">Copy</button>
          </div>
          <div class="px-5 py-2 bg-light">
            <label for="clash-link" class="form-label fw-bold">
              Your subscription link for clash clients/ <span dir="rtl">لینک ثبت نام شما برای کلاینت‌های کلش</span>
              (Clash, ClashX, ClashMeta...)
            </label>
            <input id="clash-link" readonly value="https://${url.hostname}/clash" class="p-1" style="width: calc(100% - 150px)">
            <button onclick="var tmp=document.getElementById('clash-link');tmp.select();tmp.setSelectionRange(0,99999);navigator.clipboard.writeText(tmp.value)" class="btn btn-primary p-1 mb-1">Copy</button>
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
      headers: {"Content-Type": "text/html"},
    })
  }
}

export async function PostPanel(request: Request, env: Env): Promise<Response> {
  const url: URL = new URL(request.url)
  var token: string | null = await env.settings.get("Token")
  try {
    const formData = await request.formData()

    var hashedPassword: string | null = await env.settings.get("Password")

    if (hashedPassword && url.searchParams.get("token") != token) {
      return Response.redirect(`${url.protocol}//${url.hostname}${url.port != "443" ? ":" + url.port : ""}/login`, 302)
    }

    if (formData.get("reset_password")) {
      await env.settings.delete("Password")
      await env.settings.delete("Token")
      return Response.redirect(`${url.protocol}//${url.hostname}${url.port != "443" ? ":" + url.port : ""}?message=success`, 302)
    } else if (formData.get("save")) {
      const password: string | null = formData.get("password")
      if (password) {
        if (password.length < 6 || password !== formData.get("password_confirmation")) {
          return Response.redirect(`${url.protocol}//${url.hostname}${url.port != "443" ? ":" + url.port : ""}?message=invalid-password`, 302)
        }
        hashedPassword = await bcrypt.hash(password, 10);

        token = GenerateToken(24)
        await env.settings.put("Password", hashedPassword)
        await env.settings.put("Token", token)
      }
      
      await env.settings.put("MaxConfigs", formData.get("max") || "200")
      await env.settings.put("Protocols", formData.getAll("protocols")?.join("\n").trim())
      await env.settings.put("ALPNs", formData.get("alpn_list")?.trim().split("\n").map(str => str.trim()).join("\n") || "")
      await env.settings.put("FingerPrints", formData.get("fp_list")?.trim().split("\n").map(str => str.trim()).join("\n") || "")
      await env.settings.put("Providers", formData.get("providers")?.trim().split("\n").map(str => str.trim()).join("\n") || "")
      await env.settings.put("CleanDomainIPs", formData.get("clean_ips")?.trim().split("\n").map(str => str.trim()).join("\n") || "")
      await env.settings.put("Configs", formData.get("configs")?.trim().split("\n").map(str => str.trim()).join("\n") || "")
      await env.settings.put("IncludeOriginalConfigs", formData.get("original") || "no")
      await env.settings.put("IncludeMergedConfigs", formData.get("merged") || "no")
    } else {
      await env.settings.delete("MaxConfigs")
      await env.settings.delete("Protocols")
      await env.settings.delete("ALPNs")
      await env.settings.delete("FingerPrints")
      await env.settings.delete("Providers")
      await env.settings.delete("CleanDomainIPs")
      await env.settings.delete("Configs")
      await env.settings.delete("IncludeOriginalConfigs")
      await env.settings.delete("IncludeMergedConfigs")
      await env.settings.delete("UUID")
      await env.settings.delete("Password")
      await env.settings.delete("Token")
    }

    return Response.redirect(`${url.protocol}//${url.hostname}${url.port != "443" ? ":" + url.port : ""}?message=success${token ? "&token=" + token : ""}`, 302)
  } catch (e) {
    return Response.redirect(`${url.protocol}//${url.hostname}${url.port != "443" ? ":" + url.port : ""}?message=error${token ? "&token=" + token : ""}`, 302)
  }
}
