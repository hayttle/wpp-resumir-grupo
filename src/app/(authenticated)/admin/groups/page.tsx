import AdminGroupsManager from '@/components/admin/AdminGroupsManager'
import ProtectedAdminRoute from '@/components/auth/ProtectedAdminRoute'

export default function AdminGroupsPage() {
  return (
    <ProtectedAdminRoute>
      <div className="bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <AdminGroupsManager />
        </div>
      </div>
    </ProtectedAdminRoute>
  )
}
