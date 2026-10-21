import {Scene,UniversalCamera,HemisphericLight,DirectionalLight,Vector3,Color3,Color4,Viewport,ImageProcessingConfiguration,type Engine} from '@babylonjs/core';
import {appearanceOptions,appearanceLabels,defaultAppearance,normalizeAppearance,randomAppearance,type Appearance,type AppearanceKey} from './appearance';
import {createCharacterFactory} from './characters';
import type {SurfaceSet} from './surfaces';
import type {Person} from './world';
/** Preview in a separate scene: editing never moves the player or advances a bout. */
export function createAppearanceEditor(engine:Engine,surfaces:SurfaceSet,hero:Person,callbacks:{open:()=>void;close:()=>void;save:(value:Appearance)=>void}){
 const element=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
 const panel=element('appearance-panel'),fields=element('appearance-fields'),status=element('appearance-status');
 let previousFocus:HTMLElement|null=null;
 let opened=false,draft={...hero.appearance},portrait=false,turn=0,scene:Scene|undefined,avatar:Person|undefined,camera:UniversalCamera|undefined;
 const selects=new Map<AppearanceKey,HTMLSelectElement>();
 for(const key of Object.keys(appearanceOptions) as AppearanceKey[]){
  const label=document.createElement('label');label.textContent=appearanceLabels[key];
  const select=document.createElement('select');select.id='appearance-'+key;select.name=key;
  for(const [value,text] of Object.entries(appearanceOptions[key])){const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option)}
  select.onchange=()=>{draft=normalizeAppearance({...draft,[key]:select.value});refresh()};label.append(select);fields.append(label);selects.set(key,select);
 }
 function refresh(){for(const [key,select] of selects)select.value=draft[key];avatar?.setAppearance(draft);status.textContent='Previewing · Save appearance to keep this look.'}
 function preparePreview(){
  if(scene)return;
  scene=new Scene(engine);scene.clearColor=new Color4(.055,.065,.058,1);scene.ambientColor=new Color3(.2,.2,.2);
  scene.imageProcessingConfiguration.toneMappingEnabled=true;scene.imageProcessingConfiguration.toneMappingType=ImageProcessingConfiguration.TONEMAPPING_ACES;scene.imageProcessingConfiguration.exposure=1.1;
  const fill=new HemisphericLight('portrait fill',new Vector3(0,1,1),scene);fill.intensity=1.05;fill.groundColor=new Color3(.4,.36,.32);
  const key=new DirectionalLight('portrait key',new Vector3(-.5,-.6,-1),scene);key.intensity=1.4;key.diffuse=new Color3(1,.92,.8);
  camera=new UniversalCamera('appearance camera',new Vector3(0,1.1,3.6),scene);camera.minZ=.05;camera.fov=.6;scene.activeCamera=camera;
  avatar=createCharacterFactory(scene,surfaces)('Your preview','Newcomer',0,0);avatar.weapon?.setEnabled(false);
 }
 function close(apply=false){
  if(!opened)return;
  if(apply)callbacks.save({...draft});opened=false;element('appearance-editor').classList.add('hidden');callbacks.close();previousFocus?.focus();
 }
 function open(value=hero.appearance){
  if(opened)return;previousFocus=document.activeElement as HTMLElement;preparePreview();draft={...value};opened=true;turn=0;portrait=false;element<HTMLInputElement>('appearance-turn').value='0';element('appearance-full').setAttribute('aria-pressed','true');element('appearance-portrait').setAttribute('aria-pressed','false');
  element('appearance-editor').classList.remove('hidden');refresh();callbacks.open();selects.get('skin')!.focus();
 }
 function render(time:number){
  if(!opened||!scene||!avatar||!camera)return;
  const bounds=panel.getBoundingClientRect();
  camera.viewport=innerWidth<=650?new Viewport(0,bounds.height/innerHeight+.13,1,Math.max(.1,1-bounds.height/innerHeight-.13)):new Viewport(0,.16,1-bounds.width/innerWidth,.84);
  const height=avatar.root.scaling.y/1.1;
  camera.position.set(portrait?.08:.35,(portrait?1.79:1.15)*height,portrait?.85:3.9);camera.setTarget(new Vector3(0,(portrait?1.79:1.03)*height,0));
  avatar.root.rotation.y=turn;avatar.pose?.(time);scene.render();
 }
 element('appearance-save').onclick=()=>close(true);element('appearance-cancel').onclick=()=>close();element('appearance-close').onclick=()=>close();
 element('appearance-random').onclick=()=>{draft=randomAppearance();refresh()};element('appearance-default').onclick=()=>{draft={...defaultAppearance};refresh()};
 element<HTMLInputElement>('appearance-turn').oninput=e=>turn=Number((e.target as HTMLInputElement).value)*Math.PI/180;
 element('appearance-portrait').onclick=()=>{portrait=true;element('appearance-portrait').setAttribute('aria-pressed','true');element('appearance-full').setAttribute('aria-pressed','false')};
 element('appearance-full').onclick=()=>{portrait=false;element('appearance-full').setAttribute('aria-pressed','true');element('appearance-portrait').setAttribute('aria-pressed','false')};
 document.addEventListener('keydown',event=>{
  if(!opened||event.code!=='Tab')return;
  const controls=Array.from(element('appearance-editor').querySelectorAll<HTMLElement>('button,select,input')).filter(control=>!control.hasAttribute('disabled'));
  const first=controls[0],last=controls[controls.length-1];
  if(!element('appearance-editor').contains(document.activeElement)){event.preventDefault();first.focus()}
  else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
 });
 return {open,close,render,get isOpen(){return opened},diagnostics:()=>({open:opened,draft:{...draft},meshes:scene?.meshes.length??0,materials:scene?.materials.length??0,vertices:avatar?.root.getChildMeshes().filter(m=>m.isEnabled()).reduce((sum,m)=>sum+m.getTotalVertices(),0)??0})};
}