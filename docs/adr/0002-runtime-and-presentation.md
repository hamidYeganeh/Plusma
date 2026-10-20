---
status: accepted
date: 2026-10-20
---

# داده، ارائه و چرخه عمر صحنه جدا باشند

دموی قدیمی به DOM سراسری و startup بدون teardown تکیه داشت. انتقال آن به Next با import مستقیم، خروج/ورود صفحه و اجرای توسعه React را آسیب‌پذیر می‌کرد. route فقط مکان را حل می‌کند؛ ارائه کنترل‌ها را می‌سازد؛ runtime مالک دوربین، ورودی و GPU است؛ هندسه و بافت در implementation صحنه می‌مانند.

این تفکیک SRP، ISP و separation of concerns را قابل بررسی می‌کند: تغییر نام/معرفی بدون ویرایش renderer؛ تغییر UI بدون دست‌کاری برخورد؛ unmount بدون باقی‌ماندن loop و listener. هزینه، handle صریح lifecycle است؛ جایگزین آن coupling به global DOM بود.
