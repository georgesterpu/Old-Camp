import {loadJourney} from './storage';
/** Keep a failed graphics startup recoverable, including access to the player's save. */
function showRecovery(){
 if(document.getElementById('boot-recovery'))return;
 window.dispatchEvent(new Event('campfatal'));
 const panel=document.createElement('section');panel.id='boot-recovery';panel.setAttribute('role','alertdialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','recovery-title');
 panel.innerHTML='<div><div class="kicker">THE OLD CAMP · RECOVERY</div><h2 id="recovery-title">The valley could not continue</h2><p>Reload the game. If the 3D view still fails, open this file in current Microsoft Edge or Chrome with hardware acceleration enabled.</p><p>Your last valid local save can be downloaded before you reload.</p><button class="enter" id="recovery-reload">Reload game</button> <button class="small" id="recovery-export">Download last valid save</button></div>';
 document.body.append(panel);let journey:ReturnType<typeof loadJourney>['save']=null;try{journey=loadJourney(localStorage).save}catch{}
 const download=panel.querySelector<HTMLButtonElement>('#recovery-export')!;download.disabled=!journey;
 download.onclick=()=>{if(!journey)return;const url=URL.createObjectURL(new Blob([JSON.stringify(journey,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='old-camp-recovered-journey.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 panel.querySelector<HTMLButtonElement>('#recovery-reload')!.onclick=()=>location.reload();panel.querySelector<HTMLButtonElement>('button')!.focus();
}
window.addEventListener('error',showRecovery);window.addEventListener('unhandledrejection',showRecovery);
