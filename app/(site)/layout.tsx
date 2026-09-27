import { DemoBanner } from '@/components/demo-banner';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getContent } from '@/lib/db';
export const dynamic='force-dynamic';
export default async function SiteLayout({children}:{children:React.ReactNode}){const content=await getContent();return <><Header content={content}/><DemoBanner/><main id="main">{children}</main><Footer content={content}/></>;}
