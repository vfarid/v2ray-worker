import * as bcrypt from 'bcryptjs'
import { GenerateToken, Delay } from "./helpers"
import { Env } from "./interfaces"

export async function GetLogin(request: Request, env: Env): Promise<Response> {
  const url: URL = new URL(request.url)
  var htmlMessage = ""
  const message = url.searchParams.get("message")
  if (message == "error") {
    htmlMessage = `<b class="text-danger">Incorrect Password!</b>`
  } else {
    htmlMessage = `Login to Panel`
  }

  const htmlContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Login | Admin Panel</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta charset="utf8" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/admin-lte/3.2.0/css/adminlte.min.css" integrity="sha512-IuO+tczf4J43RzbCMEFggCWW5JuX78IrCJRFFBoQEXNvGI6gkUw4OjuwMidiS4Lm9Q2lILzpJwZuMWuSEeT9UQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" integrity="sha512-z3gLpd7yknf1YoNbCzqRKc4qyor8gaKU1qmn+CShxbuBusANI9QpRohGBreCFkKxLhei6S9CQXFEbbKuqLg0DA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    </head>
    <body class="hold-transition login-page">
      <main class="login-box">
        <div class="login-logo"> Control <b>Panel</b>
        </div>
        <div class="card">
          <div class="card-body login-card-body">
            <p class="login-box-msg">${htmlMessage}</p>
            <form method="post">
              <div class="input-group mb-3">
                <input type="password" class="form-control" id="inputPassword2" placeholder="Password" name="password" minlength="6" required>
                <div class="input-group-append">
                  <div class="input-group-text">
                    <span class="fas fa-lock"></span>
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col-8">
                  <div class="icheck-primary">
                    <input type="checkbox" id="remember">
                    <label for="remember"> Remember me? </label>
                  </div>
                </div>
                <div class="col-4">
                  <button type="submit" class="btn btn-primary btn-block">Sign In</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/admin-lte/3.2.0/js/adminlte.min.js" integrity="sha512-KBeR1NhClUySj9xBB0+KRqYLPkM6VvXiiWaSz/8LCQNdRpUm38SWUrj0ccNDNSkwCD9qPA4KobLliG26yPppJA==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
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
  var hashedPassword: string = await env.settings.get("Password") || ""

  await Delay(1000)

  const match = await bcrypt.compare(password, hashedPassword)
    
  if (match) {
    const token: string = GenerateToken(24)
    await env.settings.put("Token", token)
    return Response.redirect(`${url.protocol}//${url.hostname}${url.port != "443" ? ":" + url.port : ""}/?token=${token}`, 302)
  }

  return Response.redirect(`${url.protocol}//${url.hostname}${url.port != "443" ? ":" + url.port : ""}/login?message=error`, 302)
}
