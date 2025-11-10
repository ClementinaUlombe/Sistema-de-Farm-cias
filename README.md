# Sistema de Gestão de Farmácia

Este é um sistema web completo para gestão de uma farmácia, desenvolvido com Next.js, Prisma, TypeScript e Material-UI.

---

## Funcionalidades Implementadas

### 1. Gestão de Acessos e Perfis
*   **Sistema de Login Seguro:** Autenticação baseada em perfis (Administrador, Atendente, Stockista).
*   **Gestão de Utilizadores (Admin):** O Administrador pode criar, editar, desativar e reativar outros utilizadores.
    *   **Validação de Dados:** Validação robusta no servidor e no cliente para campos como nome, email, senha (força), e perfil.
    *   **Contas Desativadas:** Utilizadores desativados não conseguem iniciar sessão.
*   **Controlo de Acesso:** Cada página e funcionalidade é estritamente controlada pelo perfil do utilizador logado.

### 2. Gestão de Produtos
*   **CRUD de Produtos:** Interface completa para Criar, Ler, Atualizar e Apagar produtos.
    *   **Validação de Dados:** Validação abrangente no servidor e no cliente para campos como nome, categoria, preços, quantidades, data de validade e código de barras.
*   **Campos Detalhados:** O sistema regista preço de compra/venda, data de validade, stock mínimo, etc.
*   **Auditoria de Stock:** O histórico de cada alteração de stock (seja por venda ou ajuste manual) é gravado.
*   **Leitor de Código de Barras:** Suporte para leitura de códigos de barras na interface de vendas.

### 3. Gestão de Vendas
*   **Ponto de Venda (POS):** Interface interativa para o Atendente realizar vendas.
*   **Carrinho de Compras:** Pesquisa de produtos, adição ao carrinho e ajuste de quantidades.
*   **Gestão de Descontos:** Permite aplicar um desconto ao valor total da venda.
*   **Atualização de Stock:** O stock é abatido automaticamente após cada venda.
*   **Emissão de Recibo/Factura:** Geração de um recibo detalhado no final de cada venda, com opção de impressão.

### 4. Relatórios
*   **Painel de Alertas e Relatórios de Stock (Disponível para Admin, Atendente, Stockista):**
    *   **Produtos com Stock Baixo:** Gráfico detalhado mostrando produtos específicos e suas quantidades.
    *   **Produtos Próximos da Validade:** Gráfico detalhado mostrando produtos específicos e dias restantes para expirar.
    *   **Produtos Mais Vendidos (Top 5):** Gráfico dos 5 produtos com maior volume de vendas.
    *   **Movimentações de Stock Recentes (Últimos 30 Dias):** Gráfico mostrando o balanço de stock dos produtos.
    *   **Vendas por Categoria (Top 5):** Gráfico das 5 categorias que geraram mais vendas.
    *   **Visualização:** Todos os gráficos possuem tooltips com a cor `rgba(86, 51, 202, 0.9)` para melhor visibilidade.
*   **Para o Admin:**
    *   Relatório de Vendas e Lucro com filtro por data.
    *   Relatório de Vendas por Funcionário.
    *   **Todos os gráficos do Painel de Alertas e Relatórios de Stock** (exibidos abaixo da análise de vendas e lucros).
*   **Para o Atendente:**
    *   Relatório individual das suas próprias vendas, com filtro por data.
    *   **Painel de Alertas e Relatórios de Stock.**
*   **Para o Stockista:**
    *   Acesso ao relatório de Histórico de Movimentação de Stock.
    *   **Painel de Alertas e Relatórios de Stock.**

---

## Tecnologias Utilizadas

*   **Frontend:**
    *   [Next.js](https://nextjs.org/) (Framework React)
    *   [React](https://react.dev/) (Biblioteca JavaScript para UI)
    *   [Material-UI (MUI)](https://mui.com/) (Biblioteca de componentes React para design)
    *   [recharts](https://recharts.org/) (Biblioteca de gráficos React)
    *   [TypeScript](https://www.typescriptlang.org/) (Superset de JavaScript tipado)
*   **Backend:**
    *   [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/api-routes)
    *   [Prisma](https://www.prisma.io/) (ORM - Object-Relational Mapper)
    *   [SQLite](https://www.sqlite.org/index.html) (Banco de dados leve para desenvolvimento/testes)
    *   [bcrypt](https://www.npmjs.com/package/bcrypt) (Para hash de senhas)
    *   [NextAuth.js](https://next-auth.js.org/) (Autenticação)
*   **Ferramentas de Desenvolvimento:**
    *   [ESLint](https://eslint.org/) (Linter para código JavaScript/TypeScript)
    *   [Git](https://git-scm.com/) (Sistema de controlo de versão)

---

## Guia de Instalação e Uso

### Pré-requisitos

Certifique-se de ter o seguinte software instalado em sua máquina:
*   [Node.js](https://nodejs.org/en/) (versão LTS recomendada)
*   [npm](https://www.npmjs.com/) (gerenciador de pacotes do Node.js, geralmente vem com o Node.js) ou [Yarn](https://yarnpkg.com/)
*   [Docker Desktop](https://www.docker.com/products/docker-desktop) (para rodar o banco de dados PostgreSQL em um contêiner)

### 1. Instalação

1.  **Clone o repositório:**
    ```bash
    git clone <URL_DO_SEU_REPOSITORIO>
    cd farmacia
    ```

2.  **Configuração do Ambiente (`.env`):**
    Crie um arquivo `.env` na raiz do projeto, baseado no `.env.example` (se existir, caso contrário, crie com as seguintes variáveis).
    ```
    DATABASE_URL="postgresql://user:password@localhost:5432/farmacia_db?schema=public"
    NEXTAUTH_SECRET="SUA_CHAVE_SECRETA_PARA_NEXTAUTH"
    NEXTAUTH_URL="http://localhost:3000"
    ```
    *   `DATABASE_URL`: Configure com as credenciais do seu banco de dados PostgreSQL. Se estiver usando Docker, as credenciais devem corresponder às definidas no `docker-compose.yml`.
    *   `NEXTAUTH_SECRET`: Gere uma string aleatória longa e segura para esta variável. Você pode usar `openssl rand -base64 32` no terminal.
    *   `NEXTAUTH_URL`: O URL base da sua aplicação.

3.  **Inicie o Banco de Dados com Docker:**
    Este projeto utiliza Docker para gerenciar o banco de dados PostgreSQL. Certifique-se de que o Docker Desktop esteja em execução.
    ```bash
    docker-compose up -d
    ```
    Este comando irá iniciar um contêiner PostgreSQL em segundo plano.

4.  **Instale as dependências do projeto:**
    ```bash
    npm install
    ```

5.  **Execute as migrações da base de dados:**
    Isso criará as tabelas necessárias no seu banco de dados.
    ```bash
    npx prisma migrate dev
    ```
    *Nota: Se você já tem migrações existentes, pode precisar ajustar o comando ou apenas rodar `npx prisma migrate deploy` em produção.*

6.  **Execute o script de "seed" para criar o utilizador Administrador padrão:**
    ```bash
    npx prisma db seed
    ```

### 2. Como Executar a Aplicação

Para iniciar o servidor de desenvolvimento, execute:
```bash
npm run dev
```
Abra o seu navegador e aceda a `http://localhost:3000`.

### 3. Como Usar o Sistema

*   **Primeiro Login (Admin):**
    *   **Email:** `admin@farmacia.com`
    *   **Senha:** `admin123`

*   **Como Administrador:**
    1.  **Crie Utilizadores:** Vá a **"Gestão de Utilizadores"** para criar, editar, desativar e reativar contas.
    2.  **Cadastre Produtos:** Vá a **"Gestão de Produtos"** para adicionar e gerir o seu inventário.
    3.  **Explore Relatórios:** Navegue por **"Relatórios Gerais"** e o **"Painel de Alertas e Relatórios de Stock"** para ter uma visão completa do negócio.

*   **Como Atendente:**
    1.  Faça login com a conta criada pelo Admin.
    2.  Clique em **"Nova Venda"** para aceder ao Ponto de Venda.
    3.  Use a pesquisa para adicionar produtos, ajuste o carrinho e finalize a venda.
    4.  No final, pode imprimir o recibo para o cliente.
    5.  Clique em **"Os Meus Relatórios"** para ver o seu desempenho e aceda ao **"Painel de Alertas e Relatórios de Stock"**.

*   **Como Stockista:**
    1.  Faça login com a conta criada pelo Admin.
    2.  Vá a **"Gestão de Produtos"** para adicionar novos produtos ou atualizar as quantidades e detalhes dos existentes.
    3.  Clique em **"Histórico de Stock"** para auditar todas as movimentações e aceda ao **"Painel de Alertas e Relatórios de Stock"**.

---

## Próximos Passos e Melhorias Futuras

*   **Recuperação de Senha:** Implementar um sistema de "Esqueci a minha senha".
*   **Melhorias na Interface:** Adicionar um modo Dark/Light.
*   **Documentação de API e Backups:** Criar tarefas de manutenção e documentação técnica.
*   **Integração de Pagamentos:** Adicionar opções de pagamento online.
*   **Gestão de Fornecedores:** Módulo para gerir fornecedores e pedidos de compra.
*   **Relatórios Avançados:** Mais opções de filtros e visualizações para relatórios.
