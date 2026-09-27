import { getContent } from '@/lib/db';
import { LandingPage } from '@/components/landing-page';
export const dynamic='force-dynamic';
export default async function Home(){return <LandingPage content={await getContent()}/>;}
