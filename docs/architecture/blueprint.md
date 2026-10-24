# بلوپرینت

## وضع فعلی

دو برنامه فعال داریم: `apps/space` برای صفحات عمومی و پذیرش، و `apps/api` با NestJS برای هویت، رزرو، منو و سفارش PostgreSQL. ماژول کافه در space مالک catalog محلی نمایش، صحنه‌ها، پنل میز، رزرو مشتری و پنل کارکنان است. `@repo/spatial` نمایش فضایی مستقل را فراهم می‌کند. runtime و فقط builder صحنهٔ انتخابی پس از mount مرورگر بارگیری می‌شوند. قوانین و ظرفیت عملیاتی در `api/modules/cafe` قرار دارند.

```text
صفحه فهرست / صفحه cafe/[slug]
         │
         ├── catalog: نام، slug، معرفی، preview، شناسه صحنه، خلاصه میزها
         │
         └── CafeExplorer: ارائه، وضعیت رابط و پیام‌ها
                    │
                    ├── packages/ui: primitiveهای مشترک
                    ├── next-intl: متن و زبان
                    ├── next-themes: تم رابط
                    ├── cafe/scenes: adapter و هندسهٔ برگ یا کاما
                    └── @repo/spatial: دوربین، ورودی، حرکت و lifecycle
                              ↑ SceneDefinition؛ بدون import از کافه
```

## مسئولیت‌ها و جهت وابستگی

- route: حل slug، metadata و not-found؛ بدون هندسه و رویداد مرورگر.
- catalog: داده عمومی نمایش؛ بدون renderer، fetch و وضعیت کاربر.
- نمایش: ترکیب کنترل‌ها و نمایش وضعیت؛ بدون محاسبه برخورد و دست‌کاری دوربین.
- spatial: مالک loop، ورودی، کنترل حرکت، اندازه canvas و cleanup؛ بدون app، React، متن فارسی، ظرفیت، رزرو و شبکه.
- adapter صحنه: تبدیل شناسهٔ هدف فضایی به میز، منابع هندسه و رفتار اختصاصی کیفیت/خروجی مدل؛ متعلق به کافه.
- صحنه برگ: هندسه و نور؛ بدون آگاهی از Next، فرم و حساب کاربر.
- UI: primitive و variantهای بصری؛ بدون import از apps.
- ترجمه: `messages/fa.json`؛ اطلاعات نام و معرفی کافه محتوای catalog هستند.

هیچ app از app دیگر import نمی‌کند. module دارای interface عمومی کوچک و implementation داخلی است. `module.json` نوع business/shared و interfaceهای عمومی اضافه را مشخص می‌کند. moduleهای business مستقل‌اند و module مشترک از آن‌ها import نمی‌کند. بررسی importهای resolveشده در `npm run check:architecture`، جزئی از lint ریشه، alias، dynamic import، type import و مسیرهای نسبی را نیز پوشش می‌دهد. کوچک بودن تابع به‌تنهایی نقص معماری نیست؛ deletion test باید نشان دهد حذف module پیچیدگی را بین callerها پخش می‌کند.

## الگوهای استفاده‌شده

Composition برای ترکیب primitiveهای UI؛ Facade برای پنهان‌کردن چرخه عمر Three؛ constructor/factory ساده برای ساخت صحنه؛ configuration-driven rendering برای اطلاعات کافه؛ Observerهای مرورگر برای resize و lifecycle. DI در interface runtime به شکل canvas و callbackهای ورودی است، بدون container سراسری.

دو صحنهٔ محصول داریم: برگ و بازسازی تقریبی کاما بهشتی. `modules/cafe/scenes/index.ts` انتخاب و بارگیری builder همان صحنه را انجام می‌دهد؛ شناسهٔ نامعتبر خطا می‌دهد و به کافهٔ دیگری fallback نمی‌کند. `SceneDefinition` هدف‌های رشته‌ای، waypoint شروع صریح، محدودهٔ نقشه و navigation را به runtime می‌دهد. الگوریتم عمومی مسیریابی در `packages/spatial/src/navigation.js` است؛ collisionهای هر مکان محلی می‌مانند. fixture مسکونی، مصرف همان interface بدون مدل کافه را بررسی می‌کند و route محصول نیست.

## lifecycle

بعد از mount، import پویا با پرچم cancellation انجام می‌شود. خروج، loop را متوقف می‌کند، listenerها و observerها را حذف می‌کند و منابع هندسی، بافت، نور، reflection و renderer را آزاد می‌کند. وضعیت حرکت در blur و hidden پاک می‌شود. راهنما ورودی صحنه را متوقف می‌کند.

## انتخاب میز و کیفیت رندر

`modules/cafe/data/barg-tables.js` مرجع چیدمان و ظرفیت نمایشی میزهاست؛ ظرفیت و زمان آزاد عملیاتی از PostgreSQL می‌آیند. catalog فقط خلاصه عمومی و ارتباط هدف با میز را به رابط می‌دهد. `TablePanel` مسئول انتخاب و نمایش اطلاعات است. runtime فقط شناسهٔ هدف فضایی را انتخاب می‌کند؛ adapter آن را روی هندسهٔ میز برجسته می‌کند. `routeToTarget` از `@repo/spatial` مسیر ایستادن کنار هدف یا رفتن به focus قابل‌عبور اتاق را با navigation همان صحنه پیدا می‌کند. هدف می‌تواند mesh یا Group دارای فرزندان باشد. هیچ وضعیت رزرو یا موجودی به صحنه اضافه نشده است.

`render-quality.js` بودجه اولیه را بر اساس عرض، اشاره‌گر لمسی و قابلیت‌های اعلام‌شده دستگاه تعیین می‌کند. موبایل از reflection pass صرف‌نظر می‌کند؛ دستگاه محدود بافت کوچک‌تر، برگ کمتر و سقف هدف ۳۰ فریم دارد. پس از گرم‌شدن، نمونه ۹۰ فریم فعال با میانه بیش از ۳۸ms یک بار DPR و shadow/reflection را کاهش می‌دهد. این برآورد جای benchmark سخت‌افزار واقعی را نمی‌گیرد.

در صفحه پنهان، loop متوقف و ورودی‌ها پاک می‌شوند. در راهنما/صفحه ورود، پس از redraw موردنیاز loop می‌ایستد. تغییر نور زمان کوتاهی برای همگرایی نور رندر می‌کند. بازگشت و resize دوباره رندر را فعال می‌کنند.

## ساختار هدف آینده — هنوز پیاده نشده

`space` برای مهمان، `console` برای کارکنان، `api` موجود با moduleهای داخلی برای قواعد و تراکنش‌ها؛ `desk` برای صندوق محلی و `worker` برای کار پایدار پس‌زمینه. PostgreSQL اکنون در رزرو استفاده می‌شود؛ object storage هنگام انتشار محتوای بیرونی بررسی می‌شود. پنل فعلی کارکنان تا نیاز واقعی به app مستقل، در `/staff` و ماژول کافه space قرار دارد.

هسته مشترک مکان/صحنه با قواعد رزرو کافه یکی نیست؛ ملک، تالار و سینما منو و ظرفیت میز کافه را به ارث نمی‌برند. جداسازی نمایشگر در [ADR-0005](../adr/0005-independent-spatial-module.md) پذیرفته و پیاده شده؛ زیرساخت عملیاتی رزرو در [ADR-0006](../adr/0006-operational-reservations.md) ساخته شده است؛ سفارش، پرداخت و صندوق باقی‌اند. مسیر افزودن صنف در [راهنمای افزودن کسب‌وکار](../guides/adding-a-business.md) آمده است.

## اکشن رزرو مشتری

`modules/cafe/reservations` caller قرارداد HTTP رزرو است: زمان‌های سرور، نگه‌داشت، اطلاعات تماس، تأیید، پیگیری و لغو. `TablePanel` فقط میز و شناسه/نام کافه را به این جریان می‌دهد. canvas هنگام باز بودن dialog متوقف می‌شود؛ قواعد رزرو وارد runtime یا هندسه نشده‌اند. توکن مهمان در sessionStorage همان زبانه و درخواست‌های نامطمئن با کلید idempotency قبلی بازیابی می‌شوند. `modules/cafe/staff` پنل پذیرش و caller همان قرارداد است؛ session و مجوز مکان در Nest بررسی می‌شوند.

اشیای مرجع عکاسی در `scenes/barg/reference-objects.js` هندسه می‌سازند و از UI بی‌خبرند. مالک صحنه منابع آن‌ها را همراه سایر منابع ثبت و آزاد می‌کند. توری صندلی‌ها هنگام batching به LineSegments مشترک تبدیل می‌شود تا تعداد صندلی‌ها به همان تعداد draw call اضافه نکند. محل موانع اصلی در layout مرجع مشترک رندر و برخورد است.

## برش عملیاتی رزرو — ۲۴ اکتبر ۲۰۲۶

`space → HTTP /api/v1 → apps/api (NestJS) → PostgreSQL`. Next فقط proxy هم‌مبدأ است؛ قوانین رزرو در Nest اجرا می‌شوند. قرارداد داده در `@repo/contracts` قرار دارد. `database` و `access` ماژول‌های مشترک و `cafe` ماژول صنف کافه هستند. نمایشگر و scene adapterها هیچ import از API، رزرو یا هویت ندارند.

ماژول رزرو قفل میز، exclusion constraint، زمان‌بندی، انقضا، idempotency و تغییر وضعیت را در implementation خودش نگه می‌دارد. callerهای مشتری و کارکنان از یک interface HTTP استفاده می‌کنند؛ کارکنان پس از احراز session و مجوز مکان. [ADR-0006](../adr/0006-operational-reservations.md) بخش تعویق backend در نقشه قبلی را برای رزرو جایگزین می‌کند.

منو و سفارش در همین دامنه کافه طبق [ADR-0007](../adr/0007-cafe-menu-and-orders.md) قرار دارند؛ قیمت و وضعیت عملیاتی هیچ وابستگی‌ای وارد نمایشگر سه‌بعدی نمی‌کنند.
