const escape=(value:string)=>value.replaceAll('\\','\\\\').replaceAll('\n','\\n').replaceAll(',','\\,').replaceAll(';','\\;').replaceAll('\r','');
const date=(value:string)=>new Date(value).toISOString().replaceAll('-','').replaceAll(':','').replace(/\.\d{3}/,'');
export function makeICS(booking:{id:string;start_at:string;end_at:string;reference:string;snapshot:{style:string}}){
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Styled by Sika//Booking//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',`UID:${booking.id}@styledbysika`,`DTSTAMP:${date(new Date().toISOString())}`,`DTSTART:${date(booking.start_at)}`,`DTEND:${date(booking.end_at)}`,`SUMMARY:${escape(`Styled by Sika · ${booking.snapshot.style}`)}`,`DESCRIPTION:${escape(`Booking ${booking.reference}. Your slot is held once the deposit is received.`)}`,'END:VEVENT','END:VCALENDAR'];
 return lines.map(line=>{let result='',bytes=0;for(const c of line){const size=new TextEncoder().encode(c).length;if(bytes+size>74){result+='\r\n ';bytes=1;}result+=c;bytes+=size;}return result;}).join('\r\n')+'\r\n';
}
