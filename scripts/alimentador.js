import { auth, database } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import { ref, get, set, push, onValue } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js";

const $ = (id) => document.getElementById(id);
let uid = null;
let baseUsuario = "";
let baseConta = "";
let pets = {};
let petIdAtivo = null;
let emailConta = "";
let perfil = null;
let horarios = [];
let historico = [];
let ultimaRefeicao = null;
let intervalo = 8;
let editandoId = null;
let quantidadeManual = 0;

function mostrarMensagem(id, texto, erro = false) {
  const elemento = $(id);
  if (!elemento) return;
  elemento.textContent = texto;
  elemento.style.color = erro ? "#b34e43" : "#477b58";
}
function cacheKey(chave) { return `ninapets_${uid}_${chave}`; }
function lerCache(chave, padrao) {
  try { return JSON.parse(localStorage.getItem(cacheKey(chave)) ?? "null") ?? padrao; }
  catch { return padrao; }
}
function gravarCache(chave, valor) {
  try { localStorage.setItem(cacheKey(chave), JSON.stringify(valor)); } catch (erro) { console.warn("Cache local indisponível", erro); }
}
async function salvarNuvem(chave, valor, mensagemId = null) {
  gravarCache(chave, valor);
  try {
    await set(ref(database, `${baseUsuario}/${chave}`), valor);
    return true;
  } catch (erro) {
    console.error(`Falha ao salvar ${chave} no Firebase:`, erro);
    if (mensagemId) mostrarMensagem(mensagemId, "Não foi possível sincronizar com o Firebase. Confira sua conexão e as regras do banco.", true);
    return false;
  }
}
function emojiAnimal(especie) {
  return ({ "Cachorro":"🐶", "Gato":"🐱", "Pássaro":"🐦", "Coelho":"🐰", "Hamster":"🐹", "Porquinho-da-índia":"🐹", "Tartaruga":"🐢", "Peixe":"🐠", "Furão":"🦦", "Outro":"🐾" })[especie] || "🐾";
}
function atualizarIdentidadePet() {
  const ilustracao = document.querySelector(".pet-ilustracao");
  const titulo = document.querySelector(".boas-vindas h1");
  if (ilustracao) ilustracao.textContent = emojiAnimal(perfil?.especie);
  if (titulo) {
    titulo.textContent = "";
    titulo.append(document.createTextNode(perfil?.nome ? `O cuidado de ${perfil.nome}, ` : "O cuidado do seu pet, "));
    const destaque = document.createElement("span"); destaque.textContent = "mais simples."; titulo.append(destaque);
  }
}
function preencherPerfil() {
  if (!$('formPet') || !perfil) return;
  $("nomePet").value = perfil.nome || "";
  $("especiePet").value = perfil.especie || "Cachorro";
  $("idadePet").value = perfil.idade || "";
  $("pesoPet").value = perfil.peso || "";
  if ($("portePet")) $("portePet").value = perfil.porte || "";
  if ($("energiaRacao")) $("energiaRacao").value = perfil.energiaRacao || "";
  if ($("refeicoesDia")) $("refeicoesDia").value = perfil.refeicoesDia || 2;
  if ($("fatorEnergetico")) $("fatorEnergetico").value = perfil.fatorEnergetico || (perfil.especie === "Gato" ? "1.2" : "1.6");
  $("observacoesPet").value = perfil.observacoes || "";
  atualizarCalculadoraRacao();
  atualizarIdentidadePet();
}
function atualizarCalculadoraRacao() {
  const resultado = $("resultadoRacao");
  if (!resultado) return;
  const peso = Number($("pesoPet")?.value || perfil?.peso || 0);
  const kcal100 = Number($("energiaRacao")?.value || perfil?.energiaRacao || 0);
  const refeicoes = Number($("refeicoesDia")?.value || perfil?.refeicoesDia || 2);
  const especie = $("especiePet")?.value || perfil?.especie || "";
  const fator = Number($("fatorEnergetico")?.value || (especie === "Gato" ? 1.2 : 1.6));
  if (!peso || !kcal100) {
    resultado.textContent = "Preencha o peso do pet e a energia da ração para ver uma estimativa.";
    return;
  }
  if (!["Cachorro", "Gato"].includes(especie)) {
    resultado.textContent = "A calculadora simplificada está disponível apenas para cães e gatos adultos. Para outras espécies, consulte um veterinário ou especialista da espécie.";
    return;
  }
  if (refeicoes < 1 || refeicoes > 12 || kcal100 < 1) {
    resultado.textContent = "Confira a energia da ração e informe de 1 a 12 refeições por dia.";
    return;
  }
  const rer = 70 * Math.pow(peso, 0.75);
  const kcalDia = rer * fator;
  const gramasDia = kcalDia / (kcal100 / 100);
  const gramasRefeicao = gramasDia / refeicoes;
  resultado.textContent = `Estimativa ilustrativa: cerca de ${Math.round(gramasDia)} g por dia, divididos em ${refeicoes} refeições de aproximadamente ${Math.round(gramasRefeicao)} g cada. Necessidade energética estimada: ${Math.round(kcalDia)} kcal/dia.`;
}

function atualizarResumo() {
  if ($("totalHorarios")) $("totalHorarios").textContent = `${horarios.length} ${horarios.length === 1 ? "refeição" : "refeições"}`;
  if ($("totalManuais")) $("totalManuais").textContent = `${quantidadeManual} registradas`;
  if ($("proximaRefeicao")) {
    const agora = new Date();
    const proximos = horarios.map(h => { const [hora, minuto] = h.hora.split(":").map(Number); const data = new Date(); data.setHours(hora, minuto, 0, 0); if (data <= agora) data.setDate(data.getDate() + 1); return data; }).sort((a,b) => a-b);
    $("proximaRefeicao").textContent = proximos.length ? proximos[0].toLocaleTimeString("pt-BR", {hour:"2-digit", minute:"2-digit"}) : "Nenhuma programada";
  }
}
function resetarFormularioHorario() {
  editandoId = null;
  if (!$('formHorario')) return;
  $("horario").value = "08:00"; $("gramasHorario").value = "50";
  const botao = $("formHorario").querySelector("button[type=submit]");
  botao.textContent = "＋"; botao.setAttribute("aria-label", "Adicionar horário");
  $("cancelarEdicao")?.remove();
}
function renderizarHorarios() {
  if (!$('listaHorarios')) return;
  const lista = $("listaHorarios"); lista.innerHTML = "";
  if ($("contadorAgenda")) $("contadorAgenda").textContent = `${horarios.length} ${horarios.length === 1 ? "item" : "itens"}`;
  if (!horarios.length) lista.innerHTML = '<li class="vazio">Nenhum horário cadastrado.</li>';
  [...horarios].sort((a,b) => a.hora.localeCompare(b.hora)).forEach(item => {
    const li = document.createElement("li"); li.className = "item-horario";
    const info = document.createElement("div"); info.className = "horario-info";
    const icon = document.createElement("span"); icon.className = "relogio-icone"; icon.textContent = "⏰";
    const texto = document.createElement("div"); const hora = document.createElement("strong"); hora.textContent = item.hora;
    const detalhe = document.createElement("small"); detalhe.textContent = `${item.gramas} g de ração`; texto.append(hora, detalhe); info.append(icon, texto);
    const acoes = document.createElement("div"); acoes.className = "acoes-horario";
    const editar = document.createElement("button"); editar.type = "button"; editar.className = "btn-editar"; editar.textContent = "Editar";
    editar.addEventListener("click", () => {
      editandoId = item.id; $("horario").value = item.hora; $("gramasHorario").value = item.gramas;
      const submit = $("formHorario").querySelector("button[type=submit]"); submit.textContent = "✓"; submit.setAttribute("aria-label", "Salvar edição");
      if (!$('cancelarEdicao')) { const cancelar = document.createElement("button"); cancelar.id = "cancelarEdicao"; cancelar.type = "button"; cancelar.className = "btn-filtro"; cancelar.textContent = "Cancelar edição"; cancelar.addEventListener("click", resetarFormularioHorario); $("formHorario").append(cancelar); }
      mostrarMensagem("mensagemHorario", `Editando a refeição das ${item.hora}.`); $("horario").focus();
    });
    const remover = document.createElement("button"); remover.type = "button"; remover.className = "btn-remover"; remover.textContent = "Remover";
    remover.addEventListener("click", async () => { horarios = horarios.filter(h => h.id !== item.id); await salvarNuvem("horarios", horarios, "mensagemHorario"); if (editandoId === item.id) resetarFormularioHorario(); renderizarHorarios(); });
    acoes.append(editar, remover); li.append(info, acoes); lista.append(li);
  });
  atualizarResumo();
}
function renderizarHistorico() {
  if (!$('historico')) return;
  const lista = $("historico"); lista.innerHTML = "";
  const filtro = $("filtroData")?.value || "";
  const itens = historico.filter(item => !filtro || item.dataISO === filtro).sort((a,b) => b.timestamp - a.timestamp);
  if ($("resumoHistorico")) $("resumoHistorico").textContent = filtro ? `${itens.length} registro(s) em ${new Date(`${filtro}T12:00:00`).toLocaleDateString("pt-BR")}.` : `${historico.length} registro(s) salvos na sua conta.`;
  if (!itens.length) { lista.innerHTML = '<li class="vazio">Nenhuma alimentação encontrada para esta consulta.</li>'; return; }
  itens.slice(0, 100).forEach(item => {
    const li = document.createElement("li"); li.className = "item-historico"; const emoji = document.createElement("span"); emoji.className = "historico-icone"; emoji.textContent = item.tipo === "manual" ? "🥣" : "🗓️";
    const texto = document.createElement("div"); const strong = document.createElement("strong"); strong.textContent = item.titulo;
    const small = document.createElement("small"); small.textContent = `${item.detalhe} • ${item.hora}`; const data = document.createElement("span"); data.className = "historico-data"; data.textContent = new Date(`${item.dataISO}T12:00:00`).toLocaleDateString("pt-BR");
    texto.append(strong, small, data); li.append(emoji, texto); lista.append(li);
  });
}
async function adicionarHistorico(tipo, titulo, detalhe) {
  const agora = new Date();
  historico.push({ tipo, titulo, detalhe, timestamp: agora.getTime(), dataISO: `${agora.getFullYear()}-${String(agora.getMonth()+1).padStart(2,"0")}-${String(agora.getDate()).padStart(2,"0")}`, hora: agora.toLocaleTimeString("pt-BR", {hour:"2-digit", minute:"2-digit"}) });
  historico = historico.slice(-500); await salvarNuvem("historico", historico); renderizarHistorico();
}
function atualizarPrevisao() {
  if (!$('previsaoRefeicao')) return;
  if (!ultimaRefeicao) { $("ultimaRefeicao").textContent = "Ainda não há uma refeição registrada."; $("previsaoRefeicao").textContent = "Registre uma refeição para calcular a próxima previsão."; return; }
  const data = new Date(ultimaRefeicao); const proxima = new Date(data.getTime() + intervalo * 3600000);
  $("intervaloHoras").value = intervalo;
  $("ultimaRefeicao").textContent = `Última refeição registrada: ${data.toLocaleString("pt-BR", {dateStyle:"short", timeStyle:"short"})}.`;
  $("previsaoRefeicao").textContent = `Previsão da próxima refeição: ${proxima.toLocaleString("pt-BR", {dateStyle:"short", timeStyle:"short"})}.`;
}
function novoIdPet() { return `pet-${Date.now()}-${Math.random().toString(16).slice(2,8)}`; }
function limparFormularioPet() {
  perfil = null;
  if ($("formPet")) {
    ["nomePet","idadePet","pesoPet","observacoesPet","energiaRacao"].forEach(id => { if ($(id)) $(id).value = ""; });
    if ($("especiePet")) $("especiePet").value = "Cachorro";
    if ($("portePet")) $("portePet").value = "";
    if ($("refeicoesDia")) $("refeicoesDia").value = 2;
    if ($("fatorEnergetico")) $("fatorEnergetico").value = "1.6";
    atualizarCalculadoraRacao(); atualizarIdentidadePet();
  }
}
function mascararEmail(email) {
  if (!email || !email.includes("@")) return "Conta autenticada";
  const [usuario, dominio] = email.split("@");
  return `${usuario.slice(0,1)}${"•".repeat(Math.max(3, Math.min(usuario.length - 1, 8)))}@${dominio}`;
}
function mostrarModalConta(usuario) {
  emailConta = usuario.email || "";
  let modal = $("modalContaNina");
  if (!modal) {
    modal = document.createElement("div"); modal.id = "modalContaNina"; modal.className = "modal-conta";
    modal.innerHTML = `<section class="modal-conta-card" role="dialog" aria-modal="true" aria-labelledby="tituloConta"><button class="modal-fechar" type="button" aria-label="Fechar">×</button><div class="modal-avatar">👤</div><span class="eyebrow">SUA CONTA NINAPETS</span><h2 id="tituloConta">Você está conectado!</h2><p class="modal-email"></p><p class="modal-ajuda">Seus pets e registros ficam salvos nesta conta.</p><button class="btn-principal modal-ok" type="button">Continuar</button><button class="modal-trocar" type="button">Entrar com outra conta</button></section>`;
    document.body.append(modal);
    modal.querySelector(".modal-fechar").addEventListener("click", () => modal.classList.remove("visivel"));
    modal.querySelector(".modal-ok").addEventListener("click", () => modal.classList.remove("visivel"));
    modal.addEventListener("click", e => { if (e.target === modal) modal.classList.remove("visivel"); });
    modal.querySelector(".modal-trocar").addEventListener("click", async () => { await signOut(auth); window.ninaNavigate ? window.ninaNavigate("login.html") : (window.location.href = "login.html"); });
  }
  modal.querySelector(".modal-email").textContent = mascararEmail(emailConta);
  modal.classList.add("visivel");
}
function configurarContaNaTela(usuario) {
  const actions = document.querySelector(".top-actions");
  if (!actions) return;
  let botao = $("btnContaNina");
  if (!botao) { botao = document.createElement("button"); botao.id = "btnContaNina"; botao.type = "button"; botao.className = "btn-conta"; botao.innerHTML = '<span>👤</span><span class="email-mascarado"></span>'; actions.insertBefore(botao, $("btnSair")); botao.addEventListener("click", () => mostrarModalConta(auth.currentUser || usuario)); }
  botao.querySelector(".email-mascarado").textContent = mascararEmail(usuario.email);
  if (!sessionStorage.getItem("ninapets_conta_apresentada")) { sessionStorage.setItem("ninapets_conta_apresentada", "1"); mostrarModalConta(usuario); }
}
function renderizarSeletorPets() {
  const nav = document.querySelector(".menu-paginas"); if (!nav) return;
  let area = $("seletorPetAtivo");
  if (!area) { area = document.createElement("div"); area.id = "seletorPetAtivo"; area.className = "seletor-pet-ativo"; nav.insertAdjacentElement("afterend", area); }
  const opcoes = Object.entries(pets).map(([id, item]) => `<option value="${id}">${String(item.pet?.nome || "Pet sem nome").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}</option>`).join("");
  area.innerHTML = `<label for="trocarPetNina">🐾 Pet selecionado</label><select id="trocarPetNina">${opcoes}</select><a href="perfil-pet.html#novo" class="link-gerenciar-pets">+ Gerenciar pets</a>`;
  const select = $("trocarPetNina"); select.value = petIdAtivo || "";
  select.addEventListener("change", async () => { petIdAtivo = select.value; await set(ref(database, `${baseConta}/config/animalAtivo`), petIdAtivo); window.ninaReload ? window.ninaReload() : window.location.reload(); });
}
function renderizarListaPets() {
  const lista = $("listaPerfisPets"); if (!lista) return;
  lista.innerHTML = "";
  const itens = Object.entries(pets);
  if (!itens.length) { lista.innerHTML = '<p class="vazio">Você ainda não cadastrou nenhum animal. Use o formulário abaixo para começar.</p>'; return; }
  itens.forEach(([id, dados]) => {
    const pet = dados.pet || {}; const card = document.createElement("article"); card.className = `cartao-pet-salvo ${id === petIdAtivo ? "pet-selecionado" : ""}`;
    const avatar = document.createElement("div"); avatar.className = "avatar-pet-salvo"; avatar.textContent = emojiAnimal(pet.especie);
    const info = document.createElement("div"); info.className = "info-pet-salvo"; const nome = document.createElement("strong"); nome.textContent = pet.nome || "Pet sem nome"; const detalhe = document.createElement("small"); detalhe.textContent = [pet.especie, pet.porte, pet.peso ? `${pet.peso} kg` : ""].filter(Boolean).join(" • "); info.append(nome, detalhe);
    const acoes = document.createElement("div"); acoes.className = "acoes-pet-salvo";
    const abrir = document.createElement("button"); abrir.type = "button"; abrir.textContent = id === petIdAtivo ? "Selecionado" : "Abrir perfil"; abrir.className = "btn-editar"; abrir.disabled = id === petIdAtivo; abrir.addEventListener("click", async () => { petIdAtivo = id; await set(ref(database, `${baseConta}/config/animalAtivo`), id); window.ninaReload ? window.ninaReload() : window.location.reload(); });
    const excluir = document.createElement("button"); excluir.type = "button"; excluir.textContent = "Excluir"; excluir.className = "btn-remover"; excluir.addEventListener("click", async () => { if (!confirm(`Excluir o perfil de ${pet.nome || "este pet"} e seus horários e histórico?`)) return; await set(ref(database, `${baseConta}/animais/${id}`), null); delete pets[id]; if (petIdAtivo === id) { petIdAtivo = Object.keys(pets)[0] || null; await set(ref(database, `${baseConta}/config/animalAtivo`), petIdAtivo); } if (!petIdAtivo) { petIdAtivo = novoIdPet(); baseUsuario = `${baseConta}/animais/${petIdAtivo}`; await set(ref(database, baseUsuario), { pet: null, horarios: [], historico: [], intervalo: 8 }); pets[petIdAtivo] = {pet:null,horarios:[],historico:[],intervalo:8}; } renderizarListaPets(); renderizarSeletorPets(); window.ninaReload ? window.ninaReload() : window.location.reload(); });
    acoes.append(abrir, excluir); card.append(avatar, info, acoes); lista.append(card);
  });
}
async function carregarDadosDaConta(usuario) {
  uid = usuario.uid; baseConta = `usuarios/${uid}/ninapets`;
  const snapshot = await get(ref(database, baseConta)); let dados = snapshot.exists() ? snapshot.val() : {};
  if (!dados.animais || !Object.keys(dados.animais).length) {
    // Migra somente dados que já estavam no nó Firebase desta conta.
    // Nunca importar chaves antigas do localStorage: elas eram compartilhadas
    // pelo navegador e podiam copiar o pet de uma pessoa para outra conta.
    if (dados.pet || dados.horarios || dados.historico || dados.ultimaRefeicao) {
      const legado = {
        pet: dados.pet || null,
        horarios: Array.isArray(dados.horarios) ? dados.horarios : [],
        historico: Array.isArray(dados.historico) ? dados.historico : [],
        ultimaRefeicao: dados.ultimaRefeicao || null,
        intervalo: Number(dados.intervalo || 8)
      };
      const id = novoIdPet();
      dados.animais = { [id]: legado };
      dados.config = { ...(dados.config || {}), animalAtivo: id };
      await set(ref(database, baseConta), { animais: dados.animais, config: dados.config });
    } else {
      // Conta nova: começa sem pets cadastrados, sem herdar dados do navegador.
      dados.animais = {};
      dados.config = dados.config || {};
    }
  }
  pets = dados.animais || {}; petIdAtivo = dados.config?.animalAtivo;
  if (!petIdAtivo || !pets[petIdAtivo]) petIdAtivo = Object.keys(pets)[0];
  if (!petIdAtivo) { petIdAtivo = novoIdPet(); pets[petIdAtivo] = { pet: null, horarios: [], historico: [], intervalo: 8 }; await set(ref(database, `${baseConta}/animais/${petIdAtivo}`), pets[petIdAtivo]); }
  await set(ref(database, `${baseConta}/config/animalAtivo`), petIdAtivo);
  baseUsuario = `${baseConta}/animais/${petIdAtivo}`;
  const petSnap = await get(ref(database, baseUsuario)); const atual = petSnap.exists() ? petSnap.val() : {};
  perfil = atual.pet || null; horarios = Array.isArray(atual.horarios) ? atual.horarios : []; historico = Array.isArray(atual.historico) ? atual.historico : [];
  ultimaRefeicao = atual.ultimaRefeicao || null; intervalo = Number(atual.intervalo || 8);
  preencherPerfil(); renderizarHorarios(); renderizarHistorico(); atualizarResumo(); atualizarPrevisao(); renderizarListaPets(); renderizarSeletorPets(); configurarContaNaTela(usuario);
}

["pesoPet", "energiaRacao", "refeicoesDia", "fatorEnergetico"].forEach(id => $(id)?.addEventListener("input", atualizarCalculadoraRacao));
$("especiePet")?.addEventListener("change", () => {
  if ($("fatorEnergetico")) $("fatorEnergetico").value = $("especiePet").value === "Gato" ? "1.2" : "1.6";
  atualizarCalculadoraRacao();
});
if ($("calcularRacao")) $("calcularRacao").addEventListener("click", () => {
  atualizarCalculadoraRacao();
  if (perfil) {
    perfil.energiaRacao = Number($("energiaRacao").value || 0) || "";
    perfil.refeicoesDia = Number($("refeicoesDia").value || 2);
    salvarNuvem("pet", perfil);
  }
});
if ($("formPet")) $("formPet").addEventListener("submit", async event => {
  event.preventDefault(); const nome = $("nomePet").value.trim(); const peso = $("pesoPet").value;
  if (!nome) { mostrarMensagem("mensagemPet", "Informe o nome do seu pet.", true); return; }
  perfil = { nome, especie: $("especiePet").value, idade: $("idadePet").value.trim(), peso: peso ? Number(peso) : "", porte: $("portePet")?.value || "", energiaRacao: $("energiaRacao")?.value ? Number($("energiaRacao").value) : "", refeicoesDia: Number($("refeicoesDia")?.value || 2), fatorEnergetico: $("fatorEnergetico")?.value || ($( "especiePet").value === "Gato" ? "1.2" : "1.6"), observacoes: $("observacoesPet").value.trim() };
  const salvo = await salvarNuvem("pet", perfil, "mensagemPet"); atualizarIdentidadePet();
  if (salvo) { pets[petIdAtivo] = { ...(pets[petIdAtivo] || {}), pet: perfil }; renderizarListaPets(); renderizarSeletorPets(); mostrarMensagem("mensagemPet", "Perfil salvo! Os dados e o histórico deste animal ficam separados dos outros pets da sua conta."); }
});
if ($("novoPetBtn")) $("novoPetBtn").addEventListener("click", async () => {
  petIdAtivo = novoIdPet(); baseUsuario = `${baseConta}/animais/${petIdAtivo}`;
  perfil = null; horarios = []; historico = []; ultimaRefeicao = null; intervalo = 8;
  await set(ref(database, `${baseConta}/config/animalAtivo`), petIdAtivo);
  await set(ref(database, baseUsuario), { pet: null, horarios: [], historico: [], intervalo: 8 });
  pets[petIdAtivo] = { pet: null, horarios: [], historico: [], intervalo: 8 };
  limparFormularioPet(); renderizarListaPets(); renderizarSeletorPets();
  mostrarMensagem("mensagemPet", "Novo perfil iniciado. Preencha os dados e salve para cadastrar este animal.");
  $("nomePet")?.focus(); window.scrollTo({ top: 0, behavior: "smooth" });
});

if ($("formHorario")) $("formHorario").addEventListener("submit", async event => {
  event.preventDefault(); const hora = $("horario").value; const gramas = Number($("gramasHorario").value);
  if (!hora || !Number.isInteger(gramas) || gramas < 1 || gramas > 500) { mostrarMensagem("mensagemHorario", "Informe um horário e uma quantidade entre 1 e 500 g.", true); return; }
  if (horarios.some(h => h.hora === hora && h.id !== editandoId)) { mostrarMensagem("mensagemHorario", "Já existe uma refeição cadastrada nesse horário.", true); return; }
  if (editandoId) horarios = horarios.map(h => h.id === editandoId ? {...h, hora, gramas} : h);
  else horarios.push({ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, hora, gramas });
  const salvo = await salvarNuvem("horarios", horarios, "mensagemHorario"); resetarFormularioHorario(); renderizarHorarios();
  if (salvo) {
    mostrarMensagem("mensagemHorario", "Horário salvo no Firebase. A alimentação automática por horários ainda não está ativada no ESP32.");
  }
});
// Comandos na nuvem: só o usuário autenticado pode solicitar alimentação.
let dispositivoUID = "";
let pararStatusDispositivo = null;
let pararVinculoDispositivo = null;
function montarPainelESP32() {
  if (!$('btnLiberar') || $('painelESP32')) return;
  const painel = document.createElement('section');
  painel.id = 'painelESP32'; painel.className = 'cartao painel-dispositivo';
  painel.innerHTML = `<h2>📡 Conectar alimentador ESP32</h2>
    <p>Seu ESP32 usa o Firebase para receber comandos mesmo fora da rede Wi-Fi do celular.</p>
    <label for="esp32Uid">UID do dispositivo (aparece no Monitor Serial)</label>
    <input id="esp32Uid" type="text" placeholder="Cole o UID do ESP32" autocomplete="off" />
    <button id="salvarEsp32" class="btn-principal" type="button">Vincular ESP32 à minha conta</button>
    <p id="esp32Situacao" role="status">Nenhum ESP32 vinculado.</p>
    <div class="bloco-simulador"><strong>🧪 Testar sem montar o motor</strong>
      <p>Abra o simulador em outra aba para testar a ponte site → Firebase → confirmação. Ele não movimenta nenhum motor.</p>
      <a class="btn-principal link-simulador" href="simulador.html" target="_blank" rel="noopener">Abrir simulador de alimentador</a>
    </div>
    <details><summary>Configuração do firmware ESP32</summary><p>Informe o UID da conta no código do ESP32: <strong id="esp32ContaUid"></strong>. O UID do dispositivo será exibido no Monitor Serial. Vincule-o acima para ativar os comandos.</p></details>`;
  $('btnLiberar').closest('section, article, .card, .cartao')?.after(painel) || $('btnLiberar').parentElement.append(painel);
  $('esp32ContaUid').textContent = uid;
  $('esp32Uid').value = dispositivoUID;
  $('salvarEsp32').addEventListener('click', async () => {
    const novo = $('esp32Uid').value.trim();
    if (!/^[A-Za-z0-9_-]{12,128}$/.test(novo)) { $('esp32Situacao').textContent = 'UID inválido. Copie o valor exibido no Monitor Serial.'; return; }
    try {
      await set(ref(database, `${baseConta}/dispositivo/uid`), novo);
      dispositivoUID = novo; acompanharESP32();
    } catch(e) { $('esp32Situacao').textContent = 'Erro ao vincular: ' + e.message; }
  });
  acompanharESP32();
}
function acompanharESP32() {
  if (pararStatusDispositivo) pararStatusDispositivo();
  const situacao = $('esp32Situacao');
  if (!situacao) return;
  if (!dispositivoUID) { situacao.textContent = 'Nenhum ESP32 vinculado.'; return; }
  pararStatusDispositivo = onValue(ref(database, `${baseConta}/dispositivo/status`), snapshot => {
    const estado = snapshot.val();
    if (!estado?.at) {
      situacao.textContent = estado?.modo === 'simulacao' ? '⚪ Simulador desligado. Abra a aba de testes e clique em Iniciar simulação.' : 'Vinculado. Aguardando o primeiro sinal do ESP32.';
      return;
    }
    const online = Date.now() - Number(estado.at) < 45000;
    const origem = estado.modo === 'simulacao' ? '🧪 SIMULAÇÃO (nenhum motor acionado)' : 'ESP32 físico';
    situacao.textContent = `${online ? '🟢 Online' : '🟠 Sem sinal recente'} · ${origem} · ${estado.mensagem || 'Aguardando'} · Último sinal: ${new Date(estado.at).toLocaleTimeString('pt-BR')}`;
  }, () => { situacao.textContent = 'Não foi possível consultar o status do ESP32.'; });
}
if ($("btnLiberar")) $("btnLiberar").addEventListener("click", async () => {
  const gramas = Number($("quantidade").value);
  if (!Number.isInteger(gramas) || gramas < 1 || gramas > 150) { mostrarMensagem("mensagemManual", "Informe uma quantidade entre 1 e 150 gramas (limite de segurança do protótipo).", true); return; }
  if (!dispositivoUID) { mostrarMensagem('mensagemManual', 'Vincule seu ESP32 antes de solicitar uma alimentação real.', true); return; }
  const botao = $('btnLiberar'); botao.disabled = true;
  try {
    const comando = push(ref(database, `${baseConta}/comandos`));
    await set(comando, { tipo: 'alimentar', petId: petIdAtivo, gramas, criadoEm: Date.now(), estado: 'pendente' });
    mostrarMensagem('mensagemManual', 'Comando enviado ao Firebase. Aguardando confirmação do ESP32...');
    const cancelar = onValue(comando, async snapshot => {
      const valor = snapshot.val();
      if (valor?.estado === 'concluido' || valor?.estado === 'erro') {
        cancelar(); botao.disabled = false;
        if (valor.estado === 'concluido') {
          if (valor.simulacao === true) {
            mostrarMensagem('mensagemManual', '🧪 Teste concluído! Firebase recebeu e confirmou o comando em MODO SIMULAÇÃO. Nenhuma ração foi liberada e o histórico real não foi alterado.');
          } else {
            quantidadeManual++;
            await adicionarHistorico('manual', 'ESP32 confirmou movimento do servo', `${gramas} g solicitados · quantidade real não verificada por sensor`);
            atualizarResumo();
            mostrarMensagem('mensagemManual', 'ESP32 confirmou o movimento do servo. Confira a quantidade real de ração: sem balança o peso não é verificado.');
          }
        } else mostrarMensagem('mensagemManual', `Alimentador informou erro: ${valor.mensagem || 'falha no acionamento'}`, true);
      }
    });
    setTimeout(() => { if (botao.disabled) { cancelar(); botao.disabled = false; mostrarMensagem('mensagemManual', 'Sem confirmação em 60 segundos. Consulte o status do dispositivo antes de tentar novamente.', true); } }, 60000);
  } catch (erro) { botao.disabled = false; mostrarMensagem('mensagemManual', `Falha ao enviar comando: ${erro.message}`, true); }
});

document.querySelectorAll("[data-gramas]").forEach(botao => botao.addEventListener("click", () => { $("quantidade").value = botao.dataset.gramas; document.querySelectorAll("[data-gramas]").forEach(b => b.classList.toggle("selecionado", b === botao)); }));
if ($("filtroData")) $("filtroData").addEventListener("change", renderizarHistorico);
if ($("limparFiltro")) $("limparFiltro").addEventListener("click", () => { $("filtroData").value = ""; renderizarHistorico(); });
if ($("salvarIntervalo")) $("salvarIntervalo").addEventListener("click", async () => {
  const horas = Number($("intervaloHoras").value);
  if (!Number.isInteger(horas) || horas < 1 || horas > 48) { mostrarMensagem("previsaoRefeicao", "Escolha um intervalo entre 1 e 48 horas.", true); return; }
  intervalo = horas; const salvo = await salvarNuvem("intervalo", intervalo, "previsaoRefeicao"); atualizarPrevisao(); if (salvo) mostrarMensagem("previsaoRefeicao", "Intervalo salvo na sua conta. " + $("previsaoRefeicao").textContent);
});
if ($("registrarComeu")) $("registrarComeu").addEventListener("click", async () => {
  ultimaRefeicao = new Date().toISOString(); await salvarNuvem("ultimaRefeicao", ultimaRefeicao); await adicionarHistorico("manual", "Tutor registrou uma refeição", "Pet comeu • registro manual"); atualizarPrevisao();
});
if ($("btnSair")) $("btnSair").addEventListener("click", async () => { try { await signOut(auth); } catch (erro) { console.error("Erro ao sair:", erro); } window.ninaNavigate ? window.ninaNavigate("login.html") : (window.location.href = "login.html"); });

const paginaAtual = document.body.dataset.page;
const textosPagina = {
  perfil: ["PRIMEIRO PASSO", "Vamos conhecer seu pet!", "Comece por aqui: cadastre seu companheiro. Depois, organize os horários e acompanhe as refeições."],
  painel: ["VISÃO GERAL", "Tudo sobre a rotina do seu pet", "Acompanhe os próximos horários e os registros de alimentação."],
  agenda: ["ROTINA DE ALIMENTAÇÃO", "Organize os horários", "Defina quando e quanto seu pet deve comer. Você pode alterar ou remover os horários quando quiser."],
  historico: ["ACOMPANHAMENTO", "Veja o histórico", "Consulte os registros de alimentação e filtre por dia para acompanhar a rotina do seu pet."]
};
if (textosPagina[paginaAtual]) {
  const [etiqueta,titulo,descricao] = textosPagina[paginaAtual]; const cabecalho = document.createElement("section"); cabecalho.className = "page-heading";
  const eyebrow = document.createElement("span"); eyebrow.className = "eyebrow"; eyebrow.textContent = etiqueta; const h1 = document.createElement("h1"); h1.textContent = titulo; const p = document.createElement("p"); p.textContent = descricao;
  cabecalho.append(eyebrow,h1,p); document.querySelector("main.container")?.prepend(cabecalho);
}
document.querySelectorAll("[data-nav]").forEach(link => { if (link.dataset.nav === paginaAtual) { link.classList.add("ativo"); link.setAttribute("aria-current","page"); } });

onAuthStateChanged(auth, async usuario => {
  if (!usuario) { window.ninaNavigate ? window.ninaNavigate("login.html") : (window.location.href = "login.html"); return; }
  try {
    await carregarDadosDaConta(usuario);
    const d = await get(ref(database, `${baseConta}/dispositivo/uid`));
    dispositivoUID = d.val() || "";
    montarPainelESP32();
    // Mantem o vinculo atualizado mesmo quando o simulador eh iniciado em outra aba.
    if (pararVinculoDispositivo) pararVinculoDispositivo();
    pararVinculoDispositivo = onValue(ref(database, `${baseConta}/dispositivo/uid`), snap => {
      const novo = snap.val() || "";
      if (dispositivoUID !== novo) {
        dispositivoUID = novo;
        if ($('esp32Uid')) $('esp32Uid').value = novo;
        acompanharESP32();
      }
    });
  }
  catch (erro) { console.error("Não foi possível carregar os dados do Firebase:", erro); alert("Não foi possível carregar seus dados. Confira a conexão e as regras do Firebase Realtime Database."); }
});
