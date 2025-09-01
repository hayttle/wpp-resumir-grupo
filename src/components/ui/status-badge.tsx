import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

interface StatusBadgeProps {
  status: string
  variant?: 'subscription' | 'payment'
  className?: string
}

export function StatusBadge({ status, variant = 'subscription', className = '' }: StatusBadgeProps) {
  if (variant === 'subscription') {
    return <SubscriptionStatusBadge status={status} className={className} />
  }

  if (variant === 'payment') {
    return <PaymentStatusBadge status={status} className={className} />
  }

  return null
}

function SubscriptionStatusBadge({ status, className }: { status: string; className?: string }) {
  const statusConfig = {
    active: {
      label: 'Ativa',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: <CheckCircle className="h-3 w-3 mr-1" />
    },
    inactive: {
      label: 'Inativa',
      color: 'bg-gray-100 text-gray-800',
      icon: <Clock className="h-3 w-3 mr-1" />
    },
    overdue: {
      label: 'Vencida',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: <AlertTriangle className="h-3 w-3 mr-1" />
    },
    cancelled: {
      label: 'Cancelada',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: <XCircle className="h-3 w-3 mr-1" />
    }
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive

  return (
    <Badge className={`${config.color} ${className}`}>
      {config.icon}
      {config.label}
    </Badge>
  )
}

function PaymentStatusBadge({ status, className }: { status: string; className?: string }) {
  const statusConfig = {
    PENDING: {
      label: 'Pendente',
      color: 'bg-yellow-100 text-yellow-800'
    },
    CONFIRMED: {
      label: 'Confirmado',
      color: 'bg-blue-100 text-blue-800'
    },
    RECEIVED: {
      label: 'Recebido',
      color: 'bg-green-100 text-green-800'
    },
    OVERDUE: {
      label: 'Vencido',
      color: 'bg-red-100 text-red-800'
    },
    CANCELLED: {
      label: 'Cancelado',
      color: 'bg-gray-100 text-gray-800'
    },
    REFUNDED: {
      label: 'Reembolsado',
      color: 'bg-orange-100 text-orange-800'
    }
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING

  return (
    <Badge className={`${config.color} ${className}`}>
      {config.label}
    </Badge>
  )
}
