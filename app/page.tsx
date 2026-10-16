"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Vec = { x: number; y: number };
type Mode = "menu" | "playing" | "won" | "caught";
type ActionName = "PATROL" | "INVESTIGATE NOISE" | "SEARCH LAST POSITION" | "FOLLOW SCENT" | "INTERCEPT" | "RECOVER";
type SoundEvent = { x: number; y: number; strength: number; time: number; kind: string };
type World = {
  player: Vec; hunter: Vec; velocity: Vec; walls: {x:number;y:number;w:number;h:number}[];
  sounds: SoundEvent[]; scent: {x:number;y:number;value:number}[]; lastSeen: Vec | null;
  lastSeenAt: number; suspicion: number; health: number; stamina: number; elapsed: number;
  noiseFatigue: number; crouchTime: number; moveTime: number; decoys: number; lastDecoy: number;
  action: ActionName; actionScore: number; director: string; directorCooldown: number;
  caughtFlash: number; won: boolean; message: string; footsteps: number; lastFootstep: number;
  profile: { stealth:number; aggression:number; distraction:number };
};

const W = 1000, H = 620;
const clamp = (v:number,a:number,b:number) => Math.max(a,Math.min(b,v));
const dist = (a:Vec,b:Vec) => Math.hypot(a.x-b.x,a.y-b.y);
const norm = (x:number,y:number) => { const l=Math.hypot(x,y)||1; return {x:x/l,y:y/l}; };
const initialWorld = ():World => ({
  player:{x:95,y:520}, hunter:{x:835,y:105}, velocity:{x:0,y:0},
  walls:[
    {x:160,y:90,w:32,h:280},{x:160,y:90,w:220,h:32},{x:300,y:230,w:230,h:32},
    {x:420,y:90,w:32,h:150},{x:600,y:90,w:250,h:32},{x:600,y:90,w:32,h:180},
    {x:720,y:250,w:32,h:220},{x:370,y:390,w:260,h:32},{x:480,y:470,w:32,h:105},
    {x:120,y:440,w:180,h:32},{x:835,y:345,w:32,h:175},{x:820,y:345,w:110,h:32}
  ],
  sounds:[], scent:[], lastSeen:null,lastSeenAt:0,suspicion:0,health:100,stamina:100,elapsed:0,
  noiseFatigue:0,crouchTime:0,moveTime:0,decoys:0,lastDecoy:-99,action:"PATROL",actionScore:.2,
  director:"LULL",directorCooldown:0,caughtFlash:0,won:false,message:"Stay quiet. Find the exit.",footsteps:0,lastFootstep:0,
  profile:{stealth:0,aggression:0,distraction:0}
});
function blocked(p:Vec,r:number,walls:World["walls"]) {
  return walls.some(a => p.x+r>a.x && p.x-r<a.x+a.w && p.y+r>a.y && p.y-r<a.y+a.h);
}
function moveAround(p:Vec,dx:number,dy:number,r:number,walls:World["walls"]) {
  const x={x:p.x+dx,y:p.y}; if(!blocked(x,r,walls)) p.x=x.x;
  const y={x:p.x,y:p.y+dy}; if(!blocked(y,r,walls)) p.y=y.y;
  p.x=clamp(p.x,r,W-r); p.y=clamp(p.y,r,H-r);
}
function lineClear(a:Vec,b:Vec,walls:World["walls"]) {
  const steps=Math.ceil(dist(a,b)/8);
  for(let i=1;i<steps;i++){const t=i/steps,p={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};if(blocked(p,1,walls))return false;}
  return true;
}
function visible(h:Vec,p:Vec,w:World) {
  const d=dist(h,p); if(d>265||!lineClear(h,p,w.walls))return 0;
  const facing=norm(w.velocity.x||-1,w.velocity.y||0);
  const to=norm(p.x-h.x,p.y-h.y); const dot=facing.x*to.x+facing.y*to.y;
  return dot>.18 ? clamp(1-d/320,.1,1) : 0;
}
function scoreActions(w:World, now:number) {
  const sound=[...w.sounds].reverse().find(s=>now-s.time<9);
  const d= sound ? dist(w.hunter,sound) : 999;
  const scent=w.scent.reduce((best,s)=>{const v=s.value/(1+dist(w.hunter,s));return v>best.v?{s,v}:best;},{s:null as null|World["scent"][number],v:0});
  const choices:{name:ActionName;score:number}[]=[
    {name:"PATROL",score:.22+(w.lastSeen?0:.15)},
    {name:"INVESTIGATE NOISE",score:sound?clamp(sound.strength*(1-d/500),0,1)*(1-w.noiseFatigue*.72):0},
    {name:"SEARCH LAST POSITION",score:w.lastSeen?clamp(.82-(now-w.lastSeenAt)/24,0,.82)*clamp(w.suspicion+.25,0,1):0},
    {name:"FOLLOW SCENT",score:scent.s?clamp(scent.v*3,0,.72):0},
    {name:"INTERCEPT",score:w.profile.aggression*.48+(w.suspicion>.75?.18:0)},
    {name:"RECOVER",score:w.health<30?.95:0}
  ];
  choices.sort((a,b)=>b.score-a.score); return {choice:choices[0],sound};
}
function addSound(w:World,p:Vec,strength:number,kind:string,now:number){w.sounds.push({x:p.x,y:p.y,strength,time:now,kind});if(w.sounds.length>20)w.sounds.shift();}
function gameTick(w:World, keys:Set<string>, dt:number, now:number) {
  const p=w.player, h=w.hunter;
  const crouch=keys.has("shift")||keys.has("control");
  const sprint=keys.has(" ")&&!crouch&&w.stamina>1;
  let dx=(keys.has("d")||keys.has("arrowright")?1:0)-(keys.has("a")||keys.has("arrowleft")?1:0);
  let dy=(keys.has("s")||keys.has("arrowdown")?1:0)-(keys.has("w")||keys.has("arrowup")?1:0);
  const moving=!!(dx||dy); if(moving){const n=norm(dx,dy);dx=n.x;dy=n.y;}
  const speed=crouch?72:sprint?190:126;
  if(moving){moveAround(p,dx*speed*dt,dy*speed*dt,10,w.walls);w.velocity={x:dx,y:dy};w.moveTime+=dt;}
  if(crouch)w.crouchTime+=dt;
  if(sprint&&moving)w.stamina=Math.max(0,w.stamina-27*dt);else w.stamina=Math.min(100,w.stamina+15*dt);
  if(moving && now-w.lastFootstep>(crouch?1.2:sprint?.28:.58)){
    addSound(w,p,crouch?.12:sprint?1:.48,crouch?"soft step":sprint?"sprint":"footstep",now);w.lastFootstep=now;
  }
  w.scent.push({x:p.x,y:p.y,value:crouch?.18:1});if(w.scent.length>500)w.scent.splice(0,50);
  w.scent.forEach(s=>s.value=Math.max(0,s.value-dt*.018));w.scent=w.scent.filter(s=>s.value>.04);
  w.sounds=w.sounds.filter(s=>now-s.time<14);
  const sight=visible(h,p,w);
  if(sight>0){w.lastSeen={...p};w.lastSeenAt=now;w.suspicion=clamp(w.suspicion+dt*(sight>.5?.9:.35),0,1);}
  else w.suspicion=Math.max(0,w.suspicion-dt*.025);
  w.noiseFatigue=Math.max(0,w.noiseFatigue-dt*.025);
  w.profile.stealth=clamp(w.crouchTime/Math.max(1,w.elapsed),0,1);
  w.profile.aggression=clamp(w.moveTime/Math.max(1,w.elapsed)*.7,0,1);
  w.profile.distraction=clamp(w.decoys/Math.max(1,w.elapsed/10),0,1);
  const {choice,sound}=scoreActions(w,now);w.action=choice.name;w.actionScore=choice.score;
  let target:Vec={x:500,y:310}, speedAI=62;
  if(choice.name==="INVESTIGATE NOISE"&&sound){target={x:sound.x,y:sound.y};speedAI=75;}
  else if(choice.name==="SEARCH LAST POSITION"&&w.lastSeen){target={x:w.lastSeen.x+Math.sin(now*1.8)*45,y:w.lastSeen.y+Math.cos(now*1.4)*35};speedAI=66;}
  else if(choice.name==="FOLLOW SCENT"&&w.scent.length){let best=w.scent[0],bv=-1;for(const s of w.scent){const v=s.value/(1+dist(h,s));if(v>bv){best=s;bv=v;}}target=best;}
  else if(choice.name==="INTERCEPT"){target={x:clamp(p.x+dx*80,30,W-30),y:clamp(p.y+dy*80,30,H-30)};speedAI=80;}
  else if(choice.name==="RECOVER"){target={x:860,y:65};speedAI=35;w.health=Math.min(100,w.health+dt*1.2);}
  else {target={x:500+Math.sin(now*.37)*180,y:310+Math.cos(now*.29)*150};}
  const hd=dist(h,target);
  if(hd>7){const n=norm(target.x-h.x,target.y-h.y);moveAround(h,n.x*speedAI*dt,n.y*speedAI*dt,13,w.walls);}
  const proximity=dist(h,p);
  if(proximity<28){w.caughtFlash+=dt;if(w.caughtFlash>.65)w.message="The hunter caught your scent."; }else w.caughtFlash=0;
  if(proximity<24)w.health=Math.max(0,w.health-dt*25);
  w.directorCooldown=Math.max(0,w.directorCooldown-dt);
  if(w.director==="LULL"&&w.suspicion>.28)w.director="BUILD-UP";
  if(w.director==="BUILD-UP"&&w.suspicion>.76&&w.directorCooldown<=0){w.director="CLIMAX";w.directorCooldown=8;}
  if(w.director==="CLIMAX"&&w.suspicion<.22){w.director="RECOVERY";w.directorCooldown=5;}
  if(w.director==="RECOVERY"&&w.directorCooldown<=0)w.director="LULL";
  w.elapsed+=dt;
  if(p.x>925&&p.y>520){w.won=true;w.message="Extraction successful. You outsmarted the hunter.";}
  if(w.health<=0)w.message="You were hunted down.";
}

export default function Home() {
  const canvasRef=useRef<HTMLCanvasElement>(null), worldRef=useRef<World>(initialWorld()), keysRef=useRef<Set<string>>(new Set());
  const [mode,setMode]=useState<Mode>("menu"),[stats,setStats]=useState({action:"PATROL",score:22,suspicion:0,health:100,stamina:100,director:"LULL",time:0,stealth:0,decoys:0,message:""});
  const [muted,setMuted]=useState(true),[help,setHelp]=useState(false);
  const soundRef=useRef<AudioContext|null>(null);
  const beep=useCallback((freq=180,duration=.08)=>{if(muted)return;try{const Ctx=window.AudioContext;if(!soundRef.current)soundRef.current=new Ctx();const c=soundRef.current,o=c.createOscillator(),g=c.createGain();o.type="sine";o.frequency.value=freq;g.gain.setValueAtTime(.035,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+duration);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+duration);}catch{}},[muted]);
  const start=useCallback(()=>{worldRef.current=initialWorld();keysRef.current.clear();setStats({action:"PATROL",score:22,suspicion:0,health:100,stamina:100,director:"LULL",time:0,stealth:0,decoys:0,message:""});setMode("playing");},[]);
  const throwDecoy=useCallback(()=>{if(mode!=="playing")return;const w=worldRef.current;const p=w.player;const dir=norm(w.velocity.x||1,w.velocity.y||0);const spot={x:clamp(p.x+dir.x*145,20,W-20),y:clamp(p.y+dir.y*145,20,H-20)};addSound(w,spot,1,"metal decoy",w.elapsed);w.decoys++;w.noiseFatigue=clamp(w.noiseFatigue+.27,0,.9);w.lastDecoy=w.elapsed;w.message="Decoy thrown — the hunter may learn your pattern.";beep(540,.14);},[mode,beep]);
  useEffect(()=>{
    const down=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(k))e.preventDefault();keysRef.current.add(k);if(k==="e")throwDecoy();if(k==="escape"&&mode==="playing")setMode("menu");};
    const up=(e:KeyboardEvent)=>keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown",down);window.addEventListener("keyup",up);return()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);};
  },[throwDecoy,mode]);
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;const ctx=canvas.getContext("2d");if(!ctx)return;let frame=0,last=0,raf=0,prevAction="";
    const draw=()=>{
      const w=worldRef.current;ctx.clearRect(0,0,W,H);
      ctx.fillStyle="#0a1014";ctx.fillRect(0,0,W,H);
      ctx.strokeStyle="rgba(97,141,144,.09)";ctx.lineWidth=1;for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
      // Rooms and corridor lights
      ctx.fillStyle="rgba(31,58,57,.22)";ctx.fillRect(35,35,130,350);ctx.fillRect(210,410,95,150);ctx.fillRect(755,70,205,160);ctx.fillRect(840,390,115,180);
      // scent traces
      for(const s of w.scent){ctx.globalAlpha=clamp(s.value*.14,0,.12);ctx.fillStyle="#69d9a7";ctx.beginPath();ctx.arc(s.x,s.y,2+s.value*3,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
      // walls
      for(const a of w.walls){ctx.fillStyle="#26363a";ctx.fillRect(a.x,a.y,a.w,a.h);ctx.strokeStyle="#476064";ctx.strokeRect(a.x+.5,a.y+.5,a.w-1,a.h-1);ctx.fillStyle="rgba(0,0,0,.28)";ctx.fillRect(a.x+4,a.y+a.h-2,a.w,4);}
      // exit
      ctx.fillStyle="rgba(69,224,164,.16)";ctx.fillRect(910,505,66,86);ctx.strokeStyle="#43d9a0";ctx.lineWidth=2;ctx.strokeRect(910,505,66,86);ctx.fillStyle="#7df2bd";ctx.font="bold 11px monospace";ctx.fillText("EXIT",928,525);
      // sound wave rings
      for(const s of w.sounds){const age=w.elapsed-s.time;const radius=clamp(age*42,0,120);ctx.strokeStyle=s.kind==="metal decoy"?"rgba(246,190,90,.45)":"rgba(105,184,221,.24)";ctx.beginPath();ctx.arc(s.x,s.y,radius,0,Math.PI*2);ctx.stroke();if(age<1.3){ctx.fillStyle=s.kind==="metal decoy"?"#f6be5a":"#69b8dd";ctx.beginPath();ctx.arc(s.x,s.y,3,0,Math.PI*2);ctx.fill();}}
      // hunter vision cone, only when playing to teach sensory system
      const h=w.hunter,p=w.player,hd=dist(h,p);ctx.save();ctx.translate(h.x,h.y);const ang=Math.atan2((w.velocity.y||0),(w.velocity.x||-1));ctx.rotate(ang);ctx.fillStyle="rgba(213,69,79,.075)";ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,265,-.72,.72);ctx.closePath();ctx.fill();ctx.restore();
      // hunter glow and body
      const glow=ctx.createRadialGradient(h.x,h.y,2,h.x,h.y,36);glow.addColorStop(0,"rgba(255,70,82,.6)");glow.addColorStop(1,"rgba(255,70,82,0)");ctx.fillStyle=glow;ctx.beginPath();ctx.arc(h.x,h.y,36,0,Math.PI*2);ctx.fill();ctx.fillStyle="#a93d49";ctx.beginPath();ctx.arc(h.x,h.y,13,0,Math.PI*2);ctx.fill();ctx.fillStyle="#ff9c9f";ctx.beginPath();ctx.arc(h.x-4,h.y-3,2.3,0,Math.PI*2);ctx.arc(h.x+4,h.y-3,2.3,0,Math.PI*2);ctx.fill();
      // player
      const crouch=keysRef.current.has("shift")||keysRef.current.has("control");ctx.fillStyle="rgba(70,229,176,.18)";ctx.beginPath();ctx.arc(p.x,p.y,crouch?19:15,0,Math.PI*2);ctx.fill();ctx.fillStyle="#57e7b3";ctx.beginPath();ctx.arc(p.x,p.y,crouch?7:9,0,Math.PI*2);ctx.fill();ctx.fillStyle="#d8fff1";ctx.beginPath();ctx.arc(p.x+2,p.y-2,2,0,Math.PI*2);ctx.fill();
      // vignette
      const v=ctx.createRadialGradient(W/2,H/2,120,W/2,H/2,620);v.addColorStop(0,"rgba(0,0,0,0)");v.addColorStop(1,"rgba(0,0,0,.65)");ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
      if(mode==="playing"){
        const dt=last?Math.min((performance.now()-last)/1000,.05):0;last=performance.now();gameTick(w,keysRef.current,dt,w.elapsed);
        if(w.action!==prevAction){prevAction=w.action;if(w.action==="INTERCEPT"||w.action==="SEARCH LAST POSITION")beep(95,.05);}
        if(frame%8===0)setStats({action:w.action,score:Math.round(w.actionScore*100),suspicion:Math.round(w.suspicion*100),health:Math.round(w.health),stamina:Math.round(w.stamina),director:w.director,time:Math.floor(w.elapsed),stealth:Math.round(w.profile.stealth*100),decoys:w.decoys,message:w.message});
        if(w.won)setMode("won");else if(w.health<=0)setMode("caught");
      } else {last=0;}
      frame++;raf=requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);return()=>cancelAnimationFrame(raf);
  },[mode,beep]);
  const mm=Math.floor(stats.time/60).toString().padStart(2,"0"),ss=(stats.time%60).toString().padStart(2,"0");
  return <main className="shell">
    <header className="topbar"><a className="brand" href="#"><span className="brand-mark">A</span><span>ADAPTIVE<span className="brand-light">/STEALTH</span><small>BEHAVIORAL HORROR SYSTEMS</small></span></a><div className="top-status"><span className="live-dot"/><span>SIMULATION BUILD 0.1.0</span><span className="top-divider"/> <span>AI CORE <b>ONLINE</b></span></div><button className="sound-toggle" onClick={()=>setMuted(!muted)}>{muted?"SOUND OFF":"SOUND ON"}</button></header>
    <section className="hero"><div><div className="eyebrow"><span/> EXPERIMENTAL STEALTH SIMULATION</div><h1>THE HUNTER<br/><em>LEARNS.</em></h1><p className="lede">It doesn’t know where you are. It only knows what you leave behind.</p></div><div className="hero-right"><span className="index-label">FIELD TEST / 001</span><div className="coordinates">SECTOR 07<br/>FACILITY: NULL<br/>THREAT LEVEL: ADAPTIVE</div><div className="hero-line"/></div></section>
    <section className="game-layout">
      <div className="game-column"><div className="panel-heading"><div><span className="section-kicker">01 / LIVE ENVIRONMENT</span><h2>Containment wing</h2></div><div className="map-legend"><span><i className="legend-player"/>YOU</span><span><i className="legend-hunter"/>HUNTER</span><span><i className="legend-scent"/>SCENT TRAIL</span></div></div>
      <div className="canvas-wrap"><canvas ref={canvasRef} width={W} height={H} aria-label="Top-down stealth game environment"/>{mode!=="playing"&&<div className="game-overlay"><div className="overlay-card"><div className="overlay-mark">{mode==="won"?"✓":mode==="caught"?"×":"◈"}</div><span className="section-kicker">{mode==="won"?"MISSION COMPLETE":mode==="caught"?"SIGNAL LOST":"OPERATION NIGHTFALL"}</span><h2>{mode==="won"?"Extraction secured":mode==="caught"?"You were found":"Stay out of sight."}</h2><p>{mode==="won"?"The hunter lost your trail. The facility is behind you.":mode==="caught"?"The hunter followed your trail. Change your tactics and try again.":"Move quietly. Break line of sight. Reach the green extraction zone."}</p><button className="primary-btn" onClick={start}>{mode==="menu"?"INITIALIZE FIELD TEST":"RUN IT BACK"} <span>↗</span></button>{mode==="menu"&&<button className="text-btn" onClick={()=>setHelp(!help)}>{help?"HIDE FIELD NOTES":"READ FIELD NOTES"}</button>}{help&&<div className="field-notes">WASD / ARROWS move · SHIFT crouches · SPACE sprints · E throws a decoy. Walls block sight and dampen sound. Repeating decoys makes the hunter less likely to investigate them.</div>}</div></div>}</div>
      <div className="game-footer"><span><i className="legend-player"/> PLAYER POSITION: LOCAL</span><span>CAMERA FEED <b>ENCRYPTED</b></span><span>NO CLOUD TRACKING</span></div>
      </div>
      <aside className="intel-column"><div className="intel-card"><div className="card-top"><span className="section-kicker">02 / HUNTER COGNITION</span><span className="pulse-badge"><i/> ACTIVE</span></div><div className="ai-name"><div className="ai-avatar">∴</div><div><h3>APEX-01</h3><p>Adaptive pursuit entity</p></div></div><div className="readout"><div className="readout-label"><span>CURRENT UTILITY</span><b>{stats.score}%</b></div><div className="meter"><i style={{width:stats.score+"%"}}/></div><div className="action-name">{mode==="playing"?stats.action:"AWAITING INPUT"}</div></div><div className="readout"><div className="readout-label"><span>SUSPICION INDEX</span><b>{stats.suspicion}%</b></div><div className="meter red"><i style={{width:stats.suspicion+"%"}}/></div></div><div className="readout"><div className="readout-label"><span>PLAYER VITALS</span><b>{stats.health}%</b></div><div className="meter green"><i style={{width:stats.health+"%"}}/></div></div><div className="readout"><div className="readout-label"><span>STAMINA RESERVE</span><b>{stats.stamina}%</b></div><div className="meter blue"><i style={{width:stats.stamina+"%"}}/></div></div><div className="divider"/><div className="director-row"><span>DIRECTOR STATE</span><b className={stats.director==="CLIMAX"?"danger":""}>{mode==="playing"?stats.director:"STANDBY"}</b></div><div className="director-copy">{stats.director==="CLIMAX"?"Threat escalation active. Break line of sight.":stats.director==="RECOVERY"?"Pressure dropping. Use this window to reposition.":stats.director==="BUILD-UP"?"The hunter is narrowing its search.": "Low pressure. The hunter is patrolling imperfectly."}</div><div className="stat-grid"><div><span>ELAPSED</span><b>{mm}:{ss}</b></div><div><span>DECOYS</span><b>{stats.decoys.toString().padStart(2,"0")}</b></div><div><span>STEALTH RATIO</span><b>{stats.stealth}%</b></div></div></div>
      <div className="intel-card compact"><div className="card-top"><span className="section-kicker">03 / ADAPTATION LOG</span><span className="log-live">● LIVE</span></div><div className="log-entry"><span className="log-time">SYS</span><p>Perception isolated from decision core.</p></div><div className="log-entry"><span className="log-time">AI</span><p>{stats.decoys>2?"Distraction pattern detected. Noise utility reduced.":stats.decoys>0?"Decoy event recorded. Habit profile updating.":"Awaiting behavioral signal."}</p></div><div className="log-entry"><span className="log-time">DIR</span><p>{stats.director==="CLIMAX"?"Climax state entered.":stats.director==="RECOVERY"?"Recovery window enabled.":"Pacing director monitoring tension."}</p></div></div>
      </aside>
    </section>
    <section className="systems"><div className="systems-head"><div><span className="section-kicker">04 / SYSTEMS UNDER THE HOOD</span><h2>Perception is not knowledge.</h2></div><p>Every decision is earned through sensors. No omniscient enemy. No scripted chase.</p></div><div className="system-grid"><article><span className="system-no">SYS_01</span><div className="system-icon">⌁</div><h3>Vision cone</h3><p>Field-of-view checks and wall occlusion. Brief peripheral sightings build suspicion; sustained sight updates last known position.</p><span className="system-status">● ACTIVE</span></article><article><span className="system-no">SYS_02</span><div className="system-icon">)))</div><h3>Acoustic field</h3><p>Footsteps and decoys create decaying sound events. Distance, obstructions, and repeated distractions shape response utility.</p><span className="system-status">● ACTIVE</span></article><article><span className="system-no">SYS_03</span><div className="system-icon">⠿</div><h3>Scent memory</h3><p>Movement leaves a fading spatial trail. The hunter can follow residual traces after line of sight is broken.</p><span className="system-status">● ACTIVE</span></article><article><span className="system-no">SYS_04</span><div className="system-icon">↗</div><h3>Utility director</h3><p>Candidate actions are scored every tick. Tension pacing shifts between lull, build-up, climax, and recovery.</p><span className="system-status">● ACTIVE</span></article></div></section>
    <footer className="footer"><span>ADAPTIVE/STEALTH <span className="footer-muted">— RESEARCH PROTOTYPE</span></span><span>LOCAL SIMULATION · NO PERSONAL DATA STORED</span><span>v0.1.0 / NIGHTFALL</span></footer>
  </main>;
}
