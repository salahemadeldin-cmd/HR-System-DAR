/* Assessment Center — pure logic (browser: window.ODAssessmentModel, Node: require).
   Rules from the seed workbook README:
   - draw by difficulty ratios; shuffle questions AND options; max ONE question per similarity group per test;
   - never repeat a question for the same person across attempts (when the bank allows; otherwise flagged).
   Platform rules: a score is evidence, not a decision — the assessor confirms the level before it becomes a measurement. */
(function(root,factory){const m=factory();if(typeof module==='object')module.exports=m;else root.ODAssessmentModel=m})(typeof window==='object'?window:globalThis,()=>{
'use strict';
/* deterministic PRNG so a generated form can be reproduced from its seed (audit) */
function rng(seed){let a=0;for(const ch of String(seed))a=(Math.imul(a^ch.charCodeAt(0),2654435761)+1)>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function shuffle(list,rand){const a=list.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

/* Default seed → platform links (suggested; editable in /assessment-center → mapping) */
const COMP_LINKS={C01:'CMP-CORE-005',C02:'CMP-CORE-001',C03:'CMP-CORE-004',C04:'CMP-CORE-003',C05:'CMP-CORE-002',C06:'CMP-LEAD-003',C07:'CMP-CORE-006',L01:'CMP-LEAD-002',L02:'CMP-LEAD-004',L03:'CMP-LEAD-005',L04:'CMP-LEAD-001',L05:'CMP-LEAD-007',L06:'CMP-LEAD-006',T01:'CMP-TECH-F02-02',T02:'CMP-TECH-F02-01',T03:'CMP-TECH-F05-01',T04:'CMP-TECH-F04-02',T05:'CMP-TECH-F04-01',T06:'CMP-TECH-F06-03',T07:'CMP-TECH-F07-01',T08:'CMP-TECH-F08-01',T09:'CMP-TECH-F02-03',T10:'CMP-TECH-F06-02',T11:null,T12:'CMP-TECH-F03-02',T13:'CMP-DIG-005'};
const JOB_LINKS={J01:['JOB-080','JOB-081','JOB-086','JOB-087','JOB-148','JOB-150','JOB-151','JOB-164'],J02:['JOB-052','JOB-056'],J03:['JOB-030','JOB-041','JOB-046','JOB-253','JOB-258'],J04:['JOB-054','JOB-055','JOB-057','JOB-058','JOB-059','JOB-101','JOB-102','JOB-103','JOB-104','JOB-105'],J05:['JOB-247','JOB-250','JOB-251','JOB-255','JOB-259'],J06:['JOB-382','JOB-383','JOB-385','JOB-388','JOB-389','JOB-392','JOB-393','JOB-394','JOB-395','JOB-396'],J07:['JOB-399','JOB-401','JOB-402','JOB-403','JOB-404','JOB-405','JOB-406','JOB-407','JOB-408','JOB-409','JOB-410'],J08:['JOB-093']};
const seedJobFor=(platformJob,links=JOB_LINKS)=>Object.keys(links).find(k=>(links[k]||[]).includes(platformJob))||null;

/* Difficulty quotas: largest remainder so the counts always sum to n */
function quotas(n,bp){const raw=[['easy',n*bp.easy],['medium',n*bp.medium],['hard',n*bp.hard]];const out=Object.fromEntries(raw.map(([k,v])=>[k,Math.floor(v)]));let left=n-Object.values(out).reduce((a,b)=>a+b,0);raw.sort((a,b)=>(b[1]%1)-(a[1]%1)).forEach(([k])=>{if(left>0){out[k]++;left--}});return out}

/* Generate a test form for one job */
function generateForm({job,questions,blueprint,seen=new Set(),seed=String(Date.now()),n}){
 const rand=rng(seed),size=n||blueprint.perJob?.[job]||20,want=quotas(size,blueprint),bank=questions.filter(q=>q.job===job);
 if(!bank.length)throw Error('لا توجد أسئلة لهذه الوظيفة في البنك');
 const picked=[],groups=new Set(),notes=[];
 const take=(pool,k)=>{
  /* spread across competencies: round-robin over competencies in random order */
  const byComp=new Map();shuffle(pool,rand).forEach(q=>{if(!byComp.has(q.comp))byComp.set(q.comp,[]);byComp.get(q.comp).push(q)});
  const comps=shuffle([...byComp.keys()],rand);let got=0,progress=true;
  while(got<k&&progress){progress=false;for(const c of comps){if(got>=k)break;const list=byComp.get(c);while(list.length){const q=list.shift();if(q.group&&groups.has(q.group))continue;picked.push(q);if(q.group)groups.add(q.group);got++;progress=true;break}}}
  return got};
 for(const level of ['easy','medium','hard']){
  const fresh=bank.filter(q=>q.difficulty===level&&!seen.has(q.id));let got=take(fresh,want[level]);
  if(got<want[level]){const reused=bank.filter(q=>q.difficulty===level&&seen.has(q.id)&&!picked.includes(q));const more=take(reused,want[level]-got);if(more)notes.push(`أُعيد استخدام ${more} سؤالًا (${level}) سبق عرضها لهذا الشخص لنفاد البنك`);got+=more}
  if(got<want[level]){const other=bank.filter(q=>!picked.includes(q)&&!seen.has(q.id));const fill=take(other,want[level]-got);if(fill)notes.push(`استُكمل ${fill} سؤالًا من مستوى صعوبة آخر`);got+=fill}
 }
 const items=shuffle(picked,rand).map(q=>({id:q.id,order:shuffle([0,1,2,3].filter(i=>q.options[i]),rand)}));
 return {seed,job,size,quotas:want,items,notes,created:new Date().toISOString()};
}
/* Score: answers = {qid: displayedIndex}; returns overall and per competency */
function score(form,answers,questions){
 const byId=new Map(questions.map(q=>[q.id,q])),per={};let correct=0,points=0,max=0,answered=0;
 for(const it of form.items){const q=byId.get(it.id);if(!q)continue;const pick=answers[it.id];const chosen=pick===undefined||pick===null?null:it.order[pick];const ok=chosen===q.answer;if(chosen!==null)answered++;const p=Number(q.points)||1;max+=p;if(ok){correct++;points+=p}const c=per[q.comp]??={comp:q.comp,correct:0,total:0};c.total++;if(ok)c.correct++}
 for(const c of Object.values(per))c.pct=Math.round(c.correct/c.total*100);
 return {correct,total:form.items.length,answered,pct:max?Math.round(points/max*100):0,perComp:Object.values(per)}}
/* Indicative level from a knowledge test — needs ≥2 items on that competency; assessor confirms */
function suggestLevel(required,pct,items){if(items<2||required==null)return null;const r=Number(required);const lvl=pct>=90?r+1:pct>=70?r:pct>=50?r-1:r-2;return Math.max(1,Math.min(5,lvl))}

/* Integration (wash-up): combine AC exercise ratings, interview ratings and test suggestion per competency */
function integrate({acRatings=[],interview=[],test=null,required={}}){
 const per={};const add=(comp,src,v)=>{if(!(v>=1&&v<=5))return;(per[comp]??={comp,sources:[]}).sources.push({src,v:Number(v)})};
 acRatings.forEach(r=>add(r.comp,'ac:'+r.exercise,r.rating));interview.forEach(r=>add(r.comp,'interview',r.rating));
 (test?.perComp||[]).forEach(c=>{const s=suggestLevel(required[c.comp],c.pct,c.total);if(s)add(c.comp,'test',s)});
 return Object.values(per).map(p=>{const vals=p.sources.map(s=>s.v),mean=vals.reduce((a,b)=>a+b,0)/vals.length,spread=Math.max(...vals)-Math.min(...vals);return {...p,mean:Math.round(mean*100)/100,proposed:Math.round(mean),spread,needsDiscussion:spread>=2,required:required[p.comp]??null,gap:required[p.comp]!=null?Math.max(0,required[p.comp]-Math.round(mean)):null}}).sort((a,b)=>a.comp.localeCompare(b.comp))}

/* Turn confirmed results into Foundation measurements (only mapped competencies) */
function toMeasurements({session,results,links=COMP_LINKS,assessor,date}){
 if(!session?.employee_code)throw Error('القياس يُسجل لموظف حالي فقط؛ المرشح الخارجي يبقى في سجل الجلسة');
 const out=[],skipped=[];
 for(const r of results){if(!(r.final>=1&&r.final<=5)){skipped.push({comp:r.comp,why:'لم يُعتمد مستوى'});continue}const code=links[r.comp];if(!code){skipped.push({comp:r.comp,why:'غير مربوط بجدارة في المنصة'});continue}
  out.push({employee_code:String(session.employee_code),competency_code:code,level:Number(r.final),date,evidence:`مركز التقييم — جلسة ${session.id} (${r.comp}: ${r.sources.map(s=>s.src.replace('ac:','')+'='+s.v).join('، ')})`,assessor:String(assessor),recorded:new Date().toISOString(),source:'assessment-center',seed_comp:r.comp,session:session.id})}
 return {measurements:out,skipped}}

/* Bank statistics per job (mirrors the Test_Blueprint sheet) */
function bankStats(questions,blueprint){const jobs=[...new Set(questions.map(q=>q.job))].sort();return jobs.map(j=>{const qs=questions.filter(q=>q.job===j),n=blueprint.perJob?.[j]||20,want=quotas(n,blueprint),by=d=>qs.filter(q=>q.difficulty===d).length;const forms=Math.min(...['easy','medium','hard'].map(d=>want[d]?Math.floor(by(d)/want[d]):Infinity));return {job:j,total:qs.length,easy:by('easy'),medium:by('medium'),hard:by('hard'),mcq:qs.filter(q=>q.type==='MCQ').length,sjt:qs.filter(q=>q.type==='SJT').length,perTest:n,quotas:want,parallelForms:forms}})}

return {rng,shuffle,quotas,generateForm,score,suggestLevel,integrate,toMeasurements,bankStats,COMP_LINKS,JOB_LINKS,seedJobFor};
});
