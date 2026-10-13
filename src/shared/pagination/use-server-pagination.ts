"use client";
import { useEffect, useRef, useState } from "react";
import { loadListPage } from "./actions";
import type { Filters, ListModule, ModuleItems, PageSize, PaginatedResult } from "./contracts";
export function useServerPagination<M extends ListModule>(module: M, filters: Filters, revision: unknown, scope = '', enabled = true) {
 const inflight = useRef(new Map<string, Promise<PaginatedResult<ModuleItems[ListModule]>>>()).current;
 const key = JSON.stringify(filters);
 const [controls,setControls] = useState({key,page:1,pageSize:10 as PageSize,scope});
 const remembered = useRef(new Map<string,{page:number;pageSize:PageSize}>());
 let current = controls;
 if (current.key !== key || current.scope !== scope) {
  const saved = scope ? remembered.current.get(scope) : undefined;
  current = {key,scope,page:saved?.page ?? 1,pageSize:saved?.pageSize ?? controls.pageSize};
  setControls(current);
 }
 const [result,setResult] = useState<PaginatedResult<ModuleItems[M]> | null>(null);
 const [loading,setLoading] = useState(true);
 const [error,setError] = useState(false);
 const [retry,setRetry] = useState(0);
 const {page,pageSize} = current;
 useEffect(() => {
  let active = true;
  if (!enabled) {setLoading(false); return;}
  setLoading(true); setError(false);
  const timer = setTimeout(() => {
   const requestKey = `${module}:${key}:${page}:${pageSize}`;
   let request = inflight.get(requestKey);
   if (!request) {
    request = loadListPage(module,{page,pageSize},JSON.parse(key));
    inflight.set(requestKey,request);
    void request.finally(()=>inflight.delete(requestKey)).catch(()=>{});
   }
   request.then(data=>{
    if (!active) return;
    setResult(data as PaginatedResult<ModuleItems[M]>);

   }).catch(()=>{if(active) setError(true);}).finally(()=>{if(active) setLoading(false);});
  },250);
  return () => {active=false;clearTimeout(timer);};
 },[module,key,page,pageSize,revision,retry,enabled]);
 const setPage = (next: number) => {
  const value = Math.max(1,Math.min(result?.totalPages ?? 1,next));
  if(scope) remembered.current.set(scope,{page:value,pageSize});
  setControls(old=>({...old,page:value}));
 };
 const setPageSize = (next: number) => {
  const size = ([10,20,50,100].includes(next)?next:10) as PageSize;
  if(scope) remembered.current.set(scope,{page:1,pageSize:size});
  setControls(old=>({...old,page:1,pageSize:size}));
 };
 return {rows: loading || error ? [] : result?.items ?? [],page:result?.page ?? page,pageSize,
 pages: result?.totalPages ?? 1,total:result?.total ?? 0,loading,error,setPage,setPageSize,
 revenueTotals:result?.revenueTotals,refresh:()=>setRetry(value=>value+1)};
}
