/* Online bridge — runs only when the page is served by the platform server (window.OD_ONLINE is injected).
   1) Locks role/identity to the signed-in account (server enforces scope; the UI follows it).
   2) Syncs the shared state: item-level diffs → POST /api/state/ops; merges what the server returns.
   3) Adds admin screens: users & access, company data import, server audit log. */
(()=>{
const B=window.OD_ONLINE,R=window.ODStateRules;if(!B||!R)return;
const user=B.user,KEY='od-suite-local';
const ROLE_AR={super_admin:'المسؤول العام',od_admin:'مسؤول التطوير التنظيمي',hrbp:'شريك الموارد البشرية',line_manager:'المدير المباشر',site_manager:'مدير الموقع',assessor:'المقيّم',employee:'الموظف',top_management:'الإدارة العليا — قراءة فقط'};
const isAdmin=['super_admin','od_admin'].includes(user.role);
const clone=v=>JSON.parse(JSON.stringify(v));
const lang=()=>localStorage.getItem('od.language')||'ar',t=(ar,en)=>lang()==='ar'?ar:(en||ar);
document.documentElement.classList.add('od-online');

/* ---------- storage guard ---------- */
const nativeSet=Storage.prototype.setItem;let silent=false;
Storage.prototype.setItem=function(k,v){
 if(this===localStorage&&k==='od.previewRole'&&v!==user.role)v=user.role;
 nativeSet.call(this,k,v);
 if(this===localStorage&&k===KEY&&!silent)schedule();
};
const writeLocal=doc=>{silent=true;try{localStorage.setItem(KEY,JSON.stringify(doc))}finally{silent=false}};

/* ---------- diff ---------- */
const readable=path=>{const r=R.rule(path);if(r.kind==='local')return false;if(r.read&&!r.read.includes(user.role))return false;if(r.kind==='append'&&!isAdmin)return false;return true};
function diff(base,doc){
 const ops=[],all=new Set([...R.paths(base),...R.paths(doc)]);
 for(const path of all){const r=R.rule(path);if(r.kind==='local')continue;const a=R.get(base,path),b=R.get(doc,path);if(b===undefined)continue;
  if(r.kind==='value'){if(a===undefined)ops.push({path,set:b});continue}
  if(Array.isArray(b)){const A=new Map((Array.isArray(a)?a:[]).map(i=>[R.keyOf(path,i),R.stable(i)]));const Bm=new Map();const upsert=[];for(const item of b){const k=R.keyOf(path,item),s=R.stable(item);Bm.set(k,1);if(A.get(k)!==s)upsert.push(item)}const del=r.kind==='append'?[]:[...A.keys()].filter(k=>!Bm.has(k));if(upsert.length||del.length||a===undefined)ops.push({path,upsert,delete:del});continue}
  if(b&&typeof b==='object'){const ao=a&&typeof a==='object'?a:{};const setKeys={},deleteKeys=[];for(const [k,v] of Object.entries(b))if(R.stable(ao[k])!==R.stable(v))setKeys[k]=v;for(const k of Object.keys(ao))if(!(k in b))deleteKeys.push(k);if(Object.keys(setKeys).length||deleteKeys.length)ops.push({path,setKeys,deleteKeys});continue}
  if(R.stable(a)!==R.stable(b))ops.push({path,set:b});
 }
 return ops}
/* keep this browser's copies of local-only and non-readable collections (e.g. audit trails the role can append to but not read) */
function withLocal(view,doc){const out=clone(view);for(const path of new Set([...R.paths(doc),...R.paths(view)])){if(readable(path))continue;const v=R.get(doc,path);if(v===undefined)continue;const ks=path.split('.');let o=out;for(let i=0;i<ks.length-1;i++){o[ks[i]]??={};o=o[ks[i]]}o[ks.at(-1)]=v}return out}

/* ---------- sync ---------- */
let base=withLocal(B.state,JSON.parse(localStorage.getItem(KEY)||'{}')),version=B.version,timer=null,inflight=false,again=false,failures=0;
const status=document.createElement('div');status.className='od-sync';status.setAttribute('role','status');
function setStatus(kind,text){status.dataset.kind=kind;status.textContent=text}
setStatus('ok',t('متصل · محفوظ على الخادم','Online · saved'));
function schedule(){clearTimeout(timer);setStatus('pending',t('جارٍ الحفظ…','Saving…'));timer=setTimeout(sync,500)}
async function sync(){
 if(inflight){again=true;return}
 let doc;try{doc=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return}
 const ops=diff(base,doc);if(!ops.length){setStatus('ok',t('متصل · محفوظ على الخادم','Online · saved'));return}
 inflight=true;
 try{const res=await fetch('/api/state/ops',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({ops})});
  if(res.status===401){location.href='/login';return}
  const j=await res.json();if(!res.ok)throw Error(j.error||res.status);
  failures=0;version=j.version;const merged=withLocal(j.view,doc);base=clone(merged);
  const changed=R.stable(merged)!==R.stable(doc);writeLocal(merged);if(changed)applyToApp(merged);
  if(j.rejected?.length){setStatus('warn',t(`حُفظ ${j.applied} وتعذّر حفظ ${j.rejected.length} تغيير خارج صلاحياتك`,`${j.applied} saved, ${j.rejected.length} rejected (permissions)`));console.warn('[sync] rejected',j.rejected)}
  else setStatus('ok',t('متصل · محفوظ على الخادم','Online · saved'));
 }catch(e){failures++;setStatus('error',t('تعذر الحفظ — سيُعاد المحاولة تلقائيًا','Save failed — retrying'));clearTimeout(timer);timer=setTimeout(sync,Math.min(30000,2000*2**failures))}
 finally{inflight=false;if(again){again=false;schedule()}}
}
function applyToApp(doc){const A=window.ODLocal;if(!A)return;for(const k of Object.keys(doc))A.state[k]=doc[k];try{A.rebuild?.()}catch{}const active=document.activeElement;if(active&&/INPUT|TEXTAREA|SELECT/.test(active.tagName)&&active.closest('.portal-content'))return;A.draw?.()}
/* pull others' changes while idle */
async function pull(){if(inflight||timer&&status.dataset.kind==='pending'||document.hidden)return;try{const res=await fetch('/api/state',{credentials:'same-origin'});if(res.status===401){location.href='/login';return}const j=await res.json();if(j.version===version)return;const doc=JSON.parse(localStorage.getItem(KEY)||'{}');if(diff(base,doc).length)return;version=j.version;const merged=withLocal(j.view,doc);base=clone(merged);writeLocal(merged);applyToApp(merged)}catch{}}
setInterval(pull,45000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)pull()});
addEventListener('beforeunload',e=>{if(status.dataset.kind==='pending'||status.dataset.kind==='error'){e.preventDefault();e.returnValue=''}});

/* ---------- identity lock + account controls ---------- */
const identityValue=user.employee_code?String(user.employee_code):'user:'+user.email;
function lock(){const A=window.ODLocal;if(!A)return;const id=A.identity;if(![...id.options].some(o=>o.value===identityValue))id.add(new Option(user.name||user.email,identityValue),0);if(id.value!==identityValue)id.value=identityValue;id.disabled=true}
const wait=setInterval(()=>{const A=window.ODLocal;if(!A||!A.employees.length||!A.identity.options.length)return;clearInterval(wait);lock();new MutationObserver(lock).observe(A.identity,{childList:true});A.draw();mountAccount()},120);
function mountAccount(){const footer=document.querySelector('.side-footer');const box=document.createElement('div');box.className='od-account';const who=document.createElement('div');who.className='od-who';who.innerHTML='';const n=document.createElement('strong');n.textContent=user.name||user.email;const r=document.createElement('span');r.textContent=ROLE_AR[user.role]+' · '+user.email;who.append(n,r);const pw=document.createElement('a');pw.href='/change-password';pw.textContent=t('تغيير كلمة المرور','Change password');const out=document.createElement('button');out.type='button';out.textContent=t('تسجيل الخروج','Sign out');out.onclick=async()=>{if(status.dataset.kind==='pending')await sync();await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin'});localStorage.removeItem(KEY);location.href='/'};box.append(who,status,pw,out);(footer||document.body).append(box);const note=document.querySelector('.local-notice');if(note){const text=()=>t('منصة التطوير المؤسسي لمجموعة دار — البيانات محفوظة على الخادم ومتاحة حسب صلاحيات حسابك.','Dar Group OD platform — data is stored on the server and shown according to your account permissions.');const fix=()=>{if(note.textContent!==text())note.textContent=text()};fix();note.classList.add('od-online-note');new MutationObserver(fix).observe(note,{childList:true,characterData:true,subtree:true})}}

/* ---------- admin screens ---------- */
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined&&text!==null)e.textContent=text;return e};
const btn=(label,fn,cls,parent)=>{const b=el('button',cls,label);b.type='button';b.onclick=fn;if(parent)parent.append(b);return b};
const content=()=>window.ODLocal.content;
async function api(url,opt={}){const res=await fetch(url,{credentials:'same-origin',...opt,headers:{...(opt.json?{'Content-Type':'application/json'}:{}),...(opt.headers||{})},body:opt.json?JSON.stringify(opt.json):opt.body});const j=await res.json().catch(()=>({}));if(!res.ok)throw Error(j.error||('HTTP '+res.status));return j}
function table(rows,cols,parent){const w=el('div','tablewrap ac-table'),tb=el('table'),hr=el('tr');cols.forEach(c=>hr.append(el('th',undefined,c[1])));const h=el('thead');h.append(hr);tb.append(h);const b=el('tbody');rows.forEach(r=>{const tr=el('tr');cols.forEach(([k,,fn])=>{const td=el('td');const v=fn?fn(r):r[k];if(v instanceof Node)td.append(v);else td.textContent=v??'—';tr.append(td)});b.append(tr)});tb.append(b);w.append(tb);parent.append(w)}
function modal(title,build){const d=el('dialog','ac-dialog');const head=el('div','ac-dialog-head');head.append(el('h3',undefined,title));btn('×',()=>{d.close();d.remove()},'ac-x',head);const body=el('div','ac-dialog-body');d.append(head,body);document.body.append(d);build(body,()=>{d.close();d.remove()});d.showModal()}
function field(label,control){const l=el('label','ac-field');l.append(el('span',undefined,label),control);return l}
const companies=()=>(data['الشركات']||[]).map(c=>[c.company_code,(c.company_ar||'').trim()+(c.country&&c.country!=='مصر'?' — '+c.country:'')]);
function showSecret(pw,email){modal(t('كلمة مرور مؤقتة','Temporary password'),(b,close)=>{b.append(el('p',undefined,t(`سلّمها لصاحب الحساب ${email} بطريقة آمنة. ستظهر مرة واحدة فقط، وسيُطلب تغييرها عند أول دخول.`,`Give it to ${email} securely. Shown once; must be changed at first sign-in.`)));const code=el('code','od-secret',pw);b.append(code);const a=el('div','ac-actions');btn(t('نسخ','Copy'),()=>navigator.clipboard?.writeText(pw),'',a);btn(t('تم','Done'),()=>{close();window.ODLocal.draw()},'primary',a);b.append(a)})}
function userForm(existing){modal(existing?t('تعديل حساب ','Edit ')+existing.email:t('حساب جديد','New account'),(b,close)=>{
 const email=el('input');email.type='email';email.value=existing?.email||'';email.disabled=!!existing;const name=el('input');name.value=existing?.name||'';
 const role=el('select');Object.entries(ROLE_AR).filter(([k])=>user.role==='super_admin'||k!=='super_admin').forEach(([k,v])=>role.add(new Option(v,k)));role.value=existing?.role||'employee';
 const cos=el('select');cos.multiple=true;cos.size=7;if(user.role==='super_admin')cos.add(new Option(t('كل الشركات (المجموعة)','All companies (group)'),'*'));companies().forEach(([k,v])=>cos.add(new Option(v,k)));[...cos.options].forEach(o=>o.selected=(existing?.companies||user.companies.slice(0,1)).includes(o.value));
 const q=el('input');q.placeholder=t('ابحث بالاسم أو الكود…','Search name or code…');const emp=el('select');const fill=()=>{emp.replaceChildren(new Option(t('— بدون ربط —','— not linked —'),''));const v=q.value.trim();window.ODLocal.employees.filter(e=>!v||String(e.employee_code+' '+e.employee_ar).includes(v)).slice(0,300).forEach(e=>emp.add(new Option(e.employee_code+' — '+e.employee_ar,String(e.employee_code))));if(existing?.employee_code&&![...emp.options].some(o=>o.value===existing.employee_code))emp.add(new Option(existing.employee_code,existing.employee_code));emp.value=existing?.employee_code||''};q.oninput=fill;fill();
 const grid=el('div','ac-form-grid');grid.append(field(t('البريد','Email'),email),field(t('الاسم','Name'),name),field(t('الدور','Role'),role),field(t('الشركات (Ctrl للتعدد)','Companies'),cos));const ew=el('div','as-stack');ew.append(q,emp);grid.append(field(t('الموظف المرتبط (مطلوب للموظف والمدير)','Linked employee'),ew));b.append(grid);
 const active=el('input');active.type='checkbox';active.checked=existing?existing.active:true;if(existing){const l=el('label','ac-check');l.append(active,el('span',undefined,t('الحساب نشط','Active')));b.append(l)}
 const err=el('p','form-error');b.append(err);const a=el('div','ac-actions');
 btn(t('حفظ','Save'),async()=>{try{const payload={name:name.value,role:role.value,companies:[...cos.selectedOptions].map(o=>o.value),employee_code:emp.value||null};if(existing){payload.active=active.checked;await api('/api/admin/users/'+existing.id,{method:'PATCH',json:payload});close();window.ODLocal.draw()}else{const r=await api('/api/admin/users',{method:'POST',json:{...payload,email:email.value}});close();showSecret(r.temporary_password,email.value)}}catch(e){err.textContent=e.message}},'primary',a);
 if(existing)btn(t('إعادة تعيين كلمة المرور','Reset password'),async()=>{try{const r=await api('/api/admin/users/'+existing.id,{method:'PATCH',json:{reset_password:true}});close();showSecret(r.temporary_password,existing.email)}catch(e){err.textContent=e.message}},'',a);
 b.append(a)})}
async function usersPage(){const c=content();const bar=el('div','ac-actions');btn(t('+ حساب جديد','+ New account'),()=>userForm(null),'primary',bar);c.append(el('p','shell-message',t('كل مستخدم يرى بيانات شركاته فقط، ونطاق الموظفين يحدده الدور: المدير يرى فريقه، والموظف يرى ملفه. الخادم يطبق ذلك على كل طلب.','Each user sees only their companies; the role sets the employee scope. Enforced by the server on every request.')),bar);const box=el('div');c.append(box);box.textContent=t('جارٍ التحميل…','Loading…');
 try{const {users}=await api('/api/admin/users');box.replaceChildren();table(users,[['email',t('البريد','Email')],['name',t('الاسم','Name')],['role',t('الدور','Role'),u=>ROLE_AR[u.role]||u.role],['companies',t('الشركات','Companies'),u=>u.companies.includes('*')?t('كل الشركات','All'):u.companies.join('، ')],['employee_code',t('الموظف','Employee'),u=>u.employee_code?u.employee_code+' — '+(window.ODLocal.employees.find(e=>String(e.employee_code)===u.employee_code)?.employee_ar||''):'—'],['active',t('الحالة','Status'),u=>{const s=el('span','ac-chip '+(u.active?'st-completed':'st-cancelled'),u.active?(u.must_change?t('نشط · ينتظر تغيير كلمة المرور','Active · must change password'):t('نشط','Active')):t('معطل','Disabled'));return s}],['last_login',t('آخر دخول','Last sign-in'),u=>u.last_login?new Date(u.last_login).toLocaleString('ar-EG'):'—'],['_',t('إجراء','Action'),u=>btn(t('تعديل','Edit'),()=>userForm(u),'ac-ghost')]],box)}catch(e){box.textContent=e.message}}
async function companyPage(){const c=content();c.append(el('p','shell-message',t('لكل شركة بياناتها المستقلة. نزّل القالب، املأ الشيتات المتاحة لديك (يمكن رفع جزء منها)، ثم ارفع الملف: تظهر الأخطاء والتحذيرات وأعداد السجلات قبل الاعتماد، ولا يُحفظ شيء إلا بعد موافقتك.','Each company has its own dataset. Download the template, fill what you have, upload: errors and counts are shown before you approve.')));const box=el('div','od-companies');c.append(box);box.textContent=t('جارٍ التحميل…','Loading…');
 try{const {companies:list}=await api('/api/admin/companies');box.replaceChildren();for(const co of list){const card=el('section','ac-panel od-company');const h=el('div','od-company-head');h.append(el('h3',undefined,(co.company_ar||'').trim()),el('code',undefined,co.company_code),el('span','muted',co.country||''));card.append(h);const total=Object.values(co.counts).reduce((a,b)=>a+b,0);const g=el('div','ac-kpis');[['الهيكل التنظيمي','وحدات'],['الوظائف','وظائف'],['المواقع الوظيفية','مواقع'],['الموظفون','موظفون'],['الوصف الوظيفي','أوصاف'],['الكفاءات','متطلبات جدارات']].forEach(([k,l])=>{const d=el('div','ac-kpi'+(co.counts[k]?'':' warn'));d.append(el('span',undefined,l),el('b',undefined,(co.counts[k]||0).toLocaleString('en-US')));g.append(d)});card.append(g);card.append(el('p','muted',total?t(`الإصدار ${co.version} · آخر تحديث ${co.updated_at?new Date(co.updated_at).toLocaleString('ar-EG'):'—'} · بواسطة ${co.updated_by||'—'}`,`Version ${co.version}`):t('لا توجد بيانات بعد لهذه الشركة.','No data yet.')));
  const a=el('div','ac-actions');const dl=el('a','od-link',t('تنزيل قالب الاستيراد','Download template'));dl.href='/api/admin/template.xlsx?company='+encodeURIComponent(co.company_code);a.append(dl);const file=el('input');file.type='file';file.accept='.xlsx';file.hidden=true;btn(t('رفع ملف الشركة (Excel)','Upload company workbook'),()=>file.click(),'primary',a);a.append(file);card.append(a);const out=el('div');card.append(out);
  file.onchange=async()=>{const f=file.files[0];if(!f)return;out.replaceChildren(el('p','muted',t('جارٍ قراءة الملف والتحقق…','Reading and validating…')));try{const r=await api(`/api/admin/companies/${co.company_code}/import`,{method:'POST',body:f,headers:{'Content-Type':'application/octet-stream'}});renderImport(out,r,co,f)}catch(e){out.replaceChildren(el('p','form-error',e.message))}};box.append(card)}}catch(e){box.textContent=e.message}}
function renderImport(out,r,co,f){out.replaceChildren();out.append(el('h4',undefined,r.ok?t('الملف سليم — راجع الأعداد ثم اعتمد','Valid — review and approve'):t('الملف به أخطاء — لم يُحفظ شيء','Errors — nothing saved')));table(Object.entries(r.counts).map(([k,v])=>({k,...v})),[['k',t('الشيت','Sheet')],['before',t('الحالي','Current')],['after',t('بعد الاستيراد','After')],['replaced',t('يُستبدل','Replaced'),x=>x.replaced?t('نعم','Yes'):t('لا — يبقى كما هو','No')]],out);if(r.errors.length){const ul=el('ul','od-errors');r.errors.forEach(e=>ul.append(el('li',undefined,e)));out.append(ul)}if(r.warnings.length){const ul=el('ul','od-warnings');r.warnings.forEach(e=>ul.append(el('li',undefined,e)));out.append(ul)}
 if(r.ok&&!r.committed){const a=el('div','ac-actions');btn(t('اعتماد الاستيراد وحفظه','Approve and save'),async()=>{try{const x=await api(`/api/admin/companies/${co.company_code}/import?commit=1`,{method:'POST',body:f,headers:{'Content-Type':'application/octet-stream'}});if(x.committed){out.replaceChildren(el('p','ac-ok',t('تم الحفظ. تُعاد تحميل المنصة لعرض البيانات الجديدة…','Saved. Reloading…')));setTimeout(()=>location.reload(),1200)}}catch(e){out.append(el('p','form-error',e.message))}},'primary',a);out.append(a)}}
async function auditPage(){const c=content();c.append(el('p','shell-message',t('سجل الخادم غير قابل للتعديل أو الحذف (محمي على مستوى قاعدة البيانات): الدخول والخروج، المحاولات الفاشلة، الحسابات، الاستيراد، وكل حفظ للبيانات.','Server log is append-only (database-enforced).')));const box=el('div');c.append(box);try{const {events}=await api('/api/admin/audit?limit=300');table(events,[['at',t('الوقت','Time'),e=>new Date(e.at).toLocaleString('ar-EG')],['email',t('المستخدم','User')],['role',t('الدور','Role'),e=>ROLE_AR[e.role]||e.role||'—'],['action',t('الحدث','Event')],['entity',t('العنصر','Entity')],['detail',t('التفاصيل','Detail'),e=>e.detail?JSON.stringify(e.detail).slice(0,160):'—'],['ip','IP']],box)}catch(e){box.textContent=e.message}}
const routes=[['/users','المستخدمون والدخول','Users & sign-in','Users','settings',['admin'],'online'],['/company-data','بيانات الشركات واستيرادها','Company data import','Settings2','settings',['admin'],'online'],['/server-audit','سجل الخادم','Server audit log','ScrollText','settings',['admin'],'online']];
function render(path){const pages={'/users':usersPage,'/company-data':companyPage,'/server-audit':auditPage};const fn=pages[path];if(!fn)return false;if(!isAdmin){content().append(el('p','empty',t('هذه الصفحة لمسؤولي المنصة.','Admins only.')));return true}fn();return true}
window.ODOnline={routes,render,user,sync,diff};
})();
