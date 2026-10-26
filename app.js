/* Copy Archive 一覧ページ。data/manifest.json と data/shard-*.json を読み、絞り込み・検索・3つの表示を行う。 */
(function(){
const LANGS={ja:"日本語",en:"英語",de:"ドイツ語",fr:"フランス語",it:"イタリア語",es:"スペイン語",pt:"ポルトガル語",nl:"オランダ語",sv:"スウェーデン語",da:"デンマーク語",no:"ノルウェー語",fi:"フィンランド語",pl:"ポーランド語",ru:"ロシア語",tr:"トルコ語",zh:"中国語",ko:"韓国語",th:"タイ語",vi:"ベトナム語",id:"インドネシア語",hi:"ヒンディー語",ar:"アラビア語",he:"ヘブライ語"};
const KIND={tagline:"スローガン",headline:"ヘッドライン",award_entry:"受賞作",competition:"公募入賞",historical_ad:"歴史広告"};
const ERA={1880:[["#2A211A","#EADBB9"]],1890:[["#2A211A","#EADBB9"]],1900:[["#3B2E22","#F1E4C7"]],1910:[["#3B2E22","#F1E4C7"]],1920:[["#2A211A","#EADBB9"],["#E9DCC2","#3A2A1A"]],1930:[["#2A211A","#EADBB9"],["#3B2E22","#F1E4C7"]],1940:[["#2A211A","#EADBB9"],["#3B2E22","#F1E4C7"]],1950:[["#C4352B","#FFF2E0"],["#F0E2C8","#7A1F17"]],1960:[["#EFEDE6","#121212"],["#121212","#EFEDE6"]],1970:[["#D4802C","#1D140A"],["#5B3A1E","#F6D9A8"]],
  1980:[["#1C2A6E","#F4F0E4"],["#E8D9F0","#2B1B57"]],1990:[["#0E5E4D","#E9F5EE"],["#D9E8DF","#0B3D32"]],2000:[["#3A3FD1","#FFFFFF"],["#E7E7FF","#1E2290"]],2010:[["#E6E6E6","#111111"],["#111111","#E6E6E6"]],2020:[["#FF5A36","#120A08"],["#1A1A1A","#FF8A6A"]]};
const S={items:[],main:[],tm:[],set:"main",m:null,tmLoading:false,q:"",country:"",lang:"",kind:"",sort:"old",decade:"",award:"",view:"list",shown:48,loaded:0,total:0};
const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const langName=c=>LANGS[String(c||"").toLowerCase()]||(c?String(c):"言語不明");
const decadeOf=y=>y?Math.floor(Number(y)/10)*10:null;
const text=it=>it.c||it.t||"";
const byYear=(a,b)=>(a.y||9999)-(b.y||9999)||text(a).localeCompare(text(b));
const hash=s=>{s=s??"";let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))|0;return Math.abs(h)};
const colors=it=>{const d=decadeOf(it.y);const set=ERA[d]||(d&&d<1880?ERA[1880]:d?ERA[2020]:[["#262626","#DDDDDD"]]);return set[hash(it.i||it.s)%set.length]};
const weight=t=>[...String(t||"")].reduce((n,c)=>n+(/[　-鿿＀-￯]/.test(c)?1.8:1),0);
const zoom=t=>{const w=weight(t);return w<=9?"z1":w<=20?"z2":w<=46?"z3":"z4"};
const script=t=>/[぀-ヿ一-鿿]/.test(t||"")?"ja":"latin";
const href=it=>it.s?`https://tsdr.uspto.gov/#caseNumber=${it.s}&caseType=SERIAL_NO&searchType=statusSearch`:`w/${it.i}.html`;
const ext=it=>it.s?` target="_blank" rel="noopener"`:"";
const hay=it=>it._h||(it._h=[it.c,it.t,it.cl,it.b,it.a,(it.w||[]).join(" "),it.co,langName(it.l)].join(" ").toLowerCase());

function poster(it){
  const [bg,fg]=colors(it);const t=text(it);
  return `<div class="poster" style="--pbg:${bg};--pfg:${fg}"><div class="pin">
    <div class="p-top"><span>${esc(it.cl||it.b||"")}</span><span>${esc(it.y||"")}</span></div>
    <p class="p-copy ${script(t)} ${zoom(t)}">${esc(t)}</p></div>
    ${it.aw?`<span class="badge">受賞 ${it.aw}</span>`:""}
    <div class="hoverinfo">${esc((it.w||[]).join("、")||"コピーライター不明")}${it.a?"・"+esc(it.a):""}</div></div>`;
}

function filtered(){
  const q=S.q.trim().toLowerCase();
  const cmp=S.sort==="new"?(a,b)=>byYear(b,a):S.sort==="lang"?(a,b)=>langName(a.l).localeCompare(langName(b.l),"ja")||byYear(a,b)
    :S.sort==="country"?(a,b)=>String(a.co||"").localeCompare(String(b.co||""),"ja")||byYear(a,b):byYear;
  return S.items.filter(it=>{
    if(S.country&&it.co!==S.country)return false;
    if(S.lang&&it.l!==S.lang)return false;
    if(S.kind&&it.k!==S.kind)return false;
    if(S.decade&&String(decadeOf(it.y))!==S.decade)return false;
    if(S.award&&!it.aw)return false;
    return !q||hay(it).includes(q);
  }).sort(cmp);
}

function fillSelect(el,values,label){const cur=el.value;el.innerHTML=`<option value="">${label}</option>`+values.map(v=>`<option value="${esc(v[0])}">${esc(v[1])}</option>`).join("");el.value=values.some(v=>String(v[0])===cur)?cur:""}
function refreshFilters(){
  const count=(f)=>{const m={};S.items.forEach(i=>{const v=f(i);if(v)m[v]=(m[v]||0)+1});return m};
  const cs=count(i=>i.co);fillSelect($("#fCountry"),Object.keys(cs).sort((a,b)=>cs[b]-cs[a]).map(c=>[c,`${c}（${cs[c]}）`]),"国");
  const ds=count(i=>decadeOf(i.y));fillSelect($("#fDecade"),Object.keys(ds).sort().map(d=>[d,`${d}年代（${ds[d]}）`]),"年代");
  const ks=count(i=>i.k);fillSelect($("#fKind"),Object.keys(ks).map(k=>[k,`${KIND[k]||k}（${ks[k]}）`]),"種類");
  const ls=count(i=>i.l);const keys=Object.keys(ls).sort((a,b)=>ls[b]-ls[a]);
  $("#langPills").innerHTML=`<button class="pill" type="button" data-lang="" aria-pressed="${!S.lang}">すべて<small>${S.items.length}</small></button>`+
    keys.map(l=>`<button class="pill" type="button" data-lang="${esc(l)}" aria-pressed="${S.lang===l}">${esc(langName(l))}<small>${ls[l]}</small></button>`).join("");
}

let io=null;
function render(){
  const list=filtered();
  $("#count").textContent=`${list.length.toLocaleString()} / ${S.items.length.toLocaleString()}`+(S.items.length<S.total?`（読み込み中 ${Math.round(S.items.length/S.total*100)}%）`:"");
  const label=[S.lang?langName(S.lang):"",S.country,S.kind?KIND[S.kind]:"",S.decade?S.decade+"年代":"",S.award?"受賞あり":"",S.q?`「${S.q}」`:""].filter(Boolean).join("・");
  $("#introTitle").innerHTML=`世界の広告コピー <b>${esc(label||"すべて")}</b>`;
  const main=$("#main");if(io){io.disconnect();io=null}
  if(!list.length){main.innerHTML=`<div class="empty"><strong>${S.items.length?"条件に合うコピーがありません":"読み込み中"}</strong></div>`;return}
  if(S.view==="list"){
    main.innerHTML=`<div class="grid">`+list.slice(0,S.shown).map(it=>`
      <a class="item" href="${href(it)}"${ext(it)}>${poster(it)}
        <div class="cap"><span class="fav">${esc(String(it.co||"—").slice(0,2))}</span><span class="nm">${esc([it.cl,it.b&&it.b!==it.cl?it.b:""].filter(Boolean).join(" ・ ")||"クライアント不明")}</span><span class="yr mono">${esc(it.s?"商標登録":KIND[it.k]||"")}</span></div>
      </a>`).join("")+`</div>`+(list.length>S.shown?`<div class="more">さらに表示しています</div><div class="sentinel" id="sentinel"></div>`:"");
    const sen=$("#sentinel");if(sen&&"IntersectionObserver" in window){io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){S.shown+=48;render()}},{rootMargin:"800px"});io.observe(sen)}
  }else if(S.view==="people"){
    const map=new Map();list.forEach(it=>(it.w||[]).forEach(w=>{if(!map.has(w))map.set(w,[]);map.get(w).push(it)}));
    const people=[...map.entries()].sort((a,b)=>b[1].length-a[1].length||a[0].localeCompare(b[0],"ja")).slice(0,300);
    main.innerHTML=`<div class="people">`+people.map(([w,its])=>`<section class="person"><h3><span>${esc(w)}</span><span>${its.length}</span></h3><ul>${its.slice(0,30).map(it=>`<li><a class="row" href="${href(it)}"${ext(it)}><span class="t">${esc(text(it))}</span><span class="s">${esc(it.y||"")}</span></a></li>`).join("")}</ul></section>`).join("")+`</div>`+(map.size>300?`<p class="more">コピーライター上位300人を表示（全${map.size.toLocaleString()}人）。検索で絞り込めます。</p>`:"");
  }else{
    const groups=new Map();list.slice(0,3000).forEach(it=>{const d=decadeOf(it.y)??"不明";if(!groups.has(d))groups.set(d,[]);groups.get(d).push(it)});
    main.innerHTML=[...groups.entries()].map(([d,its])=>`<section class="decade"><h2>${d==="不明"?"年不明":d+"s"}</h2><ol>${its.map(it=>`<li><a class="row" href="${href(it)}"${ext(it)}><span class="s">${esc(it.y||"—")}</span><span class="t">${esc(text(it))}</span><span class="s">${esc(it.cl||"")}</span></a></li>`).join("")}</ol></section>`).join("")+(list.length>3000?`<p class="more">先頭3,000件を表示。年代や国で絞り込むと全件見られます。</p>`:"");
  }
}

function setView(v){S.view=v;document.querySelectorAll("#viewSeg button").forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.view===v)))}
[["#fCountry","country"],["#fSort","sort"],["#fDecade","decade"],["#fKind","kind"],["#fAward","award"]].forEach(([s,k])=>$(s).addEventListener("change",e=>{S[k]=e.target.value;S.shown=48;render()}));
$("#langPills").addEventListener("click",e=>{const b=e.target.closest("[data-lang]");if(!b)return;S.lang=b.dataset.lang;S.shown=48;document.querySelectorAll("#langPills .pill").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));render()});
document.querySelectorAll("#viewSeg button").forEach(b=>b.addEventListener("click",()=>{setView(b.dataset.view);render()}));
/* 収録の範囲: 広告コピー（常に読む）／商標スローガン（40万件規模なので選んだときだけ読む） */
async function setSet(v){
  S.set=v;S.shown=48;S.lang="";S.country="";S.kind="";S.decade="";S.award="";
  document.querySelectorAll("[data-set]").forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.set===v)));
  S.items=v==="tm"?S.tm:S.main;S.total=v==="tm"?S.m.tm:S.m.main;
  if(v==="tm"&&S.view==="people")setView("list");
  refreshFilters();render();
  if(v==="tm"&&!S.tmLoading){S.tmLoading=true;
    for(const f of S.m.tm_shards){const rows=await fetch("data/"+f).then(r=>r.json());S.tm.push(...rows);if(S.set==="tm"){refreshFilters();render()}}}
}
document.querySelectorAll("[data-set]").forEach(b=>b.addEventListener("click",()=>setSet(b.dataset.set)));
let qt=null;$("#q").addEventListener("input",e=>{clearTimeout(qt);qt=setTimeout(()=>{S.q=e.target.value;S.shown=48;render()},180)});
document.addEventListener("keydown",e=>{if(((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k")||(e.key==="/"&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||""))){e.preventDefault();$("#q").focus();$("#q").select()}});

(async()=>{
  const m=await fetch("data/manifest.json").then(r=>r.json());
  S.m=m;S.total=m.main;S.items=S.main;
  if(!m.tm){$("#tmBtn").parentElement.hidden=true}else{$("#tmBtn").innerHTML=`商標スローガン<small>${m.tm.toLocaleString()}</small>`}
  $("#stats").innerHTML=`<span>収録 <b>${m.total.toLocaleString()}</b> 件</span><span>コピー本文あり <b>${m.with_copy.toLocaleString()}</b></span><span>コピーライター判明 <b>${m.with_writer.toLocaleString()}</b></span><span>情報源 <b>${m.sources}</b></span><span>更新 ${esc(m.updated)}</span>`;
  for(const f of m.shards){
    const rows=await fetch("data/"+f).then(r=>r.json());
    S.main.push(...rows);
    if(S.set==="main"){refreshFilters();render()}
  }
})();
})();
