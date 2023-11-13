import * as bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from "uuid"
import { IsValidUUID, GenerateToken } from "./helpers"
import { defaultProviders, defaultProtocols, defaultALPNList, defaultPFList } from "./variables"
import { Env } from "./interfaces"

const head = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Dashboard | Admin Panel</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta charset="utf8" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/admin-lte/3.2.0/css/adminlte.min.css" integrity="sha512-IuO+tczf4J43RzbCMEFggCWW5JuX78IrCJRFFBoQEXNvGI6gkUw4OjuwMidiS4Lm9Q2lILzpJwZuMWuSEeT9UQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" integrity="sha512-z3gLpd7yknf1YoNbCzqRKc4qyor8gaKU1qmn+CShxbuBusANI9QpRohGBreCFkKxLhei6S9CQXFEbbKuqLg0DA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    </head>
        <body class="hold-transition sidebar-mini">
      <div class="wrapper">
        <!-- Navbar -->
        <nav class="main-header navbar navbar-expand navbar-white navbar-light">
          <!-- Left navbar links -->
          <ul class="navbar-nav">
            <li class="nav-item">
              <a class="nav-link" data-widget="pushmenu" href="#" role="button">
                <i class="fas fa-bars"></i>
              </a>
            </li>
            <li class="nav-item d-none d-sm-inline-block">
              <a href="index3.html" class="nav-link">Home</a>
            </li>
            <li class="nav-item d-none d-sm-inline-block">
              <a href="#" class="nav-link">Contact</a>
            </li>
          </ul>
          <!-- Right navbar links -->
          <ul class="navbar-nav ml-auto">
            <!-- Navbar Search -->
            <li class="nav-item">
              <a class="nav-link" data-widget="navbar-search" href="#" role="button">
                <i class="fas fa-search"></i>
              </a>
              <div class="navbar-search-block">
                <form class="form-inline">
                  <div class="input-group input-group-sm">
                    <input class="form-control form-control-navbar" type="search" placeholder="Search" aria-label="Search">
                    <div class="input-group-append">
                      <button class="btn btn-navbar" type="submit">
                        <i class="fas fa-search"></i>
                      </button>
                      <button class="btn btn-navbar" type="button" data-widget="navbar-search">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </li>
          </ul>
        </nav>
        <aside class="main-sidebar sidebar-dark-primary elevation-4">
          <!-- Brand Logo -->
          <a href="#" class="brand-link">
            <img src="https://avatars.githubusercontent.com/u/41739417?v=4" alt="Logo" class="brand-image img-circle elevation-3" style="opacity: .8">
            <span class="brand-text font-weight-light">Admin</span>
          </a>
          <div class="sidebar">
            <div class="form-inline">
              <div class="input-group" data-widget="sidebar-search">
                <input class="form-control form-control-sidebar" type="search" placeholder="Search" aria-label="Search">
                <div class="input-group-append">
                  <button class="btn btn-sidebar">
                    <i class="fas fa-search fa-fw"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>
        <div class="content">
          <div class="container">
            <div class="row">
              
`

const foot = `
              
            </div>
          </div>
        </div>
  <footer class="main-footer">
    <!-- To the right -->
    <div class="float-right d-none d-sm-inline">
      Sub Control Panel
    </div>
    <!-- Default to the left -->
    <strong>Copyright &copy; 2023 Bear Panel.</strong> <p>All rights reserved.</p>
  </footer>
      </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js" integrity="sha512-v2CJ7UaYy4JwqLDIrZUI/4hqeoQieOmAZNXBeQyjo21dadnwR+8ZaIJVT8EE2iyI61OV8e6M8PP2/4hpQINQ/g==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/js/bootstrap.bundle.min.js" integrity="sha512-X/YkDZyjTf4wyc2Vy16YGCPHwAY8rZJY+POgokZjQB2mhIRFJCckEGc6YyX9eNsPfn0PzThEuNs+uaomE5CO6A==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/admin-lte/3.2.0/js/adminlte.min.js" integrity="sha512-KBeR1NhClUySj9xBB0+KRqYLPkM6VvXiiWaSz/8LCQNdRpUm38SWUrj0ccNDNSkwCD9qPA4KobLliG26yPppJA==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    </body>
  </html>
`

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
      htmlMessage = `<div class="mt-4 col-lg-6"><div class="card text-center"><b class="text-success">Configuration Saved!</b></div></div>`
    } else if (message == "error") {
      htmlMessage = `<div class="mt-4 col-lg-6"><div class="card text-center"><b class="text-success">Error While Saving Configuration!</b></div></div>`
    }

    var passwordSection = ""
    if (hash) {
      passwordSection = `
      <div class="mb-3 p-3 text-center">
        <button type="submit" name="reset_password" value="1" class="btn btn-danger">Remove Password</button>
      </div>
      `
    } else {
      passwordSection = `
      <div class="mb-3 p-3 bg-warning">
        <label for="password" class="form-label fw-bold">
          Enter password, if you want to protect panel</label>
        <input type="password" name="password" class="form-control" id="password" minlength="6"/>
        <div class="form-text">
          Minimum 6 chars</div>
        <p></p>
        <label for="password-confirmation" class="form-label fw-bold">
          Confirm your password</label>
        <input type="password" name="password_confirmation" class="form-control" id="password-confirmation" minlength="6"/>
      </div>
      `
    }

    var htmlContent  = `
${head}
        ${htmlMessage}
          <div class="mt-6 col-lg-6">
            <div class="card card-primary card-outline h-100">
              <div class="card-header">
                <h5 class="m-0">Subscription V2Ray</h5>
              </div>
              <div class="card-body">
          <p for="sub-link" class="text-muted">
            Your subscription link for v2ray clients
            (v2rayN, v2rayNG, v2rayA, Matsuri, Nekobox, Nekoray...)
          </p>
          <div class="input-group mb-3">
          <input id="sub-link" readonly value="https://${url.hostname}/sub" class="form-control">
          <button onclick="var tmp=document.getElementById('sub-link');tmp.select();tmp.setSelectionRange(0,99999);navigator.clipboard.writeText(tmp.value)" class="btn btn-outline-secondary">Copy</button>
          </div>
        </div>
        </div>
        </div>
          <div class="mt-4 col-lg-6">
            <div class="card card-primary card-outline h-100">
              <div class="card-header">
                <h5 class="m-0">Subscription Clash</h5>
              </div>
              <div class="card-body">
          <p for="clash-link" class="text-muted">
            Your subscription link for clash clients
            (Clash, ClashX, OpenClash, ClashMeta...)
          </p>
          <div class="input-group mb-3">
          <input id="clash-link" readonly value="https://${url.hostname}/clash" class="form-control">
          <button onclick="var tmp=document.getElementById('clash-link');tmp.select();tmp.setSelectionRange(0,99999);navigator.clipboard.writeText(tmp.value)" class="btn btn-outline-secondary">Copy</button>
          </div>
        </div>
        </div>
        </div>
          <div class="mt-4 mb-4 col-lg-6">
            <div class="card card-primary card-outline">
              <div class="card-header">
                <h5 class="m-0">Configuration</h5>
              </div>
              <div class="card-body">
        <form class="px-4 py-4 border-top" method="post">
          <div class="mb-3 p-3">
            <label for="includes" class="form-label fw-bold">
              Merged and original configs </label>
            <div id="includes">
              <div class="mb-3 form-check">
                <input type="checkbox" name="merged" value="yes" class="form-check-input" id="merged-ckeck" ${includeMergedConfigs == "yes" ? "checked" : ""}>
                <label class="form-check-label" for="merged-ckeck">Include configs merged with worker</label>
              </div>
              <div class="mb-3 form-check">
                <input type="checkbox" name="original" value="yes" class="form-check-input" id="original-ckeck" ${includeOriginalConfigs == "yes" ? "checked" : ""}>
                <label class="form-check-label" for="original-ckeck">Include original config </label>
              </div>
            </div>
          </div>
          <div class="mb-3 p-3">
            <label for="max-configs" class="form-label fw-bold">
              Max. mumber of configs</label>
            <input type="number" name="max" class="form-control" id="max-configs" value="${maxConfigs}" min="5"/>
            <div class="form-text"></div>
          </div>
          <div class="mb-3 p-3">
            <label for="type" class="form-label fw-bold">
              Protocols</label>
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
              Clean IP or clean subdomain</label>
            <textarea rows="2" name="clean_ips" class="form-control" id="clean-ip">${cleanDomainIPs.join("\n")}</textarea>
            <div class="form-text">
              One IP or subdomain per line.</div>
          </div>
          <div class="mb-3 p-3">
            <label for="alpn-list" class="form-label fw-bold">
              ALPN List:
            </label>
            <textarea rows="3" name="alpn_list" class="form-control" id="alpn-list">${alpnList.join("\n")}</textarea>
            <div class="form-text">
              One item per line.</div>
          </div>
          <div class="mb-3 p-3">
            <label for="pf-list" class="form-label fw-bold">
              FingerPrint List:
            </label>
            <textarea rows="3" name="fp_list" class="form-control" id="fp-list">${fingerPrints.join("\n")}</textarea>
            <div class="form-text">
              One item per line.</div>
          </div>
          <div class="mb-3 p-3">
            <label for="providers" class="form-label fw-bold">
              Providers
            </label>
            <textarea rows="7" name="providers" class="form-control" id="providers">${providers.join("\n")}</textarea>
            <div class="form-text">
              One link per line. (Accepts base64, yaml, raw)
            </div>
          </div>
          <div class="mb-3 p-3">
            <label for="configs" class="form-label fw-bold">
              Personal configs</label>
            <textarea rows="3" name="configs" class="form-control" id="configs">${configs.join("\n")}</textarea>
            <div class="form-text">
              One config per line.
            </div>
          </div>
          ${passwordSection}
        </div>
        <div class="card-footer">
          <button type="submit" name="save" value="save" class="btn btn-primary">Save</button>
          <button type="submit" name="reset" value="reset" class="btn btn-warning float-right">Reset</button>
        </div>
        </form>
        </div>
        </div>
        </div>
${foot}
    `
  
    return new Response(htmlContent, {
      headers: {"Content-Type": "text/html"},
    })
  } catch (e) {
    const htmlContent = `
${head}
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
${foot}
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
