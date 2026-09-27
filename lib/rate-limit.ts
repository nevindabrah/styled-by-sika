import 'server-only';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { createHash } from 'node:crypto';
export async function rateLimit(request:Request,kind:string,limit=5){
 if(!process.env.UPSTASH_REDIS_REST_URL||!process.env.UPSTASH_REDIS_REST_TOKEN)throw new Error('Request protection is not configured.');
 const ip=request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()??'local';
 const limiter=new Ratelimit({redis:Redis.fromEnv(),limiter:Ratelimit.slidingWindow(limit,'1 h'),prefix:`styled-by-sika:${kind}`});
 return (await limiter.limit(createHash('sha256').update(ip).digest('hex'))).success;
}
