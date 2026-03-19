# Brain Agro

API REST para gerenciamento de produtores rurais, fazendas e culturas agrícolas. Construída com NestJS, TypeORM e PostgreSQL.

## Sumário

- [Arquitetura](#arquitetura)
- [Modelo de dados](#modelo-de-dados)
- [Fluxo de vinculação](#fluxo-de-vinculação)
- [Início rápido](#início-rápido)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Rodando sem autenticação](#rodando-sem-autenticação)
- [Endpoints](#endpoints)
- [Paginação](#paginação)
- [Documentação interativa](#documentação-interativa)
- [Desenvolvimento local](#desenvolvimento-local)
- [Migrations](#migrations)

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        NestJS App                           │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Producers │  │  Farms   │  │  Crops   │  │   Auth   │   │
│  │ module   │  │  module  │  │  module  │  │  module  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
│  Global: CognitoAuthGuard · ThrottlerGuard · ErrorFilter    │
│  Logging: nestjs-pino (pino-http) with async context        │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
   ┌──────▼──────┐              ┌───────▼──────┐
   │  PostgreSQL  │              │  AWS Cognito │
   │  (TypeORM)  │              │  (JWT auth)  │
   └─────────────┘              └──────────────┘
```

---

## Modelo de dados

```
producers
  id · cpfCnpj · name · created_at · updated_at
      │ (1:N cascade delete)
      ▼
  farms
    id · name · city · state · totalArea · arableArea · vegetationArea
    producerId (FK nullable) · created_at · updated_at
        │ (1:N cascade delete)
        ▼
      crops
        id · season · culture
        farmId (FK nullable) · created_at · updated_at

users
  id · email · name · cognitoId · created_at · updated_at
```

---

## Fluxo de vinculação

Crops e farms podem existir sem vínculo. A vinculação acontece em etapas independentes:

```
1. Criar crop (sem farm)     →  aparece em GET /crops/unassigned
2. Criar farm (sem producer) →  aparece em GET /farms/unassigned
3. Vincular farm → crop:     PATCH /crops/:id  { "farmId": 1 }
4. Vincular producer → farm: PATCH /farms/:id  { "producerId": 1 }

Ou tudo de uma vez:
POST /producers/full  →  cria producer + farms + crops aninhados
```

O delete é sempre em cascata a partir do pai:
- Deletar **producer** → deleta suas farms → deleta as crops dessas farms
- Deletar **farm** → deleta suas crops
- Deletar **crop** → apenas a crop

---

## Início rápido

**Pré-requisitos:** Docker e Docker Compose instalados.

```bash
# 1. Clone e entre no projeto
git clone <repo-url>
cd brain-agro

# 2. Configure as variáveis de ambiente
cp .env.example .env
```

Para rodar sem autenticação (recomendado para avaliação), o `.env` não precisa de nenhuma alteração — as variáveis de banco já são injetadas pelo `docker-compose.yml` e `AUTH_ENABLED` vazio desativa o Cognito automaticamente.

```bash
# 3. Suba tudo
docker compose up
```

O container da API aguarda o banco estar saudável antes de iniciar. Quando os logs exibirem `Application is running on port 3002`, a API está pronta.

A API estará disponível em `http://localhost:3002`.
As migrations rodam automaticamente na inicialização (`NODE_ENV=production` já configurado pelo docker-compose).

---

## Variáveis de ambiente

| Variável | Descrição | Obrigatório | Exemplo |
|---|---|---|---|
| `PORT` | Porta da API | Não (padrão: `3002`) | `3002` |
| `AUTH_ENABLED` | Habilita autenticação JWT via Cognito. Qualquer valor diferente de `"true"` desativa. | Não | `true` |
| `SWAGGER_PASSWORD` | Senha básica para proteger o Swagger UI | Não | `admin123` |
| `DB_HOST` | Host do PostgreSQL | Sim (local) | `localhost` |
| `DB_PORT` | Porta do PostgreSQL | Sim (local) | `5432` |
| `DB_USERNAME` | Usuário do banco | Sim (local) | `postgres` |
| `DB_PASSWORD` | Senha do banco | Sim (local) | `postgres` |
| `DB_NAME` | Nome do banco | Sim (local) | `brain_agro` |
| `TEST_DB_NAME` | Banco usado nos testes de integração | Não (padrão: `brain_agro_test`) | `brain_agro_test` |
| `AWS_REGION` | Região AWS do Cognito | Apenas se `AUTH_ENABLED=true` | `us-east-1` |
| `COGNITO_USER_POOL_ID` | ID do User Pool | Apenas se `AUTH_ENABLED=true` | `us-east-1_xxxxxxx` |
| `COGNITO_CLIENT_ID` | Client ID do Cognito | Apenas se `AUTH_ENABLED=true` | `xxxxxxxxxx` |
| `COGNITO_CLIENT_SECRET` | Client Secret do Cognito | Apenas se `AUTH_ENABLED=true` | `xxxxxxxxxx` |
| `AWS_ACCESS_KEY_ID_COGNITO` | Access Key AWS | Apenas se `AUTH_ENABLED=true` | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY_COGNITO` | Secret Key AWS | Apenas se `AUTH_ENABLED=true` | `...` |

> **Ao usar `docker compose up`**, as variáveis `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` e `NODE_ENV` são injetadas automaticamente pelo `docker-compose.yml` — não é necessário defini-las no `.env`.

---

## Rodando sem autenticação

Por padrão (quando `AUTH_ENABLED` não está definido ou não é `"true"`), a API sobe sem validação de JWT e todos os endpoints ficam públicos — nenhuma alteração de código necessária.

```env
# .env — desenvolvimento local sem Cognito (padrão do .env.example)
AUTH_ENABLED=          # vazio = auth desativado
```

Para produção com autenticação, basta ativar e preencher as variáveis do Cognito:

```env
# .env — produção com Cognito
AUTH_ENABLED=true
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_xxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxx
COGNITO_CLIENT_SECRET=xxxxxxxxxx
AWS_ACCESS_KEY_ID_COGNITO=AKIA...
AWS_SECRET_ACCESS_KEY_COGNITO=...
```

---

## Endpoints

### Auth (público)

| Método | Path | Descrição |
|---|---|---|
| `POST` | `/auth/register` | Cadastra usuário no Cognito e no banco |
| `POST` | `/auth/confirm` | Confirma e-mail com código enviado |
| `POST` | `/auth/login` | Login — retorna `accessToken`, `idToken`, `refreshToken` |
| `POST` | `/auth/forgot-password` | Inicia fluxo de recuperação de senha |
| `POST` | `/auth/reset-password` | Define nova senha com código recebido |

### Producers

| Método | Path | Descrição |
|---|---|---|
| `POST` | `/producers` | Cria produtor (CPF/CNPJ + nome) |
| `POST` | `/producers/full` | Cria produtor com farms e crops aninhados |
| `GET` | `/producers` | Lista produtores (paginação offset) |
| `GET` | `/producers/:id` | Busca produtor por ID |
| `PATCH` | `/producers/:id` | Atualiza produtor |
| `DELETE` | `/producers/:id` | Remove produtor (cascade) |

### Farms

| Método | Path | Descrição |
|---|---|---|
| `POST` | `/farms` | Cria fazenda |
| `GET` | `/producers/:producerId/farms` | Lista fazendas de um produtor (cursor) |
| `GET` | `/farms/unassigned` | Lista fazendas sem produtor (cursor) |
| `GET` | `/farms/dashboard` | Dashboard agregado por período |
| `GET` | `/farms/:id` | Busca fazenda por ID |
| `PATCH` | `/farms/:id` | Atualiza fazenda (incluindo `producerId` para vincular) |
| `DELETE` | `/farms/:id` | Remove fazenda (cascade) |

### Crops

| Método | Path | Descrição |
|---|---|---|
| `POST` | `/crops` | Cria cultura |
| `GET` | `/farms/:farmId/crops` | Lista culturas de uma fazenda (cursor) |
| `GET` | `/crops/unassigned` | Lista culturas sem fazenda (cursor) |
| `GET` | `/crops/:id` | Busca cultura por ID |
| `PATCH` | `/crops/:id` | Atualiza cultura (incluindo `farmId` para vincular) |
| `DELETE` | `/crops/:id` | Remove cultura |

### Health

| Método | Path | Descrição |
|---|---|---|
| `GET` | `/health` | Retorna status da aplicação |

---

## Paginação

A API usa dois tipos de paginação:

### Offset (Producers)

```
GET /producers?page=1&limit=10&sortBy=name&sortOrder=ASC&search=João
```

Resposta:
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNext": true
  }
}
```

### Cursor / Keyset (Farms, Crops)

Mais eficiente para grandes volumes. Use o `nextCursor` retornado para buscar a próxima página.

```
GET /farms/unassigned?limit=10
# retorna nextCursor: 42

GET /farms/unassigned?limit=10&cursor=42
# retorna próxima página a partir do id 42
```

Resposta:
```json
{
  "data": [...],
  "meta": {
    "total": 500,
    "page": 1,
    "limit": 10,
    "totalPages": 50,
    "hasNext": true,
    "nextCursor": 55
  }
}
```

---

## Documentação interativa

Duas interfaces de documentação disponíveis após subir a API:

| Interface | URL | Descrição |
|---|---|---|
| Swagger UI | `http://localhost:3002/api/docs` | Interface padrão do Swagger |
| Scalar | `http://localhost:3002/api/reference` | Interface moderna com melhor UX |

Se `SWAGGER_PASSWORD` estiver configurado, a rota `/docs` exige autenticação básica (`admin` / `<SWAGGER_PASSWORD>`).

Para autenticar nas rotas protegidas, clique em **Authorize** e informe o `Bearer <idToken>` obtido no login.

---

## Desenvolvimento local

**Pré-requisitos:** Node.js 20+ e Docker.

```bash
# Instalar dependências
npm install

# Subir apenas o banco via Docker
docker compose up db -d

# Rodar em modo watch
npm run start:dev

# Testes unitários
npm test

# Testes unitários com cobertura
npm run test:cov
```

Em modo de desenvolvimento (`NODE_ENV != production`), o TypeORM usa `synchronize: true` — as migrations não rodam automaticamente, o schema é sincronizado direto com as entidades.

---

## Testes de integração (e2e)

Os testes de integração sobem o app completo contra um banco real. Requerem PostgreSQL rodando e um banco separado do principal.

```bash
# 1. Suba o banco (se ainda não estiver rodando)
docker compose up db

# 2. Crie o banco de teste (apenas na primeira vez)
docker compose exec db psql -U postgres -c "CREATE DATABASE brain_agro_test;"

# 3. Rode os testes de integração
npm run test:e2e
```

Configure `TEST_DB_NAME` no `.env` se quiser usar um nome diferente de `brain_agro_test`.

O que é coberto:

| Arquivo | Cenários |
|---|---|
| `src/modules/producers/__tests__/producers.integration.spec.ts` | CRUD completo, `POST /full` com farms+crops, paginação, busca, cascade delete |
| `src/modules/farms/__tests__/farms.integration.spec.ts` | CRUD completo, validação de área, paginação por cursor, dashboard com filtro de data, cascade delete de crops |
| `src/modules/crops/__tests__/crops.integration.spec.ts` | CRUD completo, paginação por cursor, busca, cascade delete |

---

## Migrations

```bash
# Gerar migration com base nas mudanças das entidades
npm run migration:generate -- src/database/migrations/NomeDaMigration

# Rodar migrations pendentes
npm run migration:run

# Reverter última migration
npm run migration:revert

# Ver status das migrations
npm run migration:show
```

As migrations ficam em `src/database/migrations/`.
Em produção (`NODE_ENV=production`), `migrationsRun: true` garante que rodam automaticamente na inicialização do container.
