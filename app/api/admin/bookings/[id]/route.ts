import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { processJob } from '@/lib/jobs';
export const maxDuration=60;
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!await isAdmin())return NextResponse.json({error:'Please sign in.'},{status:401});
 if(request.headers.get('origin')!==new URL(request.url).origin)return NextResponse.json({error:'Request not allowed.'},{status:403});
 try{const {id}=await params;if(!z.uuid().safeParse(id).success)return NextResponse.json({error:'Invalid booking.'},{status:400});const parsed=z.object({status:z.enum(['confirmed','completed','no_show','cancelled']).optional(),note:z.string().max(3000).optional(),reason:z.string().max(500).optional()}).refine(v=>v.status||v.note!==undefined).safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:'Please check the update.'},{status:400});
 const {error}=await db().rpc('admin_update_booking',{target:id,new_status:parsed.data.status??null,note:parsed.data.note??null,cancel_reason:parsed.data.reason??null});if(error)return NextResponse.json({error:'This appointment has changed. Refresh and try again.'},{status:409});
 if(['confirmed','cancelled'].includes(parsed.data.status??''))await processJob(id);
 const {data}=await db().from('booking_jobs').select('id').eq('booking_id',id).is('completed_at',null);
 return NextResponse.json({ok:true,pending:!!data?.length});
 }catch{return NextResponse.json({error:'Could not save this update. Please try again.'},{status:503});}
}
