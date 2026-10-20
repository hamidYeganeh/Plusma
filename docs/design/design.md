# Startease — Design Reference

> راهنمای بازآفرینی زبان بصری پروژه: رنگ، فرم، تایپوگرافی، چیدمان، عمق و حرکت.
>
> استخراج‌شده از کد فعلی و تصاویر ثبت‌شدهٔ پروژه در ۲۰ اکتبر ۲۰۲۶.

## ۱. هویت بصری در یک نگاه

این طراحی ترکیبی از **بنفش الکتریکی، تایپوگرافی بسیار درشت، گوشه‌های عمیقاً گرد، سطوح روشن و زغالی، و کنترل‌هایی با حس حجم و لمس‌پذیری** است. تصویر اصلی و نورهای رنگی حس آینده‌نگر می‌سازند؛ فضای خالی، متن‌های کوتاه و نظم محتوا آن را خوانا نگه می‌دارند.

امضای اصلی طراحی:

- **رنگ:** بنفش عمیق برای تأکید و عمل اصلی؛ آبی، یاسی و صورتی روشن در نور و تصویرسازی.
- **فرم:** کارت‌های نرم با ردیوس‌های بزرگ، قاب‌های تودرتو و ورودی‌های منحنی بین سکشن‌ها.
- **تایپ:** تیترهای سنگین و فشرده در کنار متن بدنهٔ ساده و آرام.
- **عمق:** لبهٔ روشن، سایهٔ داخلی، سایهٔ خارجی چندمرحله‌ای و شیشهٔ نیمه‌شفاف.
- **ترکیب‌بندی:** مرکزگرایی در معرفی، شبکه در محتوا، هم‌پوشانی و چرخش در تصویرسازی.
- **حرکت:** آشکارشدن تدریجی، پارالاکس، صحنه‌های وابسته به اسکرول و بازخورد کوتاه دکمه‌ها.

قاعدهٔ محوری: **فرم‌ها نرم و حجیم‌اند؛ سلسله‌مراتب متن قاطع و پرکنتراست است.**

## ۲. محدوده و اعتبار سند

مرجع این سند صفحهٔ فعال `app/[lang]/page.tsx` است که از `components/onefin/` استفاده می‌کند. پوشهٔ `components/agency/` و تصاویر `docs/agency-qa/` مربوط به طراحی قبلی‌اند و مبنای این راهنما نیستند.

سه نوع اطلاعات در سند آمده است:

| نوع | معنی |
| --- | --- |
| مقدار موجود | مستقیماً در CSS، استایل درون کامپوننت یا منطق تعامل دیده شده است. |
| قاعدهٔ استخراج‌شده | تفسیر الگوی تکرارشونده برای استفاده در طراحی‌های بعدی است. |
| نام پیشنهادی | نام خواناتر برای توکن‌ها و کلاس‌ها؛ لزوماً در پروژه تعریف نشده است. |

ترتیب بارگذاری استایل‌ها `reference.css → globals.css → agency-content.css` است. استایل‌های درون کامپوننت‌ها و overrideهای `!important` هم در نتیجهٔ نهایی اثر دارند؛ خصوصاً برای نسخهٔ فارسی.

تصاویر زیر شواهد بصری ذخیره‌شده‌اند. برای تهیهٔ این سند مرورگر زنده اجرا نشده است.

| مرجع | تصویر |
| --- | --- |
| هیروی فعلی فارسی، دسکتاپ | [fa-desktop.png](docs/content-qa/fa-desktop.png) |
| هیروی فعلی فارسی، موبایل | [fa-mobile.png](docs/content-qa/fa-mobile.png) |
| نمونه‌کارهای فعلی | [fa-projects.png](docs/content-qa/fa-projects.png) |
| تایپوگرافی لاتین در قالب اصلی | [local-desktop.png](docs/visual-qa/local-desktop.png) |

## ۳. پالت رنگ

### رنگ‌های اصلی برند

مقادیر این جدول در توکن‌های `body` در `app/reference.css` موجودند. نام‌های ستون اول برای استفادهٔ مجدد پیشنهاد شده‌اند.

| نام پیشنهادی | مقدار | نقش بصری |
| --- | --- | --- |
| `brand-primary` | `#381AC9` | بنفش عمیق؛ تأکید تیتر، حالت فعال، انتهای گرادیان دکمه |
| `brand-bright` | `#6262FE` | بنفش روشن متمایل به آبی؛ ابتدای گرادیان دکمه |
| `brand-soft` | `#9696FF` | یاسی میانی؛ لایهٔ رنگی پشت سکشن روشن |
| `brand-pale` | `#BEBEFF` | یاسی روشن؛ لایهٔ دوم و عمق پس‌زمینه |
| `brand-deep` | `#28119C` | بنفش تیره؛ قاب بیرونی دکمه و عمق رنگ |

### رنگ‌های خنثی

| نام پیشنهادی | مقدار | نقش |
| --- | --- | --- |
| `ink` | `#121214` | پس‌زمینهٔ اصلی تیره و متن اصلی روی سطح روشن |
| `surface-dark` | `#1B1B1F` | پنل تیرهٔ مستقل و بدنهٔ برخی قاب‌ها |
| `surface-dark-raised` | `#212124` | سطح داخلی FAQ و متن بدنه روی روشن |
| `neutral-800` | `#292929` | خاکستری تیرهٔ مکمل |
| `neutral-600` | `#525252` | برچسب تیره و متن فرعی |
| `neutral-500` | `#8F8F8F` | اطلاعات کم‌اهمیت و حالت غیرفعال |
| `neutral-300` | `#D9D9D9` | خاکستری روشن میانی |
| `neutral-100` | `#EFEFEF` | تگ کوچک و کنترل روشن |
| `surface-muted` | `#F5F5F5` | کارت روشن روی سکشن سفید |
| `surface-light` | `#FFFFFF` | سکشن روشن، متن روی تیره، دکمهٔ سفید |

دکمهٔ مشکی هیرو در سطح داخلی از `#282828` استفاده می‌کند؛ این مقدار با توکن `#292929` نزدیک است، اما دقیقاً یکسان نیست.

### شفافیت و لایه‌های شیشه‌ای

توکن‌های سفید شفاف موجود در قالب عبارت‌اند از `#FFFC`، `#FFF9`، `#FFFFFF0D`، `#FFF3` و `#FFF6`؛ معادل حدوداً ۸۰، ۶۰، ۵، ۲۰ و ۴۰ درصد opacity.

| کاربرد | مقدار موجود |
| --- | --- |
| پس‌زمینهٔ منوی شناور | `rgba(0, 0, 0, 0.15)` با `backdrop-filter: blur(24px)` |
| آیتم فعال منو | `rgba(255, 255, 255, 0.2)` |
| ناحیهٔ فعال برخی ردیف‌های سرویس | `rgba(170, 157, 236, 0.1)` |
| آیکن غیرفعال در بعضی پنل‌ها | `rgba(255, 255, 255, 0.04)` |
| پنل‌های رنگی فوتر | `rgba(56, 26, 201, 0.3)` |
| کنترل تغییر زبان | `#17151EE6`، حاشیهٔ `#FFFFFF30` و blur برابر `15px` |

**قاعدهٔ استفاده:** فضای عمدهٔ محتوا را خنثی نگه دار. بنفش برای مسیر توجه و وضعیت فعال است؛ رنگ‌های آبی و صورتی بیشتر به نور و تصویر تعلق دارند. نسبت عددی ثابتی مثل ۶۰/۳۰/۱۰ در کد تعریف نشده است.

### گرادیان‌ها

```css
/* لایهٔ پایهٔ هیرو؛ تمام ظاهر هیرو فقط با این گرادیان ساخته نشده است. */
background: linear-gradient(#666FEB 0%, #F5F5FA 100%);

/* سطح داخلی دکمهٔ اصلی */
background: linear-gradient(180deg, #6262FE 0%, #381AC9 100%);

/* قاب بیرونی دکمهٔ اصلی */
background: linear-gradient(180deg, #6D55E2 0%, #28119C 100%);

/* قاب بیرونی دکمهٔ تیره */
background: linear-gradient(180deg, #282828 0%, #060606 100%);

/* سطح شیشه‌ای داخل هیرو */
background: linear-gradient(#FFFFFF00 0%, #FFFFFF 100%);
```

هالهٔ آبی/صورتی/بنفش، بافت و تصویر گوشی با assetهای جدا تکمیل می‌شوند. جایگزین‌کردن همهٔ این لایه‌ها با یک گرادیان خطی، نتیجهٔ مشابهی نمی‌دهد.

## ۴. ردیوس و هندسه

بزرگ‌بودن ردیوس‌ها یکی از مهم‌ترین عوامل شخصیت این طراحی است. ردیوس با مقیاس عنصر تغییر می‌کند؛ همهٔ عناصر یک شعاع مشترک ندارند.

| عنصر | مقدار موجود | نکته |
| --- | --- | --- |
| برچسب کوچک | `8px` | تگ‌های شماره/عنوان سکشن |
| فیلد فرم | `8px` | هندسهٔ فشرده برای ورود اطلاعات |
| کنترل‌های کوچک | `12px`، `14px`، `16px` | منوی موبایل، آیکن و دکمهٔ بستن |
| لینک داخل منو | `16px` | داخل قاب بزرگ‌تر منو |
| قاب منوی شیشه‌ای | `20px` | خود گروه لینک‌ها |
| دکمهٔ اصلی، قاب / سطح | `22px / 20px` | قاب دارای `2px` padding است |
| دکمهٔ فروشگاه، قاب / سطح | `24px / 20px` | قاب دارای `4px` padding است |
| کارت‌های معرفی تیم | `40px` | نام قدیمی کامپوننت: Testimonial Card |
| کارت مزایا و تصویر نمونه‌کار | `48px` | از فرم‌های پرتکرار طراحی |
| کارت همکاری / Pricing | عمدتاً `56px` | کارت سوم در نسخه‌های تبلت/موبایل `48px / 32px` دارد |
| قاب بزرگ FAQ، بیرون / داخل | `80px / 72px` | در دسکتاپ، با فاصلهٔ داخلی `8px` |
| پنل معرفی تیم | `80px → 64px → 48px` | دسکتاپ → تبلت → موبایل |
| ورودی سکشن سفید | `120px → 80px → 48px` | فقط گوشه‌های بالایی |
| شیشهٔ هیرو | `100px → 80px → 24px` | نسخهٔ موبایل هندسهٔ متفاوت دارد |
| دیالوگ تماس | `80px → 40px` | از استایل پایهٔ `.download-dialog` به ارث می‌رسد |
| نقطه، آواتار و خط همبرگر | `999px` یا `50%` | فرم دایره‌ای یا کاملاً کپسولی |

**قاعدهٔ استخراج‌شده:** در قاب‌های تودرتو، شعاع داخلی را متناسب با inset کم کن؛ مثال تمیز پروژه `22/20` برای دکمه و `80/72` برای FAQ است. این رابطه را به‌عنوان اصل هندسی حفظ کن، اما آن را جایگزین مقادیر اختصاصی همهٔ کامپوننت‌ها نکن.

کارت `48px` با padding حدود `32px` باید فضای کافی برای متن و تصویر داشته باشد. اگر در یک پروژهٔ جدید کارت را بسیار کوچک کردی، ردیوس و padding را با هم تنظیم کن.

## ۵. تایپوگرافی

### خانواده‌های فونت

| زبان / نقش | خانواده | ویژگی |
| --- | --- | --- |
| انگلیسی، تیترهای اصلی | `Roboto Condensed` | وزن `900`، فشرده، اغلب uppercase |
| انگلیسی، بدنه و رابط | `Geist` | وزن‌های `400`، `500` و `600` در presetهای اصلی |
| فارسی، متن‌های `.framer-text` | `Vazirmatn` | فونت محلی با محدودهٔ وزن `100–900` |
| fallback فارسی | `Arial, sans-serif` | بعد از Vazirmatn |

`Inter` در resetها و fallbackهای قالب وجود دارد؛ خانوادهٔ اصلی این طراحی برای تیتر و بدنه نیست.

### مقیاس تیترها در نسخهٔ انگلیسی

این مقادیر از presetهای نهایی CSS استخراج شده‌اند. نام H3 در جدول به preset اشاره دارد؛ بعضی کامپوننت‌ها override اختصاصی دارند.

| نقش | دسکتاپ ≥1200 | تبلت 810–1199 | موبایل <810 | وزن | line-height | letter-spacing |
| --- | --- | --- | --- | --- | --- | --- |
| Hero / H1 | `128px` | `96px` | `48px` | `900` | `90%` | `-0.05em` |
| تیتر سکشن / H2 | `72px` | `64px` | `40px` | `900` | `72 / 68 / 36px` | `-0.05em` |
| تیتر نمایشی / H3 | `48px` | `40px` | `36px` | `900` | `1em` | `-0.05em` |
| تیتر نمایشی کوچک‌تر | `36px` | `36px` | `24px` | `900` | `100%` | `0` |

### بدنه و رابط انگلیسی

| نقش | اندازه / وزن | line-height | letter-spacing |
| --- | --- | --- | --- |
| متن معرفی بزرگ | `24px / 500` | `1.5` | `-0.01em` |
| متن هیرو | `20px / 500` | `1.5` | `-0.02em` |
| بدنهٔ بزرگ | `20px / 400` | `1.5` | `-0.02em` |
| بدنهٔ معمولی | `18px / 400` | `1.5` | `-0.01em` |
| متن تأکیدی | `18px / 600` | `1.5` | `-0.02em` |
| منو | `16px / 400` | `1.5` | `-0.02em` |
| متن دکمه | `16px / 600` | `1.5` | `-0.02em` |
| توضیح کوچک | `14px / 400` | `1.5` | `-0.01em` |
| لیبل کوچک تأکیدی | `14px / 600` | `1.3` | `0` |
| کپشن | `12px / 400` | `1.5` | `-0.05em` |

presetهای متنی بزرگ `36px`، `48px` و `56px` با Geist و وزن `400` هم وجود دارند؛ همهٔ متن‌های بزرگ با فونت Condensed ساخته نشده‌اند.

### قواعد دقیق فارسی

در `agency-content.css` تمام `.framer-text`های داخل `[data-agency-locale="fa"]` این overrideها را می‌گیرند:

```css
font-family: Vazirmatn, Arial, sans-serif !important;
letter-spacing: 0 !important;
line-height: 1.6 !important;
```

برای `h1` و `h2` فارسی:

```css
font-weight: 900 !important;
line-height: 1.1 !important;
```

اندازهٔ فونت از preset اصلی باقی می‌ماند، مگر جایی که استایل اختصاصی وجود داشته باشد. بنابراین اندازه‌های H1/H2 جدول بالا در فارسی نیز مبنا هستند، اما line-height و letter-spacing نسخهٔ لاتین را ندارند. H3 فارسی زیر قاعدهٔ عمومی `1.6` قرار می‌گیرد، مگر override دیگری داشته باشد.

**قاعدهٔ انتقال:** حس قدرت تیتر لاتین را با وزن و اندازه حفظ کن. فشردگی حروف لاتین را با letter-spacing منفی به فارسی منتقل نکن.

### جهت و تراز

ریشهٔ HTML در فارسی `dir="rtl"` دارد، ولی wrapper اصلی `[data-agency-locale]` عمداً `direction: ltr` می‌گیرد. جهت متن‌های ترجمه‌شده با `dir` روی عناصر متن و جهت بخش About با override جدا تنظیم می‌شود. صفحهٔ فعلی یک آینهٔ کامل از نسخهٔ انگلیسی نیست.

برای توسعهٔ همین پروژه، نظم ترکیب‌بندی فعلی را حفظ کن. برای انتقال به پروژه‌ای تازه، جهت متن و ترتیب چیدمان را جداگانه تصمیم بگیر؛ تغییر زبان نباید ناخواسته همهٔ لایه‌های تصویرسازی را جابه‌جا کند.

## ۶. چیدمان و فاصله‌گذاری

### عرض‌ها و breakpointها

| نقش | مقدار موجود |
| --- | --- |
| محدودهٔ دسکتاپ | `min-width: 1200px` |
| محدودهٔ تبلت | `810px` تا کمتر از `1200px` |
| محدودهٔ موبایل | کمتر از `810px` |
| بیشینهٔ بسیاری از containerها | `1344px` |
| عرض بلوک تیتر در بسیاری از سکشن‌ها | حداکثر `720px` |
| عرض توضیح زیر تیتر در چند سکشن | حداکثر `580px` |
| قاب FAQ | حداکثر `1120px` |
| تغییر چیدمان فرم تماس | `max-width: 600px` |

عرض‌های `1200/810/400px` در پوستهٔ واردشدهٔ قالب هم دیده می‌شوند، اما صفحهٔ فعلی روی wrapper و main از `width: auto` و روی main از `display: contents` استفاده می‌کند. آن اعداد را عرض ثابت نهایی صفحه فرض نکن.

### ریتم فاصله‌ها

پروژه عمدتاً از این مجموعه استفاده می‌کند:

```text
4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 80
```

این مجموعه یک سیستم کاملاً سخت‌گیرانهٔ مضرب ۸ نیست؛ فاصله‌های `10px` و مقادیر اختصاصی هم در قالب وجود دارند.

| رابطه | الگوی موجود |
| --- | --- |
| padding معمول سکشن دسکتاپ | `80px 48px` |
| padding معمول سکشن تبلت | `60px 24px` |
| padding معمول سکشن موبایل | `48px 16px` |
| فاصلهٔ بزرگ بین بلوک‌های سکشن | اغلب `64px` |
| فاصلهٔ تیتر و توضیح در بعضی headerها | `24px` |
| padding کارت روشن مزایا | `32px` |
| فاصلهٔ محتوای همان کارت | `28px` |
| فاصلهٔ ریز داخل کنترل | `8px` |
| متن و CTA در هیرو | `56px` دسکتاپ؛ `40px` موبایل |

این اعداد الگوی غالب‌اند؛ هیرو، صحنه‌های sticky و CTA انتهایی فاصله‌های اختصاصی دارند.

### ساختار یک سکشن

الگوی پرتکرار: **برچسب کوچک → تیتر بزرگ → توضیح کوتاه → فاصلهٔ باز → کارت یا تصویر → اقدام مرتبط**.

تفاوت مقیاس بین لیبل، تیتر و بدنه باید محسوس باشد. در نمونه‌کارها شبکه نامتقارن است: یک کارت تصویری شاخص در کنار کارت‌های کوچک‌تر قرار می‌گیرد. یکسان‌کردن اندازه و وزن همهٔ کارت‌ها، بخشی از جذابیت ترکیب‌بندی را حذف می‌کند.

## ۷. سطوح، عمق و نور

### منطق سطوح

| لایه | اجرا |
| --- | --- |
| زمینهٔ عمومی تیره | `#121214` |
| سکشن روشن | سفید با ورودی‌های منحنی بزرگ |
| کارت روی روشن | `#F5F5F5` با ردیوس `48px` |
| پنل روی تیره | `#1B1B1F` یا `#212124` |
| لایهٔ شیشه‌ای | شفافیت، blur و گاهی خط روشن |
| کنترل قابل کلیک | قاب، سطح داخلی، highlight و سایه |

چرخش بین سطوح روشن و تیره بخش مهمی از ریتم صفحه است. رنگ تیره صرفاً برای فوتر استفاده نشده است.

### سه نوع عمق

1. **عمق کنترل:** دکمه‌ها با لبهٔ روشن در بالا و سایهٔ تیره در پایین برجسته می‌شوند.
2. **عمق صحنه:** گوشی، کارت‌های معلق و لایه‌های شیشه با هم‌پوشانی، blur، scale و چرخش فاصله می‌گیرند.
3. **عمق سکشن:** صفحات یاسی پشت سکشن سفید، یا قاب تیرهٔ بیرونی و سطح داخلی روشن‌تر، مرز بلوک‌ها را می‌سازند.

جهت نور دکمه‌ها از بالاست. برای حفظ کیفیت، سایهٔ داخلی و بیرونی را با هم ببین؛ یک سایهٔ محو و بزرگ به‌تنهایی جایگزین ساختار فعلی نمی‌شود.

شیشهٔ هیرو به‌طور مشخص `blur(2px)`، خط سفید `1px` و `inset 0 4px 50px #FFFFFF40` دارد. این شیشه با منوی `blur(24px)` یک تنظیم مشترک ندارد.

## ۸. دستور ساخت کامپوننت‌ها

### دکمهٔ اصلی

دکمه دو سطح دارد: قاب `22px` با padding برابر `2px` و سطح داخلی `20px`. ارتفاع سطح داخلی `56px` و padding آن `12px 24px` است؛ در حالت معمول ارتفاع بیرونی حدود `60px` می‌شود.

کد زیر **بازنویسی قابل‌استفاده با نام‌های جدید** از استایل هیرو است؛ کلاس‌های آن در پروژهٔ فعلی وجود ندارند.

```css
.button-primary {
  display: inline-flex;
  padding: 2px;
  border: 0;
  border-radius: 22px;
  color: #FFF;
  text-decoration: none;
  cursor: pointer;
  background: linear-gradient(180deg, #6D55E2, #28119C);
  box-shadow:
    0 1px 2px rgb(40 16 162 / 37%),
    0 3px 3px rgb(40 16 162 / 32%),
    0 8px 5px rgb(40 16 162 / 19%),
    0 13px 5px rgb(40 16 162 / 6%);
  transition: transform .2s, filter .2s;
}

.button-primary > span {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 56px;
  padding: 12px 24px;
  border-radius: 20px;
  font: 600 16px/1.5 Geist, sans-serif;
  letter-spacing: -.02em;
  background: linear-gradient(180deg, #6262FE, #381AC9);
  box-shadow:
    inset 0 1px 1px #FFF,
    inset 0 -2px 2px #28109B,
    inset 0 0 8px rgb(203 196 234 / 50%);
}

.button-primary:hover {
  filter: brightness(1.1);
  transform: translateY(-2px);
}

.button-primary:focus-visible {
  outline: 3px solid #8A79FF;
  outline-offset: 5px;
}

[lang="fa"] .button-primary > span {
  font-family: Vazirmatn, Arial, sans-serif;
  letter-spacing: 0;
  line-height: 1.6;
}

@media (prefers-reduced-motion: reduce) {
  .button-primary { transition-duration: .01ms; }
}
```

ساختار نمونه: `<a class="button-primary" href="#contact"><span>شروع همکاری</span></a>`.

### دکمهٔ تیره و سفید

- **تیره:** قاب از `#282828` به `#060606`، سطح داخلی `#282828`، خط نور بالایی سفید با opacity حدود ۸۰٪ و سایهٔ داخلی مشکی در پایین.
- **سفید:** سطح داخلی سفید، قاب خاکستری شفاف و سایهٔ داخلی پایین با `rgba(26, 20, 51, 0.25)`؛ مناسب اکشن روی تصویر یا پس‌زمینهٔ رنگی.
- **رفتار مشترک موجود:** جابه‌جایی `-2px` و brightness برابر `1.1` در hover با زمان `200ms`.

در هیروی فعلی، دکمهٔ بنفش به نمونه‌کارها و دکمهٔ تیره به شروع همکاری مربوط است؛ رنگ به‌تنهایی نشان‌دهندهٔ نوع مقصد نیست.

### کارت محتوا

برای کارت روشن، نقطهٔ شروع مناسب همان ترکیب موجود است: سطح `#F5F5F5`، ردیوس `48px`، padding برابر `32px` و gap برابر `28px`. تصویر در فضای خودش نفس می‌کشد و توضیح کوتاه می‌ماند.

در کارت نمونه‌کار، تصویر با `48px` برش می‌خورد. متن و تگ‌ها برای کارت‌های معمول زیر تصویرند؛ کارت شاخص می‌تواند متن و CTA را روی تصویر قرار دهد. روی تصویر شلوغ، کنترل تیرگی و کنتراست بخشی از طراحی است؛ تصویر TMTI در نسخهٔ فعلی با `brightness(.3)` تیره می‌شود.

### منوی شناور

منو ثابت، شیشه‌ای و جمع‌وجور است. گروه لینک‌ها padding برابر `4px` دارد؛ ردیوس گروه `20px` و لینک‌ها `16px` است. آیتم فعال با سفید شفاف و نقطهٔ روشن مشخص می‌شود.

بعد از `scrollY > 220` نسخهٔ دسکتاپ جمع می‌شود. لوگو داخل دایرهٔ `48×48px` قرار می‌گیرد. موبایل نسخهٔ جداگانه با دکمهٔ همبرگر دارد؛ بازشدن منو، چیدمان را عمودی می‌کند.

### FAQ

قاب اصلی دسکتاپ از `80px` بیرونی و `72px` داخلی تشکیل شده است. در تبلت `64/56px` و در موبایل `48/32px` می‌شود؛ قاب بیرونی موبایل padding برابر `2px` دارد. این جفت موبایل را با فرمول دسکتاپ جایگزین نکن.

بازشدن ردیف، پاسخ را نمایان می‌کند، آیکن را بنفش می‌کند و جهت آن را تغییر می‌دهد. حالت بسته باید از طریق فرم آیکن و وضعیت `aria-expanded` هم مشخص باشد.

### فرم و دیالوگ تماس

دیالوگ تماس از پوستهٔ سفید و بسیار گرد استفاده می‌کند، ولی داخل آن فیلدها فشرده‌ترند:

| جزء | مقدار |
| --- | --- |
| عرض | `min(560px, calc(100vw - 32px))` |
| حداکثر ارتفاع | `90dvh` با اسکرول داخلی |
| padding | `32px`؛ تا عرض `600px` برابر `24px` |
| ردیوس فیلد | `8px` |
| حاشیهٔ فیلد | `1px solid #DED8E9` |
| padding فیلد | `10px` |
| فاصلهٔ ستون‌های فرم | `16px` |
| انتخاب سرویس | چیپ با ردیوس `20px` |
| سرویس انتخاب‌شده | زمینهٔ `#E9E0FF` و حاشیهٔ `#A58BD9` |
| دکمهٔ ارسال فرم | ردیوس `15px` و گرادیان `#6D55E2 → #28119C` |

فرم زیر `600px` یک‌ستونه می‌شود و فونت input، textarea و select به `16px` می‌رسد. دکمهٔ ارسال فرم از recipe دوپوستهٔ هیرو استفاده نمی‌کند؛ این تفاوت بخشی از اجرای فعلی است.

## ۹. تصویرسازی و عناصر تزئینی

هیرو یک ترکیب لایه‌ای است: گوشی مرکزی، شیء ستاره‌ای درخشان، کارت‌های سفید معلق، قاب شیشه‌ای و نورهای پخش‌شده. چرخش ملایم کارت‌ها و هم‌پوشانی آن‌ها با گوشی، حس صحنه می‌سازد.

برای انتقال این زبان به موضوعی دیگر:

- یک شیء یا محصول اصلی را کانون قرار بده؛ متن همچنان باید نقطهٔ ورود روشن داشته باشد.
- کارت‌های معلق را به محتوای واقعی محصول ربط بده.
- اشباع و درخشش را در نواحی کانونی نگه دار؛ سطح مطالعهٔ متن آرام بماند.
- موتیف ستارهٔ چهارپر را برای نشانه و تأکید به کار ببر، نه در همهٔ کارت‌ها.
- تصویرهای نمونه‌کار می‌توانند رنگ خودشان را داشته باشند؛ قاب، فاصله‌ها و تایپوگرافی انسجام را حفظ می‌کنند.

در assetهای جدیدِ محتوایی نیز گرادیان‌های `#B7A5FF → #4823D4` و `#EEE9FF → #CEC0FF` دیده می‌شود. این‌ها رنگ‌های تصویرسازی‌اند و جایگزین توکن اصلی `#381AC9` نیستند. نوشته‌های داخل برخی SVGها با Arial ساخته شده‌اند؛ تغییر فونت صفحه آن نوشته‌ها را تغییر نمی‌دهد.

## ۱۰. حرکت و وضعیت‌های تعاملی

| حرکت | اجرای موجود |
| --- | --- |
| آشکارشدن تیتر | opacity از صفر، blur از `10px` و جابه‌جایی عمودی از `15px` |
| زمان reveal تیتر | `550ms` |
| فاصلهٔ شروع بخش‌های تیتر | `17ms` برای هر بخش `data-letter` |
| آستانهٔ observer | `0.15` |
| آشکارشدن کارت محتوا | opacity/transform طی `700ms` با easing مربوط به transform برابر `cubic-bezier(.2,.8,.2,1)` |
| بازخورد دکمه | `200ms` |
| رنگ ردیف FAQ و بعضی کنترل‌ها | `250ms` |
| تغییر چیدمان nav | `400ms` برای padding/gap |
| بازشدن بادبزنی آیکن‌های اتصال | `1.1s` با `cubic-bezier(.2,.8,.2,1)` |
| ورود عناصر CTA انتهایی | `1.25s` با `cubic-bezier(.16,1,.3,1)` |
| نوار متحرک | `34s linear infinite`؛ یک گونه `65s` |

با وجود نام `data-letter`، برای تیترهای ترجمه‌شده spanها به‌ازای کلمه ساخته می‌شوند؛ reveal الزاماً حرف‌به‌حرف نیست.

پارالاکس هیرو و صحنه‌های معرفی/تیم به اسکرول وابسته‌اند. در مقابل، hover دکمه بازخورد کوتاه دارد. این تفاوت ریتم را حفظ کن؛ حرکت بلند نمایشی را به کنترل‌های روزمره منتقل نکن.

پروژه برای `prefers-reduced-motion` زمان animation/transition را بسیار کم می‌کند، smooth scroll را حذف می‌کند و revealها را قابل‌مشاهده نگه می‌دارد. منطق جاوااسکریپت نیز این ترجیح را برای بخشی از صحنه‌های اسکرول بررسی می‌کند. هنگام انتقال هر recipe، محتوای اصلی نباید به اجرای انیمیشن وابسته بماند.

## ۱۱. توکن‌های آماده برای استفادهٔ مجدد

این مجموعه **پیشنهاد نام‌گذاری معنایی** برای مقادیر موجود است. پروژهٔ فعلی بیشتر توکن‌های شناسه‌دار Framer دارد. این بلوک را به‌عنوان مرجع در پروژهٔ جدید استفاده کن؛ صرفاً افزودن آن به پروژهٔ فعلی، کلاس‌های موجود را تغییر نمی‌دهد.

```css
:root {
  --color-brand: #381AC9;
  --color-brand-bright: #6262FE;
  --color-brand-soft: #9696FF;
  --color-brand-pale: #BEBEFF;
  --color-brand-deep: #28119C;

  --color-ink: #121214;
  --color-surface-dark: #1B1B1F;
  --color-surface-dark-raised: #212124;
  --color-surface-light: #FFFFFF;
  --color-surface-muted: #F5F5F5;
  --color-label-light: #EFEFEF;
  --color-text-muted: #8F8F8F;
  --color-focus: #8A79FF;

  --font-display-en: "Roboto Condensed", sans-serif;
  --font-body-en: "Geist", sans-serif;
  --font-fa: "Vazirmatn", Arial, sans-serif;

  --radius-field: 8px;
  --radius-control: 16px;
  --radius-button-inner: 20px;
  --radius-button-outer: 22px;
  --radius-team-card: 40px;
  --radius-card: 48px;
  --radius-pricing-card: 56px;
  --radius-panel: 80px;
  --radius-section-top: 120px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;

  --content-max: 1344px;
  --heading-max: 720px;
  --description-max: 580px;
  --section-padding: 80px 48px;
  --hero-size: 128px;
  --section-title-size: 72px;

  --motion-fast: 200ms;
  --motion-reveal: 700ms;
  --ease-scene: cubic-bezier(.2, .8, .2, 1);
}

@media (min-width: 810px) and (max-width: 1199.98px) {
  :root {
    --section-padding: 60px 24px;
    --radius-section-top: 80px;
    --hero-size: 96px;
    --section-title-size: 64px;
  }
}

@media (max-width: 809.98px) {
  :root {
    --section-padding: 48px 16px;
    --radius-section-top: 48px;
    --hero-size: 48px;
    --section-title-size: 40px;
  }
}
```

بارگذاری فایل فونت و assetها باید جدا انجام شود. توکن `--radius-card` قرار نیست ردیوس اختصاصی همهٔ کارت‌ها را یکسان کند.

## ۱۲. قواعد حفظ شخصیت طراحی

| حفظ کن | پرهیز کن |
| --- | --- |
| تیترهای بزرگ با توضیح کوتاه | هم‌اندازه‌شدن تیتر، متن و کنترل‌ها |
| بنفش دقیق برند و خاکستری‌های خنثی | جایگزینی بنفش با هر طیف مشابه بدون بررسی |
| ردیوس متناسب با مقیاس عنصر | استفادهٔ عمومی از `8px` یا `12px` برای همهٔ کارت‌ها |
| نور بالا و سایهٔ داخلی دکمه | تخت‌کردن CTA یا حذف قاب باریک آن |
| سکشن‌های روشن و تیره با مرز نرم | یک سطح یکنواخت برای تمام صفحه |
| نقش مشخص برای شیشه و glow | blur و glow روی تمام عناصر |
| وزن `900` و فاصلهٔ حروف صفر در فارسی | اعمال tracking منفی لاتین روی فارسی |
| ترکیب کارت شاخص و کارت‌های فرعی | تکرار شبکه‌ای کاملاً یکنواخت در همهٔ سکشن‌ها |
| محتوای قابل‌مشاهده در حالت کاهش حرکت | وابسته‌کردن خواندن صفحه به انیمیشن |

## ۱۳. بریف قابل‌استفاده برای طراحی بعدی

> رابطی با زبان بصری Startease بساز: بنفش اصلی `#381AC9`، بنفش روشن `#6262FE`، پس‌زمینهٔ تیرهٔ `#121214`، سطوح سفید و کارت‌های `#F5F5F5`. تیتر انگلیسی Roboto Condensed با وزن 900 و بدنه Geist باشد؛ در فارسی Vazirmatn با tracking صفر و line-height مناسب فارسی استفاده شود. کارت‌ها عمدتاً ردیوس 40 تا 56 پیکسل داشته باشند و پنل‌ها و ورودی سکشن‌ها گردتر باشند. دکمهٔ اصلی دوپوسته، با ردیوس بیرونی 22 و داخلی 20، گرادیان بنفش، نور لبه و سایهٔ داخلی/خارجی ساخته شود. محتوا فضای خالی سخاوتمندانه، تیترهای مرکزچین و شبکهٔ دارای کارت شاخص داشته باشد. شیشه و نور رنگی را در صحنه‌های کانونی متمرکز کن. حرکت نرم باشد و حالت کاهش حرکت، خوانایی کامل را حفظ کند. برای مقادیر و استثناهای هر کامپوننت به این سند رجوع کن.

## ۱۴. پروفایل ساختاریافتهٔ Designly

این بخش قواعد قابل‌انتقال را ثبت می‌کند. سطح اطمینان، ارزیابی کیفی استخراج از کد و تصاویر است؛ نتیجهٔ اندازه‌گیری آماری نیست.

### TasteProfile

```json
{
  "profile_version": "1.0",
  "source": {
    "label": "Startease current OneFin-based presentation",
    "kind": "design",
    "ownership": "unknown",
    "uri": "app/[lang]/page.tsx"
  },
  "jobs": ["color", "typography", "spacing", "composition", "material", "grid"],
  "observations": [
    {
      "dimension": "palette",
      "evidence": "reference.css defines #381AC9, #6262FE, #121214 and white surfaces.",
      "interpretation": "A purple accent system connects alternating neutral surfaces.",
      "confidence": 0.99
    },
    {
      "dimension": "geometry",
      "evidence": "Buttons use 22/20px radii; major cards use 40–56px; section tops reach 120px.",
      "interpretation": "Soft geometry scales with component size and nesting.",
      "confidence": 0.99
    },
    {
      "dimension": "typography",
      "evidence": "Roboto Condensed 900 display, Geist body and Vazirmatn Persian overrides.",
      "interpretation": "Heavy display typography contrasts with calm body text.",
      "confidence": 0.99
    },
    {
      "dimension": "lighting-material",
      "evidence": "Hero screenshots, layered CTA shadows and separate 2px/24px glass blur settings.",
      "interpretation": "Tactile controls and luminous focal scenes sit within quiet content areas.",
      "confidence": 0.95
    }
  ],
  "signature": {},
  "rules": [
    {
      "job": "color",
      "rule": "Use deep purple for emphasis within light and charcoal content surfaces.",
      "evidence": "Body tokens and active interaction styles.",
      "strength": "high",
      "transferable": true
    },
    {
      "job": "material",
      "rule": "Build important buttons from nested surfaces with top highlights and lower inset shadows.",
      "evidence": "Hero.tsx primary and secondary buttons.",
      "strength": "high",
      "transferable": true
    },
    {
      "job": "typography",
      "rule": "Preserve display weight while adapting tracking and line height to Persian.",
      "evidence": "agency-content.css sets Persian tracking to zero and h1/h2 line-height to 1.1.",
      "strength": "high",
      "transferable": true
    }
  ],
  "anti_rules": [
    "Do not flatten every CTA into a single solid rectangle.",
    "Do not apply one corner radius to every component.",
    "Do not apply Latin negative tracking to Persian text."
  ],
  "similarity_guard": {
    "copy_risk": "low",
    "protected_elements": ["Exact reference artwork and third-party project imagery"],
    "must_transform": ["Subject matter and project-specific content when transferring to another brand"]
  },
  "confidence": 0.97
}
```

### DesignSignalPacket

```json
{
  "taste_state": "extracted_from_local_source_and_saved_screenshots",
  "design_source": "current_startease_onefin_presentation",
  "primary_color": "#381AC9",
  "display_fonts": {"en": "Roboto Condensed", "fa": "Vazirmatn"},
  "body_fonts": {"en": "Geist", "fa": "Vazirmatn"},
  "geometry": "large rounded cards, nested CTA shells, curved section entries",
  "surface_behavior": "alternating light and charcoal, selective glass and glow",
  "motion_behavior": "short control feedback, longer focal scene reveals, reduced-motion support",
  "live_browser_verified_for_this_document": false
}
```

## ۱۵. نقشهٔ منابع

| موضوع | منبع اصلی |
| --- | --- |
| صفحهٔ فعال و ترتیب سکشن‌ها | [app/[lang]/page.tsx](app/%5Blang%5D/page.tsx) |
| ترتیب import استایل‌ها و جهت سند | [app/[lang]/layout.tsx](app/%5Blang%5D/layout.tsx) |
| توکن‌ها، presetهای فونت، هندسه و breakpointها | [app/reference.css](app/reference.css) |
| focus، hover، reveal، FAQ و کاهش حرکت | [app/globals.css](app/globals.css) |
| تایپ فارسی، فرم، زبان و reveal کارت‌ها | [app/agency-content.css](app/agency-content.css) |
| گرادیان و سایهٔ دقیق CTA | [Hero.tsx](components/onefin/Hero.tsx) |
| پوسته و حالت‌های منو | [Navigation.tsx](components/onefin/Navigation.tsx) |
| کارت‌های مزایا | [Benefits.tsx](components/onefin/Benefits.tsx) |
| پنل‌های سرویس | [Features.tsx](components/onefin/Features.tsx) |
| کارت‌های معرفی تیم | [Testimonials.tsx](components/onefin/Testimonials.tsx) |
| کارت‌های همکاری | [Pricing.tsx](components/onefin/Pricing.tsx) |
| قاب‌های نمونه‌کار | [Blog.tsx](components/onefin/Blog.tsx) |
| قاب و ردیف‌های FAQ | [Faqs.tsx](components/onefin/Faqs.tsx) |
| لایه‌های رنگی فوتر | [Footer.tsx](components/onefin/Footer.tsx) |
| observer، فاصلهٔ reveal و تغییر حالت‌ها | [PageInteractions.tsx](components/onefin/PageInteractions.tsx) |
| صحنه‌های اسکرول | [scroll-scenes.ts](components/onefin/scroll-scenes.ts) |
| تبدیل محتوای قالب به نسخهٔ فعلی | [lib/adapt-onefin.tsx](lib/adapt-onefin.tsx) |
| تصویرهای محتوایی فعلی | `public/agency-content/` |
| فونت فارسی | `public/fonts/vazirmatn.woff2` |

برای پیدا کردن مقادیر در CSS فشرده، selectorهایی مثل `styles-preset-16hkaiw` برای H1، `styles-preset-1c9qbxs` برای H2، `framer-l13tx6` برای سطح دکمه، `framer-k6rhkw` برای قاب FAQ و `framer-1mv5rbj` برای کارت مزایا را جست‌وجو کن.
