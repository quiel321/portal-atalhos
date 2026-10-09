'use client';
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
interface Props {title:string;children:ReactNode;className?:string;defaultOpen?:boolean;onOpenChange?:(open:boolean)=>void}
export default function AdminCollapse({title,children,className='',defaultOpen=false,onOpenChange}:Props){
  return <details className={`admin-card admin-collapse ${className}`} open={defaultOpen} onToggle={event=>onOpenChange?.(event.currentTarget.open)}><summary><span>{title}</span><ChevronDown size={18} aria-hidden="true"/></summary><div className="admin-collapse-content">{children}</div></details>;
}
