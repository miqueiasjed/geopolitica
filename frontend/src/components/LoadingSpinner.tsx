interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
}

export function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
  return (
    <span
      aria-label="Carregando"
      className={`inline-block animate-spin rounded-full border-[#C9B882]/20 border-t-[#C9B882] ${sizeClasses[size]}`}
    />
  )
}
