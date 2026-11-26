import { createClient } from '@supabase/supabase-js';
import './style.css';
import { calculateFinance } from './finance.js';
import { normalizeRecordValues, toDateTimeLocal } from './record-utils.js';
import { filterAndPaginate } from './table-utils.js';
import { authErrorMessage, validateSupabaseConfig } from './auth-utils.js';

const SUPABASE_PROJECT_ORIGIN = 'https://vbxkuntxukparvemwuqp.supabase.co';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

let supabase = null;
let supabaseConfigMessage = '';
try {
 const validated = validateSupabaseConfig(supabaseUrl, supabaseKey, SUPABASE_PROJECT_ORIGIN);
 if (!validated.ok) throw new Error(validated.message);
 supabase = createClient(validated.url, validated.key);
} catch (error) {
 supabaseConfigMessage = error.message || 'Não foi possível validar a configuração do Supabase.';
}
const supabaseConfigured = Boolean(supabase);
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = v => Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const date = v => v ? new Date(`${String(v).slice(0,10)}T12:00:00`).toLocaleDateString('pt-BR') : '—';
const today = () => new Date().toISOString().slice(0,10);
const labels = {
 dashboard:'Visão geral', finance:'Financeiro', trips:'Viagens', drivers:'Motoristas', trucks:'Caminhões', trailers:'Carretas',
 fuelings:'Abastecimentos', trip_expenses:'Despesas', driver_advances:'Adiantamentos',
 advance_settlements:'Acertos', maintenance_records:'Manutenção', trip_reviews:'Histórico de aprovações',
 document_files:'Documentos'
};
const icons = {dashboard:'⌂',finance:'R$',trips:'⇄',drivers:'♙',trucks:'▣',trailers:'▤',fuelings:'◉',trip_expenses:'＄',driver_advances:'＋',advance_settlements:'✓',maintenance_records:'⚙',trip_reviews:'◷',document_files:'▧'};
const configs = {
 drivers:{title:'Motoristas',table:'drivers',fields:[
  ['full_name','Nome completo','text',true],['cpf','CPF','text'],['phone','Telefone','tel'],['email','E-mail','email'],
  ['commission_percent','Comissão (%)','number',true,'15'],['notes','Observações','textarea'],['active','Ativo','checkbox',false,true]
 ],cols:['full_name','cpf','phone','commission_percent','active']},
 trucks:{title:'Caminhões',table:'trucks',fields:[
  ['plate','Placa','text',true],['description','Descrição / modelo','text'],['arla_32_enabled','Utiliza ARLA 32','checkbox',false,false],['active','Ativo','checkbox',false,true]
 ],cols:['plate','description','arla_32_enabled','active']},
 trailers:{title:'Carretas',table:'trailers',fields:[
  ['plate','Placa','text',true],['description','Descrição','text'],['active','Ativo','checkbox',false,true]
 ],cols:['plate','description','active']},
 trips:{title:'Viagens',table:'trips',fields:[
  ['driver_id','Motorista','select',true,'drivers'],['origin_city','Cidade de origem','text',true],['origin_state','UF origem','text',true],
  ['destination_city','Cidade destino','text',true],['destination_state','UF destino','text',true],['trip_date','Data da viagem','date',true],
  ['freight_gross','Frete bruto (R$)','number',true,'0'],['distance_km','Distância (km)','number'],['truck_id','Caminhão','select',true,'trucks'],['trailer_id','Carreta','select',false,'trailers'],['toll_mode','Pedágio','select',true,'toll'],
  ['toll_amount','Valor pedágio (R$)','number'],['notes','Observações','textarea']
 ],cols:['trip_date','driver_id','origin_city','destination_city','freight_gross','status']},
 fuelings:{title:'Abastecimentos',table:'fuelings',fields:[
  ['trip_id','Viagem','select',true,'trips'],['driver_id','Motorista (vinculado à viagem)','select',true,'drivers'],['fuel_type','Combustível','select',true,'fuel'],
  ['fueling_at','Data e hora','datetime-local',true],['liters','Litros','number',true],['unit_price','Preço por litro (R$)','number',true],
  ['full_tank','Tanque cheio','checkbox',false,false],['odometer_km','Odômetro (km)','number'],['station_name','Posto','text'],['notes','Observações','textarea']
 ],cols:['fueling_at','driver_id','fuel_type','liters','unit_price','total_amount','full_tank']},
 trip_expenses:{title:'Despesas de viagem',table:'trip_expenses',fields:[
  ['trip_id','Viagem','select',true,'trips'],['driver_id','Motorista (vinculado à viagem)','select',true,'drivers'],['category','Categoria','select',true,'expense'],
  ['description','Descrição','text',true],['amount','Valor (R$)','number',true],['expense_at','Data e hora','datetime-local',true]
 ],cols:['expense_at','trip_id','driver_id','category','description','amount']},
 driver_advances:{title:'Adiantamentos',table:'driver_advances',fields:[
  ['driver_id','Motorista','select',true,'drivers'],['amount','Valor (R$)','number',true],['advance_date','Data','date',true],
  ['description','Descrição','text',true]
 ],cols:['reference_code','driver_id','advance_date','description','amount']},
 advance_settlements:{title:'Acertos de adiantamentos',table:'advance_settlements',fields:[
  ['advance_id','Adiantamento','select',true,'advances'],['trip_id','Viagem relacionada','select',false,'trips'],
  ['driver_id','Motorista (vinculado ao adiantamento)','select',true,'drivers'],['amount_applied','Valor aplicado (R$)','number',true],['settled_at','Data do acerto','date',true]
 ],cols:['settled_at','advance_id','trip_id','driver_id','amount_applied']},
 maintenance_records:{title:'Manutenção',table:'maintenance_records',fields:[
  ['truck_id','Caminhão','select',false,'trucks'],['trailer_id','Carreta','select',false,'trailers'],
  ['maintenance_date','Data','date',true],['description','Serviço / descrição','text',true],['amount','Valor (R$)','number'],
  ['odometer_km','Odômetro (km)','number'],['next_due_date','Próxima revisão','date']
 ],cols:['maintenance_date','truck_id','trailer_id','description','amount','next_due_date']},
 trip_reviews:{title:'Histórico de aprovações',table:'trip_reviews',readonly:true,cols:['created_at','trip_id','previous_status','new_status','reason']},
 document_files:{title:'Documentos',table:'document_files',readonly:true,cols:['original_name','content_type','driver_id','trip_id','created_at']}
};
let session=null, profile=null, current='dashboard', cache={}, modalOpen=false, tableState={};
const app=$('#app');
function toast(msg,type='ok'){let el=$('#toast');if(!el){el=document.createElement('div');el.id='toast';document.body.append(el)}el.className=`toast ${type}`;el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),3600)}
function showSetup(){
 app.innerHTML=`<div class="login-shell"><section class="login-brand"><div class="brand-mark">RE</div><span class="eyebrow">GESTÃO INTELIGENTE DE TRANSPORTE</span><h1>ROTA <span>EXPRESS</span></h1><p>O aplicativo precisa das duas variáveis públicas do Supabase para habilitar o acesso.</p></section><section class="login-panel"><div class="login-card"><span class="eyebrow gold">CONFIGURAÇÃO NECESSÁRIA</span><h2>Conecte o projeto Supabase</h2><p class="muted">Configure estas variáveis no ambiente de execução (ou nas variáveis de ambiente da Vercel):</p><p><b>VITE_SUPABASE_URL</b><br><code>https://vbxkuntxukparvemwuqp.supabase.co</code></p><p><b>VITE_SUPABASE_PUBLISHABLE_KEY</b><br><code>Chave sb_publishable_… do projeto</code></p><p class="notice">${esc(supabaseConfigMessage || 'Use somente a chave publishable ou anon. Nunca use service_role ou uma chave secreta no navegador.')}</p><p class="small-note">Depois de salvar as variáveis, gere uma nova execução/build da aplicação.</p></div></section></div>`;
}
function showLogin(message=''){
 app.innerHTML=`<div class="login-shell"><section class="login-brand"><div class="brand-mark">RE</div><span class="eyebrow">GESTÃO INTELIGENTE DE TRANSPORTE</span><h1>ROTA <span>EXPRESS</span></h1><p>Controle operacional, financeiro e acompanhamento de viagens em um só lugar.</p><div class="login-foot">PLATAFORMA DE GESTÃO • ${new Date().getFullYear()}</div></section><section class="login-panel"><form class="login-card" id="login"><span class="eyebrow gold">ÁREA RESTRITA</span><h2>Acessar plataforma</h2><p class="muted">Entre com seu e-mail e senha cadastrados.</p><label>E-mail<input name="email" type="email" autocomplete="username" required value="flavimcacoal70@gmail.com" placeholder="seu@email.com"></label><label>Senha<input name="password" type="password" autocomplete="current-password" required placeholder="Sua senha"></label><button class="primary full" type="submit">Entrar no sistema</button><button class="text-button" type="button" id="forgot">Esqueci minha senha</button><p class="notice" id="login-msg" role="alert" aria-live="polite">${esc(message)}</p><p class="small-note">Acesso protegido pelo Supabase Auth e pelas permissões do banco.</p></form></section></div>`;
 $('#login').addEventListener('submit',login);
 $('#forgot').addEventListener('click',forgotPassword);
}
async function login(e){
 e.preventDefault();
 const f=new FormData(e.currentTarget);
 const b=$('button[type=submit]',e.currentTarget);
 b.disabled=true;
 b.textContent='Verificando…';
 let error=null;
 try {
  const result=await supabase.auth.signInWithPassword({email:f.get('email'),password:f.get('password')});
  error=result.error;
 } catch(caught) {
  error=caught;
 }
 if(error){
  $('#login-msg').textContent=authErrorMessage(error,'Não foi possível entrar. Verifique sua conexão e tente novamente.');
  b.disabled=false;
  b.textContent='Entrar no sistema';
  return;
 }
 await boot();
}
async function forgotPassword(){
 const email=$('input[name=email]').value.trim();
 if(!email){$('#login-msg').textContent='Informe seu e-mail para receber o link.';return}
 try {
  const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:location.origin});
  $('#login-msg').textContent=error
   ?authErrorMessage(error,'Não foi possível solicitar a recuperação de senha.')
   :'Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.';
 } catch(error) {
  $('#login-msg').textContent=authErrorMessage(error,'Não foi possível solicitar a recuperação de senha. Verifique sua conexão.');
 }
}
async function boot(){
 try {
  const {data:{session:s},error:sessionError}=await supabase.auth.getSession();
  if(sessionError)throw sessionError;
  session=s;
  if(!session){showLogin();return}
  const {data:p,error}=await supabase.from('profiles').select('id,full_name,role,active').eq('id',session.user.id).maybeSingle();
  if(error)throw error;
  if(!p||!p.active||p.role!=='gestor'){
   await supabase.auth.signOut();
   showLogin('Este acesso não possui perfil de gestor ativo.');
   return;
  }
  profile=p;
  renderShell();
  await loadPage();
 } catch(error) {
  session=null;
  profile=null;
  showLogin('Não foi possível verificar seu acesso. '+authErrorMessage(error,'Tente novamente.'));
 }
}
function renderShell(){
 const nav=Object.entries(labels).filter(([key])=>key!=='dashboard').map(([key,name])=>`<button class="nav-item ${current===key?'active':''}" data-page="${key}"><span class="nav-icon">${icons[key]||'·'}</span>${name}</button>`).join('');
 app.innerHTML=`<div class="app-shell"><aside class="sidebar" id="sidebar"><div class="side-brand"><div class="brand-mark small">RE</div><div><b>ROTA <span>EXPRESS</span></b><small>GESTÃO DE TRANSPORTE</small></div></div><div class="side-label">MENU PRINCIPAL</div><nav>${`<button class="nav-item ${current==='dashboard'?'active':''}" data-page="dashboard"><span class="nav-icon">⌂</span>Visão geral</button>`}${nav}</nav><div class="side-bottom"><div class="connection"><i></i>Banco de dados conectado</div><div class="user-mini"><div class="avatar">${esc((profile.full_name||'G').slice(0,1).toUpperCase())}</div><div><b>${esc(profile.full_name)}</b><small>Gestor</small></div></div><button class="logout" id="logout">↪ Sair da conta</button></div></aside><main class="main-area"><header class="topbar"><button class="menu-toggle" id="menu">☰</button><div><div class="eyebrow gold">ROTA EXPRESS</div><div class="top-title">${labels[current]||'Visão geral'}</div></div><div class="top-right"><span class="role-pill">GESTOR</span><span class="today">${new Date().toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short',year:'numeric'})}</span></div></header><section class="content" id="content"><div class="loading">Carregando dados…</div></section></main></div><div id="modal-root"></div>`;
 $$('[data-page]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.page)));
 $('#logout').addEventListener('click',async()=>{await supabase.auth.signOut();session=null;profile=null;showLogin()});
 $('#menu').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
}
async function navigate(page){current=page;renderShell();await loadPage()}
async function query(table,select='*'){
 const rows=await fetchAllRows(table,select,500,'created_at',false);
 cache[table]=rows;
 return rows;
}
async function fetchAllRows(table, columns, pageSize=500, orderColumn='id', ascending=true){
 const rows=[];
 for(let offset=0;;offset+=pageSize){
  let request=supabase.from(table).select(columns).order(orderColumn,{ascending});
  if(orderColumn!=='id')request=request.order('id',{ascending:true});
  const {data,error}=await request.range(offset,offset+pageSize-1);
  if(error)throw error;
  const page=data||[];
  rows.push(...page);
  if(page.length<pageSize)return rows;
 }
}
async function loadPage(){
 const host=$('#content');host.innerHTML='<div class="loading">Consultando o banco de dados…</div>';
 try{if(current==='dashboard'){await dashboard(host);return}
  if(current==='finance'){await financeDashboard(host);return}
  const cfg=configs[current];if(!cfg){host.innerHTML='<div class="panel empty-state">Módulo não configurado.</div>';return}
  const rows=await query(cfg.table);
  const relatedTables = {
   trips:['drivers'],
   fuelings:['drivers','trips'],
   trip_expenses:['drivers','trips'],
   driver_advances:['drivers'],
   advance_settlements:['drivers','trips','driver_advances'],
   maintenance_records:['trucks','trailers'],
   trip_reviews:['trips'],
   document_files:['drivers','trips']
  };
  await Promise.all((relatedTables[current]||[]).map(table=>cache[table]?Promise.resolve(cache[table]):query(table)));
  await renderTable(host,cfg,rows);
 }catch(e){host.innerHTML=`<div class="panel empty-state"><b>Não foi possível carregar os dados</b><p>${esc(e.message||e)}</p><small>Verifique sua conexão e as permissões de acesso.</small></div>`}
}
async function dashboard(host){
 const names=['drivers','trucks','trailers','trips','fuelings','trip_expenses','driver_advances','maintenance_records'];
 const results=await Promise.all(names.map(t=>supabase.from(t).select('*',{count:'exact',head:true})));
 const counts={};results.forEach((r,i)=>{if(r.error)throw r.error;counts[names[i]]=r.count||0});
 const {data:pending,error}=await supabase.from('trips').select('id,origin_city,origin_state,destination_city,destination_state,trip_date,freight_gross,status').eq('status','pendente').order('submitted_at',{ascending:false}).limit(6);if(error)throw error;
 const {data:recent}=await supabase.from('trips').select('id,origin_city,destination_city,trip_date,freight_gross,status').order('created_at',{ascending:false}).limit(5);
 host.innerHTML=`<div class="page-heading"><div><span class="eyebrow gold">RESUMO OPERACIONAL</span><h1>Bom dia, ${esc((profile.full_name||'Gestor').split(' ')[0])}</h1><p class="muted">Acompanhe os principais indicadores da operação.</p></div><button class="primary" id="new-trip">＋ Nova viagem</button></div><div class="stats-grid">${[['Motoristas',counts.drivers,'Cadastros'],['Caminhões',counts.trucks,'Veículos'],['Carretas',counts.trailers,'Implementos'],['Viagens',counts.trips,'Registros'],['Abastecimentos',counts.fuelings,'Lançamentos'],['Despesas',counts.trip_expenses,'Lançamentos'],['Adiantamentos',counts.driver_advances,'Registros'],['Manutenções',counts.maintenance_records,'Registros']].map((x,i)=>`<article class="stat-card ${i===3?'accent':''}"><span>${x[0]}</span><strong>${x[1]}</strong><small>${x[2]} no banco de dados</small></article>`).join('')}</div><div class="dashboard-grid"><section class="panel"><div class="panel-head"><div><b>Viagens aguardando aprovação</b><small>${pending.length} pendente(s)</small></div><button class="link-button" data-page="trips">Ver viagens →</button></div>${pending.length?pending.map(t=>`<div class="recent-row"><div><b>${esc(t.origin_city)} → ${esc(t.destination_city)}</b><small>${date(t.trip_date)} · ${esc(t.origin_state)} / ${esc(t.destination_state)}</small></div><div class="recent-value">${money(t.freight_gross)}<br><span class="status warning">Pendente</span></div></div>`).join(''):'<div class="empty-state compact">Nenhuma viagem aguardando aprovação.</div>'}</section><section class="panel"><div class="panel-head"><div><b>Acesso rápido</b><small>Atalhos operacionais</small></div></div><div class="quick-links">${[['drivers','♙','Cadastrar motorista'],['trucks','▣','Cadastrar caminhão'],['trailers','▤','Cadastrar carreta'],['trips','⇄','Consultar viagens'],['finance','R$','Resumo financeiro'],['driver_advances','＋','Lançar adiantamento']].map(x=>`<button data-page="${x[0]}"><span>${x[1]}</span>${x[2]}<i>›</i></button>`).join('')}</div></section></div><section class="panel recent-panel"><div class="panel-head"><div><b>Viagens recentes</b><small>Últimos registros</small></div></div>${recent?.length?recent.map(t=>`<div class="recent-row"><div><b>${esc(t.origin_city)} → ${esc(t.destination_city)}</b><small>${date(t.trip_date)}</small></div><div class="recent-value">${money(t.freight_gross)}<br><span class="status">${statusName(t.status)}</span></div></div>`).join(''):'<div class="empty-state compact">Nenhuma viagem cadastrada.</div>'}</section>`;
 $('#new-trip').onclick=()=>openForm('trips');
 $$('[data-page]',host).forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.page)));
}
async function financeDashboard(host){
 const [trips,fuelings,expenses,maintenance,advances,settlements]=await Promise.all([
  fetchAllRows('trips','freight_gross,status,commission_percent_snapshot,toll_mode,toll_amount'),
  fetchAllRows('fuelings','total_amount'),
  fetchAllRows('trip_expenses','amount'),
  fetchAllRows('maintenance_records','amount'),
  fetchAllRows('driver_advances','amount'),
  fetchAllRows('advance_settlements','amount_applied')
 ]);
 const totals=calculateFinance({trips,fuelings,expenses,maintenance,advances,settlements});
 const metrics=[
  ['Frete aprovado',money(totals.freight),'Somente viagens aprovadas',true],
  ['Comissão estimada',totals.commissionTripsCount?money(totals.commission):'—',totals.commissionTripsCount+' viagem(ns) com percentual salvo'],
  ['Abastecimentos',money(totals.fuel),'Total lançado'],
  ['Despesas de viagem',money(totals.expenses),'Total lançado'],
  ['Manutenção',money(totals.maintenance),'Total lançado'],
  ['Pedágio da empresa',money(totals.tolls),'Viagens aprovadas com pedágio por conta da empresa'],
  ['Adiantamentos emitidos',money(totals.advances),'Total liberado aos motoristas'],
  ['Acertos registrados',money(totals.settled),'Valores aplicados aos adiantamentos'],
  ['Saldo de adiantamentos',money(totals.advanceBalance),'Emitidos menos valores aplicados',true]
 ];
 host.innerHTML=`<div class="page-heading"><div><span class="eyebrow gold">CONTROLE GERENCIAL</span><h1>Financeiro</h1><p class="muted">Resumo acumulado dos lançamentos disponíveis no banco de dados.</p></div></div><div class="finance-grid">${metrics.map(([label,value,note,emphasis])=>`<article class="finance-card ${emphasis?'emphasis':''}"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join('')}</div><section class="panel finance-note"><b>Como interpretar este resumo</b><p class="muted">O frete considera apenas viagens aprovadas. A comissão é estimada somente quando existe percentual gravado na viagem. Abastecimentos, despesas, manutenção, pedágios e adiantamentos são apresentados separadamente; este painel ainda não substitui conciliação, fechamento ou demonstrativo contábil.</p><p class="muted">Viagens aguardando aprovação: <b>${totals.pendingTripsCount}</b> · Viagens aprovadas: <b>${totals.approvedTripsCount}</b></p></section>`;
}
function statusName(s){return ({rascunho:'Rascunho',pendente:'Pendente',aprovada:'Aprovada',devolvida:'Devolvida'})[s]||s||'—'}
function fieldValue(row,key){let v=row[key];if(key==='driver_id')return row.driver?.full_name||cache.drivers?.find(x=>x.id===v)?.full_name||v?.slice(0,8)||'—';
 if(key==='trip_id'){
  const trip=row.trip||cache.trips?.find(x=>x.id===v);
  return trip?`${trip.origin_city} → ${trip.destination_city}`:v?.slice(0,8)||'—';
 }
 if(key==='truck_id')return row.truck?.plate||cache.trucks?.find(x=>x.id===v)?.plate||'—';
 if(key==='trailer_id')return row.trailer?.plate||cache.trailers?.find(x=>x.id===v)?.plate||'—';
 if(key==='advance_id')return row.advance?.reference_code||cache.driver_advances?.find(x=>x.id===v)?.reference_code||v?.slice(0,8)||'—';
 if(key==='active'||key==='full_tank'||key==='arla_32_enabled')return v?'Sim':'Não';
 if(key.endsWith('_at')||key.endsWith('_date'))return date(v);
 if(key==='status'||key==='previous_status'||key==='new_status')return statusName(v);
 if(key==='freight_gross'||key==='amount'||key==='amount_applied'||key==='total_amount'||key==='unit_price')return money(v);
 if(key==='fuel_type')return ({diesel_s10:'Diesel S10',diesel_s500:'Diesel S500',arla_32:'ARLA 32'})[v]||v;
 if(key==='category')return ({alimentacao:'Alimentação',hospedagem:'Hospedagem',manutencao:'Manutenção',estacionamento:'Estacionamento',documentacao:'Documentação',outros:'Outros'})[v]||v;
 return v??'—'}
async function renderTable(host,cfg,rows){
 const key=current;
 const title=cfg.title;
 const columns=cfg.cols;
 const hasActions=!cfg.readonly;
 const state=tableState[key]||(tableState[key]={search:'',page:1,pageSize:25});
 const pageSizes=[25,50,100];
 const pageSizeOptions=pageSizes.map(size=>'<option value="'+size+'"'+(state.pageSize===size?' selected':'')+'>'+size+'</option>').join('');
 const footnote=['drivers','trucks','trailers'].includes(key)
  ? 'Para preservar o histórico, desative cadastros já utilizados pelo campo Ativo.'
  : 'Consulta completa em blocos de 500 registros · Busca e paginação aplicadas à lista.';
 host.innerHTML=`<div class="page-heading"><div><span class="eyebrow gold">CADASTROS E CONTROLES</span><h1>${esc(title)}</h1><p class="muted" id="table-count">${rows.length} registro(s) carregado(s).</p></div>${cfg.readonly?'':`<button class="primary" id="add-record">＋ Novo registro</button>`}</div><div class="panel table-panel"><div class="table-toolbar"><label class="table-search" for="table-search"><span>Buscar nesta lista</span><input id="table-search" type="search" autocomplete="off" placeholder="Nome, placa, cidade, situação..." value="${esc(state.search)}"></label><label class="page-size-control" for="page-size"><span>Por página</span><select id="page-size">${pageSizeOptions}</select></label></div><div class="table-scroll"><table><thead><tr>${columns.map(c=>`<th>${esc(columnLabel(c))}</th>`).join('')}${hasActions?'<th>Ações</th>':''}</tr></thead><tbody id="table-body"></tbody></table></div><div class="table-pagination"><span class="table-range" id="table-range"></span><div class="table-page-controls"><button class="outline" id="page-prev" type="button">Anterior</button><span id="page-label"></span><button class="outline" id="page-next" type="button">Próxima</button></div></div><div class="table-foot">${footnote}</div></div>`;
 if(!cfg.readonly)$('#add-record').onclick=()=>openForm(key);
 const refresh=()=>renderTableContent(host,cfg,rows,key);
 $('#table-search',host).addEventListener('input',event=>{
  state.search=event.target.value;
  state.page=1;
  refresh();
 });
 $('#page-size',host).addEventListener('change',event=>{
  state.pageSize=Number(event.target.value)||25;
  state.page=1;
  refresh();
 });
 $('#page-prev',host).addEventListener('click',()=>{state.page=Math.max(1,state.page-1);refresh()});
 $('#page-next',host).addEventListener('click',()=>{state.page+=1;refresh()});
 refresh();
}
function renderTableContent(host,cfg,rows,key){
 const columns=cfg.cols;
 const hasActions=!cfg.readonly;
 const state=tableState[key];
 const result=filterAndPaginate(rows,state.search,state.page,state.pageSize,row=>columns.map(column=>fieldValue(row,column)).join(' '));
 state.page=result.page;
 const body=$('#table-body',host);
 if(body)body.innerHTML=displayRowsMarkup(result.pageRows,columns,hasActions,state.search);
 const count=$('#table-count',host);
 if(count)count.textContent=result.total+' registro(s) encontrado(s).';
 const range=$('#table-range',host);
 if(range)range.textContent=result.total?'Mostrando '+result.startIndex+'–'+result.endIndex+' de '+result.total:'Nenhum registro para exibir';
 const label=$('#page-label',host);
 if(label)label.textContent='Página '+result.page+' de '+result.pageCount;
 const previous=$('#page-prev',host);
 const next=$('#page-next',host);
 if(previous)previous.disabled=result.page<=1;
 if(next)next.disabled=result.page>=result.pageCount;
 host.querySelectorAll('[data-action]').forEach(button=>button.addEventListener('click',()=>updateTrip(button.dataset.id,button.dataset.action)));
 host.querySelectorAll('[data-edit-id]').forEach(button=>button.addEventListener('click',()=>{
  const record=rows.find(row=>row.id===button.dataset.editId);
  if(record)openForm(key,record);
 }));
 host.querySelectorAll('[data-delete-id]').forEach(button=>button.addEventListener('click',()=>deleteRecord(key,button.dataset.deleteId)));
}
function displayRowsMarkup(rows,columns,hasActions,searchTerm=''){
 if(!rows.length){
  const searched=Boolean(searchTerm.trim());
  const title=searched?'Nenhum resultado encontrado':'Nenhum registro por enquanto';
  const message=searched?'Tente outro termo de busca.':'Quando houver dados cadastrados, eles aparecerão aqui.';
  return `<tr><td colspan="${columns.length+(hasActions?1:0)}"><div class="empty-state"><div class="empty-icon">⌁</div><b>${title}</b><p>${message}</p>${hasActions&&!searched?'<small>Use o botão “Novo registro” para começar.</small>':''}</div></td></tr>`;
 }
 return rows.map(row=>`<tr>${columns.map(column=>`<td>${esc(fieldValue(row,column))}</td>`).join('')}${hasActions?`<td class="actions">${recordActions(row,current)}</td>`:''}</tr>`).join('');
}
function recordActions(record,key){
 if(key==='trips'){
  const canEdit=['rascunho','devolvida'].includes(record.status);
  return `${tripActions(record)}${canEdit?`<button class="mini-action edit" data-edit-id="${esc(record.id)}">Editar</button>`:''}`;
 }
 const canDelete=['fuelings','trip_expenses','driver_advances','advance_settlements','maintenance_records'].includes(key);
 return `<button class="mini-action edit" data-edit-id="${esc(record.id)}">Editar</button>${canDelete?`<button class="mini-action delete" data-delete-id="${esc(record.id)}">Excluir</button>`:''}`;
}
async function deleteRecord(key,id){
 const cfg=configs[key];
 const allowed=['fuelings','trip_expenses','driver_advances','advance_settlements','maintenance_records'];
 if(!cfg||!allowed.includes(key))return;
 if(!confirm('Excluir este registro? Esta ação não poderá ser desfeita.'))return;
 const {error}=await supabase.from(cfg.table).delete().eq('id',id);
 if(error){toast('Não foi possível excluir: '+error.message,'error');return}
 toast('Registro excluído.');
 await loadPage();
}

function columnLabel(c){return ({full_name:'Nome',cpf:'CPF',phone:'Telefone',commission_percent:'Comissão',active:'Ativo',plate:'Placa',description:'Descrição',arla_32_enabled:'ARLA 32',trip_date:'Data',driver_id:'Motorista',origin_city:'Origem',destination_city:'Destino',freight_gross:'Frete bruto',status:'Situação',fueling_at:'Data',fuel_type:'Tipo',liters:'Litros',unit_price:'Preço/L',total_amount:'Total',full_tank:'Tanque cheio',category:'Categoria',amount:'Valor',expense_at:'Data',reference_code:'Referência',advance_date:'Data',settled_at:'Data acerto',advance_id:'Adiantamento',amount_applied:'Valor aplicado',maintenance_date:'Data',truck_id:'Caminhão',trailer_id:'Carreta',next_due_date:'Próxima revisão',created_at:'Data',trip_id:'Viagem',previous_status:'Situação anterior',new_status:'Nova situação',original_name:'Arquivo',content_type:'Tipo arquivo',reason:'Motivo'})[c]||c}
function tripActions(r){if(r.status==='rascunho')return `<button class="mini-action approve" data-action="pendente" data-id="${r.id}">Enviar</button>`;if(r.status==='pendente')return `<button class="mini-action approve" data-action="aprovada" data-id="${r.id}">Aprovar</button><button class="mini-action return" data-action="devolvida" data-id="${r.id}">Devolver</button>`;return `<span class="status">${statusName(r.status)}</span>`}
async function updateTrip(id,status){let reason=null;if(status==='devolvida'){reason=prompt('Informe o motivo da devolução:');if(!reason?.trim())return}
 const {data:currentTrip,error:readError}=await supabase.from('trips').select('status').eq('id',id).single();
 if(readError){toast(readError.message,'error');return}
 const update={status,updated_at:new Date().toISOString()};if(status==='pendente')update.submitted_at=new Date().toISOString();if(status==='aprovada'){update.approved_at=new Date().toISOString();update.approved_by=session.user.id}else if(status==='devolvida')update.returned_reason=reason;
 const {error}=await supabase.from('trips').update(update).eq('id',id);if(error){toast(error.message,'error');return}
 const {error:logError}=await supabase.from('trip_reviews').insert({trip_id:id,reviewer_id:session.user.id,previous_status:currentTrip.status,new_status:status,reason});
 if(logError){toast('Viagem atualizada, mas o histórico não foi gravado: '+logError.message,'error')}else toast('Situação da viagem atualizada.');
 await loadPage();
}
async function optionData(source){
 if(source==='drivers')return (await query('drivers')).filter(x=>x.active).map(x=>[x.id,x.full_name]);
 if(source==='trucks')return (await query('trucks')).filter(x=>x.active).map(x=>[x.id,x.plate]);
 if(source==='trailers')return (await query('trailers')).filter(x=>x.active).map(x=>[x.id,x.plate]);
 if(source==='trips')return (await query('trips')).map(x=>[x.id,`${x.origin_city} → ${x.destination_city} (${date(x.trip_date)})`]);
 if(source==='advances')return (await query('driver_advances')).map(x=>[x.id,`${x.reference_code} · ${money(x.amount)}`]);
 if(source==='toll')return [['a_parte','À parte'],['por_conta_da_empresa','Por conta da empresa']];
 if(source==='fuel')return [['diesel_s10','Diesel S10'],['diesel_s500','Diesel S500'],['arla_32','ARLA 32']];
 if(source==='expense')return [['alimentacao','Alimentação'],['hospedagem','Hospedagem'],['manutencao','Manutenção'],['estacionamento','Estacionamento'],['documentacao','Documentação'],['outros','Outros']];
 return [];
}
async function openForm(key,record=null){
 const cfg=configs[key];if(!cfg||cfg.readonly)return;
 const values=record?{...record}:{};
 if(key==='trips'&&record){
  const {data:vehicle,error}=await supabase.from('trip_vehicles').select('id,truck_id,trailer_id').eq('trip_id',record.id).order('created_at',{ascending:false}).limit(1).maybeSingle();
  if(error){toast('Não foi possível carregar o veículo da viagem: '+error.message,'error');return}
  Object.assign(values,vehicle||{});
 }
 const fields=await Promise.all(cfg.fields.map(async f=>{
  const opts=f[4]&&typeof f[4]==='string'&&!['15','0'].includes(f[4])?await optionData(f[4]):[];
  return {f,opts:includeCurrentOption(f,opts,values)};
 }));
 const modal=$('#modal-root');
 modal.innerHTML=`<div class="modal-backdrop"><form class="modal" id="record-form"><div class="modal-head"><div><span class="eyebrow gold">${record?'EDITAR CADASTRO':'NOVO CADASTRO'}</span><h2>${cfg.title}</h2><p class="muted">${record?'Atualize os campos permitidos deste registro.':'Preencha os campos para salvar no banco de dados.'}</p></div><button class="close-modal" type="button" id="close-modal">×</button></div><div class="form-grid">${fields.map(({f,opts})=>renderField(f,opts,values)).join('')}</div><div class="modal-actions"><button class="outline" type="button" id="cancel-modal">Cancelar</button><button class="primary" type="submit">${record?'Salvar alterações':'Salvar registro'}</button></div><p class="notice" id="form-error"></p></form></div>`;
 $('#close-modal').onclick=$('#cancel-modal').onclick=()=>modal.innerHTML='';
 const form=$('#record-form');
 if(key==='fuelings'||key==='trip_expenses')bindDriverToSource(form,'trip_id','trips');
 if(key==='advance_settlements')bindDriverToSource(form,'advance_id','driver_advances');
 if(record&&key==='trips'&&form.elements.driver_id)form.elements.driver_id.disabled=true;
 if(record&&key==='driver_advances'&&form.elements.driver_id)form.elements.driver_id.disabled=true;
 form.addEventListener('submit',e=>saveForm(e,key,record));
}
function includeCurrentOption(field,options,values){
 const [name,,type,,source]=field;
 const selected=values[name];
 if(type!=='select'||!selected||options.some(([value])=>String(value)===String(selected)))return options;
 const table={drivers:'drivers',trucks:'trucks',trailers:'trailers',trips:'trips',advances:'driver_advances'}[source];
 const row=table?cache[table]?.find(item=>item.id===selected):null;
 if(!row)return options;
 const label=row.full_name||row.plate||row.reference_code||(row.origin_city?`${row.origin_city} → ${row.destination_city}`:String(row.id).slice(0,8));
 return [...options,[row.id,label]];
}

function bindDriverToSource(form,sourceField,sourceTable){
 const source=form.elements[sourceField],driver=form.elements.driver_id;
 if(!source||!driver)return;
 const sync=()=>{
  const linked=cache[sourceTable]?.find(row=>row.id===source.value);
  const driverId=linked?.driver_id||'';
  if(driverId&&!Array.from(driver.options).some(option=>option.value===driverId)){
   const record=cache.drivers?.find(row=>row.id===driverId);
   driver.add(new Option(record?.full_name||'Motorista vinculado',driverId));
  }
  driver.value=driverId;
  driver.disabled=Boolean(driverId);
 };
 source.addEventListener('change',sync);
 sync();
}
function renderField(f,opts,values={}){
 const [name,label,type,required=false,defaultValue]=f;
 const hasValue=Object.prototype.hasOwnProperty.call(values,name)&&values[name]!==null&&values[name]!==undefined;
 const value=hasValue?values[name]:defaultValue;
 const req=required?'required':'';
 if(type==='checkbox')return `<label class="check-field"><input type="checkbox" name="${name}" ${Boolean(value)?'checked':''}> ${label}</label>`;
 if(type==='textarea')return `<label class="wide">${label}<textarea name="${name}" ${req}>${esc(value??'')}</textarea></label>`;
 if(type==='select')return `<label>${label}<select name="${name}" ${req}><option value="">Selecione</option>${opts.map(([v,l])=>`<option value="${esc(v)}" ${String(v)===String(value??'')?'selected':''}>${esc(l)}</option>`).join('')}</select></label>`;
 let inputValue=value??'';
 if(type==='datetime-local')inputValue=toDateTimeLocal(inputValue);
 else if(type==='date'&&inputValue)inputValue=String(inputValue).slice(0,10);
 const numericConstraints=type==='number'?`step="0.01" min="0" ${name==='commission_percent'?'max="100"':''}`:'';
 return `<label>${label}<input name="${name}" type="${type}" ${req} ${inputValue!==''? `value="${esc(inputValue)}"`:''} ${numericConstraints}></label>`;
}

async function saveForm(e,key,record=null){
 e.preventDefault();const form=e.currentTarget;const cfg=configs[key];const data={};
 for(const f of cfg.fields){const [name,,type]=f;const el=form.elements[name];if(!el)continue;let v=type==='checkbox'?el.checked:el.value;if(type==='number')v=v===''?null:Number(v);else if(v==='')v=null;data[name]=v}
 if(key==='trips'&&data.toll_mode==='por_conta_da_empresa'&&data.toll_amount===null){$('#form-error').textContent='Informe o valor do pedágio pago pela empresa.';return}
 if(key==='fuelings'||key==='trip_expenses'){
  const linkedTrip=cache.trips?.find(row=>row.id===data.trip_id);
  if(!linkedTrip){$('#form-error').textContent='Selecione uma viagem válida.';return}
  data.driver_id=linkedTrip.driver_id;
 }
 if(key==='advance_settlements'){
  const linkedAdvance=cache.driver_advances?.find(row=>row.id===data.advance_id);
  if(!linkedAdvance){$('#form-error').textContent='Selecione um adiantamento válido.';return}
  data.driver_id=linkedAdvance.driver_id;
  const linkedTrip=cache.trips?.find(row=>row.id===data.trip_id);
  if(data.trip_id&&linkedTrip&&linkedTrip.driver_id!==linkedAdvance.driver_id){$('#form-error').textContent='A viagem e o adiantamento precisam pertencer ao mesmo motorista.';return}
 }
 const linkedDriver=key==='trips'?cache.drivers?.find(row=>row.id===data.driver_id):null;
 const payload=normalizeRecordValues(key,data,{isEditing:Boolean(record),userId:session.user.id,driverCommission:linkedDriver?.commission_percent});
 if(record&&['drivers','trucks','trailers','trips'].includes(key))payload.updated_at=new Date().toISOString();
 const b=$('button[type=submit]',form);b.disabled=true;b.textContent=record?'Salvando alterações…':'Salvando…';
 let error=null;
 if(key==='trips'){
  const truckId=payload.truck_id,trailerId=payload.trailer_id;delete payload.truck_id;delete payload.trailer_id;
  if(record){
   const {error:tripError}=await supabase.from(cfg.table).update(payload).eq('id',record.id);error=tripError;
   if(!error){
    const truck=cache.trucks?.find(x=>x.id===truckId);
    const trailer=trailerId?cache.trailers?.find(x=>x.id===trailerId):null;
    const {data:link,error:linkReadError}=await supabase.from('trip_vehicles').select('id').eq('trip_id',record.id).order('created_at',{ascending:false}).limit(1).maybeSingle();
    if(linkReadError)error=new Error('Viagem atualizada, mas não foi possível localizar o vínculo do veículo: '+linkReadError.message);
    else{
     const vehicleData={truck_id:truckId,trailer_id:trailerId||null,truck_plate_snapshot:truck?.plate||'—',trailer_plate_snapshot:trailer?.plate||null};
     const result=link?await supabase.from('trip_vehicles').update(vehicleData).eq('id',link.id):await supabase.from('trip_vehicles').insert({trip_id:record.id,...vehicleData});
     error=result.error;
     if(error)error=new Error('Viagem atualizada, mas houve falha ao salvar o veículo: '+error.message);
    }
   }
  }else{
   const {data:created,error:tripError}=await supabase.from(cfg.table).insert(payload).select('id').single();error=tripError;
   if(!error){
    const truck=cache.trucks?.find(x=>x.id===truckId) || (await supabase.from('trucks').select('id,plate').eq('id',truckId).single()).data;
    const trailer=trailerId?(cache.trailers?.find(x=>x.id===trailerId)||(await supabase.from('trailers').select('id,plate').eq('id',trailerId).single()).data):null;
    const {error:vehicleError}=await supabase.from('trip_vehicles').insert({trip_id:created.id,truck_id:truckId,trailer_id:trailerId||null,truck_plate_snapshot:truck?.plate||'—',trailer_plate_snapshot:trailer?.plate||null});
    if(vehicleError)error=new Error('Viagem criada, mas houve falha ao vincular o veículo: '+vehicleError.message);
   }
  }
 }else if(record){
  const result=await supabase.from(cfg.table).update(payload).eq('id',record.id);error=result.error;
 }else{
  const result=await supabase.from(cfg.table).insert(payload);error=result.error;
 }
 if(error){$('#form-error').textContent=error.message||String(error);b.disabled=false;b.textContent=record?'Salvar alterações':'Salvar registro';return}
 $('#modal-root').innerHTML='';toast(record?'Alterações salvas com sucesso.':'Registro salvo com sucesso.');await loadPage();
}

if(!supabase){showSetup()}else{
 supabase.auth.onAuthStateChange((_event,s)=>{if(!s){session=null;profile=null;showLogin()}});
 showLogin();
 boot();
}