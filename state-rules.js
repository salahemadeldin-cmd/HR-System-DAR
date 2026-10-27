/* Shared-state rules — used by the server (enforcement) and the browser (diffing). Keep both in sync by sharing this file.
   kind: person  = records about one employee (visible/writable only inside the user's scope)
         config  = settings and catalogs (readable by all; writable by the listed roles)
         object  = key→value map (per-key merge)
         append  = append-only logs (no edit/delete; readable by admins only)
         local   = stays in the user's browser (not synced) */
(function(root,factory){const m=factory();if(typeof module==='object')module.exports=m;else root.ODStateRules=m})(typeof window==='object'?window:globalThis,()=>{
'use strict';
const ADMIN=['super_admin','od_admin'],HR=['super_admin','od_admin','hrbp'],BANK=['super_admin','od_admin','hrbp','assessor'],MANAGERS=['super_admin','od_admin','hrbp','line_manager','site_manager'],MEASURERS=['super_admin','od_admin','hrbp','line_manager','site_manager','assessor'],ANY=['super_admin','od_admin','hrbp','line_manager','site_manager','assessor','employee'];
const by=f=>i=>String(typeof f==='function'?f(i):i?.[f]);
const RULES={
 'reviews':{kind:'person',write:MANAGERS},
 'requests':{kind:'person',write:ANY},
 'movements':{kind:'person',write:HR},
 'acks':{kind:'person',write:ANY,key:by(i=>i.policy+'|'+i.employee)},
 'edits':{kind:'person',write:HR,key:by('employee_code')},
 'newEmployees':{kind:'person',write:HR,key:by('employee_code')},
 'training':{kind:'person',write:MANAGERS},
 'accounts':{kind:'config',read:ADMIN,write:ADMIN},
 'policies':{kind:'config',write:HR},
 'structureEdits':{kind:'config',write:ADMIN,key:by('org_code')},
 'positionEdits':{kind:'config',write:ADMIN,key:by('position_code')},
 'projects':{kind:'config',write:ADMIN},
 'structureRevisions':{kind:'config',write:ADMIN},
 'visits':{kind:'local'},
 'foundation.version':{kind:'value'},
 'foundation.employeeExtras':{kind:'person',write:HR,key:by('employee_code')},
 'foundation.jobEdits':{kind:'config',write:ADMIN,key:by('job_code')},
 'foundation.competencyEdits':{kind:'config',write:ADMIN,key:by('competency_code')},
 'foundation.requirements':{kind:'config',write:ADMIN,key:by(r=>r.job_code+'|'+r.competency_code)},
 'foundation.measurements':{kind:'person',write:MEASURERS},
 'foundation.bindings':{kind:'config',read:ADMIN,write:ADMIN},
 'foundation.templates':{kind:'config',write:ADMIN,key:by(t=>t.id+'@'+t.version)},
 'foundation.workflowDefs':{kind:'config',write:ADMIN,key:by(d=>d.id+'@'+d.version)},
 'foundation.workflowRequests':{kind:'person',write:ANY},
 'foundation.read':{kind:'local'},
 'foundation.audit':{kind:'append',read:ADMIN},
 'foundation.settings':{kind:'object',write:ADMIN},
 'performance.version':{kind:'value'},
 'performance.records':{kind:'person',write:ANY,person:['employee_code']},
 'performance.notifications':{kind:'person',write:ANY,person:['recipient']},
 'performance.audit':{kind:'append',read:ADMIN},
 'academy.version':{kind:'value'},
 'academy.courseEdits':{kind:'config',write:ADMIN,key:by('code')},
 'academy.custom':{kind:'config',write:ADMIN,proposeBy:MANAGERS,key:by('code')},
 'academy.mappings':{kind:'config',write:ADMIN},
 'academy.nominations':{kind:'person',write:ANY},
 'academy.rules':{kind:'config',write:ADMIN},
 'academy.alerts':{kind:'person',write:HR},
 'academy.runs':{kind:'config',write:ADMIN},
 'academy.aiLog':{kind:'append',read:ADMIN},
 'academy.optOutLeaderboard':{kind:'local'},
 'assessment.version':{kind:'value'},
 'assessment.compLinks':{kind:'object',write:ADMIN},
 'assessment.jobLinks':{kind:'object',write:ADMIN},
 'assessment.sessions':{kind:'person',write:BANK,read:BANK,external:BANK,person:['person.employee_code']},
 'assessment.seen':{kind:'object',write:BANK,read:BANK}
};
const CONTAINERS=['foundation','performance','academy','assessment'];
const ROLES={ADMIN,HR,BANK,MANAGERS,MEASURERS,ANY};
/* stable JSON + 53-bit hash (cyrb53) so server and browser derive the same key for id-less records */
function stable(v){if(Array.isArray(v))return'['+v.map(stable).join(',')+']';if(v&&typeof v==='object')return'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';return JSON.stringify(v)}
function hash(str){let h1=0xdeadbeef,h2=0x41c6ce57;for(let i=0;i<str.length;i++){const ch=str.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677)}h1=Math.imul(h1^(h1>>>16),2246822507);h1^=Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507);h2^=Math.imul(h1^(h1>>>13),3266489909);return(4294967296*(2097151&h2)+(h1>>>0)).toString(36)}
function keyOf(path,item){const r=RULES[path];if(r?.key)return r.key(item);if(item&&item.id!==undefined&&item.id!==null)return'id:'+item.id;return'h:'+hash(stable(item))}
function get(o,path){return path.split('.').reduce((a,k)=>a?.[k],o)}
function personOf(path,item){const fields=RULES[path]?.person||['employee_code','employee','recipient'];for(const f of fields){const v=get(item,f);if(v!==undefined&&v!==null&&v!=='')return String(v)}return null}
/* All synced paths present in a document (known rules + unknown paths, which are treated as admin config) */
function paths(doc){const out=[];for(const k of Object.keys(doc||{})){if(CONTAINERS.includes(k)&&doc[k]&&typeof doc[k]==='object'&&!Array.isArray(doc[k])){for(const s of Object.keys(doc[k]))out.push(k+'.'+s)}else out.push(k)}return out}
function rule(path){return RULES[path]||{kind:'config',write:ADMIN,unknown:true}}
return {RULES,CONTAINERS,ROLES,stable,hash,keyOf,personOf,paths,rule,get};
});
