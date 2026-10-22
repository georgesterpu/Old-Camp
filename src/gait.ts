/** Distance-driven foot contacts and a small analytic leg solver; no physics bodies or per-frame raycasts. */
export const WALK_SPEED=1.8,SPRINT_SPEED=7.2;
export const LEG={hipHeight:.87,upper:.43,lower:.34,ankle:.10,hipWidth:.095,stanceWidth:.105};
const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const smooth=(v:number)=>{const t=clamp(v);return t*t*(3-2*t)};
const wrap=(v:number)=>(v%1+1)%1;
export interface FootPose {x:number;y:number;z:number;pitch:number;roll:number;yaw:number;contact:boolean;phase:number;worldX:number;worldY:number;worldZ:number}
export interface GaitPose {feet:[FootPose,FootPose];pelvisX:number;pelvisY:number;pelvisRoll:number;pelvisYaw:number;lean:number;twist:number;arms:[number,number];elbows:[number,number];weight:number;run:number;air:number;phase:number;landings:number}
export interface GaitInput {x:number;y:number;z:number;heading:number;scaleX:number;scaleY:number;scaleZ:number;grounded:boolean;evading?:boolean;ground:(x:number,z:number)=>number}
interface FootTrack {x:number;z:number;fromX:number;fromZ:number;toX:number;toZ:number;contact:boolean;lastPhase:number;heading:number;groundY:number;pitch:number;roll:number;pivot?:{x:number;z:number;yaw:number;elapsed:number}}
const foot=():FootPose=>({x:0,y:LEG.ankle,z:0,pitch:0,roll:0,yaw:0,contact:true,phase:0,worldX:0,worldY:0,worldZ:0});
/** Knee flexion is positive: the knee travels forward while the lower leg folds back. */
export function solveLeg(x:number,y:number,z:number){
 const roll=Math.atan2(x,-y),raw=Math.hypot(x,y,z),distance=clamp(raw,Math.abs(LEG.upper-LEG.lower)+.001,LEG.upper+LEG.lower-.001);
 const knee=Math.PI-Math.acos(clamp((LEG.upper**2+LEG.lower**2-distance**2)/(2*LEG.upper*LEG.lower),-1,1));
 const hip=Math.atan2(-z,Math.hypot(x,y))-Math.acos(clamp((LEG.upper**2+distance**2-LEG.lower**2)/(2*LEG.upper*distance),-1,1));
 return {hip,knee,roll,reach:distance,clamped:raw>LEG.upper+LEG.lower-.001};
}
export class GaitController {
 readonly pose:GaitPose={feet:[foot(),foot()],pelvisX:0,pelvisY:0,pelvisRoll:0,pelvisYaw:0,lean:0,twist:0,arms:[0,0],elbows:[.12,.12],weight:0,run:0,air:0,phase:.3,landings:0};
 private previous:{x:number;z:number;heading:number}|null=null;private tracks:FootTrack[]=[];private direction={x:0,z:1};private speed=0;
 reset(){this.previous=null;this.tracks=[];this.speed=0;Object.assign(this.pose,{pelvisX:0,pelvisY:0,pelvisRoll:0,pelvisYaw:0,lean:0,twist:0,weight:0,run:0,air:0,phase:.3,landings:0})}
 update(dt:number,input:GaitInput):GaitPose {
  const s=this.pose,delta=clamp(dt,0,.5),sx=input.scaleX,sy=input.scaleY,sz=input.scaleZ,sin=Math.sin(input.heading),cos=Math.cos(input.heading);
  const dx=this.previous?input.x-this.previous.x:0,dz=this.previous?input.z-this.previous.z:0,distance=Math.hypot(dx,dz);
  if(!this.previous||distance>2||!this.tracks.length){
   s.phase=.3;s.weight=0;s.air=0;this.tracks=[-1,1].map((side,i)=>{const x=input.x+cos*side*LEG.stanceWidth*sx,z=input.z-sin*side*LEG.stanceWidth*sx;return {x,z,fromX:x,fromZ:z,toX:x,toZ:z,contact:i===0,lastPhase:wrap(s.phase+i*.5),heading:input.heading,groundY:input.ground(x,z),pitch:0,roll:0}});
   this.previous={x:input.x,z:input.z,heading:input.heading};
  }
  const travelled=distance>2?0:distance,actualSpeed=delta>0?travelled/delta:0,rotation=Math.atan2(Math.sin(input.heading-this.previous.heading),Math.cos(input.heading-this.previous.heading));
  const turning=delta>0&&Math.abs(rotation)/delta>.15,translating=actualSpeed>.06,moving=translating||turning;
  this.previous={x:input.x,z:input.z,heading:input.heading};this.speed=mix(this.speed,actualSpeed,1-Math.exp(-12*delta));
  const targetRun=smooth((actualSpeed-2.3)/4.1);s.run=mix(s.run,targetRun,1-Math.exp(-8*delta));
  s.weight=mix(s.weight,moving?1:0,1-Math.exp(-(moving?18:14)*delta));if(s.weight<.001)s.weight=0;
  s.air=mix(s.air,!input.grounded||input.evading?1:0,1-Math.exp(-20*delta));
  if(translating){this.direction.x=dx/Math.max(.0001,distance);this.direction.z=dz/Math.max(.0001,distance)}
  const cycle=mix(1.28,3.20,s.run)*(sy/1.1),duty=mix(.54,.20,s.run),oldPhase=s.phase;
  if(input.grounded&&!input.evading)s.phase+=travelled/cycle+(translating?0:Math.abs(rotation)/(Math.PI*1.1));
  s.landings=input.grounded&&!input.evading?Math.max(0,Math.floor(s.phase*2)-Math.floor(oldPhase*2)):0;
  const weight=s.weight*(1-s.air),wave=Math.sin(s.phase*Math.PI*2),strideReach=cycle*duty*.5;
  s.pelvisX=wave*.012*weight;s.pelvisRoll=-wave*.012*weight;s.pelvisYaw=wave*.022*weight;
  // Keep a quiet upper body instead of dropping and rising with each foot contact.
  s.pelvisY=(-mix(.052,.055,s.run)+.003*Math.cos(s.phase*Math.PI*4))*weight;
  s.lean=mix(.018,.085,s.run)*weight;s.twist=-wave*mix(.025,.045,s.run)*weight;
  const arm=wave*mix(.25,.52,s.run)*s.weight*(1-s.air*.65);s.arms[0]=arm;s.arms[1]=-arm;
  s.elbows[0]=mix(.15,1.05,s.run)*s.weight+.12;s.elbows[1]=s.elbows[0];
  for(let i=0;i<2;i++){
   const t=this.tracks[i],p=wrap(s.phase+i*.5),side=i===0?-1:1,stance=p<duty;
   const nx=input.x+cos*side*LEG.stanceWidth*sx,nz=input.z-sin*side*LEG.stanceWidth*sx;
   const advance=translating?cycle*(1-p)+strideReach:0,landingX=nx+this.direction.x*advance,landingZ=nz+this.direction.z*advance;
   if(!t.pivot&&stance&&(!t.contact||p<t.lastPhase)){
    t.x=t.toX;t.z=t.toZ;t.heading=input.heading;t.groundY=input.ground(t.x,t.z);
    const fs=Math.sin(t.heading),fc=Math.cos(t.heading),span=.16;
    t.pitch=-Math.atan2(input.ground(t.x+fs*span,t.z+fc*span)-input.ground(t.x-fs*span,t.z-fc*span),span*2);
    t.roll=Math.atan2(input.ground(t.x+fc*span,t.z-fs*span)-input.ground(t.x-fc*span,t.z+fs*span),span*2);
   }
   if(!t.pivot&&!stance){
    if(t.contact){t.fromX=t.x;t.fromZ=t.z;t.toX=landingX;t.toZ=landingZ}
    t.toX=mix(t.toX,landingX,1-Math.exp(-18*delta));t.toZ=mix(t.toZ,landingZ,1-Math.exp(-18*delta));
    // The body is moving too: easing the entire world-space swing overshoots
    // the leg's reach. Ease only the foot's motion relative to the moving body.
    const u=(p-duty)/(1-duty),ease=mix(u,smooth(u),duty);t.x=mix(t.fromX,t.toX,ease);t.z=mix(t.fromZ,t.toZ,ease);
   }
   if(s.weight<.01||!input.grounded||input.evading){t.x=nx;t.z=nz;t.fromX=nx;t.fromZ=nz;t.toX=nx;t.toZ=nz;t.groundY=input.ground(nx,nz);t.heading=input.heading;t.pivot=undefined}
   let localX=((t.x-input.x)*cos-(t.z-input.z)*sin)/sx,localZ=((t.x-input.x)*sin+(t.z-input.z)*cos)/sz;
   const footYaw=Math.atan2(Math.sin(t.heading-input.heading),Math.cos(t.heading-input.heading));
   // A planted foot must release before the body twists it or crosses over it.
   // Short, lifted recovery steps also handle armed turns in place.
   const strained=side*localX<.045||side*localX>.22||Math.abs(localZ)>.38||Math.abs(footYaw)>(side*rotation>0?.38:.62);
   if(!t.pivot&&strained&&s.weight>.3&&input.grounded&&!input.evading){t.pivot={x:side*clamp(side*localX,.055,.22),z:clamp(localZ,-.36,.36),yaw:clamp(footYaw,-.7,.7),elapsed:0}}
   let pivotLift=0,pivotYaw:number|undefined;const pivoting=!!t.pivot;
   if(t.pivot){
    const pivot=t.pivot;pivot.elapsed+=delta;const u=clamp(pivot.elapsed/mix(.16,.12,s.run)),ease=smooth(u);
    localX=mix(pivot.x,side*LEG.stanceWidth,ease);localZ=mix(pivot.z,0,ease);pivotLift=Math.sin(Math.PI*u)*.055;pivotYaw=pivot.yaw*(1-ease);
    t.x=input.x+localX*sx*cos+localZ*sz*sin;t.z=input.z-localX*sx*sin+localZ*sz*cos;t.groundY=input.ground(t.x,t.z);
    if(u===1){t.fromX=t.toX=t.x;t.fromZ=t.toZ=t.z;t.heading=input.heading;t.pivot=undefined}
   }
   const swing=stance||pivoting?0:Math.sin(Math.PI*(p-duty)/(1-duty)),lift=swing*mix(.045,.20,s.run)+pivotLift;
   const rocker=pivoting?0:stance?(p/duty<.18?-.12*(1-p/duty/.18):.24*smooth((p/duty-.73)/.27)):-.13*swing;
   const rockLift=stance?Math.sin(Math.abs(rocker))*(rocker>0?.15:.07)*sy:0;
   const groundY=stance?t.groundY:input.ground(t.x,t.z),f=s.feet[i];
   f.x=mix(side*LEG.stanceWidth,localX,weight);f.z=mix(0,localZ,weight);
   f.y=mix(LEG.ankle,(groundY-input.y+LEG.ankle*sy+lift+rockLift)/sy,weight);
   f.y=mix(f.y,.22+(i===0?.025:0),s.air);f.z=mix(f.z,i===0?.10:-.12,s.air);
   f.pitch=clamp(t.pitch,-.35,.35)*weight+rocker*weight;f.roll=clamp(t.roll,-.28,.28)*weight;
   f.yaw=(pivotYaw??clamp(footYaw,-.7,.7))*weight;
   f.contact=stance&&!pivoting&&input.grounded&&!input.evading&&s.air<.1&&s.weight>.95;f.phase=p;
   f.worldX=input.x+(f.x*sx*cos+f.z*sz*sin);f.worldY=input.y+f.y*sy;f.worldZ=input.z+(-f.x*sx*sin+f.z*sz*cos);
   if(stance&&!pivoting&&weight>.01){const horizontal=(f.x-side*LEG.hipWidth-s.pelvisX)**2+f.z**2;const maximum=f.y+Math.sqrt(Math.max(.08,(LEG.upper+LEG.lower-.006)**2-horizontal));s.pelvisY=Math.min(s.pelvisY,maximum-LEG.hipHeight)}
   t.contact=stance||pivoting;t.lastPhase=p;
  }
  const terrainDrop=Math.max(0,...this.tracks.filter(t=>t.contact).map(t=>(input.y-t.groundY)/sy));
  s.pelvisY=clamp(s.pelvisY,-mix(.078,.085,s.run)-Math.min(.12,terrainDrop),.035);return s;
 }
 diagnostics(){return {speed:this.speed,...this.pose,feet:this.pose.feet.map(f=>({...f})),arms:[...this.pose.arms],elbows:[...this.pose.elbows]}}
}
