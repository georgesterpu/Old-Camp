import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
const options={cwd:root,encoding:'utf8' as const,windowsHide:true};
const candidates:string[][]=[];
if(process.env.PYTHON)candidates.push([process.env.PYTHON]);
candidates.push(['python3'],['python'],['py','-3']);
let interpreter=candidates.find(command=>{const probe=spawnSync(command[0],[...command.slice(1),'--version'],options);return probe.status===0&&/Python 3\./.test(probe.stdout+probe.stderr)});
if(!interpreter){
 const cached=spawnSync('uv',['python','find','--offline'],options);
 const path=cached.stdout?.trim();if(cached.status===0&&path&&existsSync(path))interpreter=[path];
}
if(!interpreter){console.error('Python 3 is required to package the game. Install it, set PYTHON to its executable, or use an existing uv-managed Python. No interpreter is downloaded automatically.');process.exit(1)}
const script=process.argv.includes('--source')?'scripts/package-source.py':'scripts/package.py';
const result=spawnSync(interpreter[0],[...interpreter.slice(1),script],{cwd:root,stdio:'inherit',windowsHide:true});
if(result.error)console.error(result.error.message);process.exit(result.status??1);
