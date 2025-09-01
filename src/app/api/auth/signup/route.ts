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

    // 2. Se o cadastro foi bem-sucedido, criar customer no Asaas
    if (data.user) {
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

        // 3. Atualizar usuário com o customer_id do Asaas
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
