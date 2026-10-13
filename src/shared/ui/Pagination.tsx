"use client";
import { useI18n } from "@/shared/i18n/I18nProvider";
export type PaginationState = {
 page: number; pageSize: number; pages: number; total: number;
 loading?: boolean; error?: boolean; refresh?: () => void;
 setPage: (page:number)=>void; setPageSize:(size:number)=>void;
};
export function Pagination({state}: {state:PaginationState;locale?:string}) {
 const {dictionary} = useI18n();
 const t = dictionary.pagination;
 const {page,pages,total,pageSize,setPage,setPageSize,loading,error} = state;
 const start=total?(page-1)*pageSize+1:0;
 const end=Math.min(page*pageSize,total);
 const interpolate=(template:string,values:Record<string,number>)=>template.replace(/\{(\w+)\}/g,(_,key)=>String(values[key]??''));
 return <nav aria-label={t.label} aria-busy={loading} className="courtly-pagination">
  <label>{t.pageSize}<select aria-label={t.pageSize} disabled={loading} value={pageSize} onChange={e=>setPageSize(Number(e.target.value))}>
   {[10,20,50,100].map(size=><option key={size} value={size}>{size}</option>)}
  </select></label>
  <span role="status">{loading?t.loading:error?t.error:total?interpolate(t.range,{start,end,total}):t.empty}</span>
  {error && <button type="button" onClick={state.refresh}>{t.retry}</button>}
  <div><button type="button" disabled={loading||error||page<=1} onClick={()=>setPage(page-1)}>{t.previous}</button>
   <span>{interpolate(t.page,{page,pages})}</span>
   <button type="button" disabled={loading||error||page>=pages} onClick={()=>setPage(page+1)}>{t.next}</button></div>
 </nav>;
}
