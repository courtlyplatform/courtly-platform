'use client';

import { type ChangeEvent, type PointerEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadProfessionalAvatarAction, removeProfessionalAvatarAction } from '../application/professional-actions';
import styles from './professionals.module.css';

type Props = {
  professionalId: string;
  avatarUrl: string | null;
  fullName: string;
  labels: { change: string; remove: string; invalid: string };
};

type Position = { x: number; y: number };
const PREVIEW_SIZE = 300;
const OUTPUT_SIZE = 512;

export function ProfessionalAvatarEditor({ professionalId, avatarUrl, fullName, labels }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{ pointerX:number; pointerY:number; imageX:number; imageY:number } | null>(null);
  const [editorOpen,setEditorOpen]=useState(false);
  const [selectedUrl,setSelectedUrl]=useState<string|null>(null);
  const [fileName,setFileName]=useState('avatar');
  const [zoom,setZoom]=useState(1);
  const [position,setPosition]=useState<Position>({x:0,y:0});
  const [imageSize,setImageSize]=useState({width:0,height:0});
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const initials=fullName.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'P';

  useEffect(()=>()=>{ if(selectedUrl) URL.revokeObjectURL(selectedUrl); },[selectedUrl]);
  useEffect(()=>{ if(!editorOpen)return; const old=document.body.style.overflow; document.body.style.overflow='hidden'; return()=>{document.body.style.overflow=old}; },[editorOpen]);

  function baseScale(){ return imageSize.width&&imageSize.height ? Math.max(PREVIEW_SIZE/imageSize.width,PREVIEW_SIZE/imageSize.height) : 1; }
  function clamp(next:Position,nextZoom=zoom){
    if(!imageSize.width||!imageSize.height)return next;
    const scale=baseScale()*nextZoom;
    const maxX=Math.max(0,(imageSize.width*scale-PREVIEW_SIZE)/2);
    const maxY=Math.max(0,(imageSize.height*scale-PREVIEW_SIZE)/2);
    return {x:Math.min(maxX,Math.max(-maxX,next.x)),y:Math.min(maxY,Math.max(-maxY,next.y))};
  }
  function choose(event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0]; event.target.value=''; if(!file)return;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)){setError(labels.invalid);return;}
    if(file.size>10*1024*1024){setError(labels.invalid);return;}
    if(selectedUrl)URL.revokeObjectURL(selectedUrl);
    setSelectedUrl(URL.createObjectURL(file)); setFileName(file.name); setZoom(1); setPosition({x:0,y:0}); setImageSize({width:0,height:0}); setError(null); setEditorOpen(true);
  }
  function pointerDown(e:PointerEvent<HTMLDivElement>){ if(saving)return; e.currentTarget.setPointerCapture(e.pointerId); dragRef.current={pointerX:e.clientX,pointerY:e.clientY,imageX:position.x,imageY:position.y}; }
  function pointerMove(e:PointerEvent<HTMLDivElement>){ const d=dragRef.current;if(!d||saving)return;setPosition(clamp({x:d.imageX+e.clientX-d.pointerX,y:d.imageY+e.clientY-d.pointerY})); }
  function pointerUp(e:PointerEvent<HTMLDivElement>){dragRef.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}
  function close(){if(saving)return;setEditorOpen(false);setError(null);if(selectedUrl){URL.revokeObjectURL(selectedUrl);setSelectedUrl(null);}}
  async function save(){
    const image=imageRef.current;if(!image||!imageSize.width||!imageSize.height)return;
    setSaving(true);setError(null);
    try{
      const canvas=document.createElement('canvas');canvas.width=OUTPUT_SIZE;canvas.height=OUTPUT_SIZE;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('canvas');
      const scale=baseScale()*zoom;const sourceSize=PREVIEW_SIZE/scale;const sourceX=(imageSize.width-sourceSize)/2-position.x/scale;const sourceY=(imageSize.height-sourceSize)/2-position.y/scale;
      ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,sourceX,sourceY,sourceSize,sourceSize,0,0,OUTPUT_SIZE,OUTPUT_SIZE);
      const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/webp',.9));if(!blob)throw new Error('blob');
      const safe=fileName.replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9-_]/g,'-')||'avatar';const form=new FormData();form.append('avatar',new File([blob],`${safe}.webp`,{type:'image/webp'}));
      const result=await uploadProfessionalAvatarAction(professionalId,form);if(!result.success)throw new Error(result.error);
      setEditorOpen(false);if(selectedUrl){URL.revokeObjectURL(selectedUrl);setSelectedUrl(null);}router.refresh();
    }catch(e){setError(e instanceof Error?e.message:labels.invalid);}finally{setSaving(false);}
  }
  async function remove(){setSaving(true);const r=await removeProfessionalAvatarAction(professionalId);setSaving(false);if(r.success)router.refresh();else setError(r.error);}

  const scale=baseScale()*zoom;
  return <>
    <div className={styles.avatarEditor}>
      <div className={styles.avatarLarge}>{avatarUrl?<img src={avatarUrl} alt={fullName}/>:<span>{initials}</span>}</div>
      <div className={styles.avatarActions}><input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={choose}/><button type="button" disabled={saving} onClick={()=>fileInputRef.current?.click()}>{labels.change}</button>{avatarUrl&&<button type="button" disabled={saving} onClick={remove}>{labels.remove}</button>}{error&&<small>{error}</small>}</div>
    </div>
    {editorOpen&&selectedUrl&&<div className={styles.avatarCropOverlay}><section className={styles.avatarCropDialog}><div className={styles.cropViewport} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}><img ref={imageRef} src={selectedUrl} alt="" draggable={false} onLoad={e=>{setImageSize({width:e.currentTarget.naturalWidth,height:e.currentTarget.naturalHeight});setPosition({x:0,y:0});}} style={{width:imageSize.width?imageSize.width*scale:undefined,height:imageSize.height?imageSize.height*scale:undefined,transform:`translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`}}/></div><label className={styles.zoomField}><span>Zoom</span><input type="range" min="1" max="3" step="0.01" value={zoom} onChange={e=>{const z=Number(e.target.value);setZoom(z);setPosition(current=>clamp(current,z));}}/></label>{error&&<small className={styles.cropError}>{error}</small>}<div className={styles.modalActions}><button type="button" disabled={saving} onClick={close}>×</button><button type="button" className={styles.primary} disabled={saving||!imageSize.width} onClick={save}>{labels.change}</button></div></section></div>}
  </>;
}
