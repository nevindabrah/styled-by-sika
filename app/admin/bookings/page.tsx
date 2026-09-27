import { getBookings } from '@/lib/admin';
import { AdminBookings } from '@/components/admin-bookings';
export default async function Bookings(){return <><div className="eyebrow">YOUR BUSINESS, AT A GLANCE</div><h1 className="page-title">Your <em>bookings.</em></h1><AdminBookings bookings={await getBookings()}/></>;}
