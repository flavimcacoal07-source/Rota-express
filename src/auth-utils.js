export function isPublicSupabaseKey(value) {
  const key = String(value ?? '').trim();
  const publishablePrefix = 'sb_publishable_';

  if (key.startsWith(publishablePrefix)) {
    return key.length > publishablePrefix.length;
  }

  const parts = key.split('.');
  if (parts.length !== 3) return false;

  try {
    const encoded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=');
    return JSON.parse(atob(padded)).role === 'anon';
  } catch {
    return false;
  }
}

export function validateSupabaseConfig(urlValue, keyValue, expectedOrigin) {
  const url = String(urlValue ?? '').trim();
  const key = String(keyValue ?? '').trim();

  if (!url || !key || url.includes('SEU-PROJETO') || key.includes('SUA_CHAVE')) {
    return {
      ok: false,
      message: 'Configure a URL e a chave pública do Supabase nas variáveis do ambiente.',
    };
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return {
      ok: false,
      message: 'A URL configurada não é válida. Confira VITE_SUPABASE_URL.',
    };
  }

  const validPath = parsedUrl.pathname === '' || parsedUrl.pathname === '/';
  if (
    parsedUrl.protocol !== 'https:' ||
    parsedUrl.origin !== expectedOrigin ||
    parsedUrl.username ||
    parsedUrl.password ||
    !validPath ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    return {
      ok: false,
      message: 'A URL configurada não corresponde ao projeto Supabase do ROTA EXPRESS.',
    };
  }

  if (!isPublicSupabaseKey(key)) {
    return {
      ok: false,
      message: 'A chave não foi reconhecida como publishable ou anon. Chaves secretas não são aceitas no navegador.',
    };
  }

  return { ok: true, url: parsedUrl.origin, key, message: '' };
}

export function canAccessManager(profile) {
  return Boolean(profile && profile.active === true && profile.role === 'gestor');
}

export function authErrorMessage(error, fallback = 'Não foi possível concluir a autenticação.') {
  if (typeof error === 'string' && error.trim()) return error.trim();
  const message = typeof error?.message === 'string' ? error.message.trim() : '';
  return message || fallback;
}


export function canLinkDriverAccount(driver) {
  return Boolean(driver && driver.active === true && !driver.auth_user_id);
}

export function availableDriverProfiles(profiles, drivers) {
  const linkedIds = new Set(
    (Array.isArray(drivers) ? drivers : [])
      .map(driver => driver?.auth_user_id)
      .filter(Boolean),
  );

  return (Array.isArray(profiles) ? profiles : [])
    .filter(profile =>
      profile?.id &&
      profile.role === 'motorista' &&
      profile.active === true &&
      !linkedIds.has(profile.id),
    )
    .sort((a, b) =>
      String(a.full_name ?? '').localeCompare(String(b.full_name ?? ''), 'pt-BR', {
        sensitivity: 'base',
      }),
    );
}

export function driverProfileLabel(profile) {
  const name = String(profile?.full_name ?? '').trim() || 'Motorista sem nome';
  const suffix = String(profile?.id ?? '').slice(-8);
  return suffix ? name + ' · ID …' + suffix : name;
}
