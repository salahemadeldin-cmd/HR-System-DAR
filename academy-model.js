/* Dar Academy — pure logic (no DOM). Loaded in the browser as window.ODAcademyModel and in Node tests via require().
   Principles kept from the Foundation phase:
   - A competency gap exists ONLY when a dated, evidenced measurement exists (no measurement ≠ level 0).
   - Automation proposes; humans approve. No rule enrolls, rates or decides employment matters on its own.
   - Every suggestion carries a readable "why" so managers can challenge it. */
(function(root,factory){const m=factory();if(typeof module==='object')module.exports=m;else root.ODAcademyModel=m})(typeof window==='object'?window:globalThis,()=>{
'use strict';
const DAY=86400000;
const day=v=>{if(!/^\d{4}-\d{2}-\d{2}/.test(String(v||'')))return null;const n=Date.parse(String(v).slice(0,10)+'T00:00:00Z');return Number.isFinite(n)?n:null};
const today=()=>new Date().toISOString().slice(0,10);
const addMonths=(date,m)=>{const d=new Date(String(date).slice(0,10)+'T00:00:00Z');d.setUTCMonth(d.getUTCMonth()+Number(m));return d.toISOString().slice(0,10)};
const diffDays=(a,b)=>{const x=day(a),y=day(b);return x===null||y===null?null:Math.round((x-y)/DAY)};

const STATUS={
 requested:['طلب ذاتي بانتظار المدير','Self-request — awaiting manager'],
 nominated:['مرشح — بانتظار اعتماد التدريب','Nominated — awaiting L&D approval'],
 approved:['معتمد','Approved'],
 enrolled:['مسجل في دفعة','Enrolled'],
 in_progress:['قيد التنفيذ','In progress'],
 completed:['مكتمل','Completed'],
 rejected:['مرفوض','Rejected'],
 cancelled:['ملغى','Cancelled']};
const OPEN=['requested','nominated','approved','enrolled','in_progress'];
const HR_ROLES=['super_admin','od_admin','hrbp'],MANAGER_ROLES=['line_manager','site_manager','hrbp','od_admin','super_admin'];

/* ---------- Catalog ---------- */
function mergeCatalog(base,edits=[],custom=[]){const map=new Map(base.map(c=>[c.code,{...c}]));for(const e of edits){if(map.has(e.code))map.set(e.code,{...map.get(e.code),...e})}for(const c of custom)map.set(c.code,{...c,custom:true});return [...map.values()].filter(c=>!c.archived)}
/* Availability for a job or department:
   1) category families (default) — '*' categories are open to all jobs;
   2) explicit mappings added by OD/L&D on job_code, org_code (inherited by child units) or family_code;
   3) explicit exclusions (kind:'exclude') win over defaults. */
function availableFor(course,ctx,categories,mappings=[]){
 const chain=new Set(ctx.orgChain||[]),hit=m=>m.course_code===course.code&&((m.job_code&&m.job_code===ctx.job_code)||(m.org_code&&chain.has(m.org_code))||(m.family_code&&m.family_code===ctx.family_code));
 if(mappings.some(m=>m.kind==='exclude'&&hit(m)))return {available:false};
 const explicit=mappings.find(m=>m.kind!=='exclude'&&hit(m));
 if(explicit)return {available:true,via:explicit.job_code?'job':explicit.org_code?'org':'family',kind:explicit.kind||'recommended'};
 if(course.mandatory==='all'||(course.mandatory==='site'&&ctx.site))return {available:true,via:'mandatory',kind:'mandatory'};
 const cat=categories.find(c=>c.code===course.category);if(!cat)return {available:!!course.custom,via:'custom'};
 if(!cat.families.length)return {available:true,via:'open'};
 return cat.families.includes(ctx.family_code)?{available:true,via:'family'}:{available:false};
}

/* ---------- Gaps & recommendations (Smart IDP) ---------- */
function latestMeasurement(measurements,employee,competency){return measurements.filter(m=>String(m.employee_code)===String(employee)&&m.competency_code===competency).sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.recorded||'').localeCompare(String(a.recorded||'')))[0]||null}
function gaps(requirements,measurements,employee){return requirements.map(r=>{const m=latestMeasurement(measurements,employee,r.competency_code),req=Number(r.required_level)||0;return {competency_code:r.competency_code,competency_name:r.competency_name,competency_type:r.competency_type,required:req,measured:m?Number(m.level):null,gap:m?Math.max(0,req-Number(m.level)):null,date:m?.date||null}})}
const LEVEL_RANK={basic:1,intermediate:2,advanced:3};
function levelFit(course,g){const want=g.measured===null?2:g.measured<=2?1:g.measured===3?2:3;return 10-Math.abs((LEVEL_RANK[course.level]||2)-want)*6}
function isValidCompletion(n,course,on=today()){if(n.status!=='completed')return false;if(!course?.validity_months)return true;const exp=n.completion?.expiry||addMonths(n.completion?.date||n.created,course.validity_months);return exp>=on}
/* returns [{course, why, competency_code, gap, score, bucket}] sorted by score */
function recommend({employee,ctx,requirements,measurements,courses,categories,mappings,nominations=[],appraisal=null,on=today(),limit=12}){
 const mine=nominations.filter(n=>String(n.employee_code)===String(employee)),blocked=new Set(mine.filter(n=>OPEN.includes(n.status)).map(n=>n.course_code));
 const done=new Set(mine.filter(n=>isValidCompletion(n,courses.find(c=>c.code===n.course_code),on)).map(n=>n.course_code));
 const avail=courses.map(c=>({c,a:availableFor(c,ctx,categories,mappings)})).filter(x=>x.a.available&&!blocked.has(x.c.code)&&!done.has(x.c.code));
 const out=new Map(),push=(c,score,why,extra)=>{const prev=out.get(c.code);if(!prev||prev.score<score)out.set(c.code,{course:c,score:Math.round(score),why,...extra})};
 const gs=gaps(requirements,measurements,employee);
 for(const {c,a} of avail){
  if(a.kind==='mandatory'){push(c,100,['إلزامي للوظيفة / الموقع ولم يُستكمل أو انتهت صلاحيته','Mandatory for the role/site and not completed or expired'],{bucket:'mandatory'});continue}
  for(const g of gs){if(!c.competencies?.includes(g.competency_code))continue;
   if(g.gap>0){const w=g.competency_type==='أساسية'?8:g.competency_type==='قيادية'?6:5;push(c,40+g.gap*15+w+levelFit(c,g)+(a.via==='job'||a.via==='org'?6:0)+(appraisal!==null&&appraisal<60?8:0),[`فجوة مقاسة ${g.gap} في «${g.competency_name}» (مطلوب ${g.required} / مقاس ${g.measured} بتاريخ ${g.date})`,`Measured gap ${g.gap} in ${g.competency_code} (required ${g.required} / assessed ${g.measured} on ${g.date})`],{bucket:'gap',competency_code:g.competency_code,gap:g.gap})}
   else if(g.gap===null)push(c,12+g.required*2+levelFit(c,g)/2,[`مرتبط بمتطلب «${g.competency_name}» للوظيفة (المستوى ${g.required}) — لم يُقَس بعد؛ يُنصح بالقياس أولًا`,`Linked to a role requirement (${g.competency_code} L${g.required}) — not yet assessed; assess first`],{bucket:'role',competency_code:g.competency_code,gap:null})}
 }
 return [...out.values()].sort((a,b)=>b.score-a.score||a.course.code.localeCompare(b.course.code)).slice(0,limit);
}
/* 70-20-10 companions for a gap: mentors (colleagues assessed ≥ required and ≥4) and an on-the-job assignment idea */
function mentors({competency_code,required,measurements,employees,exclude}){const best=new Map();for(const m of measurements){if(m.competency_code!==competency_code||String(m.employee_code)===String(exclude))continue;const prev=best.get(String(m.employee_code));if(!prev||String(m.date)>String(prev.date))best.set(String(m.employee_code),m)}return [...best.values()].filter(m=>Number(m.level)>=Math.max(4,Number(required)||0)).sort((a,b)=>b.level-a.level).slice(0,3).map(m=>({employee_code:m.employee_code,level:m.level,name:employees.find(e=>String(e.employee_code)===String(m.employee_code))?.employee_ar||m.employee_code}))}

/* ---------- Nomination workflow ---------- */
function nominate({employee_code,course,actor,reason,due,source='manager',competency_code=null,priority='normal',now=new Date().toISOString(),id}){
 if(!employee_code||!course?.code)throw Error('الموظف والكورس مطلوبان');
 if(!String(reason||'').trim())throw Error('سبب الترشيح مطلوب');
 if(due&&day(due)===null)throw Error('تاريخ الاستحقاق غير صالح');
 const self=String(actor.employee)===String(employee_code)&&actor.role==='employee';
 return {id:id||('N-'+Math.random().toString(36).slice(2,10)),employee_code:String(employee_code),course_code:course.code,course_title:course.title,source:self?'self':source,reason:String(reason).trim(),competency_code,priority,due:due||null,status:self?'requested':HR_ROLES.includes(actor.role)&&source==='manager'?'approved':'nominated',nominated_by:String(actor.employee||''),nominated_role:actor.role,created:now,history:[{action:'create',actor:String(actor.employee||''),role:actor.role,date:now}]};
}
const NEXT={requested:{endorse:'nominated',reject:'rejected',cancel:'cancelled'},nominated:{approve:'approved',reject:'rejected',cancel:'cancelled'},approved:{enroll:'enrolled',start:'in_progress',cancel:'cancelled'},enrolled:{start:'in_progress',complete:'completed',cancel:'cancelled'},in_progress:{complete:'completed',cancel:'cancelled'}};
function transition(n,action,actor,data={},now=new Date().toISOString()){
 const to=NEXT[n.status]?.[action];if(!to)throw Error('إجراء غير متاح في هذه الحالة');
 const isOwner=String(actor.employee)===String(n.employee_code);
 if(action==='endorse'&&!MANAGER_ROLES.includes(actor.role))throw Error('اعتماد الطلب الذاتي للمدير المباشر');
 if(action==='approve'&&!HR_ROLES.includes(actor.role))throw Error('الاعتماد لمسؤول التدريب / HR');
 if(['approve','endorse'].includes(action)&&String(actor.employee)===String(n.nominated_by))throw Error('لا يمكن اعتماد ترشيح أنشأته بنفسك');
 if(['approve','endorse'].includes(action)&&isOwner)throw Error('لا يمكن اعتماد ترشيحك بنفسك');
 if(['reject','cancel'].includes(action)&&!String(data.comment||'').trim())throw Error('التعليق مطلوب للرفض أو الإلغاء');
 const out=JSON.parse(JSON.stringify(n));
 if(action==='complete'){const d=data.date||now.slice(0,10);if(day(d)===null||d>now.slice(0,10))throw Error('تاريخ الإكمال غير صالح');if(data.score!==undefined&&data.score!==''&&(!(+data.score>=0)||+data.score>100))throw Error('الدرجة بين 0 و100');if(!isOwner&&!MANAGER_ROLES.includes(actor.role))throw Error('غير مصرح');out.completion={date:d,score:data.score===''||data.score===undefined?null:+data.score,evidence:String(data.evidence||'').trim()||null,expiry:data.validity_months?addMonths(d,data.validity_months):null,verified:!isOwner}}
 if(action==='enroll'&&data.session)out.session=data.session;
 out.status=to;out.history.push({action,actor:String(actor.employee||''),role:actor.role,comment:data.comment||null,date:now});return out}
function feedback(n,{rating,comment,applied},now=new Date().toISOString()){if(n.status!=='completed')throw Error('التقييم بعد الإكمال فقط');if(!Number.isInteger(+rating)||rating<1||rating>5)throw Error('التقييم من 1 إلى 5');return {...n,feedback:{rating:+rating,comment:String(comment||'').trim(),applied:!!applied,date:now}}}

/* ---------- Gamification ---------- */
const BADGES=[
 ['first','أول خطوة','First step','أكمل أول نشاط تعلم',(s)=>s.completed>=1],
 ['hours40','نادي الـ40 ساعة','40-hour club','40 ساعة تعلم مكتملة',(s)=>s.hours>=40],
 ['explorer','مستكشف','Explorer','أكمل في 3 مجالات مختلفة',(s)=>s.categories>=3],
 ['certified','شهادة مهنية','Certified','حصل على شهادة مهنية معتمدة',(s)=>s.certs>=1],
 ['safety','بطل السلامة','Safety champion','جميع متطلبات السلامة الإلزامية سارية',(s)=>s.safetyOk],
 ['ontime','الالتزام بالموعد','On time','3 أنشطة مكتملة قبل الموعد',(s)=>s.ontime>=3],
 ['voice','صوت المتعلم','Learner voice','قيّم 3 أنشطة بعد إكمالها',(s)=>s.feedbacks>=3],
 ['mentor','مرشد','Mentor','مسجل كمرشد لزميل',(s)=>s.mentoring>=1]];
function learnerStats(code,nominations,courses,on=today()){const mine=nominations.filter(n=>String(n.employee_code)===String(code)),done=mine.filter(n=>n.status==='completed'),c=k=>courses.find(x=>x.code===k);const mand=mine.filter(n=>c(n.course_code)?.mandatory);
 const s={completed:done.length,open:mine.filter(n=>OPEN.includes(n.status)).length,hours:done.reduce((a,n)=>a+(+c(n.course_code)?.hours||0),0),categories:new Set(done.map(n=>c(n.course_code)?.category)).size,certs:done.filter(n=>c(n.course_code)?.type==='certification').length,ontime:done.filter(n=>n.due&&n.completion?.date<=n.due).length,feedbacks:done.filter(n=>n.feedback).length,mentoring:nominations.filter(n=>String(n.mentor_code)===String(code)).length,safetyOk:mand.length>0&&mand.every(n=>isValidCompletion(n,c(n.course_code),on))};
 s.points=s.hours*2+s.completed*10+s.certs*100+s.ontime*15+s.feedbacks*5+s.mentoring*25;s.badges=BADGES.filter(b=>b[4](s)).map(b=>b[0]);s.level=s.points>=600?'خبير':s.points>=250?'متقدم':s.points>=80?'نشط':'مبتدئ';return s}

/* ---------- Predictive risk (explainable heuristic, not ML) ---------- */
function completionRisk(n,{employee,history=[],course,on=today()}){if(!OPEN.includes(n.status))return null;let score=0;const why=[];
 const toDue=n.due?diffDays(n.due,on):null;
 if(toDue!==null&&toDue<0){score+=45;why.push(`متأخر ${-toDue} يوم`)}
 else if(toDue!==null&&toDue<=14&&['nominated','approved','requested'].includes(n.status)){score+=30;why.push('الموعد خلال أسبوعين ولم يبدأ')}
 const age=diffDays(on,n.created);if(age>60&&['nominated','requested'].includes(n.status)){score+=15;why.push('ترشيح معلق أكثر من 60 يومًا')}
 const past=history.filter(h=>h.id!==n.id&&['completed','cancelled'].includes(h.status));if(past.length>=2){const rate=past.filter(h=>h.status==='cancelled').length/past.length;if(rate>=.5){score+=20;why.push('سجل إلغاء مرتفع للموظف')}}
 if(employee?.contract_end&&n.due&&employee.contract_end<n.due){score+=20;why.push('نهاية العقد قبل موعد التدريب')}
 if(course?.type==='certification'&&course.hours>=40){score+=5;why.push('شهادة طويلة')}
 score=Math.min(100,score);return {score,band:score>=60?'high':score>=30?'medium':'low',why}}

/* ---------- Automation rules (propose → human approves) ---------- */
const DEFAULT_RULES=[
 {id:'gap',enabled:true,ar:'فجوة جدارة مقاسة ≥ الحد',en:'Measured competency gap ≥ threshold',params:{threshold:2,perEmployee:2}},
 {id:'mandatory',enabled:true,ar:'التدريب الإلزامي (موقع / كل الموظفين) غير مستكمل — على دفعات',en:'Mandatory training missing — in waves',params:{maxPerRun:300}},
 {id:'expiry',enabled:true,ar:'شهادة / تصريح ينتهي خلال N يوم → تجديد',en:'Certification expiring within N days',params:{days:45}},
 {id:'appraisal',enabled:true,ar:'نتيجة تقييم أداء معتمدة أقل من الحد → خطة تطوير',en:'Approved appraisal below threshold → IDP',params:{threshold:60}},
 {id:'newhire',enabled:true,ar:'تعيين جديد خلال N يوم → مسار التهيئة',en:'New hire within N days → onboarding path',params:{days:90}},
 {id:'overdue',enabled:true,ar:'ترشيح متأخر → تنبيه المدير وشريك HR',en:'Overdue nomination → alert manager & HRBP',params:{}},
 {id:'reassess',enabled:true,ar:'إكمال نشاط مرتبط بجدارة → طلب إعادة قياس بعد N يوم',en:'Completion → re-assessment after N days',params:{days:30}}];
function runRules({rules,people,ctxOf,reqOf,measurements,courses,categories,mappings,nominations,appraisalOf,on=today()}){
 const actions=[],R=id=>rules.find(r=>r.id===id&&r.enabled),openKey=new Set(nominations.filter(n=>OPEN.includes(n.status)).map(n=>n.employee_code+'|'+n.course_code));
 const add=(a)=>{if(a.type==='nominate'){const k=a.employee_code+'|'+a.course.code;if(openKey.has(k))return;openKey.add(k)}actions.push(a)};
 const courseOf=k=>courses.find(c=>c.code===k);
 for(const e of people){const code=String(e.employee_code),ctx=ctxOf(e);if(!ctx)continue;
  if(R('mandatory')){for(const c of courses.filter(c=>c.mandatory)){if(actions.filter(x=>x.rule==='mandatory').length>=(R('mandatory').params.maxPerRun||Infinity))break;if(!availableFor(c,ctx,categories,mappings).available)continue;const has=nominations.some(n=>n.employee_code===code&&n.course_code===c.code&&(OPEN.includes(n.status)||isValidCompletion(n,c,on)));if(!has)add({type:'nominate',rule:'mandatory',employee_code:code,course:c,reason:'تدريب إلزامي غير مستكمل — قاعدة آلية',priority:'high',due:addDays(on,30)})}}
  if(R('newhire')&&e.hire_date&&diffDays(on,e.hire_date)!==null&&diffDays(on,e.hire_date)<=R('newhire').params.days&&diffDays(on,e.hire_date)>=0){for(const c of courses.filter(c=>c.mandatory))if(availableFor(c,ctx,categories,mappings).available)add({type:'nominate',rule:'newhire',employee_code:code,course:c,reason:'مسار التهيئة للتعيين الجديد',priority:'high',due:addDays(e.hire_date.slice(0,10),30)})}
  const reqs=(R('gap')||R('appraisal'))?reqOf(ctx.job_code):[];
  if(R('gap')){const p=R('gap').params;const recs=recommend({employee:code,ctx,requirements:reqs,measurements,courses,categories,mappings,nominations,on}).filter(r=>r.bucket==='gap'&&r.gap>=p.threshold);const seen=new Set();for(const r of recs){if(seen.has(r.competency_code)||seen.size>=p.perEmployee)continue;seen.add(r.competency_code);add({type:'nominate',rule:'gap',employee_code:code,course:r.course,competency_code:r.competency_code,reason:r.why[0],priority:r.gap>=3?'high':'normal',due:addDays(on,90)})}}
  if(R('appraisal')){const score=appraisalOf?.(code);if(score!==null&&score!==undefined&&score<R('appraisal').params.threshold){const recs=recommend({employee:code,ctx,requirements:reqs,measurements,courses,categories,mappings,nominations,appraisal:score,on}).filter(r=>r.bucket==='gap').slice(0,2);if(recs.length)recs.forEach(r=>add({type:'nominate',rule:'appraisal',employee_code:code,course:r.course,competency_code:r.competency_code,reason:`نتيجة تقييم ${score} أقل من ${R('appraisal').params.threshold} + ${r.why[0]}`,priority:'high',due:addDays(on,60)}));else add({type:'alert',rule:'appraisal',employee_code:code,message:`نتيجة تقييم ${score}: لا توجد قياسات جدارات — اطلب قياسًا قبل بناء خطة التطوير`})}}
 }
 const ids=new Set(people.map(e=>String(e.employee_code)));
 for(const n of nominations.filter(n=>ids.has(n.employee_code))){const c=courseOf(n.course_code);
  if(R('expiry')&&n.status==='completed'&&c?.validity_months){const exp=n.completion?.expiry||addMonths(n.completion?.date||n.created,c.validity_months),d=diffDays(exp,on);if(d!==null&&d<=R('expiry').params.days){const k=n.employee_code+'|'+c.code;if(!openKey.has(k))add({type:'nominate',rule:'expiry',employee_code:n.employee_code,course:c,reason:`تجديد: الصلاحية ${d<0?'انتهت':'تنتهي'} في ${exp}`,priority:'high',due:exp<on?addDays(on,14):exp})}}
  if(R('overdue')&&OPEN.includes(n.status)&&n.due&&n.due<on)add({type:'alert',rule:'overdue',employee_code:n.employee_code,nomination:n.id,message:`«${n.course_title}» متأخر منذ ${diffDays(on,n.due)} يوم — تنبيه المدير وشريك HR`});
  if(R('reassess')&&n.status==='completed'&&n.competency_code&&!n.reassess_requested){const d=diffDays(on,n.completion?.date);if(d!==null&&d>=R('reassess').params.days)add({type:'reassess',rule:'reassess',employee_code:n.employee_code,nomination:n.id,competency_code:n.competency_code,message:`مرّ ${d} يوم على إكمال «${n.course_title}» — أعد قياس ${n.competency_code} لقياس أثر التدريب (Kirkpatrick L3)`})}
 }
 return actions}
function addDays(date,n){const d=new Date(String(date).slice(0,10)+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+Number(n));return d.toISOString().slice(0,10)}

/* ---------- KPIs ---------- */
function kpis({people,nominations,courses,measurementsCount=0,assessedPeople=0,on=today()}){const ids=new Set(people.map(e=>String(e.employee_code))),ns=nominations.filter(n=>ids.has(n.employee_code)),c=k=>courses.find(x=>x.code===k);
 const done=ns.filter(n=>n.status==='completed'),closed=ns.filter(n=>['completed','cancelled','rejected'].includes(n.status)),hours=done.reduce((a,n)=>a+(+c(n.course_code)?.hours||0),0);
 const fb=done.filter(n=>n.feedback);const learners=new Set(done.map(n=>n.employee_code));
 const overdue=ns.filter(n=>OPEN.includes(n.status)&&n.due&&n.due<on).length;
 return {people:people.length,nominations:ns.length,open:ns.filter(n=>OPEN.includes(n.status)).length,completed:done.length,completionRate:closed.length?Math.round(done.length/closed.length*100):null,overdue,hours,hoursPerHead:people.length?Math.round(hours/people.length*10)/10:0,reach:people.length?Math.round(learners.size/people.length*1000)/10:0,satisfaction:fb.length?Math.round(fb.reduce((a,n)=>a+n.feedback.rating,0)/fb.length*10)/10:null,applied:fb.length?Math.round(fb.filter(n=>n.feedback.applied).length/fb.length*100):null,assessedCoverage:people.length?Math.round(assessedPeople/people.length*1000)/10:0,measurements:measurementsCount,pendingApproval:ns.filter(n=>['nominated','requested'].includes(n.status)).length,certs:done.filter(n=>c(n.course_code)?.type==='certification').length}}

return {STATUS,OPEN,HR_ROLES,MANAGER_ROLES,BADGES,DEFAULT_RULES,mergeCatalog,availableFor,gaps,latestMeasurement,recommend,mentors,nominate,transition,feedback,learnerStats,completionRisk,runRules,kpis,isValidCompletion,addMonths,addDays,diffDays,today};
});
