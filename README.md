# 🤖 Discord Register Pro Bot

Um sistema de registro profissional e moderno para Discord, com aprovação via botões, logs detalhados e cards visuais automáticos.

## 🚀 Funcionalidades
- **Registro via Slash Command (`/registro`)**: Abre um modal personalizado.
- **Sistema de Aprovação**: Staff aprova/reprova via botões em canal privado.
- **Visual com Canvas**: Cards automáticos de Bem-vindo, Saída e Aprovação.
- **Banco de Dados SQLite**: Persistência de dados rápida e confiável.
- **Keep-Alive Integrado**: Servidor web na porta 3000 para status.

## 🛠️ Instalação Local

1. **Requisitos**: Node.js v18+, NPM.
2. **Configuração**:
   - Renomeie `.env.example` para `.env` e preencha com seu Token e IDs.
   - Ajuste as configurações em `src/config/config.json` (IDs de canais e cargos).
3. **Instalando dependências**:
   ```bash
   npm install
   ```
4. **Iniciando o bot**:
   ```bash
   npm run dev
   ```

## ☁️ Deploy na Discloud

1. Prepare os arquivos: Certifique-se de que o `discloud.config` está na raiz.
2. Comprima os arquivos `package.json`, `server.ts`, `src/`, `discloud.config`, `.env` e `tsconfig.json` em um arquivo `.zip`.
3. Faça o upload no painel ou via comando da Discloud.
4. O bot iniciará automaticamente usando o comando definido em `MAIN`.

## 🎮 Como Registrar Comandos Slash
Os comandos são registrados automaticamente assim que o bot fica online (`Events.ClientReady`). Não é necessário registro manual.

---
**Nota**: O Bot utiliza a biblioteca `canvas` para geração de imagens. Em servidores Linux (como a Discloud), o sistema deve ter as dependências de build instaladas (já incluído no `APT=canvas` do `discloud.config`).
