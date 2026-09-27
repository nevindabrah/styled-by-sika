import { notFound } from 'next/navigation';
import { isDemo } from '@/lib/demo';
import { DemoDashboard } from '@/components/demo-dashboard';
export const metadata={title:'Demo dashboard',robots:{index:false,follow:false}};
export default function DemoAdmin(){if(!isDemo)notFound();return <DemoDashboard/>;}
