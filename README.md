# پرسه · Plusma

پلتفرم نمایش تعاملی مکان‌ها. نسخه فعلی، دموی فارسی کافه **برگ** است و اطلاعاتش داخل پروژه نگه‌داری می‌شود.

## شروع

نیازمند Node.js مطابق `engines` ریشه و npm مطابق `devEngines` هستیم.

```sh
npm ci
npm run dev --workspace space
```

- فهرست: `http://localhost:3000/`
- کافه برگ: `http://localhost:3000/cafe/barg`
- مسیر قدیمی `/cafe/barg/explore` به مسیر اصلی هدایت می‌شود.

```sh
npm run build
npm run lint
npm run check-types
npm run test --workspace space
```

## ساختار

- `apps/space`: صفحات عمومی و moduleهای نمایش کافه.
- `packages/ui`: کیت shadcn مشترک؛ primitiveها و سبک‌های قابل استفاده مجدد.
- `packages/eslint-config` و `packages/typescript-config`: تنظیمات workspaceها.
- [مستندات](docs/README.md): نقطه شروع محصول، معماری، طراحی و تصمیم‌ها.
- [واژه‌نامه](GLOSSARY.md): زبان دامنه.

در این فاز backend، دیتابیس، رزرو واقعی، منو، سفارش، پرداخت و صندوق وجود ندارند. پیش‌نمایش رزرو فقط روز، ساعت نمونه و تعداد مهمان را در حافظه رابط مرور می‌کند؛ هیچ اطلاعات هویتی یا تماسی دریافت نمی‌شود.
