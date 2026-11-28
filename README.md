# ROTA EXPRESS — primeira versão conectada

Interface web responsiva, mobile-first, em português brasileiro, com identidade navy/dourado/âmbar e integração com Supabase Auth e Data API.

## Incluído nesta versão

- Login por e-mail e senha via Supabase Auth e recuperação de senha.
- Leitura do perfil autenticado e bloqueio de perfis inativos ou que não sejam gestores.
- Painel com contagens reais e viagens pendentes.
- Resumo financeiro gerencial, somente para gestor, com fretes aprovados, comissão estimada quando há percentual salvo, abastecimentos, despesas, manutenção, pedágios e saldo de adiantamentos.
- Consulta de todos os registros dos módulos, com busca por texto, paginação de 25/50/100 itens e carregamento em blocos de 500 registros.
- Exportação CSV das listas do gestor, respeitando a busca aplicada, com cabeçalhos em português, separador compatível com planilhas brasileiras e proteção básica contra fórmulas em células de texto.
- Inclusão e edição de motoristas, caminhões, carretas, viagens em rascunho/devolvidas, abastecimentos, despesas, adiantamentos, acertos e manutenção.
- Exclusão de lançamentos operacionais permitidos pelo banco; motoristas, caminhões e carretas são desativados pelo campo Ativo para preservar vínculos e histórico.
- Ações iniciais de envio, aprovação e devolução de viagens, com registro no histórico.
- Vínculo de um cadastro de motorista a uma conta Supabase já existente, somente quando o perfil `motorista` está ativo e ainda não foi associado; esse fluxo não cria usuários nem envia convites.

## Executar localmente

Requisitos: Node.js 20.19+ ou 22.12+.

1. Execute `npm install`.
2. Copie `.env.example` para `.env.local`.
3. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` com os dados do projeto Supabase.
4. Execute `npm run dev` e abra o endereço informado pelo Vite.

A chave publishable pode ser usada no navegador. Nunca coloque `service_role` ou chaves secretas no frontend. O arquivo `.env.local` está no `.gitignore` e não deve ser enviado ao GitHub.

## Configuração de ambiente

O aplicativo mostra uma tela de configuração quando as variáveis públicas do Supabase não estão definidas. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no ambiente local ou na Vercel. A URL deste projeto está no `.env.example`; a chave deve ser copiada do painel Supabase em API Keys, usando uma chave `sb_publishable_` (ou a chave pública `anon` legada). Não use `service_role`.

## Supabase Auth

O usuário precisa existir em Authentication e ter um perfil ativo com papel `gestor` na tabela `profiles`. Configure os URLs de redirecionamento do Supabase para incluir o endereço local e o domínio de produção.

## Limites conhecidos — não considerar o sistema concluído

Esta é uma base inicial conectada, ainda não uma versão operacional completa. Neste estágio, a interface libera login somente para perfis gestores ativos; a área própria do motorista ainda está em desenvolvimento e não deve ser considerada disponível. O bloqueio evita que um perfil motorista entre no painel do gestor, mas ainda não entrega ao motorista suas telas operacionais. Também precisam ser implementados e testados os fluxos completos de motorista, anexos privados no Storage, cálculo de consumo tanque-cheio a tanque-cheio, comissão e fechamento completos, regras de pedágio, relatórios financeiros detalhados, auditoria completa e validação de todos os campos contra o schema real. O painel Financeiro é um resumo gerencial preliminar, não um fechamento contábil. As telas de documentos e histórico são somente de consulta. Não há publicação configurada.

Antes de usar em produção, validar as políticas RLS, o schema real de cada tabela, os fluxos de ponta a ponta e as permissões por perfil.
