---
status: accepted
date: 2026-10-20
---

# مرجع طراحی مشترک و فارسی با مسیر کوتاه

primitiveها در `packages/ui` و توکن‌های مصرف‌شده در stylesheet برنامه قرار دارند. shadcn با preset `b5KcQGby4`، Radix، RTL و pointer راه‌اندازی شد؛ رنگ و فونت مطابق درخواست جدید کاربر به بنفش Startease و Vazirmatn تغییر کردند. ساختار Luma حفظ شده است؛ کد preset دیگر توصیف کامل overrideهای برند نیست.

next-intl با locale ثابت `fa` و پیام‌های جدا استفاده می‌شود تا `/cafe/barg` بدون `/fa` بماند. next-themes مسئول روشن/تیره رابط است؛ نور روز/شب صحنه کنترل جدا دارد. UI مشترک به app وابسته نیست. این تصمیم، DRY و locality را برای طراحی فراهم می‌کند و تغییر ظاهر را از رفتار صحنه جدا نگه می‌دارد.
