import { requireAdmin } from '@/lib/auth';
import { getContent } from '@/lib/db';
import { AdminContent } from '@/components/admin-content';
export default async function Content(){await requireAdmin();return <><div className="eyebrow">WORDS, PRICES & PHOTOS</div><h1 className="page-title">Edit your <em>website.</em></h1><AdminContent content={await getContent(true)}/></>;}
