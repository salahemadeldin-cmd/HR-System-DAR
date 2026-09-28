# Implement notes

_Started 2026-09-23 11:35 UTC_

---

## User

Continuing from "إنشاء وتعديل الورديات".

## Assistant

We were building out the EADRS labor management system with 19 structural changes across jobs, workers, contractors, projects, and a new barcode screen. The goal was to support historical data tracking (with effective dates), proper allowance assignment, and stricter registration workflows.

Key decisions made:
- Jobs now store 5 grade levels (A–E) instead of job categories. Any grade change is logged with an effective date; the Sarakah always uses the value in force on each line's date.
- Workers can only edit personal data directly. Job, grade, project, and allowance changes happen exclusively through dated transfer orders, enforcing a strict workflow.
- Area allowance moved from BoQ to project level; workers receive it automatically on registration and transfer.
- Added a barcode screen (Code 39) for each worker; barcodes stay stable unless worker data or location changes.
- Contractors now have a tax checkbox, separate file uploads for ID/register/BoQs (each upload opens a slot for the next), and "عمالة ذاتي" is pinned at the top.
- Projects auto-increment their code, link site code to region, and allow multiple zones of work. Housing allowance is now a project field.

Current state: All 19 changes have been coded into `EADRS-Prototype.dc.html` and bundled into a standalone offline HTML file (`نظام العمالة غير المنتظمة - الشروق للمقاولات.html`). However, my preview tool has been frozen and unable to verify the page loads or runs. The packager reported two expected missing items (barcodes and image previews, both generated at runtime).

Open next step: You must test the page on your machine. Open the standalone file and walk through: worker form (department → job → project), the new barcode screen, and project form. If anything freezes or fails, report it and I'll isolate and remove features one at a time to find the cause.

Project files: `EADRS-Prototype.dc.html`, `EADRS-Schema.md`, `نظام العمالة غير المنتظمة - الشروق للمقاولات.html`

## User

Please Implement those notes

## Assistant

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: ready_for_verification]_

I've made all 10 changes in `EADRS-Prototype.dc.html`. A check is running in the background, and I haven't opened the screens myself yet.

**Export and reports**
1. Every screen now has Excel and PDF export buttons at the top. Excel takes the tables on the screen as it looks right now, filters applied. PDF opens the browser's print window, where you save the page as a PDF.
2. The attendance log has its own Excel and PDF buttons. The daily totals report and the project data form each have a button that exports to an Excel sheet.

**Sarak**
3. The "إضافة سرك جديد" card is removed from the sarak and matching page.
4. Sarak work data is now entered in a spreadsheet-style grid:
   - The first column is "بيان الأعمال", followed by "الكود".
   - You can add several codes to one work description: type a code and press Enter, or pick it from the list. Each code shows as a small tag you can remove with ×.
   - The job fills in automatically from the codes.
   - Enter or the up/down arrows move between rows, and pressing Enter on the last row adds a new one.
   - On save, each code becomes its own line under the same work description, so the printed statement and totals work as before.

**Printing and QR**
5. The finance-department print option is removed from both places. Every print now uses the technical-office form.
6. I redesigned the statement to match the company identity:
   - The company name is on the right, the title and period in the centre, and the logo on the left.
   - A double navy rule sits under the header, and the table headers are navy.
   - The footer now reads "مستند رسمي — شركة الشروق للمقاولات".
7. The barcode screen is now called "QR Code Generator":
   - It has filters for employee code, region, project and contractor.
   - Each card shows the company name on the right, then contractor, employee name, job and national ID below it. The generated code sits directly under the QR image.
   - I wrote the QR generator into the page itself, so it works offline. Scan-test one printed card with a phone before printing in bulk.

**Transfers and statistics**
8. The transfer form now shows the job, the grade and the grade value as separate fields. I also added an automatic "grade value after transfer" field.
9. The grade statistics table now lists each job with its grades and the number of workers on each. A job with more than one grade appears as one merged group showing its total grades and workers. The same worker counts are included in the Excel export.

**To note**
- On paged screens like the attendance log, Excel exports only the page currently shown.
- The standalone offline file doesn't include these changes yet. I'll regenerate it once you've reviewed the prototype.

## User

Save as standalone HTML: `EADRS-Prototype.dc.html`

## Assistant

_[tool: grep]_

_[tool: super_inline_html]_

Those two misses are runtime-generated (uploaded BoQ image preview and QR data URLs) — expected.

_[tool: present_fs_item_for_download]_

The standalone file (1.0 MB) is ready to download above and includes all 10 changes. I haven't opened it to check it yet.

The bundler flagged two items it couldn't pack: the QR images and the uploaded BoQ image preview. That's expected, because the page creates both while it runs, so they should still work offline.

