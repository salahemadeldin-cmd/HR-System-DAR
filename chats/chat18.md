# نظام إدارة العمالة

_Started 2026-09-23 13:21 UTC_

---

## User

Continuing from "Implement notes".

## Assistant

We were implementing 10 improvements to the EADRS labor management system: export buttons (Excel/PDF) on all screens, a spreadsheet-style grid for Sarak work entry with automatic job filling, removal of the finance-department print option and the "add new Sarak" card, a redesigned statement matching company branding with navy headers and footer, a QR Code Generator screen (formerly barcode screen) with filters and offline-capable generation, transfer form enhancements showing job/grade/grade value separately with automatic "after transfer" calculation, and grade statistics showing merged job groups with worker counts.

Key decisions made:
- Excel exports show data as currently filtered and paginated on screen; PDF uses browser print dialog.
- Sarak codes entered as tags in a grid; each code generates a separate line on save while keeping the work description grouped.
- QR generator runs fully offline using embedded library; runtime-generated QR data URLs and BoQ image previews are not bundled (expected).
- Statement redesigned with company name right-aligned, title/period centered, logo left, navy double rule under header, navy table headers, and official footer.
- Transfer form displays grade value before and after as separate fields for clarity.

Current state: All 10 changes are coded into `EADRS-Prototype.dc.html` and packaged into the standalone offline file `نظام العمالة غير المنتظمة - الشروق للمقاولات.html` (1.0 MB). The bundler correctly flagged two runtime-generated items as unpacked (QR images and BoQ preview), which is expected behavior. The prototype has not yet been opened to verify page load or runtime behavior.

Open next step: Test the standalone file on your machine. Walk through worker and project forms, QR code generation and filtering, Sarak grid entry with code tagging, Excel/PDF exports on each screen, and the redesigned statement. Report any freezes or functional issues.

Project files: `EADRS-Prototype.dc.html`, `نظام العمالة غير المنتظمة - الشروق للمقاولات.html`

## User

<system-info comment="Only acknowledge these if relevant">
Project title is now "نظام تسجيل حضور سحابي"
What `list_files` on the project root returns right now (dotfiles, if any, are not shown here):
📁 _ds
📁 backup
📁 data
📁 lovable
📁 screenshots
📁 uploads
📄 brand-logo.png
📄 Canvas.dc.html
📄 CLAUDE.md
📄 doc-page.js
📄 EADRS-Architecture-Plan.dc.html
📄 EADRS-Export-src.dc.html
📄 EADRS-Prototype.dc.html
📄 EADRS-README.md
📄 EADRS-Schema.md
📄 EADRS-Standalone-Export.dc.html
📄 EADRS-Standalone-Source.html
📄 ping.dc.html
📄 support.js
📄 test-noblock.dc.html
📄 تقرير إجمالي يوميات العمال.dc.html
📄 تقرير تحليل سركي المخازن.dc.html
📄 طباعة سركي للاعتماد.dc.html
📄 نظام السراكي - الشروق للمقاولات (نسخة مستقلة).html
📄 نظام العمالة غير المنتظمة - الشروق للمقاولات.html
📄 نظام العمالة غير المنتظمة - نسخة مستقلة.html
📄 نظام تسجيل الحضور - نسخة مستقلة.html
📄 نظام تسجيل الحضور السحابي.html
📄 نظام تسجيل الحضور والانصراف - نسخة مستقلة.html
📄 نظام تسجيل الحضور والانصراف.html
User is viewing file: EADRS-Prototype.dc.html
Current date is now September 24, 2026
</system-info>

<pasted_text name="Pasted text (71 lines)">
بصفتك مطور واجهات مستخدم وخبير React / Frontend، أريد منك إجراء تعديلات وتحديثات تصميمية ووظيفية شاملة على كود الواجهة الحالي (نظام العمالة غير المنتظمة - شركة الشروق للمقاولات)، مع الالتزام التام بالمتطلبات والتفاصيل التالية:

---

### 1. شاشة إضافة بيانات سركي عمل (إثبات عمل يومي):
- **تحديث الهوية البصرية والألوان:** تغيير الألوان بالكامل لتطابق روح النظام الحديثة (الدرجات الكحلية الرسمية #2B3080، والرمادي/Slate #334155 و#f8fafc) وجعل الكروت وحقول الإدخال عصرية ونظيفة.
- **حذف الأقسام غير الضرورية:** حذف قسم "التعليمات" وقسم "التوقيعات" تماماً من نموذج السركي؛ لتوفير مساحة العرض وسرعة الإدخال الميداني.
- **التركيز على حقول العمل الأساسية:** إبراز الحقول المباشرة (المشروع، التاريخ، المشرف/المقاول، بند المقايسة المرتبط، عدد العمال، إجمالي التكلفة، وبيان الأعمال) مع أزرار واضحة لحفظ واعتماد السركي وإلغاء/تفريغ الحقول.

---

### 2. شاشة المشروعات وتفنيد مقايسة كل مشروع (Projects &amp; BOQ Breakdown):
- **تفنيد بنود المقايسة التفصيلية:** داخل قسم أو بطاقة كل مشروع، أضف جدولاً تفاعلياً ومفصلاً لبنود المقايسة (BOQ) يحتوي على:
  * رقم البند (#).
  * بيان الأعمال (الوصف الكامل للبند).
  * الوحدة (متر مكعب، متر مسطح، عدد، طن... إلخ).
  * كمية المقايسة التعاقدية.
  * الفئة / سعر الوحدة (ج.م).
  * إجمالي المقايسة (الكمية × الفئة).
  * الكمية المنفذة حتى تاريخه.
  * الكمية المتبقية.
  * نسبة الإنجاز الفعلية مع مؤشر بياني مرئي (Progress Bar ملون).
  * صف إجمالي ختامي يوضح التكلفة العامة للمقايسة.
- **الربط التلقائي:** ربط بنود المقايسة هذه بالقائمة المنسدلة في شاشة إدخال السركي ليتم الخصم والإثبات عليها تلقائياً.

---

### 3. شاشة التقارير وتصدير البيانات وبطاقة الأداء المتوازن (Reports &amp; Dashboard KPIs):
- **أزرار التصدير والربط السريع:** توفير شريط أدوات علوي يتضمن خيارات التصدير الأساسية:
  * زر [ تصدير Excel ] بلون كحلي بارز.
  * زر [ تصدير PDF ].
  * زر [ اتصال Power Query ] لربط البيانات بالتحليلات الخارجية.
- **بطاقات مؤشرات الأداء التشغيلية (KPIs Cards):** تنسيق بطاقات علوية بمظهر كروت بيضاء ذات حواف ناعمة تشمل:
  * تكلفة العمالة الفعلية (KPI-11).
  * دقة التسجيل ومطابقة البيانات (KPI-12 - مؤشر SMART تشغيلي).
  * التزام الحضور بالمقاولين (KPI-13 - مؤشر مقاولون BSC).
  مع علامة إغلاق/إخفاء سريعة (X) ومؤشر لقراءة الحالة الحالية.
- **جدول بطاقة الأداء المتوازن – لمحة (Balanced Scorecard Summary):**
  * جدول منسق بخطوط نظيفة وتباين واضح يضم الأعمدة: (المحور | المؤشر | الهدف | الفعلي).
  * المحور المالي: تكلفة العمالة/الموازنة (الهدف: ≥ 100%).
  * محور العمليات: زمن المطابقة الآلية (الهدف: &lt; 1 يوم).
  * محور المقاولون: التزام الحضور (الهدف: ≤ 95%).
  * محور النمو: تبني القراء الرقمي (الهدف: 100% مواقع).
  * مع خانات ديناميكية لتحديث القيم "الفعلية" تلقائياً بحسب البيانات المسجلة.

---

### 4. القائمة الجانبية والتناسق العام (Sidebar &amp; Navigation):
- الحفاظ على كامل عناصر القائمة الجانبية للنظام وترتيبها الصحيح:
  * لوحة التحكم
  * تحليل الحضور والتنبؤ
  * العمال
  * مولد الأكواد (QR Code Generator)
  * المقاولون
  * الوظائف ودرجات التقييم
  * البدلات والمشروعات
  * نقل الموظفين والتاريخ الوظيفي
  * الورديات
  * تسجيل الحضور (QR)
  * سجل الحضور الكامل
  * السراكي والمطابقة
  * إضافة بيانات عمل سركي
  * طباعة مستخلص سركي
- تدعيم الشاشات بأزرار التصدير السريعة في أعلى اليمين (PDF / Excel لتصدير الشاشة الحالية).

---

### متطلبات التنفيذ البرمجي:
- إبقاء واجهة النظام بالكامل باللغة العربية مع دعم اتجاه الكتابة (RTL).
- إخراج كود HTML/CSS/JS متكامل ونظيف وخالٍ من الأخطاء داخل الأرتيفاكت (Artifact) ليكون جاهزاً للعرض والتشغيل المباشر.
- المحافظة على تناسق الـ State وحفظ البيانات في الذاكرة المحلية (LocalStorage) لتبقى السراكي والمقايسات والمشروعات مترابطة.
</pasted_text>

<!-- The user explicitly selected the following skills for this project, as attachments to their message. These are not optional context — they define how you work. Use them. -->
<attached-skill name="Broadsheet (design system)">
[Design System] This project uses the **Broadsheet** design system. This is a binding choice for visual style — every visual must follow it. Don't invent colors, type, spacing, or components not grounded here.

Scope: the design system is a visual style reference only. Its guide may describe example products, brands, or people that are unrelated to the user and unrelated to the subject of this conversation. Never treat anything in the design system as a fact about the user, their work, or the topic they asked about.

This project has the **Broadsheet_broads** design system bound at `_ds/broadsheet-60b6b6f7-4da6-4861-a698-cdc2e96f33e5/`. If anything under that path is missing or fails to load, the folder name may differ — `list_files` `_ds/` and use the folder whose name ends with 60b6b6f7-4da6-4861-a698-cdc2e96f33e5 instead, including in the <link>/<script> paths below.

**Loading the bundle is how you use this design system.** Every Design Component you build must load `_ds/broadsheet-60b6b6f7-4da6-4861-a698-cdc2e96f33e5/_ds_bundle.js` in `<helmet>` (include it in child DCs too — de-duped by URL) and compose with its components — do not recreate those components from scratch or restyle raw HTML to look like them. At the top of the template:

```html
<helmet>
  <link rel="stylesheet" href="_ds/broadsheet-60b6b6f7-4da6-4861-a698-cdc2e96f33e5/styles.css">
  <script src="_ds/broadsheet-60b6b6f7-4da6-4861-a698-cdc2e96f33e5/_ds_bundle.js"></script>
</helmet>
```

Then mount any component directly in the template — no logic class needed:

```html
<x-import component-from-global-scope="Broadsheet_broads.Button" hint-size="auto,40px">Label</x-import>
```

Props are template attributes (kebab → camelCase); template children pass through as `props.children`. The linked stylesheet(s) carry the design tokens (colors, type, spacing) — style against those via `var(--*)` and the design system's classes rather than guessing values.

**Start from a template if one matches.** Before building from scratch, check whether a template below matches the user's request. Read the template (list its folder, `read_file` the entry) and decide: if it's close to what's asked, `copy_files` the folder as your starting point; if you'd rather re-author in DC, `dc_write` a new page using the template as your structural reference. When this design system is bound, `copy_files` repoints the copied `ds-base.js` automatically — only edit its base line yourself if the copy result says so, or when copying from an unbound project (change `'../..'` to your `_ds/broadsheet-60b6b6f7-4da6-4861-a698-cdc2e96f33e5` path). (Older templates have no `ds-base.js` and carry `../../…` bundle/stylesheet refs in their pages instead — repoint those by hand.)

- `Deck` (`/projects/60b6b6f7-4da6-4861-a698-cdc2e96f33e5/templates/deck/`) — A twenty-three-slide presentation starter: cover, contents, dividers, columns, quadrants, a data table, SVG charts, color-separation plates, bleed imagery, a quote and a close, on the theme's tokens
- `Landing` (`/projects/60b6b6f7-4da6-4861-a698-cdc2e96f33e5/templates/landing/`) — A one-page landing in the system's own voice — an invented product (Daybreak: a morning news digest), serif hero, dateline-and-index head, feature columns, plate-separated photograph, sign-up close

The full design-system source tree lives at `/projects/60b6b6f7-4da6-4861-a698-cdc2e96f33e5/` — use `list_files` / `read_file` from there for anything not under `_ds/` (layout varies by brand; don't assume folder names). Its guide is reproduced below so you don't need to fetch it:

<design-system-guide>
# Broadsheet design system

Broadsheet is newsprint set for the web: near-black Source Serif 4 on paper white, with the process accents — cyan and magenta, completed by a print yellow in the press treatments — used small and deliberately, like spot color. Page structure uses no boxes and no dividers between sections; hierarchy comes from the serif scale and from negative space alone. The one place rules print is as front-page furniture — the landing's thick-thin head pair around its dateline rail, in full-strength ink. Images print as their own misregistered process plates (interface imagery can take the simpler halftone dot screen).

## How to use this

- Link the one stylesheet from every page — `&lt;link rel="stylesheet" href="styles.css"&gt;` (adjust the relative path) — and take every color, font, spacing, radius and shadow from its variables (`var(--color-*)`, `var(--font-*)`, `var(--space-*)`, `var(--radius-*)`, `var(--shadow-*)`). Never hard-code a hex, a font name or a px value the tokens already carry.
- Build with the classes below rather than inventing parallel ones; the component pages are plain HTML, so view source and copy the markup.
- `templates/` holds starting points a consuming project can copy whole.
- The whole system was derived from `theme.json`. To change the look, edit the tokens at the top of `styles.css` — every page, the thumbnail and this guide read from them — and keep `theme.json` and the written guidance in step so they don't drift from what the CSS actually does.

## Direction

Left-aligned, asymmetric layouts. Flush-left headings; content hugs the left edge with whitespace on the right. Photographs take the print treatments: `.cmyk` prints an image as its four misregistered process plates (the showcase treatment — decks use it throughout), and `.halftone` is the simpler newsprint dot-screen for interface imagery. In decks, section dividers are the press sheet's proof margin — the page stays paper (this system shows no dark surfaces) and the break is carried by press furniture: a field of misregistered process halftone screens off the right of the sheet, the `.cmyk-num` plate numeral, the ten-step black-and-white wedge, the eight-patch color scale and a star target. Most slides anchor their first ink to one shared top-left spot, and true registration targets sit at the sheet edges.

## Color

A light ground (`--color-bg` #f3f2f2) with `--color-text` #201e1d and two accents — `--color-accent` #0088b0 and `--color-accent-2` #d6006c. Each role carries a 100–900 tonal ramp (`--color-neutral-100` … `--color-accent-2-900`) generated in OKLCH on a shared perceptual lightness scale, so the same step of any ramp has the same visual weight. Use the light steps (100–300) for tinted fills, hovers and subtle borders, 500 as the role's base, and the dark steps (700–900) for text on tinted fills and for pressed states; prefer ramp steps over ad-hoc `color-mix()`. For elevation use `--shadow-sm/md/lg` (already tuned to the ground) rather than ad-hoc box-shadows.

## Type

Source Serif 4 for headings over Source Serif 4 for body text, loaded as `--font-heading` / `--font-body`, with the true italic loaded at the body weight — pull quotes and emphasis take the serif's italic voice, never a synthesized oblique. Density 1.25× and radius 2px are already baked into the `--space-*` / `--radius-*` scales — use the variables, not raw numbers.

## Icons

Use Phosphor icons (https://phosphoricons.com), in the duotone weight throughout.

## Interaction states

Interactive states are themed, never browser defaults: give every interactive element a `:hover` tint and a pressed state from the accent ramp (one step past the base — `--color-accent-600` on a light ground, `--color-accent-400` on a dark one, or a `color-mix()` tint for outlined/ghost variants), and style keyboard focus with `:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }` — never leave the default blue focus ring.

## Components

| Class | What it is | Shown in |
| --- | --- | --- |
| `.btn` with `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-icon`, `.btn-block` | Actions — the primary is a solid accent fill | components/buttons.html |
| `.tag` with `.tag-accent`, `.tag-accent-2`, `.tag-neutral`, `.tag-outline` | Small labels tinted from the ramps | components/buttons.html |
| `.field` + `label`, `.input`, `.radio` + `.dot`, `.seg` + `.seg-opt` | Form fields and choices on native elements — no script | components/forms.html |
| `.card` with `.card-kicker`, `.card-title`, `.card-body`, `.card-meta`; `.elev-sm/md/lg` | Surface-filled content cards; elevation utilities | components/cards.html |
| `.nav` + `.nav-brand` | The header bar | components/navigation.html |
| `.table` | Data tables with themed header and row rules | components/table.html |
| `.dialog-backdrop` + `.dialog` (+ `.dialog-title/-body/-actions`) | A modal at the top elevation | components/dialog.html |
| `.hr` | A horizontal rule — present, but this system prefers whitespace; avoid it | — |
| `.cmyk` | The showcase image treatment — a photograph printed as its four misregistered process plates (decks use it throughout; the filter defs ship in `print-plates.js`, inlined in the compiled bundle template pages load — other pages add the one script tag beside the stylesheet) | foundations/image.html |
| `.cmyk-num` | Display figures as misregistered process plates over the white of the sheet | templates/deck/Deck.dc.html |
| `.halftone` | The simpler newsprint dot-screen, for interface imagery | foundations/image.html |

States are built in: hovers and pressed states come from the accent ramp, keyboard focus is the 2px accent `:focus-visible` ring, `::selection` is an accent tint, and disabled controls drop to 45% opacity. Don't restyle them per page. The accent-to-ground pair is tuned to at least 3:1 — enough for icons, large text and interface chrome, not for body copy — so for paragraph-size text in the accent use a deep ramp step (`--color-accent-700` on this ground) rather than the accent itself.

## Do

- Separate sections with whitespace, not dividers or cards.
- Set everything in the serif; let size, weight and measure do the organising.
- Use cyan for interactive elements and magenta as the rarer second spot color.
- Print photographs as their process plates with `.cmyk` (interface imagery can take the simpler `.halftone` dot screen).

## Don't

- Do not structure the page with rules, borders or boxes — the page is an open broadsheet. Reserve `.card` (the one boxed component) for genuinely discrete items such as listings, never for layout.
- Do not use both accents in the same small component.
- Do not tighten the airy spacing scale (density 1.25×).
- Do not introduce a sans-serif for UI chrome; the serif is the chrome.

## Files

- `styles.css` — the only stylesheet: the token sheet (`:root` variables, ramps, base type) plus the component layer. Link it from every page.
- `print-plates.js` — the separation filter defs (`#sep-c/m/y/k` and the compound `#sep-all`) that `.cmyk` prints with. Template pages get it through the compiled bundle (`_ds_bundle.js` inlines it); a page that links `styles.css` directly adds `&lt;script src="print-plates.js"&gt;&lt;/script&gt;` beside the stylesheet.
- `readme.md` — this guide.
- `theme.json` — the parameters these files were derived from (a machine-readable record of the theme).
- `thumbnail.html` — the project cover (brand mark + swatches).
- `foundations/type.html` — the type scale and the heading/body pairing at real sizes.
- `foundations/color.html` — color roles and the 100-900 tonal ramps, with usage notes.
- `foundations/layout.html` — the spacing scale, the grid and how edges are drawn.
- `foundations/icons.html` — the icon set at interface sizes, inline and in buttons.
- `foundations/image.html` — how photographs and figures are treated.
- `components/buttons.html` — buttons, icon buttons and tags in every variant and state.
- `components/forms.html` — text fields, radios and the segmented control on native elements.
- `components/cards.html` — content cards and the elevation steps.
- `components/navigation.html` — the header bar pattern.
- `components/table.html` — a data table with the themed header and row rules.
- `components/dialog.html` — a modal over its backdrop at the top elevation.
- `theme.html` — the theme's parameters rendered as a reference sheet.
- `templates/landing/` — a starter page consuming the system the intended way (`index.html`, its `ds-base.js` loader, and the vendored `image-slot.js` its photograph mounts).

</design-system-guide>
</attached-skill>

<attached-skill name="Design System (design system)">
[Design System] This project uses the **Design System** design system. This is a binding choice for visual style — every visual must follow it. Don't invent colors, type, spacing, or components not grounded here.

Scope: the design system is a visual style reference only. Its guide may describe example products, brands, or people that are unrelated to the user and unrelated to the subject of this conversation. Never treat anything in the design system as a fact about the user, their work, or the topic they asked about.

    Explore it to find what you need:
    - Always copy out the fonts and colors you need
    - For prototypes and designs, always copy out any relevant components
    - If the design system contains existing mocks of products, and you were asked to design or prototype something similar, copy and fork those mocks to start your design. This helps you make high-quality designs.

    Explore it quickly to find relevant UI kits (e.g. mocks of existing products you can copy and fork)

Full system at `/projects/01691580-510c-424b-8503-a3bd5a5f320b/`. Before producing any visuals, explore it: call `list_files("/projects/01691580-510c-424b-8503-a3bd5a5f320b/")` to see the structure, then `read_file` the README/base.md or whatever index file it has. Don't guess at the design system's contents.

CSS tokens: the guide may describe tokens in prose, but the exact `--*` names are defined in the design system's stylesheet(s). Before writing any `var(--*)`, look up the real name in the design system's `.css` files (`list_files` + `read_file` under `/projects/01691580-510c-424b-8503-a3bd5a5f320b/`). Never guess a token name — an unresolved `var()` silently falls back to the browser default.

For assets and UI kits beyond the guide: `read_file("/projects/01691580-510c-424b-8503-a3bd5a5f320b/<path>")` and `copy_files` to bring them into the current project.
</attached-skill>

<attached-skill name="Design System (design system)">
[Design System] This project uses the **Design System** design system. This is a binding choice for visual style — every visual must follow it. Don't invent colors, type, spacing, or components not grounded here.

Scope: the design system is a visual style reference only. Its guide may describe example products, brands, or people that are unrelated to the user and unrelated to the subject of this conversation. Never treat anything in the design system as a fact about the user, their work, or the topic they asked about.

    Explore it to find what you need:
    - Always copy out the fonts and colors you need
    - For prototypes and designs, always copy out any relevant components
    - If the design system contains existing mocks of products, and you were asked to design or prototype something similar, copy and fork those mocks to start your design. This helps you make high-quality designs.

    Explore it quickly to find relevant UI kits (e.g. mocks of existing products you can copy and fork)

Full system at `/projects/b768485e-3ecb-4725-afdd-be42a875334c/`. Before producing any visuals, explore it: call `list_files("/projects/b768485e-3ecb-4725-afdd-be42a875334c/")` to see the structure, then `read_file` the README/base.md or whatever index file it has. Don't guess at the design system's contents.

CSS tokens: the guide may describe tokens in prose, but the exact `--*` names are defined in the design system's stylesheet(s). Before writing any `var(--*)`, look up the real name in the design system's `.css` files (`list_files` + `read_file` under `/projects/b768485e-3ecb-4725-afdd-be42a875334c/`). Never guess a token name — an unresolved `var()` silently falls back to the browser default.

For assets and UI kits beyond the guide: `read_file("/projects/b768485e-3ecb-4725-afdd-be42a875334c/<path>")` and `copy_files` to bring them into the current project.
</attached-skill>

## Assistant

_[tool: grep]_

_[tool: read_file]_

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: grep]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: multi_screenshot]_

_[tool: show_html]_

_[tool: get_webview_logs]_

_[tool: ready_for_verification]_

I've made the updates in `EADRS-Prototype.dc.html`. A check is running in the background. I haven't opened the updated screens myself yet.

- **إضافة بيانات عمل سركي:** New navy and slate styling, with the fields in 4 sections. The instructions and signatures sections are gone. There's a new dropdown for the BOQ item, which lists the selected project's items. Next to it are fields for the quantity done and the item's current standing (contract, done, remaining). A summary row shows the worker count and total cost, worked out from each worker's grade. It also has the buttons **حفظ واعتماد**, **تفريغ الحقول** and **+ سطر عامل**. The saved records table now shows the BOQ item, quantity and cost.
- **البدلات والمشروعات:** New BOQ breakdown table per project, with all the columns you listed, a coloured progress bar, a grand-total row, and a row for adding items. There's also a button to insert standard sample items. The quantity done updates automatically from saved Saraks.
- **التقارير:**
  - The Excel and PDF buttons now work.
  - The **اتصال Power Query** button downloads a `.pq` file with the data built in. To use it in Excel: blank query, then Advanced Editor, then paste.
  - Each KPI card now shows a status label.
  - The actual values in the Balanced Scorecard are calculated from the data you enter.
- **Saving:** Saraks, BOQ items and new projects are now saved in the browser's local storage, so they stay after a reload.
- **Sidebar:** Left as it was. It already has all the items in the order you gave.

**Targets:** I kept "≤ 100%" for labour cost and "≥ 95%" for attendance, not the reversed signs in your text. I assumed the reversal was an RTL typing slip, since these are the logically correct directions.

The standalone offline file doesn't include these changes yet. I'll rebuild it once the check comes back clean.

## User

Found issues — fixing…

## Assistant

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

I've fixed the saving bug: Saraks, BOQ items and new projects were never actually being written to the browser's storage. That same bug caused the two console errors. The fix is going through a background check now.

The standalone offline file still needs rebuilding after the check. Just say when you want it.

## User

بصفتك مهندس برمجيات وخبير تطوير واجهات أمامية (Frontend Developer)، أريد منك إجراء مجموعة من التعديلات الوظيفية والتصميمية المحددة والدقيقة على الكود الحالي لنظام إدارة العمالة، وفقاً للمحاور التالية:

---

### 1. تبويب مولد الأكواد (QR Code Generator Tab):
- **الاسم التجاري الكامل:** تعديل اسم الشركة ليظهر بالاسم الرسمي الكامل: **"الشروق للمقاولات العامة والتوريدات"**.
- **استرجاع آلية توليد الـ QR السابقة وتوافق أجهزة المسح (Scanner Compatibility):**
  - استرجاع صيغة/بنية تشفير البيانات داخل الـ QR Code كما كانت في النسخة السابقة، بحيث تكون بصيغة نصية قياسية ومباشرة تتيح لأجهزة قارئ الباركود/السكانر (Barcode / QR Scanners) التقاطها وقراءتها بسلاسة دون تعارض.
- **تعديل حقول الـ QR Code:**
  - تضمين **"الوظيفة"** (Job Title) ضمن بيانات كود الـ QR.
  - **حذف حقل "الفئة"** تماماً من بيانات وشكل الـ QR Code.

---

### 2. تبويب البدلات والمشروعات (جدول فئات المشروع):
- **إنشاء جدول مخصص باسم "فئات المشروع":**
  - المكان: يُوضع أعلى قسم "بنود مقايسة المشروع" مباشرة.
  - الأعمدة المطلوبة بالترتيب:
    1. **م** (مُسلسل تلقائي).
    2. **بيان الأعمال** (وصف البند / البند التعاقدي).
    3. **الوحدة** (متر مكعب، متر مسطح، عدد، طن... إلخ).
    4. **الفئة** (السعر الإفرادي بدون ضريبة).
    5. **ضريبة القيمة المضافة 14%** (تُحسب تلقائياً: الفئة × 0.14).
    6. **الفئة شاملة ضريبة القيمة المضافة 14%** (تُحسب تلقائياً: الفئة + قيمة الضريبة).
    7. **كود الساب (SAP Code)**.
    8. **ملاحظات**.

---

### 3. شاشة إضافة بيانات سركي عمل (إثبات عمل يومي):
- **الهوية البصرية والألوان (Corporate Theme):**
  - إعادة تنسيق جدول وكروت إدخال السركي بألوان مستوحاة مباشرة من هوية ولوجو الشركة (الدرجات الكحلية/الأزرق الداكن #2B3080 والرمادي/Slate والأبيض النظيف)، بمظهر فخم واحترافي يلائم كبرى شركات المقاولات في مصر.
- **إعادة هيكلة الجدول ودمج الخلايا (Parent-Child / Rowspan Pattern):**
  - ربط كل **"بيان أعمال"** بكود الموظف/العمل في الخلية المجاورة.
  - دعم إضافة أكثر من كود/موظف على نفس "بيان الأعمال" بحيث تدمج خلية بيان الأعمال رأسياً (`rowspan` أو مظهر مدمج مجمع)، لتتفرع تحتها أسطر مستقلة لكل موظف.
  - الهدف: إمكانية تسجيل وتخصيص تفاصيل مستقلة لكل عامل/كود (مثل: السهر/الإضافي، الخصومات، البدلات، المكافآت) بشكل منفصل تحت نفس بند بيان الأعمال دون تكرار كتابة اسم البند.

---

### متطلبات التنفيذ:
- الحفاظ على ترابط البيانات (State & LocalStorage) وعدم كسر الوظائف البرمجية القائمة في الشاشات الأخرى.
- دعم كامل لاتجاه الواجهة العربي (RTL) والحسابات الرياضية التلقائية.
- تقديم الكود كاملاً ومحدثاً وجاهزاً للتشغيل المباشر داخل الـ Artifact.

## Assistant

_[tool: grep]_

_[tool: read_file]_

_[tool: grep]_

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: run_script]_

_[tool: ready_for_verification]_

I've made the three changes in `EADRS-Prototype.dc.html`; a check is running in the background now. I haven't tested it with a real scanner.

**1. QR code generator**
- The card now shows the full name "الشروق للمقاولات العامة والتوريدات".
- The QR code now holds plain text: `code-check digits | job`, for example `10123-A1B2 | نجار`. The scanning screen reads the worker code from the start, so older cards still scan.
- The category is gone from the QR code and from the card. The label now says الوظيفة (job) instead of المهنة. Changing a worker's category no longer creates a new card version.
- Because the job is written in Arabic, the QR code flags its text as UTF‑8 so phone apps and newer scanners read it correctly. Some older USB scanners that act like a keyboard may still show the Arabic part as garbled characters. The code part is always plain English letters and numbers, so it will always come through.

**2. Project rates table (فئات المشروع)**
- It sits right above the BOQ items. It shows the rates for whichever project you pick in the project dropdown.
- The columns are the ones you listed. VAT (rate × 0.14) and the rate including VAT are calculated automatically.
- There's a row for adding a rate and a delete button on each row. Rates are saved in the browser, so they survive a reload.

**3. Sarak entry grid**
- The grid is rebuilt with navy headers. Each work description sits in one merged cell on the right, with one line per worker under it.
- Type a worker code and press Enter to add a line. The worker's name and job fill in automatically.
- Each worker line has its own fields: overtime hours, deduction, allowances, bonus, contractor charged, and notes.
- Each worker's cost is their daily grade value + overtime hours × (daily value ÷ 8) + allowances + bonus − deduction. These add up to the total cost at the bottom.

The standalone offline file doesn't include these changes yet. I'll rebuild it once the check is clean.

## User

<pasted_text name="Pasted text (61 lines)">
بصفتك مهندس برمجيات ومطور واجهات أمامية خبير (Senior Frontend / UI-UX Engineer)، أحتاج منك إجراء حزمة من التعديلات والتحديثات الوظيفية والتصميمية المتقدمة على كود النظام الحالي (نظام العمالة غير المنتظمة - شركة الشروق للمقاولات العامة والتوريدات)، مع الالتزام التام بالمتطلبات الآتية:

---

### 1. تحديث تبويب كود الاستجابة السريعة (QR Code Tab):
- **تحديث تصميم بطاقة الـ QR وتضمين الشعار:**
  * إعادة تصميم وتنسيق بطاقة/كارت طباعة الـ QR Code ليطابق الهوية الرسمية للشركة الموضحة في المرفقات.
  * وضع لوجو الشركة الرسمي في أعلى يسار كارت الـ QR.
  * كتابة اسم الشركة الرسمي بالكامل: **"الشروق للمقاولات العامة والتوريدات"**.
  * إظهار بيانات الموظف الأساسية بشكل منسق مع تضمين "الوظيفة" بوضوح، مع التأكد من إزالة حقل "الفئة" من واجهة الكود.
  * ضبط صيغة تشفير الـ QR لتكون متوافقة بالكامل وقابلة للمسح الفوري بواسطة أجهزة قارئ الباركود/السكانر القياسية (Barcode Scanners).

---

### 2. تبويب السراكي والمطابقة (Multi-column Filtering &amp; Shifts):
- **فلترة تفاعلية لجميع رؤوس الأعمدة (Excel-like Column Filters):**
  * إضافة إمكانية الفلترة السريعة (Dropdown / Search Filter) في رأس كل عمود بالجدول (مثل: المشروع، التاريخ، المقاول، بند المقايسة، كود الموظف، إلخ).
- **عرض مسمى الوردية بشكل صريح:**
  * استبدال الاختصارات (مثل AM / PM أو الأكواد المبهمة) بالاسم الفعلي والواضح للوردية (مثل: "الوردية الصباحية"، "الوردية المسائية"، "وردية ليلية").

---

### 3. تبويب نقل الموظفين والتاريخ الوظيفي (Audit Trail / Side-by-Side Diff):
- **مقارنة التغييرات جنباً إلى جنب (Before &amp; After Comparison):**
  * في سجل وحركات نقل الموظف أو تعديل (الوظيفة / الفئة / موقع العمل / المشروع)، يجب عرض البيانات السابقة والجديدة جنباً إلى جنب:
    * **ما قبل التعديل (الحالة السابقة):** المشروع السابق - الوظيفة السابقة - الفئة السابقة.
    * **ما بعد التعديل (الحالة الحالية):** المشروع الجديد - الوظيفة الجديدة - الفئة الجديدة.
    * مع تاريخ النقل/التعديل وسبب النقل، وإبراز الاختلافات بلون مميز لسهولة التدقيق والمتابعة من قِبل إدارة الموارد البشرية.

---

### 4. تبويب التقارير وتصدير البيانات (Executive &amp; Operational BI Reports):
بناء وإعادة هيكلة قسم التقارير ليصبح لوحة معلومات استراتيجية وتشغيلية متكاملة تخدم القيادة العليا والإدارات التنفيذية:

#### أ) فلاتر التقارير العامة (Global Date &amp; Hierarchy Filter):
- شريط فلاتر زمني وهيكلي أعلى الشاشة يتيح استخراج أي تقرير عن **مدة زمنية محددة** (من تاريخ / إلى تاريخ)، مع إمكانية الفلترة حسب (المشروع / الإدارة / مدير القطاع).

#### ب) التقارير التشغيلية والتفصيلية المطلوبة:
1. **تقرير صرفيات المشروعات (صرفيات ذاتي vs مقاولين):**
   * تفنيد مالي يوضح إجمالي تكلفة العمالة الذاتية وتكلفة عمالة المقاولين لكل مشروع على حدة ومقارنتها بالموازنة التقديرية.
2. **تقرير الإدارات:** بيان إجمالي القوى العاملة والمصروفات موزعة حسب كل إدارة.
3. **تقرير المشروعات:** تفاصيل نسب إنجاز بنود المقايسة، التكلفة الفعلية للعمالة، ومطابقة السراكي لكل مشروع.
4. **تقرير مديري القطاعات:** تقرير تجميعي يوضح أداء وإنتاجية وتكاليف المشروعات التابعة لكل مدير قطاع.
5. **تقرير الحضور والانصراف التفصيلي:** معدلات الحضور، الغياب، التأخير، وساعات العمل الإضافية (السهر) موزعة لكل مشروع ولكل قطاع جغرافي.

#### ج) تقارير ومؤشرات القيادة العليا (Executive Dashboard &amp; KPIs):
- **الحفاظ على شريط أدوات التصدير:** (تصدير Excel بلون مميز، تصدير PDF، وربط Power Query).
- **بطاقات مؤشرات الأداء الاستراتيجية (Executive KPIs):**
  * تكلفة العمالة الفعلية مقابل الموازنة (Actual vs. Budget Variance).
  * نسبة الإنتاجية وتكلفة المتر المنفذ من المقايسة.
  * نسبة التزام مقاولي الباطن بمعدلات التوريد ونسب الحضور.
  * مؤشر الانضباط الرقمي ودقة التسجيل عبر مسح الـ QR.
- **بطاقة الأداء المتوازن (Balanced Scorecard):** الحفاظ على جدول بطاقة الأداء المتوازن (مالي - عمليات - مقاولون - نمو وتطوير) وربط قيمه الفعلية ديناميكياً بنتائج الفلاتر المسجلة.

---

### الضوابط التقنية والتنفيذية:
- الالتزام التام بالهوية البصرية الرسمية لشركة الشروق (Navy Blue #2B3080 &amp; Slate) وتنسيق الخطوط والأزرار بشكل راقٍ ومتباعد.
- الحفاظ على اللغة العربية وتوافق اتجاه الواجهة (RTL) بشكل مثالي.
- عدم كسر الـ State أو البيانات المخزنة محلياً في `localStorage`، وضمان ترابط شاشة السراكي مع تفنيد المقايسة وفئات المشروع.
- إخراج الكود بالكامل محدثاً داخل الـ Artifact ليعمل مباشرة بدون أخطاء.
</pasted_text>

<!-- The user explicitly selected the following skills for this project, as attachments to their message. These are not optional context — they define how you work. Use them. -->
<attached-skill name="Broadsheet (design system)">
[Design System] This project uses the **Broadsheet** design system. This is a binding choice for visual style — every visual must follow it. Don't invent colors, type, spacing, or components not grounded here.

Scope: the design system is a visual style reference only. Its guide may describe example products, brands, or people that are unrelated to the user and unrelated to the subject of this conversation. Never treat anything in the design system as a fact about the user, their work, or the topic they asked about.

This project has the **Broadsheet_broads** design system bound at `_ds/broadsheet-60b6b6f7-4da6-4861-a698-cdc2e96f33e5/`. If anything under that path is missing or fails to load, the folder name may differ — `list_files` `_ds/` and use the folder whose name ends with 60b6b6f7-4da6-4861-a698-cdc2e96f33e5 instead, including in the <link>/<script> paths below.

**Loading the bundle is how you use this design system.** Every Design Component you build must load `_ds/broadsheet-60b6b6f7-4da6-4861-a698-cdc2e96f33e5/_ds_bundle.js` in `<helmet>` (include it in child DCs too — de-duped by URL) and compose with its components — do not recreate those components from scratch or restyle raw HTML to look like them. At the top of the template:

```html
<helmet>
  <link rel="stylesheet" href="_ds/broadsheet-60b6b6f7-4da6-4861-a698-cdc2e96f33e5/styles.css">
  <script src="_ds/broadsheet-60b6b6f7-4da6-4861-a698-cdc2e96f33e5/_ds_bundle.js"></script>
</helmet>
```

Then mount any component directly in the template — no logic class needed:

```html
<x-import component-from-global-scope="Broadsheet_broads.Button" hint-size="auto,40px">Label</x-import>
```

Props are template attributes (kebab → camelCase); template children pass through as `props.children`. The linked stylesheet(s) carry the design tokens (colors, type, spacing) — style against those via `var(--*)` and the design system's classes rather than guessing values.

**Start from a template if one matches.** Before building from scratch, check whether a template below matches the user's request. Read the template (list its folder, `read_file` the entry) and decide: if it's close to what's asked, `copy_files` the folder as your starting point; if you'd rather re-author in DC, `dc_write` a new page using the template as your structural reference. When this design system is bound, `copy_files` repoints the copied `ds-base.js` automatically — only edit its base line yourself if the copy result says so, or when copying from an unbound project (change `'../..'` to your `_ds/broadsheet-60b6b6f7-4da6-4861-a698-cdc2e96f33e5` path). (Older templates have no `ds-base.js` and carry `../../…` bundle/stylesheet refs in their pages instead — repoint those by hand.)

- `Deck` (`/projects/60b6b6f7-4da6-4861-a698-cdc2e96f33e5/templates/deck/`) — A twenty-three-slide presentation starter: cover, contents, dividers, columns, quadrants, a data table, SVG charts, color-separation plates, bleed imagery, a quote and a close, on the theme's tokens
- `Landing` (`/projects/60b6b6f7-4da6-4861-a698-cdc2e96f33e5/templates/landing/`) — A one-page landing in the system's own voice — an invented product (Daybreak: a morning news digest), serif hero, dateline-and-index head, feature columns, plate-separated photograph, sign-up close

The full design-system source tree lives at `/projects/60b6b6f7-4da6-4861-a698-cdc2e96f33e5/` — use `list_files` / `read_file` from there for anything not under `_ds/` (layout varies by brand; don't assume folder names). Its guide is reproduced below so you don't need to fetch it:

<design-system-guide>
# Broadsheet design system

Broadsheet is newsprint set for the web: near-black Source Serif 4 on paper white, with the process accents — cyan and magenta, completed by a print yellow in the press treatments — used small and deliberately, like spot color. Page structure uses no boxes and no dividers between sections; hierarchy comes from the serif scale and from negative space alone. The one place rules print is as front-page furniture — the landing's thick-thin head pair around its dateline rail, in full-strength ink. Images print as their own misregistered process plates (interface imagery can take the simpler halftone dot screen).

## How to use this

- Link the one stylesheet from every page — `&lt;link rel="stylesheet" href="styles.css"&gt;` (adjust the relative path) — and take every color, font, spacing, radius and shadow from its variables (`var(--color-*)`, `var(--font-*)`, `var(--space-*)`, `var(--radius-*)`, `var(--shadow-*)`). Never hard-code a hex, a font name or a px value the tokens already carry.
- Build with the classes below rather than inventing parallel ones; the component pages are plain HTML, so view source and copy the markup.
- `templates/` holds starting points a consuming project can copy whole.
- The whole system was derived from `theme.json`. To change the look, edit the tokens at the top of `styles.css` — every page, the thumbnail and this guide read from them — and keep `theme.json` and the written guidance in step so they don't drift from what the CSS actually does.

## Direction

Left-aligned, asymmetric layouts. Flush-left headings; content hugs the left edge with whitespace on the right. Photographs take the print treatments: `.cmyk` prints an image as its four misregistered process plates (the showcase treatment — decks use it throughout), and `.halftone` is the simpler newsprint dot-screen for interface imagery. In decks, section dividers are the press sheet's proof margin — the page stays paper (this system shows no dark surfaces) and the break is carried by press furniture: a field of misregistered process halftone screens off the right of the sheet, the `.cmyk-num` plate numeral, the ten-step black-and-white wedge, the eight-patch color scale and a star target. Most slides anchor their first ink to one shared top-left spot, and true registration targets sit at the sheet edges.

## Color

A light ground (`--color-bg` #f3f2f2) with `--color-text` #201e1d and two accents — `--color-accent` #0088b0 and `--color-accent-2` #d6006c. Each role carries a 100–900 tonal ramp (`--color-neutral-100` … `--color-accent-2-900`) generated in OKLCH on a shared perceptual lightness scale, so the same step of any ramp has the same visual weight. Use the light steps (100–300) for tinted fills, hovers and subtle borders, 500 as the role's base, and the dark steps (700–900) for text on tinted fills and for pressed states; prefer ramp steps over ad-hoc `color-mix()`. For elevation use `--shadow-sm/md/lg` (already tuned to the ground) rather than ad-hoc box-shadows.

## Type

Source Serif 4 for headings over Source Serif 4 for body text, loaded as `--font-heading` / `--font-body`, with the true italic loaded at the body weight — pull quotes and emphasis take the serif's italic voice, never a synthesized oblique. Density 1.25× and radius 2px are already baked into the `--space-*` / `--radius-*` scales — use the variables, not raw numbers.

## Icons

Use Phosphor icons (https://phosphoricons.com), in the duotone weight throughout.

## Interaction states

Interactive states are themed, never browser defaults: give every interactive element a `:hover` tint and a pressed state from the accent ramp (one step past the base — `--color-accent-600` on a light ground, `--color-accent-400` on a dark one, or a `color-mix()` tint for outlined/ghost variants), and style keyboard focus with `:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }` — never leave the default blue focus ring.

## Components

| Class | What it is | Shown in |
| --- | --- | --- |
| `.btn` with `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-icon`, `.btn-block` | Actions — the primary is a solid accent fill | components/buttons.html |
| `.tag` with `.tag-accent`, `.tag-accent-2`, `.tag-neutral`, `.tag-outline` | Small labels tinted from the ramps | components/buttons.html |
| `.field` + `label`, `.input`, `.radio` + `.dot`, `.seg` + `.seg-opt` | Form fields and choices on native elements — no script | components/forms.html |
| `.card` with `.card-kicker`, `.card-title`, `.card-body`, `.card-meta`; `.elev-sm/md/lg` | Surface-filled content cards; elevation utilities | components/cards.html |
| `.nav` + `.nav-brand` | The header bar | components/navigation.html |
| `.table` | Data tables with themed header and row rules | components/table.html |
| `.dialog-backdrop` + `.dialog` (+ `.dialog-title/-body/-actions`) | A modal at the top elevation | components/dialog.html |
| `.hr` | A horizontal rule — present, but this system prefers whitespace; avoid it | — |
| `.cmyk` | The showcase image treatment — a photograph printed as its four misregistered process plates (decks use it throughout; the filter defs ship in `print-plates.js`, inlined in the compiled bundle template pages load — other pages add the one script tag beside the stylesheet) | foundations/image.html |
| `.cmyk-num` | Display figures as misregistered process plates over the white of the sheet | templates/deck/Deck.dc.html |
| `.halftone` | The simpler newsprint dot-screen, for interface imagery | foundations/image.html |

States are built in: hovers and pressed states come from the accent ramp, keyboard focus is the 2px accent `:focus-visible` ring, `::selection` is an accent tint, and disabled controls drop to 45% opacity. Don't restyle them per page. The accent-to-ground pair is tuned to at least 3:1 — enough for icons, large text and interface chrome, not for body copy — so for paragraph-size text in the accent use a deep ramp step (`--color-accent-700` on this ground) rather than the accent itself.

## Do

- Separate sections with whitespace, not dividers or cards.
- Set everything in the serif; let size, weight and measure do the organising.
- Use cyan for interactive elements and magenta as the rarer second spot color.
- Print photographs as their process plates with `.cmyk` (interface imagery can take the simpler `.halftone` dot screen).

## Don't

- Do not structure the page with rules, borders or boxes — the page is an open broadsheet. Reserve `.card` (the one boxed component) for genuinely discrete items such as listings, never for layout.
- Do not use both accents in the same small component.
- Do not tighten the airy spacing scale (density 1.25×).
- Do not introduce a sans-serif for UI chrome; the serif is the chrome.

## Files

- `styles.css` — the only stylesheet: the token sheet (`:root` variables, ramps, base type) plus the component layer. Link it from every page.
- `print-plates.js` — the separation filter defs (`#sep-c/m/y/k` and the compound `#sep-all`) that `.cmyk` prints with. Template pages get it through the compiled bundle (`_ds_bundle.js` inlines it); a page that links `styles.css` directly adds `&lt;script src="print-plates.js"&gt;&lt;/script&gt;` beside the stylesheet.
- `readme.md` — this guide.
- `theme.json` — the parameters these files were derived from (a machine-readable record of the theme).
- `thumbnail.html` — the project cover (brand mark + swatches).
- `foundations/type.html` — the type scale and the heading/body pairing at real sizes.
- `foundations/color.html` — color roles and the 100-900 tonal ramps, with usage notes.
- `foundations/layout.html` — the spacing scale, the grid and how edges are drawn.
- `foundations/icons.html` — the icon set at interface sizes, inline and in buttons.
- `foundations/image.html` — how photographs and figures are treated.
- `components/buttons.html` — buttons, icon buttons and tags in every variant and state.
- `components/forms.html` — text fields, radios and the segmented control on native elements.
- `components/cards.html` — content cards and the elevation steps.
- `components/navigation.html` — the header bar pattern.
- `components/table.html` — a data table with the themed header and row rules.
- `components/dialog.html` — a modal over its backdrop at the top elevation.
- `theme.html` — the theme's parameters rendered as a reference sheet.
- `templates/landing/` — a starter page consuming the system the intended way (`index.html`, its `ds-base.js` loader, and the vendored `image-slot.js` its photograph mounts).

</design-system-guide>
</attached-skill>

<attached-skill name="Design System (design system)">
[Design System] This project uses the **Design System** design system. This is a binding choice for visual style — every visual must follow it. Don't invent colors, type, spacing, or components not grounded here.

Scope: the design system is a visual style reference only. Its guide may describe example products, brands, or people that are unrelated to the user and unrelated to the subject of this conversation. Never treat anything in the design system as a fact about the user, their work, or the topic they asked about.

    Explore it to find what you need:
    - Always copy out the fonts and colors you need
    - For prototypes and designs, always copy out any relevant components
    - If the design system contains existing mocks of products, and you were asked to design or prototype something similar, copy and fork those mocks to start your design. This helps you make high-quality designs.

    Explore it quickly to find relevant UI kits (e.g. mocks of existing products you can copy and fork)

Full system at `/projects/01691580-510c-424b-8503-a3bd5a5f320b/`. Before producing any visuals, explore it: call `list_files("/projects/01691580-510c-424b-8503-a3bd5a5f320b/")` to see the structure, then `read_file` the README/base.md or whatever index file it has. Don't guess at the design system's contents.

CSS tokens: the guide may describe tokens in prose, but the exact `--*` names are defined in the design system's stylesheet(s). Before writing any `var(--*)`, look up the real name in the design system's `.css` files (`list_files` + `read_file` under `/projects/01691580-510c-424b-8503-a3bd5a5f320b/`). Never guess a token name — an unresolved `var()` silently falls back to the browser default.

For assets and UI kits beyond the guide: `read_file("/projects/01691580-510c-424b-8503-a3bd5a5f320b/<path>")` and `copy_files` to bring them into the current project.
</attached-skill>

<attached-skill name="Design System (design system)">
[Design System] This project uses the **Design System** design system. This is a binding choice for visual style — every visual must follow it. Don't invent colors, type, spacing, or components not grounded here.

Scope: the design system is a visual style reference only. Its guide may describe example products, brands, or people that are unrelated to the user and unrelated to the subject of this conversation. Never treat anything in the design system as a fact about the user, their work, or the topic they asked about.

    Explore it to find what you need:
    - Always copy out the fonts and colors you need
    - For prototypes and designs, always copy out any relevant components
    - If the design system contains existing mocks of products, and you were asked to design or prototype something similar, copy and fork those mocks to start your design. This helps you make high-quality designs.

    Explore it quickly to find relevant UI kits (e.g. mocks of existing products you can copy and fork)

Full system at `/projects/b768485e-3ecb-4725-afdd-be42a875334c/`. Before producing any visuals, explore it: call `list_files("/projects/b768485e-3ecb-4725-afdd-be42a875334c/")` to see the structure, then `read_file` the README/base.md or whatever index file it has. Don't guess at the design system's contents.

CSS tokens: the guide may describe tokens in prose, but the exact `--*` names are defined in the design system's stylesheet(s). Before writing any `var(--*)`, look up the real name in the design system's `.css` files (`list_files` + `read_file` under `/projects/b768485e-3ecb-4725-afdd-be42a875334c/`). Never guess a token name — an unresolved `var()` silently falls back to the browser default.

For assets and UI kits beyond the guide: `read_file("/projects/b768485e-3ecb-4725-afdd-be42a875334c/<path>")` and `copy_files` to bring them into the current project.
</attached-skill>

## Assistant

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: run_script]_

_[tool: show_html]_

_[tool: multi_screenshot]_

_[tool: get_webview_logs]_

_[tool: run_script]_

_[tool: multi_screenshot]_

_[tool: multi_screenshot]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

I've made all four sets of changes in `EADRS-Prototype.dc.html`. The three changed screens load (Saraks, reports, QR), and a full check is still running. I haven't tried a real barcode scanner.

**1. QR code**
- The card is redesigned: the full company name sits on the right with the logo top-left, and a navy double line runs under them.
- Below that: the worker's name, the job shown clearly in a navy badge, then code, contractor, project and national ID. The category is gone.
- You can choose between two QR formats on the screen:
  - **متوافق مع السكانر (default):** digits only, for example `14710001-205-4821` (worker code, job code, check number). This reads correctly on any scanner, even on a computer with an Arabic keyboard. Scanners that type like a keyboard can turn English letters into Arabic ones, so the format avoids letters entirely.
  - **نصي + اسم الوظيفة:** writes the job name in Arabic. Good for phones, but some USB scanners may garble it.
- Either way, the scan screen reads the worker code from the start.
- Because the check number is now digits only, codes on cards printed earlier will change, so reprint them.

**2. Saraks and matching**
- Every column now has a filter in its header: a search box for code, worker and work description, and a dropdown for the rest, including project, contractor and BOQ item.
- There's a button to clear all filters, and a row count. The list shows 100 rows per page.
- Saraks entered on the "إضافة بيانات عمل سركي" screen now appear here too, with a match status checked against the attendance scans.
- Shift names now say which shift it is (الوردية الصباحية / المسائية / الليلية) plus the shift's name and times. The Sarak print uses the same names.

**3. Transfers**
- The history now shows two columns side by side: before (red tint) and after (navy tint). Each covers project, job, category and department.
- Changed fields are highlighted, alongside the transfer date and reason.
- Transfers made before this update don't have the "before" values saved. Only project will show a before value for those; the other fields show "—".

**4. Reports**
- New filter bar: from and to dates, project, department and sector manager.
- Four headline cards, each of which can be hidden:
  - Actual labour cost against budget
  - Cost per unit of BOQ work done, and productivity
  - Subcontractor attendance
  - Scan accuracy
- The Balanced Scorecard now also shows whether each target was met, and it follows the filters.
- Five reports, one tab each: project spending (own workers vs. contractors, against budget), departments, projects, sector managers, and detailed attendance by project and by region.
- Excel export saves whichever report tab is open.

**How the numbers are worked out**
- Cost = days actually present on the scans × job grade value + overtime hours × (day rate ÷ 8).
- Late means arriving after 08:15, or after 07:15 for security staff.
- The budget comes from each project's BOQ items. Until a project has BOQ items, the budget comparison shows "no data".

The standalone offline file still needs rebuilding after the check.

## User

Save as standalone HTML: `EADRS-Prototype.dc.html`

## Assistant

_[tool: grep]_

_[tool: grep]_

Same recipe as before: copy the prototype to the export source, re-apply the resource hooks, and bundle.

_[tool: run_script]_

_[tool: super_inline_html]_

Those two are runtime-generated (QR images and uploaded BoQ preview) — expected.

_[tool: show_html]_

_[tool: sleep]_

_[tool: get_webview_logs]_

_[tool: present_fs_item_for_download]_

The offline file is ready to download: `نظام العمالة غير المنتظمة - الشروق للمقاولات.html` (1.5 MB). It includes all the latest changes, and it opened with no errors. I only checked that it loads; I didn't click through the screens.

Two images are made while the system runs, so they can't be built into the file: the QR codes and the preview of an uploaded BoQ. Both still work normally offline.

