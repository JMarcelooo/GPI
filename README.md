# 📋 GPI - Gestão de Propriedade Intelectual

Sistema web para gestão de Propriedades Intelectuais (PIs) do setor UERN Inova, controlando o ciclo completo desde o cadastro até a publicação na RPI (Revista da Propriedade Industrial), incluindo acompanhamento de pagamentos, notificações e relatórios.

## 🎯 Objetivo

O GPI foi desenvolvido para centralizar e automatizar o controle de patentes, marcas, modelos de utilidade e programas de computador da universidade. O sistema permite:

- 📝 Cadastro e acompanhamento de PIs (Propriedades Intelectuais)
- 👥 Gestão de autores e seus vínculos com as PIs
- 💰 Controle de pagamentos vinculados a processos de PI
- 📰 Monitoramento automático de publicações na RPI (INPI)
- 📊 Dashboard com indicadores e gráficos gerenciais
- 🔔 Sistema de notificações para prazos e eventos
- 🔐 Controle de acesso com papéis (administrador / usuário)
- 📄 Geração de relatórios em PDF

## 📁 Estrutura do Projeto

```
GPI/
├── Backend/                    #  API REST (Express 5 + Sequelize 6 + PostgreSQL)
│   ├── src/
│   │   ├── app.js              #  Configuração do Express (CORS, rotas, middlewares)
│   │   ├── server.js           #  Inicialização do servidor + sync do banco
│   │   ├── config/             #  Configuração do banco de dados (Sequelize)
│   │   ├── controllers/        #  Lógica de negócio (PI, Pagamento, Auth, Usuário, etc.)
│   │   ├── middlewares/        # Autenticação JWT, rate-limit
│   │   ├── models/             #  Models Sequelize (User, PI, Pagamento, Autor, etc.)
│   │   ├── routes/             #  Definição de rotas da API
│   │   ├── services/           #  Serviços (email, histórico, notificações, RPI monitor)
│   │   └── utils/              #  Utilitários (sanitização de XSS)
│   ├── scripts/                #  Scripts auxiliares (seed, migrações, importação)
│   ├── tests/                  #  Testes automatizados (Jest + Supertest)
│   └── package.json
├── Frontend/                   #  Aplicação React (CRA, React 19)
│   ├── src/
│   │   ├── App.js              #  Rotas e guards de autenticação
│   │   ├── Paginas/            #  Páginas (Dashboard, PIs, Pagamentos, Usuários, etc.)
│   │   ├── Components/         #  Componentes reutilizáveis (Sidebar, Toast, Modais)
│   │   ├── contexts/           #  AuthContext (estado de autenticação)
│   │   ├── services/           #  Cliente HTTP (axios), eventos
│   │   ├── styles/             #  Estilos globais e utilitários CSS
│   │   └── config.js           #  URL da API (REACT_APP_API_URL)
│   └── package.json
├── BD/
│   └── scriptbancodedados.sql  #  Schema SQL do PostgreSQL (fonte de verdade)
├── dev.sh                      # ▶ Script para iniciar backend + frontend
└── README.md
```

## 🛠️ Tecnologias

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express 5
- **ORM:** Sequelize 6
- **Banco:** PostgreSQL
- **Auth:** JWT (cookie httpOnly + SameSite)
- **Testes:** Jest + Supertest

### Frontend
- **Framework:** React 19 (Create React App)
- **Roteamento:** react-router-dom 7
- **HTTP:** Axios
- **Ícones:** Lucide React
- **PDF:** jsPDF

## ✅ Pré-requisitos

- Node.js 18+
- npm 9+
- PostgreSQL 14+

## 🚀 Instalação

### 1. Clonar o repositório

```bash
git clone https://github.com/JMarcelooo/GPI.git
cd GPI
```

### 2. Configurar o banco de dados

Crie o banco de dados no PostgreSQL e execute o schema:

```bash
psql -U postgres -d inova -f BD/scriptbancodedados.sql
```

### 3. Configurar o Backend

```bash
cd Backend
cp .env.example .env   # ou crie manualmente
```

Edite o `Backend/.env` seguindo o exemplo. As variáveis obrigárias são:

```
DATABASE_URL=postgres://usuario:senha@localhost:5432/inova
JWT_SECRET=cole_um_segredo_forte_aqui
```

Instale as dependências e inicie:

```bash
npm install
npm start
```

### 4. Configurar o Frontend

```bash
cd ../Frontend
npm install
npm start
```

O frontend rodará em `http://localhost:3001` (proxy automático para o backend na porta 3000).

### 5. Iniciar ambos ao mesmo tempo (opcional)

Na raiz do projeto:

```bash
chmod +x dev.sh
./dev.sh
```

Isso inicia o backend na porta 3000 e o frontend na porta 3001.

## 📖 Scripts Úteis

| Comando | Local | Descrição |
|---|---|---|
| `npm start` | Backend |  Inicia o servidor (node) |
| `npm run dev` | Backend |  Inicia com nodemon (hot reload) |
| `npm run lint` | Backend |  Verifica código com ESLint |
| `npm test` | Backend |  Roda testes Jest |
| `node scripts/seed-admin.js` | Backend |  Cria usuário admin a partir do `.env` |
| `node scripts/importar-planilha.js` | Backend |  Importa dados de planilha CSV |
| `npm start` | Frontend |  Inicia o servidor de desenvolvimento |
| `npm run build` | Frontend |  Gera build de produção |

## 🌐 API

Base URL: `http://localhost:3000/api`

### 🔓 Rotas públicas

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/login` | 🔑 Login (username ou email + senha) |
| POST | `/api/auth/ativar` | ✅ Ativar conta via token de convite |
| POST | `/api/auth/esqueci` | 📧 Solicitar código de redefinição de senha |
| POST | `/api/auth/redefinir` | 🔄 Redefinir senha com código |

### 🔐 Rotas autenticadas (cookie httpOnly)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/auth/me` | 👤 Dados do usuário logado |
| PUT | `/api/auth/me` | ✏️ Atualizar perfil (nome/username) |
| POST | `/api/auth/alterar-senha` | 🔑 Alterar própria senha |
| POST | `/api/auth/logout` | 🚪 Encerrar sessão |
| GET/POST | `/api/pi` | 📋 Listar/criar PIs |
| GET/PUT/DELETE | `/api/pi/:id` | 📝 Buscar/atualizar/deletar PI |
| GET | `/api/autores` | 👥 Listar autores |
| GET/POST | `/api/pagamentos` | 💰 Listar/criar pagamentos |
| GET | `/api/stats` | 📊 Estatísticas do dashboard |
| GET | `/api/notificacoes` | 🔔 Notificações do usuário |

### 👑 Rotas administrativas (requer role `admin`)

| Método | Rota | Descrição |
|---|---|---|
| GET/POST | `/api/usuarios` | 👥 Listar/criar usuários |
| PUT/DELETE | `/api/usuarios/:id` | ⚙️ Atualizar/deletar usuário |
| GET | `/api/historico` | 📜 Logs de auditoria |

## 🛡️ Segurança

- **🔐 Autenticação:** JWT em cookie httpOnly (não acessível via JavaScript)
- **🌍 CORS:** Origens permitidas configuradas via variável de ambiente `FRONTEND_URL`
- **🧹 XSS:** Campos string sanitizados no backend (remove tags HTML)
- **👑 Role-based:** Controle de acesso por papel (admin / usuário)
- **⏱️ Rate-limit:** Proteção contra brute-force no login
- **📜 Histórico:** Auditoria de ações sensíveis (criação, edição, exclusão de dados)

## ☁️ Deploy

- **Backend:** [Render](https://render.com) (`gpi-nmnp.onrender.com`)
- **Frontend:** [Vercel](https://vercel.com) (`gpi-two.vercel.app`)

Variáveis de ambiente (ver `Backend/.env.example` e `Frontend/.env.example`):

#### Backend — Obrigatórias

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | URL de conexão com o PostgreSQL |
| `JWT_SECRET` | Segredo para assinatura dos tokens JWT |

#### Backend — Opcionais

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3000` | Porta do servidor |
| `NODE_ENV` | `development` | `production` em deploy |
| `DATABASE_SSL` | `false` | Força SSL (Render, Heroku, etc.) |
| `FRONTEND_URL` | `localhost:3001` | Origens CORS (separadas por vírgula) |

#### Backend — E-mail (pelo menos um para envio real)

| Variável | Descrição |
|---|---|
| `RESEND_API_KEY` | API key do Resend (**prioritário**) |
| `RESEND_FROM` | Remetente do Resend |
| `SMTP_URL` | URL completa do SMTP (alternativa a `SMTP_HOST`) |
| `SMTP_HOST` | Hostname do SMTP |
| `SMTP_PORT` | Porta SMTP (padrão: `587`) |
| `SMTP_SECURE` | TLS (`true`/`false`, padrão: `false`) |
| `SMTP_USER` | Usuário SMTP |
| `SMTP_PASS` | Senha SMTP |
| `SMTP_FROM` | Remetente SMTP (padrão: `no-reply@uern-inova.local`) |

> Se nenhum serviço de e-mail estiver configurado, os e-mails são impressos no log do console (mock).

#### Backend — Scripts auxiliares

| Variável | Usado por | Descrição |
|---|---|---|
| `ADMIN_NOME` | `seed-admin.js` | Nome do admin inicial |
| `ADMIN_EMAIL` | `seed-admin.js` | Email do admin inicial |
| `ADMIN_SENHA` | `seed-admin.js` | Senha do admin inicial |
| `ADMIN_USERNAME` | `seed-admin.js` | Username do admin (opcional) |
| `PLANILHA_PATH` | `importar-planilha.js` | Caminho do CSV (opcional) |

#### Frontend

| Variável | Descrição |
|---|---|
| `REACT_APP_API_URL` | URL do backend (vazio em dev via proxy; obrigatório em produção/Vercel) |

## 📄 Licença

Projeto interno da UERN — uso acadêmico.
