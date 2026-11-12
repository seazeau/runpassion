"use client"
import { Copy } from 'lucide-react'

export function CopyButton({ code, className }: { code: string, className: string }) {
  return (
    <button 
      className={className} 
      onClick={() => {
        navigator.clipboard.writeText(code)
        alert('Code promo copié !')
      }}
    >
      <Copy className="w-4 h-4" />
    </button>
  )
}
