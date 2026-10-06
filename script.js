/* ===== FOR YOU — experience engine (v3) ===== */
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const rand = (a,b) => a + Math.random()*(b-a);

const FAST = new URLSearchParams(location.search).has('fast');
const SPEED = FAST ? .3 : 1;
const T = ms => ms * SPEED;
const USE_GSAP = !!window.gsap;

const state = { name:'', muted:false };

/* ================= SKY (stars + sparks + fireworks) ================= */
const Sky = (() => {
  const cv = $('#sky'), c = cv.getContext('2d');
  let W=0, H=0, pts=[], fx=[], rockets=[], mode=0, speed=1, dimT=1, dim=1, festive=false;
  const PALETTES = [
    [[236,238,255],[236,238,255],[167,139,250],[125,168,254]],
    [[240,242,255],[190,170,255],[167,139,250],[125,178,255],[96,165,250],[251,215,138]]
  ];
  function mk(){
    const P = PALETTES[mode];
    return { x:Math.random()*W, y:Math.random()*H,
      r:.6+Math.random()*(mode?1.8:1.1),
      vx:(Math.random()-.5)*.12, vy:-(.04+Math.random()*.14),
      p:Math.random()*Math.PI*2, s:.4+Math.random()*.9,
      col:P[Math.floor(Math.random()*P.length)], base:.22+Math.random()*.4 };
  }
  function resize(){
    const dpr = Math.min(devicePixelRatio||1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W*dpr; cv.height = H*dpr;
    cv.style.width = W+'px'; cv.style.height = H+'px';
    c.setTransform(dpr,0,0,dpr,0,0);
    const n = Math.round(Math.min(100, Math.max(40, W*H/17000)));
    pts = Array.from({length:n}, mk);
  }
  addEventListener('resize', resize); resize();
  function burst(x, y, count, power, spread){
    for(let i=0;i<count;i++){
      const a = rand(0, Math.PI*2), v = rand(.2, power);
      fx.push({ x, y, vx:Math.cos(a)*v*spread, vy:Math.sin(a)*v*spread,
        life:1, decay:rand(.006,.014), r:rand(1,2.8),
        col:[[236,238,255],[190,170,255],[125,178,255],[251,215,138]][Math.floor(rand(0,4))] });
    }
  }
  function explode(x, y, big){
    const hues = [[255,214,120],[190,170,255],[125,178,255],[255,158,190],[236,238,255]];
    const n = big ? 70 : 42;
    for(let i=0;i<n;i++){
      const a = rand(0, Math.PI*2), v = rand(.4, big?3.6:2.6);
      fx.push({ x, y, vx:Math.cos(a)*v, vy:Math.sin(a)*v,
        life:1, decay:rand(.008,.02), r:rand(1.2,3),
        col:hues[Math.floor(rand(0,hues.length))] });
    }
  }
  function firework(big){
    rockets.push({ x: rand(W*.15, W*.85), y: H+10,
      vy: -(rand(4.4,6.4)), tx:0, ty: rand(H*.14, H*.42), big: !!big });
  }
  function fireworks(count, dur){
    festive = true;
    let fired = 0;
    const t0 = performance.now();
    (function shot(){
      if(!festive) return;
      const now = performance.now();
      if(now - t0 > dur) return;
      firework(Math.random() < .35);
      if(++fired < count) setTimeout(shot, rand(250, 650));
    })();
  }
  function bigBloom(){ burst(W/2, H*.46, 90, 4.2, 1.4); }
  function setMode(m){
    mode = m;
    pts.forEach(p => { const n = mk(); p.col = n.col; p.r = Math.max(p.r, n.r*.8); p.base = Math.max(p.base, .28); });
  }
  function loop(){
    c.clearRect(0,0,W,H);
    dim += (dimT - dim)*.006;
    const aMul = dim * (mode?1:.82);
    for(const p of pts){
      p.x += p.vx*speed; p.y += p.vy*speed; p.p += .016*p.s;
      if(p.y < -4) p.y = H+4;
      if(p.x < -4) p.x = W+4; else if(p.x > W+4) p.x = -4;
      const tw = .5 + .5*Math.sin(p.p);
      c.beginPath(); c.arc(p.x,p.y,p.r,0,6.2832);
      c.fillStyle = `rgba(${p.col[0]},${p.col[1]},${p.col[2]},${(p.base*tw*aMul).toFixed(3)})`;
      c.fill();
    }
    for(let i=rockets.length-1;i>=0;i--){
      const rk = rockets[i];
      rk.y += rk.vy;
      rk.vy += .028;
      c.beginPath(); c.arc(rk.x, rk.y, 1.6, 0, 6.2832);
      c.fillStyle = 'rgba(255,238,210,.95)'; c.fill();
      if(rk.vy > -1.4 || rk.y <= rk.ty){
        explode(rk.x, rk.y, rk.big);
        rockets.splice(i,1);
      }
    }
    for(let i=fx.length-1;i>=0;i--){
      const q = fx[i];
      q.x += q.vx*speed; q.y += q.vy*speed;
      q.vx *= .985; q.vy = q.vy*.985 + .008;
      q.life -= q.decay;
      if(q.life <= 0){ fx.splice(i,1); continue; }
      c.beginPath(); c.arc(q.x,q.y,q.r*q.life,0,6.2832);
      c.fillStyle = `rgba(${q.col[0]},${q.col[1]},${q.col[2]},${q.life.toFixed(3)})`;
      c.fill();
    }
    requestAnimationFrame(loop);
  }
  loop();
  return { burst, bigBloom, setMode, firework, fireworks,
    setSpeed:v=>{speed=v;}, fadeTo(v){ dimT = v; } };
})();


/* ================= STICKERS (TikTok/Insta style) ================= */
const Stickers = (() => {
  const layer = $('#stickers');
  const POOLS = {
    suspense: ['🐼','🤫','✨','🌙','💜','⭐'],
    party:    ['🎂','🎉','🎈','✨','🎁','💜','🎊','⭐'],
    cake:     ['✨','💜','🎂','🌟','🎈'],
    dua:      ['🤲','🌙','✨','💫']
  };
  function spawn(emoji){
    if(layer.children.length > 11) return;
    const s = document.createElement('span');
    s.className = 'sticker';
    s.textContent = emoji;
    s.style.setProperty('--sx', rand(8, 90) + '%');
    s.style.setProperty('--rot', rand(-16, 16) + 'deg');
    s.style.setProperty('--dur', rand(7, 11) + 's');
    s.style.setProperty('--sc', rand(.8, 1.3).toFixed(2));
    layer.appendChild(s);
    setTimeout(() => s.remove(), 12000);
  }
  function rain(kind, n, gapMs){
    const pool = POOLS[kind] || POOLS.party;
    for(let i=0;i<n;i++){
      setTimeout(() => spawn(pool[Math.floor(rand(0, pool.length))]), i * (gapMs || 350) + rand(0, 200));
    }
  }
  return { rain };
})();

/* ================= SOUND (sfx) ================= */
const Sound = (() => {
  let ctx = null, sfx = null, started = false;
  function unlock(){
    if(started) return; started = true;
    try{
      ctx = new (window.AudioContext||window.webkitAudioContext)();
      sfx = ctx.createGain(); sfx.gain.value = .5;
      sfx.connect(ctx.destination);
    }catch(e){}
  }
  function chime(f=880, vol=.16){
    if(!ctx || state.muted) return;
    if(ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;
    [f, f*1.5].forEach((fr,i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type='sine'; o.frequency.value = fr;
      g.gain.setValueAtTime(0, t+i*.03);
      g.gain.linearRampToValueAtTime(vol*(i?.4:1), t+.02+i*.03);
      g.gain.exponentialRampToValueAtTime(.0001, t+1.5+i*.1);
      o.connect(g); g.connect(sfx);
      o.start(t); o.stop(t+1.7);
    });
  }
  function thump(){
    if(!ctx || state.muted) return;
    if(ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type='sine';
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(48, t+.28);
    g.gain.setValueAtTime(.5, t);
    g.gain.exponentialRampToValueAtTime(.0001, t+.42);
    o.connect(g); g.connect(sfx);
    o.start(t); o.stop(t+.45);
  }
  function whoosh(){
    if(!ctx || state.muted) return;
    if(ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime, len = .5;
    const buf = ctx.createBuffer(1, ctx.sampleRate*len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i] = (Math.random()*2-1) * (1 - i/d.length);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type='bandpass'; bp.Q.value = 1.1;
    bp.frequency.setValueAtTime(280, t);
    bp.frequency.exponentialRampToValueAtTime(2200, t+.32);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(.09, t+.07);
    g.gain.exponentialRampToValueAtTime(.0001, t+.48);
    src.connect(bp); bp.connect(g); g.connect(sfx);
    src.start(t);
  }
  function pop(){
    if(!ctx || state.muted) return;
    if(ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type='sine';
    o.frequency.setValueAtTime(190, t);
    o.frequency.exponentialRampToValueAtTime(720, t+.14);
    g.gain.setValueAtTime(.22, t);
    g.gain.exponentialRampToValueAtTime(.0001, t+.3);
    o.connect(g); g.connect(sfx);
    o.start(t); o.stop(t+.32);
    chime(1046.5, .08);
  }
  return { unlock, chime, whoosh, pop, thump };
})();

/* ================= MUSIC — Taaj (Instrumental), Lost Stories ================= */
const Music = (() => {
  const TAAJ_ID = 'h7r67MpcGAQ', START = 38, VOL = 60;
  let player = null, ready = false, started = false, wantSound = true;
  window.onYouTubeIframeAPIReady = () => {
    try{
      player = new YT.Player('ytPlayer', {
        videoId: TAAJ_ID,
        playerVars: { autoplay:1, controls:0, playsinline:1, rel:0, modestbranding:1,
                      iv_load_policy:3, start:START, loop:1, playlist:TAAJ_ID },
        events: {
          onReady(){
            ready = true;
            try{
              player.setVolume(VOL); player.mute();
              player.seekTo(START, true); player.playVideo();
            }catch(e){}
            if(started) syncMute();
          },
          onError(){},
          onStateChange(e){
            if(e && e.data === 0){ try{ player.seekTo(START, true); player.playVideo(); }catch(err){} }
          }
        }
      });
    }catch(e){}
  };
  function syncMute(){
    if(!ready) return;
    try{
      if(!wantSound || state.muted){ player.mute(); }
      else {
        player.unMute(); player.setVolume(VOL);
        if(player.getCurrentTime && player.getCurrentTime() < START - 1) player.seekTo(START, true);
        player.playVideo();
      }
    }catch(e){}
  }
  return { unlock(){ started = true; syncMute(); },
           setMuted(v){ state.muted = v; syncMute(); } };
})();

const musicBtn = $('#musicBtn');
musicBtn.addEventListener('click', e => {
  e.stopPropagation();
  const nowMuted = !state.muted;
  Music.setMuted(nowMuted);
  musicBtn.classList.toggle('muted', nowMuted);
  musicBtn.setAttribute('aria-pressed', String(!nowMuted));
});

addEventListener('pointerdown', () => { Sound.unlock(); Music.unlock(); }, { once:true, capture:true });

/* ================= NAME ================= */
function applyName(){ $$('.nm').forEach(el => el.textContent = state.name); }
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

/* ================= SCENE MANAGER ================= */
const ON_ENTER = {};
let current = 'sc-name';
function show(id){ $('#'+id).classList.add('active'); }

function goTo(id, kind='fade'){
  if(id === current) return;
  const from = $('#'+current), to = $('#'+id);
  current = id;
  Sound.whoosh();
  if(!USE_GSAP){
    from.classList.remove('active');
    show(id);
    if(ON_ENTER[id]) ON_ENTER[id]();
    return;
  }
  if(kind === 'bloom'){
    gsap.timeline()
      .to('#veil', {opacity:.92, duration:.4, ease:'power2.in'})
      .add(() => { from.classList.remove('active'); show(id); Sky.bigBloom(); if(ON_ENTER[id]) ON_ENTER[id](); })
      .to('#veil', {opacity:0, duration:.75, ease:'power1.out'})
      .fromTo(to, {scale:1.05, filter:'blur(10px)'}, {scale:1, filter:'blur(0px)', duration:.9, ease:'power2.out'}, '<-.25');
  } else {
    gsap.timeline()
      .to(from, {opacity:0, scale:1.06, filter:'blur(10px)', duration:.55, ease:'power2.in'})
      .add(() => { from.classList.remove('active'); gsap.set(from, {clearProps:'all'}); show(id); if(ON_ENTER[id]) ON_ENTER[id](); })
      .fromTo(to, {opacity:0, scale:.97, filter:'blur(8px)'}, {opacity:1, scale:1, filter:'blur(0px)', duration:.8, ease:'power2.out'}, '+=.05');
  }
}

/* ===== SCENE 1 · name ===== */
(() => {
  const pre = $('#namePre'), wrap = $('#nameWrap'), field = $('#nameField'),
        btn = $('#enterBtn'), err = $('#nameErr'), welcome = $('#welcomeLine');
  pre.classList.add('show');
  setTimeout(() => {
    pre.classList.remove('show');
    setTimeout(() => { pre.hidden = true; wrap.hidden = false; }, T(800));
  }, T(2400));

  function enter(){
    const raw = field.value.replace(/[<>&"]/g,'').trim().replace(/\s+/g,' ');
    if(!raw){
      wrap.classList.remove('shake'); void wrap.offsetWidth; wrap.classList.add('shake');
      err.textContent = 'Naam likhna zaroori hai ✨';
      err.classList.add('show');
      return;
    }
    state.name = cap(raw).slice(0,20);
    applyName();
    Sound.chime(660, .12);
    wrap.style.transition = 'opacity .5s ease';
    wrap.style.opacity = '0';
    setTimeout(() => {
      wrap.hidden = true;
      welcome.textContent = `Khush aamdeed, ${state.name} ✨`;
      welcome.classList.add('show');
    }, T(550));
    setTimeout(() => goTo('sc-envelope', 'bloom'), T(2300));
  }
  btn.addEventListener('click', enter);
  field.addEventListener('keydown', e => { if(e.key === 'Enter') enter(); });
})();

/* ===== SCENE 2 · envelope ===== */
(() => {
  const env = $('#env'), hint = $('#envHint');
  let opened = false;
  ON_ENTER['sc-envelope'] = () => setTimeout(() => { if(!opened) hint.classList.add('show'); }, T(3600));
  function open(){
    if(opened) return; opened = true;
    hint.classList.remove('show');
    env.classList.add('open');
    Sound.pop();
    const r = env.getBoundingClientRect();
    Sky.burst(r.left + r.width/2, r.top + r.height*.4, 70, 3, 1.1);
    setTimeout(() => goTo('sc-stars', 'bloom'), T(1500));
  }
  env.addEventListener('pointerdown', e => { e.stopPropagation(); open(); });
  env.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); open(); } });
})();

/* ===== SCENE 3 · stars ===== */
(() => {
  const stars = [...$$('.sstar')], l1 = $('#starsL1'), l2 = $('#starsL2'),
        count = $('#starCount'), done = $('#starsDone');
  let found = 0, finished = false;
  ON_ENTER['sc-stars'] = () => {
    l1.classList.add('show');
    setTimeout(() => { l1.classList.remove('show'); }, T(2200));
    setTimeout(() => { l1.hidden = true; l2.hidden = false; l2.classList.add('show'); count.classList.add('show'); }, T(3000));
  };
  stars.forEach(s => {
    s.addEventListener('pointerdown', e => {
      e.stopPropagation();
      if(s.classList.contains('lit')) return;
      s.classList.add('lit');
      Sound.chime(700 + found*160, .15);
      const r = s.getBoundingClientRect();
      Sky.burst(r.left + r.width/2, r.top + r.height/2, 40, 3.4, 1);
      found++;
      if(found < 3){
        count.textContent = (3-found) + ' more';
      } else if(!finished){
        finished = true;
        count.classList.remove('show');
        l2.classList.remove('show');
        done.hidden = false; done.classList.add('show');
        setTimeout(() => goTo('sc-suspense', 'bloom'), T(1900));
      }
    });
  });
})();

/* ===== SCENE 4 · suspense + countdown ===== */
(() => {
  const l1 = $('#susL1'), l2 = $('#susL2'), wrap = $('#countWrap'),
        num = $('#countNum'), pre = $('#countPre'), pulse = $('.pulse');
  let started = false;
  ON_ENTER['sc-suspense'] = () => {
    if(started) return; started = true;
    l1.textContent = `${state.name}...`;
    Stickers.rain('suspense', 7, 420);
    const panda = $('#pandaPeek');
    setTimeout(() => { panda.classList.add('show','wave'); Sound.pop(); }, T(900));
    setTimeout(() => { panda.classList.remove('show','wave'); }, T(5400));
    setTimeout(() => l1.classList.add('show'), T(500));
    setTimeout(() => {
      l1.classList.remove('show');
      setTimeout(() => {
        l1.hidden = true;
        l2.hidden = false; l2.classList.add('show');
        setTimeout(() => {
          l2.classList.remove('show');
          setTimeout(() => {
            l2.hidden = true;
            wrap.hidden = false;
            setTimeout(() => pre.classList.add('show'), T(300));
            setTimeout(() => {
              pre.classList.remove('show');
              let n = 3;
              (function tick(){
                if(n <= 0){
                  wrap.hidden = true;
                  Sky.setMode(1);
                  Sky.bigBloom();
                  Sky.fireworks(9, 6500);
                  Sound.thump();
                  setTimeout(() => Sound.chime(783.99, .18), 120);
                  setTimeout(() => Sound.chime(1046.5, .14), 300);
                  goTo('sc-reveal', 'bloom');
                  return;
                }
                num.textContent = n;
                num.classList.remove('beat'); void num.offsetWidth; num.classList.add('beat');
                pulse.classList.remove('go'); void pulse.offsetWidth; pulse.classList.add('go');
                Sound.thump();
                n--;
                setTimeout(tick, T(1000));
              })();
            }, T(1900));
          }, T(900));
        }, T(2600));
      }, T(900));
    }, T(2700));
  };
})();

/* ===== SCENE 5 · reveal ===== */
(() => {
  const l1 = $('#revL1'), hb = $('#revHB'), sub = $('#revSub'), cue = $('#revCue'), sc = $('#sc-reveal');
  let started = false, ready = false;
  ON_ENTER['sc-reveal'] = () => {
    if(started) return; started = true;
    document.body.classList.add('glow-up', 'festive');
    Stickers.rain('party', 14, 260);
    setTimeout(() => {
      l1.classList.add('show');
      setTimeout(() => {
        hb.hidden = false;
        if(USE_GSAP){
          gsap.fromTo(hb, {scale:.82, filter:'blur(14px)', opacity:0},
            {scale:1, filter:'blur(0px)', opacity:1, duration:1.3, ease:'power3.out'});
        } else hb.style.opacity = 1;
        Sound.chime(523.25, .2);
        setTimeout(() => Sound.chime(783.99, .14), T(350));
        setTimeout(() => Sound.chime(1046.5, .1), T(700));
        setTimeout(() => { sub.hidden = false; sub.classList.add('show'); }, T(1500));
        setTimeout(() => { cue.hidden = false; cue.classList.add('show'); ready = true; }, T(3200));
      }, T(1200));
    }, T(700));
  };
  sc.addEventListener('pointerdown', () => { if(ready) goTo('sc-cake', 'fade'); });
})();

/* ===== SCENE 6 · cake ===== */
(() => {
  const candles = [...$$('.candle')], cake = $('#sc-cake'),
        done = $('#cakeDone'), cue = $('#cakeCue');
  let out = 0, finished = false, ready = false;
  ON_ENTER['sc-cake'] = () => Stickers.rain('cake', 6, 700);
  candles.forEach(cnd => {
    cnd.addEventListener('pointerdown', e => {
      e.stopPropagation();
      if(cnd.classList.contains('out')) return;
      cnd.classList.add('out');
      out++;
      Sound.whoosh();
      if(out === candles.length && !finished){
        finished = true;
        cake.classList.add('done');
        const r = cake.getBoundingClientRect ? $('.cake').getBoundingClientRect() : null;
        if(r) Sky.burst(r.left + r.width/2, r.top + r.height*.35, 90, 4, 1.2);
        Sound.chime(880, .14);
        setTimeout(() => Sound.chime(1318.5, .1), T(300));
        setTimeout(() => {
          done.hidden = false; done.classList.add('show');
          setTimeout(() => { cue.hidden = false; cue.classList.add('show'); ready = true; }, T(1500));
        }, T(900));
      }
    });
  });
  cake.addEventListener('pointerdown', () => { if(ready) goTo('sc-letter', 'fade'); });
})();

/* ===== SCENE 7 · letter (typewriter) ===== */
(() => {
  const line = $('#letterLine'), dots = $('#letterDots'), cue = $('#letterCue'), sc = $('#sc-letter');
  const LINES = [
    `Dear ${'@'},`,
    'aaj ka din koi normal date nahi —',
    "it's the day the world quietly got softer.",
    'Aapki hansi, aapki kindness, aapki duaayein —',
    'sab kuch bohat khaas hai.',
    'Happy Birthday ✦ You are loved more than you know.'
  ];
  const GOLD = [0];
  let i = 0, typing = false, typed = false, idx = 0, charI = 0, started = false, ready = false;
  LINES.forEach(() => dots.insertAdjacentHTML('beforeend', '<i class="l-dot"></i>'));
  const dotEls = [...dots.children];
  const CURSOR = '<span class="cursor"></span>';

  function render(text, full){
    line.innerHTML = (GOLD.includes(idx) ? `<span class="gold">${text}</span>` : text) + (full ? '' : CURSOR);
  }
  function typeStep(){
    const raw = LINES[idx].replace('@', state.name);
    if(charI <= raw.length){
      render(raw.slice(0, charI), false);
      charI++;
      if(charI % 3 === 1) Sound.chime(1400 + Math.random()*300, .025);
      setTimeout(typeStep, T(rand(34, 60)));
    } else {
      render(raw, true);
      typing = false; typed = true;
      dotEls.forEach((d,k) => d.classList.toggle('show', k <= idx));
      if(idx === LINES.length - 1){
        Sound.chime(1046.5, .12);
        setTimeout(() => { cue.hidden = false; cue.classList.add('show'); ready = true; }, T(1400));
      }
    }
  }
  function startLine(n){
    idx = n; charI = 0; typed = false; typing = true;
    line.textContent = '';
    typeStep();
  }
  ON_ENTER['sc-letter'] = () => { if(!started){ started = true; setTimeout(() => startLine(0), T(700)); } };
  sc.addEventListener('pointerdown', () => {
    if(!started) return;
    if(typing){ // skip: complete instantly
      const raw = LINES[idx].replace('@', state.name);
      charI = raw.length + 1; render(raw, true);
      typing = false; typed = true;
      dotEls.forEach((d,k) => d.classList.toggle('show', k <= idx));
      if(idx === LINES.length - 1){
        setTimeout(() => { cue.hidden = false; cue.classList.add('show'); ready = true; }, T(400));
      }
      return;
    }
    if(!typed) return;
    if(ready){ goTo('sc-wishes', 'fade'); return; }
    if(idx < LINES.length - 1) startLine(idx + 1);
  });
})();

/* ===== SCENE 8 · constellation wishes ===== */
(() => {
  const WISHES = [
    { x:18, y:28, w:'Khushiyaan — itni ke dil bhar jaye ✨' },
    { x:50, y:13, w:'Sehat — Allah aafiyat naseeb kare 💪' },
    { x:82, y:25, w:'Sukoon — gehri aur pyaari neend 🕊️' },
    { x:28, y:55, w:'Kamyabi — har sapna poora ho 🌟' },
    { x:74, y:50, w:'Mohabbat — jo kabhi kam na ho 💜' },
    { x:52, y:79, w:'Duaayein — hamesha saath rahen 🤲' }
  ];
  const holder = $('#cwStars'), count = $('#cwCount'), wish = $('#cwWish'),
        poly = $('#cwLine'), final = $('#cwFinal');
  const points = [];
  WISHES.forEach((W, i) => {
    const b = document.createElement('button');
    b.className = 'cw-star';
    b.style.setProperty('--x', W.x + '%');
    b.style.setProperty('--y', W.y + '%');
    b.style.setProperty('--d', (i*.4)+'s');
    b.setAttribute('aria-label', 'A glowing point');
    holder.appendChild(b);
    points.push({ el:b, x:W.x, y:W.y, lit:false });
  });
  let litCount = 0, unlocked = false;
  holder.addEventListener('pointerdown', e => { e.stopPropagation(); });
  points.forEach((p, pi) => {
    p.el.addEventListener('pointerdown', e => {
      e.stopPropagation();
      if(p.lit) return;
      p.lit = true; litCount++;
      p.el.classList.add('lit');
      Sound.chime(640 + litCount*90, .14);
      const r = p.el.getBoundingClientRect();
      Sky.burst(r.left + r.width/2, r.top + r.height/2, 30, 3, 1);
      const ptsAttr = poly.getAttribute('points');
      poly.setAttribute('points', (ptsAttr ? ptsAttr + ' ' : '') + `${p.x},${p.y}`);
      count.textContent = `${litCount} of 6`;
      wish.classList.remove('show');
      setTimeout(() => {
        wish.textContent = WISHES[pi].w;
        wish.classList.add('show');
      }, T(200));
      if(litCount === 6){
        setTimeout(() => {
          wish.textContent = 'Yeh saari wishes sirf aap ke liye thin.';
          wish.classList.add('show');
          final.hidden = false;
          final.style.setProperty('--x', '50%');
          final.style.setProperty('--y', '46%');
          const fr = final.getBoundingClientRect();
          Sky.burst(fr.left + fr.width/2, fr.top + fr.height/2, 50, 3.6, 1);
          Sound.chime(1046.5, .16);
          unlocked = true;
        }, T(1500));
      }
    });
  });
  final.addEventListener('pointerdown', e => {
    e.stopPropagation();
    if(!unlocked) return;
    Sky.bigBloom();
    goTo('sc-dua', 'bloom');
  });
})();

/* ===== SCENE 9 · dua ===== */
(() => {
  const h = $('#duaH'), lines = [...$$('#duaLines p')], cue = $('#duaCue'), sc = $('#sc-dua');
  let started = false, ready = false;
  ON_ENTER['sc-dua'] = () => {
    if(started) return; started = true;
    document.body.classList.add('moonlit');
    $('.dua-moon').classList.add('show');
    Stickers.rain('dua', 7, 1100);
    setTimeout(() => {
      h.hidden = false;
      setTimeout(() => h.classList.add('show'), 40);
      Sound.chime(523.25, .1);
    }, T(800));
    lines.forEach((l, i) => {
      setTimeout(() => {
        l.classList.remove('hidden');
        setTimeout(() => l.classList.add('show'), 40);
        if(i % 2 === 0) Sound.chime(523.25 + i*30, .06);
      }, T(2000 + i*1000));
    });
    setTimeout(() => { cue.hidden = false; cue.classList.add('show'); ready = true; }, T(2000 + lines.length*1000 + 400));
  };
  sc.addEventListener('pointerdown', () => { if(!ready) return; goTo('sc-seed', 'fade'); });
})();

/* ===== SCENE 10 · seed ===== */
(() => {
  const seed = $('#seed'), line = $('#seedLine'), hint = $('#seedHint');
  let done = false;
  ON_ENTER['sc-seed'] = () => {
    line.classList.add('show');
    setTimeout(() => { if(!done) hint.classList.add('show'); }, T(3800));
  };
  seed.addEventListener('pointerdown', e => {
    e.stopPropagation();
    if(done) return; done = true;
    hint.classList.remove('show');
    seed.classList.add('burst');
    Sound.pop();
    const r = seed.getBoundingClientRect();
    Sky.burst(r.left + r.width/2, r.top + r.height/2, 100, 4.6, 1.4);
    document.body.classList.add('glow-up');
    setTimeout(() => goTo('sc-final', 'bloom'), T(900));
  });
})();

/* ===== FINAL ===== */
(() => {
  const n = $('#fName');
  let started = false;
  ON_ENTER['sc-final'] = () => {
    if(started) return; started = true;
    n.textContent = state.name;
    document.body.classList.add('festive');
    Stickers.rain('party', 16, 300);
    const seq = [
      ['#fName', 600],
      ['#fHB', 2200],
      ['#fMsg', 4200],
      ['#fMade', 6200]
    ];
    seq.forEach(([sel, at]) => {
      setTimeout(() => {
        const el = $(sel);
        el.hidden = false;
        el.classList.add('show-f');
        if(sel === '#fHB'){
          Sound.chime(659.25, .16);
          Sky.bigBloom();
          Sky.fireworks(12, 8000);
        }
      }, T(at));
    });
    setTimeout(() => Sky.fadeTo(.5), T(9500));
  };
})();
