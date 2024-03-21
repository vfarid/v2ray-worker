import * as bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from "uuid"
import { IsValidUUID, GenerateToken, getDefaultProviders, getDefaultProxies } from "./helpers"
import { version, defaultProtocols, defaultALPNList, defaultPFList } from "./variables"
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
    const cleanDomainIPs: Array<string> = (await env.settings.get("CleanDomainIPs"))?.split("\n") || []
    const configs: Array<string> = (await env.settings.get("Configs"))?.split("\n") || []
    const includeOriginalConfigs: string = await env.settings.get("IncludeOriginalConfigs") || "yes"
    const includeMergedConfigs: string = await env.settings.get("IncludeMergedConfigs") || "yes"
    const autoLoadProviders: string = (await env.settings.get("AutoLoadProviders")) || "yes"
    const providers = (await env.settings.get("Providers"))?.trim().split("\n") || []
    const autoLoadProxies: string = (await env.settings.get("AutoLoadProxies")) || "yes"
    const proxies = (await env.settings.get("Proxies"))?.trim().split("\n") || []

    var uuid: string = await env.settings.get("UUID") || ""
    if (!IsValidUUID(uuid)) {
      uuid = uuidv4()
      await env.settings.put("UUID", uuid)
    }
    
    var htmlMessage = ""
    const message = url.searchParams.get("message")
    if (message == "success") {
      htmlMessage = `<div class="p-1 bg-success text-white fw-bold text-center">Settings saved successfully. / تنظیمات با موفقیت ذخیره شد.</div>`
    } else if (message == "error") {
      htmlMessage = `<div class="p-1 bg-danger text-white fw-bold text-center">Failed to save settings! / خطا در ذخیره‌ی تنظیمات!</div>`
    }

    var passwordSection = ""
    if (hash) {
      passwordSection = `
      <div class="mb-3 p-1">
        <button type="submit" name="reset_password" value="1" class="btn btn-danger">Remove Password / حذف کلمه عبور</button>
      </div>
      `
    } else {
      passwordSection = `
      <div class="mb-1 p-1 pb-0 pt-3 mt-3 border-top border-primary border-4">
        <label for="configs" class="form-label fw-bold"> Security&nbsp;</label>
      </div>
      <div class="mb-3 p-3 border rounded">
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
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous" rel="stylesheet" />
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
    </head>
    <body id="body" style="--bs-body-font-size: .875rem">
      <div class="container border mt-3 p-0 border-primary border-2 rounded">
        <div id="lang-group" class="btn-group float-end m-2" role="group" dir="ltr"></div>
        <div class="p-2 border-bottom border-primary border-2">
          <div class="text-nowrap fs-5 fw-bold text-dark">
            V2RAY Worker - Control Panel &nbsp;&nbsp;<span class="text-nowrap fs-6 text-info">Version ${version}</span>
          </div>
        </div>
        ${htmlMessage}
        <div class="px-4 py-2 bg-light">
          <label id="sub-link-title" for="sub-link" class="form-label fw-bold"></label>
          <input id="sub-link" readonly value="https://${url.hostname}/sub" class="p-1" style="width: calc(100% - 150px)">
          <button onclick="var tmp=document.getElementById('sub-link');tmp.select();tmp.setSelectionRange(0,99999);navigator.clipboard.writeText(tmp.value)" class="btn btn-primary p-1 mb-1">Copy</button>
        </div>
        <div class="px-4 py-2 bg-light">
          <label for="sub-link" class="form-label fw-bold">
            Your subscription link for custom configs / <span dir="rtl">لینک ثبت نام شما در قالب custom</span>
          </label>
          <input id="sub-link" readonly value="https://${url.hostname}/custom" class="p-1" style="width: calc(100% - 150px)">
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
        <form class="px-4 py-4 border-top border-2 border-primary" method="post">
          <div class="mb-1 p-1">
            <label for="includes" class="form-label fw-bold">
              Merged and original configs / کانفیگ‌های اصلی و ترکیبی:
            </label>
            <div id="includes">
              <div class="form-check">
                <input type="checkbox" name="merged" value="yes" class="form-check-input" id="merged-ckeck" ${includeMergedConfigs == "yes" ? "checked" : ""}>
                <label class="form-check-label" for="merged-ckeck">Include configs merged with worker / کانفیگ‌های ترکیب شده با ورکر را اضافه کن</label>
              </div>
              <div class="form-check">
                <input type="checkbox" name="original" value="yes" class="form-check-input" id="original-ckeck" ${includeOriginalConfigs == "yes" ? "checked" : ""}>
                <label class="form-check-label" for="original-ckeck">Include original config / کانفیگ‌های اصلی را اضافه کن</label>
              </div>
            </div>
          </div>
          <div class="mb-1 p-1">
            <label for="max-configs" class="form-label fw-bold">
              Max. mumber of configs / حداکثر تعداد کانفیگ:
            </label>
            <input type="number" name="max" class="form-control" id="max-configs" value="${maxConfigs}" min="5"/>
            <div class="form-text"></div>
          </div>
          <div class="mb-1 p-1">
            <label for="type" class="form-label fw-bold">
              Protocols / پروتکل‌ها:
            </label>
            <div id="type">
              <div class="form-check">
                <input type="checkbox" name="protocols" value="vmess" class="form-check-input" id="vmess-protocol-ckeck" ${protocols.includes('vmess') ? "checked" : ""} />
                <label class="form-check-label" for="vmess-protocol-ckeck">VMESS</label>
              </div>
              <div class="form-check">
                <input type="checkbox" name="protocols" value="vless" class="form-check-input" id="vless-protocol-ckeck" ${protocols.includes('vless') ? "checked" : ""} />
                <label class="form-check-label" for="vless-protocol-ckeck">VLESS</label>
              </div>
              <div class="form-check">
                <input type="checkbox" name="protocols" value="trojan" class="form-check-input" id="trojan-protocol-ckeck" ${protocols.includes('trojan') ? "checked" : ""} />
                <label class="form-check-label" for="trojan-protocol-ckeck">TROJAN</label>
              </div>
              <div class="form-check">
                <input type="checkbox" name="protocols" value="ss" class="form-check-input" id="ss-protocol-ckeck" ${protocols.includes('ss') ? "checked" : ""} />
                <label class="form-check-label" for="ss-protocol-ckeck">ShadowSocks</label>
              </div>
            </div>
          </div>
          <div class="mb-1 p-1">
            <label for="clean-ip" class="form-label fw-bold">
              Clean IP or clean subdomain / آی‌پی تمیز یا ساب‌دامین آی‌پی تمیز
            </label>
            <textarea rows="3" name="clean_ips" class="form-control" id="clean-ip">${cleanDomainIPs.join("\n")}</textarea>
            <div class="form-text">
              One IP or subdomain per line. / در هر سطر یک آی‌پی یا ساب‌دامین وارد کنید.
            </div>
            <div>
              <button type="button" class="btn btn-info" data-bs-toggle="modal" data-bs-target="#ip-scanner-modal">
                Find clean IPs / پیدا کردن آی‌پی تمیز
              </button>
              <div class="modal fade" id="ip-scanner-modal" tabindex="-1" aria-labelledby="ip-scanner-modal-label" aria-hidden="true">
                <div class="modal-dialog modal-xl modal-dialog-scrollable">
                  <div class="modal-content">
                    <div class="modal-header">
                      <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">
                        Close / بستن  
                      </button>
                    </div>
                    <div class="modal-body">
                      <iframe src="https://vfarid.github.io/cf-ip-scanner/" style="width: 100%; height: 90vh;"></iframe>
                    </div>
                  </div>
                </div>
              </div>
              </div>
          </div>
          <div class="mb-1 p-1">
            <label for="alpn-list" class="form-label fw-bold">
              ALPN List:
            </label>
            <textarea rows="3" name="alpn_list" class="form-control" id="alpn-list">${alpnList.join("\n")}</textarea>
            <div class="form-text">
              One item per line. / در هر سطر یک آیتم وارد کنید.
            </div>
          </div>
          <div class="mb-1 p-1">
            <label for="pf-list" class="form-label fw-bold">
              FingerPrint List:
            </label>
            <textarea rows="3" name="fp_list" class="form-control" id="fp-list">${fingerPrints.join("\n")}</textarea>
            <div class="form-text">
              One item per line. / در هر سطر یک آیتم وارد کنید.
            </div>
          </div>
          <div class="mb-1 p-1">
            <label for="providers" class="form-label fw-bold">
              Providers / تامین کنندگان:
            </label>
            <textarea rows="7" name="providers" class="form-control" id="providers">${providers.join("\n")}</textarea>
            <div class="form-text">
              One link per line. / در هر سطر یک لینک وارد کنید. (Accepts base64, yaml, raw)
            </div>
          </div>
          <div class="mb-1 p-1">
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
        <div class="p-1 border-top border-2 border-primary">
          <div class="text-nowrap fs-6">
            Copyright 2024 Vahid Farid<br/>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" role="img" class="octicon">
              <g clip-path="url(#clip0_1668_3024)">
                <path d="M9.52217 6.77143L15.4785 0H14.0671L8.89516 5.87954L4.76437 0H0L6.24656 8.8909L0 15.9918H1.41155L6.87321 9.78279L11.2356 15.9918H16L9.52183 6.77143H9.52217ZM7.58887 8.96923L6.95596 8.0839L1.92015 1.03921H4.0882L8.15216 6.7245L8.78507 7.60983L14.0677 14.9998H11.8997L7.58887 8.96957V8.96923Z" fill="currentColor"></path>
              </g>
              <defs>
                <clipPath id="clip0_1668_3024">
                  <rect width="16" height="16" fill="white"></rect>
                </clipPath>
              </defs>
            </svg>
            <a class="link-dark link-offset-2" href="https://twitter.com/vahidfarid" target="_blank">@vahidfarid</a><br/>
            
            <svg height="16" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-mark-github v-align-middle color-fg-default">
              <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
            </svg>
            <a class="link-dark link-offset-2" href="https://github.com/vfarid" target="_blank">vfarid</a>            </p>
          </div>
        </div>
      </div>
    </body>
    <script>
    let language = localStorage.getItem("lang") || "fa"
    window.addEventListener("load", (event) => {
      initLang();
      setLang(language);
    });
    window.addEventListener('message', function (event) {
      document.getElementById('clean-ip').value = event.data;
    });

    function initLang() {
      document.getElementById("lang-group").innerHTML = ""
      for (code in strings) {
        const el = document.createElement("button")
        el.classList = "btn btn-outline-primary btn-sm rounded-2"
        el.id = \`btn-\${code}\`
        el.type = "button"
        el.innerText = code.toUpperCase()
        el.setAttribute("data-lang", code);
        el.addEventListener("click", (e) => {
            setLang(e.srcElement.getAttribute("data-lang"))
        })
        document.getElementById("lang-group").appendChild(el)

        const el2 = document.createElement("span")
        el2.innerHTML = "&nbsp;"
        document.getElementById("lang-group").appendChild(el2)
      }
    }
  
    function setLang(code) {
      if (strings[code] === undefined) {
        code = "en"
      }
      document.getElementById('body').style.direction = directions[code] || "ltr"
      document.getElementById('btn-' + language).classList.remove('btn-primary')
      document.getElementById('btn-' + language).classList.add('btn-outline-primary')
      document.getElementById('btn-' + code).classList.remove('btn-outline-primary')
      document.getElementById('btn-' + code).classList.add('btn-primary')
      
      for (key in strings[code]) {
        document.getElementById(key).innerText = strings[code][key]
      }
  
      language = code
      localStorage.setItem('lang', code);
    }

    const directions = {
      en: "ltr",
      fa: "rtl",
    }
  
    const strings = {
      en: {
          "page-title": "V2ray Worker",
          "sub-link-title": "Your subscription link for v2ray clients (v2rayN, v2rayNG, v2rayA, Matsuri, Nekobox, Nekoray...)",
          "account-id-title": "Account ID",
          "api-token-title": "API Token",
          "deploy-title": "Deploy Worker",
          "save-settings-label": "Save setting on current device for future use"
      },
      fa: {
          "page-title": "ورکر v2ray",
          "sub-link-title": "لینک ثبت نام شما برای کلاینت‌های v2ray (v2rayN, v2rayNG, v2rayA, Matsuri, Nekobox, Nekoray...)",
          "account-id-title": "شناسه اکانت",
          "api-token-title": "توکن API",
          "deploy-title": "استقرار ورکر",
          "save-settings-label": "ذخیره اطلاعات روی دستگاه فعلی برای استفاده‌های بعدی",
      },
    }
    </script>
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
      <body id="body" style="--bs-body-font-size: .875rem">
        <div class="container border mt-3 p-0 border-primary border-2 rounded">
          <div id="lang-group" class="btn-group m-2" role="group" dir="ltr"></div>
          <div class="p-2 border-bottom border-primary border-2">
            <div class="text-nowrap fs-5 fw-bold text-dark">
              <span id="page-title"></span> &nbsp;&nbsp;<span class="text-nowrap fs-6 text-info"><span id="text-version"></span> ${version}</span>
            </div>
          </div>
          <div class="px-5 py-2 bg-light">
            <label id="sub-link-title" for="sub-link" class="form-label fw-bold"></label>
            <input id="sub-link" readonly value="https://${url.hostname}/sub" class="p-1" style="width: calc(100% - 150px)">
            <button onclick="var tmp=document.getElementById('sub-link');tmp.select();tmp.setSelectionRange(0,99999);navigator.clipboard.writeText(tmp.value)" class="btn btn-primary p-1 mb-1">Copy</button>
          </div>
          <div class="px-5 py-2 bg-light">
            <label id="custom-link-title" for="custom-link" class="form-label fw-bold"></label>
            <input id="custom-link" readonly value="https://${url.hostname}/custom" class="p-1" style="width: calc(100% - 150px)">
            <button onclick="var tmp=document.getElementById('custom-link');tmp.select();tmp.setSelectionRange(0,99999);navigator.clipboard.writeText(tmp.value)" class="btn btn-primary p-1 mb-1">Copy</button>
          </div>
          <div class="px-5 py-2 bg-light">
            <label id="clash-link-title" for="clash-link" class="form-label fw-bold"></label>
            <input id="clash-link" readonly value="https://${url.hostname}/clash" class="p-1" style="width: calc(100% - 150px)">
            <button onclick="var tmp=document.getElementById('clash-link');tmp.select();tmp.setSelectionRange(0,99999);navigator.clipboard.writeText(tmp.value)" class="btn btn-primary p-1 mb-1">Copy</button>
          </div>
          <div id="you-can-use-your-worker-message" class="mx-5 my-2 p-4 border bg-success text-white fw-bold text-center"></div>
          <div class="mx-5 my-2 p-1 border bg-warning">
            <div id="you-need-namespace-message"></div>
            <ol>
              <li>
                <a id="open-kv-text" href="https://dash.cloudflare.com/?to=/:account/workers/kv/namespaces" target="_blank"></a>
              </li>
              <li>
                <a id="open-variables-text" href="https://dash.cloudflare.com/?to=/:account/workers/services/view/${url.hostname.split(".")[0]}/production/settings/bindings" target="_blank"></a>
              </li>
            </ol>
          </div>
          <div class="p-1 border-top border-2 border-primary">
            <div class="text-nowrap fs-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" role="img" class="octicon">
                <g clip-path="url(#clip0_1668_3024)">
                  <path d="M9.52217 6.77143L15.4785 0H14.0671L8.89516 5.87954L4.76437 0H0L6.24656 8.8909L0 15.9918H1.41155L6.87321 9.78279L11.2356 15.9918H16L9.52183 6.77143H9.52217ZM7.58887 8.96923L6.95596 8.0839L1.92015 1.03921H4.0882L8.15216 6.7245L8.78507 7.60983L14.0677 14.9998H11.8997L7.58887 8.96957V8.96923Z" fill="currentColor"></path>
                </g>
                <defs>
                  <clipPath id="clip0_1668_3024">
                    <rect width="16" height="16" fill="white"></rect>
                  </clipPath>
                </defs>
              </svg>
              <a class="link-dark link-offset-2" href="https://twitter.com/vahidfarid" target="_blank">@vahidfarid</a><br/>
              
              <svg height="16" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-mark-github v-align-middle color-fg-default">
                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
              </svg>
              <a class="link-dark link-offset-2" href="https://github.com/vfarid" target="_blank">vfarid</a>            </p>
            </div>
          </div>
        </div>
      </body>
      <script>
      let language = localStorage.getItem("lang") || "fa"
      window.addEventListener("load", (event) => {
        initLang();
        setLang(language);
      });
      window.addEventListener('message', function (event) {
        document.getElementById('clean-ip').value = event.data;
      });
  
      function initLang() {
        document.getElementById("lang-group").innerHTML = ""
        for (code in strings) {
          const el = document.createElement("button")
          el.classList = "btn btn-outline-primary btn-sm rounded-2"
          el.id = \`btn-\${code}\`
          el.type = "button"
          el.innerText = code.toUpperCase()
          el.setAttribute("data-lang", code);
          el.addEventListener("click", (e) => {
              setLang(e.srcElement.getAttribute("data-lang"))
          })
          document.getElementById("lang-group").appendChild(el)
  
          const el2 = document.createElement("span")
          el2.innerHTML = "&nbsp;"
          document.getElementById("lang-group").appendChild(el2)
        }
      }
    
      function setLang(code) {
        if (strings[code] === undefined) {
          code = "en"
        }
        
        document.getElementById('body').style.direction = languages[code]?.dir || "ltr"
        document.getElementById('lang-group').style.float = languages[code]?.end || "left"
        document.getElementById('btn-' + language).classList.remove('btn-primary')
        document.getElementById('btn-' + language).classList.add('btn-outline-primary')
        document.getElementById('btn-' + code).classList.remove('btn-outline-primary')
        document.getElementById('btn-' + code).classList.add('btn-primary')
        
        for (key in strings[code]) {
          document.getElementById(key).innerText = strings[code][key]
        }
    
        language = code
        localStorage.setItem('lang', code);
      }
  
      const languages = {
        en: {dir: "ltr", end: "right"},
        fa: {dir: "rtl", end: "left"},
      }
    
      const strings = {
        en: {
          "page-title": "V2ray Worker Control Panel",
          "text-version": "Version",
          "sub-link-title": "Your subscription link for v2ray clients (v2rayN, v2rayNG, v2rayA, Nekobox, Nekoray, V2Box...)",
          "custom-link-title": "Your subscription link for custom configs",
          "clash-link-title": "Your subscription link for clash clients (Clash, ClashX, ClashMeta...)",
          "you-can-use-your-worker-message": "You can continue using your worker without control panel.",
          "you-need-namespace-message": "The 'settings' namespace is not defined! Please define a namespace named 'settings' in your worker 'KV Namespace Bindings' using bellow link, as described in the video and relad the page afterward.",  
          "open-kv-text": "Open KV",
          "open-variables-text": "Open Worker's Variables",
        },
        fa: {
          "page-title": "پنل کنترل ورکر v2ray",
          "text-version": "نسخه",
          "sub-link-title": "لینک ثبت نام شما برای کلاینت‌های v2rayN, v2rayNG, v2rayA, Nekobox, Nekoray, V2Box و...",
          "custom-link-title": "لینک ثبت نام شما برای کانفیگ‌های Custom",
          "clash-link-title": "لینک ثبت نام شما برای کلاینت‌های کلش Clash, ClashX, ClashMeta و...",
          "you-can-use-your-worker-message": "شما می‌توانید از ورکر خود بدون پنل کنترل استفاده نمایید.",
          "you-need-namespace-message": "فضای نام settings تعریف نشده است. لطفا مطابق ویدیوی آموزشی، از طریق لینک‌های زیر ابتدا در بخش KV یک فضای نام به اسم settings ایجاد کنید و سپس ازطریق بخش 'KV Namespace Bindings' آن را با همان نام settings به ورکر خود متصل کنید و پس از ذخیره، مجددا پنل را باز کنید.",
          "open-kv-text": "بازکردن بخش KV",
          "open-variables-text": "بازکردن بخش متغیرهای ورکر",
        },
      }
      </script>
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
