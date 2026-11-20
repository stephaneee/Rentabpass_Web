(function(){
'use strict';

var BRIDGE=window.RentabPassAndroid||null;
/* thème clair / sombre (préférence de l'appareil) */
var LST='rentabpass-theme',mqDark=window.matchMedia?window.matchMedia('(prefers-color-scheme: dark)'):null;
function themePref(){var t='dark';try{t=localStorage.getItem(LST)||'dark';}catch(e){}return t;}
function applyTheme(){
  var p=themePref(),light=p==='light'||(p==='auto'&&mqDark&&!mqDark.matches);
  document.documentElement.setAttribute('data-theme',light?'light':'dark');
  var m=document.querySelector('meta[name=theme-color]');if(m)m.setAttribute('content',light?'#F4F3EF':'#0B0B0C');
  if(BRIDGE&&typeof BRIDGE.setTheme==='function'){try{BRIDGE.setTheme(light);}catch(e){}}
}
applyTheme();
if(mqDark&&mqDark.addEventListener)mqDark.addEventListener('change',function(){if(themePref()==='auto')applyTheme();});
var IS_APP=!!BRIDGE;
/* site web indépendant (GitHub Pages) : ni l'APK, ni la page hébergée par Claude */
var IS_WEB=!IS_APP&&!window.claude;
var CAN_TMDB=IS_APP||IS_WEB;

/* ---------- constantes ---------- */
var TECHS=[
  {id:'std',label:'Standard',chip:'STANDARD'},
  {id:'imax',label:'IMAX',chip:'IMAX'},
  {id:'4dx',label:'4DX',chip:'4DX'},
  {id:'imax3d',label:'IMAX 3D',chip:'IMAX 3D'},
  {id:'4dx3d',label:'4DX 3D',chip:'4DX 3D'},
  {id:'live',label:'Spectacle',chip:'SPECTACLE',long:'Spectacle · concert · théâtre'}
];
var TECH=Object.fromEntries(TECHS.map(function(t){return [t.id,t];}));
var FORMULAS=[
  {id:'none',label:'Aucun',long:'Pas d’abonnement',cover:'Vous payez vos places au prix réel.'},
  {id:'m26',label:'-26',long:'CinéPass -26',cover:'Séances standard incluses ; IMAX, 4DX et spectacles avec supplément ou plein tarif.'},
  {id:'classique',label:'Classique',long:'CinéPass',cover:'Séances standard incluses ; IMAX, 4DX avec supplément, spectacles plein tarif.'},
  {id:'silver',label:'Silver',long:'CinéPass Silver',cover:'Standard et cinémas premium inclus ; IMAX, 4DX avec supplément, spectacles plein tarif.'},
  {id:'gold',label:'Gold',long:'CinéPass Gold',cover:'Tout inclus : IMAX, 4DX, 3D et spectacles Pathé Live.'}
];
var FORM=Object.fromEntries(FORMULAS.map(function(p){return [p.id,p];}));
var MAY='2026-05-04';
var ORIGIN='2000-01-01';
var DEFAULT_PRICES={
  std:15.9,imax:23.9,'4dx':23.9,imax3d:24.9,'4dx3d':24.9,live:20,
  x_imax:8,x_4dx:8,x_imax3d:9,x_4dx3d:9
};
/* tarifs CinéPass préchargés : grille de janvier 2026, puis grille du 4 mai 2026 */
function presetPasses(){return {
  pass_m26:[{p:18.4,from:ORIGIN},{p:19.4,from:MAY}],
  pass_classique:[{p:22.9,from:ORIGIN},{p:23.9,from:MAY}],
  pass_silver:[{p:31.9,from:ORIGIN}],
  pass_gold:[{p:39.9,from:ORIGIN},{p:36.9,from:MAY}],
  opt_duo:[{p:15,from:ORIGIN}]
};}
var PLACE_IDS=['std','imax','4dx','imax3d','4dx3d','live'];
var SUP_IDS=['x_imax','x_4dx','x_imax3d','x_4dx3d'];
var PASS_IDS=['pass_m26','pass_classique','pass_silver','pass_gold','opt_duo'];
var DEFAULT_MP={f:'gold',duo:true};
var PRICE_IDS=PLACE_IDS.concat(SUP_IDS,PASS_IDS);
var PRICE_LABEL={std:'Standard',imax:'IMAX','4dx':'4DX',imax3d:'IMAX 3D','4dx3d':'4DX 3D',live:'Spectacle · concert · théâtre',
  x_imax:'Supplément IMAX',x_4dx:'Supplément 4DX',x_imax3d:'Supplément IMAX 3D',x_4dx3d:'Supplément 4DX 3D',
  pass_m26:'CinéPass -26 (par mois)',pass_classique:'CinéPass (par mois)',pass_silver:'CinéPass Silver (par mois)',pass_gold:'CinéPass Gold (par mois)',opt_duo:'Option Duo (par mois)'};
var PRICE_SHORT={std:'Standard',imax:'IMAX','4dx':'4DX',imax3d:'IMAX 3D','4dx3d':'4DX 3D',live:'Spectacle',
  x_imax:'Sup. IMAX',x_4dx:'Sup. 4DX',x_imax3d:'Sup. IMAX 3D',x_4dx3d:'Sup. 4DX 3D',pass_m26:'CinéPass -26',pass_classique:'CinéPass',pass_silver:'Silver',pass_gold:'Gold',opt_duo:'Option Duo'};
var MONTHS=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
var MSHORT=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
var MINI=['J','F','M','A','M','J','J','A','S','O','N','D'];
var DAYS=['dim.','lun.','mar.','mer.','jeu.','ven.','sam.'];
var PALETTE=['#1E3A5F','#2C2F48','#5A2A27','#6E5218','#12443F','#5E2A52','#3B3355','#4A3426','#2D4A2E','#5B3A1A'];
var IMG='https://image.tmdb.org/t/p/';

var ICO={
  left:'<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  right:'<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A6A6AD" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
  rightW:'<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
  check:'<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
  plus:'<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  home:'<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
  film:'<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/></svg>',
  ticket:'<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4z"/><path d="M14 5v14" stroke-dasharray="2 2"/></svg>',
  stats:'<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>',
  gear:'<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>',
  lock:'<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFC20E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
  info:'<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFC20E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></svg>',
  star:'<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFC20E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px"><path d="M12 2l3 7h7l-5.5 4.5 2 7.5L12 17l-6.5 4 2-7.5L2 9h7z"/></svg>',
  img:'<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>',
  pen:'<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A6A6AD" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left:4px"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  search:'<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A6A6AD" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  starS:'<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.7l7.1-.6z"/></svg>',
  starO:'<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2.5l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.7l7.1-.6z"/></svg>',
  starF:'<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2.5l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.7l7.1-.6z"/></svg>',
  bell:'<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFC20E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg>',
  cloud:'<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19a4.5 4.5 0 0 0 .5-9 6 6 0 0 0-11.6 1.5A4 4 0 0 0 7 19z"/></svg>'
};

/* ---------- utilitaires ---------- */
function pad(n){return (n<10?'0':'')+n;}
function todayISO(){var d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function ymOf(iso){return String(iso).slice(0,7);}
function addMonths(ym,k){var y=+ym.slice(0,4),m=+ym.slice(5,7)-1+k;y+=Math.floor(m/12);m=((m%12)+12)%12;return y+'-'+pad(m+1);}
function prevDay(iso){var d=new Date(iso+'T12:00:00');d.setDate(d.getDate()-1);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function frDate(iso){return iso.slice(8,10)+'/'+iso.slice(5,7)+'/'+iso.slice(0,4);}
function longDate(iso){var d=new Date(iso+'T12:00:00');return d.getDate()+' '+MONTHS[d.getMonth()]+' '+d.getFullYear();}
function shortDate(iso){var d=new Date(iso+'T12:00:00');return DAYS[d.getDay()].replace('.','')+'. '+d.getDate()+' '+MSHORT[d.getMonth()];}
function monthTitle(ym){return MONTHS[+ym.slice(5,7)-1];}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);}
function eur(n){return (Math.round(n*100)/100).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';}
function signed(n){return (n>=0?'+':'−')+eur(Math.abs(n));}
function num2(n){return (Math.round(n*100)/100).toFixed(2).replace('.',',');}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function norm(s){return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();}
function keyOf(title){return norm(title).replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80)||'sans-titre';}
function hash(s){var h=0;for(var i=0;i<s.length;i++){h=(h*31+s.charCodeAt(i))|0;}return Math.abs(h);}
function initials(t){var small={le:1,la:1,les:1,de:1,du:1,des:1,un:1,une:1,et:1,the:1,of:1,a:1,l:1,d:1};var w=norm(t).replace(/[^a-z0-9 ]+/g,' ').split(/\s+/).filter(Boolean);var big=w.filter(function(x){return !small[x];});var src=big.length?big:w;return src.slice(0,3).map(function(x){return x.charAt(0).toUpperCase();}).join('')||'?';}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8);}
function clone(o){return JSON.parse(JSON.stringify(o));}
function isoOf(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function addDays(iso,k){var d=new Date(iso+'T12:00:00');d.setDate(d.getDate()+k);return isoOf(d);}
function monthsAgo(k){var d=new Date();d.setHours(12,0,0,0);d.setMonth(d.getMonth()-k);return isoOf(d);}
function nextMonday(){var d=new Date();d.setHours(12,0,0,0);var add=(8-d.getDay())%7||7;d.setDate(d.getDate()+add);return isoOf(d);}
function mondayOf(iso){var d=new Date(iso+'T12:00:00');var back=(d.getDay()+6)%7;d.setDate(d.getDate()-back);return isoOf(d);}
function daysUntil(iso){return Math.round((new Date(iso+'T12:00:00')-new Date(todayISO()+'T12:00:00'))/86400000);}
function noop(){}
function safePath(p){return typeof p==='string'&&/^\/[A-Za-z0-9_\-]+\.(jpg|jpeg|png|webp)$/i.test(p)?p:null;}

/* ---------- état ---------- */
function defaultState(){
  var prices=presetPasses();Object.keys(DEFAULT_PRICES).forEach(function(k){prices[k]=[{p:DEFAULT_PRICES[k],from:ORIGIN}];});
  return {v:3,prices:prices,months:{},sessions:[],watch:{},alertLead:3,setup:false};
}
function normMP(v){
  if(v&&typeof v==='object'&&FORM[v.f])return {f:v.f,duo:v.f!=='none'&&!!v.duo};
  if(v==='solo')return {f:'classique',duo:false};
  if(v==='duo')return {f:'classique',duo:true};
  if(v==='gold')return {f:'gold',duo:true};
  if(v==='none')return {f:'none',duo:false};
  return null;
}
function migrate(s){
  if(!s||typeof s!=='object'||!Array.isArray(s.sessions)||!s.prices)return null;
  s=clone(s);
  ['sub','pass_solo','pass_duo'].forEach(function(k){delete s.prices[k];});
  if(!s.v||s.v<3){var pre=presetPasses();Object.keys(pre).forEach(function(k){s.prices[k]=pre[k];});}
  var pre2=presetPasses();Object.keys(pre2).forEach(function(k){if(!Array.isArray(s.prices[k])||!s.prices[k].length)s.prices[k]=pre2[k];});
  Object.keys(DEFAULT_PRICES).forEach(function(k){if(!Array.isArray(s.prices[k])||!s.prices[k].length)s.prices[k]=[{p:DEFAULT_PRICES[k],from:ORIGIN}];});
  if(!s.months||typeof s.months!=='object'){
    s.months={};
    if(typeof s.subStart==='string'&&/^\d{4}-\d{2}/.test(s.subStart)){var st=ymOf(s.subStart);s.months[st]='gold';var p=addMonths(st,-1);s.months[p]='none';}
  }
  Object.keys(s.months).forEach(function(k){var m=normMP(s.months[k]);if(m&&/^\d{4}-\d{2}$/.test(k))s.months[k]=m;else delete s.months[k];});
  if(!s.watch||typeof s.watch!=='object')s.watch={};
  Object.keys(s.watch).forEach(function(k){var w=s.watch[k];if(!w||typeof w.t!=='string'){delete s.watch[k];return;}w.p=safePath(w.p);if(!/^\d{4}-\d{2}-\d{2}$/.test(w.d||''))w.d='';});
  if([0,1,3,7].indexOf(s.alertLead)<0)s.alertLead=3;
  delete s.subStart;
  s.sessions=s.sessions.filter(function(x){return x&&typeof x.title==='string'&&TECH[x.tech]&&/^\d{4}-\d{2}-\d{2}$/.test(x.date)&&typeof x.unit==='number';}).map(function(x){
    x.places=Math.max(1,Math.min(6,+x.places||1));x.poster=safePath(x.poster);if(!Array.isArray(x.genres))x.genres=[];x.tmdb=typeof x.tmdb==='number'?x.tmdb:null;return x;
  });
  s.v=3;return s;
}
var state=defaultState();
var posters={};
var ui={tab:'home',ym:ymOf(todayISO()),statsYear:new Date().getFullYear(),q:'',form:null,sheet:null,films:{tab:'now',q:'',seen:'all'}};

function priceList(id){return (state.prices[id]||[{p:DEFAULT_PRICES[id]||0,from:ORIGIN}]).slice().sort(function(a,b){return a.from<b.from?-1:a.from>b.from?1:0;});}
function priceAt(id,date){var l=priceList(id),p=l[0].p;for(var i=0;i<l.length;i++){if(l[i].from<=date)p=l[i].p;}return p;}
function curPrice(id){return priceAt(id,todayISO());}

/* formule du mois : choix explicite, sinon celle du mois précédent le plus proche, sinon Gold + Duo */
function monthPass(ym){
  if(state.months[ym])return state.months[ym];
  var keys=Object.keys(state.months).filter(function(k){return k<ym;}).sort();
  return keys.length?state.months[keys[keys.length-1]]:DEFAULT_MP;
}
function passLabel(mp){return mp.f==='none'?FORM.none.long:FORM[mp.f].long+(mp.duo?' + Duo':'');}
function passShort(mp){return mp.f==='none'?'Aucun':FORM[mp.f].label+(mp.duo?' Duo':'');}
function samePass(a,b){return a.f===b.f&&!!a.duo===!!b.duo;}
/* prix du mois : le tarif en vigueur pendant le mois (le changement du 4 mai compte dès mai) */
function passPriceParts(ym){var mp=monthPass(ym),d=ym+'-28';if(mp.f==='none')return {base:0,duo:0};return {base:priceAt('pass_'+mp.f,d),duo:mp.duo?priceAt('opt_duo',d):0};}
function passPrice(ym){var p=passPriceParts(ym);return p.base+p.duo;}
function supFor(tech,date){return TECH[tech]&&tech!=='std'&&tech!=='live'?priceAt('x_'+tech,date):0;}
/* ce que vous payez en plus de l'abonnement pour une séance */
function extraFor(s,mp){
  var full=s.unit,n=s.places;
  if(mp.f==='none')return full*n;
  var covered=Math.min(n,mp.duo?2:1),out=(n-covered)*full; /* places non couvertes : plein tarif */
  if(mp.f==='gold')return out;
  if(s.tech==='live')return out+covered*full;          /* spectacles : plein tarif hors Gold */
  return out+covered*supFor(s.tech,s.date);            /* IMAX, 4DX... : supplément par place couverte */
}
function sessionValue(s){return s.unit*s.places;}
function sessionExtra(s){return extraFor(s,monthPass(ymOf(s.date)));}
function sortDesc(a,b){return (a.date+(a.time||''))<(b.date+(b.time||''))?1:-1;}
function sessionsIn(ym){return state.sessions.filter(function(s){return ymOf(s.date)===ym;}).sort(sortDesc);}

/* ---------- stockage ---------- */
var LS='rentabpass-state',LSP='rentabpass-posters',LSC='rentabpass-catalog',LSK='rentabpass-tmdb-key';
function lsGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function lsSet(k,v){try{localStorage.setItem(k,v);return true;}catch(e){return false;}}
function loadLocal(){var r=lsGet(LS);if(r){try{var s=migrate(JSON.parse(r));if(s)state=s;}catch(e){}}var p=lsGet(LSP);if(p){try{posters=JSON.parse(p)||{};}catch(e){}}}
function saveLocal(){if(!lsSet(LS,JSON.stringify(state))&&IS_APP)toast('Mémoire du téléphone pleine : exportez une sauvegarde.');}
function savePostersLocal(){lsSet(LSP,JSON.stringify(posters));}

var db=null,stateRef=null,postersCol=null,writing=false,pending=false,syncMode=IS_APP?'app':(IS_WEB?'web':'local'),readOnly=false,loadTimer=null,downloads=null;

function setBanner(){
  var b=document.getElementById('banner');var msg='';
  if(syncMode==='local')msg='Sauvegarde sur cet appareil uniquement : la synchronisation en ligne n’est pas disponible ici.';
  if(syncMode==='waiting')msg='Connexion à votre sauvegarde en ligne…';
  if(syncMode==='slow')msg='Sauvegarde en ligne injoignable pour l’instant. Vos saisies sont gardées sur cet appareil.';
  if(readOnly)msg='Enregistrement en ligne refusé : vos saisies restent sur cet appareil.';
  b.innerHTML=msg?'<p class="banner" style="margin-top:calc(8px + var(--safe-t))">'+ICO.cloud+'<span>'+esc(msg)+'</span></p>':'';
}
function persist(){
  saveLocal();
  if(!stateRef||readOnly)return;
  if(writing){pending=true;return;}
  writing=true;
  stateRef.set({app:clone(state),at:Date.now()}).then(function(){},function(e){
    if(e&&e.code==='invalid_argument'){readOnly=true;setBanner();}
    else if(e&&e.code==='quota_exceeded'){toast('Espace de sauvegarde plein.');}
    else if(e&&e.code==='unavailable'){setTimeout(function(){pending=true;flush();},1500+Math.random()*1000);}
  }).then(function(){writing=false;flush();});
}
function flush(){if(pending&&!writing){pending=false;persist();}}
function connect(){
  if(IS_APP||IS_WEB){setBanner();return;}
  if(!window.claude||!window.claude.use){syncMode='local';setBanner();return;}
  syncMode='waiting';setBanner();
  Promise.all([window.claude.use('db'),window.claude.use('user'),window.claude.use('downloads')]).then(function(r){
    db=r[0];var user=r[1];downloads=r[2];
    if(!db||!user){syncMode='local';setBanner();render();return null;}
    return user.id();
  }).then(function(id){
    if(!id||!db){if(syncMode!=='local'){syncMode='local';setBanner();}return;}
    stateRef=db.doc('data/users/'+id+'/state');
    postersCol=db.doc('data/users/'+id+'/posters').collection('items');
    loadTimer=setTimeout(function(){syncMode='slow';setBanner();},10000);
    var first=true;
    stateRef.onSnapshot(function(snap){
      if(snap.metadata.fromCache&&!snap.exists)return;
      if(!snap.metadata.fromCache){clearTimeout(loadTimer);if(syncMode!=='online'){syncMode='online';setBanner();}}
      if(writing||pending||snap.metadata.hasPendingWrites)return;
      if(snap.exists){var d=snap.data();var m=d&&migrate(d.app);if(m){state=m;saveLocal();render();}}
      else if(first&&!snap.metadata.fromCache){if(state.sessions.length||state.setup)persist();}
      if(!snap.metadata.fromCache)first=false;
    },function(){clearTimeout(loadTimer);syncMode='slow';setBanner();});
    postersCol.limit(1000).get().then(function(qs){
      qs.docs.forEach(function(d){var v=d.data();if(v&&typeof v.img==='string'&&v.img.indexOf('data:image/')===0)posters[d.id]=v.img;});
      savePostersLocal();render();
    },function(){});
  }).catch(function(){syncMode='local';setBanner();});
}

/* ---------- TMDB (application Android uniquement) ---------- */
var catalog={genres:{},lists:{},films:{}};
(function(){var c=lsGet(LSC);if(c){try{var o=JSON.parse(c);if(o&&o.films)catalog=o;}catch(e){}}})();
function saveCatalog(){
  var keep={};state.sessions.forEach(function(s){if(s.tmdb)keep[s.tmdb]=1;});Object.keys(state.watch||{}).forEach(function(k){keep[k]=1;});
  Object.keys(catalog.lists).forEach(function(k){(catalog.lists[k].ids||[]).forEach(function(i){keep[i]=1;});});
  var ids=Object.keys(catalog.films);
  if(ids.length>800){ids.forEach(function(i){if(!keep[i])delete catalog.films[i];});}
  lsSet(LSC,JSON.stringify(catalog));
}
/* ---------- coffre des clés (TMDB, GitHub) ----------
   APK : clés chiffrées par le coffre matériel d'Android (Keystore) ; la page ne peut plus les relire, seulement s'en servir.
   Site : clés chiffrées (AES-256) avec une clé de chiffrement non exportable gardée par le navigateur.
   Dans les deux cas, une clé enregistrée n'est plus jamais réaffichée. */
var secrets={tmdb:'',github:''};
function lsDel(k){try{localStorage.removeItem(k);}catch(e){}}
function nativeVault(){return !!(BRIDGE&&typeof BRIDGE.secretSet==='function');}
function hasSecret(n){if(nativeVault()){try{return !!BRIDGE.secretHas(n);}catch(e){return false;}}return !!secrets[n];}
function b64(buf){var b=new Uint8Array(buf),s='';for(var i=0;i<b.length;i++)s+=String.fromCharCode(b[i]);return btoa(s);}
function unb64(t){var s=atob(t),b=new Uint8Array(s.length);for(var i=0;i<s.length;i++)b[i]=s.charCodeAt(i);return b;}
function vaultKey(){
  return new Promise(function(ok,ko){
    if(!window.indexedDB||!window.crypto||!crypto.subtle)return ko('nocrypto');
    var r=indexedDB.open('rentabpass-vault',1);
    r.onupgradeneeded=function(){r.result.createObjectStore('k');};
    r.onerror=function(){ko(r.error);};
    r.onsuccess=function(){
      var db=r.result,g=db.transaction('k','readonly').objectStore('k').get('aes');
      g.onerror=function(){ko(g.error);};
      g.onsuccess=function(){
        if(g.result)return ok(g.result);
        crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']).then(function(k){
          var t=db.transaction('k','readwrite');t.objectStore('k').put(k,'aes');t.oncomplete=function(){ok(k);};t.onerror=function(){ko(t.error);};
        },ko);
      };
    };
  });
}
function secretSet(n,v){
  v=String(v||'').trim();
  if(nativeVault()){var r=false;try{r=!!BRIDGE.secretSet(n,v);}catch(e){}return Promise.resolve(r);}
  secrets[n]=v;
  if(!v){lsDel('rentabpass-secret-'+n);return Promise.resolve(true);}
  return vaultKey().then(function(k){
    var iv=crypto.getRandomValues(new Uint8Array(12));
    return crypto.subtle.encrypt({name:'AES-GCM',iv:iv},k,new TextEncoder().encode(v)).then(function(ct){return lsSet('rentabpass-secret-'+n,b64(iv)+'.'+b64(ct));});
  }).catch(function(){toast('Chiffrement indisponible : la clé ne sera gardée que jusqu’à la fermeture');return false;});
}
function vaultLoad(){
  if(nativeVault())return Promise.resolve();
  return Promise.all(['tmdb','github'].map(function(n){
    var raw=lsGet('rentabpass-secret-'+n);if(!raw||raw.indexOf('.')<0)return null;var p=raw.split('.');
    return vaultKey().then(function(k){return crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(p[0])},k,unb64(p[1]));}).then(function(pt){secrets[n]=new TextDecoder().decode(pt);}).catch(noop);
  }));
}
/* anciennes versions : clés en clair -> chiffrées, puis effacées */
function migrateSecrets(){
  var jobs=[],old=(lsGet(LSK)||'').trim(),gc={};try{gc=JSON.parse(lsGet('rentabpass-github')||'{}')||{};}catch(e){}
  if(old)jobs.push(secretSet('tmdb',old).then(function(ok){if(ok)lsDel(LSK);}));
  if(gc.token){var t=gc.token;jobs.push(secretSet('github',t).then(function(ok){if(ok){delete gc.token;lsSet('rentabpass-github',JSON.stringify(gc));}}));}
  return Promise.all(jobs);
}
function tmdbKey(){return hasSecret('tmdb')?(nativeVault()?'1':secrets.tmdb):'';}
var httpSeq=0,httpWait={};
window.rpHttp=function(id,code,body){var w=httpWait[id];if(!w)return;delete httpWait[id];if(code>=200&&code<300){try{w.ok(JSON.parse(body));}catch(e){w.ko('json');}}else w.ko(code||'network');};
function tmdb(path,params){
  return new Promise(function(ok,ko){
    var key=tmdbKey();if(!CAN_TMDB)return ko('web');if(!key)return ko('nokey');
    var bearer=!IS_APP&&key.indexOf('eyJ')===0;
    var q=Object.assign({language:'fr-FR'},params||{});if(!IS_APP&&!bearer)q.api_key=key;
    var url='https://api.themoviedb.org/3'+path+'?'+Object.keys(q).map(function(k){return encodeURIComponent(k)+'='+encodeURIComponent(q[k]);}).join('&');
    if(!IS_APP){
      var ctl=window.AbortController?new AbortController():null,tm=setTimeout(function(){if(ctl)ctl.abort();},15000);
      fetch(url,{headers:bearer?{Authorization:'Bearer '+key,Accept:'application/json'}:{Accept:'application/json'},signal:ctl?ctl.signal:undefined})
        .then(function(r){clearTimeout(tm);if(!r.ok)throw r.status;return r.json();}).then(ok,function(e){ko(typeof e==='number'?e:'network');});
      return;
    }
    var id='h'+(++httpSeq);httpWait[id]={ok:ok,ko:ko};
    setTimeout(function(){if(httpWait[id]){delete httpWait[id];ko('timeout');}},15000);
    try{BRIDGE.httpGet(id,url,'');}catch(e){delete httpWait[id];ko('bridge');}
  });
}
function storeFilm(r){
  if(!r||typeof r.id!=='number')return null;
  var f=catalog.films[r.id]||{};
  f.id=r.id;f.t=String(r.title||r.original_title||'').slice(0,200);f.ot=String(r.original_title||'').slice(0,200);
  f.p=safePath(r.poster_path)||f.p||null;f.d=/^\d{4}-\d{2}-\d{2}$/.test(r.release_date||'')?r.release_date:(f.d||'');
  f.o=String(r.overview||f.o||'').slice(0,1500);f.v=typeof r.vote_average==='number'?r.vote_average:(f.v||0);
  if(Array.isArray(r.genres))f.g=r.genres.map(function(g){catalog.genres[g.id]=g.name;return g.id;});
  else if(Array.isArray(r.genre_ids))f.g=r.genre_ids.slice(0,6);
  if(typeof r.runtime==='number')f.rt=r.runtime;
  if(typeof r.original_language==='string')f.ol=r.original_language;
  if(typeof r.vote_count==='number')f.vc=r.vote_count;
  if(r.release_dates&&Array.isArray(r.release_dates.results))setFrDate(f,r.release_dates.results);
  catalog.films[r.id]=f;return f;
}
function genreNames(f){return (f&&f.g||[]).map(function(i){return catalog.genres[i];}).filter(Boolean);}
function loadGenres(){if(Object.keys(catalog.genres).length)return Promise.resolve();return tmdb('/genre/movie/list').then(function(r){(r.genres||[]).forEach(function(g){catalog.genres[g.id]=String(g.name);});saveCatalog();});}
/* date de sortie en France (salles) */
function setFrDate(f,results){
  var fr=results.filter(function(x){return x.iso_3166_1==='FR';})[0],ds=[];
  if(fr&&Array.isArray(fr.release_dates))ds=fr.release_dates.filter(function(x){return x.type===2||x.type===3;}).map(function(x){return String(x.release_date||'').slice(0,10);}).filter(function(x){return /^\d{4}-\d{2}-\d{2}$/.test(x);}).sort();
  f.fr=ds[0]||'';f.frc=1;
}
function frDateFor(id){return tmdb('/movie/'+id+'/release_dates').then(function(r){var f=catalog.films[id];if(f)setFrDate(f,r.results||[]);return f?f.fr:'';});}
function filmDate(f){return (f&&(f.fr||f.d))||'';}
function pool(items,n,fn){var i=0;function next(){if(i>=items.length)return Promise.resolve();var it=items[i++];return fn(it).catch(noop).then(next);}var w=[];for(var k=0;k<n;k++)w.push(next());return Promise.all(w);}
/* À l'affiche / Prochainement : films en français, en anglais ou dans une langue européenne (pas de productions indiennes, etc.) */
var LANG_OK={fr:1,en:1,de:1,it:1,es:1,pt:1,nl:1,sv:1,da:1,no:1,nb:1,fi:1,is:1,pl:1,cs:1,sk:1,hu:1,ro:1,bg:1,el:1,hr:1,sr:1,sl:1,et:1,lv:1,lt:1,ga:1,cy:1,ca:1,eu:1,gl:1,lb:1,mt:1,uk:1};
function langOk(f){return !f||!f.ol||!!LANG_OK[f.ol];}
var LIST_V=2;
function listRange(kind){var t=todayISO();return kind==='now'?{gte:monthsAgo(12),lte:t,asc:false}:{gte:nextMonday(),lte:addDays(t,183),asc:true};}
function loadList(kind,force){
  var L=catalog.lists[kind];
  var q=listRange(kind);
  if(!force&&L&&Date.now()-L.at<6*3600*1000&&L.day===todayISO()&&L.gte===q.gte&&L.v===LIST_V)return Promise.resolve();
  function page(n){return tmdb('/discover/movie',{region:'FR',with_release_type:'2|3','release_date.gte':q.gte,'release_date.lte':q.lte,sort_by:'popularity.desc',include_adult:'false',page:n});}
  return loadGenres().catch(noop).then(function(){
    var more=kind==='now'?[2,3,4,5,6,7,8,9,10]:[2,3,4,5];
    return Promise.all([page(1)].concat(more.map(function(n){return page(n).catch(function(){return {results:[]};});})));
  }).then(function(rs){
    var ids=[],seen={};
    rs.forEach(function(r){(r.results||[]).forEach(function(x){var f=storeFilm(x);if(f&&!seen[f.id]&&langOk(f)){seen[f.id]=1;ids.push(f.id);}});});
    /* la date renvoyée peut être la sortie mondiale : on vérifie la date française quand elle sort de la période */
    var check=ids.filter(function(id){var f=catalog.films[id];return !f.frc&&(!f.d||f.d<q.gte||f.d>q.lte);}).slice(0,80);
    return pool(check,5,frDateFor).then(function(){return ids;});
  }).then(function(ids){
    ids=ids.filter(function(id){var d=filmDate(catalog.films[id]);return d&&d>=q.gte&&d<=q.lte;});
    ids.sort(function(a,b){var da=filmDate(catalog.films[a]),db=filmDate(catalog.films[b]);return q.asc?(da<db?-1:da>db?1:0):(da<db?1:da>db?-1:0);});
    catalog.lists[kind]={at:Date.now(),day:todayISO(),gte:q.gte,v:LIST_V,ids:ids};saveCatalog();
  });
}
/* générique (réalisation, acteurs principaux) et bande-annonce, en français de préférence */
function storeCredits(f,r){
  if(r.credits){
    f.dir=(r.credits.crew||[]).filter(function(c){return c.job==='Director';}).slice(0,3).map(function(c){return {id:c.id,n:String(c.name||'').slice(0,80)};});
    f.cast=(r.credits.cast||[]).slice(0,6).map(function(c){return {id:c.id,n:String(c.name||'').slice(0,80),ch:String(c.character||'').slice(0,80)};});
  }
  if(r.videos){
    var v=(r.videos.results||[]).filter(function(x){return x.site==='YouTube'&&/^[\w-]{6,20}$/.test(x.key||'')&&(x.type==='Trailer'||x.type==='Teaser');});
    var rank=function(x){return (x.iso_639_1==='fr'?0:x.iso_639_1==='en'?10:20)+(x.type==='Trailer'?0:5)+(x.official?0:1);};
    v.sort(function(a,b){return rank(a)-rank(b);});
    f.vid=v[0]?{k:v[0].key,fr:v[0].iso_639_1==='fr',n:String(v[0].name||'Bande-annonce').slice(0,80)}:null;
  }
  f.cr=1;
}
function filmDetails(id){return tmdb('/movie/'+id,{append_to_response:'release_dates,credits,videos',include_video_language:'fr,en,null'}).then(function(r){var f=storeFilm(r);if(f)storeCredits(f,r);saveCatalog();return f;});}
function tmdbErr(e){
  if(e==='web')return 'La base de films fonctionne dans l’application Android et sur le site Rentab’Pass.';
  if(e==='nokey')return 'Ajoutez votre clé TMDB dans Réglages pour afficher les films.';
  if(e===401)return 'Clé TMDB refusée : vérifiez-la dans Réglages.';
  return 'Impossible de joindre la base de films. Vérifiez votre connexion.';
}

/* ---------- toast ---------- */
var toastT=null;
function toast(msg){var t=document.getElementById('toast');t.innerHTML='<div class="toast">'+esc(msg)+'</div>';clearTimeout(toastT);toastT=setTimeout(function(){t.innerHTML='';},2800);}

/* ---------- affiches ---------- */
function posterBg(title,path,size){
  var k=keyOf(title);
  if(posters[k])return {style:'background-image:url('+posters[k]+')',img:true};
  var p=safePath(path);
  if(p&&CAN_TMDB)return {style:'background-color:'+PALETTE[hash(k)%PALETTE.length]+';background-image:url('+IMG+(size||'w185')+p+')',img:true};
  return {style:'background:'+PALETTE[hash(k)%PALETTE.length],img:false};
}
function posterHTML(title,path,big){
  var b=posterBg(title,path,big?'w342':'w185');
  return '<div class="'+(big?'posterBig':'poster')+'" style="'+b.style+'" aria-hidden="true">'+(b.img?'':'<span>'+esc(initials(title))+'</span>')+'</div>';
}
function resizeImage(file){
  return new Promise(function(res,rej){
    var url=URL.createObjectURL(file);var img=new Image();
    img.onload=function(){var W=200,H=300,c=document.createElement('canvas');c.width=W;c.height=H;var x=c.getContext('2d');var r=Math.max(W/img.width,H/img.height),w=img.width*r,h=img.height*r;x.drawImage(img,(W-w)/2,(H-h)/2,w,h);URL.revokeObjectURL(url);res(c.toDataURL('image/jpeg',0.72));};
    img.onerror=function(){URL.revokeObjectURL(url);rej();};img.src=url;
  });
}
function savePoster(title,data){
  var k=keyOf(title);posters[k]=data;savePostersLocal();
  if(postersCol&&!readOnly){postersCol.doc(k).set({img:data,title:String(title).slice(0,200)}).catch(function(){});}
}

/* ---------- calculs ---------- */
function monthInfo(ym){
  var list=sessionsIn(ym),pass=monthPass(ym),sub=passPrice(ym),parts=passPriceParts(ym);
  var value=0,extra=0;list.forEach(function(s){value+=sessionValue(s);extra+=extraFor(s,pass);});
  var cost=sub+extra,cross=null;
  if(pass.f!=='none'&&sub>0){var asc=list.slice().reverse(),v=0,c=sub;for(var i=0;i<asc.length;i++){v+=sessionValue(asc[i]);c+=extraFor(asc[i],pass);if(v>=c-0.0001){cross={n:i+1,date:asc[i].date};break;}}}
  return {list:list,pass:pass,parts:parts,value:value,sub:sub,extra:extra,cost:cost,ratio:cost>0?value/cost:0,saving:value-cost,cross:cross,past:ym<=ymOf(todayISO())};
}
function yearInfo(y){
  var months=[],paid=0,value=0,extra=0,budget=0,ok=0,count=0,now=ymOf(todayISO());
  for(var m=1;m<=12;m++){
    var ym=y+'-'+pad(m),mi=monthInfo(ym),active=mi.pass.f!=='none',elapsed=ym<=now;
    budget+=mi.sub;
    if(elapsed){paid+=mi.sub;if(active){count++;if(mi.saving>=0)ok++;}}
    value+=mi.value;extra+=mi.extra;
    months.push({ym:ym,v:mi.value,cost:mi.cost,sub:mi.sub,pass:mi.pass,ok:active&&mi.saving>=0&&(mi.value>0||mi.cost===0)&&elapsed,elapsed:elapsed});
  }
  return {months:months,paid:paid,value:value,extra:extra,budget:budget,ok:ok,count:count,saving:value-paid-extra};
}

/* ---------- navigation ---------- */
function navHTML(){
  var tabs=[['home','Accueil',ICO.home],['films','Films',ICO.film],['hist','Séances',ICO.ticket],['stats','Stats',ICO.stats],['set','Réglages',ICO.gear]];
  return '<nav class="nav" aria-label="Navigation principale">'+tabs.map(function(t){return '<button data-act="tab" data-v="'+t[0]+'"'+(ui.tab===t[0]?' aria-current="page"':'')+'>'+t[2]+t[1]+'</button>';}).join('')+'</nav>';
}

function sessionItem(s){
  var meta=[shortDate(s.date)];if(s.time)meta.push(s.time.replace(':','h'));if(s.room)meta.push(/^\d+$/.test(s.room)?'Salle '+s.room:s.room);else if(s.cinema)meta.push(s.cinema);
  var ex=sessionExtra(s);
  return '<button class="item" data-act="edit" data-v="'+esc(s.id)+'">'+posterHTML(s.title,s.poster)+
    '<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px"><span style="font-size:15px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(s.title)+'</span>'+
    '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span class="chip">'+esc(TECH[s.tech].chip)+'</span><span style="font-size:12px" class="mut">'+esc(meta.join(' · '))+'</span></div></div>'+
    '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0"><span style="font-size:15px;font-weight:700">'+eur(sessionValue(s))+'</span><span style="font-size:11px;'+(ex>0?'color:var(--neg)':'')+'" class="mut">'+(ex>0?eur(ex)+' payés':s.places+' place'+(s.places>1?'s':''))+'</span></div></button>';
}

function passSelector(ym){
  var cur=monthPass(ym),explicit=!!state.months[ym];
  return '<div style="display:flex;flex-direction:column;gap:8px"><div class="seg" role="group" aria-label="Formule de ce mois" style="grid-template-columns:repeat(5,minmax(0,1fr))">'+FORMULAS.map(function(p){return '<button data-act="setForm" data-v="'+p.id+'" aria-pressed="'+(cur.f===p.id)+'" style="font-size:12px;padding:0 2px">'+p.label+'</button>';}).join('')+'</div>'+
  (cur.f==='none'?'':'<button class="duo" data-act="toggleDuo" aria-pressed="'+!!cur.duo+'"><span class="sw" aria-hidden="true"><i></i></span><span style="flex:1;text-align:left"><strong>Option Duo</strong><span class="mut" style="font-size:12px;display:block">'+(cur.duo?'2 places couvertes':'1 place couverte, la 2<sup>e</sup> au plein tarif')+'</span></span><span class="mut" style="font-size:13px">+'+eur(priceAt('opt_duo',ym+'-28'))+'</span></button>')+
  (explicit?'':'<span style="font-size:11px" class="mut">Formule reprise du mois précédent · touchez pour la confirmer ou la changer</span>')+'</div>';
}

function viewHome(){
  var mi=monthInfo(ui.ym),y=+ui.ym.slice(0,4),yi=yearInfo(y),C=2*Math.PI*56,C2=2*Math.PI*40;
  var frac=Math.min(1,mi.ratio),over=Math.max(0,Math.min(1,mi.ratio-1));
  var big=mi.pass.f==='none'?'—':(mi.cost===0?'—':(mi.ratio>=1?'×'+mi.ratio.toFixed(1).replace('.',','):Math.round(mi.ratio*100)+' %'));
  var badge,detail;
  if(mi.pass.f==='none'){badge='<span class="badge no">Sans abonnement</span>';detail='Aucun abonnement ce mois-ci : vous payez vos places au prix réel.';}
  else if(mi.sub===0){badge='<span class="badge no">Prix à renseigner</span>';detail='Indiquez le prix du '+passLabel(mi.pass)+' dans Réglages.';}
  else if(mi.saving>=0&&mi.cross){var d=new Date(mi.cross.date+'T12:00:00');badge='<span class="badge ok">'+ICO.check+'Mois rentabilisé</span>';detail='Coût du mois ('+eur(mi.cost)+') couvert dès la '+(mi.cross.n===1?'1<sup>re</sup>':mi.cross.n+'<sup>e</sup>')+' séance, le '+d.getDate()+' '+MSHORT[d.getMonth()]+'.';}
  else{var rest=mi.cost-mi.value,n=Math.ceil(rest/curPrice('std')-0.0001);badge='<span class="badge no">Pas encore rentabilisé</span>';detail='Encore <strong style="color:var(--txt)">'+eur(rest)+'</strong> de places pour rentabiliser, soit environ '+n+' place'+(n>1?'s':'')+' Standard.';}

  var maxV=Math.max.apply(null,yi.months.map(function(m){return Math.max(m.v,m.cost);}).concat([60]));
  var H=56;
  var bars=yi.months.map(function(m,i){
    var h=m.v?Math.max(4,Math.round(m.v/maxV*H)):3,bg=!m.v?'var(--track)':(m.ok?'var(--acc)':(m.pass.f!=='none'?'var(--grey)':'var(--track2)'));
    var mark=m.cost>0&&m.pass.f!=='none'?'<i style="position:absolute;left:-2px;right:-2px;bottom:'+(18+Math.round(m.cost/maxV*H))+'px;border-top:2px solid var(--mut)"></i>':'';
    var cur=m.ym===ui.ym?';outline:2px solid var(--txt);outline-offset:2px':'';
    return '<button data-act="goMonth" data-v="'+m.ym+'" aria-label="'+cap(MONTHS[i])+' : '+eur(m.v)+' vus pour '+eur(m.cost)+' payés" style="position:relative;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;height:100%;background:none;border:none;padding:0;color:var(--mut)">'+mark+'<i style="display:block;width:100%;border-radius:4px;height:'+h+'px;background:'+bg+cur+'"></i><span style="font-size:10px">'+MINI[i]+'</span></button>';
  }).join('');
  var verdict;
  if(!yi.count)verdict='Aucun mois d’abonnement écoulé cette année.';
  else if(yi.saving>=0)verdict='Année rentabilisée : <strong class="acc">l’abonnement vaut le coup</strong>.';
  else verdict='Il manque <strong style="color:var(--neg)">'+eur(-yi.saving)+'</strong> pour rentabiliser l’année.';
  var tot=yi.budget+yi.extra,amort=tot?Math.round(yi.value/tot*100):0;
  var setupNote=!state.setup?'<button class="note warn" data-act="tab" data-v="set" style="text-align:left;width:100%">'+ICO.info+'<span>Choisissez la formule de chaque mois depuis janvier dans <strong style="color:var(--accT)">Réglages › Formule de chaque mois</strong>. Les tarifs CinéPass 2026 sont déjà chargés.</span></button>':'';
  var list=mi.list.length?mi.list.map(sessionItem).join(''):'<div class="empty"><span>Aucune séance en '+monthTitle(ui.ym)+'.</span></div>';

  return '<header class="top"><div><span class="eyebrow">'+esc(passLabel(mi.pass))+(mi.pass.f==='none'?'':' · '+(mi.sub?eur(mi.sub)+'/mois':'prix à renseigner'))+'</span><h1 class="disp h1">'+cap(monthTitle(ui.ym))+' <span class="acc">'+ui.ym.slice(0,4)+'</span></h1></div>'+
  '<div style="display:flex;gap:8px"><button class="ibtn" data-act="month" data-v="-1" aria-label="Mois précédent">'+ICO.left+'</button><button class="ibtn" data-act="month" data-v="1" aria-label="Mois suivant">'+ICO.rightW+'</button></div></header>'+
  '<main class="scroll">'+updateCard()+setupNote+soonCard()+passSelector(ui.ym)+
  '<section class="card" aria-label="Rentabilité du mois"><div style="display:flex;align-items:center;gap:18px">'+
    '<div style="position:relative;width:132px;height:132px;flex-shrink:0"><svg aria-hidden="true" width="132" height="132" viewBox="0 0 132 132"><circle cx="66" cy="66" r="56" fill="none" style="stroke:var(--track)" stroke-width="12"/>'+
    (frac>0?'<circle cx="66" cy="66" r="56" fill="none" stroke="#FFC20E" stroke-width="12" stroke-linecap="round" stroke-dasharray="'+(frac*C).toFixed(1)+' '+C.toFixed(1)+'" transform="rotate(-90 66 66)"/>':'')+
    (over>0?'<circle cx="66" cy="66" r="40" fill="none" stroke="#FFC20E" stroke-opacity=".38" stroke-width="6" stroke-linecap="round" stroke-dasharray="'+(over*C2).toFixed(1)+' '+C2.toFixed(1)+'" transform="rotate(-90 66 66)"/>':'')+
    '</svg><div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center"><span class="disp" style="font-size:40px;line-height:1;color:'+(mi.ratio>=1?'var(--accT)':'var(--txt)')+'">'+big+'</span><span style="font-size:11px" class="mut">rentabilité</span></div></div>'+
    '<div style="display:flex;flex-direction:column;gap:8px">'+badge+'<span style="font-size:13px;line-height:1.4" class="mut">'+detail+'</span></div></div>'+
    '<div class="grid3"><div class="tile"><span class="k">Valeur vue</span><span class="v">'+eur(mi.value)+'</span></div><div class="tile"><span class="k">Payé ce mois</span><span class="v">'+eur(mi.cost)+'</span></div><div class="tile"><span class="k">Économie</span><span class="v" style="color:'+(mi.saving>=0?'var(--accT)':'var(--neg)')+'">'+signed(mi.saving)+'</span></div></div>'+
    (mi.pass.f!=='none'||mi.extra>0?'<span style="font-size:12px;margin-top:-6px;line-height:1.4" class="mut">Payé = '+(mi.pass.f==='none'?'':eur(mi.parts.base)+' de formule'+(mi.parts.duo?' + '+eur(mi.parts.duo)+' d’option Duo':''))+(mi.extra>0?(mi.pass.f==='none'?'':' + ')+eur(mi.extra)+(mi.pass.f==='none'?' de places':' de suppléments et places hors abonnement'):'')+'</span>':'')+
  '</section>'+
  '<section class="card" aria-label="Bilan de l’année"><div class="sec-title"><h2 class="disp h2">Année '+y+'</h2><span style="font-size:12px" class="mut">'+yi.ok+' mois sur '+yi.count+' rentabilisé'+(yi.ok>1?'s':'')+'</span></div>'+
    '<div style="display:flex;align-items:flex-end;gap:6px;height:'+(H+28)+'px;position:relative;padding-top:6px">'+bars+'</div>'+
    '<div style="font-size:11px;display:flex;gap:6px;align-items:center" class="mut"><span aria-hidden="true" style="width:14px;border-top:2px solid var(--mut)"></span>coût du mois · touchez un mois pour l’ouvrir</div>'+
    '<div class="grid2"><div style="background:'+(yi.saving>=0?'var(--acc)':'var(--yearNeg)')+';color:'+(yi.saving>=0?'var(--ink)':'var(--txt)')+';border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:2px;min-width:0"><span style="font-size:11px;font-weight:600">Économies de l’année</span><span class="disp" style="font-size:26px;line-height:1.05;white-space:nowrap">'+signed(yi.saving)+'</span><span style="font-size:11px">'+eur(yi.value)+' vus · '+eur(yi.paid+yi.extra)+' payés</span></div>'+
    '<div style="background:var(--deep);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:2px;min-width:0"><span style="font-size:11px;font-weight:600" class="mut">Budget annuel</span><span class="disp" style="font-size:26px;line-height:1.05;white-space:nowrap">'+eur(tot)+'</span><span style="font-size:11px" class="mut">'+eur(yi.budget)+' de pass'+(yi.extra?' + '+eur(yi.extra)+' en plus':'')+' · '+(amort>=100?'amorti':'amorti à '+amort+' %')+'</span></div></div>'+
    '<p style="margin:0;font-size:13px;line-height:1.45;background:var(--deep);border-radius:14px;padding:12px 14px">'+verdict+'</p></section>'+
  '<section aria-label="Séances du mois" style="display:flex;flex-direction:column;gap:10px"><div class="sec-title"><h2 class="disp h2">Séances du mois</h2><span style="font-size:12px" class="mut">'+mi.list.length+' séance'+(mi.list.length>1?'s':'')+' · '+mi.list.reduce(function(t,s){return t+s.places;},0)+' places</span></div>'+list+'</section>'+
  '</main><button class="fab" data-act="new">'+ICO.plus+'Ajouter une séance</button>'+navHTML();
}

/* ---------- Films ---------- */
function seenCounts(){var c={};state.sessions.forEach(function(s){var k=s.tmdb?'t'+s.tmdb:'n'+norm(s.title);c[k]=(c[k]||0)+1;});return c;}
function isSeen(f,seen){return seen['t'+f.id]||seen['n'+norm(f.t)]||0;}
function filmCard(f,seen){
  var b=posterBg(f.t,f.p,'w342'),n=isSeen(f,seen),w=state.watch[f.id],d=filmDate(f);
  return '<button class="pcard" data-act="film" data-v="'+f.id+'"><span class="pimg" style="'+b.style+'">'+(b.img?'':'<span>'+esc(initials(f.t))+'</span>')+(n?'<i class="seen">VU'+(n>1?' ×'+n:'')+'</i>':'')+(w?'<i class="wbadge" aria-label="attendu">'+ICO.starS+'</i>':'')+'</span><span class="pt">'+esc(f.t)+'</span><span class="ps">'+(d?frDate(d):'date inconnue')+'</span></button>';
}
function myFilms(){
  var map={},order=[];
  state.sessions.slice().sort(sortDesc).forEach(function(s){
    var k=s.tmdb?'t'+s.tmdb:'n'+norm(s.title);
    if(!map[k]){map[k]={k:k,title:s.title,poster:s.poster,tmdb:s.tmdb,n:0,places:0,value:0,last:s.date,genres:s.genres||[]};order.push(k);}
    var m=map[k];m.n++;m.places+=s.places;m.value+=sessionValue(s);if(!m.poster&&s.poster)m.poster=s.poster;
  });
  return order.map(function(k){return map[k];});
}
var filmsState={loading:false,err:null,results:null};
function seenFilter(films,seen){var m=ui.films.seen||'all';if(m==='all')return films;return films.filter(function(f){var n=isSeen(f,seen);return m==='seen'?n:!n;});}
function weekTitle(mon){var d=new Date(mon+'T12:00:00'),n=daysUntil(mon);return (n>=0&&n<7?'Cette semaine':n>=7&&n<14?'Semaine prochaine':'Semaine du '+d.getDate()+' '+MSHORT[d.getMonth()]);}
function agendaRow(f,seen){
  var d=filmDate(f),dd=d?new Date(d+'T12:00:00'):null,w=!!state.watch[f.id],n=isSeen(f,seen),g=genreNames(f).slice(0,2).join(' · ');
  return '<div class="arow"><button class="am" data-act="film" data-v="'+f.id+'"><span class="daychip">'+(dd?'<span>'+DAYS[dd.getDay()].replace('.','')+'</span><b>'+dd.getDate()+'</b><span>'+MSHORT[dd.getMonth()].replace('.','')+'</span>':'<span>?</span>')+'</span>'+posterHTML(f.t,f.p)+
  '<span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px"><span style="font-size:15px;font-weight:600;line-height:1.25">'+esc(f.t)+'</span><span style="font-size:12px" class="mut">'+esc(g||'Film')+(n?' · <strong class="acc">vu</strong>':'')+'</span></span></button>'+
  '<button class="star" data-act="watchToggle" data-v="'+f.id+'" aria-pressed="'+w+'" aria-label="'+(w?'Ne plus attendre ce film':'Me prévenir de la sortie')+'">'+(w?ICO.starF:ICO.starO)+'</button></div>';
}
function watchList(){return Object.keys(state.watch).map(function(k){return Object.assign({id:+k},state.watch[k]);}).sort(function(a,b){return (a.d||'9999')<(b.d||'9999')?-1:1;});}
/* modes d'affichage de l'onglet Films : affiches, liste, dates (mémorisés par menu) */
var VIEW_DEF={now:'grid',up:'date',watch:'list',mine:'list',person:'grid'};
function filmsView(t){var v=null;try{v=JSON.parse(lsGet('rentabpass-films-view')||'{}')[t];}catch(e){}return ['grid','list','date'].indexOf(v)>=0?v:VIEW_DEF[t];}
function setFilmsView(t,v){var o={};try{o=JSON.parse(lsGet('rentabpass-films-view')||'{}')||{};}catch(e){}o[t]=v;lsSet('rentabpass-films-view',JSON.stringify(o));}
var ICO_VIEW={
  grid:'<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="9" rx="1.5"/><rect x="3" y="15" width="7" height="6" rx="1.5"/><rect x="14" y="15" width="7" height="6" rx="1.5"/></svg>',
  list:'<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="5" height="6" rx="1"/><rect x="3" y="14" width="5" height="6" rx="1"/><path d="M11 6h10M11 9h6M11 16h10M11 19h6"/></svg>',
  date:'<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M7 14h2M11 14h2M15 14h2M7 17h2"/></svg>'
};
function viewToggle(t){var cur=filmsView(t);return '<div class="seg" role="group" aria-label="Affichage" style="grid-template-columns:repeat(3,44px);padding:3px;flex-shrink:0">'+[['grid','Affiches'],['list','Liste'],['date','Dates']].map(function(x){return '<button data-act="filmsView" data-v="'+x[0]+'" aria-pressed="'+(cur===x[0])+'" aria-label="'+x[1]+'" title="'+x[1]+'" style="height:36px;display:flex;align-items:center;justify-content:center;padding:0">'+ICO_VIEW[x[0]]+'</button>';}).join('')+'</div>';}
/* éléments communs : {act,v,title,poster,date,line,badge,star(id|null),seen} */
function itemsFromFilms(films,seen){return films.map(function(f){var n=isSeen(f,seen),g=genreNames(f).slice(0,2).join(' · ');return {act:'film',v:f.id,title:f.t,poster:f.p,date:filmDate(f),line:esc(g||'Film')+(n?' · <strong class="acc">vu'+(n>1?' ×'+n:'')+'</strong>':''),seen:n,star:f.id};});}
function renderItems(items,mode,asc,byYear){
  if(mode==='grid')return '<div class="pgrid">'+items.map(function(it){var b=posterBg(it.title,it.poster,'w342');return '<button class="pcard" data-act="'+it.act+'" data-v="'+esc(it.v)+'"><span class="pimg" style="'+b.style+'">'+(b.img?'':'<span>'+esc(initials(it.title))+'</span>')+(it.seen?'<i class="seen">VU'+(it.seen>1?' ×'+it.seen:'')+'</i>':'')+(it.star&&state.watch[it.star]?'<i class="wbadge" aria-label="attendu">'+ICO.starS+'</i>':'')+'</span><span class="pt">'+esc(it.title)+'</span><span class="ps">'+(it.badge?it.badge:(it.date?frDate(it.date):'date inconnue'))+'</span></button>';}).join('')+'</div>';
  function row(it,withChip){
    var dd=it.date?new Date(it.date+'T12:00:00'):null,w=it.star&&!!state.watch[it.star];
    return '<div class="arow"><button class="am" data-act="'+it.act+'" data-v="'+esc(it.v)+'">'+(withChip?'<span class="daychip">'+(dd?'<span>'+DAYS[dd.getDay()].replace('.','')+'</span><b>'+dd.getDate()+'</b><span>'+MSHORT[dd.getMonth()].replace('.','')+'</span>':'<span>?</span>')+'</span>':'')+posterHTML(it.title,it.poster)+
    '<span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px"><span style="font-size:15px;font-weight:600;line-height:1.25">'+esc(it.title)+'</span>'+(withChip?'':'<span style="font-size:12px" class="mut">'+(it.date?longDate(it.date):'Date inconnue')+'</span>')+'<span style="font-size:12px" class="mut">'+it.line+'</span>'+(it.badge?'<span style="font-size:12px;font-weight:700" class="'+(it.badgeAcc?'acc':'mut')+'">'+it.badge+'</span>':'')+'</span></button>'+
    (it.star?'<button class="star" data-act="watchToggle" data-v="'+it.star+'" aria-pressed="'+w+'" aria-label="'+(w?'Ne plus attendre ce film':'Me prévenir de la sortie')+'">'+(w?ICO.starF:ICO.starO)+'</button>':(it.right||''))+'</div>';
  }
  if(mode==='list')return '<div style="display:flex;flex-direction:column;gap:8px">'+items.map(function(it){return row(it,false);}).join('')+'</div>';
  var sorted=items.slice().sort(function(a,b){var x=a.date||(asc?'9999':'0000'),y=b.date||(asc?'9999':'0000');return asc?(x<y?-1:x>y?1:0):(x<y?1:x>y?-1:0);});
  var groups=[],cur=null;
  sorted.forEach(function(it){var wk=it.date?(byYear?it.date.slice(0,4):mondayOf(it.date)):'?';if(!cur||cur.wk!==wk){cur={wk:wk,items:[]};groups.push(cur);}cur.items.push(it);});
  return groups.map(function(g){return '<section style="display:flex;flex-direction:column;gap:8px"><h2 class="lbl">'+(g.wk==='?'?'Date inconnue':byYear?g.wk:weekTitle(g.wk))+' <span style="text-transform:none;letter-spacing:0;font-weight:500">· '+g.items.length+' film'+(g.items.length>1?'s':'')+'</span></h2>'+g.items.map(function(it){return row(it,true);}).join('')+'</section>';}).join('');
}
function viewFilms(){
  if(['now','up','watch'].indexOf(ui.films.tab)<0)ui.films.tab='now';
  var t=ui.films.tab,seen=seenCounts(),body='',m=ui.films.seen||'all',mode=filmsView(t);
  var tabs='<div class="seg" role="group" aria-label="Catalogue" style="grid-template-columns:repeat(3,minmax(0,1fr))">'+[['now','À l’affiche'],['up','Prochainement'],['watch','Attendus']].map(function(x){return '<button data-act="filmsTab" data-v="'+x[0]+'" aria-pressed="'+(t===x[0])+'" style="font-size:12px;padding:0 2px">'+x[1]+'</button>';}).join('')+'</div>';
  /* filtre et affichage sur une même ligne : le filtre se rétrécit, et passe au-dessus si l'écran est trop étroit */
  var filt=(t==='now'||t==='up')?'<div class="seg" role="group" aria-label="Filtrer" style="flex:1 1 190px;min-width:0;grid-template-columns:repeat(3,minmax(0,1fr));padding:3px">'+[['all','Tous'],['unseen','Non vus'],['seen','Vus']].map(function(x){return '<button data-act="filmsSeen" data-v="'+x[0]+'" aria-pressed="'+(m===x[0])+'" style="height:36px;font-size:13px;padding:0 4px;white-space:nowrap">'+x[1]+'</button>';}).join('')+'</div>':'<span style="flex:1"></span>';
  var bar='<div style="display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap">'+filt+viewToggle(t)+'</div>';
  var search=(t==='watch')?'':'<form data-form="filmSearch" style="display:flex;align-items:center;gap:10px;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:0 6px 0 14px;height:48px">'+ICO.search+'<label for="fq" class="sr">Rechercher un film</label><input id="fq" data-in="fq" type="search" enterkeyhint="search" value="'+esc(ui.films.q)+'" placeholder="Rechercher dans la base de films" style="flex:1;background:transparent;border:none;font-size:16px;outline:none;min-width:0"></form>';
  var rq=listRange(t==='up'?'up':'now');
  var sub=t==='now'?'Sorties en France du '+frDate(rq.gte)+' à aujourd’hui':t==='up'?'Sorties à partir du '+frDate(rq.gte):'Vous serez prévenu de leur sortie';
  if(t==='watch'){
    var wl=watchList(),ns=notifStatus();
    var wi=wl.map(function(w){var n=w.d?daysUntil(w.d):null,lab=n===null?'date inconnue':n<0?'déjà sorti':n===0?'aujourd’hui':n===1?'demain':'dans '+n+' jours';var f=catalog.films[w.id];
      return {act:'film',v:w.id,title:w.t,poster:w.p,date:w.d,star:w.id,line:esc(f?genreNames(f).slice(0,2).join(' · ')||'Film':'Film'),badge:lab,badgeAcc:n!==null&&n>=0&&n<=7};});
    /* les films déjà sortis sont regroupés à part, dans une rubrique que l'on peut réduire */
    var today=todayISO(),wiUp=wi.filter(function(it){return !it.date||it.date>=today;}),wiOut=wi.filter(function(it){return it.date&&it.date<today;});
    var outOpen=lsGet('rentabpass-watch-out')==='open';
    var outBlock=wiOut.length?'<section style="display:flex;flex-direction:column;gap:8px"><button data-act="watchOutToggle" aria-expanded="'+outOpen+'" style="display:flex;align-items:center;gap:8px;background:none;border:none;padding:0;min-height:44px;text-align:left;color:var(--txt)"><h2 class="lbl" style="flex:1">Déjà sortis · '+wiOut.length+'</h2><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--mut);transform:rotate('+(outOpen?180:0)+'deg)"><path d="M6 9l6 6 6-6"/></svg></button>'+(outOpen?renderItems(wiOut,mode,false):'')+'</section>':'';
    body=(IS_APP&&wl.length&&ns==='denied'?'<button class="note warn" data-act="askNotif" style="width:100%;text-align:left">'+ICO.bell+'<span>Les notifications sont désactivées : touchez ici pour les activer et être prévenu des sorties.</span></button>':'')+
    (wiUp.length?renderItems(wiUp,mode,true):(wiOut.length?'':'<div class="empty"><span>Aucun film attendu. Dans <strong style="color:var(--txt)">Prochainement</strong>, touchez l’étoile d’un film pour être prévenu de sa sortie.</span></div>'))+
    (wiUp.length===0&&wiOut.length?'<div class="empty"><span>Aucun film attendu à venir.</span></div>':'')+outBlock;
  }else{
    var hasQ=!!ui.films.q.trim();
    if(!CAN_TMDB||!tmdbKey()){
      body='<div class="empty"><span>'+esc(tmdbErr(CAN_TMDB?'nokey':'web'))+'</span>'+(CAN_TMDB?'<button class="btn sm" data-act="tab" data-v="set" style="width:auto;padding:0 18px">Ouvrir Réglages</button>':'')+'</div>';
    }else if(filmsState.loading){body='<div class="empty"><span>Chargement des films…</span></div>';}
    else if(filmsState.err){body='<div class="empty"><span>'+esc(tmdbErr(filmsState.err))+'</span><button class="btn sm ghost" data-act="filmsRetry" style="width:auto;padding:0 18px">Réessayer</button></div>';}
    else{
      var ids=hasQ&&filmsState.results?filmsState.results:((catalog.lists[t]||{}).ids||[]);
      var films=seenFilter(ids.map(function(i){return catalog.films[i];}).filter(Boolean),seen);
      if(!films.length)body='<div class="empty"><span>'+(hasQ?'Aucun film trouvé.':m!=='all'?'Aucun film dans ce filtre.':'Aucun film pour l’instant.')+'</span></div>';
      else if(mode==='grid'&&t==='now'&&!hasQ){
        var gm=[],cm=null;
        films.forEach(function(f){var ym=ymOf(filmDate(f));if(!cm||cm.ym!==ym){cm={ym:ym,items:[]};gm.push(cm);}cm.items.push(f);});
        body=gm.map(function(g){return '<section style="display:flex;flex-direction:column;gap:10px"><h2 class="lbl">Sortis en '+monthTitle(g.ym)+' '+g.ym.slice(0,4)+'</h2>'+renderItems(itemsFromFilms(g.items,seen),'grid')+'</section>';}).join('');
      }else body=renderItems(itemsFromFilms(films,seen),mode,t==='up');
      if(!hasQ&&catalog.lists[t])body+='<button data-act="filmsRetry" style="background:none;border:none;color:var(--mut);font-size:12px;padding:6px;min-height:44px">Mis à jour '+new Date(catalog.lists[t].at).toLocaleString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})+' · actualiser</button>';
    }
  }
  return '<header class="top"><div><span class="eyebrow">'+esc(sub)+'</span><h1 class="disp h1">Films</h1></div></header>'+
  '<main class="scroll">'+tabs+bar+search+body+(CAN_TMDB?'<p style="margin:0;font-size:11px;text-align:center" class="mut">Données et affiches : TMDB. Ce produit utilise l’API TMDB sans être approuvé ni certifié par TMDB.</p>':'')+'</main>'+navHTML();
}
function ensureFilms(force){
  var t=ui.films.tab;if(t!=='now'&&t!=='up')return;if(!CAN_TMDB||!tmdbKey())return;
  if(ui.films.q.trim())return;
  var L=catalog.lists[t];if(!force&&L&&Date.now()-L.at<6*3600*1000&&L.day===todayISO()&&L.gte===listRange(t).gte&&L.v===LIST_V)return;
  filmsState.loading=!L;filmsState.err=null;if(!L)render();
  loadList(t,force).then(function(){filmsState.loading=false;if(ui.tab==='films')render();},function(e){filmsState.loading=false;if(!L)filmsState.err=e;else toast(tmdbErr(e));if(ui.tab==='films')render();});
}
var searchT=null;
function runFilmSearch(){
  var q=ui.films.q.trim();if(!q){filmsState.results=null;render();return;}
  if(!CAN_TMDB||!tmdbKey())return;
  filmsState.loading=true;filmsState.err=null;render();
  loadGenres().catch(noop).then(function(){return tmdb('/search/movie',{query:q,region:'FR',include_adult:'false'});}).then(function(r){
    filmsState.results=(r.results||[]).map(storeFilm).filter(Boolean).map(function(f){return f.id;});saveCatalog();filmsState.loading=false;if(ui.tab==='films')render();
  },function(e){filmsState.loading=false;filmsState.err=e;if(ui.tab==='films')render();});
}
function personBtn(p,role){return '<button class="pill" data-act="person" data-v="'+p.id+'|'+role+'|'+esc(p.n)+'" style="height:36px;font-size:13px">'+esc(p.n)+'</button>';}
function creditsHTML(f){
  if(!f.cr)return CAN_TMDB&&tmdbKey()?'<p class="mut" style="margin:0;font-size:12px">Chargement du générique…</p>':'';
  var h='';
  if(f.dir&&f.dir.length)h+='<div style="display:flex;flex-direction:column;gap:6px"><span class="lbl" style="font-size:11px">Réalisation</span><div style="display:flex;gap:6px;flex-wrap:wrap">'+f.dir.map(function(p){return personBtn(p,'dir');}).join('')+'</div></div>';
  if(f.cast&&f.cast.length)h+='<div style="display:flex;flex-direction:column;gap:6px"><span class="lbl" style="font-size:11px">Avec</span><div style="display:flex;gap:6px;flex-wrap:wrap">'+f.cast.map(function(p){return personBtn(p,'act');}).join('')+'</div></div>';
  return h;
}
function trailerHTML(f){
  if(!f.vid)return '';
  var k=encodeURIComponent(f.vid.k),label='Bande-annonce'+(f.vid.fr?' (VF)':' (VO)'),link='<a href="https://www.youtube.com/watch?v='+k+'" target="_blank" rel="noopener noreferrer" class="btn sm ghost" style="text-decoration:none">▶ '+label+(IS_WEB?' sur YouTube':'')+'</a>';
  if(!IS_WEB)return link;
  return '<div style="display:flex;flex-direction:column;gap:8px"><span class="lbl" style="font-size:11px">'+label+'</span><div style="position:relative;width:100%;aspect-ratio:16/9;border-radius:14px;overflow:hidden;background:#000"><iframe src="https://www.youtube-nocookie.com/embed/'+k+'?hl=fr&cc_lang_pref=fr&rel=0&playsinline=1" title="'+esc(label)+'" style="position:absolute;inset:0;width:100%;height:100%;border:0" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" loading="lazy"></iframe></div>'+link+'</div>';
}
function sheetFilmHTML(){
  var id=ui.sheet.id,w=state.watch[id],f=catalog.films[id]||(w?{id:id,t:w.t,p:w.p,d:w.d,fr:w.d,g:[],o:''}:null);if(!f)return '';
  var seen=state.sessions.filter(function(s){return s.tmdb===f.id||(!s.tmdb&&norm(s.title)===norm(f.t));}).sort(sortDesc);
  var d=filmDate(f),meta=[d?'Sortie en France le '+longDate(d):null,f.rt?Math.floor(f.rt/60)+' h '+pad(f.rt%60):null,f.v?f.v.toFixed(1).replace('.',',')+'/10':null].filter(Boolean).join(' · ');
  var n=d?daysUntil(d):null;
  return '<div class="sheet" role="dialog" aria-label="'+esc(f.t)+'"><span class="handle" aria-hidden="true"></span>'+backBar()+
  '<div style="display:flex;gap:14px;align-items:flex-start">'+posterHTML(f.t,f.p,true)+'<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:6px"><h2 class="disp" style="margin:0;font-size:30px;line-height:1">'+esc(f.t)+'</h2>'+(f.ot&&f.ot!==f.t?'<span style="font-size:12px" class="mut">'+esc(f.ot)+'</span>':'')+'<span style="font-size:12px" class="mut">'+esc(meta)+'</span>'+(genreNames(f).length?'<span style="font-size:12px" class="acc">'+esc(genreNames(f).join(' · '))+'</span>':'')+(n!==null&&n>0?'<span class="badge no" style="margin-top:2px">Sort dans '+n+' jour'+(n>1?'s':'')+'</span>':'')+'</div></div>'+
  (f.o?'<p style="margin:0;font-size:14px;line-height:1.5;color:var(--soft2)">'+esc(f.o)+'</p>':'')+
  creditsHTML(f)+trailerHTML(f)+
  '<button class="duo" data-act="watchToggle" data-v="'+f.id+'" aria-pressed="'+!!w+'"><span class="sw" aria-hidden="true"><i></i></span><span style="flex:1;text-align:left"><strong>Film attendu</strong><span class="mut" style="font-size:12px;display:block">'+(w?'Vous serez prévenu de sa sortie':'Recevoir une alerte avant sa sortie')+'</span></span></button>'+
  (seen.length?'<div class="tl"><span class="lbl" style="font-size:11px;padding-bottom:8px">Vu '+seen.length+' fois</span>'+seen.map(function(s){return '<div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0"><span>'+shortDate(s.date)+' '+s.date.slice(0,4)+' · '+esc(TECH[s.tech].label)+' · '+s.places+' pl.</span><span style="font-weight:700">'+eur(sessionValue(s))+'</span></div>';}).join('')+'</div>':'')+
  '<div class="grid2"><button class="btn ghost" data-act="closeSheet">Fermer</button><button class="btn" data-act="seenFilm" data-v="'+f.id+'">'+ICO.plus+'J’ai vu ce film</button></div></div>';
}

/* ---------- mises à jour de l'application (GitHub) ---------- */
var LSG='rentabpass-github',update={avail:null,checking:false,progress:null,msg:''};
function ghConf(){var c={};try{c=JSON.parse(lsGet(LSG)||'{}')||{};}catch(e){}return {repo:c.repo||'stephaneee/rentabpass',last:c.last||0};}
function ghSave(c){lsSet(LSG,JSON.stringify({repo:c.repo,last:c.last}));}
function canUpdate(){return BRIDGE&&typeof BRIDGE.githubGet==='function'&&typeof BRIDGE.installUpdate==='function';}
function appVersion(){try{return +BRIDGE.appVersion()||0;}catch(e){return 0;}}
function github(path){
  return new Promise(function(ok,ko){
    var c=ghConf(),id='g'+(++httpSeq);httpWait[id]={ok:ok,ko:ko};
    setTimeout(function(){if(httpWait[id]){delete httpWait[id];ko('timeout');}},15000);
    try{BRIDGE.githubGet(id,'https://api.github.com'+path,'');}catch(e){delete httpWait[id];ko('bridge');}
  });
}
function checkUpdate(manual,popup){
  if(!canUpdate()||update.checking)return;
  var c=ghConf();if(!/^[\w.-]+\/[\w.-]+$/.test(c.repo)){if(manual)toast('Nom du dépôt invalide');return;}
  update.checking=true;if(manual)render();
  github('/repos/'+c.repo+'/releases/latest').then(function(r){
    update.checking=false;c.last=Date.now();ghSave(c);
    var n=+((String(r.tag_name||'').match(/(\d+)\s*$/)||[])[1]||0),cur=appVersion();
    var asset=(r.assets||[]).filter(function(a){return /\.apk$/i.test(a.name||'');})[0];
    if(n>cur&&asset){
      update.avail={n:n,tag:String(r.tag_name),url:String(asset.url),date:String(r.published_at||'').slice(0,10),notes:String(r.body||'').slice(0,600)};
      if(manual)toast('Version 1.0.'+n+' disponible');
      if(popup&&!ui.sheet&&ui.tab!=='form'&&update.shown!==n){update.shown=n;ui.sheet={kind:'update'};}
    }
    else{update.avail=null;if(manual)toast('Vous avez déjà la dernière version (1.0.'+cur+')');}
    render();
  },function(e){
    update.checking=false;
    if(manual)toast(e===401||e===403?'Jeton GitHub refusé : vérifiez-le':e===404?'Dépôt ou version introuvable (dépôt privé : jeton nécessaire)':'GitHub injoignable, réessayez plus tard');
    render();
  });
}
window.rpUpdate=function(st,v){
  if(st==='progress'){update.progress=+v;var e=document.getElementById('updprog');if(e)e.textContent='Téléchargement… '+v+' %';return;}
  if(st==='done'){update.progress=null;toast('Téléchargé : confirmez l’installation');render();return;}
  update.progress=null;toast(v==='installer'?'Impossible d’ouvrir l’installateur Android':'Échec du téléchargement de la mise à jour');render();
};
function sheetUpdateHTML(){
  var u=update.avail;if(!u)return '';
  return '<div class="sheet" role="dialog" aria-label="Mise à jour disponible"><span class="handle" aria-hidden="true"></span>'+
  '<div style="display:flex;gap:12px;align-items:center"><span class="badge ok">Nouveau</span><h2 class="disp" style="margin:0;font-size:28px">Version 1.0.'+u.n+'</h2></div>'+
  '<p style="margin:0;font-size:14px;line-height:1.5" class="mut">Une nouvelle version de Rentab’Pass est disponible'+(u.date?' depuis le '+frDate(u.date):'')+' (vous avez la 1.0.'+appVersion()+'). Vos données sont conservées.</p>'+
  '<div class="grid2"><button class="btn ghost" data-act="closeSheet">Plus tard</button><button class="btn" data-act="installUpdate">Mettre à jour</button></div></div>';
}
function updateCard(){
  if(!update.avail)return '';
  var u=update.avail;
  return '<section class="card" style="gap:10px;padding:16px;border-color:#5A4A1A" aria-label="Mise à jour disponible"><div style="display:flex;gap:12px;align-items:center"><span class="badge ok">Nouveau</span><span style="flex:1;font-size:14px"><strong>Version 1.0.'+u.n+'</strong> disponible'+(u.date?' <span class="mut">('+frDate(u.date)+')</span>':'')+'</span></div>'+
  (update.progress!==null?'<span id="updprog" class="mut" style="font-size:13px">Téléchargement… '+update.progress+' %</span>':'<button class="btn sm" data-act="installUpdate">Mettre à jour</button>')+'</section>';
}
function secretField(name,label,ph,id){
  var has=hasSecret(name);
  if(has&&ui.keyEdit!==name)return '<div class="field"><span style="font-size:12px" class="mut">'+label+'</span><div style="display:flex;gap:8px;align-items:center;background:var(--deep);border:1px solid var(--line2);border-radius:12px;padding:6px 6px 6px 12px">'+ICO.lock+'<span style="flex:1;font-size:13px">Enregistrée et chiffrée sur cet appareil</span><button class="btn sm ghost" data-act="keyEdit" data-v="'+name+'" style="width:auto;padding:0 12px;height:38px">Remplacer</button><button class="btn sm danger" data-act="keyDel" data-v="'+name+'" style="width:auto;padding:0 12px;height:38px">Supprimer</button></div></div>';
  return '<div class="field"><label for="'+id+'">'+label+'</label><input id="'+id+'" class="inp" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" value="" placeholder="'+(has?'Nouvelle valeur':ph)+'"></div>';
}
function updateSection(){
  if(!canUpdate())return '';
  var c=ghConf(),cur=appVersion();
  return '<section style="display:flex;flex-direction:column;gap:10px"><h2 class="lbl">Mises à jour</h2>'+
  '<div class="tile" style="flex-direction:row;justify-content:space-between;align-items:center"><span class="k" style="font-size:13px">Version installée</span><span class="v">1.0.'+cur+'</span></div>'+
  '<div class="field"><label for="ghrepo">Dépôt GitHub</label><input id="ghrepo" class="inp" autocomplete="off" value="'+esc(c.repo)+'"></div>'+
  secretField('github','Jeton GitHub (lecture seule)','github_pat_…','ghtoken')+
  '<button class="btn sm" data-act="ghSave">'+(update.checking?'Vérification…':'Enregistrer et vérifier')+'</button>'+
  (update.avail?updateCard():'')+
  '<p class="note">'+ICO.info+'<span>L’application vérifie à chaque lancement (et au retour dans l’application, toutes les 30 minutes au plus) si une nouvelle version a été publiée sur votre GitHub, et vous propose de l’installer. Vos données sont conservées.</span></p></section>';
}

/* ---------- films attendus et alertes ---------- */
var LSA='rentabpass-alerts';
function notifStatus(){if(!BRIDGE||typeof BRIDGE.notifStatus!=='function')return 'none';try{return BRIDGE.notifStatus();}catch(e){return 'none';}}
function syncAlerts(){
  if(!BRIDGE||typeof BRIDGE.scheduleAlert!=='function')return;
  var prev=[];try{prev=JSON.parse(lsGet(LSA)||'[]');}catch(e){}
  prev.forEach(function(id){try{BRIDGE.cancelAlert(id);}catch(e){}});
  var now=Date.now(),ids=[],lead=state.alertLead||0;
  Object.keys(state.watch).forEach(function(k){
    var w=state.watch[k],id=+k;if(!w.d||!(id>0))return;
    var day=new Date(w.d+'T10:00:00').getTime();
    try{
      if(day>now){BRIDGE.scheduleAlert(id*4,'Sortie aujourd’hui : '+w.t,'Le film que vous attendiez est en salle.',day);ids.push(id*4);}
      if(lead>0){var pre=day-lead*86400000;if(pre>now){BRIDGE.scheduleAlert(id*4+1,w.t+(lead===1?' sort demain':' sort dans '+lead+' jours'),'Sortie le '+longDate(w.d)+'. Pensez à réserver votre séance.',pre);ids.push(id*4+1);}}
    }catch(e){}
  });
  lsSet(LSA,JSON.stringify(ids));
}
/* un film attendu que l'on a vu quitte la liste des attendus */
function cleanWatch(){
  var seenT={},seenN={},changed=false;state.sessions.forEach(function(s){if(s.tmdb)seenT[s.tmdb]=1;seenN[norm(s.title)]=1;});
  Object.keys(state.watch).forEach(function(k){var w=state.watch[k];if(seenT[k]||seenN[norm(w.t)]){delete state.watch[k];changed=true;}});
  return changed;
}
function watchToggle(id){
  if(state.watch[id]){delete state.watch[id];persist();syncAlerts();toast('Retiré des films attendus');return;}
  var f=catalog.films[id];if(!f)return;
  state.watch[id]={t:f.t,p:f.p||null,d:filmDate(f),added:todayISO()};persist();syncAlerts();
  toast(filmDate(f)?'Alerte programmée pour le '+frDate(filmDate(f)):'Film ajouté aux attendus');
  if(IS_APP&&notifStatus()==='denied'){try{BRIDGE.askNotif();}catch(e){}}
  if(CAN_TMDB&&tmdbKey()&&!f.frc){frDateFor(id).then(function(d){if(state.watch[id]&&d&&d!==state.watch[id].d){state.watch[id].d=d;persist();syncAlerts();render();}},noop);}
}
function refreshWatchDates(){
  if(!CAN_TMDB||!tmdbKey())return;
  var t=todayISO(),ids=Object.keys(state.watch).filter(function(k){var w=state.watch[k];return !w.d||w.d>=t;}).map(Number),changed=false;
  pool(ids,3,function(id){return frDateFor(id).then(function(d){if(d&&state.watch[id]&&state.watch[id].d!==d){state.watch[id].d=d;changed=true;}});}).then(function(){saveCatalog();if(changed){persist();render();}syncAlerts();});
}
function soonCard(){
  var t=todayISO(),cur=ymOf(t);if(ui.ym!==cur)return '';
  var l=watchList().filter(function(w){return w.d&&w.d>=t&&ymOf(w.d)===cur;});
  if(!l.length)return '';
  var closed=lsGet('rentabpass-soon')===cur;
  var head='<div class="sec-title" style="align-items:center"><button data-act="soonToggle" aria-expanded="'+!closed+'" style="flex:1;display:flex;align-items:center;gap:8px;background:none;border:none;padding:0;min-height:44px;text-align:left"><h2 class="disp h2" style="font-size:22px">Bientôt en salle</h2><span class="badge no" style="align-self:center">'+l.length+'</span><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A6A6AD" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate('+(closed?0:180)+'deg);transition:transform .2s"><path d="M6 9l6 6 6-6"/></svg></button><button data-act="goWatch" style="background:none;border:none;color:var(--accT);font-size:12px;font-weight:600;min-height:44px">Mes attendus ›</button></div>';
  if(closed)return '<section class="card" style="gap:0;padding:6px 16px" aria-label="Bientôt en salle">'+head+'</section>';
  return '<section class="card" style="gap:10px;padding:16px" aria-label="Bientôt en salle">'+head+
  l.slice(0,6).map(function(w){var n=daysUntil(w.d);return '<button class="row" style="min-height:70px;padding:0;gap:12px" data-act="film" data-v="'+w.id+'">'+posterHTML(w.t,w.p)+'<span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px"><span style="font-weight:600;font-size:14px">'+esc(w.t)+'</span><span class="mut" style="font-size:12px">'+longDate(w.d)+'</span></span><span class="badge '+(n===0?'ok':'no')+'">'+(n===0?'Aujourd’hui':n===1?'Demain':'J-'+n)+'</span></button>';}).join('')+'</section>';
}
function notifSection(){
  if(!IS_APP)return '';
  var st=notifStatus(),lead=state.alertLead||0;
  if(st==='none')return '<section style="display:flex;flex-direction:column;gap:10px"><h2 class="lbl">Alertes de sortie</h2><p class="note">'+ICO.bell+'<span>Les alertes arriveront avec la prochaine version de l’APK. Vos films attendus sont déjà enregistrés.</span></p></section>';
  return '<section style="display:flex;flex-direction:column;gap:10px"><h2 class="lbl">Alertes de sortie</h2><div class="list"><div class="row" style="cursor:default"><span style="flex:1;display:flex;flex-direction:column;gap:2px"><span style="font-size:15px;font-weight:600">Notifications</span><span class="mut" style="font-size:12px">'+(st==='granted'?'Activées':'Désactivées')+' · '+Object.keys(state.watch).length+' film(s) attendu(s)</span></span>'+(st==='granted'?'<span class="badge ok">'+ICO.check+'OK</span>':'<button class="btn sm" data-act="askNotif" style="width:auto;padding:0 14px">Activer</button>')+'</div></div>'+
  '<span class="mut" style="font-size:12px">En plus du jour de sortie (à 10 h), me prévenir :</span><div class="seg" role="group" aria-label="Délai de l’alerte" style="grid-template-columns:repeat(4,minmax(0,1fr))">'+[[0,'Jour J'],[1,'La veille'],[3,'3 j avant'],[7,'7 j avant']].map(function(x){return '<button data-act="lead" data-v="'+x[0]+'" aria-pressed="'+(lead===x[0])+'" style="font-size:12px">'+x[1]+'</button>';}).join('')+'</div>'+
  '<p class="note">'+ICO.info+'<span>Sur Xiaomi : dans les informations de l’application, activez « Démarrage automatique » et réglez l’économiseur de batterie sur « Aucune restriction », sinon HyperOS peut retarder les alertes.</span></p>'+
  (BRIDGE&&typeof BRIDGE.openSettings==='function'?'<button class="btn sm ghost" data-act="openAppInfo">Ouvrir les informations de l’application</button>':'')+'</section>';
}

/* ---------- Séances ---------- */
function viewHist(){
  var q=norm(ui.q),all=state.sessions.filter(function(s){return !q||norm(s.title).indexOf(q)>=0||norm(s.room).indexOf(q)>=0;}).sort(sortDesc);
  var groups=[],cur=null;
  all.forEach(function(s){var ym=ymOf(s.date);if(!cur||cur.ym!==ym){cur={ym:ym,items:[]};groups.push(cur);}cur.items.push(s);});
  var body=groups.length?groups.map(function(g){
    var v=g.items.reduce(function(t,s){return t+sessionValue(s);},0);
    return '<section style="display:flex;flex-direction:column;gap:10px"><div class="sec-title"><h2 class="lbl">'+cap(monthTitle(g.ym))+' '+g.ym.slice(0,4)+' · '+esc(passShort(monthPass(g.ym)))+'</h2><span style="font-size:12px" class="mut">'+eur(v)+'</span></div>'+g.items.map(sessionItem).join('')+'</section>';
  }).join(''):'<div class="empty"><span>'+(q?'Aucune séance ne correspond.':'Aucune séance enregistrée pour l’instant.')+'</span>'+(q?'':'<button class="btn sm" data-act="new" style="width:auto;padding:0 18px">'+ICO.plus+'Ajouter une séance</button>')+'</div>';
  return '<header class="top"><div><span class="eyebrow">'+state.sessions.length+' séance'+(state.sessions.length>1?'s':'')+' au total</span><h1 class="disp h1">Mes séances</h1></div></header>'+
  '<main class="scroll"><div style="display:flex;align-items:center;gap:10px;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:0 14px;height:48px">'+ICO.search+'<label for="hq" class="sr">Rechercher</label><input id="hq" data-in="q" type="search" value="'+esc(ui.q)+'" placeholder="Rechercher un film, une salle" style="flex:1;background:transparent;border:none;font-size:16px;outline:none;min-width:0"></div>'+body+'</main>'+
  '<button class="fab" data-act="new">'+ICO.plus+'Ajouter une séance</button>'+navHTML();
}

/* ---------- Stats ---------- */
function viewStats(){
  /* années proposées : de la plus ancienne séance (au plus tard l'an dernier) à dans deux ans, ex. 2025 → 2028 */
  var y=ui.statsYear,cy=new Date().getFullYear(),y0=cy-1,ys=[];
  state.sessions.forEach(function(s){var a=+s.date.slice(0,4);if(a<y0)y0=a;});
  for(var a=y0;a<=cy+2;a++)ys.push(a);
  var list=state.sessions.filter(function(s){return +s.date.slice(0,4)===y;}),yi=yearInfo(y);
  var places=list.reduce(function(t,s){return t+s.places;},0);
  function block(title,rows,fmtV){
    if(!rows.length)return '';
    var max=Math.max.apply(null,rows.map(function(r){return r.n;}));
    return '<section class="card"><h2 class="disp h2">'+title+'</h2><div style="display:flex;flex-direction:column;gap:12px">'+rows.map(function(r){
      return '<div style="display:flex;flex-direction:column;gap:6px"><div style="display:flex;justify-content:space-between;gap:8px;font-size:14px"><span style="font-weight:600">'+esc(r.k)+'</span><span class="mut" style="white-space:nowrap">'+fmtV(r)+'</span></div><div class="hbar"><i style="width:'+(r.n/max*100).toFixed(1)+'%"></i></div></div>';
    }).join('')+'</div></section>';
  }
  function cnt(r){return r.n+' séance'+(r.n>1?'s':'');}
  var byTech=TECHS.map(function(t){var l=list.filter(function(s){return s.tech===t.id;});return {k:t.long||t.label,n:l.length,v:l.reduce(function(a,s){return a+sessionValue(s);},0)};}).filter(function(r){return r.n;}).sort(function(a,b){return b.n-a.n;});
  var gen={};list.forEach(function(s){(s.genres||[]).forEach(function(g){gen[g]=(gen[g]||0)+1;});});
  var byGenre=Object.keys(gen).map(function(k){return {k:k,n:gen[k]};}).sort(function(a,b){return b.n-a.n;}).slice(0,8);
  var slots=[['Matin (avant 12h)',0,12],['Après-midi (12h – 17h)',12,17],['Fin de journée (17h – 20h)',17,20],['Soirée (20h et après)',20,24]];
  var timed=list.filter(function(s){return s.time;});
  var bySlot=slots.map(function(sl){var l=timed.filter(function(s){var h=+s.time.slice(0,2);return h>=sl[1]&&h<sl[2];});return {k:sl[0],n:l.length};}).filter(function(r){return r.n;});
  var rooms={};list.forEach(function(s){if(s.room){var k=/^\d+$/.test(s.room)?'Salle '+s.room:s.room;rooms[k]=(rooms[k]||0)+1;}});
  var byRoom=Object.keys(rooms).map(function(k){return {k:k,n:rooms[k]};}).sort(function(a,b){return b.n-a.n;}).slice(0,6);
  var dow={};list.forEach(function(s){var d=new Date(s.date+'T12:00:00').getDay();dow[d]=(dow[d]||0)+1;});
  var DOWL=['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  var byDow=[1,2,3,4,5,6,0].map(function(d){return {k:DOWL[d],n:dow[d]||0};}).filter(function(r){return r.n;});
  var pc={};yi.months.forEach(function(m){if(m.elapsed&&m.pass.f!=='none'){var k=passLabel(m.pass);pc[k]=(pc[k]||0)+1;}});
  var byPass=Object.keys(pc).map(function(k){return {k:k,n:pc[k]};}).sort(function(a,b){return b.n-a.n;});
  var best=yi.months.filter(function(m){return m.elapsed&&m.pass.f!=='none'&&m.v;}).sort(function(a,b){return (b.v-b.cost)-(a.v-a.cost);})[0];
  var monthsRows=yi.months.filter(function(m){return m.elapsed||m.v;}).map(function(m){
    var s=m.v-m.cost;
    return '<button class="row" data-act="goMonthHome" data-v="'+m.ym+'" style="min-height:52px"><span style="flex:1;display:flex;flex-direction:column;gap:1px"><span style="font-size:14px;font-weight:600">'+cap(monthTitle(m.ym))+'</span><span style="font-size:11px" class="mut">'+esc(passShort(m.pass))+'</span></span><span style="font-size:12px;text-align:right" class="mut">'+eur(m.v)+'<br>payé '+eur(m.cost)+'</span><span style="font-size:14px;font-weight:700;min-width:84px;text-align:right;color:'+(m.pass.f==='none'?'var(--mut)':(s>=0?'var(--accT)':'var(--neg)'))+'">'+(m.pass.f==='none'?'—':signed(s))+'</span></button>';
  }).join('');
  return '<header class="top"><div><span class="eyebrow">Statistiques</span><h1 class="disp h1">Année <span class="acc">'+y+'</span></h1></div></header>'+
  '<main class="scroll"><div class="chips" role="group" aria-label="Année">'+ys.map(function(v){return '<button class="pill" data-act="statsYear" data-v="'+v+'" aria-pressed="'+(v===y)+'">'+v+'</button>';}).join('')+'</div>'+
  '<div class="grid2"><div class="tile"><span class="k">Séances</span><span class="v">'+list.length+'</span></div><div class="tile"><span class="k">Places</span><span class="v">'+places+'</span></div><div class="tile"><span class="k">Valeur des places</span><span class="v">'+eur(yi.value)+'</span></div><div class="tile"><span class="k">Économies</span><span class="v" style="color:'+(yi.saving>=0?'var(--accT)':'var(--neg)')+'">'+signed(yi.saving)+'</span></div><div class="tile"><span class="k">Abonnements payés</span><span class="v">'+eur(yi.paid)+'</span></div><div class="tile"><span class="k">Suppléments et hors pass</span><span class="v">'+eur(yi.extra)+'</span></div><div class="tile"><span class="k">Prix moyen d’une place</span><span class="v">'+(places?eur(yi.value/places):'—')+'</span></div><div class="tile"><span class="k">Coût réel par place</span><span class="v">'+(places?eur((yi.paid+yi.extra)/places):'—')+'</span></div></div>'+
  (best?'<p class="note">'+ICO.star+'<span>Meilleur mois : <strong style="color:var(--txt)">'+cap(monthTitle(best.ym))+'</strong>, avec '+signed(best.v-best.cost)+' d’économie.</span></p>':'')+
  (monthsRows?'<section style="display:flex;flex-direction:column;gap:10px"><h2 class="lbl">Mois par mois</h2><div class="list">'+monthsRows+'</div></section>':'')+
  block('Formules utilisées',byPass,function(r){return r.n+' mois';})+
  block('Par technologie',byTech,function(r){return r.n+' · '+eur(r.v);})+
  block('Par genre',byGenre,cnt)+
  block('Horaires de séance',bySlot,cnt)+
  block('Jours préférés',byDow,cnt)+
  block('Salles les plus fréquentées',byRoom,cnt)+
  (!list.length?'<div class="empty"><span>Pas encore de séance en '+y+'.</span></div>':'')+
  '</main>'+navHTML();
}

/* ---------- Réglages ---------- */
function priceSince(id){var l=priceList(id),c=null,t=todayISO();l.forEach(function(e){if(e.from<=t)c=e;});c=c||l[0];return c.from===ORIGIN?'tarif initial':'depuis le '+frDate(c.from);}
function futurePrice(id){var t=todayISO();return priceList(id).filter(function(e){return e.from>t;})[0];}
function priceRow(id,suffix){
  var fut=futurePrice(id),v=curPrice(id),zero=false;
  return '<button class="row" data-act="price" data-v="'+id+'"><span style="flex:1;display:flex;flex-direction:column;gap:2px"><span style="font-size:15px;font-weight:600">'+PRICE_SHORT[id]+'</span><span style="font-size:12px" class="mut">'+priceSince(id)+(fut?' · '+eur(fut.p)+' dès le '+frDate(fut.from):'')+'</span></span><span style="font-size:16px;font-weight:700'+(zero?';color:var(--neg)':'')+'">'+(zero?'à renseigner':eur(v)+(suffix||''))+'</span>'+ICO.right+'</button>';
}
function viewSet(){
  var y=+ui.ym.slice(0,4);
  var mg=[];for(var m=1;m<=12;m++){var ym=y+'-'+pad(m),p=monthPass(ym);mg.push('<button data-act="passSheet" data-v="'+ym+'" aria-label="'+cap(MONTHS[m-1])+' : '+esc(passLabel(p))+'"'+(state.months[ym]?'':' style="border-style:dashed"')+'>'+cap(MSHORT[m-1])+'<span'+(p.f==='gold'?' class="acc"':'')+'>'+esc(passShort(p))+'</span></button>');}
  var syncTxt={online:'Synchronisée en ligne : vos données vous suivent sur vos appareils.',waiting:'Connexion en cours…',slow:'En ligne injoignable pour l’instant.',local:'Sur cet appareil uniquement.',web:'Stockées dans ce navigateur. Exportez une sauvegarde de temps en temps.',app:'Stockées sur ce téléphone. Exportez une sauvegarde de temps en temps (dossier Téléchargements).'}[syncMode];
  return '<header class="top"><div><span class="eyebrow">Paramètres</span><h1 class="disp h1">Réglages</h1></div></header>'+
  '<main class="scroll">'+
  '<section style="display:flex;flex-direction:column;gap:10px"><h2 class="lbl">Apparence</h2><div class="seg" role="group" aria-label="Thème" style="grid-template-columns:repeat(3,minmax(0,1fr))">'+[['dark','Sombre'],['light','Clair'],['auto','Automatique']].map(function(x){return '<button data-act="theme" data-v="'+x[0]+'" aria-pressed="'+(themePref()===x[0])+'">'+x[1]+'</button>';}).join('')+'</div>'+(themePref()==='auto'?'<span style="font-size:11px" class="mut">Suit le mode clair ou sombre du téléphone.</span>':'')+'</section>'+
  '<section style="display:flex;flex-direction:column;gap:10px"><div class="sec-title"><h2 class="lbl">Formule de chaque mois</h2><div style="display:flex;gap:6px;align-items:center"><button class="ibtn" style="width:36px;height:36px" data-act="month" data-v="-12" aria-label="Année précédente">'+ICO.left+'</button><span style="font-size:14px;font-weight:700">'+y+'</span><button class="ibtn" style="width:36px;height:36px" data-act="month" data-v="12" aria-label="Année suivante">'+ICO.rightW+'</button></div></div>'+
  '<div class="mgrid">'+mg.join('')+'</div><span style="font-size:11px" class="mut">Bordure pointillée : formule reprise du mois précédent.</span></section>'+
  '<section style="display:flex;flex-direction:column;gap:10px"><h2 class="lbl">Prix des formules CinéPass</h2><div class="list">'+PASS_IDS.map(function(i){return priceRow(i,'/mois');}).join('')+'</div>'+
  '<p class="note">'+ICO.info+'<span>Tarifs préchargés : grille de janvier 2026, puis nouvelle grille au 4 mai 2026. Vous bénéficiez d’une promotion (par exemple le Gold à 34,90 €) ? Ajoutez-la avec sa date : touchez la formule.</span></p></section>'+
  '<section style="display:flex;flex-direction:column;gap:10px"><h2 class="lbl">Prix réel d’une place</h2><div class="list">'+PLACE_IDS.map(function(i){return priceRow(i);}).join('')+'</div></section>'+
  '<section style="display:flex;flex-direction:column;gap:10px"><h2 class="lbl">Suppléments hors Gold</h2><div class="list">'+SUP_IDS.map(function(i){return priceRow(i);}).join('')+'</div>'+
  '<p class="note">'+ICO.info+'<span><strong style="color:var(--txt)">Sans option Duo</strong> : 1 place couverte, la 2<sup>e</sup> au plein tarif. <strong style="color:var(--txt)">Avec Duo</strong> : 2 places couvertes. <strong style="color:var(--txt)">-26, Classique, Silver</strong> : supplément IMAX / 4DX par place couverte, spectacles au plein tarif. <strong style="color:var(--txt)">Gold</strong> : tout inclus.</span></p>'+
  '<p class="note">'+ICO.lock+'<span>Chaque séance garde le prix en vigueur à sa date. Un nouveau tarif ne s’applique qu’à partir de sa date d’effet : vos stats passées restent exactes.</span></p></section>'+
  updateSection()+notifSection()+
  '<section style="display:flex;flex-direction:column;gap:10px"><h2 class="lbl">Base de films (TMDB)</h2>'+
  (CAN_TMDB?secretField('tmdb','Clé API TMDB','Collez votre clé ici','tmdbkey')+(hasSecret('tmdb')&&ui.keyEdit!=='tmdb'?'<button class="btn sm ghost" data-act="saveKey">Tester la connexion</button>':'<button class="btn sm" data-act="saveKey">Valider</button>')+
  '<p class="note">'+ICO.info+'<span>Créez un compte gratuit sur themoviedb.org, puis Paramètres › API › demander une clé « Developer ». Collez la « Clé d’API » ou le « Jeton d’accès en lecture ».</span></p>'+
  '<p style="margin:0;font-size:11px" class="mut">Ce produit utilise l’API TMDB sans être approuvé ni certifié par TMDB.</p>'
  :'<p class="note">'+ICO.info+'<span>La liste des films à l’affiche et la recherche dans la base de films sont disponibles dans l’application Android et sur le site Rentab’Pass.</span></p>')+'</section>'+
  '<section style="display:flex;flex-direction:column;gap:10px"><h2 class="lbl">Sauvegarde et export</h2><p style="margin:0;font-size:13px;display:flex;gap:8px;align-items:center" class="mut">'+ICO.cloud+esc(syncTxt)+'</p>'+
  '<div class="grid2"><button class="btn sm ghost" data-act="export">Sauvegarde</button><button class="btn sm ghost" data-act="exportCsv">Tableau Excel (CSV)</button></div>'+
  '<div class="grid2">'+(BRIDGE&&typeof BRIDGE.pickText==='function'?'<button class="btn sm ghost" data-act="pickImport">Importer un fichier</button>':'<label class="btn sm ghost" style="cursor:pointer" for="importfile">Importer un fichier</label>')+'<button class="btn sm ghost" data-act="pasteSheet">Coller un texte</button></div><input id="importfile" type="file" accept="application/json,.json,text/plain,*/*" class="sr" data-file="import"></section>'+
  '<p style="margin:0;font-size:12px;text-align:center;line-height:1.6" class="mut">Rentab’Pass '+(canUpdate()?'1.0.'+appVersion():'version web')+' · Copyright : Stanji<br>Application personnelle, sans lien avec l’exploitant des cinémas.</p>'+
  '</main>'+navHTML();
}

/* ---------- formulaire séance ---------- */
function newForm(){return {id:null,title:'',tech:'std',places:2,date:todayISO(),time:'',room:'',tmdb:null,poster:null,genres:[]};}
function formUnit(f){
  if(f.id){var o=state.sessions.find(function(s){return s.id===f.id;});if(o&&o.tech===f.tech&&o.date===f.date)return o.unit;}
  return priceAt(f.tech,f.date||todayISO());
}
function localSuggestions(q){
  var seen={},out=[],nq=norm(q);
  state.sessions.slice().sort(sortDesc).forEach(function(s){var k=norm(s.title);if(seen[k])return;seen[k]=1;if(!nq||(k.indexOf(nq)>=0&&k!==nq))out.push({title:s.title,tmdb:s.tmdb,poster:s.poster,genres:s.genres||[],src:'mine'});});
  return out.slice(0,4);
}
var formRemote=[],formSearchT=null,formSearchQ='';
/* propositions de la saisie : jamais de film déjà vu.
   Sans titre : le film du moment le mieux noté + 2 films attendus déjà sortis, les plus proches d'aujourd'hui.
   En tapant : résultats de la base de films, sans les films déjà vus. */
function seenFilm(id,title){return state.sessions.some(function(s){return (id&&s.tmdb===id)||norm(s.title)===norm(title);});}
function sugItem(x,label){return {title:x.t,tmdb:x.id,poster:x.p,genres:genreNames(x),label:label};}
function defaultSuggestions(){
  var out=[],t=todayISO(),from=addDays(t,-35);
  if(CAN_TMDB&&tmdbKey()&&catalog.lists.now){
    var best=(catalog.lists.now.ids||[]).map(function(id){return catalog.films[id];}).filter(function(x){
      var d=filmDate(x);return x&&langOk(x)&&d&&d>=from&&d<=t&&(x.vc===undefined||x.vc>=15)&&!seenFilm(x.id,x.t);
    }).sort(function(a,b){return (b.v||0)-(a.v||0);})[0];
    if(best)out.push(sugItem(best,'Le mieux noté du moment'+(best.v?' · '+best.v.toFixed(1).replace('.',',')+'/10':'')));
  }
  watchList().filter(function(w){return w.d&&w.d<=t&&!seenFilm(w.id,w.t);}).sort(function(a,b){return a.d<b.d?1:-1;}).slice(0,2).forEach(function(w){
    var x=catalog.films[w.id]||{id:w.id,t:w.t,p:w.p,g:[]};out.push(sugItem(x,'Attendu · sorti le '+frDate(w.d)));
  });
  return out;
}
function suggHTML(){
  var f=ui.form,all;
  if(f.tmdb)all=[];
  else if(!f.title.trim())all=defaultSuggestions();
  else all=formRemote.map(function(id){return catalog.films[id];}).filter(function(x){return x&&!seenFilm(x.id,x.t);}).slice(0,5).map(function(x){return sugItem(x,'base de films'+((x.d||'').slice(0,4)?' · '+(x.d||'').slice(0,4):''));});
  window.__sugg=all;
  return all.map(function(s,i){var b=posterBg(s.title,s.poster,'w92');return '<button data-act="fpick" data-v="'+i+'"><span class="thumb" style="'+b.style+'"></span><span style="flex:1;min-width:0"><span style="display:block;font-weight:600">'+esc(s.title)+'</span><span style="font-size:11px" class="mut">'+esc(s.label)+'</span></span></button>';}).join('');
}
function formSearch(){
  var q=ui.form.title.trim();clearTimeout(formSearchT);
  if(!CAN_TMDB||!tmdbKey()||q.length<2||ui.form.tmdb){formRemote=[];return;}
  formSearchT=setTimeout(function(){
    formSearchQ=q;
    loadGenres().catch(function(){}).then(function(){return tmdb('/search/movie',{query:q,region:'FR',include_adult:'false'});}).then(function(r){
      if(!ui.form||formSearchQ!==ui.form.title.trim())return;
      formRemote=(r.results||[]).map(storeFilm).filter(Boolean).map(function(f){return f.id;});saveCatalog();
      var s=document.getElementById('fsugg');if(s)s.innerHTML=suggHTML();
    },function(){});
  },400);
}
function viewForm(){
  var f=ui.form,edit=!!f.id;
  return '<header class="top" style="justify-content:flex-start"><button class="ibtn" data-act="cancelForm" aria-label="Retour">'+ICO.left+'</button><h1 class="disp" style="margin:0;font-size:32px;flex:1">'+(edit?'Modifier la séance':'Nouvelle séance')+'</h1></header>'+
  '<main class="scroll" style="padding-bottom:calc(220px + var(--safe-b));gap:20px">'+
  '<section style="display:flex;gap:14px;align-items:flex-start"><div id="fposter">'+posterHTML(f.title||'?',f.poster,true)+'</div><div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:8px">'+
    '<div class="field"><label for="ftitle">Film ou spectacle</label><input id="ftitle" data-in="title" class="inp" autocomplete="off" value="'+esc(f.title)+'" placeholder="'+(IS_APP&&tmdbKey()?'Tapez pour chercher un film':'Titre')+'"></div>'+
    '<span id="fmeta" style="font-size:12px" class="acc">'+esc((f.genres||[]).slice(0,3).join(' · '))+'</span>'+
  '</div></section>'+
  '<div class="sugg" id="fsugg">'+suggHTML()+'</div>'+
  '<section style="display:flex;flex-direction:column;gap:10px"><h2 class="lbl">Technologie</h2><div class="techs">'+TECHS.map(function(t){return '<button class="tech" data-act="ftech" data-v="'+t.id+'" aria-pressed="'+(f.tech===t.id)+'">'+t.label+'</button>';}).join('')+'</div>'+
  '<button data-act="tab" data-v="set" style="align-self:flex-start;background:none;border:none;color:var(--accT);font-size:12px;font-weight:600;padding:4px 0">Modifier les tarifs dans Réglages ›</button></section>'+
  '<section style="display:flex;align-items:center;justify-content:space-between;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:10px 10px 10px 16px"><div style="display:flex;flex-direction:column;gap:2px"><span style="font-size:15px;font-weight:600">Places</span><span style="font-size:12px" class="mut" id="fpassinfo">'+passInfo()+'</span></div>'+
  '<div class="stepper"><button data-act="fplaces" data-v="-1" aria-label="Retirer une place">−</button><span class="n disp" aria-live="polite" id="fplaces">'+f.places+'</span><button class="plus" data-act="fplaces" data-v="1" aria-label="Ajouter une place">+</button></div></section>'+
  '<section style="display:flex;flex-direction:column;gap:10px"><h2 class="lbl">Détails <span style="text-transform:none;letter-spacing:0;font-weight:500">(heure et salle facultatives)</span></h2>'+
  '<div class="field"><label for="fdate">Date</label><input id="fdate" data-in="date" type="date" class="inp" value="'+esc(f.date)+'"></div>'+
  '<div class="grid2"><div class="field"><label for="ftime">Heure</label><input id="ftime" data-in="time" type="time" class="inp" value="'+esc(f.time)+'"></div><div class="field"><label for="froom">Salle</label><input id="froom" data-in="room" class="inp" value="'+esc(f.room)+'" placeholder="ex. 7 ou IMAX"></div></div></section>'+
  (edit?'<div id="fdel"><button class="btn danger sm" data-act="askDelete">Supprimer cette séance</button></div>':'')+
  '</main><footer class="foot"><div id="ffoot">'+formFootHTML()+'</div><button class="btn" data-act="saveForm">'+(edit?'Enregistrer les modifications':'Enregistrer la séance')+'</button></footer>';
}
function passInfo(){var p=monthPass(ymOf(ui.form.date||todayISO()));return p.f==='none'?'Sans abonnement ce mois-là':passLabel(p)+' : '+(p.duo?'2 places couvertes':'1 place couverte');}
function formFootHTML(){
  var f=ui.form,unit=formUnit(f),ym=ymOf(f.date||todayISO()),pass=monthPass(ym);
  var tmp={tech:f.tech,places:f.places,date:f.date||todayISO(),unit:unit},value=unit*f.places,ex=extraFor(tmp,pass);
  var mi=monthInfo(ym),old=f.id?state.sessions.find(function(s){return s.id===f.id;}):null,after=mi.saving;
  if(old&&ymOf(old.date)===ym)after-=sessionValue(old)-extraFor(old,pass);
  after+=value-ex;
  return '<div aria-live="polite" style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div style="display:flex;flex-direction:column;gap:2px"><span style="font-size:12px" class="mut">Cette séance vaut</span><span class="disp acc" style="font-size:34px;line-height:1">'+eur(value)+'</span><span style="font-size:11px;'+(ex>0?'color:var(--neg)':'')+'" class="mut">'+(ex>0?'vous payez '+eur(ex):'rien à payer en plus')+'</span></div>'+
  '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px"><span style="font-size:12px" class="mut">Économie de '+monthTitle(ym)+'</span><span style="font-size:16px;font-weight:700;color:'+(after>=0?'var(--txt)':'var(--neg)')+'">'+(pass.f==='none'?'sans abonnement':signed(after))+'</span><span style="font-size:11px" class="mut">'+esc(passShort(pass))+'</span></div></div>';
}

/* ---------- éditeur de tarifs ---------- */
function openPrice(id){ui.sheet={kind:'price',editing:id,drafts:{},texts:{},from:todayISO(),confirmDel:null};renderLayer();}
function psDraft(id){var p=ui.sheet;return p.drafts[id]!==undefined?p.drafts[id]:priceAt(id,p.from);}
function psDirty(id){var p=ui.sheet;return p.drafts[id]!==undefined&&Math.abs(p.drafts[id]-priceAt(id,p.from))>0.0001;}
function countFor(id,from,to){
  var end=to||'9999-12-31';
  if(PASS_IDS.indexOf(id)>=0){var n=0,guard=0;
    var ym=ymOf(from===ORIGIN?todayISO().slice(0,4)+'-01-01':from),stop=ymOf(todayISO());
    if(from===ORIGIN){var ks=Object.keys(state.months).sort();ym=ks.length&&ks[0]<ym?ks[0]:ym;}
    while(ym<=stop&&guard++<600){var d=ym+'-28',mp=monthPass(ym);
      if(d>=from&&d<end&&mp.f!=='none'&&(id==='opt_duo'?mp.duo:id==='pass_'+mp.f))n++;ym=addMonths(ym,1);}
    return n+' mois';}
  var tech=id.indexOf('x_')===0?id.slice(2):id;
  var c=state.sessions.filter(function(s){return s.tech===tech&&s.date>=from&&s.date<end;}).length;return c+' séance'+(c>1?'s':'');
}
function psTimelineHTML(){
  var p=ui.sheet,id=p.editing,l=priceList(id),pend=psDirty(id),items=[],t=todayISO();
  l.forEach(function(e,i){
    if(pend&&e.from===p.from)return;
    var next=l[i+1];if(next&&pend&&next.from===p.from)next=l[i+2];
    var to=next?next.from:null;if(pend&&e.from<p.from&&(!to||to>p.from))to=p.from;
    var start=e.from===ORIGIN?'Tarif initial':frDate(e.from),end=to?' → '+frDate(prevDay(to)):(e.from>t?'':' → aujourd’hui');
    items.push({period:start+end,count:countFor(id,e.from,to)+(e.from>t?' · programmé':''),price:eur(e.p),from:e.from});
  });
  if(pend){items.push({period:'Dès le '+frDate(p.from),count:'nouveau tarif',price:eur(p.drafts[id]),pending:true,from:p.from});items.sort(function(a,b){return a.from<b.from?-1:1;});}
  return '<span class="lbl" style="font-size:11px;padding-bottom:10px">Historique du tarif</span>'+items.map(function(it){
    var del=(!it.pending&&it.from!==ORIGIN)?(p.confirmDel===it.from?'<button data-act="psDelDo" data-v="'+it.from+'" style="background:none;border:1px solid #4A2A28;color:var(--neg);border-radius:10px;font-size:12px;padding:6px 8px">Confirmer</button>':'<button data-act="psDel" data-v="'+it.from+'" aria-label="Supprimer ce tarif" style="background:none;border:none;color:var(--mut);font-size:20px;padding:0 4px;line-height:1;min-width:28px;min-height:28px">×</button>'):'';
    return '<div class="tl-i"><div class="tl-d"><i class="'+(it.pending?'f':'')+'"></i><b></b></div><div class="tl-c"><span style="display:flex;flex-direction:column;gap:2px"><span style="font-size:14px;font-weight:600">'+it.period+'</span><span style="font-size:12px" class="mut">'+it.count+(it.pending?'':' · prix conservé')+'</span></span><span style="display:flex;align-items:center;gap:6px"><span style="font-size:15px;font-weight:700'+(it.pending?';color:var(--accT)':'')+'">'+it.price+'</span>'+del+'</span></div></div>';
  }).join('');
}
function psChipsHTML(){var p=ui.sheet;return PRICE_IDS.map(function(id){return '<button class="pill" role="tab" data-act="psPick" data-v="'+id+'" aria-selected="'+(p.editing===id)+'">'+PRICE_SHORT[id]+(psDirty(id)?'<span class="dot" aria-label="modifié"></span>':'')+'</button>';}).join('');}
function psApplyLabel(){var n=PRICE_IDS.filter(psDirty).length;return n>1?'Appliquer ('+n+')':'Appliquer';}
function sheetPriceHTML(){
  var p=ui.sheet,id=p.editing,d=psDraft(id),txt=p.texts[id]!==undefined?p.texts[id]:num2(d);
  var lab=PASS_IDS.indexOf(id)>=0?'Nouveau prix mensuel':(id.indexOf('x_')===0?'Nouveau supplément par place':'Nouveau prix d’une place');
  return '<div class="sheet" role="dialog" aria-label="'+PRICE_LABEL[id]+'"><span class="handle" aria-hidden="true"></span>'+
  '<div class="chips" role="tablist" aria-label="Tarif à modifier" id="pschips">'+psChipsHTML()+'</div>'+
  '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><h2 class="disp" style="margin:0;font-size:28px">'+PRICE_LABEL[id]+'</h2><span style="font-size:13px;white-space:nowrap" class="mut">Actuel : '+eur(curPrice(id))+'</span></div>'+
  '<div class="field"><label for="psinput">'+lab+'</label>'+
  '<div class="bigprice"><button data-act="psStep" data-v="-0.5" aria-label="Baisser de 0,50 €">−</button><div class="pricebox"><input id="psinput" data-in="psPrice" inputmode="decimal" autocomplete="off" value="'+esc(txt)+'"><span class="disp acc" aria-hidden="true" style="font-size:38px">€</span>'+ICO.pen+'</div><button class="plus" data-act="psStep" data-v="0.5" aria-label="Augmenter de 0,50 €">+</button></div>'+
  '<span style="font-size:12px" class="mut">Boutons : ± 0,50 € · touchez le montant pour saisir au centime près</span></div>'+
  '<div class="field"><label for="psfrom">Applicable à partir du</label><input id="psfrom" data-in="psFrom" type="date" class="inp" value="'+esc(p.from)+'" style="background:var(--deep)"></div>'+
  '<div class="tl" id="pstl">'+psTimelineHTML()+'</div>'+
  '<div class="grid2"><button class="btn ghost" data-act="closeSheet">Annuler</button><button class="btn" data-act="psApply" id="psapply">'+psApplyLabel()+'</button></div></div>';
}
function psRefresh(){var a=document.getElementById('pschips'),b=document.getElementById('pstl'),c=document.getElementById('psapply');if(a)a.innerHTML=psChipsHTML();if(b)b.innerHTML=psTimelineHTML();if(c)c.textContent=psApplyLabel();}

/* ---------- pass d'un mois (depuis Réglages) ---------- */
function sheetPassHTML(){
  var ym=ui.sheet.ym,cur=ui.sheet.mp,d=ym+'-28';
  return '<div class="sheet" role="dialog" aria-label="Formule de '+monthTitle(ym)+'"><span class="handle" aria-hidden="true"></span><h2 class="disp" style="margin:0;font-size:28px">'+cap(monthTitle(ym))+' '+ym.slice(0,4)+'</h2>'+
  '<div class="list">'+FORMULAS.map(function(p){var on=cur.f===p.id,pr=p.id==='none'?'':eur(priceAt('pass_'+p.id,d))+'/mois';
    return '<button class="row" data-act="sheetForm" data-v="'+p.id+'" aria-pressed="'+on+'"><span style="width:22px;height:22px;border-radius:11px;border:2px solid '+(on?'var(--acc)':'#6B6B73')+';display:flex;align-items:center;justify-content:center;flex-shrink:0">'+(on?'<span style="width:10px;height:10px;border-radius:5px;background:var(--acc)"></span>':'')+'</span><span style="flex:1;display:flex;flex-direction:column;gap:2px;padding:8px 0"><span style="font-size:15px;font-weight:600">'+p.long+'</span><span class="mut" style="font-size:11px;line-height:1.35">'+p.cover+'</span></span><span class="mut" style="font-size:13px;white-space:nowrap">'+pr+'</span></button>';}).join('')+'</div>'+
  (cur.f==='none'?'':'<button class="duo" data-act="sheetDuo" aria-pressed="'+!!cur.duo+'"><span class="sw" aria-hidden="true"><i></i></span><span style="flex:1;text-align:left"><strong>Option Duo</strong><span class="mut" style="font-size:12px;display:block">pour venir à deux</span></span><span class="mut" style="font-size:13px">+'+eur(priceAt('opt_duo',d))+'</span></button>')+
  '<div class="tile" style="flex-direction:row;justify-content:space-between;align-items:center"><span class="k" style="font-size:13px">Total du mois</span><span class="v">'+eur(cur.f==='none'?0:priceAt('pass_'+cur.f,d)+(cur.duo?priceAt('opt_duo',d):0))+'</span></div>'+
  '<label style="display:flex;gap:10px;align-items:center;font-size:14px;min-height:44px"><input type="checkbox" id="passfwd" style="width:22px;height:22px;accent-color:#FFC20E"> Appliquer aussi aux mois suivants de '+ym.slice(0,4)+'</label>'+
  '<div class="grid2"><button class="btn ghost" data-act="closeSheet">Annuler</button><button class="btn" data-act="pickPass">Enregistrer</button></div></div>';
}

/* ---------- autres feuilles ---------- */
function sheetImportHTML(){
  var d=ui.sheet.data;
  return '<div class="sheet" role="dialog" aria-label="Importer une sauvegarde"><span class="handle" aria-hidden="true"></span><h2 class="disp" style="margin:0;font-size:28px">Importer une sauvegarde</h2>'+
  '<p style="margin:0;font-size:14px;line-height:1.5" class="mut">Ce fichier contient <strong style="color:var(--txt)">'+d.sessions.length+' séances</strong>. Il remplacera les '+state.sessions.length+' séances, les pass et les tarifs actuels.</p>'+
  '<div class="grid2"><button class="btn ghost" data-act="closeSheet">Annuler</button><button class="btn" data-act="importDo">Remplacer</button></div></div>';
}
function importText(t){
  var o=JSON.parse(String(t).replace(/^\ufeff/,'').trim());
  if(o&&o.kind==='sessions'&&Array.isArray(o.sessions)){ui.sheet={kind:'merge',list:cleanImport(o.sessions),note:String(o.note||'').slice(0,200)};renderLayer();return;}
  var d=migrate(o&&o.data?o.data:o);if(!d)throw 0;ui.sheet={kind:'import',data:d};renderLayer();
}
function sheetPasteHTML(){
  return '<div class="sheet" role="dialog" aria-label="Coller une sauvegarde"><span class="handle" aria-hidden="true"></span><h2 class="disp" style="margin:0;font-size:28px">Coller une sauvegarde</h2>'+
  '<p style="margin:0;font-size:13px" class="mut">Ouvrez le fichier .json dans une autre application, copiez tout son texte, puis collez-le ici.</p>'+
  '<label for="pastein" class="sr">Texte à importer</label><textarea id="pastein" class="inp" placeholder="Collez ici le texte du fichier"></textarea>'+
  '<div class="grid2"><button class="btn ghost" data-act="closeSheet">Annuler</button><button class="btn" data-act="pasteDo">Continuer</button></div></div>';
}
function cleanImport(list){
  return list.filter(function(x){return x&&typeof x.title==='string'&&x.title.trim()&&/^\d{4}-\d{2}-\d{2}$/.test(x.date||'');}).map(function(x){
    var tech=TECH[x.tech]?x.tech:'std';
    return {id:String(x.id||uid()).slice(0,40),title:x.title.trim().slice(0,140),tech:tech,places:Math.max(1,Math.min(6,+x.places||2)),date:x.date,time:/^\d{2}:\d{2}$/.test(x.time||'')?x.time:'',room:String(x.room||'').slice(0,40),cinema:String(x.cinema||'').slice(0,60),unit:typeof x.unit==='number'?x.unit:priceAt(tech,x.date),tmdb:typeof x.tmdb==='number'?x.tmdb:null,poster:safePath(x.poster),genres:Array.isArray(x.genres)?x.genres.slice(0,6):[]};
  });
}
function mergeSplit(list){
  /* une même séance (même film, même jour) n'est ajoutée qu'autant de fois qu'elle manque : deux séances le même jour restent possibles */
  var ids={},cnt={};state.sessions.forEach(function(s){ids[s.id]=1;var k=norm(s.title)+'|'+s.date;cnt[k]=(cnt[k]||0)+1;});
  var add=[],dup=0;list.forEach(function(x){var k=norm(x.title)+'|'+x.date;if(ids[x.id]){dup++;return;}if(cnt[k]>0){cnt[k]--;dup++;return;}add.push(x);ids[x.id]=1;});
  return {add:add,dup:dup};
}
function sheetMergeHTML(){
  var m=mergeSplit(ui.sheet.list),months={};m.add.forEach(function(x){months[ymOf(x.date)]=1;});
  return '<div class="sheet" role="dialog" aria-label="Ajouter des séances"><span class="handle" aria-hidden="true"></span><h2 class="disp" style="margin:0;font-size:28px">Ajouter des séances</h2>'+
  (ui.sheet.note?'<p style="margin:0;font-size:13px" class="mut">'+esc(ui.sheet.note)+'</p>':'')+
  '<p style="margin:0;font-size:14px;line-height:1.5"><strong class="acc">'+m.add.length+' séance'+(m.add.length>1?'s':'')+'</strong> à ajouter sur '+Object.keys(months).length+' mois'+(m.dup?', '+m.dup+' déjà présente'+(m.dup>1?'s':'')+' ignorée'+(m.dup>1?'s':''):'')+'. Vos séances, formules et tarifs actuels sont conservés.</p>'+
  '<div style="max-height:34vh;overflow-y:auto;display:flex;flex-direction:column;gap:6px">'+m.add.map(function(x){return '<div style="display:flex;justify-content:space-between;gap:8px;font-size:13px;padding:6px 10px;background:var(--deep);border-radius:10px"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(x.title)+'</span><span class="mut" style="white-space:nowrap">'+frDate(x.date)+'</span></div>';}).join('')+'</div>'+
  (CAN_TMDB&&tmdbKey()?'<p style="margin:0;font-size:12px" class="mut">Les affiches et genres seront retrouvés automatiquement dans la base de films.</p>':'')+
  '<div class="grid2"><button class="btn ghost" data-act="closeSheet">Annuler</button><button class="btn" data-act="mergeDo"'+(m.add.length?'':' disabled')+'>Ajouter</button></div></div>';
}
/* retrouve affiche et genres des séances saisies sans la base de films */
var enriching=false;
/* évite d'associer une séance au mauvais film : au moins la moitié des mots importants doivent correspondre */
function titleClose(a,b){
  var stop={le:1,la:1,les:1,de:1,du:1,des:1,un:1,une:1,et:1,the:1,of:1,a:1,l:1,d:1,au:1,aux:1,en:1};
  function words(x){return norm(x).replace(/[^a-z0-9 ]+/g,' ').split(/\s+/).filter(function(w){return w&&!stop[w];});}
  var wa=words(a),wb=words(b||'');if(!wa.length||!wb.length)return false;
  var setb={};wb.forEach(function(w){setb[w]=1;});
  var hit=wa.filter(function(w){return setb[w];}).length;
  return hit/Math.min(wa.length,wb.length)>=0.5;
}
function enrichTmdb(){
  if(enriching||!CAN_TMDB||!tmdbKey())return;
  var groups={};state.sessions.forEach(function(s){if(!s.tmdb&&!s.tmdbTried){var k=norm(s.title);(groups[k]=groups[k]||[]).push(s);}});
  var keys=Object.keys(groups);if(!keys.length)return;enriching=true;var changed=false;
  loadGenres().catch(noop).then(function(){
    return pool(keys,3,function(k){
      var list=groups[k],title=list[0].title.replace(/^la séance ciné hits\s*:\s*/i,'').replace(/\s*-\s*le show.*$/i,''),year=list[0].date.slice(0,4);
      return tmdb('/search/movie',{query:title,region:'FR',include_adult:'false'}).then(function(r){
        var res=(r.results||[]).filter(function(x){var y=(x.release_date||'').slice(0,4);return (!y||+y>=+year-2)&&(titleClose(title,x.title)||titleClose(title,x.original_title));});
        var f=res.length?storeFilm(res[0]):null;
        list.forEach(function(s){s.tmdbTried=1;if(f){s.tmdb=f.id;s.poster=f.p||null;s.genres=genreNames(f).slice(0,6);}});changed=true;
        if(cleanWatch())syncAlerts();
      });
    });
  }).then(function(){enriching=false;if(changed){saveCatalog();persist();render();}},function(){enriching=false;});
}
function sheetJsonHTML(){
  return '<div class="sheet" role="dialog" aria-label="Copie"><span class="handle" aria-hidden="true"></span><h2 class="disp" style="margin:0;font-size:28px">'+esc(ui.sheet.title||'Copie de sauvegarde')+'</h2>'+
  '<p style="margin:0;font-size:13px" class="mut">Le téléchargement n’est pas disponible ici. Copiez ce texte et collez-le dans une note ou un e-mail.</p>'+
  '<label for="jsonout" class="sr">Données</label><textarea id="jsonout" class="inp" readonly>'+esc(ui.sheet.text)+'</textarea>'+
  '<div class="grid2"><button class="btn ghost" data-act="closeSheet">Fermer</button><button class="btn" data-act="copyJson">Copier</button></div></div>';
}
function sheetMyFilmHTML(){
  var k=ui.sheet.k,ss=state.sessions.filter(function(s){return (s.tmdb?'t'+s.tmdb:'n'+norm(s.title))===k;}).sort(sortDesc);if(!ss.length)return '';
  var s0=ss[0];
  return '<div class="sheet" role="dialog" aria-label="'+esc(s0.title)+'"><span class="handle" aria-hidden="true"></span><div style="display:flex;gap:14px;align-items:center">'+posterHTML(s0.title,s0.poster,true)+'<div style="display:flex;flex-direction:column;gap:6px;min-width:0"><h2 class="disp" style="margin:0;font-size:30px;line-height:1">'+esc(s0.title)+'</h2><span class="mut" style="font-size:13px">Vu '+ss.length+' fois · '+eur(ss.reduce(function(t,s){return t+sessionValue(s);},0))+'</span></div></div>'+
  '<div style="display:flex;flex-direction:column;gap:8px">'+ss.map(sessionItem).join('')+'</div>'+
  '<div class="grid2"><button class="btn ghost" data-act="closeSheet">Fermer</button><button class="btn" data-act="againFilm" data-v="'+esc(s0.id)+'">'+ICO.plus+'Le revoir</button></div></div>';
}

/* ---------- rendu ---------- */
function render(){
  var v=document.getElementById('view'),sc=v.querySelector('.scroll'),top=sc?sc.scrollTop:0,prevTab=v.getAttribute('data-tab');
  var html=ui.tab==='form'?viewForm():ui.tab==='films'?viewFilms():ui.tab==='hist'?viewHist():ui.tab==='stats'?viewStats():ui.tab==='set'?viewSet():viewHome();
  v.innerHTML=html;v.setAttribute('data-tab',ui.tab);
  setTimeout(fabWake,0);
  var nsc=v.querySelector('.scroll');if(nsc&&prevTab===ui.tab)nsc.scrollTop=top;
  renderLayer();
}
/* fenêtres empilées : une fiche ouverte depuis une autre garde un « retour » */
var sheetStack=[];
function openSheet(sh){if(ui.sheet&&(ui.sheet.kind==='film'||ui.sheet.kind==='person'))sheetStack.push(ui.sheet);else sheetStack=[];ui.sheet=sh;renderLayer();var x=document.querySelector('.sheet');if(x)x.scrollTop=0;}
function sheetBack(){if(sheetStack.length){ui.sheet=sheetStack.pop();renderLayer();return true;}return false;}
function closeAllSheets(){sheetStack=[];ui.sheet=null;renderLayer();}
function backBar(){return sheetStack.length?'<button data-act="sheetBack" style="align-self:flex-start;display:flex;align-items:center;gap:6px;background:none;border:none;color:var(--accT);font-size:14px;font-weight:600;min-height:40px;padding:0">'+ICO.left+'Retour</button>':'';}
var persons={};
function loadPerson(id,role){
  var since=new Date().getFullYear()-5;
  return loadGenres().catch(noop).then(function(){return tmdb('/person/'+id+'/movie_credits');}).then(function(r){
    var src=role==='dir'?(r.crew||[]).filter(function(c){return c.job==='Director';}):(r.cast||[]);
    var seen={},ids=[];
    src.forEach(function(x){var y=+(String(x.release_date||'').slice(0,4))||0;if(seen[x.id]||(y&&y<since))return;seen[x.id]=1;var f=storeFilm(x);if(f)ids.push(f.id);});
    persons[id+'|'+role]={ids:ids,at:Date.now()};saveCatalog();return ids;
  });
}
function sheetPersonHTML(){
  var sh=ui.sheet,key=sh.id+'|'+sh.role,P=persons[key],mode=filmsView('person'),seen=seenCounts(),body;
  if(!P)body='<div class="empty"><span>'+(sh.err?esc(tmdbErr(sh.err)):'Chargement des films…')+'</span></div>';
  else{
    var films=P.ids.map(function(i){return catalog.films[i];}).filter(Boolean);
    var its=itemsFromFilms(films,seen);
    body=its.length?renderItems(its,mode,false,true):'<div class="empty"><span>Aucun film sur les 5 dernières années.</span></div>';
  }
  var y=new Date().getFullYear(),n=P?P.ids.length:0;
  return '<div class="sheet" role="dialog" aria-label="'+esc(sh.name)+'"><span class="handle" aria-hidden="true"></span>'+backBar()+
  '<div style="display:flex;justify-content:space-between;align-items:flex-end;gap:10px;flex-wrap:wrap"><div style="display:flex;flex-direction:column;gap:2px;min-width:0"><span class="eyebrow">'+(sh.role==='dir'?'Réalisation':'Acteur / actrice')+' · '+(y-5)+' – '+y+(P?' · '+n+' film'+(n>1?'s':''):'')+'</span><h2 class="disp" style="margin:0;font-size:30px;line-height:1">'+esc(sh.name)+'</h2></div>'+viewToggle('person')+'</div>'+
  body+'<button class="btn ghost" data-act="closeAll">Fermer</button></div>';
}
function renderLayer(){
  var l=document.getElementById('layer'),s=ui.sheet;
  if(!s){l.innerHTML='';return;}
  var inner={person:sheetPersonHTML,update:sheetUpdateHTML,paste:sheetPasteHTML,merge:sheetMergeHTML,price:sheetPriceHTML,import:sheetImportHTML,json:sheetJsonHTML,pass:sheetPassHTML,film:sheetFilmHTML,myfilm:sheetMyFilmHTML}[s.kind]();
  if(!inner){ui.sheet=null;l.innerHTML='';return;}
  l.innerHTML='<div class="scrim"><button class="close-area" data-act="closeSheet" aria-label="Fermer"></button>'+inner+'</div>';
}

/* ---------- export ---------- */
function saveText(name,text,mime,title){
  if(BRIDGE){var ok=false;try{ok=BRIDGE.saveFile(name,text,mime);}catch(e){}if(ok){toast('Enregistré dans Téléchargements : '+name);return;}}
  if(IS_WEB){try{var bl=new Blob([text],{type:mime||'application/octet-stream'}),u=URL.createObjectURL(bl),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},2000);toast('Fichier téléchargé : '+name);return;}catch(e){}}
  if(downloads){downloads.save({filename:name,data:text}).then(function(){toast('Fichier exporté');},function(){ui.sheet={kind:'json',text:text,title:title};renderLayer();});return;}
  ui.sheet={kind:'json',text:text,title:title};renderLayer();
}
function csv(){
  var head=['Date','Heure','Titre','Technologie','Places','Prix réel / place','Valeur','Formule du mois','Payé en plus','Salle','Genres'];
  var q=function(v){v=String(v==null?'':v);return /[";\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;};
  var rows=state.sessions.slice().sort(function(a,b){return a.date<b.date?-1:1;}).map(function(s){
    return [frDate(s.date),s.time||'',s.title,TECH[s.tech].label,s.places,num2(s.unit),num2(sessionValue(s)),passLabel(monthPass(ymOf(s.date))),num2(sessionExtra(s)),s.room||'',(s.genres||[]).join(', ')].map(q).join(';');
  });
  return '﻿'+head.join(';')+'\r\n'+rows.join('\r\n');
}

/* ---------- actions ---------- */
function go(tab){ui.tab=tab;ui.sheet=null;sheetStack=[];render();var sc=document.querySelector('.scroll');if(sc)sc.scrollTop=0;if(tab==='films')ensureFilms();}
function setPass(ym,p,forward){
  p={f:p.f,duo:p.f!=='none'&&!!p.duo};
  state.months[ym]=p;
  if(forward){var y=ym.slice(0,4),m=ym;while(true){m=addMonths(m,1);if(m.slice(0,4)!==y)break;state.months[m]={f:p.f,duo:p.duo};}}
  state.setup=true;persist();
}
function openForm(f){ui.form=f;formRemote=[];ui.back=ui.tab==='form'?'home':ui.tab;go('form');}
function formFromFilm(fl){var f=newForm();f.title=fl.t;f.tmdb=fl.id;f.poster=fl.p;f.genres=genreNames(fl);return f;}
var A={
  tab:function(v){if(ui.tab==='form')ui.form=null;go(v);},
  month:function(v){ui.ym=addMonths(ui.ym,+v);render();},
  goMonth:function(v){ui.ym=v;render();},
  goMonthHome:function(v){ui.ym=v;go('home');},
  statsYear:function(v){ui.statsYear=+v;render();},
  setForm:function(v){var c=monthPass(ui.ym);setPass(ui.ym,{f:v,duo:v==='none'?false:(c.f==='none'?true:c.duo)},false);render();},
  toggleDuo:function(){var c=monthPass(ui.ym);setPass(ui.ym,{f:c.f,duo:!c.duo},false);render();},
  passSheet:function(v){var c=monthPass(v);ui.sheet={kind:'pass',ym:v,mp:{f:c.f,duo:c.duo}};renderLayer();},
  sheetForm:function(v){var m=ui.sheet.mp;ui.sheet.mp={f:v,duo:v==='none'?false:(m.f==='none'?true:m.duo)};renderLayer();},
  sheetDuo:function(){ui.sheet.mp.duo=!ui.sheet.mp.duo;renderLayer();},
  pickPass:function(){var fw=document.getElementById('passfwd');setPass(ui.sheet.ym,ui.sheet.mp,fw&&fw.checked);ui.sheet=null;render();toast('Formule enregistrée');},
  new:function(){openForm(newForm());},
  edit:function(v){var s=state.sessions.find(function(x){return x.id===v;});if(!s)return;ui.sheet=null;openForm({id:s.id,title:s.title,tech:s.tech,places:s.places,date:s.date,time:s.time||'',room:s.room||'',tmdb:s.tmdb||null,poster:s.poster||null,genres:(s.genres||[]).slice()});},
  cancelForm:function(){ui.form=null;go(ui.back&&ui.back!=='form'?ui.back:'home');},
  ftech:function(v){ui.form.tech=v;document.querySelectorAll('.tech').forEach(function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-v')===v));});refreshFoot();},
  fplaces:function(v){ui.form.places=Math.max(1,Math.min(6,ui.form.places+(+v)));document.getElementById('fplaces').textContent=ui.form.places;refreshFoot();},
  fpick:function(v){
    var s=(window.__sugg||[])[+v];if(!s)return;var f=ui.form;
    f.title=s.title;f.tmdb=s.tmdb||null;f.poster=s.poster||null;f.genres=(s.genres||[]).slice();
    if(s.tmdb&&catalog.films[s.tmdb]&&!f.genres.length)f.genres=genreNames(catalog.films[s.tmdb]);
    document.getElementById('ftitle').value=s.title;refreshTitle(true);
    if(s.tmdb&&CAN_TMDB&&tmdbKey()&&!(catalog.films[s.tmdb]||{}).rt){filmDetails(s.tmdb).then(function(fl){if(ui.form&&ui.form.tmdb===fl.id){ui.form.genres=genreNames(fl);var m=document.getElementById('fmeta');if(m)m.textContent=ui.form.genres.slice(0,3).join(' · ');}},function(){});}
  },
  askDelete:function(){document.getElementById('fdel').innerHTML='<div class="grid2"><button class="btn ghost sm" data-act="keepSession">Garder</button><button class="btn danger sm" data-act="delSession">Oui, supprimer</button></div>';},
  keepSession:function(){document.getElementById('fdel').innerHTML='<button class="btn danger sm" data-act="askDelete">Supprimer cette séance</button>';},
  delSession:function(){var id=ui.form.id;state.sessions=state.sessions.filter(function(s){return s.id!==id;});persist();ui.form=null;toast('Séance supprimée');go(ui.back&&ui.back!=='form'?ui.back:'home');},
  saveForm:function(){
    var f=ui.form,t=(f.title||'').trim();
    if(!t){var i=document.getElementById('ftitle');i.focus();i.style.outline='2px solid var(--neg)';toast('Indiquez le titre du film ou du spectacle');return;}
    if(!f.date){toast('Indiquez la date');return;}
    var old=f.id?state.sessions.find(function(x){return x.id===f.id;}):null;
    var rec={id:f.id||uid(),title:t.slice(0,140),tech:f.tech,places:f.places,date:f.date,time:f.time||'',room:(f.room||'').trim().slice(0,40),cinema:old&&old.cinema||'',unit:formUnit(f),tmdb:f.tmdb||null,poster:safePath(f.poster),genres:(f.genres||[]).slice(0,6)};
    if(f.id){state.sessions=state.sessions.map(function(s){return s.id===f.id?rec:s;});}else state.sessions.push(rec);
    var ym=ymOf(rec.date);if(!state.months[ym]){var mp0=monthPass(ym);state.months[ym]={f:mp0.f,duo:mp0.duo};}
    var wasWatched=cleanWatch();
    state.setup=true;persist();saveCatalog();if(wasWatched)syncAlerts();
    ui.ym=ym;ui.form=null;
    var mi=monthInfo(ym);
    toast(mi.pass.f==='none'?'Séance enregistrée':(mi.saving>=0?'Enregistré. '+cap(monthTitle(ym))+' est rentabilisé ('+signed(mi.saving)+')':'Enregistré. Encore '+eur(mi.cost-mi.value)+' pour rentabiliser '+monthTitle(ym)));
    go(['hist','films'].indexOf(ui.back)>=0?ui.back:'home');
  },
  price:function(v){openPrice(v);},
  closeSheet:function(){closeAllSheets();},
  psPick:function(v){ui.sheet.editing=v;ui.sheet.confirmDel=null;renderLayer();},
  psStep:function(v){var p=ui.sheet,id=p.editing,d=Math.max(0,Math.round((psDraft(id)+(+v))*100)/100);p.drafts[id]=d;p.texts[id]=num2(d);renderLayer();},
  psDel:function(v){ui.sheet.confirmDel=v;psRefresh();},
  psDelDo:function(v){var id=ui.sheet.editing;state.prices[id]=state.prices[id].filter(function(e){return e.from!==v;});ui.sheet.confirmDel=null;persist();render();},
  psApply:function(){
    var p=ui.sheet,ids=PRICE_IDS.filter(psDirty);
    if(!ids.length){ui.sheet=null;renderLayer();return;}
    ids.forEach(function(id){var l=state.prices[id].filter(function(e){return e.from!==p.from;});l.push({p:Math.round(p.drafts[id]*100)/100,from:p.from});state.prices[id]=l;});
    state.setup=true;persist();ui.sheet=null;render();
    toast(ids.length>1?ids.length+' tarifs mis à jour dès le '+frDate(p.from):'Tarif mis à jour dès le '+frDate(p.from));
  },
  filmsTab:function(v){ui.films.tab=v;ui.films.q='';filmsState.results=null;filmsState.err=null;render();var sc=document.querySelector('.scroll');if(sc)sc.scrollTop=0;ensureFilms();},
  filmsSeen:function(v){ui.films.seen=v;render();},
  filmsView:function(v,el){if(ui.sheet&&ui.sheet.kind==='person'){setFilmsView('person',v);renderLayer();return;}setFilmsView(ui.films.tab,v);render();},
  person:function(v){
    var p=String(v).split('|'),id=+p[0],role=p[1],name=p.slice(2).join('|');if(!(id>0))return;
    openSheet({kind:'person',id:id,role:role,name:name});
    if(!persons[id+'|'+role])loadPerson(id,role).then(function(){if(ui.sheet&&ui.sheet.kind==='person'&&ui.sheet.id===id)renderLayer();},function(e){if(ui.sheet&&ui.sheet.kind==='person'&&ui.sheet.id===id){ui.sheet.err=e;renderLayer();}});
  },
  sheetBack:function(){sheetBack();},
  closeAll:function(){closeAllSheets();},
  watchOutToggle:function(){lsSet('rentabpass-watch-out',lsGet('rentabpass-watch-out')==='open'?'':'open');render();},
  watchToggle:function(v){watchToggle(+v);if(ui.sheet&&ui.sheet.kind==='film')renderLayer();render();},
  theme:function(v){lsSet(LST,v);applyTheme();render();},
  soonToggle:function(){var cur=ymOf(todayISO());lsSet('rentabpass-soon',lsGet('rentabpass-soon')===cur?'':cur);render();},
  goWatch:function(){ui.films.tab='watch';ui.films.q='';go('films');},
  askNotif:function(){
    if(!BRIDGE||typeof BRIDGE.askNotif!=='function'){toast('Votre version de l’application ne gère pas encore les alertes : installez la dernière APK.');return;}
    try{BRIDGE.askNotif();}catch(e){}
    toast('Autorisez les notifications dans la fenêtre d’Android');setTimeout(render,1500);
  },
  lead:function(v){state.alertLead=+v;persist();syncAlerts();render();toast(+v?'Alerte '+(+v===1?'la veille':v+' jours avant')+' + le jour J':'Alerte le jour de la sortie');},
  filmsRetry:function(){filmsState.err=null;if(ui.films.q.trim())runFilmSearch();else ensureFilms(true);},
  film:function(v){var id=+v;openSheet({kind:'film',id:id});if(CAN_TMDB&&tmdbKey()&&!(catalog.films[id]||{}).cr){filmDetails(id).then(function(f){if(state.watch[id]&&filmDate(f)&&state.watch[id].d!==filmDate(f)){state.watch[id].d=filmDate(f);persist();syncAlerts();}if(ui.sheet&&ui.sheet.kind==='film'&&ui.sheet.id===id)renderLayer();},function(){});}},
  seenFilm:function(v){var w=state.watch[+v],fl=catalog.films[+v]||(w?{id:+v,t:w.t,p:w.p,g:[]}:null);if(!fl)return;ui.sheet=null;openForm(formFromFilm(fl));},
  myFilm:function(v){ui.sheet={kind:'myfilm',k:v};renderLayer();},
  againFilm:function(v){var s=state.sessions.find(function(x){return x.id===v;});if(!s)return;var f=newForm();f.title=s.title;f.tmdb=s.tmdb;f.poster=s.poster;f.genres=(s.genres||[]).slice();f.tech=s.tech;ui.sheet=null;openForm(f);},
  keyEdit:function(v){ui.keyEdit=v;render();var i=document.getElementById(v==='tmdb'?'tmdbkey':'ghtoken');if(i)i.focus();},
  keyDel:function(v){secretSet(v,'').then(function(){ui.keyEdit=null;if(v==='tmdb'){catalog.lists={};saveCatalog();}toast('Clé supprimée de cet appareil');render();});},
  saveKey:function(){
    var i=document.getElementById('tmdbkey'),v=i?(i.value||'').trim():'';
    if(i&&!v){toast('Collez votre clé TMDB');return;}
    (v?secretSet('tmdb',v):Promise.resolve(true)).then(function(){
    if(v){catalog.lists={};saveCatalog();ui.keyEdit=null;render();}
    if(!hasSecret('tmdb')){toast('Clé non enregistrée');return;}
    toast('Test de la clé…');
    tmdb('/configuration').then(function(){toast('Clé valide : la base de films est connectée');catalog.genres={};loadGenres().catch(function(){});state.sessions.forEach(function(s){delete s.tmdbTried;});enrichTmdb();render();},function(e){toast(tmdbErr(e));});
    });
  },
  export:function(){saveText('rentabpass-'+todayISO()+'.json',JSON.stringify({app:'rentabpass',v:2,exportedAt:new Date().toISOString(),data:state},null,1),'application/json','Copie de sauvegarde');},
  exportCsv:function(){saveText('rentabpass-seances-'+todayISO()+'.csv',csv(),'text/csv','Tableau CSV');},
  copyJson:function(){var t=ui.sheet.text;var a=document.getElementById('jsonout');try{navigator.clipboard.writeText(t).then(function(){toast('Copié');},function(){a.select();toast('Sélectionné : copiez avec le menu');});}catch(e){a.select();}},
  ghSave:function(){
    var c=ghConf();c.repo=(document.getElementById('ghrepo').value||'').trim();ghSave(c);
    var i=document.getElementById('ghtoken'),v=i?(i.value||'').trim():'';
    (v?secretSet('github',v):Promise.resolve(true)).then(function(){ui.keyEdit=null;checkUpdate(true);});
  },
  installUpdate:function(){if(!update.avail||update.progress!==null)return;update.progress=0;ui.sheet=null;render();try{BRIDGE.installUpdate(update.avail.url,'','1.0.'+update.avail.n);}catch(e){update.progress=null;toast('Mise à jour impossible');render();}},
  openAppInfo:function(){try{BRIDGE.openSettings();}catch(e){}},
  pickImport:function(){try{BRIDGE.pickText();}catch(e){toast('Sélecteur de fichiers indisponible : utilisez « Coller un texte »');}},
  pasteSheet:function(){ui.sheet={kind:'paste'};renderLayer();},
  pasteDo:function(){var t=(document.getElementById('pastein')||{}).value||'';try{importText(t);}catch(e){toast('Texte non reconnu : copiez tout le contenu du fichier');}},
  mergeDo:function(){
    var m=mergeSplit(ui.sheet.list);if(!m.add.length){ui.sheet=null;renderLayer();return;}
    m.add.forEach(function(x){state.sessions.push(x);var ym=ymOf(x.date);if(!state.months[ym]){var mp0=monthPass(ym);state.months[ym]={f:mp0.f,duo:mp0.duo};}});
    if(cleanWatch())syncAlerts();
    state.setup=true;persist();ui.sheet=null;ui.tab='hist';render();toast(m.add.length+' séances ajoutées');enrichTmdb();
  },
  importDo:function(){state=ui.sheet.data;state.setup=true;persist();ui.sheet=null;render();toast('Sauvegarde importée');}
};

function refreshFoot(){var e=document.getElementById('ffoot');if(e)e.innerHTML=formFootHTML();var p=document.getElementById('fpassinfo');if(p)p.textContent=passInfo();}
function refreshTitle(picked){
  var f=ui.form,p=document.getElementById('fposter'),s=document.getElementById('fsugg'),l=document.getElementById('fposterlbl'),m=document.getElementById('fmeta');
  if(p)p.innerHTML=posterHTML(f.title||'?',f.poster,true);if(s)s.innerHTML=picked?'':suggHTML();if(l)l.textContent=posters[keyOf(f.title)]?'Changer la photo':'Photo de l’affiche';if(m)m.textContent=(f.genres||[]).slice(0,3).join(' · ');
  var mt=state.sessions.filter(function(x){return norm(x.title)===norm(f.title);}).sort(sortDesc)[0];
  if(mt&&!f.id&&!f._techTouched){f.tech=mt.tech;document.querySelectorAll('.tech').forEach(function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-v')===f.tech));});refreshFoot();}
}

/* fichier choisi via le sélecteur Android */
window.rpFileText=function(t){
  if(!t){toast('Fichier illisible : essayez « Coller un texte »');return;}
  try{importText(t);}catch(e){toast('Fichier non reconnu : choisissez le fichier .json de Rentab’Pass');}
};
window.rpNotifChanged=function(){if(canUpdate()&&Date.now()-ghConf().last>30*60*1000)checkUpdate(false,true);if(ui.tab==='set'||ui.tab==='films')render();syncAlerts();};
/* glisser à gauche / à droite : mois suivant / précédent sur l'accueil, menu suivant / précédent dans Films */
var sw=null;
document.addEventListener('touchstart',function(e){
  if(ui.sheet||e.touches.length!==1)return;
  var t=e.target;if(t.closest('.chips,.seg,input,textarea,.pgrid button'))return;
  if(!t.closest('.scroll')&&!t.closest('.top'))return;
  sw={x:e.touches[0].clientX,y:e.touches[0].clientY,t:Date.now()};
},{passive:true});
document.addEventListener('touchend',function(e){
  if(!sw)return;var c=e.changedTouches[0],dx=c.clientX-sw.x,dy=c.clientY-sw.y,dt=Date.now()-sw.t;sw=null;
  if(Math.abs(dx)<60||Math.abs(dx)<Math.abs(dy)*1.6||dt>800)return;
  var dir=dx<0?1:-1;
  if(ui.tab==='home'){ui.ym=addMonths(ui.ym,dir);render();}
  else if(ui.tab==='films'){
    var tabs=['now','up','watch'],i=tabs.indexOf(ui.films.tab),j=i+dir;
    if(j<0||j>=tabs.length)return;
    ui.films.tab=tabs[j];ui.films.q='';filmsState.results=null;filmsState.err=null;render();var sc0=document.querySelector('.scroll');if(sc0)sc0.scrollTop=0;ensureFilms();
  }else return;
},{passive:true});
document.addEventListener('touchcancel',function(){sw=null;},{passive:true});
/* appui long sur une affiche (onglet Films) : affiche en grand jusqu'au prochain appui */
var lp=null,lpFired=false;
function posterZoom(el,title){
  var bg=el.style.backgroundImage||'',m=bg.match(/url\(["']?([^"')]+)["']?\)/),src=m?m[1].replace(/\/w(92|185|342)\//,'/w780/'):'';
  var z=document.createElement('div');z.id='zoom';z.setAttribute('role','dialog');z.setAttribute('aria-label','Affiche de '+title);
  var zi=document.createElement('div');zi.className='zi';
  if(src)zi.style.backgroundImage='url("'+src+'")';else{zi.style.background=el.style.background||'#2A2A30';var sp=document.createElement('span');sp.textContent=initials(title);zi.appendChild(sp);}
  var zt=document.createElement('div');zt.className='zt';zt.textContent=title;
  z.appendChild(zi);z.appendChild(zt);
  z.addEventListener('click',function(e){e.stopPropagation();z.remove();});
  document.body.appendChild(z);
}
document.addEventListener('pointerdown',function(e){
  if(ui.tab!=='films'||ui.sheet)return;
  var btn=e.target.closest('[data-act="film"]');if(!btn)return;
  var img=btn.querySelector('.pimg,.poster');if(!img)return;
  var title=(btn.querySelector('.pt')||btn.querySelector('span[style*="font-weight:600"]')||{}).textContent||'';
  lp={x:e.clientX,y:e.clientY,t:setTimeout(function(){lpFired=true;lp=null;posterZoom(img,title);},450)};
},true);
['pointerup','pointercancel'].forEach(function(ev){document.addEventListener(ev,function(){if(lp){clearTimeout(lp.t);lp=null;}},true);});
document.addEventListener('pointermove',function(e){if(lp&&(Math.abs(e.clientX-lp.x)>10||Math.abs(e.clientY-lp.y)>10)){clearTimeout(lp.t);lp=null;}},true);
document.addEventListener('click',function(e){if(lpFired){lpFired=false;e.preventDefault();e.stopPropagation();}},true);
document.addEventListener('contextmenu',function(e){if(e.target.closest('.pimg,.poster,#zoom'))e.preventDefault();});
/* bouton « Ajouter une séance » : se masque après 1,5 s sans interaction, réapparaît au moindre geste */
var fabT=null;
function fabWake(){
  var f=document.querySelector('.fab');if(!f)return;
  f.classList.remove('idle');clearTimeout(fabT);
  fabT=setTimeout(function(){var g=document.querySelector('.fab');if(g&&document.activeElement!==g&&!ui.sheet)g.classList.add('idle');},1500);
}
['pointerdown','touchstart','keydown','wheel'].forEach(function(ev){document.addEventListener(ev,fabWake,{passive:true,capture:true});});
document.addEventListener('scroll',fabWake,{passive:true,capture:true});
/* bouton retour Android */
window.rpBack=function(){
  var zm=document.getElementById('zoom');if(zm){zm.remove();return true;}
  if(ui.sheet){if(!sheetBack())closeAllSheets();return true;}
  if(ui.tab==='form'){A.cancelForm();return true;}
  if(ui.tab!=='home'){go('home');return true;}
  /* un glissement depuis le bord de l'écran déclenche le « retour » d'Android : on demande une confirmation avant de quitter */
  if(Date.now()-(window.__backAt||0)>2000){window.__backAt=Date.now();toast('Refaites « retour » pour quitter');return true;}
  return false;
};

document.addEventListener('click',function(e){
  var el=e.target.closest('[data-act]');if(!el)return;
  var a=el.getAttribute('data-act');if(a==='ftech'&&ui.form)ui.form._techTouched=true;
  if(A[a]){e.preventDefault();A[a](el.getAttribute('data-v'));}
});
document.addEventListener('submit',function(e){var f=e.target.getAttribute('data-form');if(f==='filmSearch'){e.preventDefault();clearTimeout(searchT);runFilmSearch();var i=document.getElementById('fq');if(i)i.blur();}});
document.addEventListener('input',function(e){
  var k=e.target.getAttribute('data-in');if(!k)return;var v=e.target.value;
  if(k==='q'||k==='fq'){
    if(k==='q')ui.q=v;else ui.films.q=v;
    var pos=e.target.selectionStart,id=e.target.id;
    if(k==='fq'){clearTimeout(searchT);if(!v.trim()){filmsState.results=null;render();}else{searchT=setTimeout(runFilmSearch,600);return;}}
    else render();
    var i=document.getElementById(id);if(i){i.focus();try{i.setSelectionRange(pos,pos);}catch(x){}}return;
  }
  if(k==='psFrom'){if(/^\d{4}-\d{2}-\d{2}$/.test(v)){ui.sheet.from=v;psRefresh();}return;}
  if(k==='psPrice'){
    var raw=v.replace(/[^0-9.,]/g,'').replace('.',','),m=raw.match(/^(\d{0,4})(,\d{0,2})?/),txt=m?m[0]:'';
    if(txt!==v)e.target.value=txt;
    var n=parseFloat(txt.replace(',','.'));var id2=ui.sheet.editing;ui.sheet.texts[id2]=txt;ui.sheet.drafts[id2]=isNaN(n)?0:n;psRefresh();return;
  }
  if(ui.form&&['title','date','time','room'].indexOf(k)>=0){
    ui.form[k]=v;
    if(k==='title'){e.target.style.outline='';if(ui.form.tmdb&&norm(v)!==norm((catalog.films[ui.form.tmdb]||{}).t||'')){ui.form.tmdb=null;ui.form.poster=null;ui.form.genres=[];}refreshTitle();formSearch();}
    if(k==='date')refreshFoot();
  }
});
document.addEventListener('change',function(e){
  var k=e.target.getAttribute('data-file');if(!k)return;var file=e.target.files&&e.target.files[0];e.target.value='';if(!file)return;
  if(k==='poster'){
    if(!ui.form||!(ui.form.title||'').trim()){toast('Saisissez d’abord le titre');return;}
    resizeImage(file).then(function(d){savePoster(ui.form.title.trim(),d);refreshTitle(true);toast('Photo ajoutée');},function(){toast('Image illisible');});
  }
  if(k==='import'){
    file.text().then(importText).catch(function(){toast('Fichier de sauvegarde invalide');});
  }
});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&ui.sheet){if(!sheetBack())closeAllSheets();}});

loadLocal();
if(cleanWatch())saveLocal();
render();
setBanner();
connect();
if(canUpdate())setTimeout(function(){checkUpdate(false,true);},5300);
if(IS_APP)syncAlerts();
migrateSecrets().then(vaultLoad).catch(noop).then(function(){
  render();
  if(CAN_TMDB&&tmdbKey()){loadList('now').then(function(){if(ui.tab==='films'||ui.tab==='form')render();},noop);refreshWatchDates();enrichTmdb();}
});
/* site web : fonctionne hors connexion et s'installe comme une application */
if(IS_WEB&&'serviceWorker' in navigator&&location.protocol==='https:'){navigator.serviceWorker.register('sw.js').catch(noop);}

/* écran de démarrage */
(function(){
  var sp=document.getElementById('splash');if(!sp)return;
  var t=sp.querySelector('.ttl');'RENTAB’PASS'.split('').forEach(function(c,i){var e=document.createElement('span');e.textContent=c;e.style.animationDelay=(0.35+i*0.05)+'s';if(c==='’')e.style.color='#FFC20E';t.appendChild(e);});
  var y=new Date().getFullYear(),yi=yearInfo(y),sub=document.getElementById('splashsub');
  if(state.sessions.length&&yi.count){
    var target=yi.saving,el=document.createElement('span');sub.appendChild(document.createTextNode(y+' : '));var b=document.createElement('b');sub.appendChild(b);sub.appendChild(document.createTextNode(target>=0?' économisés':' à rattraper'));
    var t0=null;function step(ts){if(!t0)t0=ts;var k=Math.min(1,(ts-t0-900)/800);if(k<0)k=0;b.textContent=signed(target*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(step);}requestAnimationFrame(step);
  }else sub.textContent='Chaque séance compte';
  var v=IS_APP&&BRIDGE&&typeof BRIDGE.appVersion==='function'?'Version 1.0.'+appVersion():(IS_WEB?'Version web':'Version web (Claude)');
  document.getElementById('splashver').innerHTML='<b>'+esc(v)+'</b><br>Copyright : Stanji';
  var done=false;function hide(){if(done)return;done=true;sp.classList.add('out');setTimeout(function(){if(sp.parentNode)sp.parentNode.removeChild(sp);},550);}
  document.getElementById('splashskip').addEventListener('click',hide);sp.addEventListener('click',hide);
  setTimeout(hide,5000);
})();
})();
