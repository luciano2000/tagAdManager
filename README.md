# Documentação da Aplicação Google AdManager

## Visão Geral

Esta aplicação web foi desenvolvida para otimizar o uso do Google AdManager por publishers e sites de notícias. A solução implementa uma integração eficiente com a API do Google AdManager, permitindo a configuração dinâmica de banners publicitários que se adaptam automaticamente a diferentes resoluções de tela.

## Características Principais

- **Detecção Automática de Espaços Publicitários**: A aplicação identifica automaticamente todas as divs com a classe `pubad` no DOM.
- **Configuração Dinâmica via Atributos de Dados**: O tamanho e comportamento dos banners são definidos pelo atributo `data-pos`.
- **Responsividade Completa**: Os banners se adaptam automaticamente a diferentes tamanhos de tela.
- **Carregamento Assíncrono**: O script do Google AdManager é carregado de forma assíncrona para não bloquear o carregamento da página.
- **Atualização Dinâmica**: Os anúncios são atualizados automaticamente quando a janela é redimensionada.
- **Observação de Mudanças no DOM**: Novos espaços de anúncios adicionados dinamicamente são detectados e configurados automaticamente.

## Como Usar

### 1. Configuração Básica

Para utilizar a aplicação, você precisa envolver sua aplicação com o componente `AdManagerProvider` e definir os parâmetros de rede:

```jsx
import { AdManagerProvider } from './components/AdComponents';

function App() {
  return (
    <AdManagerProvider 
      networkCode="123456789" // Seu código de rede do Google AdManager
      adUnitPath="/seu-site/secao" // Caminho da unidade de anúncio
    >
      {/* Conteúdo da sua aplicação */}
    </AdManagerProvider>
  );
}
```

### 2. Inserção de Anúncios

Para inserir um espaço de anúncio em qualquer lugar da sua aplicação, use o componente `AdContainer`:

```jsx
import { AdContainer } from './components/AdComponents';

function MinhaSecao() {
  return (
    <div>
      <h2>Título da Seção</h2>
      <p>Conteúdo da seção...</p>
      
      {/* Inserir um anúncio */}
      <AdContainer position="topo" />
      
      <p>Mais conteúdo...</p>
    </div>
  );
}
```

Alternativamente, você pode criar manualmente divs com a classe `pubad` e o atributo `data-pos`:

```html
<div class="pubad" data-pos="lateral"></div>
```

### 3. Posições Disponíveis

A aplicação vem pré-configurada com as seguintes posições:

- **topo**: Banners no topo da página (320x50, 320x100, 728x90, 970x90, 970x250)
- **lateral**: Banners laterais (300x250, 300x600)
- **rodape**: Banners no rodapé (320x50, 728x90)
- **inread**: Banners dentro do conteúdo (300x250, 640x360)
- **default**: Posição padrão para qualquer outro caso (300x250)

### 4. Personalização

Você pode personalizar as configurações de tamanho e posição editando o arquivo `adManager.ts` na pasta `src/lib/`. As configurações de rede também podem ser ajustadas neste arquivo.

## Estrutura do Projeto

- **src/lib/adManager.ts**: Classe principal que gerencia a integração com o Google AdManager.
- **src/components/AdComponents.tsx**: Componentes React para facilitar a inserção de anúncios.
- **src/App.tsx**: Exemplo de implementação da aplicação.
- **src/App.css**: Estilos para a aplicação de demonstração.

## Requisitos Técnicos

- React 18+
- TypeScript 4.9+
- Navegadores modernos com suporte a ES6

## Otimizações Implementadas

1. **Carregamento Assíncrono**: O script do GPT é carregado de forma assíncrona para não bloquear o carregamento da página.
2. **Single Request Architecture (SRA)**: Todos os anúncios são solicitados em uma única requisição para melhorar a performance.
3. **Lazy Loading**: Os anúncios são carregados apenas quando necessário.
4. **Responsive Design**: Os tamanhos dos anúncios se adaptam automaticamente à resolução da tela.
5. **Collapse Empty Divs**: Espaços vazios são colapsados automaticamente quando não há anúncios disponíveis.

## Considerações de Performance

- A aplicação utiliza debounce no evento de redimensionamento para evitar múltiplas atualizações durante o redimensionamento da janela.
- O MutationObserver é utilizado para detectar novos espaços de anúncios sem a necessidade de polling.
- A detecção de tamanho de viewport é otimizada para minimizar recálculos.
