(function(root,factory){const theme=factory();if(typeof module==='object'&&module.exports)module.exports=theme;else{root.ODCompanyTheme=theme;let selected='';try{selected=localStorage.getItem('shorouk.workspace')||''}catch{}theme.apply(selected)}})(typeof window==='object'?window:globalThis,()=>{
const palettes={
group:{name:'dar-group',primary:'#353535',deep:'#181818',accent:'#969BA2',soft:'#F0F1F2',surface:'#F8F9FA',ink:'#303236',line:'#DDE0E3'},
'EX-C01':{name:'shorouk',primary:'#2C347C',deep:'#191D43',accent:'#6F78B6',soft:'#EFF0FA',surface:'#F8F9FD',ink:'#252A57',line:'#DCDFF0'},
'EX-C02':{name:'dar-development',primary:'#41464E',deep:'#23272D',accent:'#9DA7B2',soft:'#EFF2F5',surface:'#F8FAFC',ink:'#303B46',line:'#DCE2E8'},
'EX-C03':{name:'eic',primary:'#A83939',deep:'#1B2851',accent:'#AC3C3C',soft:'#FBEFEE',surface:'#FCF9F9',ink:'#26355B',line:'#EFD9D7'},
'EX-C04':{name:'conmix-egypt',primary:'#BD3C18',deep:'#32201C',accent:'#DC441C',soft:'#FFF0E9',surface:'#FFFAF7',ink:'#4B2B22',line:'#F0D9CF'},
'EX-C05':{name:'mstlator',primary:'#0969A8',deep:'#111B27',accent:'#0C74BC',soft:'#EAF4FC',surface:'#F6FAFD',ink:'#173B55',line:'#D6E7F3'},
'EX-C06':{name:'conmix-saudi',primary:'#BD3C18',deep:'#32201C',accent:'#DC441C',soft:'#FFF0E9',surface:'#FFFAF7',ink:'#4B2B22',line:'#F0D9CF'}
};
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
const mix=(a,b,amount)=>'#'+rgb(a).map((v,i)=>Math.round(v+(rgb(b)[i]-v)*amount).toString(16).padStart(2,'0')).join('');
function apply(code){const p=palettes[code]||palettes.group;if(typeof document==='undefined')return p;const body=document.body;body.dataset.companyTheme=p.name;const tokens={'--od':p.primary,'--deep':p.deep,'--brand':p.primary,'--accent':p.accent,'--company-soft':p.soft,'--company-surface':p.surface,'--company-ink':p.ink,'--company-line':p.line,'--company-highlight':mix(p.accent,'#FFFFFF',.72),'--company-focus':mix(p.primary,'#FFFFFF',.35),'--company-deep-rgb':rgb(p.deep).join(', '),'--company-primary-rgb':rgb(p.primary).join(', ')};for(const [name,value]of Object.entries(tokens))body.style.setProperty(name,value);document.querySelector('meta[name="theme-color"]')?.setAttribute('content',p.deep);return p}
return {palettes,apply,mix};
});
