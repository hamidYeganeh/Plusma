# Plusma

پلتفرم نمایش تعاملی مکان‌ها. نسخه فعلی، نمایش فارسی کافه **برگ** و بازسازی عکسی **کاما، شعبه بهشتی** به همراه رزرو عملیاتی با NestJS و PostgreSQL است. داده‌های اولیه کافه‌ها برای اجرای محلی‌اند.

## شروع

نیازمند Node.js مطابق `engines` ریشه و npm مطابق `devEngines` هستیم.

```sh
npm ci
npm run setup:local
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

- فهرست: `http://localhost:3000/`
- کافه برگ: `http://localhost:3000/cafe/barg`
- کاما بهشتی: `http://localhost:3000/cafe/comma-beheshti`
- [عکس‌ها، منابع و حدود دقت بازسازی کاما](output/research/comma-beheshti/README.md)
- مسیر قدیمی `/cafe/barg/explore` به مسیر اصلی هدایت می‌شود.

```sh
npm run build
npm run lint
npm run check-types
npm test
```

## ساختار

- `apps/space`: صفحات عمومی، رزرو مشتری و پنل کارکنان `/staff`.
- `apps/api`: NestJS؛ هویت کارکنان، مجوز مکان و رزرو تراکنشی PostgreSQL.
- `packages/contracts`: شکل داده HTTP مشترک، بدون منطق تجاری.
- `packages/spatial`: نمایشگر مستقل، قرارداد صحنه و navigation؛ بدون وابستگی به کافه یا Next.
- `packages/ui`: کیت shadcn مشترک؛ primitiveها و سبک‌های قابل استفاده مجدد.
- `packages/eslint-config` و `packages/typescript-config`: تنظیمات workspaceها.
- [مستندات](docs/README.md): نقطه شروع محصول، معماری، طراحی و تصمیم‌ها.
- [واژه‌نامه](GLOSSARY.md): زبان دامنه.
- [افزودن کسب‌وکار](docs/guides/adding-a-business.md): اتصال تجربهٔ مستقل مثل ملک به نمایشگر.

`npm run lint` جهت وابستگی و interface عمومی moduleها را هم بررسی می‌کند. تست مستقل مرورگر برای قرارداد صحنهٔ مسکونی با `npm run dev:fixture --workspace @repo/spatial` روی پورت 3112 اجرا می‌شود؛ این fixture مسیر عمومی محصول نیست.

رزرو شامل زمان آزاد، نگه‌داشت موقت، تأیید، پیگیری، لغو و ثبت حضور است. برای ساخت حساب کارکنان و اجرای آزمون PostgreSQL، [راهنمای API](apps/api/README.md) را بخوان. Docker باید در حال اجرا باشد. رابط مشتری روی پورت 3000 و Nest روی 3001 اجرا می‌شوند.

منو، سفارش، پرداخت و صندوق هنوز پیاده نشده‌اند. [راهنمای رزرو](docs/guides/running-reservations.md) پیش‌فرض‌ها و محدودیت‌های فعلی را مشخص می‌کند.
