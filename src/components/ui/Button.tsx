'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', isLoading = false, children, disabled, ...props }, ref) => {
    
    let variantStyles = ''
    switch (variant) {
      case 'primary':
        variantStyles = 'bg-sky-500 text-white hover:bg-sky-600 shadow-sm border-b-2 border-sky-600 active:translate-y-[1px] active:border-b-0'
        break
      case 'secondary':
        variantStyles = 'bg-white border-2 border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200'
        break
      case 'danger':
        variantStyles = 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm border-b-2 border-rose-600 active:translate-y-[1px] active:border-b-0'
        break
    }

    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={`inline-flex items-center justify-center font-black rounded-xl transition-all px-4 py-2 disabled:cursor-not-allowed ${variantStyles} ${className} ${isLoading ? 'opacity-80' : ''}`}
        {...props}
      >
        {isLoading && (
          <Loader2 className="w-5 h-5 ml-2 animate-spin" />
        )}
        <span className={`inline-flex items-center gap-2 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
          {children}
        </span>
      </button>
    )
  }
)

Button.displayName = 'Button'
