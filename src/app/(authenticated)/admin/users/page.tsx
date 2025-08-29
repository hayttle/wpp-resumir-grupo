import AdminUsersManager from '@/components/admin/AdminUsersManager'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default async function AdminUsersPage() {
  // Verificar se o usuário está autenticado
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Verificar se o usuário é admin
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <AdminUsersManager />
      </div>
    </div>
  )
}
