const beat=60/62;
const chords=[[50,57,62,65],[48,55,60,64],[43,50,55,59],[50,57,62,65],[46,53,58,62],[41,48,57,60],[48,55,60,64],[50,57,62,65]];
// An original melody. These notes do not quote the Gothic soundtrack.
const melody:[number,number,number][][]=[[[2,69,1.5]],[[.5,72,1],[2.5,74,1.2]],[[0,71,2],[3,67,.7]],[[0,69,1.5],[2.5,65,1]],[],[[1,65,1],[2.5,64,1]],[[0,62,2.5]],[],[[1,74,1],[2.5,76,1]],[[.5,72,2]],[[0,71,1.5],[2.5,69,1]],[[0,65,2.5]],[],[[1,69,1],[2.5,67,1]],[[0,64,2]],[[1,62,2.4]]];
export class AmbientScore {
 private output:GainNode;private dry:GainNode;private wet:GainNode;private analyser:AnalyserNode;private timer?:ReturnType<typeof setInterval>;private next=0;private bar=0;private enabled=true;private campfire=false;
 private cache=new Map<number,AudioBuffer>();private sources=new Set<AudioScheduledSourceNode>();private imported?:AudioBufferSourceNode;private title='Original camp theme';private scheduled=0;private wave:PeriodicWave;
 constructor(private ctx:AudioContext,master:AudioNode){
  this.output=ctx.createGain();this.output.gain.value=.62;this.analyser=ctx.createAnalyser();this.analyser.fftSize=1024;this.output.connect(this.analyser);this.analyser.connect(master);
  this.dry=ctx.createGain();this.dry.gain.value=.72;this.dry.connect(this.output);this.wet=ctx.createGain();this.wet.gain.value=.24;this.wet.connect(this.output);
  const room=ctx.createConvolver(),length=Math.floor(ctx.sampleRate*2.8),impulse=ctx.createBuffer(2,length,ctx.sampleRate);
  for(let channel=0;channel<2;channel++){const data=impulse.getChannelData(channel);let low=0;for(let i=0;i<length;i++){low=.7*low+(Math.random()*2-1)*.3;data[i]=low*Math.exp(-i/(ctx.sampleRate*.65))}}
  room.buffer=impulse;room.connect(this.wet);this.reverb=room;
  const real=new Float32Array(18),imag=new Float32Array(18);for(let i=1;i<18;i++)imag[i]=Math.exp(-i*.12)/Math.pow(i,1.8);this.wave=ctx.createPeriodicWave(real,imag);
  this.next=ctx.currentTime+.18;this.schedule();this.timer=setInterval(()=>this.schedule(),100);
 }
 private reverb:ConvolverNode;
 private watch<T extends AudioScheduledSourceNode>(node:T){this.sources.add(node);node.addEventListener('ended',()=>this.sources.delete(node),{once:true});return node}
 private route(node:AudioNode){node.connect(this.dry);node.connect(this.reverb)}
 private pluckBuffer(midi:number){
  const cached=this.cache.get(midi);if(cached)return cached;
  const frequency=440*2**((midi-69)/12),period=Math.max(2,Math.round(this.ctx.sampleRate/frequency)),ring=new Float32Array(period),buffer=this.ctx.createBuffer(1,this.ctx.sampleRate*2.7,this.ctx.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<period;i++)ring[i]=(Math.random()*2-1)*Math.sin(Math.PI*i/period)*.8;
  let cursor=0;for(let i=0;i<data.length;i++){const value=ring[cursor];ring[cursor]=.4985*(value+ring[(cursor+1)%period]);data[i]=value*Math.min(1,i/70);cursor=(cursor+1)%period}
  this.cache.set(midi,buffer);return buffer;
 }
 private pluck(midi:number,at:number,velocity:number){const source=this.watch(this.ctx.createBufferSource());source.buffer=this.pluckBuffer(midi);const gain=this.ctx.createGain();gain.gain.value=velocity;source.connect(gain);this.route(gain);source.start(at);this.scheduled++}
 private flute(midi:number,at:number,duration:number){
  const frequency=440*2**((midi-69)/12);const envelope=this.ctx.createGain();envelope.gain.setValueAtTime(.0001,at);envelope.gain.exponentialRampToValueAtTime(.07,at+.2);envelope.gain.setTargetAtTime(.035,at+.5,.45);envelope.gain.setTargetAtTime(.0001,at+duration,.16);this.route(envelope);
  const vibrato=this.watch(this.ctx.createOscillator()),depth=this.ctx.createGain();vibrato.frequency.value=4.7;depth.gain.value=1.5;vibrato.connect(depth);
  for(const [harmonic,volume] of [[1,1],[2,.11],[3,.025]]){const osc=this.watch(this.ctx.createOscillator()),gain=this.ctx.createGain();osc.type='sine';osc.frequency.value=frequency*harmonic;gain.gain.value=volume;depth.connect(osc.frequency);osc.connect(gain);gain.connect(envelope);osc.start(at);osc.stop(at+duration+.9)}
  vibrato.start(at);vibrato.stop(at+duration+.9);this.scheduled++;
 }
 private strings(chord:number[],at:number){
  for(const [i,midi] of [chord[0]-12,chord[1]-12,chord[3]-12].entries()){const osc=this.watch(this.ctx.createOscillator());osc.setPeriodicWave(this.wave);osc.frequency.value=440*2**((midi-69)/12);osc.detune.value=i*3-3;const gain=this.ctx.createGain();gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(.024,at+1);gain.gain.setTargetAtTime(.0001,at+beat*3,.6);osc.connect(gain);this.route(gain);osc.start(at);osc.stop(at+beat*4+1.8)}
 }
 private schedule(){
  if(this.imported)return;
  // The audio clock and a look-ahead scheduler keep music steady when rendering slows down.
  if(this.next<this.ctx.currentTime-.2)this.next=this.ctx.currentTime+.1;
  while(this.next<this.ctx.currentTime+12){const index=this.bar%16,chord=chords[this.bar%8],at=this.next;this.strings(chord,at);
   for(const [offset,note] of [[0,chord[0]],[.75,chord[2]],[1.5,chord[1]],[2.25,chord[3]],[3,chord[2]]])this.pluck(note,at+offset*beat,(this.campfire?.48:.36)*(offset===0?1.1:1));
   if(this.campfire&&index%4===0)for(let i=1;i<chord.length;i++)this.pluck(chord[i],at+i*.035,.16);
   for(const [offset,note,duration] of melody[index])this.flute(note,at+offset*beat,duration*beat);
   this.bar++;this.next+=beat*4;
  }
 }
 setCampfire(value:boolean){this.campfire=value}
 setEnabled(value:boolean){this.enabled=value;this.output.gain.setTargetAtTime(value?.62:0,this.ctx.currentTime,.12)}
 async load(file:File){
  const decoded=await this.ctx.decodeAudioData(await file.arrayBuffer());
  if(this.timer)clearInterval(this.timer);for(const source of this.sources)try{source.stop()}catch{}this.sources.clear();this.imported?.stop();
  const source=this.ctx.createBufferSource();source.buffer=decoded;source.loop=true;source.connect(this.output);this.imported=source;this.title=file.name;source.start();this.setEnabled(true);
 }
 diagnostics(){const data=new Float32Array(this.analyser.fftSize);this.analyser.getFloatTimeDomainData(data);return {enabled:this.enabled,title:this.title,source:this.imported?'local-file':'original-score',scheduledNotes:this.scheduled,rms:Math.sqrt(data.reduce((sum,n)=>sum+n*n,0)/data.length)}}
}
