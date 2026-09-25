(function(){
"use strict";

/* ===== 1. DATA =============================================
   Hiragana is written out; katakana is derived by codepoint
   shift (+0x60), which is exact for every standard kana.
   ========================================================== */

var HIRA_BASIC_ROWS = [
  ["あ","a"],["い","i"],["う","u"],["え","e"],["お","o"],
  ["か","ka"],["き","ki"],["く","ku"],["け","ke"],["こ","ko"],
  ["さ","sa"],["し","shi|si"],["す","su"],["せ","se"],["そ","so"],
  ["た","ta"],["ち","chi|ti"],["つ","tsu|tu"],["て","te"],["と","to"],
  ["な","na"],["に","ni"],["ぬ","nu"],["ね","ne"],["の","no"],
  ["は","ha"],["ひ","hi"],["ふ","fu|hu"],["へ","he"],["ほ","ho"],
  ["ま","ma"],["み","mi"],["む","mu"],["め","me"],["も","mo"],
  ["や","ya"],null,["ゆ","yu"],null,["よ","yo"],
  ["ら","ra"],["り","ri"],["る","ru"],["れ","re"],["ろ","ro"],
  ["わ","wa"],null,null,null,["を","wo|o"],
  ["ん","n|nn"],null,null,null,null
];
var BASIC_LABELS = ["あ","か","さ","た","な","は","ま","や","ら","わ","ん"];

var HIRA_DAKU_ROWS = [
  ["が","ga"],["ぎ","gi"],["ぐ","gu"],["げ","ge"],["ご","go"],
  ["ざ","za"],["じ","ji|zi"],["ず","zu"],["ぜ","ze"],["ぞ","zo"],
  ["だ","da"],["ぢ","ji|di"],["づ","zu|du"],["で","de"],["ど","do"],
  ["ば","ba"],["び","bi"],["ぶ","bu"],["べ","be"],["ぼ","bo"],
  ["ぱ","pa"],["ぴ","pi"],["ぷ","pu"],["ぺ","pe"],["ぽ","po"]
];
var DAKU_LABELS = ["が","ざ","だ","ば","ぱ"];

var YOON_SPEC = [
  ["き","kya","kyu","kyo"],
  ["し","sha|sya","shu|syu","sho|syo"],
  ["ち","cha|tya","chu|tyu","cho|tyo"],
  ["に","nya","nyu","nyo"],
  ["ひ","hya","hyu","hyo"],
  ["み","mya","myu","myo"],
  ["り","rya","ryu","ryo"],
  ["ぎ","gya","gyu","gyo"],
  ["じ","ja|zya|jya","ju|zyu","jo|zyo"],
  ["ぢ","ja|dya","ju|dyu","jo|dyo"],
  ["び","bya","byu","byo"],
  ["ぴ","pya","pyu","pyo"]
];

var KATA_EXT = [
  ["イェ","ye"],["ウィ","wi"],["ウェ","we"],["ウォ","wo"],
  ["ヴ","vu"],["ヴァ","va"],["ヴィ","vi"],["ヴェ","ve"],["ヴォ","vo"],
  ["シェ","she"],["ジェ","je"],["チェ","che"],
  ["ティ","ti"],["トゥ","tu"],["ディ","di"],["ドゥ","du"],["テュ","tyu"],["デュ","dyu"],
  ["ツァ","tsa"],["ツィ","tsi"],["ツェ","tse"],["ツォ","tso"],
  ["ファ","fa"],["フィ","fi"],["フェ","fe"],["フォ","fo"],["フュ","fyu"],
  ["クァ","kwa"],["クィ","kwi"],["クェ","kwe"],["クォ","kwo"],["グァ","gwa"]
];

function toKata(s){
  var out="";
  for(var i=0;i<s.length;i++){
    var c=s.charCodeAt(i);
    out += (c>=0x3041 && c<=0x3096) ? String.fromCharCode(c+0x60) : s.charAt(i);
  }
  return out;
}

var CARDS=[], BY_KANA={};
function addCard(kana, romajiStr, script, set){
  var c={k:kana, r:romajiStr.split("|"), script:script, set:set};
  CARDS.push(c); BY_KANA[kana]=c; return c;
}
function buildRows(rows, script, set){
  var out=[];
  for(var i=0;i<rows.length;i++){
    var e=rows[i];
    if(!e){ out.push(null); continue; }
    out.push(addCard(script==="kata"?toKata(e[0]):e[0], e[1], script, set));
  }
  return out;
}
var GRID={hira:{},kata:{}};
["hira","kata"].forEach(function(sc){
  GRID[sc].basic   = buildRows(HIRA_BASIC_ROWS, sc, "basic");
  GRID[sc].dakuten = buildRows(HIRA_DAKU_ROWS, sc, "dakuten");
  var y=[], smalls=["ゃ","ゅ","ょ"];
  YOON_SPEC.forEach(function(spec){
    for(var j=0;j<3;j++){
      var kana=spec[0]+smalls[j];
      if(sc==="kata") kana=toKata(kana);
      y.push(addCard(kana, spec[j+1], sc, "yoon"));
    }
  });
  GRID[sc].yoon=y;
});
GRID.kata.ext = KATA_EXT.map(function(e){ return addCard(e[0], e[1], "kata", "ext"); });
GRID.hira.ext = [];

/* look-alike groups drive the distractors in Pick mode */
var LOOKALIKE_RAW = [
  "あおめぬ","いり","うつら","きさち","しつく","すむ","せちさ","そろ","たなにけ",
  "ぬねれわめ","はほまけ","ひびぴ","ふぶぷ","へくし","まもほ","るろよ","んそ","よまはほ",
  "アマムヌ","イノンソリ","ウワクヲフ","エユコヨ","オホヤ","カケセヤ","キサナメ",
  "シツソンリ","スヌクタ","チテナ","トイヒ","ネホオ","ハヘヒ","ミシツ","ムロコ",
  "ラウフ","レルンノ","ロコユ","ヲラヌ","ケクタ","サキ","ヤセホ"
];
var LOOKALIKE={};
LOOKALIKE_RAW.forEach(function(group){
  for(var i=0;i<group.length;i++){
    var ch=group.charAt(i);
    if(!LOOKALIKE[ch]) LOOKALIKE[ch]=[];
    for(var j=0;j<group.length;j++){
      if(i!==j && LOOKALIKE[ch].indexOf(group.charAt(j))<0) LOOKALIKE[ch].push(group.charAt(j));
    }
  }
});

/* ===== 2. STATE + STORAGE ================================= */

var STORE_KEY="kana-practice-v1";
var state={
  scripts:{hira:true,kata:true},
  sets:{basic:true,dakuten:false,yoon:false,ext:false},
  font:"mincho",
  view:"chart"
};
var stats={};
var session={right:0,wrong:0,streak:0,best:0,turn:0};
var lastKana=null;

var mem={};
var storage={
  get:function(key){
    if(window.storage && window.storage.get){
      return window.storage.get(key).then(function(r){ return r?r.value:null; })
        .catch(function(){ return mem[key]||null; });
    }
    return Promise.resolve(mem[key]||null);
  },
  set:function(key,val){
    mem[key]=val;
    if(window.storage && window.storage.set){
      return window.storage.set(key,val).catch(function(){ return null; });
    }
    return Promise.resolve(null);
  }
};

var saveTimer=null;
function save(){
  clearTimeout(saveTimer);
  saveTimer=setTimeout(function(){
    var payload=JSON.stringify({stats:stats,prefs:{scripts:state.scripts,sets:state.sets,font:state.font},best:session.best});
    storage.set(STORE_KEY,payload);
    var el2=document.getElementById("saveState");
    el2.textContent="progress saved";
    setTimeout(function(){ el2.textContent="progress saves automatically"; },1400);
  },350);
}
function load(){
  return storage.get(STORE_KEY).then(function(raw){
    if(!raw) return;
    try{
      var d=JSON.parse(raw);
      if(d.stats) stats=d.stats;
      if(d.best) session.best=d.best;
      if(d.prefs){
        if(d.prefs.scripts) state.scripts=d.prefs.scripts;
        if(d.prefs.sets) state.sets=d.prefs.sets;
        if(d.prefs.font) state.font=d.prefs.font;
      }
    }catch(e){}
  });
}
function stat(k){
  if(!stats[k]) stats[k]={box:0,seen:0,right:0,wrong:0};
  return stats[k];
}

/* ===== 3. DECK + SPACED SELECTION ========================= */

function deck(){
  return CARDS.filter(function(c){ return state.scripts[c.script] && state.sets[c.set]; });
}
function weight(c){
  var s=stat(c.k);
  var w=6-Math.min(s.box,5);
  if(s.seen===0) w+=3;
  var miss=s.wrong-s.right*0.35;
  if(miss>0) w+=Math.min(6,miss*1.8);
  if(c.k===lastKana) w=0.02;
  return Math.max(0.05,w);
}
function nextCard(){
  var d=deck();
  if(!d.length) return null;
  if(d.length===1) return d[0];
  var total=0, ws=[];
  for(var i=0;i<d.length;i++){ var w=weight(d[i]); ws.push(w); total+=w; }
  var roll=Math.random()*total;
  for(var j=0;j<d.length;j++){ roll-=ws[j]; if(roll<=0) return d[j]; }
  return d[d.length-1];
}
function grade(card,correct){
  var s=stat(card.k);
  s.seen++; session.turn++;
  if(correct){
    s.right++; s.box=Math.min(5,s.box+1);
    session.right++; session.streak++;
    if(session.streak>session.best) session.best=session.streak;
  }else{
    s.wrong++; s.box=0;
    session.wrong++; session.streak=0;
  }
  lastKana=card.k;
  save();
}

/* ===== 4. HELPERS ========================================= */

function $(id){ return document.getElementById(id); }
function el(tag,cls,text){
  var n=document.createElement(tag);
  if(cls) n.className=cls;
  if(text!=null) n.textContent=text;
  return n;
}
function normalize(s){ return String(s).toLowerCase().replace(/[\s\-_'’]/g,""); }
function isCorrect(card,input){
  var v=normalize(input);
  if(!v) return false;
  for(var i=0;i<card.r.length;i++){ if(normalize(card.r[i])===v) return true; }
  return false;
}
function shuffle(a){
  for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; }
  return a;
}
function accuracy(){
  var t=session.right+session.wrong;
  return t ? Math.round(session.right/t*100)+"%" : "—";
}
var FONT_STACKS={
  mincho:"'Zen Old Mincho','Hiragino Mincho ProN','Yu Mincho','MS Mincho',serif",
  gothic:"'Zen Kaku Gothic New','Hiragino Sans','Yu Gothic','MS Gothic',sans-serif",
  maru:"'Zen Maru Gothic','Hiragino Maru Gothic ProN',sans-serif"
};
function applyFont(){
  document.documentElement.style.setProperty("--kana-font",FONT_STACKS[state.font]);
  if(state.view==="write") drawPad();
}

var jaVoice=null;
function findVoice(){
  if(!("speechSynthesis" in window)) return;
  var vs=window.speechSynthesis.getVoices();
  for(var i=0;i<vs.length;i++){ if(/^ja/i.test(vs[i].lang)){ jaVoice=vs[i]; return; } }
}
if("speechSynthesis" in window){
  findVoice();
  window.speechSynthesis.onvoiceschanged=findVoice;
}
function say(kana){
  if(!jaVoice) return;
  try{
    window.speechSynthesis.cancel();
    var u=new SpeechSynthesisUtterance(kana);
    u.voice=jaVoice; u.lang="ja-JP"; u.rate=0.75;
    window.speechSynthesis.speak(u);
  }catch(e){}
}

/* ===== 5. CHART =========================================== */

var SET_TITLES={
  basic:["清音","gojūon — the 46 base characters"],
  dakuten:["濁音・半濁音","゛makes a sound voiced, ゜turns h into p"],
  yoon:["拗音","a small ゃゅょ glides onto an i-column character"],
  ext:["外来音","katakana built for sounds borrowed from other languages"]
};
var SCRIPT_NAMES={hira:"Hiragana ひらがな",kata:"Katakana カタカナ"};

function cellNode(card,opts){
  if(!card){ var e=el("div","cell empty"); return e; }
  var b=el("button","cell");
  var s=stats[card.k];
  b.appendChild(el("span","k",card.k));
  if(!opts||!opts.hideRomaji) b.appendChild(el("span","r",card.r[0]));
  if(s && s.seen){
    var bar=el("span","bar");
    bar.style.width=Math.max(8,(s.box/5)*100)+"%";
    b.appendChild(bar);
    if(s.wrong>s.right) b.classList.add("trouble");
  }
  b.title=card.k+" = "+card.r.join(", ")+(s&&s.seen?"  ·  "+s.right+"/"+s.seen+" correct":"  ·  not practiced yet");
  b.setAttribute("aria-label",b.title);
  b.addEventListener("click",function(){ say(card.k); flashCell(b,card); });
  return b;
}
function flashCell(node,card){
  var r=node.querySelector(".r");
  if(!r) return;
  var orig=r.textContent;
  r.textContent=card.r.join(" / ");
  setTimeout(function(){ r.textContent=orig; },1200);
}
function renderChart(target,opts){
  target.innerHTML="";
  var any=false;
  ["hira","kata"].forEach(function(sc){
    if(!state.scripts[sc]) return;
    var head=el("div","set-title");
    var h=el("h3",null,SCRIPT_NAMES[sc]);
    h.style.fontSize="16px"; h.style.color="var(--green)";
    head.appendChild(h);
    var placed=false;
    var frag=document.createDocumentFragment();

    ["basic","dakuten","yoon","ext"].forEach(function(set){
      if(!state.sets[set]) return;
      var cards=GRID[sc][set];
      if(!cards||!cards.length) return;
      placed=true; any=true;
      var t=el("div","set-title");
      t.appendChild(el("h3",null,SET_TITLES[set][0]));
      t.appendChild(el("span",null,SET_TITLES[set][1]));
      frag.appendChild(t);

      if(set==="ext"){
        var g=el("div","flow-grid");
        cards.forEach(function(c){ var n=cellNode(c,opts); n.classList.add("flow"); g.appendChild(n); });
        frag.appendChild(g);
        return;
      }
      var per = set==="yoon" ? 3 : 5;
      var labels = set==="basic" ? BASIC_LABELS
                 : set==="dakuten" ? DAKU_LABELS
                 : YOON_SPEC.map(function(y){ return y[0]; });
      for(var r=0;r*per<cards.length;r++){
        var row=el("div","chart-row");
        row.appendChild(el("div","row-label", sc==="kata"?toKata(labels[r]):labels[r]));
        var cells=el("div","cells");
        for(var i=0;i<per;i++) cells.appendChild(cellNode(cards[r*per+i],opts));
        if(set==="yoon"){ cells.appendChild(el("div","cell empty")); cells.appendChild(el("div","cell empty")); }
        row.appendChild(cells);
        frag.appendChild(row);
      }
    });
    if(placed){ target.appendChild(head); target.appendChild(frag); }
  });
  if(!any) target.appendChild(el("div","empty-note","Nothing selected. Turn on a script and at least one character set above."));
}

/* ===== 6. READ IT (kana -> romaji, typed) ================= */

var typeCard=null, typeAwaiting=false;
function typeNext(){
  typeCard=nextCard();
  typeAwaiting=false;
  var g=$("typeGlyph");
  if(!typeCard){ g.textContent="—"; $("typeFeedback").textContent="Select some characters first."; return; }
  g.textContent=typeCard.k;
  $("typeInput").value="";
  $("typeFeedback").innerHTML="";
  $("typeSubmit").textContent="Check";
  if(state.view==="type") $("typeInput").focus();
}
function typeCheck(){
  if(!typeCard) return;
  if(typeAwaiting){ typeNext(); return; }
  var val=$("typeInput").value;
  if(!normalize(val)) return;
  var ok=isCorrect(typeCard,val);
  grade(typeCard,ok);
  typeAwaiting=true;
  var fb=$("typeFeedback");
  fb.innerHTML="";
  var span=el("span",ok?"ok":"no");
  if(ok){
    span.textContent="Correct — "+typeCard.r.join(" / ");
  }else{
    span.innerHTML='<span class="kana-inline">'+typeCard.k+'</span> is <b>'+typeCard.r[0]+'</b>'+
      (typeCard.r.length>1?' <span style="color:var(--ink-soft)">(also '+typeCard.r.slice(1).join(", ")+')</span>':'');
  }
  fb.appendChild(span);
  say(typeCard.k);
  $("typeSubmit").textContent="Next";
  updateTypeScore();
}
function updateTypeScore(){
  $("tScore").textContent=session.right;
  $("tAcc").textContent=accuracy();
  $("tStreak").textContent=session.streak;
  $("tBest").textContent=session.best;
}

/* ===== 7. PICK IT (multiple choice, both directions) ====== */

var pickCard=null, pickLocked=false, pickDir="k2r", pickCounter=0, pickOpts=[], pickTimer=null;
function buildDistractors(card){
  var pool=deck().filter(function(c){ return c.k!==card.k; });
  var out=[];
  (LOOKALIKE[card.k]||[]).forEach(function(ch){
    var c=BY_KANA[ch];
    if(c && out.indexOf(c)<0 && pool.indexOf(c)>=0) out.push(c);
  });
  out=out.concat(shuffle(pool.filter(function(c){ return c.set===card.set && c.script===card.script && out.indexOf(c)<0; })));
  out=out.concat(shuffle(pool.filter(function(c){ return out.indexOf(c)<0; })));
  var uniq=[], used={};
  used[card.r[0]]=true;
  for(var i=0;i<out.length && uniq.length<3;i++){
    if(used[out[i].r[0]]) continue;
    used[out[i].r[0]]=true;
    uniq.push(out[i]);
  }
  return uniq;
}
function pickNext(){
  clearTimeout(pickTimer);
  pickCard=nextCard();
  pickLocked=false;
  var box=$("pickChoices");
  box.innerHTML="";
  $("pickFeedback").innerHTML="";
  if(!pickCard){ $("pickGlyph").textContent="—"; $("pickFeedback").textContent="Select some characters first."; return; }
  if(deck().length<4){ $("pickGlyph").textContent="—"; $("pickFeedback").textContent="This mode needs at least 4 characters selected."; return; }

  if(pickCounter%5===0) pickDir = (pickDir==="k2r") ? "r2k" : "k2r";
  pickCounter++;
  $("pDir").textContent = pickDir==="k2r" ? "kana → romaji" : "romaji → kana";

  var glyph=$("pickGlyph");
  glyph.className = "glyph"+(pickDir==="r2k"?" roman":"");
  glyph.textContent = pickDir==="k2r" ? pickCard.k : pickCard.r[0];

  pickOpts=shuffle(buildDistractors(pickCard).concat([pickCard]));
  pickOpts.forEach(function(opt,i){
    var b=el("button","choice");
    b.appendChild(el("span","num",String(i+1)));
    b.appendChild(el("span","lab"+(pickDir==="k2r"?"":" kana"), pickDir==="k2r"?opt.r[0]:opt.k));
    b.addEventListener("click",function(){ pickAnswer(i); });
    box.appendChild(b);
  });
}
function pickAnswer(i){
  if(pickLocked||!pickOpts.length||!pickOpts[i]) return;
  pickLocked=true;
  var chosen=pickOpts[i];
  var ok=chosen.k===pickCard.k;
  grade(pickCard,ok);
  var nodes=$("pickChoices").children;
  for(var n=0;n<nodes.length;n++){
    nodes[n].disabled=true;
    if(pickOpts[n].k===pickCard.k) nodes[n].classList.add("right");
    else if(n===i) nodes[n].classList.add("wrong");
  }
  var fb=$("pickFeedback");
  fb.innerHTML="";
  var s=el("span",ok?"ok":"no");
  s.innerHTML = ok
    ? 'Correct — <span class="kana-inline">'+pickCard.k+'</span> '+pickCard.r[0]
    : '<span class="kana-inline">'+pickCard.k+'</span> is <b>'+pickCard.r[0]+'</b>, not '+chosen.r[0];
  fb.appendChild(s);
  say(pickCard.k);
  $("pScore").textContent=session.right;
  $("pAcc").textContent=accuracy();
  $("pStreak").textContent=session.streak;
  pickTimer=setTimeout(pickNext, ok?700:1600);
}

/* ===== 8. WRITE IT ======================================== */

var writeCard=null, guideOn=false, ctx=null, drawing=false;
var strokes=[], current=null, padSize=320;
function setupPad(){
  var c=$("pad");
  var dpr=window.devicePixelRatio||1;
  padSize=Math.min(320,Math.max(240,Math.min(window.innerWidth-70,320)));
  c.style.width=padSize+"px"; c.style.height=padSize+"px";
  c.width=padSize*dpr; c.height=padSize*dpr;
  ctx=c.getContext("2d");
  ctx.setTransform(dpr,0,0,dpr,0,0);
  drawPad();
}
function drawPad(){
  if(!ctx) return;
  ctx.clearRect(0,0,padSize,padSize);
  ctx.fillStyle="#fff"; ctx.fillRect(0,0,padSize,padSize);
  ctx.strokeStyle="#D5DED1"; ctx.lineWidth=1;
  ctx.setLineDash([5,5]);
  ctx.beginPath();
  ctx.moveTo(padSize/2,padSize*0.06); ctx.lineTo(padSize/2,padSize*0.94);
  ctx.moveTo(padSize*0.06,padSize/2); ctx.lineTo(padSize*0.94,padSize/2);
  ctx.stroke();
  ctx.setLineDash([]);
  if(guideOn && writeCard){
    ctx.save();
    ctx.globalAlpha=0.17;
    ctx.fillStyle="#1B1E1A";
    ctx.font=Math.round(padSize*0.7)+"px "+FONT_STACKS[state.font];
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(writeCard.k,padSize/2,padSize/2+padSize*0.02);
    ctx.restore();
  }
  strokes.forEach(replay);
}
function replay(st){
  if(st.length<2) return;
  ctx.strokeStyle="#1B1E1A"; ctx.lineWidth=7; ctx.lineCap="round"; ctx.lineJoin="round";
  ctx.beginPath();
  ctx.moveTo(st[0].x,st[0].y);
  for(var i=1;i<st.length;i++) ctx.lineTo(st[i].x,st[i].y);
  ctx.stroke();
}
function padPos(e){
  var r=$("pad").getBoundingClientRect();
  return {x:e.clientX-r.left, y:e.clientY-r.top};
}
function writeNext(){
  writeCard=nextCard();
  strokes=[]; guideOn=false;
  $("writeGuide").textContent="Show guide";
  if(!writeCard){
    $("writeTarget").textContent="—";
    $("writePrompt").textContent="Select some characters first.";
    drawPad(); return;
  }
  $("writeTarget").textContent=writeCard.r[0];
  $("writePrompt").textContent="Draw the "+(writeCard.script==="hira"?"hiragana":"katakana")+" for “"+writeCard.r[0]+"”, then reveal the guide to compare.";
  drawPad();
}
function writeGrade(ok){
  if(!writeCard) return;
  grade(writeCard,ok);
  writeNext();
}

/* ===== 9. PROGRESS ======================================== */

function renderProgress(){
  var seen=0, learned=0, right=0, wrong=0;
  Object.keys(stats).forEach(function(k){
    var s=stats[k];
    if(s.seen>0) seen++;
    if(s.box>=4) learned++;
    right+=s.right; wrong+=s.wrong;
  });
  var acc=(right+wrong)?Math.round(right/(right+wrong)*100)+"%":"—";
  var g=$("statsGrid");
  g.innerHTML="";
  [[learned,"characters learned","of "+CARDS.length],
   [seen,"characters seen",""],
   [acc,"lifetime accuracy",""],
   [right+wrong,"answers given",""],
   [session.best,"best streak",""]].forEach(function(row){
    var d=el("div","stat");
    d.appendChild(el("b",null,String(row[0])));
    d.appendChild(el("span",null,row[1]+(row[2]?" · "+row[2]:"")));
    g.appendChild(d);
  });

  var tl=$("troubleList");
  tl.innerHTML="";
  var trouble=Object.keys(stats).map(function(k){
    var s=stats[k];
    return {k:k,s:s,rate:s.seen?s.wrong/s.seen:0};
  }).filter(function(o){ return o.s.wrong>0 && o.rate>=0.25; })
    .sort(function(a,b){ return (b.rate-a.rate)||(b.s.wrong-a.s.wrong); })
    .slice(0,14);
  if(!trouble.length){
    tl.appendChild(el("div","empty-note","Nothing here yet. Characters appear once you have missed one a few times."));
  }else{
    var box=el("div","trouble-list");
    trouble.forEach(function(o){
      var card=BY_KANA[o.k];
      var it=el("div","trouble-item");
      it.appendChild(el("span","k",o.k));
      it.appendChild(el("span","m",(card?card.r[0]:"")+" · missed "+o.s.wrong+" of "+o.s.seen));
      box.appendChild(it);
    });
    tl.appendChild(box);
  }
  renderChart($("masteryChart"),{});
}

/* ===== 10. VIEWS + WIRING ================================= */

function setView(v){
  state.view=v;
  ["chart","type","pick","write","progress"].forEach(function(name){
    $("view-"+name).classList.toggle("hidden",name!==v);
  });
  var btns=$("tabs").querySelectorAll("button");
  for(var i=0;i<btns.length;i++) btns[i].setAttribute("aria-selected", btns[i].getAttribute("data-view")===v?"true":"false");
  if(v==="chart") renderChart($("view-chart"),{});
  if(v==="type"){ if(!typeCard||typeAwaiting) typeNext(); else $("typeInput").focus(); updateTypeScore(); }
  if(v==="pick"){ if(!pickCard||pickLocked) pickNext(); }
  if(v==="write"){ setupPad(); if(!writeCard) writeNext(); }
  if(v==="progress") renderProgress();
}
function refreshDeck(){
  $("deckCount").textContent=deck().length;
  lastKana=null;
  if(state.view==="chart") renderChart($("view-chart"),{});
  if(state.view==="type") typeNext();
  if(state.view==="pick"){ pickCard=null; pickNext(); }
  if(state.view==="write") writeNext();
  if(state.view==="progress") renderProgress();
  save();
}
function syncChips(){
  var a=document.querySelectorAll("#scriptChips .chip");
  for(var i=0;i<a.length;i++) a[i].setAttribute("aria-pressed", state.scripts[a[i].getAttribute("data-script")]?"true":"false");
  var b=document.querySelectorAll("#setChips .chip");
  for(var j=0;j<b.length;j++) b[j].setAttribute("aria-pressed", state.sets[b[j].getAttribute("data-set")]?"true":"false");
  var c=document.querySelectorAll("#fontChips .chip");
  for(var m=0;m<c.length;m++) c[m].setAttribute("aria-pressed", state.font===c[m].getAttribute("data-font")?"true":"false");
  var extBtn=document.querySelector('#setChips .chip[data-set="ext"]');
  extBtn.disabled=!state.scripts.kata;
  extBtn.title=state.scripts.kata?"":"Foreign-sound kana are katakana only";
}

$("tabs").addEventListener("click",function(e){
  var b=e.target.closest("button[data-view]");
  if(b) setView(b.getAttribute("data-view"));
});
$("scriptChips").addEventListener("click",function(e){
  var b=e.target.closest(".chip"); if(!b) return;
  var s=b.getAttribute("data-script");
  var other = s==="hira" ? "kata" : "hira";
  if(state.scripts[s] && !state.scripts[other]) return;
  state.scripts[s]=!state.scripts[s];
  if(!state.scripts.kata) state.sets.ext=false;
  if(!Object.keys(state.sets).some(function(k){return state.sets[k];})) state.sets.basic=true;
  syncChips(); refreshDeck();
});
$("setChips").addEventListener("click",function(e){
  var b=e.target.closest(".chip"); if(!b||b.disabled) return;
  var s=b.getAttribute("data-set");
  var on=Object.keys(state.sets).filter(function(k){ return state.sets[k]; });
  if(state.sets[s] && on.length===1) return;
  state.sets[s]=!state.sets[s];
  syncChips(); refreshDeck();
});
$("fontChips").addEventListener("click",function(e){
  var b=e.target.closest(".chip"); if(!b) return;
  state.font=b.getAttribute("data-font");
  syncChips(); applyFont(); save();
});

$("typeSubmit").addEventListener("click",typeCheck);
$("typeSkip").addEventListener("click",function(){
  if(!typeCard||typeAwaiting) return;
  grade(typeCard,false);
  typeAwaiting=true;
  $("typeFeedback").innerHTML='<span class="no"><span class="kana-inline">'+typeCard.k+'</span> is <b>'+typeCard.r[0]+'</b></span>';
  $("typeSubmit").textContent="Next";
  say(typeCard.k);
  updateTypeScore();
});
$("typeInput").addEventListener("keydown",function(e){
  if(e.key==="Enter"){ e.preventDefault(); typeCheck(); }
});
document.addEventListener("keydown",function(e){
  if(state.view==="pick" && !pickLocked && e.key>="1" && e.key<="4"){
    pickAnswer(Number(e.key)-1);
  }
});

$("writeGuide").addEventListener("click",function(){
  guideOn=!guideOn;
  this.textContent=guideOn?"Hide guide":"Show guide";
  drawPad();
});
$("writeClear").addEventListener("click",function(){ strokes=[]; drawPad(); });
$("writeGot").addEventListener("click",function(){ writeGrade(true); });
$("writeMiss").addEventListener("click",function(){ writeGrade(false); });
(function padEvents(){
  var c=$("pad");
  c.addEventListener("pointerdown",function(e){
    if(!ctx) return;
    try{ c.setPointerCapture(e.pointerId); }catch(err){}
    drawing=true; current=[padPos(e)]; strokes.push(current);
  });
  c.addEventListener("pointermove",function(e){
    if(!drawing||!current) return;
    current.push(padPos(e));
    drawPad();
  });
  ["pointerup","pointercancel","pointerleave"].forEach(function(ev){
    c.addEventListener(ev,function(){ drawing=false; current=null; });
  });
})();
window.addEventListener("resize",function(){ if(state.view==="write") setupPad(); });

$("resetBtn").addEventListener("click",function(){
  if(!window.confirm("Erase every character's history? This cannot be undone.")) return;
  stats={}; session={right:0,wrong:0,streak:0,best:0,turn:0};
  save(); refreshDeck(); renderProgress();
});

load().then(function(){
  syncChips();
  applyFont();
  $("deckCount").textContent=deck().length;
  setView("chart");
  if(document.fonts && document.fonts.ready){
    document.fonts.ready.then(function(){ if(state.view==="write") drawPad(); });
  }
});

})();
