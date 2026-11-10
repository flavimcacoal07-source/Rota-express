# ROTA EXPRESS — primeira versão conectada

Interface web responsiva, mobile-first, em português brasileiro, com identidade navy/dourado/âmbar e integração com Supabase Auth e Data API.

## Incluído nesta versão

- Login por e-mail e senha via Supabase Auth e recuperação de senha.
- Leitura do perfil autenticado e bloqueio de perfis inativos ou que não sejam gestores.
- Painel com contagens reais e viagens pendentes.
- Consulta dos módulos existentes no banco.
- Inclusão inicial de motoristas, caminhões, carretas, viagens, abastecimentos, despesas, adiantamentos, acertos e manutenção.
- Ações iniciais de envio, aprovação e devolução de viagens, com registro no histórico.

## Executar localmente

Requisitos: Node.js 20.19+ ou 22.12+.

1. Execute `npm install`.
2. Copie `.env.example` para `.env.local`.
3. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` com os dados do projeto Supabase.
4. Execute `npm run dev` e abra o endereço informado pelo Vite.

A chave publishable pode ser usada no navegador. Nunca coloque `service_role` ou chaves secretas no frontend. O arquivo `.env.local` está no `.gitignore` e não deve ser enviado ao GitHub.

## Supabase Auth

O usuário precisa existir em Authentication e ter um perfil ativo com papel `gestor` na tabela `profiles`. Configure os URLs de redirecionamento do Supabase para incluir o endereço local e o domínio de produção.

## Limites conhecidos — não considerar o sistema concluído

Esta é uma base inicial conectada, ainda não uma versão operacional completa. Ainda precisam ser implementados e testados os fluxos completos de motorista, anexos privados no Storage, cálculo de consumo tanque-cheio a tanque-cheio, comissão e fechamento, regras de pedágio, relatórios financeiros, auditoria completa e validação de todos os campos contra o schema real. As telas de documentos e histórico são somente de consulta. Não há publicação configurada.

Antes de usar em produção, validar as políticas RLS, o schema real de cada tabela, os fluxos de ponta a ponta e as permissões por perfil.
