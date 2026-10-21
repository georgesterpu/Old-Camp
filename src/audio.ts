import {AmbientScore} from './music';
export class CampAudio {
 private context?:AudioContext;private master?:GainNode;private world?:GainNode;private score?:AmbientScore;private musicEnabled=true;private analyser?:AnalyserNode;private fireGain?:GainNode;private firePan?:StereoPannerNode;private noise?:AudioBuffer;
 private nextBird=0;private muted=false;private paused=false;private steps=0;private lastError='';
 constructor(private changed:()=>void,preferences?:{muted:boolean;music:boolean}){if(preferences){this.muted=preferences.muted;this.musicEnabled=preferences.music}}
 get state(){return this.context?.state||'not-started'}
 get isMuted(){return this.muted}
 async unlock(){
  try{
   if(!this.context){
    const ctx=this.context=new AudioContext();this.master=ctx.createGain();this.master.gain.value=this.muted?0:.72;
    this.analyser=ctx.createAnalyser();this.analyser.fftSize=2048;this.master.connect(this.analyser);this.analyser.connect(ctx.destination);this.world=ctx.createGain();this.world.connect(this.master);this.score=new AmbientScore(ctx,this.master);this.score.setEnabled(this.musicEnabled);
    const noise=this.noise=ctx.createBuffer(1,ctx.sampleRate*4,ctx.sampleRate),data=noise.getChannelData(0);let previous=0;
    for(let i=0;i<data.length;i++){previous=(previous+(Math.random()*2-1)*.18)*.97;data[i]=previous}
    const wind=ctx.createBufferSource();wind.buffer=noise;wind.loop=true;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=650;const gain=ctx.createGain();gain.gain.value=.12;wind.connect(filter);filter.connect(gain);gain.connect(this.world!);wind.start();
    const gust=ctx.createOscillator();gust.frequency.value=.09;const depth=ctx.createGain();depth.gain.value=.075;gust.connect(depth);depth.connect(gain.gain);gust.start();
    const crackle=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),samples=crackle.getChannelData(0);let pop=0;
    for(let i=0;i<samples.length;i++){if(Math.random()<.0008)pop=.5+Math.random()*.5;pop*=.986;samples[i]=(Math.random()*2-1)*(.12+pop)}
    const fire=ctx.createBufferSource();fire.buffer=crackle;fire.loop=true;const fireFilter=ctx.createBiquadFilter();fireFilter.type='highpass';fireFilter.frequency.value=500;this.fireGain=ctx.createGain();this.fireGain.gain.value=0;this.firePan=ctx.createStereoPanner();fire.connect(fireFilter);fireFilter.connect(this.fireGain);this.fireGain.connect(this.firePan);this.firePan.connect(this.world!);fire.start();
    ctx.addEventListener('statechange',this.changed);
   }
   if(this.context.state==='suspended')await this.context.resume();
   this.lastError='';this.applyVolume();this.changed();
  }catch(error){this.lastError=String(error);this.changed()}
 }
 async toggle(){if(!this.context||this.context.state!=='running'){this.muted=false;await this.unlock()}else{this.muted=!this.muted;this.applyVolume();this.changed()}}
 pause(paused:boolean){this.paused=paused;if(this.world&&this.context)this.world.gain.setTargetAtTime(paused?.25:1,this.context.currentTime,.1)}
 get musicOn(){return this.musicEnabled}
 async toggleMusic(){if(this.state!=='running'){await this.unlock();this.musicEnabled=true}else this.musicEnabled=!this.musicEnabled;this.score?.setEnabled(this.musicEnabled);this.changed()}
 async loadMusic(file:File){await this.unlock();if(!this.score)throw new Error('Audio is unavailable');await this.score.load(file);this.musicEnabled=true;this.changed()}
 private applyVolume(){if(this.master&&this.context)this.master.gain.setTargetAtTime(this.muted?0:.72,this.context.currentTime,.035)}
 update(x:number,z:number,yaw:number,fires:{base:{x:number;z:number}}[]){
  if(!this.context||!this.fireGain||!this.firePan)return;
  let closest=Infinity,pan=0;for(const fire of fires){const dx=fire.base.x-x,dz=fire.base.z-z,d=Math.hypot(dx,dz);if(d<closest){closest=d;pan=Math.sin(Math.atan2(dx,dz)-yaw)}}
  if(Math.hypot(x,z)>68&&this.context.currentTime>this.nextBird){this.nextBird=this.context.currentTime+10+Math.random()*12;this.bird()}this.score?.setCampfire(closest<8);this.fireGain.gain.setTargetAtTime(.43*Math.max(0,1-closest/15)**2,this.context.currentTime,.2);this.firePan.pan.setTargetAtTime(pan*.8,this.context.currentTime,.15);
 }
 step(running:boolean){
  const ctx=this.context;if(!ctx||!this.master||!this.noise||ctx.state!=='running'||this.muted||this.paused)return;
  const now=ctx.currentTime;this.steps++;
  const source=ctx.createBufferSource();source.buffer=this.noise;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=running?1600:1150;const gain=ctx.createGain();gain.gain.setValueAtTime(running?.72:.48,now);gain.gain.exponentialRampToValueAtTime(.001,now+.16);source.connect(filter);filter.connect(gain);gain.connect(this.world!);source.start(now,Math.random()*3,.17);
  const thud=ctx.createOscillator();thud.frequency.setValueAtTime(running?105:85,now);thud.frequency.exponentialRampToValueAtTime(42,now+.09);const envelope=ctx.createGain();envelope.gain.setValueAtTime(running?.13:.09,now);envelope.gain.exponentialRampToValueAtTime(.001,now+.11);thud.connect(envelope);envelope.connect(this.world!);thud.start(now);thud.stop(now+.13);
 }
 bird(){
  const ctx=this.context;if(!ctx||!this.world||this.paused||this.muted||ctx.state!=='running')return;const now=ctx.currentTime;
  for(let i=0;i<3;i++){const o=ctx.createOscillator(),g=ctx.createGain(),p=ctx.createStereoPanner();o.type='sine';const start=now+i*.15;o.frequency.setValueAtTime(1700+i*130,start);o.frequency.exponentialRampToValueAtTime(2600-i*100,start+.05);o.frequency.exponentialRampToValueAtTime(1500,start+.11);g.gain.setValueAtTime(.001,start);g.gain.exponentialRampToValueAtTime(.024,start+.025);g.gain.exponentialRampToValueAtTime(.001,start+.13);p.pan.value=Math.sin(now*.3)*.7;o.connect(g);g.connect(p);p.connect(this.world);o.start(start);o.stop(start+.15)}
 }
 sword(kind:'swing'|'hit'|'block'){
  const ctx=this.context;if(!ctx||!this.world||ctx.state!=='running'||this.muted)return;const now=ctx.currentTime;
  if(this.noise){const source=ctx.createBufferSource();source.buffer=this.noise;const filter=ctx.createBiquadFilter();filter.type='bandpass';filter.frequency.value=kind==='swing'?1600:kind==='block'?3100:500;filter.Q.value=kind==='block'?4:.8;const gain=ctx.createGain();gain.gain.setValueAtTime(kind==='swing'?.2:.35,now);gain.gain.exponentialRampToValueAtTime(.001,now+.22);source.connect(filter);filter.connect(gain);gain.connect(this.world);source.start(now,1,.24)}
  if(kind!=='swing')for(const frequency of kind==='block'?[710,1145,1780]:[92,141]){const tone=ctx.createOscillator(),gain=ctx.createGain();tone.frequency.value=frequency;gain.gain.setValueAtTime(.055,now);gain.gain.exponentialRampToValueAtTime(.001,now+.32);tone.connect(gain);gain.connect(this.world);tone.start(now);tone.stop(now+.34)}
 }
 diagnostics(){let rms=0;if(this.analyser){const samples=new Float32Array(this.analyser.fftSize);this.analyser.getFloatTimeDomainData(samples);rms=Math.sqrt(samples.reduce((sum,n)=>sum+n*n,0)/samples.length)}return {state:this.state,muted:this.muted,paused:this.paused,rms,steps:this.steps,error:this.lastError,music:this.score?.diagnostics()||{enabled:this.musicEnabled,source:"original-score",title:"Original camp theme",scheduledNotes:0,rms:0}}}
}
