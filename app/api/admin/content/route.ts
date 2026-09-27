import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { isAdmin } from '@/lib/auth';
import { db, extraRow, getContent, serviceRow } from '@/lib/db';
import { applyContentOp, isUuid, opSchema } from '@/lib/content';
export const maxDuration=60;
const bucket='photos';
// The braider's website editor. Every change is validated, applied to the database, and the fresh content returned.
export async function GET(){
 if(!await isAdmin())return NextResponse.json({error:'Please sign in.'},{status:401});
 return NextResponse.json(await getContent(true));
}
export async function PATCH(request:Request){
 if(!await isAdmin())return NextResponse.json({error:'Please sign in.'},{status:401});
 if(request.headers.get('origin')!==new URL(request.url).origin)return NextResponse.json({error:'Request not allowed.'},{status:403});
 const parsed=opSchema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message||'Please check what you entered.'},{status:400});
 const op=parsed.data;
 try{
 const client=db(),current=await getContent(true);
 // Compute ids, slugs and order exactly as the demo does, then persist the difference.
 let photoUrl:string|undefined,storagePath:string|null=null;
 if(op.type==='uploadPhoto'){
  const [,type,base64]=op.upload.dataUrl.match(/^data:image\/(\w+);base64,(.+)$/)!;
  storagePath=`${op.upload.category}/${randomUUID()}.${type==='jpeg'?'jpg':type}`;
  const {error}=await client.storage.from(bucket).upload(storagePath,Buffer.from(base64,'base64'),{contentType:`image/${type}`,upsert:false});if(error)throw error;
  photoUrl=client.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
 }
 const {content:next,message}=applyContentOp(current,op,randomUUID,photoUrl);
 let note=message;
 switch(op.type){
  case 'text':{const {error}=await client.from('site_content').upsert({key:'text',value:next.text,updated_at:new Date().toISOString()});if(error)throw error;
   if(op.text.depositCents!==undefined){const {error:e}=await client.from('business_settings').update({deposit_cents:op.text.depositCents,deposit_instructions:next.text.depositSummary}).eq('id',1);if(e)throw e;}break;}
  case 'category':{const {error}=await client.from('categories').upsert(next.categories);if(error)throw error;break;}
  case 'deleteCategory':{if(next.categories.length!==current.categories.length){const {error}=await client.from('categories').delete().eq('slug',op.slug);if(error)throw error;}break;}
  case 'service':{const row=next.services.find(s=>!current.services.some(c=>c.id===s.id&&JSON.stringify(c)===JSON.stringify(s)))!;const {error}=await client.from('styles').upsert(serviceRow(row));if(error)throw error;break;}
  case 'deleteService':{
   if(!isUuid(op.id))break;
   const {error}=await client.from('styles').delete().eq('id',op.id);
   // Booked services keep their history: hide instead of deleting.
   if(error?.code==='23503'){const {error:e}=await client.from('styles').update({active:false}).eq('id',op.id);if(e)throw e;note='This service has bookings, so it was hidden from the menu instead of deleted.';}
   else if(error)throw error;break;}
  case 'extra':{const row=next.extras.find(e=>!current.extras.some(c=>c.id===e.id&&JSON.stringify(c)===JSON.stringify(e)))!;const {error}=await client.from('addons').upsert(extraRow(row));if(error)throw error;break;}
  case 'deleteExtra':{const {error}=await client.from('addons').delete().eq('id',op.id);if(error)throw error;break;}
  case 'photo':{const {error}=await client.from('style_photos').update({alt:op.photo.alt,own:op.photo.own,sort_order:op.photo.sort_order}).eq('id',op.photo.id);if(error)throw error;break;}
  case 'uploadPhoto':{const p=next.photos.at(-1)!;const {error}=await client.from('style_photos').insert({id:p.id,category:p.category,storage_path:storagePath,url:p.url,alt:p.alt,width:p.width,height:p.height,own:p.own,sort_order:p.sort_order});if(error)throw error;break;}
  case 'deletePhoto':{const photo=current.photos.find(p=>p.id===op.id);if(photo?.storage_path)await client.storage.from(bucket).remove([photo.storage_path]);const {error}=await client.from('style_photos').delete().eq('id',op.id);if(error)throw error;break;}
  case 'reorder':{
   const table={categories:'categories',services:'styles',extras:'addons',photos:'style_photos'}[op.kind],key=op.kind==='categories'?'slug':'id';
   for(const [i,id] of op.ids.entries()){const {error}=await client.from(table).update({sort_order:i}).eq(key,id);if(error)throw error;}break;}
 }
 return NextResponse.json({content:await getContent(true),message:note});
 }catch(error){console.error('Content update failed',error);return NextResponse.json({error:'Could not save this change. Please try again.'},{status:503});}
}
