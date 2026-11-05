// Simulador no navegador - nenhuma chamada ao hardware.
import { auth, database, authPersistenceReady } from './firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import { ref, get, set, onValue, runTransaction, serverTimestamp } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js';
const $ = id => document.getElementById(id);
let base = '', user = null, ligado = false, iniciadaEm = 0, pararComandos = null, heartbeat = null, trabalhando = false;
function status(msg) { $('status').textContent = msg; }
function registro(msg) {
  const item = document.createElement('li'); item.textContent = `${new Date().toLocaleTimeString('pt-BR')} · ${msg}`;
  const log = $('log'); if (log.children.length === 1 && log.firstElementChild.textContent === 'Nenhum comando neste teste.') log.replaceChildren();
  log.prepend(item); if (log.children.length > 30) log.lastElementChild.remove();
}
async function pulsar() {
  if (!ligado) return;
  await set(ref(database, `${base}/dispositivo/status`), { at: serverTimestamp(), modo: 'simulacao', mensagem: 'Simulador aberto no navegador · sem motor' });
}
async function processarComandos(dados) {
  if (!ligado || trabalhando || !dados) return;
  trabalhando = true;
  try {
    for (const [id, cmd] of Object.entries(dados)) {
      if (!ligado) break;
      if (!cmd || cmd.estado !== 'pendente' || cmd.tipo !== 'alimentar') continue;
      const gramas = Number(cmd.gramas);
      // Nunca reproduzir comandos antigos do banco ao abrir o simulador.
      if (!Number.isFinite(cmd.criadoEm) || cmd.criadoEm < iniciadaEm || Date.now() - cmd.criadoEm > 60000) continue;
      const comandoRef = ref(database, `${base}/comandos/${id}`);
      const tomou = await runTransaction(comandoRef, atual => {
        if (!atual || atual.estado !== 'pendente') return;
        return {...atual, estado: 'executando', mensagem: 'Simulador processando'};
      }, {applyLocally:false});
      if (!tomou.committed) continue;
      registro(`Comando recebido: ${gramas} g para o pet ${cmd.petId || 'não definido'}.`);
      const valido = Number.isInteger(gramas) && gramas >= 1 && gramas <= 150;
      await set(comandoRef, {...tomou.snapshot.val(), estado: valido ? 'concluido' : 'erro', simulacao: true,
        mensagem: valido ? 'Teste confirmado: nenhum motor acionado' : 'Quantidade fora de 1–150 g'});
      registro(valido ? '✅ Simulação confirmada no Firebase. Nenhum motor foi acionado.' : '⛔ Comando recusado: quantidade inválida.');
      // Um comando de cada vez; novas notificações entregam os próximos.
    }
  } catch (e) { registro('Erro ao processar: ' + e.message); status('Erro: ' + e.message); }
  finally { trabalhando = false; }
}
async function iniciar() {
  if (!user || ligado) return;
  $('ligar').disabled = true;
  status('Ativando modo de testes no Firebase...');
  try {
    const currentUid = (await get(ref(database, `${base}/dispositivo/uid`))).val();
    if (currentUid && currentUid !== user.uid) {
      const ok = confirm('Há um ESP32 vinculado a esta conta. Ativar o simulador substituirá temporariamente esse vínculo. Continuar?');
      if (!ok) { $('ligar').disabled=false; status('Simulador não iniciado.'); return; }
    }
    await set(ref(database, `${base}/dispositivo/uid`), user.uid);
    iniciadaEm = Date.now(); ligado = true;
    await pulsar();
    pararComandos = onValue(ref(database, `${base}/comandos`), snap => processarComandos(snap.val()), err => status('Erro de leitura: ' + err.message));
    heartbeat = setInterval(() => pulsar().catch(err => status('Falha no status: ' + err.message)), 15000);
    $('desligar').disabled = false; status('🟢 Simulador ativo · volte à Visão geral e envie um comando.');
    registro('Simulador iniciado. Agora envie um comando na aba do site.');
  } catch (e) { ligado = false; $('ligar').disabled = false; status('Não foi possível iniciar: ' + e.message); }
}
async function desligar() {
  if (!ligado) return;
  ligado = false; clearInterval(heartbeat); if (pararComandos) pararComandos();
  $('desligar').disabled = true; $('ligar').disabled = false;
  try {
    await set(ref(database, `${base}/dispositivo/status`), {at:0, modo:'simulacao', mensagem:'Simulador desligado'});
    // Não remover o UID automaticamente: o tutor ainda pode usar o site e mudar o vínculo manualmente.
  } catch(e) { registro('Aviso ao encerrar: ' + e.message); }
  status('⚪ Simulador parado · não recebe comandos.'); registro('Simulador encerrado.');
}
$('ligar').addEventListener('click', iniciar);
$('desligar').addEventListener('click', desligar);
await authPersistenceReady;
onAuthStateChanged(auth, u => {
  if (!u) { status('Você precisa entrar com sua conta no NinaPets primeiro.'); $('conta').textContent = 'Sessão não encontrada. Abra o Login em outra aba.'; $('ligar').disabled = true; return; }
  user = u; base = `usuarios/${u.uid}/ninapets`;
  $('conta').textContent = `Conta conectada: ${u.email || 'UID ' + u.uid.slice(0,8)}`;
  $('ligar').disabled = false; status('Pronto para iniciar o teste.');
});
