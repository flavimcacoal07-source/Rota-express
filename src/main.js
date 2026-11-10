import { createClient } from '@supabase/supabase-js';
import './style.css';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = v => Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const date = v => v ? new Date(`${String(v).slice(0,10)}T12:00:00`).toLocaleDateString('pt-BR') : '—';
const today = () => new Date().toISOString().slice(0,10);
const labels = {
 dashboard:'Visão geral', trips:'Viagens', drivers:'Motoristas', trucks:'Caminhões', trailers:'Carretas',
 fuelings:'Abastecimentos', trip_expenses:'Despesas', driver_advances:'Adiantamentos',
 advance_settlements:'Acertos', maintenance_records:'Manutenção', trip_reviews:'Histórico de aprovações',
 document_files:'Documentos'
};
const icons = {dashboard:'⌂',trips:'⇄',drivers:'♙',trucks:'▣',trailers:'▤',fuelings:'◉',trip_expenses:'＄',driver_advances:'＋',advance_settlements:'✓',maintenance_records:'⚙',trip_reviews:'◷',document_files:'▧'};
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
  ['freight_gross','Frete bruto (R$)','number',true,'0'],['distance_km','Distância (km)','number'],['truck_id','Caminhão','select',true,'trucks'],['trailer_id','Carreta','select',false,'trailers'],['toll_mode','Pedágio','select',false,'toll'],
  ['toll_amount','Valor pedágio (R$)','number'],['notes','Observações','textarea']
 ],cols:['trip_date','driver_id','origin_city','destination_city','freight_gross','status']},
 fuelings:{title:'Abastecimentos',table:'fuelings',fields:[
  ['trip_id','Viagem','select',true,'trips'],['driver_id','Motorista','select',true,'drivers'],['fuel_type','Combustível','select',true,'fuel'],
  ['fueling_at','Data e hora','datetime-local',true],['liters','Litros','number',true],['unit_price','Preço por litro (R$)','number',true],
  ['full_tank','Tanque cheio','checkbox',false,false],['odometer_km','Odômetro (km)','number'],['station_name','Posto','text'],['notes','Observações','textarea']
 ],cols:['fueling_at','driver_id','fuel_type','liters','unit_price','total_amount','full_tank']},
 trip_expenses:{title:'Despesas de viagem',table:'trip_expenses',fields:[
  ['trip_id','Viagem','select',true,'trips'],['driver_id','Motorista','select',true,'drivers'],['category','Categoria','select',true,'expense'],
  ['description','Descrição','text',true],['amount','Valor (R$)','number',true],['expense_at','Data e hora','datetime-local',true]
 ],cols:['expense_at','trip_id','driver_id','category','description','amount']},
 driver_advances:{title:'Adiantamentos',table:'driver_advances',fields:[
  ['driver_id','Motorista','select',true,'drivers'],['amount','Valor (R$)','number',true],['advance_date','Data','date',true],
  ['description','Descrição','text',true]
 ],cols:['reference_code','driver_id','advance_date','description','amount']},
 advance_settlements:{title:'Acertos de adiantamentos',table:'advance_settlements',fields:[
  ['advance_id','Adiantamento','select',true,'advances'],['trip_id','Viagem relacionada','select',false,'trips'],
  ['driver_id','Motorista','select',true,'drivers'],['amount_applied','Valor aplicado (R$)','number',true],['settled_at','Data do acerto','date',true]
 ],cols:['settled_at','advance_id','trip_id','driver_id','amount_applied']},
 maintenance_records:{title:'Manutenção',table:'maintenance_records',fields:[
  ['truck_id','Caminhão','select',false,'trucks'],['trailer_id','Carreta','select',false,'trailers'],
  ['maintenance_date','Data','date',true],['description','Serviço / descrição','text',true],['amount','Valor (R$)','number'],
  ['odometer_km','Odômetro (km)','number'],['next_due_date','Próxima revisão','date']
 ],cols:['maintenance_date','truck_id','trailer_id','description','amount','next_due_date']},
 trip_reviews:{title:'Histórico de aprovações',table:'trip_reviews',readonly:true,cols:['created_at','trip_id','previous_status','new_status','reason']},
 document_files:{title:'Documentos',table:'document_files',readonly:true,cols:['original_name','content_type','driver_id','trip_id','created_at']}
};
let session=null, profile=null, current='dashboard', cache={}, modalOpen=false;
const app=$('#app');
function toast(msg,type='ok'){let el=$('#toast');if(!el){el=document.createElement('div');el.id='toast';document.body.append(el)}el.className=`toast ${type}`;el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),3600)}
function showLogin(message=''){
 app.innerHTML=`<div class="login-shell"><section class="login-brand"><div class="brand-mark">RE</div><span class="eyebrow">GESTÃO INTELIGENTE DE TRANSPORTE</span><h1>ROTA <span>EXPRESS</span></h1><p>Controle operacional, financeiro e acompanhamento de viagens em um só lugar.</p><div class="login-foot">PLATAFORMA DE GESTÃO • ${new Date().getFullYear()}</div></section><section class="login-panel"><form class="login-card" id="login"><span class="eyebrow gold">ÁREA RESTRITA</span><h2>Acessar plataforma</h2><p class="muted">Entre com seu e-mail e senha cadastrados.</p><label>E-mail<input name="email" type="email" autocomplete="username" required placeholder="seu@email.com"></label><label>Senha<input name="password" type="password" autocomplete="current-password" required placeholder="Sua senha"></label><button class="primary full" type="submit">Entrar no sistema</button><button class="text-button" type="button" id="forgot">Esqueci minha senha</button><p class="notice" id="login-msg">${esc(message)}</p><p class="small-note">Acesso protegido pelo Supabase Auth e pelas permissões do banco.</p></form></section></div>`;
 $('#login').addEventListener('submit',login);
 $('#forgot').addEventListener('click',forgotPassword);
}
async function login(e){e.preventDefault();const f=new FormData(e.currentTarget);const b=$('button[type=submit]',e.currentTarget);b.disabled=true;b.textContent='Verificando…';
 const {error}=await supabase.auth.signInWithPassword({email:f.get('email'),password:f.get('password')});
 if(error){$('#login-msg').textContent=error.message;b.disabled=false;b.textContent='Entrar no sistema';return}
 await boot();
}
async function forgotPassword(){const email=$('input[name=email]').value.trim();if(!email){$('#login-msg').textContent='Informe seu e-mail para receber o link.';return}
 const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:location.origin});
 $('#login-msg').textContent=error?error.message:'Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.'}
async function boot(){
 const {data:{session:s}}=await supabase.auth.getSession();session=s;
 if(!session){showLogin();return}
 const {data:p,error}=await supabase.from('profiles').select('id,full_name,role,active').eq('id',session.user.id).maybeSingle();
 if(error||!p||!p.active||p.role!=='gestor'){await supabase.auth.signOut();showLogin('Este acesso não possui perfil de gestor ativo.');return}
 profile=p;renderShell();await loadPage();
}
function renderShell(){
 const nav=Object.entries(labels).map(([key,name])=>`<button class="nav-item ${current===key?'active':''}" data-page="${key}"><span class="nav-icon">${icons[key]||'·'}</span>${name}</button>`).join('');
 app.innerHTML=`<div class="app-shell"><aside class="sidebar" id="sidebar"><div class="side-brand"><div class="brand-mark small">RE</div><div><b>ROTA <span>EXPRESS</span></b><small>GESTÃO DE TRANSPORTE</small></div></div><div class="side-label">MENU PRINCIPAL</div><nav>${`<button class="nav-item ${current==='dashboard'?'active':''}" data-page="dashboard"><span class="nav-icon">⌂</span>Visão geral</button>`}${nav}</nav><div class="side-bottom"><div class="connection"><i></i>Banco de dados conectado</div><div class="user-mini"><div class="avatar">${esc((profile.full_name||'G').slice(0,1).toUpperCase())}</div><div><b>${esc(profile.full_name)}</b><small>Gestor</small></div></div><button class="logout" id="logout">↪ Sair da conta</button></div></aside><main class="main-area"><header class="topbar"><button class="menu-toggle" id="menu">☰</button><div><div class="eyebrow gold">ROTA EXPRESS</div><div class="top-title">${labels[current]||'Visão geral'}</div></div><div class="top-right"><span class="role-pill">GESTOR</span><span class="today">${new Date().toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short',year:'numeric'})}</span></div></header><section class="content" id="content"><div class="loading">Carregando dados…</div></section></main></div><div id="modal-root"></div>`;
 $$('[data-page]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.page)));
 $('#logout').addEventListener('click',async()=>{await supabase.auth.signOut();session=null;profile=null;showLogin()});
 $('#menu').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
}
async function navigate(page){current=page;renderShell();await loadPage()}
async function query(table,select='*'){const {data,error}=await supabase.from(table).select(select).order('created_at',{ascending:false}).limit(250);if(error)throw error;cache[table]=data||[];return cache[table]}
async function loadPage(){
 const host=$('#content');host.innerHTML='<div class="loading">Consultando o banco de dados…</div>';
 try{if(current==='dashboard'){await dashboard(host);return}
  const cfg=configs[current];if(!cfg){host.innerHTML='<div class="panel empty-state">Módulo não configurado.</div>';return}
  const rows=await query(cfg.table);
  await renderTable(host,cfg,rows);
 }catch(e){host.innerHTML=`<div class="panel empty-state"><b>Não foi possível carregar os dados</b><p>${esc(e.message||e)}</p><small>Verifique sua conexão e as permissões de acesso.</small></div>`}
}
async function dashboard(host){
 const names=['drivers','trucks','trailers','trips','fuelings','trip_expenses','driver_advances','maintenance_records'];
 const results=await Promise.all(names.map(t=>supabase.from(t).select('*',{count:'exact',head:true})));
 const counts={};results.forEach((r,i)=>{if(r.error)throw r.error;counts[names[i]]=r.count||0});
 const {data:pending,error}=await supabase.from('trips').select('id,origin_city,origin_state,destination_city,destination_state,trip_date,freight_gross,status').eq('status','pendente').order('submitted_at',{ascending:false}).limit(6);if(error)throw error;
 const {data:recent}=await supabase.from('trips').select('id,origin_city,destination_city,trip_date,freight_gross,status').order('created_at',{ascending:false}).limit(5);
 host.innerHTML=`<div class="page-heading"><div><span class="eyebrow gold">RESUMO OPERACIONAL</span><h1>Bom dia, ${esc((profile.full_name||'Gestor').split(' ')[0])}</h1><p class="muted">Acompanhe os principais indicadores da operação.</p></div><button class="primary" id="new-trip">＋ Nova viagem</button></div><div class="stats-grid">${[['Motoristas',counts.drivers,'Cadastros'],['Caminhões',counts.trucks,'Veículos'],['Carretas',counts.trailers,'Implementos'],['Viagens',counts.trips,'Registros'],['Abastecimentos',counts.fuelings,'Lançamentos'],['Despesas',counts.trip_expenses,'Lançamentos'],['Adiantamentos',counts.driver_advances,'Registros'],['Manutenções',counts.maintenance_records,'Registros']].map((x,i)=>`<article class="stat-card ${i===3?'accent':''}"><span>${x[0]}</span><strong>${x[1]}</strong><small>${x[2]} no banco de dados</small></article>`).join('')}</div><div class="dashboard-grid"><section class="panel"><div class="panel-head"><div><b>Viagens aguardando aprovação</b><small>${pending.length} pendente(s)</small></div><button class="link-button" data-page="trips">Ver viagens →</button></div>${pending.length?pending.map(t=>`<div class="recent-row"><div><b>${esc(t.origin_city)} → ${esc(t.destination_city)}</b><small>${date(t.trip_date)} · ${esc(t.origin_state)} / ${esc(t.destination_state)}</small></div><div class="recent-value">${money(t.freight_gross)}<br><span class="status warning">Pendente</span></div></div>`).join(''):'<div class="empty-state compact">Nenhuma viagem aguardando aprovação.</div>'}</section><section class="panel"><div class="panel-head"><div><b>Acesso rápido</b><small>Atalhos operacionais</small></div></div><div class="quick-links">${[['drivers','♙','Cadastrar motorista'],['trucks','▣','Cadastrar caminhão'],['trailers','▤','Cadastrar carreta'],['trips','⇄','Consultar viagens'],['driver_advances','＋','Lançar adiantamento']].map(x=>`<button data-page="${x[0]}"><span>${x[1]}</span>${x[2]}<i>›</i></button>`).join('')}</div></section></div><section class="panel recent-panel"><div class="panel-head"><div><b>Viagens recentes</b><small>Últimos registros</small></div></div>${recent?.length?recent.map(t=>`<div class="recent-row"><div><b>${esc(t.origin_city)} → ${esc(t.destination_city)}</b><small>${date(t.trip_date)}</small></div><div class="recent-value">${money(t.freight_gross)}<br><span class="status">${statusName(t.status)}</span></div></div>`).join(''):'<div class="empty-state compact">Nenhuma viagem cadastrada.</div>'}</section>`;
 $('#new-trip').onclick=()=>openForm('trips');
 $$('[data-page]',host).forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.page)));
}
function statusName(s){return ({rascunho:'Rascunho',pendente:'Pendente',aprovada:'Aprovada',devolvida:'Devolvida'})[s]||s||'—'}
function fieldValue(row,key){let v=row[key];if(key==='driver_id')return row.driver?.full_name||cache.drivers?.find(x=>x.id===v)?.full_name||v?.slice(0,8)||'—';
 if(key==='trip_id')return row.trip?`${row.trip.origin_city} → ${row.trip.destination_city}`:v?.slice(0,8)||'—';
 if(key==='truck_id')return row.truck?.plate||cache.trucks?.find(x=>x.id===v)?.plate||'—';
 if(key==='trailer_id')return row.trailer?.plate||cache.trailers?.find(x=>x.id===v)?.plate||'—';
 if(key==='advance_id')return row.advance?.reference_code||v?.slice(0,8)||'—';
 if(key==='active'||key==='full_tank'||key==='arla_32_enabled')return v?'Sim':'Não';
 if(key.endsWith('_at')||key.endsWith('_date'))return date(v);
 if(key==='status'||key==='previous_status'||key==='new_status')return statusName(v);
 if(key==='freight_gross'||key==='amount'||key==='amount_applied'||key==='total_amount'||key==='unit_price')return money(v);
 if(key==='fuel_type')return ({diesel_s10:'Diesel S10',diesel_s500:'Diesel S500',arla_32:'ARLA 32'})[v]||v;
 if(key==='category')return ({alimentacao:'Alimentação',hospedagem:'Hospedagem',manutencao:'Manutenção',estacionamento:'Estacionamento',documentacao:'Documentação',outros:'Outros'})[v]||v;
 return v??'—'}
async function renderTable(host,cfg,rows){
 const title=cfg.title;let columns=cfg.cols;
 const displayRows=rows;
 host.innerHTML=`<div class="page-heading"><div><span class="eyebrow gold">CADASTROS E CONTROLES</span><h1>${title}</h1><p class="muted">${rows.length} registro(s) encontrado(s).</p></div>${cfg.readonly?'':`<button class="primary" id="add-record">＋ Novo registro</button>`}</div><div class="panel table-panel"><div class="table-scroll"><table><thead><tr>${columns.map(c=>`<th>${esc(columnLabel(c))}</th>`).join('')}${current==='trips'?'<th>Ações</th>':''}</tr></thead><tbody>${displayRows.length?displayRows.map(r=>`<tr>${columns.map(c=>`<td>${esc(fieldValue(r,c))}</td>`).join('')}${current==='trips'?`<td class="actions">${tripActions(r)}</td>`:''}</tr>`).join(''):`<tr><td colspan="${columns.length+1}"><div class="empty-state"><div class="empty-icon">⌁</div><b>Nenhum registro por enquanto</b><p>Quando houver dados cadastrados, eles aparecerão aqui.</p>${cfg.readonly?'':'<small>Use o botão “Novo registro” para começar.</small>'}</div></td></tr>`}</tbody></table></div><div class="table-foot">Dados consultados diretamente no Supabase · Exibindo até 250 registros</div></div>`;
 if(!cfg.readonly)$('#add-record').onclick=()=>openForm(current);
 $$('[data-action]').forEach(b=>b.addEventListener('click',()=>updateTrip(b.dataset.id,b.dataset.action)));
}
function columnLabel(c){return ({full_name:'Nome',cpf:'CPF',phone:'Telefone',commission_percent:'Comissão',active:'Ativo',plate:'Placa',description:'Descrição',arla_32_enabled:'ARLA 32',trip_date:'Data',driver_id:'Motorista',origin_city:'Origem',destination_city:'Destino',freight_gross:'Frete bruto',status:'Situação',fueling_at:'Data',fuel_type:'Tipo',liters:'Litros',unit_price:'Preço/L',total_amount:'Total',full_tank:'Tanque cheio',category:'Categoria',amount:'Valor',expense_at:'Data',reference_code:'Referência',advance_date:'Data',settled_at:'Data acerto',advance_id:'Adiantamento',amount_applied:'Valor aplicado',maintenance_date:'Data',truck_id:'Caminhão',trailer_id:'Carreta',next_due_date:'Próxima revisão',created_at:'Data',trip_id:'Viagem',previous_status:'Situação anterior',new_status:'Nova situação',original_name:'Arquivo',content_type:'Tipo arquivo',reason:'Motivo'})[c]||c}
function tripActions(r){if(r.status==='rascunho')return `<button class="mini-action approve" data-action="pendente" data-id="${r.id}">Enviar</button>`;if(r.status==='pendente')return `<button class="mini-action approve" data-action="aprovada" data-id="${r.id}">Aprovar</button><button class="mini-action return" data-action="devolvida" data-id="${r.id}">Devolver</button>`;return `<span class="status">${statusName(r.status)}</span>`}
async function updateTrip(id,status){let reason=null;if(status==='devolvida'){reason=prompt('Informe o motivo da devolução:');if(!reason?.trim())return}
 const update={status,updated_at:new Date().toISOString()};if(status==='pendente')update.submitted_at=new Date().toISOString();if(status==='aprovada'){update.approved_at=new Date().toISOString();update.approved_by=session.user.id}else if(status==='devolvida')update.returned_reason=reason;
 const {error}=await supabase.from('trips').update(update).eq('id',id);if(error){toast(error.message,'error');return}
 const {error:logError}=await supabase.from('trip_reviews').insert({trip_id:id,reviewer_id:session.user.id,new_status:status,reason});
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
async function openForm(key){
 const cfg=configs[key];if(!cfg||cfg.readonly)return;
 const fields=await Promise.all(cfg.fields.map(async f=>({f,opts:f[4]&&typeof f[4]==='string'&&!['15','0'].includes(f[4])?await optionData(f[4]):[]})));
 const modal=$('#modal-root');
 modal.innerHTML=`<div class="modal-backdrop"><form class="modal" id="record-form"><div class="modal-head"><div><span class="eyebrow gold">NOVO CADASTRO</span><h2>${cfg.title}</h2><p class="muted">Preencha os campos para salvar no banco de dados.</p></div><button class="close-modal" type="button" id="close-modal">×</button></div><div class="form-grid">${fields.map(({f,opts})=>renderField(f,opts)).join('')}</div><div class="modal-actions"><button class="outline" type="button" id="cancel-modal">Cancelar</button><button class="primary" type="submit">Salvar registro</button></div><p class="notice" id="form-error"></p></form></div>`;
 $('#close-modal').onclick=$('#cancel-modal').onclick=()=>modal.innerHTML='';
 $('#record-form').addEventListener('submit',e=>saveForm(e,key));
}
function renderField(f,opts){const [name,label,type,required=false,defaultValue]=f;const req=required?'required':'';
 if(type==='checkbox')return `<label class="check-field"><input type="checkbox" name="${name}" ${defaultValue?'checked':''}> ${label}</label>`;
 if(type==='textarea')return `<label class="wide">${label}<textarea name="${name}" ${req}></textarea></label>`;
 if(type==='select')return `<label>${label}<select name="${name}" ${req}><option value="">Selecione</option>${opts.map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select></label>`;
 return `<label>${label}<input name="${name}" type="${type}" ${req} ${defaultValue!==undefined&&defaultValue!==null?`value="${esc(defaultValue)}"`:''} ${type==='number'?'step="0.01" min="0"':''}></label>`;
}
async function saveForm(e,key){
 e.preventDefault();const form=e.currentTarget;const cfg=configs[key];const data={};
 for(const f of cfg.fields){const [name,,type]=f;const el=form.elements[name];if(!el)continue;let v=type==='checkbox'?el.checked:el.value;if(type==='number')v=v===''?null:Number(v);else if(v==='')v=null;data[name]=v}
 if(key==='drivers')data.commission_percent??=15;
 if(key==='trips'){data.created_by=session.user.id;data.status='rascunho';data.origin_state=data.origin_state?.toUpperCase();data.destination_state=data.destination_state?.toUpperCase()}
 if(key==='fuelings')data.total_amount=Number(data.liters||0)*Number(data.unit_price||0);
 if(['driver_advances','maintenance_records'].includes(key))data.created_by=session.user.id;
 if(key==='advance_settlements')data.created_by=session.user.id;
 if(key==='trip_expenses'&&data.expense_at)data.expense_at=new Date(data.expense_at).toISOString();
 if(key==='fuelings'&&data.fueling_at)data.fueling_at=new Date(data.fueling_at).toISOString();
 const b=$('button[type=submit]',form);b.disabled=true;b.textContent='Salvando…';
 let error=null;
 if(key==='trips'){
  const truckId=data.truck_id, trailerId=data.trailer_id;delete data.truck_id;delete data.trailer_id;
  const {data:created,error:tripError}=await supabase.from(cfg.table).insert(data).select('id').single();error=tripError;
  if(!error){const truck=cache.trucks?.find(x=>x.id===truckId) || (await supabase.from('trucks').select('id,plate').eq('id',truckId).single()).data;
   const trailer=trailerId?(cache.trailers?.find(x=>x.id===trailerId)||(await supabase.from('trailers').select('id,plate').eq('id',trailerId).single()).data):null;
   const {error:vehicleError}=await supabase.from('trip_vehicles').insert({trip_id:created.id,truck_id:truckId,trailer_id:trailerId||null,truck_plate_snapshot:truck?.plate||'—',trailer_plate_snapshot:trailer?.plate||null});
   if(vehicleError)error=new Error('Viagem criada, mas houve falha ao vincular o veículo: '+vehicleError.message);
  }
 }else {const result=await supabase.from(cfg.table).insert(data);error=result.error}
 if(error){$('#form-error').textContent=error.message||String(error);b.disabled=false;b.textContent='Salvar registro';return}
 $('#modal-root').innerHTML='';toast('Registro salvo com sucesso.');await loadPage();
}
supabase.auth.onAuthStateChange((_event,s)=>{if(!s){session=null;profile=null;showLogin()}});
showLogin();
boot();