# V2Ray Worker

Total solution for V2Ray configs over Cloudflare's worker.

## 🚀 Deploy

Click the button below to deploy this Worker to your Cloudflare account.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/YOUR_GITHUB_USERNAME/v2ray-worker)

---

### Manual Setup

1. Fork this repository and enable GitHub Actions.
2. Open Cloudflare dashboard → Workers → KV → create a namespace named `settings`, then copy the Namespace ID.
3. In this repo (your fork), go to **Settings → Secrets and variables → Actions**:
   - `CLOUDFLARE_API_TOKEN` (Cloudflare token with Workers+KV edit scope)
   - `CLOUDFLARE_ACCOUNT_ID` (your CF account ID)
   - `KV_NAME` (your KV namespace ID)
4. Push to `main` and let GitHub Actions deploy.
5. Visit your Worker deployment URL.

---

## 📦 How it works

This Worker serves V2Ray config links using TypeScript and Cloudflare KV for storage.

Credits:
- Built-in generation based on vless generators and edge tools.
