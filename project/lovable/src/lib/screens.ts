/**
 * سجل الشاشات — بنفس ترتيب القائمة الجانبية فى النموذج الأولى.
 * hero: رقم صورة الرأس من HERO_IMGS (نفس HERO_MAP فى النموذج).
 */
export interface Screen { key: string; path: string; icon: string; nav: string; title: string; hero: number }

export const SCREENS: Screen[] = [
  { key: 'dashboard',     path: '/',               icon: '🏠︀', nav: 'لوحة التحكم',                     title: 'لوحة التحكم الرئيسية',            hero: 0 },
  { key: 'analytics',     path: '/analytics',      icon: '📊︀', nav: 'تحليل الحضور والتنبّؤ',          title: 'تحليل الحضور والتنبّؤ',          hero: 4 },
  { key: 'workers',       path: '/workers',        icon: '👥︀', nav: 'العمال',                          title: 'العمال',                          hero: 2 },
  { key: 'barcodes',      path: '/barcodes',       icon: '▦︀',  nav: 'مولّد الباركود',                  title: 'مولّد الباركود',                  hero: 3 },
  { key: 'contractors',   path: '/contractors',    icon: '🏗︀', nav: 'المقاولون',                       title: 'المقاولون',                       hero: 1 },
  { key: 'professions',   path: '/professions',    icon: '🛠︀', nav: 'الوظائف ودرجات التقييم',         title: 'الوظائف ودرجات التقييم',         hero: 6 },
  { key: 'allowances',    path: '/allowances',     icon: '💰︀', nav: 'البدلات والمشروعات',             title: 'البدلات والمشروعات',             hero: 4 },
  { key: 'transfers',     path: '/transfers',      icon: '🔁︀', nav: 'نقل الموظفين والتاريخ الوظيفي', title: 'نقل الموظفين والتاريخ الوظيفي', hero: 1 },
  { key: 'jobChange',     path: '/job-change',     icon: '🧾︀', nav: 'تعديل وظائف العمال',             title: 'شاشة تعديل وظائف العمال',        hero: 6 },
  { key: 'shifts',        path: '/shifts',         icon: '🕒︀', nav: 'الورديات',                        title: 'الورديات',                        hero: 5 },
  { key: 'scan',          path: '/scan',           icon: '📷︀', nav: 'تسجيل الحضور (باركود)',          title: 'تسجيل الحضور — مراقب الموقع',    hero: 2 },
  { key: 'attendanceLog', path: '/attendance-log', icon: '🗓︀', nav: 'سجل الحضور الكامل',              title: 'سجل دخول وخروج العمال',          hero: 5 },
  { key: 'sarak',         path: '/sarak',          icon: '📋︀', nav: 'السراكي والمطابقة',              title: 'السراكي والمطابقة',              hero: 3 },
  { key: 'sarakWork',     path: '/sarak-work',     icon: '🧰︀', nav: 'اضافة بيانات عمل سركي',          title: 'إضافة بيانات عمل سركي',          hero: 1 },
  { key: 'sarakPrint',    path: '/sarak-print',    icon: '🖨︀', nav: 'طباعة مستخلص سركي',              title: 'طباعة مستخلص سركي',              hero: 0 },
  { key: 'dayTotals',     path: '/day-totals',     icon: '🧾︀', nav: 'تقرير إجمالي اليوميات',          title: 'تقرير إجمالي اليوميات',          hero: 2 },
  { key: 'alerts',        path: '/alerts',         icon: '⚠︀',  nav: 'التنبيهات',                       title: 'التنبيهات والاستثناءات',         hero: 5 },
  { key: 'projectSheet',  path: '/project-sheet',  icon: '🗂︀', nav: 'نموذج بيانات المشروع',           title: 'نموذج بيانات المشروع',           hero: 0 },
  { key: 'upload',        path: '/upload',         icon: '⬆︀',  nav: 'رفع بيانات وملفات',              title: 'رفع بيانات وملفات',              hero: 3 },
  { key: 'reports',       path: '/reports',        icon: '📈︀', nav: 'التقارير',                        title: 'التقارير',                        hero: 4 },
  { key: 'users',         path: '/users',          icon: '🔐︀', nav: 'المستخدمون والصلاحيات',          title: 'المستخدمون والصلاحيات',          hero: 0 },
];

export const HERO_IMGS = ['/assets/hero-building.png', '/assets/hero/h1.jpg', '/assets/hero/h2.jpg', '/assets/hero/h3.jpg', '/assets/hero/h4.jpg', '/assets/hero/h5.jpg', '/assets/hero/h6.jpg'];
export const HERO_POS = ['50% 40%', '50% 40%', '50% 45%', '50% 55%', '50% 50%', '40% 45%', '30% 50%'];

/** الشاشات الورقية (طباعة) لا تأخذ تنسيق main-screen ولا فلتر الرأس. */
export const SHEET_SCREENS = new Set(['sarakPrint', 'dayTotals', 'projectSheet', 'barcodes']);

export function screenForPath(pathname: string): Screen | undefined {
  return SCREENS.find(s => s.path === pathname);
}
