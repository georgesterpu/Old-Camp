import {weaponProfiles,type WeaponClass} from './colony';
/** Time-based handling shared by arena practice and valley encounters. */
export class SwordHandling {
 drawn=false;energy=1;elapsed=0;active=false;guarding=false;side=1;combo=0;weaponClass:WeaponClass='sword';private strikeSent=false;private buffered=0;private chainWindow=0;private guardAge=1;
 draw(value=!this.drawn){this.drawn=value;this.active=false;this.guarding=false;this.buffered=0;this.elapsed=0;this.combo=0;this.chainWindow=0;this.guardAge=1}
 attack(){const p=weaponProfiles[this.weaponClass];if(!this.drawn)return false;if(this.active){if(this.elapsed>p.recovery-.22)this.buffered=.2;return false}if(this.energy<p.cost||this.guarding)return false;this.combo=this.chainWindow>0?(this.combo+1)%3:0;this.chainWindow=0;this.energy-=p.cost;this.active=true;this.elapsed=0;this.strikeSent=false;this.side*=-1;return true}
 update(dt:number,guard=false){dt=Math.min(.5,Math.max(0,dt));const p=weaponProfiles[this.weaponClass];this.chainWindow=Math.max(0,this.chainWindow-dt);this.buffered=Math.max(0,this.buffered-dt);const guarding=this.drawn&&guard&&!this.active&&this.energy>.06;this.guardAge=guarding?((this.guarding?this.guardAge:0)+dt):1;this.guarding=guarding;this.energy=Math.min(1,this.energy+dt*(this.guarding?.12:.32));let strike=false;
  if(this.active){this.elapsed+=dt;if(this.elapsed>=p.windup&&!this.strikeSent){this.strikeSent=true;strike=true}if(this.elapsed>=p.recovery){this.active=false;this.elapsed=0;this.chainWindow=.32;if(this.buffered>0){this.buffered=0;this.attack()}}}return strike;
 }
 block(facing:number){if(!this.guarding||facing<.25||this.energy<.2)return false;this.energy-=.2;return true}
 parry(facing:number){if(!this.guarding||this.guardAge>.13||facing<.6||this.energy<.1)return false;this.energy-=.1;this.guardAge=1;return true}
 get pose(){if(!this.active)return 0;return Math.sin(Math.min(1,this.elapsed/weaponProfiles[this.weaponClass].recovery)*Math.PI)}
}
