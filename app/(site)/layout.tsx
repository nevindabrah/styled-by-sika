import { DemoBanner } from '@/components/demo-banner';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
export default function SiteLayout({children}:{children:React.ReactNode}){return <><Header/><DemoBanner/><main id="main">{children}</main><Footer/></>;}
