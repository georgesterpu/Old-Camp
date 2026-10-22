export interface MovementInput {forward:number;side:number;sprint:boolean}
import {WALK_SPEED,SPRINT_SPEED} from './gait';
export class Locomotion {
 vx=0;vz=0;running=false;speed=0;distance=0;
 reset(){this.vx=0;this.vz=0;this.running=false;this.speed=0;this.distance=0}
 step(dt:number,input:MovementInput,yaw:number){
  const length=Math.hypot(input.forward,input.side),moving=length>0;
  this.running=moving&&input.sprint;
  const desiredSpeed=this.running?SPRINT_SPEED:WALK_SPEED;
  const forward=moving?input.forward/length:0,side=moving?input.side/length:0;
  const tx=(Math.sin(yaw)*forward+Math.cos(yaw)*side)*desiredSpeed;
  const tz=(Math.cos(yaw)*forward-Math.sin(yaw)*side)*desiredSpeed;
  // Button presses change locomotion speed on this simulation step; animation supplies the blend.
  if(moving){this.vx=tx;this.vz=tz}else{const blend=1-Math.exp(-25*dt);this.vx+=(tx-this.vx)*blend;this.vz+=(tz-this.vz)*blend;if(Math.hypot(this.vx,this.vz)<.015){this.vx=0;this.vz=0}}
  this.speed=Math.hypot(this.vx,this.vz);
  return {dx:this.vx*dt,dz:this.vz*dt,running:this.running,speed:this.speed};
 }
}
