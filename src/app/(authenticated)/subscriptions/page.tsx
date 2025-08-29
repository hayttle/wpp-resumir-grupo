import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Check, Star } from 'lucide-react'

export default function SubscriptionsPage() {
  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Assinaturas e Planos
            </h1>
            <p className="text-gray-600">
              Gerencie seu plano atual e explore opções de upgrade
            </p>
          </div>

          {/* Plano Atual */}
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <Star className="h-5 w-5" />
                Plano Atual: Básico
              </CardTitle>
              <CardDescription className="text-green-700">
                Seu plano atual está ativo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-800">R$ 29,90</p>
                  <p className="text-green-700">por mês</p>
                  <p className="text-sm text-green-600 mt-2">
                    Próxima cobrança: 15 de Janeiro de 2025
                  </p>
                </div>
                <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-100">
                  Gerenciar Assinatura
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recursos do Plano */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Recursos do Seu Plano</CardTitle>
              <CardDescription>
                O que está incluído no seu plano Básico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Até 1 grupo monitorado</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Resumos diários automáticos</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Suporte por email</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Histórico de 30 dias</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Planos Disponíveis */}
          <Card>
            <CardHeader>
              <CardTitle>Planos Disponíveis</CardTitle>
              <CardDescription>
                Explore opções para expandir suas funcionalidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Plano Pro */}
                <Card className="border-2 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-blue-800">Plano Pro</CardTitle>
                    <CardDescription>Para usuários avançados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-800 mb-4">R$ 59,90</div>
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Até 5 grupos monitorados</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Resumos personalizados</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Suporte prioritário</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Histórico de 90 dias</span>
                      </div>
                    </div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Fazer Upgrade
                    </Button>
                  </CardContent>
                </Card>

                {/* Plano Enterprise */}
                <Card className="border-2 border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-purple-800">Plano Enterprise</CardTitle>
                    <CardDescription>Para empresas e equipes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-800 mb-4">R$ 199,90</div>
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Grupos ilimitados</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>API personalizada</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Suporte 24/7</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Histórico ilimitado</span>
                      </div>
                    </div>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Fazer Upgrade
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
