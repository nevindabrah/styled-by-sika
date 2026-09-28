import { DemoBanner } from '@/components/demo-banner';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import type { Metadata } from 'next';
import { getContent } from '@/lib/db';
import { firstName } from '@/lib/content';
export const dynamic='force-dynamic';
// Title and search description follow what she writes in her dashboard.
export async function generateMetadata():Promise<Metadata>{const {text}=await getContent(),city=text.location.split(',')[0].trim();return {title:{default:`Styled by Sika · Braiding in ${city}`,template:'%s · Styled by Sika'},description:`${text.heroServices} Braids by ${firstName(text.name)} in ${text.location}. See prices and book online.`,openGraph:{title:'Styled by Sika',description:`${text.heroServices} ${text.location}.`,type:'website'}};}
export default async function SiteLayout({children}:{children:React.ReactNode}){const content=await getContent();return <><Header content={content}/><DemoBanner/><main id="main">{children}</main><Footer content={content}/></>;}
