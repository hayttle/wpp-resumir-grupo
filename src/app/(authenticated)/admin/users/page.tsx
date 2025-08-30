import AdminUsersManager from '@/components/admin/AdminUsersManager'
import ProtectedAdminRoute from '@/components/auth/ProtectedAdminRoute'

export default function AdminUsersPage() {
  return (
    <ProtectedAdminRoute>
      <div className="bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <AdminUsersManager />
        </div>
      </div>
    </ProtectedAdminRoute>
  )
}
