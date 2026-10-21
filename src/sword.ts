/** Time-based sword handling. Does not alter locomotion or camera steering. */
export class SwordHandling {
 drawn=false;energy=1;elapsed=0;active=false;guarding=false;side=1;private strikeSent=false;private buffered=0;
 draw(value=!this.drawn){this.drawn=value;this.active=false;this.guarding=false;this.buffered=0;this.elapsed=0}
 attack(){if(!this.drawn)return false;if(this.active){if(this.elapsed>.43)this.buffered=.2;return false}if(this.energy<.25||this.guarding)return false;this.energy-=.25;this.active=true;this.elapsed=0;this.strikeSent=false;this.side*=-1;return true}
 update(dt:number,guard=false){dt=Math.min(.5,Math.max(0,dt));this.buffered=Math.max(0,this.buffered-dt);this.guarding=this.drawn&&guard&&!this.active&&this.energy>.06;this.energy=Math.min(1,this.energy+dt*(this.guarding?.12:.32));let strike=false;
  if(this.active){this.elapsed+=dt;if(this.elapsed>=.18&&!this.strikeSent){this.strikeSent=true;strike=true}if(this.elapsed>=.65){this.active=false;this.elapsed=0;if(this.buffered>0){this.buffered=0;this.attack()}}}return strike;
 }
 block(facing:number){if(!this.guarding||facing<.25||this.energy<.2)return false;this.energy-=.2;return true}
 get pose(){if(!this.active)return 0;return Math.sin(Math.min(1,this.elapsed/.65)*Math.PI)}
}
