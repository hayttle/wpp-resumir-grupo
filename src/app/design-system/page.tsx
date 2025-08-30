'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"

export default function DesignSystemPage() {
  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    if (value.length < 3) {
      setInputError('Nome deve ter pelo menos 3 caracteres')
    } else {
      setInputError('')
    }
  }

  const handleButtonClick = (variant: string) => {
    // Botão clicado: ${variant}
  }

  return (
    <div className="min-h-screen bg-whatsapp-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <div className="w-20 h-20 bg-whatsapp-primary rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl">🎨</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-whatsapp-text mb-4">
            Design System
          </h1>
          <p className="text-xl text-whatsapp-text-secondary max-w-3xl mx-auto">
            Sistema de design completo para o projeto WhatsApp Resumir Grupo
          </p>
        </div>

        {/* Paleta de Cores */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-whatsapp-text mb-8">🎨 Paleta de Cores do WhatsApp</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Cores Principais */}
            <Card className="border-whatsapp-background shadow-lg">
              <CardHeader className="bg-whatsapp-primary text-white rounded-t-lg">
                <CardTitle className="text-white">Cores Principais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded bg-whatsapp-primary border-2 border-gray-200"></div>
                  <span className="text-sm text-whatsapp-text">Primary: #25D366</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded bg-whatsapp-primary-dark border-2 border-gray-200"></div>
                  <span className="text-sm text-whatsapp-text">Primary Dark: #128C7E</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded bg-whatsapp-background border-2 border-gray-200"></div>
                  <span className="text-sm text-whatsapp-text">Background: #ECE5DD</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded bg-whatsapp-text border-2 border-gray-200"></div>
                  <span className="text-sm text-whatsapp-text">Text: #111B21</span>
                </div>
              </CardContent>
            </Card>

            {/* Cores de Estado */}
            <Card className="border-whatsapp-background shadow-lg">
              <CardHeader className="bg-whatsapp-primary-dark text-white rounded-t-lg">
                <CardTitle className="text-white">Cores de Estado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded bg-green-500 border-2 border-gray-200"></div>
                  <span className="text-sm text-whatsapp-text">Sucesso: #10B981</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded bg-yellow-500 border-2 border-gray-200"></div>
                  <span className="text-sm text-whatsapp-text">Aviso: #F59E0B</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded bg-destructive border-2 border-gray-200"></div>
                  <span className="text-sm text-whatsapp-text">Erro: #EF4444</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded bg-blue-500 border-2 border-gray-200"></div>
                  <span className="text-sm text-whatsapp-text">Info: #3B82F6</span>
                </div>
              </CardContent>
            </Card>

            {/* Tipografia */}
            <Card className="border-whatsapp-background shadow-lg">
              <CardHeader className="bg-whatsapp-text text-white rounded-t-lg">
                <CardTitle className="text-white">Tipografia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-6">
                <h1 className="text-2xl font-bold text-whatsapp-text">H1 - Título Principal</h1>
                <h2 className="text-xl font-bold text-whatsapp-text">H2 - Subtítulo</h2>
                <h3 className="text-lg font-semibold text-whatsapp-text">H3 - Seção</h3>
                <p className="text-base text-whatsapp-text">Texto padrão</p>
                <p className="text-sm text-whatsapp-text-secondary">Texto secundário</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Componentes */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-whatsapp-text mb-8">🧩 Componentes</h2>

          {/* Botões */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-whatsapp-text mb-6">Botões</h3>

            {/* Variantes */}
            <div className="mb-8">
              <h4 className="text-xl font-semibold text-whatsapp-text mb-4">Variantes</h4>
              <div className="flex flex-wrap gap-4">
                <Button variant="default" onClick={() => handleButtonClick('default')}>
                  Default
                </Button>
                <Button variant="secondary" onClick={() => handleButtonClick('secondary')}>
                  Secondary
                </Button>
                <Button variant="outline" onClick={() => handleButtonClick('outline')}>
                  Outline
                </Button>
                <Button variant="ghost" onClick={() => handleButtonClick('ghost')}>
                  Ghost
                </Button>
                <Button variant="destructive" onClick={() => handleButtonClick('destructive')}>
                  Destructive
                </Button>
                <Button variant="link" onClick={() => handleButtonClick('link')}>
                  Link
                </Button>
              </div>
            </div>

            {/* Tamanhos */}
            <div className="mb-8">
              <h4 className="text-xl font-semibold text-whatsapp-text mb-4">Tamanhos</h4>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="default" size="sm" onClick={() => handleButtonClick('small')}>
                  Small
                </Button>
                <Button variant="default" size="default" onClick={() => handleButtonClick('medium')}>
                  Medium
                </Button>
                <Button variant="default" size="lg" onClick={() => handleButtonClick('large')}>
                  Large
                </Button>
              </div>
            </div>

            {/* Estados */}
            <div>
              <h4 className="text-xl font-semibold text-whatsapp-text mb-4">Estados</h4>
              <div className="flex flex-wrap gap-4">
                <Button variant="default" onClick={() => handleButtonClick('normal')}>
                  Normal
                </Button>
                <Button variant="default" disabled onClick={() => handleButtonClick('disabled')}>
                  Disabled
                </Button>
              </div>
            </div>
          </div>

          {/* Inputs */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-whatsapp-text mb-6">Campos de Entrada</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xl font-semibold text-whatsapp-text mb-4">Estados</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-whatsapp-text mb-2">Nome</label>
                    <Input
                      placeholder="Digite seu nome"
                      value={inputValue}
                      onChange={handleInputChange}
                      className={inputError ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    {inputError && (
                      <p className="text-sm text-destructive mt-1">{inputError}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-whatsapp-text mb-2">Email</label>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-whatsapp-text mb-2">Telefone</label>
                    <Input
                      type="tel"
                      placeholder="(11) 99999-9999"
                      disabled
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xl font-semibold text-whatsapp-text mb-4">Tipos</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-whatsapp-text mb-2">Senha</label>
                    <Input
                      type="password"
                      placeholder="Digite sua senha"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-whatsapp-text mb-2">Número</label>
                    <Input
                      type="number"
                      placeholder="Digite um número"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-whatsapp-text mb-2">Data</label>
                    <Input
                      type="date"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-whatsapp-text mb-6">Cards</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-whatsapp-background shadow-lg">
                <CardHeader className="bg-whatsapp-primary text-white rounded-t-lg">
                  <CardTitle className="text-white">Card Simples</CardTitle>
                  <CardDescription className="text-whatsapp-white">Card com header e conteúdo</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-sm text-whatsapp-text-secondary">
                    Este é um exemplo de card usando os componentes do shadcn/ui
                  </p>
                </CardContent>
              </Card>

              <Card className="border-whatsapp-background shadow-lg">
                <CardHeader className="bg-whatsapp-primary-dark text-white rounded-t-lg">
                  <CardTitle className="text-white">Card com Footer</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-sm text-whatsapp-text-secondary">
                    Card com conteúdo personalizado
                  </p>
                </CardContent>
                <CardContent className="pt-0">
                  <Button variant="outline" size="sm" className="w-full">
                    Ação
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-whatsapp-background shadow-lg">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-whatsapp-primary rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-white font-bold">!</span>
                    </div>
                    <h4 className="text-lg font-semibold text-whatsapp-text mb-2">
                      Card Centralizado
                    </h4>
                    <p className="text-sm text-whatsapp-text-secondary">
                      Conteúdo centralizado sem header
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Layout e Grid */}
          <div>
            <h3 className="text-2xl font-bold text-whatsapp-text mb-6">Layout e Grid</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((item) => (
                <Card key={item} className="text-center border-whatsapp-background shadow-lg">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 bg-whatsapp-primary rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-white font-bold">{item}</span>
                    </div>
                    <h4 className="text-lg font-semibold text-whatsapp-text mb-2">
                      Item {item}
                    </h4>
                    <p className="text-sm text-whatsapp-text-secondary">
                      Grid responsivo que se adapta ao tamanho da tela
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Responsividade */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-whatsapp-text mb-8">📱 Responsividade</h2>

          <Card className="border-whatsapp-background shadow-lg">
            <CardHeader className="bg-whatsapp-text text-white rounded-t-lg">
              <CardTitle className="text-white">Breakpoints</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-center">
                <div className="p-3 bg-whatsapp-primary text-white rounded">
                  <div className="text-sm font-bold">sm</div>
                  <div className="text-xs">≥640px</div>
                </div>
                <div className="p-3 bg-whatsapp-primary-dark text-white rounded">
                  <div className="text-sm font-bold">md</div>
                  <div className="text-xs">≥768px</div>
                </div>
                <div className="p-3 bg-whatsapp-primary text-white rounded">
                  <div className="text-sm font-bold">lg</div>
                  <div className="text-xs">≥1024px</div>
                </div>
                <div className="p-3 bg-whatsapp-primary-dark text-white rounded">
                  <div className="text-sm font-bold">xl</div>
                  <div className="text-xs">≥1280px</div>
                </div>
                <div className="p-3 bg-whatsapp-primary text-white rounded">
                  <div className="text-sm font-bold">2xl</div>
                  <div className="text-xs">≥1536px</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-whatsapp-background">
          <p className="text-whatsapp-text-secondary">
            🎨 Design System - WhatsApp Resumir Grupo
          </p>
          <p className="text-sm text-whatsapp-text-secondary mt-2">
            Todos os componentes seguem os padrões estabelecidos para manter a consistência visual
          </p>
        </footer>
      </div>
    </div>
  )
}
