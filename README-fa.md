
## V2Ray Worker
 راهکار جامع کانفیگ‌های v2ray روی ورکر

[English version](https://github.com/vfarid/v2ray-worker/blob/main/README.md)

### کانال یوتیوب
[ویدیوی آموزشی - اندروید](https://youtu.be/Jb_6jmrKKyo)

### کانال تلگرام
[در کانال تلگرام بخوانید](https://t.me/vahidgeek/140)

### روش استفاده
برای استفاده از این کد، اسکریپت worker.js را از بخش از آخرین نسخه دانلود کرده و روی یک ورکر جدید آپلود کنید.
برای این کار لازم است ابتدا اکانت کلادفلر خود را ایجاد کرده و یک ورکر جدید بر روی اکانت اضافه کنید. در صورتی که قبلا این کار را انجام نداده‌اید، ویدیوهای آموزش بالا را مشاهده نمایید.

### کلادفلر KV
در این اسکریپت، برای ذخیره‌ی اطلاعات پنل کنترل، از KV کلادفلر استفاده شده که لازم است برای بهره‌برداری از تمام قابلیت این ورکر، این بخش را راه اندازی کنید.
برای راه اندازی، دو بخش را باید تنظیم کنید:
 - ابتدا در بخش KV در زیرمجموعه‌ی Workers یک Namespace جدید با نام دلخواه اضافه کنید.
 - در صفحه اصلی ورکر، قبل از محیط ویرایشگر، به بخش Setting رفته و گزینه‌ی variables را انتخاب کنید. سپس اسکرول کنید تا به بخش KV برسید. در این بخش یک متغیر جدید با نام settings اضافه کرده و نامی که در بخش قبل برای namespace وارد کرده بودید را انتخاب کنید.

اکنون میتوانید آدس ورکر خود را در بروزر وارد کرده و پنل کنترل را مشاهده کنید. راهنمای استفاده روی پنل کنترل وجود دارد.

### Credits
Built-in vless config generator is based on [Zizifn Edge Tunnel](https://github.com/zizifn/edgetunnel), re-written using Typescript.
Built-in trojan config generator is based on [ca110us/epeius](https://github.com/ca110us/epeius/tree/main), re-written using Typescript.
Proxy IPs source: https://rentry.co/CF-proxyIP
