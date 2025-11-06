# Sistema de Gestão de Farmácia

Este é um sistema web completo para gestão de uma farmácia, desenvolvido com Next.js, Prisma, TypeScript e Material-UI.

---

## Funcionalidades Implementadas

### 1. Gestão de Acessos e Perfis
*   **Sistema de Login Seguro:** Autenticação baseada em perfis (Administrador, Atendente, Stockista).
*   **Gestão de Utilizadores (Admin):** O Administrador pode criar, editar e apagar outros utilizadores.
*   **Controlo de Acesso:** Cada página e funcionalidade é estritamente controlada pelo perfil do utilizador logado.

### 2. Gestão de Produtos
*   **CRUD de Produtos:** Interface completa para Criar, Ler, Atualizar e Apagar produtos.
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
*   **Para o Admin:**
    *   Relatório de Vendas e Lucro com filtro por data.
    *   Relatório de Vendas por Funcionário.
    *   Relatório de Alertas de Stock Baixo.
    *   Relatório de Alertas de Produtos Próximos da Validade.
    *   Relatório completo de Histórico de Movimentação de Stock (agora exibido por padrão).
*   **Para o Atendente:**
    *   Relatório individual das suas próprias vendas, com filtro por data (agora exibido por padrão).
*   **Para o Stockista:**
    *   Acesso ao relatório de Histórico de Movimentação de Stock (agora exibido por padrão).

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
    npx prisma migrate dev --name init
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
    1.  **Crie Utilizadores:** Vá a **"Gerir Utilizadores"** para criar as contas dos seus Atendentes e Stockistas.
    2.  **Cadastre Produtos:** Vá a **"Gerir Produtos"** para adicionar o seu inventário inicial.
    3.  **Explore Relatórios:** Navegue por **"Relatórios Gerais"** para ter uma visão completa do negócio.

*   **Como Atendente:**
    1.  Faça login com a conta criada pelo Admin.
    2.  Clique em **"Nova Venda"** para aceder ao Ponto de Venda.
    3.  Use a pesquisa para adicionar produtos, ajuste o carrinho e finalize a venda.
    4.  No final, pode imprimir o recibo para o cliente.
    5.  Clique em **"Os Meus Relatórios"** para ver o seu desempenho.

*   **Como Stockista:**
    1.  Faça login com a conta criada pelo Admin.
    2.  Vá a **"Gerir Produtos"** para adicionar novos produtos ou atualizar as quantidades e detalhes dos existentes.
    3.  Clique em **"Histórico de Stock"** para auditar todas as movimentações.

---

## Próximos Passos e Melhorias Futuras

*   **Recuperação de Senha:** Implementar um sistema de "Esqueci a minha senha".
*   **Melhorias na Interface:** Adicionar um modo Dark/Light.
*   **Documentação de API e Backups:** Criar tarefas de manutenção e documentação técnica.