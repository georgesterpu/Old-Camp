export function activeMenu(){return ['campaign-result','appearance-editor','camp-ledger','dialog','map-panel','journal','pause-screen','start-screen'].map(id=>document.getElementById(id)).find(e=>e&&!e.classList.contains('hidden'))}
export function trapMenuTab(event:KeyboardEvent){
 const root=activeMenu();if(!root||event.code!=='Tab')return false;if(event.defaultPrevented)return true;
 const list=[...root.querySelectorAll<HTMLElement>('button:not(:disabled),select,input:not([type=file]),[tabindex="0"]')].filter(e=>!!e.getClientRects().length&&!e.closest('.hidden')),first=list[0],last=list[list.length-1];
 if(!root.contains(document.activeElement)){event.preventDefault();first?.focus()}
 else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
 else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
 return true;
}
/** Standard gamepad menu navigation; gameplay mapping remains in main. */
export function createMenuController(){
 let direction='',repeatAt=0,clock=0;
 return (dt:number,pad:Gamepad,edge:(i:number)=>boolean,back:()=>void)=>{
  clock+=Math.max(0,dt);
  const root=activeMenu();
  if(!root)return false;
  const controls=[...root.querySelectorAll<HTMLElement>('button:not(:disabled),select,input:not([type=file]),[tabindex="0"]')].filter(e=>!!e.getClientRects().length&&!e.closest('.hidden'));
  const [x=0,y=0]=pad.axes,pressed=pad.buttons.map(b=>b.pressed),next=pressed[13]||y>.6||pressed[15]||x>.6,previous=pressed[12]||y<-.6||pressed[14]||x<-.6;
  const dir=next?'next':previous?'previous':'';
  if(dir&&(dir!==direction||clock>=repeatAt)){
   const index=controls.indexOf(document.activeElement as HTMLElement),offset=dir==='next'?1:-1;
   const current=controls[index];
   if(current instanceof HTMLSelectElement&&(pressed[14]||pressed[15]||Math.abs(x)>.6)){current.selectedIndex=Math.max(0,Math.min(current.options.length-1,current.selectedIndex+offset));current.dispatchEvent(new Event('change',{bubbles:true}))}
   else if(current instanceof HTMLInputElement&&current.type==='range'&&(pressed[14]||pressed[15]||Math.abs(x)>.6)){current.value=String(Number(current.value)+offset*10);current.dispatchEvent(new Event('input',{bubbles:true}))}
   else controls[index<0?(offset>0?0:controls.length-1):(index+offset+controls.length)%Math.max(1,controls.length)]?.focus();
   repeatAt=clock+(dir===direction?.18:.35);
  }
  direction=dir;
  if(edge(0)){const focused=document.activeElement as HTMLElement;if(controls.includes(focused)&&!(focused instanceof HTMLSelectElement))focused.click();else controls[0]?.focus()}
  if(edge(1))back();
  if(root.id==='camp-ledger'&&(edge(4)||edge(5))){const tabs=[...root.querySelectorAll<HTMLButtonElement>('[data-tab]')],index=tabs.findIndex(e=>e.getAttribute('aria-pressed')==='true');tabs[(index+(edge(5)?1:-1)+tabs.length)%tabs.length]?.click()}
  return true;
 };
}
