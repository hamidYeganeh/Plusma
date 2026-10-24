# LandingHeroSection — Persian, RTL and theme QA

final result: passed

Current scope: localize the existing hero using next-intl, mirror its layout and
interactions for Persian, and use the application’s shared light/dark theme.
The original English cloning report is preserved in
`output/design/landing-hero/initial-clone-qa.md`.

## Source and rendered evidence

Original visual truth: `output/design/landing-hero/source-desktop.png` and
`output/design/landing-hero/source-mobile.png`, captured from
https://kuro-coffee-template.modulify.website/.

Current production page: http://localhost:3001/.
All current screenshots are in `output/design/landing-hero/fa/`:

- `desktop-light.png`: 1440 × 900 CSS px and image px.
- `desktop-dark.png`: 1440 × 900 CSS px and image px.
- `mobile-light.png`: 390 × 844 CSS px and image px.
- `mobile-dark.png`: 390 × 844 CSS px and image px.
- `notes-dark.png`: focused Persian notes-panel evidence at 1440 × 900.
- `comparison-desktop.png` and `comparison-mobile.png`: original on the left,
  current Persian/light theme on the right, at matching viewport sizes and density.

All comparisons use one image pixel per CSS pixel, without rescaling. Captures
show Coffee / Original at the top of the hero. Floating motion was paused for
layout checks and restored for the final desktop preview; small ingredient-pose
differences reflect its animation phase.
The notes capture shows the Persian notes panel open. Photography and component
geometry are compared with the original; language, typeface, reading direction,
control colors and theme surfaces intentionally follow the user’s revised brief.

## Required fidelity surfaces

- **Fonts and typography:** the hero inherits the application’s Vazirmatn font.
  Persian headings use suitable line heights and zero letter spacing. Headline
  wrapping, flavor labels, localized prices and small controls are readable.
- **Spacing and layout:** the wordmark, action groups, ingredient orbit, progress
  indicator and scroll cue mirror for RTL. Text aligns logically, and dividers and
  badge offsets use logical CSS properties. The narrow-screen wordmark is smaller
  to preserve toolbar spacing. No horizontal overflow at 320, 390, 768 or 1440 px.
- **Colors and tokens:** UI surfaces, text, borders, primary buttons, selected
  states and focus indicators reference shared app variables. Light and dark
  themes were switched through the reused ThemeToggle in the hero menu. Existing
  scene-ink/shadow tokens preserve contrast over the unchanged photographs.
- **Image quality:** original local coffee/matcha photos and ingredient sheets
  are retained. The desktop photo is full bleed. Its mobile top fade blends into
  the selected theme background without recoloring the drink.
- **Copy and content:** all 12 flavors’ names, titles, descriptions, notes and
  image descriptions live in messages/fa.json. Visible labels, accessible labels,
  menu text and announcements use the LandingHero translation namespace. Counts,
  pagination, quantities, caffeine and sample USD prices use Persian formatting.

## Interaction verification

- A rightward swipe advances Original → Caramel; ArrowLeft advances onward to
  Vanilla. The ingredient orbit mirrors the same RTL interaction direction.
- Coffee/Matcha switching changes Persian headings, image descriptions and flavors.
- Persian notes show localized size, caffeine and price.
- Adding a drink and increasing its quantity updates Persian bag labels and total
  (۲ drinks → $۱۰٫۸۰ for two Original drinks). Clear/remove behavior is retained.
- Escape closes panels and restores trigger focus. The modal menu retains its
  native focus containment and Persian navigation labels.
- Light/dark controls work through the shared ThemeToggle; original light
  preferences were restored after verification.
- Production console inspection returned no warnings or errors.
- The café directory remains below the hero with its existing RTL layout.

## Iteration history and findings

1. Initial light-theme rendering revealed visible photo-mask edges and a heavy
   headline shadow. Removed the desktop edge mask, extended the mobile fade and
   removed the mobile text shadow. Rebuilt and recaptured the final light views.
2. Checked long Persian brand names at 320 px; reduced the narrow toolbar wordmark
   size and rechecked its layout. No overlapping controls or page overflow remain.
3. Completed side-by-side source/Persian comparisons and inspected the translated
   notes and bag at their rendered sizes. Differences in font, language, mirrored
   positions and theme colors are requested changes, not outstanding defects.

No actionable P0/P1/P2 findings remain. No follow-up visual fixes are required.

## Validation

- Production build including TypeScript and prerendering: passed.
- ESLint and formatting: passed.
- Type generation and type check: passed.
- Existing tests: all 14 passed.
- Direct next-intl translation validation: all 12 flavors, all notes/alt text,
  zero/one/multiple bag labels and Persian currency formatting passed.
- git diff --check: passed.

## Implementation checklist

- [x] All hero copy and accessible text use next-intl.
- [x] The app font and Persian number formatting are used throughout.
- [x] RTL layout, swipes and keyboard navigation agree.
- [x] Shared light/dark theme variables replace fixed template UI colors.
- [x] Desktop/mobile production views and key interactions verified in-browser.
- [x] The open preview is refreshed with the localized production build.

## پنل رزرو و پذیرش — ۲۴ اکتبر ۲۰۲۶

- منابع: Mobbin Beli/Tock در `docs/guides/running-reservations.md`؛ ۴ جهت 12ui بررسی شد و B برای فهرست روز انتخاب شد. Branch ورود و HTML دو صفحه را ساخت؛ خروجی prototype با خطای سرویس «Unknown create route» پس از retry متوقف شد. HTML تبدیل‌شده مبنای ساخت React و اتصال رفتار واقعی شد.
- کیت تطبیق ورود: `/tmp/plusma-staff-alignment-login-image`؛ تصویر اجرا و تصویر اصلی به improve داده شد. Conversion و plan کامل شدند؛ image-mode فاقد DOM anchor است و plan یک specification مستقل است، نه فهرست تفاوت قابل اعمال خودکار. `token-patch.css` دلتا ندارد. تصویر استخراج‌شده میز/صندلی از kit به public منتقل شد؛ raster جدید با CSS بازسازی نشد.
- sidebar و avatar جعلی صفحه ورود اعمال نشدند: کاربر هنوز احراز نشده و شناسه کارمند واقعی در صفحه ورود در دسترس نیست. آیکن تصویری میز در همان nav حذف‌شده مصرفی ندارد. ناوبری بی‌عمل مشتریان/منو/گزارش‌ها و نام کافه فرضی به قابلیت محصول اضافه نشدند. پس از ورود، هویت و مکان مجاز از Nest می‌آیند. این تفاوت‌ها برای حفظ محتوای واقعی و جریان احراز هستند.
- فهرست روز بر اساس B، با سطرهای واقعی PostgreSQL و حالت خالی/خطا/انتظار است. در عرض ۳۹۰ tbody به کارت تمام‌عرض تبدیل شد؛ تداخل نام table-panel با پنل صحنه رفع شد. بازه ۳۰ دقیقه check-in در کنترل و سرور رعایت می‌شود.
- Chrome: ورود، دریافت روز، check-in، تأیید لغو، نمایش cancelled، خروج؛ حالت موبایل 390×844 بررسی و viewport بازنشانی شد. رکوردهای تست پاک شدند. اسکرین‌شات‌ها: `/tmp/plusma-staff-desktop.png`، `/tmp/plusma-staff-mobile.png`، `/tmp/plusma-staff-login.png`.

- تطبیق پنل با LayerDoc بدون تغییرِ تصویر B در `/tmp/plusma-staff-panel-layerdoc-check` کامل شد (همه stageها settled؛ بدون خرید جدید). منبع عکس، screenshot پیاده‌سازی و هدف، همان LayerDoc استخراج‌شده از تصویر اصلی است. token-patch دلتا ندارد و plan image-mode unanchored است؛ هیچ ادعای پوشش selector یا برابری خودکار پیکسلی نمی‌شود. شبکه جدول، فاصله‌ها، sidebar و رنگ‌ها از HTML اصلی حفظ و در مرورگر دسکتاپ/موبایل مقایسه شدند. سه raster این plan مربوط به پرتره ساختگی و آیکن‌های ناوبری «مهمانان/میزها» هستند؛ این بخش‌ها برای حفظ هویت واقعی و نداشتن لینک بی‌عمل در scope محصول وارد نشدند. منبع‌های تصویر در kit حفظ‌اند. خروجی responsive HTML جداگانه همان conversion هنوز در حال جمع‌آوری توسط CLI است؛ تطبیق کامل‌شده به آن وابسته نیست.
- تعویض روز هنگام تازه‌سازی از یک effect قابل لغو می‌گذرد تا پاسخ دیررس روز قبلی روی فهرست جدید ننشیند. تغییر روز و تازه‌سازی از مرورگر نیز بررسی شد.

## پنل Luma و منوی عمومی — ۲۴ اکتبر ۲۰۲۶

- این بازطراحی جایگزین sidebar و رنگ‌های ثابت پنل قبلی است: سربرگ کوتاه، فضای میانی، تب افقی و فهرست آرام طبق مرجع Luma؛ همه رنگ‌ها از تم موجود.
- مرجع و دلیل توقف 12ui قبل از تولید گزینه در `docs/design/cafe-workspace.md` ثبت است. خروجی یا alignment تازه 12ui ادعا نمی‌شود.
- مرورگر production: افزودن/ویرایش منو، ثبت حضور، سفارش دو واحد، مبلغ، آماده‌سازی، آماده‌شدن و تحویل. منوی عمومی از صحنه با همان قیمت باز می‌شود و موتور نمایش pause می‌شود.
- تم روشن/تیره، عرض‌های ۱۴۴۰، ۳۹۰ و ۳۲۰، فرم ویرایش موبایل و نبود سرریز افقی کنترل شدند. داده آزمایشی پس از تأیید مبلغ و وضعیت از PostgreSQL پاک شد. شمارنده‌ها داده واقعی‌اند و تب یا اکشن نمایشی اضافه نشده است.
- ۴۲ آزمون، build، lint و typecheck موفق. پرداخت و صندوق در این مرحله وارد محصول نشده‌اند.
