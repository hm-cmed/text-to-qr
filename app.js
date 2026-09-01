'use strict';

const enc = new TextEncoder();
const dec = new TextDecoder();
const state = { docId:'', fullCrc:'', chunks:[], scanned:new Map(), expectedTotal:0, scanDocId:'', scanFullCrc:'' };

const $ = id => document.getElementById(id);

function bytesToBase64Url(bytes){
  let s=''; const step=0x8000;
  for(let i=0;i<bytes.length;i+=step) s += String.fromCharCode(...bytes.subarray(i,i+step));
  return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function base64UrlToBytes(s){
  s=s.replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4)s+='=';
  const raw=atob(s), out=new Uint8Array(raw.length); for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i); return out;
}
// OQ2 uses RFC 4648 Base32 (A-Z, 2-7 only). This avoids punctuation keys
// that are frequently mistranslated by USB HID scanners under US/JIS layouts.
const B32='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function bytesToBase32(bytes){
  let out='', buffer=0, bits=0;
  for(const b of bytes){
    buffer=(buffer<<8)|b; bits+=8;
    while(bits>=5){bits-=5;out+=B32[(buffer>>>bits)&31];}
    buffer &= (1<<bits)-1;
  }
  if(bits>0) out+=B32[(buffer<<(5-bits))&31];
  return out;
}
function base32ToBytes(s){
  s=s.trim().toUpperCase();
  let buffer=0,bits=0,out=[];
  for(const ch of s){
    const v=B32.indexOf(ch); if(v<0) throw new Error('OQ2本文に不正な文字があります。');
    buffer=(buffer<<5)|v; bits+=5;
    if(bits>=8){bits-=8;out.push((buffer>>>bits)&255);buffer &= (1<<bits)-1;}
  }
  return new Uint8Array(out);
}
function crc32(bytes){
  let c=0xffffffff;
  for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}
  return ((c^0xffffffff)>>>0).toString(16).padStart(8,'0');
}
function randomId(){
  const a=new Uint8Array(6); if(window.crypto?.getRandomValues) crypto.getRandomValues(a); else for(let i=0;i<a.length;i++)a[i]=Math.floor(Math.random()*256);
  return Array.from(a,b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
}
function splitUtf8(text,maxBytes){
  const chars=Array.from(text); const chunks=[]; let cur=''; let curBytes=0;
  const preferred = ch => ch==='\n'||ch==='。'||ch==='！'||ch==='？'||ch==='.'||ch==='!'||ch==='?'||ch===' ';
  let lastBreak=-1;
  for(const ch of chars){
    const n=enc.encode(ch).length;
    if(curBytes+n>maxBytes && cur){
      if(lastBreak>Math.max(0,cur.length*0.55)){
        const head=cur.slice(0,lastBreak+1), tail=cur.slice(lastBreak+1);
        chunks.push(head); cur=tail+ch; curBytes=enc.encode(cur).length;
      } else { chunks.push(cur); cur=ch; curBytes=n; }
      lastBreak=-1; for(let i=0;i<cur.length;i++)if(preferred(cur[i]))lastBreak=i;
    } else { cur+=ch;curBytes+=n;if(preferred(ch))lastBreak=cur.length-1; }
  }
  if(cur)chunks.push(cur); return chunks;
}
function makePayload(docId,part,total,fullCrc,text){
  const bytes=enc.encode(text), partCrc=crc32(bytes).toUpperCase(), b32=bytesToBase32(bytes);
  // Fixed-width, alphanumeric-only OQ2 format:
  // OQ2 + DOCID(12) + PART(4) + TOTAL(4) + FULLCRC(8) + PARTCRC(8) + BASE32DATA
  return `OQ2${docId}${String(part).padStart(4,'0')}${String(total).padStart(4,'0')}${fullCrc.toUpperCase()}${partCrc}${b32}`;
}
function parseOQ2(s){
  s=s.trim().toUpperCase();
  if(!s.startsWith('OQ2')||s.length<40) throw new Error('このQRはOQ2形式ではありません。');
  const docId=s.slice(3,15), partS=s.slice(15,19), totalS=s.slice(19,23), fullCrc=s.slice(23,31), partCrc=s.slice(31,39), b32=s.slice(39);
  if(!/^[A-F0-9]{12}$/.test(docId)||!/^[0-9]{4}$/.test(partS)||!/^[0-9]{4}$/.test(totalS)||!/^[A-F0-9]{8}$/.test(fullCrc)||!/^[A-F0-9]{8}$/.test(partCrc)||!/^[A-Z2-7]+$/.test(b32)) throw new Error('OQ2データ形式が不正です。');
  const part=Number(partS), total=Number(totalS);
  if(!Number.isInteger(part)||!Number.isInteger(total)||part<1||part>total) throw new Error('分割番号が不正です。');
  const bytes=base32ToBytes(b32);
  if(crc32(bytes).toUpperCase()!==partCrc) throw new Error(`PART ${part} のCRCが一致しません。再スキャンしてください。`);
  return {docId,part,total,fullCrc:fullCrc.toLowerCase(),partCrc:partCrc.toLowerCase(),text:dec.decode(bytes)};
}
function parseOQ1(s){
  // Legacy v1.0 support. First try exact OQ1, then common US/JIS HID substitutions.
  let candidates=[s.trim()];
  if(s.includes('}')||s.includes('=')) candidates.push(s.trim().replace(/}/g,'|').replace(/=/g,'_'));
  let lastErr=null;
  for(const c of candidates){
    try{
      const p=c.split('|');
      if(p.length!==7||p[0]!=='OQ1') throw new Error('not OQ1');
      const [_,docId,partS,totalS,fullCrc,partCrc,b64]=p; const part=Number(partS),total=Number(totalS);
      if(!Number.isInteger(part)||!Number.isInteger(total)||part<1||part>total) throw new Error('分割番号が不正です。');
      const bytes=base64UrlToBytes(b64); if(crc32(bytes)!==partCrc.toLowerCase()) throw new Error(`PART ${part} のCRCが一致しません。`);
      return {docId,part,total,fullCrc:fullCrc.toLowerCase(),partCrc:partCrc.toLowerCase(),text:dec.decode(bytes)};
    }catch(e){lastErr=e;}
  }
  throw new Error('旧OQ1形式を復元できません。v1.0のQRはスキャナのキーボード配列設定を確認するか、可能ならOQ2で再生成してください。');
}
function parsePayload(s){
  const t=s.trim();
  if(t.toUpperCase().startsWith('OQ2')) return parseOQ2(t);
  if(t.startsWith('OQ1')||t.startsWith('OQ1}')) return parseOQ1(t);
  throw new Error('このQRは本ツール形式(OQ2/OQ1)ではありません。');
}
function canvasDownload(canvas,name){const a=document.createElement('a');a.href=canvas.toDataURL('image/png');a.download=name;a.click();}
function setTab(name){document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.tab===name));document.querySelectorAll('.panel').forEach(x=>x.hidden=x.id!==`panel-${name}`);if(name==='restore')setTimeout(()=>$('scanInput').focus(),50);}

function generate(){
  const text=$('sourceText').value; if(!text){alert('テキストを入力してください。');return;}
  const maxBytes=Math.max(100,Math.min(1000,Number($('chunkBytes').value)||600)); $('chunkBytes').value=maxBytes;
  const ecc=$('ecc').value; const chunks=splitUtf8(text,maxBytes); const docId=randomId(), fullCrc=crc32(enc.encode(text));
  state.docId=docId;state.fullCrc=fullCrc;state.chunks=[];
  const total=chunks.length; const out=$('qrGrid');out.innerHTML='';
  try{
    chunks.forEach((chunk,i)=>{
      const payload=makePayload(docId,i+1,total,fullCrc,chunk); const result=OfflineQR.encodeText(payload,ecc); const canvas=OfflineQR.toCanvas(result,4,4);
      const card=document.createElement('div');card.className='qr-card';
      const title=document.createElement('div');title.className='qr-title';title.textContent=`QR ${i+1} / ${total}`;
      const meta=document.createElement('div');meta.className='qr-meta';meta.textContent=`本文 ${enc.encode(chunk).length} bytes / QR Version ${result.version}`;
      const btn=document.createElement('button');btn.textContent='PNG保存';btn.className='small';btn.onclick=()=>canvasDownload(canvas,`QR_${docId}_${String(i+1).padStart(3,'0')}_of_${String(total).padStart(3,'0')}.png`);
      card.append(title,canvas,meta,btn);out.appendChild(card);state.chunks.push({chunk,payload,result,canvas});
    });
  }catch(e){out.innerHTML='';alert('QR生成に失敗しました: '+e.message+'\n1QRあたりのバイト数を小さくしてください。');return;}
  $('genSummary').textContent=`文書ID ${docId} / 全文 ${enc.encode(text).length.toLocaleString()} bytes / ${total} QR / CRC32 ${fullCrc}`;
  $('printBtn').disabled=false;$('saveAllHint').hidden=false;
}
function printQrs(){window.print();}

function updateRestore(){
  const total=state.expectedTotal, got=state.scanned.size; $('restoreStatus').textContent=total?`${got} / ${total} QR取得済`:'QRをスキャンしてください';
  const missing=[];for(let i=1;i<=total;i++)if(!state.scanned.has(i))missing.push(i);$('missing').textContent=total?(missing.length?`未取得: ${missing.join(', ')}`:'✓ 全QRコードが揃いました'):'未取得: —';
  $('restoreBtn').disabled=!(total&&got===total); const list=$('partsList');list.innerHTML='';for(let i=1;i<=total;i++){const s=document.createElement('span');s.className=state.scanned.has(i)?'part ok':'part';s.textContent=i;list.appendChild(s);}
}
function acceptScan(raw){
  let x;try{x=parsePayload(raw);}catch(e){$('scanMessage').textContent='⚠ '+e.message;$('scanMessage').className='message error';return;}
  if(!state.scanDocId){state.scanDocId=x.docId;state.scanFullCrc=x.fullCrc;state.expectedTotal=x.total;}
  if(x.docId!==state.scanDocId||x.fullCrc!==state.scanFullCrc){$('scanMessage').textContent=`⚠ 別文書のQRです (${x.docId})。現在は ${state.scanDocId} を復元中です。`;$('scanMessage').className='message error';return;}
  if(x.total!==state.expectedTotal){$('scanMessage').textContent='⚠ TOTAL値が一致しません。';$('scanMessage').className='message error';return;}
  state.scanned.set(x.part,x);$('scanMessage').textContent=`✓ QR ${x.part}/${x.total} を登録しました${state.scanned.size===x.total?'。全文が揃いました。':''}`;$('scanMessage').className='message ok';updateRestore();
}
function restoreText(){
  const parts=[];for(let i=1;i<=state.expectedTotal;i++)parts.push(state.scanned.get(i).text);const text=parts.join('');
  if(crc32(enc.encode(text))!==state.scanFullCrc){alert('全文CRCが一致しません。読み取りデータを確認してください。');return;}
  $('restoredText').value=text;$('downloadTxt').disabled=false;
}
function downloadTxt(){const blob=new Blob([$('restoredText').value],{type:'text/plain;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`restored_${state.scanDocId}.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);}
function resetRestore(){state.scanned.clear();state.expectedTotal=0;state.scanDocId='';state.scanFullCrc='';$('restoredText').value='';$('downloadTxt').disabled=true;$('scanMessage').textContent='';updateRestore();$('scanInput').focus();}

window.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
  $('generateBtn').onclick=generate;$('printBtn').onclick=printQrs;$('restoreBtn').onclick=restoreText;$('downloadTxt').onclick=downloadTxt;$('resetRestore').onclick=resetRestore;
  $('scanInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const v=e.target.value.trim();e.target.value='';if(v)acceptScan(v);}});
  $('scanInput').addEventListener('paste',()=>setTimeout(()=>{const v=$('scanInput').value.trim();if(v){$('scanInput').value='';acceptScan(v);}},0));
  updateRestore();
});

// ---- PWA / offline support ----
let deferredInstallPrompt = null;

function updateNetworkBadge(){
  const b=$('networkBadge');
  if(!b) return;
  if(navigator.onLine){ b.textContent='オンライン'; b.classList.add('online'); b.classList.remove('offline'); }
  else { b.textContent='オフライン'; b.classList.add('offline'); b.classList.remove('online'); }
}

async function registerOfflineApp(){
  const status=$('pwaStatus');
  if(!('serviceWorker' in navigator)){
    if(status) status.textContent='このブラウザはService Workerに対応していないため、オフライン保存は利用できません。';
    return;
  }
  try{
    const reg=await navigator.serviceWorker.register('./service-worker.js', {scope:'./'});
    await navigator.serviceWorker.ready;
    if(status) status.textContent='✓ オフライン利用の準備ができました。次回以降はネット接続がなくても起動できます。';
    reg.update().catch(()=>{});
  }catch(err){
    if(status) status.textContent='オフライン保存を有効化できませんでした。GitHub PagesなどHTTPS環境で開いてください。';
  }
}

window.addEventListener('beforeinstallprompt', e=>{
  e.preventDefault(); deferredInstallPrompt=e;
  const btn=$('installBtn'); if(btn) btn.hidden=false;
});
window.addEventListener('appinstalled', ()=>{
  deferredInstallPrompt=null; const btn=$('installBtn'); if(btn) btn.hidden=true;
  const status=$('pwaStatus'); if(status) status.textContent='✓ アプリとしてインストールされました。オフラインでも利用できます。';
});
window.addEventListener('online', updateNetworkBadge);
window.addEventListener('offline', updateNetworkBadge);
window.addEventListener('DOMContentLoaded', ()=>{
  updateNetworkBadge(); registerOfflineApp();
  const btn=$('installBtn');
  if(btn) btn.addEventListener('click', async()=>{
    if(!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt=null; btn.hidden=true;
  });
});
