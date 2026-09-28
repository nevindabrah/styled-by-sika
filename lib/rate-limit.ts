import 'server-only';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { createHash } from 'node:crypto';
// Without Upstash, limits are kept in memory per server instance: enough to stop a casual flood on a single-braider site.
const memory = new Map<string, number[]>();
export async function rateLimit(request:Request,kind:string,limit=5){
 const ip=request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()??request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()??'local';
 const key=`${kind}:${createHash('sha256').update(ip).digest('hex')}`;
 if(process.env.UPSTASH_REDIS_REST_URL&&process.env.UPSTASH_REDIS_REST_TOKEN){
  const limiter=new Ratelimit({redis:Redis.fromEnv(),limiter:Ratelimit.slidingWindow(limit,'1 h'),prefix:'styled-by-sika'});
  return (await limiter.limit(key)).success;
 }
 const now=Date.now(),recent=(memory.get(key)??[]).filter(t=>now-t<3600000);
 if(recent.length>=limit){memory.set(key,recent);return false;}
 recent.push(now);memory.set(key,recent);
 if(memory.size>5000)for(const [k,v] of memory)if(!v.some(t=>now-t<3600000))memory.delete(k);
 return true;
}
