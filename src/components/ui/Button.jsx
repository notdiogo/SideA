import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Slot } from '@radix-ui/react-slot'
import { motion } from 'framer-motion'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:pointer-events-none disabled:opacity-50 rounded-[var(--radius-md)]',
  {
    variants: {
      variant: {
        default: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90',
        destructive: 'bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] hover:opacity-90',
        outline: 'border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-secondary)]',
        ghost: 'hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]',
        link: 'underline-offset-4 hover:underline text-[var(--color-primary)]',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : 'button'
  return (
    <motion.div whileTap={{ scale: 0.96 }} style={{ display: 'contents' }}>
      <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
    </motion.div>
  )
}
