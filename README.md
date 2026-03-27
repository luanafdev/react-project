# FlexVistorias

Aplicação web de gestão empresarial desenvolvida com React e Vite, projetada para gerenciar vendas, clientes, serviços, agendamentos, recursos humanos e operações financeiras.

## Funcionalidades

- **Dashboard** — Visão geral das principais métricas e atividades do negócio
- **Vendas** — Gerenciamento e acompanhamento de vendas e novos lançamentos
- **Clientes** — Cadastro e gestão de clientes
- **Serviços** — Gestão do catálogo de serviços
- **Agendamentos** — Controle de agendamentos e compromissos
- **Categorias** — Organização de serviços e produtos por categoria
- **Contas a Pagar e Receber** — Acompanhamento de entradas e saídas financeiras
- **Recursos Humanos** — Gestão de colaboradores
- **Férias e Gozos** — Controle de folgas e férias dos funcionários
- **Relatórios** — Geração e exportação de relatórios (PDF e Excel)
- **Usuários** — Controle administrativo dos usuários do sistema
- **Autenticação** — Login seguro via Supabase Auth

## Tecnologias Utilizadas

| Camada | Tecnologia |
|---|---|
| Framework Frontend | React 18 |
| Build Tool | Vite 4 |
| Estilização | Tailwind CSS |
| Componentes UI | Radix UI |
| Ícones | Lucide React |
| Animações | Framer Motion |
| Backend / Auth | Supabase |
| Gráficos | Recharts |
| Exportação PDF | jsPDF + jspdf-autotable |
| Exportação Excel | XLSX |
| Runtime | Node.js 20 |

## Como Começar

### Pré-requisitos

- Node.js 20+
- npm

### Instalação

```bash
# Acesse o diretório do projeto
cd flexvistorias

# Instale as dependências
npm install
```

### Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5000`.

### Build de Produção

```bash
npm run build
```

Os arquivos gerados estarão na pasta `dist/`.

### Visualizar Build de Produção

```bash
npm run preview
```

## Estrutura do Projeto

```
flexvistorias/
├── public/               # Arquivos estáticos
├── src/
│   ├── components/       # Componentes React
│   │   ├── ui/           # Componentes base (Button, Dialog, Input, etc.)
│   │   ├── Dashboard.jsx
│   │   ├── Sales.jsx
│   │   ├── Clients.jsx
│   │   ├── Services.jsx
│   │   ├── Schedulings.jsx
│   │   ├── Reports.jsx
│   │   ├── HumanResources.jsx
│   │   ├── AccountsPayable.jsx
│   │   ├── AccountsReceivable.jsx
│   │   ├── Users.jsx
│   │   └── ...
│   ├── contexts/         # Contextos React (Autenticação)
│   ├── lib/              # Cliente Supabase e utilitários
│   ├── App.jsx           # Componente raiz e roteamento
│   ├── main.jsx          # Ponto de entrada da aplicação
│   └── index.css         # Estilos globais
├── plugins/              # Plugins personalizados do Vite
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## Variáveis de Ambiente

Este projeto utiliza o Supabase para autenticação e armazenamento de dados. É necessário configurar as seguintes variáveis:

- `SUPABASE_URL` — URL do seu projeto no Supabase
- `SUPABASE_ANON_KEY` — Chave anônima do seu projeto no Supabase

## Licença

Privado — Todos os direitos reservados.
