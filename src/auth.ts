import * as bcrypt from 'bcryptjs'
import { GenerateToken, Delay } from "./helpers"
import { Env } from "./interfaces"
import { version } from "./variables"

export async function GetLogin(request: Request, env: Env): Promise<Response> {
  const url: URL = new URL(request.url)
  let htmlMessage = ""
  const message = url.searchParams.get("message")
  if (message == "error") {
    htmlMessage = `<div class="p-3 bg-danger text-white fw-bold text-center">Invalid password / کلمه عبور معتبر نمی‌باشد!</div>`
  }

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
            Version ${version}
          </div>
        </div>
        ${htmlMessage}
        <form class="mt-5 p-3 row g-3" method="post">
          <div class="col-auto">
            Enter password / کلمه‌ی عبور را وارد کنید:
          </div>
          <div class="col-auto">
            <label for="inputPassword2" class="visually-hidden">Password</label>
            <input type="password" class="form-control" id="inputPassword2" placeholder="Password" name="password" minlength="6" required>
          </div>
          <div class="col-auto">
            <button type="submit" class="btn btn-primary mb-3">Confirm identity / تایید هویت</button>
          </div>
        </form>
      </div>
    </body>
  </html>
  `

  return new Response(htmlContent, {
    headers: {"Content-Type": "text/html"},
  })
}

export async function PostLogin(request: Request, env: Env): Promise<Response> {
  const url: URL = new URL(request.url)
  const formData = await request.formData()
  const password: string = formData.get("password") || ""
  let hashedPassword: string = await env.settings.get("Password") || ""

  await Delay(1000)

  const match = await bcrypt.compare(password, hashedPassword)
    
  if (match) {
    const token: string = GenerateToken(24)
    await env.settings.put("Token", token)
    return Response.redirect(`${url.protocol}//${url.hostname}${url.port != "443" ? ":" + url.port : ""}/?token=${token}`, 302)
  }

  return Response.redirect(`${url.protocol}//${url.hostname}${url.port != "443" ? ":" + url.port : ""}/login?message=error`, 302)
}
