"""Adapt Drummyfish's CC0 quad mesh. Preserve skin UVs; subdivide once for smooth silhouettes."""
import json
from pathlib import Path
root=Path(__file__).resolve().parent.parent
verts=[];uvs=[];faces=[]
for line in (root/'assets/source/male.obj').read_text().splitlines():
 p=line.split()
 if not p:continue
 if p[0]=='v':verts.append(tuple(map(float,p[1:4])))
 elif p[0]=='vt':uvs.append(tuple(map(float,p[1:3])))
 elif p[0]=='f':faces.append([(int(v.split('/')[0])-1,int(v.split('/')[1])-1) for v in p[1:]])
def avg(vs):return tuple(sum(v[i] for v in vs)/len(vs) for i in range(len(vs[0])))
fp=[avg([verts[v] for v,t in f]) for f in faces];edges={};adj=[[] for _ in verts]
for fi,f in enumerate(faces):
 for i,(v,t) in enumerate(f):
  adj[v].append(fi);key=tuple(sorted((v,f[(i+1)%len(f)][0])));edges.setdefault(key,[]).append(fi)
new=[]
for i,v in enumerate(verts):
 es=[e for e in edges if i in e]
 if not es:new.append(v);continue
 n=len(es);f=avg([fp[j] for j in adj[i]]);r=avg([avg([verts[a],verts[b]]) for a,b in es]);new.append(tuple((f[k]+2*r[k]+(n-3)*v[k])/n for k in range(3)))
eidx={}
for e,fs in edges.items():eidx[e]=len(new);new.append(avg([verts[i] for i in e]+[fp[i] for i in fs]))
fidx=[]
for v in fp:fidx.append(len(new));new.append(v)
positions=[];tex=[];indices=[]
for fi,f in enumerate(faces):
 ft=avg([uvs[t] for v,t in f])
 for i,(v,t) in enumerate(f):
  pv,pt=f[(i-1)%len(f)];nv,nt=f[(i+1)%len(f)]
  quad=[v,eidx[tuple(sorted((v,nv)))],fidx[fi],eidx[tuple(sorted((pv,v)))]]
  qt=[uvs[t],avg([uvs[t],uvs[nt]]),ft,avg([uvs[pt],uvs[t]])];base=len(positions)//3
  for vi,uv in zip(quad,qt):positions.extend(round(c,6) for c in new[vi]);tex.extend(round(c,6) for c in uv)
  indices.extend([base,base+2,base+1,base,base+3,base+2])
out={'positions':positions,'uvs':tex,'indices':indices}
(root/'assets/human.json').write_text(json.dumps(out,separators=(',',':')))
print(len(positions)//3,'vertices;',len(indices)//3,'triangles')
