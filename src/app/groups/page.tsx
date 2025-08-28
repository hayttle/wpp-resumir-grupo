'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Navigation } from '@/components/layout/Navigation'
import GroupManager from '@/components/groups/GroupManager'

export default function GroupsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-whatsapp-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <GroupManager />
        </div>
      </div>
    </ProtectedRoute>
  )
}
