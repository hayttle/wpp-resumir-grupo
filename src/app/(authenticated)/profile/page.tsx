import ProfileForm from '@/components/profile/ProfileForm'

export default function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-600 mt-2">
          Atualize suas informações pessoais e configurações da conta
        </p>
      </div>
      
      <ProfileForm />
    </div>
  )
}
