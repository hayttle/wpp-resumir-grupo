import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { AsaasService } from '@/lib/services/asaasService'

export async function POST(request: NextRequest) {
  try {
    const { email, password, userData } = await request.json()

    // Validar CPF/CNPJ obrigatório
    if (!userData.cpf_cnpj) {
      return NextResponse.json(
        { error: { message: 'CPF ou CNPJ é obrigatório para o cadastro' } },
        { status: 400 }
      )
    }

    // 1. Criar usuário no Supabase Auth usando admin
    const { error: authError, data } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: userData.name,
        phone_number: userData.phone_number,
        cpf_cnpj: userData.cpf_cnpj,
        person_type: userData.person_type
      }
    })

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 400 })
    }

    // 2. Criar registro na tabela users
    if (data.user) {
      // Verificar se é o primeiro usuário do sistema
      const { data: allUsers, error: countError } = await supabaseAdmin
        .from('users')
        .select('id')
        .limit(1)

      if (countError) {
        console.error('Erro ao verificar usuários existentes:', countError)
        return NextResponse.json({ error: { message: 'Erro interno do servidor' } }, { status: 500 })
      }

      // Se não há usuários, o primeiro será admin
      const isFirstUser = allUsers.length === 0
      const defaultRole = isFirstUser ? 'admin' : 'user'

      // Criar perfil no banco de dados
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert([
          {
            id: data.user.id,
            email: data.user.email!,
            name: userData.name,
            phone_number: userData.phone_number,
            cpf_cnpj: userData.cpf_cnpj,
            person_type: userData.person_type,
            role: defaultRole
          }
        ])

      if (insertError) {
        console.error('Erro ao criar perfil:', insertError)
        return NextResponse.json({ error: { message: 'Erro ao criar perfil do usuário' } }, { status: 500 })
      }

      console.log('✅ Usuário criado na tabela users:', data.user.id)

      // 3. Criar customer no Asaas
      try {
        console.log('🔄 Criando customer no Asaas para usuário:', data.user.id)
        
        const customerData = {
          name: userData.name,
          email: email,
          cpfCnpj: userData.cpf_cnpj,
          personType: (userData.person_type === 'company' ? 'JURIDICA' : 'FISICA') as 'FISICA' | 'JURIDICA',
          externalReference: data.user.id,
          notificationDisabled: false
        }

        const asaasCustomer = await AsaasService.createCustomer(customerData)
        console.log('✅ Customer criado no Asaas:', asaasCustomer.id)

        // 4. Atualizar usuário com o customer_id do Asaas
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({ asaas_customer_id: asaasCustomer.id })
          .eq('id', data.user.id)

        if (updateError) {
          console.error('❌ Erro ao salvar customer_id:', updateError)
          // Não falhar o cadastro se não conseguir salvar o customer_id
        } else {
          console.log('✅ Customer_id salvo no banco:', asaasCustomer.id)
        }

      } catch (asaasError) {
        console.error('❌ Erro ao criar customer no Asaas:', asaasError)
        // Não falhar o cadastro se não conseguir criar no Asaas
        // O customer pode ser criado posteriormente quando o usuário fizer a primeira assinatura
      }
    }

    return NextResponse.json({ 
      success: true, 
      user: data.user,
      message: 'Cadastro realizado com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro no cadastro:', error)
    return NextResponse.json(
      { error: { message: 'Erro interno do servidor' } },
      { status: 500 }
    )
  }
}
