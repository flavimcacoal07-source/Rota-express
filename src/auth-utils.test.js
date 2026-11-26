import test from 'node:test';
import assert from 'node:assert/strict';
import {
  authErrorMessage,
  canAccessManager,
  isPublicSupabaseKey,
  validateSupabaseConfig,
} from './auth-utils.js';

const projectOrigin = 'https://vbxkuntxukparvemwuqp.supabase.co';

function jwtWithRole(role) {
  const payload = btoa(JSON.stringify({ role }))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `header.${payload}.signature`;
}

test('aceita chave publishable com conteúdo após o prefixo', () => {
  assert.equal(isPublicSupabaseKey('sb_publishable_exemplo123'), true);
  assert.equal(isPublicSupabaseKey('sb_publishable_'), false);
});

test('aceita somente JWT público com papel anon', () => {
  assert.equal(isPublicSupabaseKey(jwtWithRole('anon')), true);
  assert.equal(isPublicSupabaseKey(jwtWithRole('service_role')), false);
  assert.equal(isPublicSupabaseKey('não-é-uma-chave'), false);
});

test('valida a URL do projeto e normaliza a barra final', () => {
  const result = validateSupabaseConfig(
    `${projectOrigin}/`,
    'sb_publishable_exemplo123',
    projectOrigin,
  );

  assert.equal(result.ok, true);
  assert.equal(result.url, projectOrigin);
  assert.equal(result.key, 'sb_publishable_exemplo123');
});

test('rejeita URL de outro projeto e conexão sem HTTPS', () => {
  assert.equal(
    validateSupabaseConfig('https://outro-projeto.supabase.co', 'sb_publishable_x', projectOrigin).ok,
    false,
  );
  assert.equal(
    validateSupabaseConfig('http://vbxkuntxukparvemwuqp.supabase.co', 'sb_publishable_x', projectOrigin).ok,
    false,
  );
});

test('rejeita caminho, query e credenciais embutidas na URL', () => {
  for (const url of [
    `${projectOrigin}/rest/v1`,
    `${projectOrigin}/?debug=true`,
    `https://usuario:senha@vbxkuntxukparvemwuqp.supabase.co`,
  ]) {
    assert.equal(validateSupabaseConfig(url, 'sb_publishable_x', projectOrigin).ok, false);
  }
});

test('rejeita chave secreta e configuração incompleta', () => {
  assert.equal(
    validateSupabaseConfig(projectOrigin, jwtWithRole('service_role'), projectOrigin).ok,
    false,
  );
  assert.equal(validateSupabaseConfig('', 'sb_publishable_x', projectOrigin).ok, false);
  assert.equal(validateSupabaseConfig(projectOrigin, '', projectOrigin).ok, false);
});

test('usa mensagem do erro de autenticação e fallback quando necessário', () => {
  assert.equal(authErrorMessage({ message: 'Credenciais inválidas' }), 'Credenciais inválidas');
  assert.equal(authErrorMessage({ message: '  ' }, 'Tente novamente.'), 'Tente novamente.');
  assert.equal(authErrorMessage('Falha de rede'), 'Falha de rede');
});

test('permite somente perfil gestor ativo na interface administrativa', () => {
  assert.equal(canAccessManager({ role: 'gestor', active: true }), true);
  assert.equal(canAccessManager({ role: 'gestor', active: false }), false);
  assert.equal(canAccessManager({ role: 'motorista', active: true }), false);
  assert.equal(canAccessManager(null), false);
});
