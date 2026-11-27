export type ApprovedProfilePhoto={src:string;alt:string;credit:string;source:string;license:string};
// Owner-authorized or properly licensed images only. No invented photographs.
const approved:Record<string,ApprovedProfilePhoto[]>={};
export function profileMedia(id:string):ApprovedProfilePhoto[]{return (approved[id]??[]).filter(p=>p.src.startsWith('/images/')&&!p.src.includes('..')&&p.alt.trim()&&p.credit.trim()&&p.source.startsWith('https://')&&p.license.startsWith('https://'));}
