/*
 * Offline QR encoder for this application.
 * Byte-mode QR Code generator (versions 1-40, ECC L/M/Q/H), implemented locally.
 * Algorithm follows ISO/IEC QR construction concepts; no network access.
 */
(function(global){
'use strict';
const RS_BLOCK_TABLE = [[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12,7,37,13],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]];
const PATTERN_POSITION_TABLE = [[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]];
const LEVEL = {L:1,M:0,Q:3,H:2};
const RS_OFFSET = {L:0,M:1,Q:2,H:3};
const PAD0=0xEC, PAD1=0x11;
const G15=(1<<10)|(1<<8)|(1<<5)|(1<<4)|(1<<2)|(1<<1)|1;
const G18=(1<<12)|(1<<11)|(1<<10)|(1<<9)|(1<<8)|(1<<5)|(1<<2)|1;
const G15_MASK=(1<<14)|(1<<12)|(1<<10)|(1<<4)|(1<<1);

const EXP=new Array(256).fill(0), LOG=new Array(256).fill(0);
for(let i=0;i<8;i++) EXP[i]=1<<i;
for(let i=8;i<256;i++) EXP[i]=EXP[i-4]^EXP[i-5]^EXP[i-6]^EXP[i-8];
for(let i=0;i<255;i++) LOG[EXP[i]]=i;
const gexp=n=>EXP[((n%255)+255)%255];
const glog=n=>{if(n<1) throw new Error('glog'); return LOG[n];};

class Poly{
  constructor(num,shift=0){
    let off=0; while(off<num.length-1 && num[off]===0) off++;
    this.num=num.slice(off).concat(new Array(shift).fill(0));
  }
  multiply(other){
    const out=new Array(this.num.length+other.num.length-1).fill(0);
    for(let i=0;i<this.num.length;i++) for(let j=0;j<other.num.length;j++){
      if(this.num[i]!==0 && other.num[j]!==0) out[i+j]^=gexp(glog(this.num[i])+glog(other.num[j]));
    }
    return new Poly(out,0);
  }
  mod(other){
    let result=this.num.slice();
    while(result.length>=other.num.length){
      if(result[0]===0){ result.shift(); continue; }
      const ratio=glog(result[0])-glog(other.num[0]);
      for(let i=0;i<other.num.length;i++) if(other.num[i]!==0) result[i]^=gexp(glog(other.num[i])+ratio);
      while(result.length && result[0]===0) result.shift();
    }
    return new Poly(result.length?result:[0],0);
  }
}
class BitBuffer{
  constructor(){this.buffer=[];this.length=0;}
  put(num,len){for(let i=0;i<len;i++) this.putBit(((num>>(len-i-1))&1)===1);}
  putBit(bit){const idx=Math.floor(this.length/8); if(this.buffer.length<=idx)this.buffer.push(0); if(bit)this.buffer[idx]|=0x80>>(this.length%8); this.length++;}
}
function bchDigit(data){let d=0;while(data!==0){d++;data>>>=1;}return d;}
function bchTypeInfo(data){let d=data<<10; while(bchDigit(d)-bchDigit(G15)>=0)d^=G15<<(bchDigit(d)-bchDigit(G15)); return ((data<<10)|d)^G15_MASK;}
function bchTypeNumber(data){let d=data<<12; while(bchDigit(d)-bchDigit(G18)>=0)d^=G18<<(bchDigit(d)-bchDigit(G18)); return (data<<12)|d;}
function rsBlocks(version,level){
  const row=RS_BLOCK_TABLE[(version-1)*4+RS_OFFSET[level]], out=[];
  for(let i=0;i<row.length;i+=3){const [count,total,data]=row.slice(i,i+3);for(let j=0;j<count;j++)out.push({total,data});}
  return out;
}
function lengthBits(version){return version<10?8:(version<27?16:16);}
function createBytes(buffer,blocks){
  let off=0,maxDc=0,maxEc=0; const dc=[],ec=[];
  for(const b of blocks){
    const dcCount=b.data, ecCount=b.total-b.data; maxDc=Math.max(maxDc,dcCount);maxEc=Math.max(maxEc,ecCount);
    const cur=buffer.buffer.slice(off,off+dcCount).map(x=>x&255); off+=dcCount;
    let rsPoly=new Poly([1],0); for(let i=0;i<ecCount;i++)rsPoly=rsPoly.multiply(new Poly([1,gexp(i)],0));
    const raw=new Poly(cur,rsPoly.num.length-1), mod=raw.mod(rsPoly);
    const arr=new Array(ecCount).fill(0); const mo=mod.num.length-ecCount;
    for(let i=0;i<ecCount;i++){const mi=i+mo;if(mi>=0)arr[i]=mod.num[mi];}
    dc.push(cur);ec.push(arr);
  }
  const out=[]; for(let i=0;i<maxDc;i++)for(const a of dc)if(i<a.length)out.push(a[i]);
  for(let i=0;i<maxEc;i++)for(const a of ec)if(i<a.length)out.push(a[i]); return out;
}
function capacityBits(version,level){return rsBlocks(version,level).reduce((s,b)=>s+b.data*8,0);}
function chooseVersion(bytes,level){
  for(let v=1;v<=40;v++){
    const bits=4+lengthBits(v)+bytes.length*8;
    if(bits<=capacityBits(v,level))return v;
  }
  throw new Error('QR data too large');
}
function createData(version,level,bytes){
  const buf=new BitBuffer(); buf.put(4,4); buf.put(bytes.length,lengthBits(version)); for(const b of bytes)buf.put(b,8);
  const blocks=rsBlocks(version,level), limit=blocks.reduce((s,b)=>s+b.data*8,0);
  if(buf.length>limit)throw new Error('Data overflow');
  for(let i=0;i<Math.min(limit-buf.length,4);i++)buf.putBit(false);
  while(buf.length%8)buf.putBit(false);
  let i=0;while(buf.length<limit){buf.put(i%2===0?PAD0:PAD1,8);i++;}
  return createBytes(buf,blocks);
}
function maskFunc(p,i,j){switch(p){case 0:return(i+j)%2===0;case 1:return i%2===0;case 2:return j%3===0;case 3:return(i+j)%3===0;case 4:return(Math.floor(i/2)+Math.floor(j/3))%2===0;case 5:return(i*j)%2+(i*j)%3===0;case 6:return((i*j)%2+(i*j)%3)%2===0;case 7:return((i*j)%3+(i+j)%2)%2===0;}}
function lostPoint(m){
  const n=m.length;let lost=0;
  for(let r=0;r<n;r++){let prev=m[r][0],run=1;for(let c=1;c<n;c++){if(m[r][c]===prev)run++;else{if(run>=5)lost+=run-2;prev=m[r][c];run=1;}}if(run>=5)lost+=run-2;}
  for(let c=0;c<n;c++){let prev=m[0][c],run=1;for(let r=1;r<n;r++){if(m[r][c]===prev)run++;else{if(run>=5)lost+=run-2;prev=m[r][c];run=1;}}if(run>=5)lost+=run-2;}
  for(let r=0;r<n-1;r++)for(let c=0;c<n-1;c++){const x=m[r][c];if(m[r][c+1]===x&&m[r+1][c]===x&&m[r+1][c+1]===x)lost+=3;}
  const p1=[1,0,1,1,1,0,1,0,0,0,0],p2=[0,0,0,0,1,0,1,1,1,0,1];
  const match=a=>a.every((v,i)=>v===p1[i])||a.every((v,i)=>v===p2[i]);
  for(let r=0;r<n;r++)for(let c=0;c<=n-11;c++)if(match(m[r].slice(c,c+11).map(Boolean).map(Number)))lost+=40;
  for(let c=0;c<n;c++)for(let r=0;r<=n-11;r++){const a=[];for(let k=0;k<11;k++)a.push(m[r+k][c]?1:0);if(match(a))lost+=40;}
  let dark=0;for(const row of m)for(const x of row)if(x)dark++;lost+=Math.floor(Math.abs(dark*100/(n*n)-50)/5)*10;return lost;
}
function build(version,level,data,mask,test){
  const count=version*4+17,m=Array.from({length:count},()=>Array(count).fill(null));
  function probe(row,col){for(let r=-1;r<=7;r++){if(row+r<0||row+r>=count)continue;for(let c=-1;c<=7;c++){if(col+c<0||col+c>=count)continue;m[row+r][col+c]=((r>=0&&r<=6&&(c===0||c===6))||(c>=0&&c<=6&&(r===0||r===6))||(r>=2&&r<=4&&c>=2&&c<=4));}}}
  probe(0,0);probe(count-7,0);probe(0,count-7);
  const pos=PATTERN_POSITION_TABLE[version-1];for(const row of pos)for(const col of pos){if(m[row][col]!==null)continue;for(let r=-2;r<=2;r++)for(let c=-2;c<=2;c++)m[row+r][col+c]=(Math.abs(r)===2||Math.abs(c)===2||(r===0&&c===0));}
  for(let r=8;r<count-8;r++)if(m[r][6]===null)m[r][6]=r%2===0;for(let c=8;c<count-8;c++)if(m[6][c]===null)m[6][c]=c%2===0;
  const info=bchTypeInfo((LEVEL[level]<<3)|mask);for(let i=0;i<15;i++){const mod=!test&&((info>>i)&1)===1;if(i<6)m[i][8]=mod;else if(i<8)m[i+1][8]=mod;else m[count-15+i][8]=mod;}
  for(let i=0;i<15;i++){const mod=!test&&((info>>i)&1)===1;if(i<8)m[8][count-i-1]=mod;else if(i<9)m[8][15-i]=mod;else m[8][15-i-1]=mod;}m[count-8][8]=!test;
  if(version>=7){const bits=bchTypeNumber(version);for(let i=0;i<18;i++){const mod=!test&&((bits>>i)&1)===1;m[Math.floor(i/3)][i%3+count-11]=mod;m[i%3+count-11][Math.floor(i/3)]=mod;}}
  let inc=-1,row=count-1,bit=7,bi=0;for(let col=count-1;col>0;col-=2){if(col<=6)col--;while(true){for(const c of [col,col-1])if(m[row][c]===null){let dark=bi<data.length?(((data[bi]>>bit)&1)===1):false;if(maskFunc(mask,row,c))dark=!dark;m[row][c]=dark;if(--bit<0){bi++;bit=7;}}row+=inc;if(row<0||row>=count){row-=inc;inc=-inc;break;}}}
  return m;
}
function encodeBytes(bytes,level='M'){
  level=(level||'M').toUpperCase();if(!(level in LEVEL))throw new Error('Bad ECC level');
  const v=chooseVersion(bytes,level),data=createData(v,level,bytes);let best=null,score=Infinity;
  for(let mask=0;mask<8;mask++){const cand=build(v,level,data,mask,false),s=lostPoint(cand);if(s<score){score=s;best=cand;}}
  return {version:v,modules:best};
}
function encodeText(text,level='M'){return encodeBytes(Array.from(new TextEncoder().encode(text)),level);}
function toCanvas(result,scale=4,border=4){
  const n=result.modules.length,size=(n+border*2)*scale,c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,size,size);x.fillStyle='#000';for(let r=0;r<n;r++)for(let col=0;col<n;col++)if(result.modules[r][col])x.fillRect((col+border)*scale,(r+border)*scale,scale,scale);return c;
}
global.OfflineQR={encodeText,encodeBytes,toCanvas};
})(window);
