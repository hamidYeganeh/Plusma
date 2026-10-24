# Space

برنامه عمومی Plusma. از ریشه مخزن:

```sh
npm run dev --workspace space
```

مسیرهای فعلی: `/`، `/cafe/barg` و `/cafe/comma-beheshti`. alias هر کافه با پسوند `/explore` به مسیر اصلی آن هدایت می‌شود.

catalog محلی: `modules/cafe/catalog.ts`؛ تجربه: `modules/cafe/experience`؛ adapter صحنه: `modules/cafe/scenes`؛ رزرو مشتری متصل به NestJS: `modules/cafe/reservations`؛ نمایشگر مستقل: `@repo/spatial`؛ ترجمه: `messages/fa.json`؛ کیت: `packages/ui`.

[نقشه مستندات](../../docs/README.md) · [بلوپرینت](../../docs/architecture/blueprint.md) · [افزودن کافه](../../docs/guides/adding-a-cafe.md)

## رزرو و پذیرش

برای اجرای کامل NestJS و PostgreSQL از [راهنمای API](../api/README.md) استفاده کن. `space` درخواست‌های `/api/*` را به `API_ORIGIN` (پیش‌فرض `http://127.0.0.1:3001`) forward می‌کند. تغییر متغیر proxy به build مجدد نیاز دارد. آدرس عمومی برنامه را در `TRUSTED_ORIGINS` تنظیم کن.

فرم میز، زمان آزاد واقعی، نگه‌داشت، تأیید، پیگیری و لغو را اجرا می‌کند. `/staff` پس از ورود کارکنان، رزروهای مکان مجاز، منو و سفارش‌ها را مدیریت می‌کند. منوی عمومی از داخل بازدید کافه قابل مشاهده است. داده صحنه منبع موجودی نیست. `modules/cafe/staff` ارائه پنل کافه است؛ فرم مشتری و پنل، callerهای قرارداد HTTP رزرو کافه هستند.
