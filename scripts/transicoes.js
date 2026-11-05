/* NinaPets: transições globais com tela cheia e duração total de ~3 segundos. */
(() => {
  if (window.__ninaTransitionsInstalled) return;
  window.__ninaTransitionsInstalled = true;
  // Estilos essenciais embutidos: o overlay continua correto mesmo com CSS antigo em cache.
  const essentialStyle = document.createElement('style');
  essentialStyle.id = 'np-loader-critical-styles';
  essentialStyle.textContent = `
    .np-loader { position: fixed !important; inset: 0 !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; height: 100dvh !important; z-index: 2147483647 !important; box-sizing: border-box !important; display: flex !important; align-items: center !important; justify-content: center !important; padding: 24px !important; margin: 0 !important; overflow: hidden !important; background: radial-gradient(circle at 16% 12%, #fff9e0, transparent 38%), radial-gradient(circle at 85% 88%, #d1efdc, transparent 44%), linear-gradient(140deg, #f8fff8, #e6f5ea 60%, #fffaf0) !important; opacity: 1; visibility: visible; transition: opacity .4s ease, visibility .4s ease; }
    .np-loader.oculto { opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; }
    .np-loader.visivel { opacity: 1 !important; visibility: visible !important; pointer-events: auto !important; }
    .np-loader-content { position: relative; z-index: 2; width: min(100%, 480px); text-align: center; padding: 20px 8px; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; }
    .np-loader-mascots { display: flex; justify-content: center; align-items: center; gap: 12px; margin-bottom: 16px; }
    .np-loader-dog, .np-loader-cat { display: inline-block; font-size: clamp(62px, 12vw, 98px); animation: np-fix-bob 1.7s ease-in-out infinite; }
    .np-loader-cat { animation-delay: .35s; }
    .np-loader-heart { color: #e9909b; font-size: 32px; animation: np-fix-heart 1.3s ease-in-out infinite; }
    .np-loader-brand { font-size: clamp(34px, 7vw, 50px); line-height: 1.2; font-weight: 900; color: #367a4f; letter-spacing: -1.5px; }
    .np-loader-brand span:first-child { color: #74b88b; }
    .np-loader-brand-paw { margin-left: 8px; font-size: 23px; }
    .np-loader-title { margin: 20px 0 10px !important; font-size: clamp(20px, 4vw, 27px) !important; line-height: 1.3 !important; color: #315e43 !important; }
    .np-loader-text { margin: 0 auto 24px !important; max-width: 370px; font-size: 15px !important; line-height: 1.6 !important; color: #60836b !important; }
    .np-loader-progress { width: min(100%, 360px); height: 12px; margin: 0 auto; border-radius: 999px; overflow: hidden; background: #d3e9d9; }
    .np-loader-progress-fill { height: 100%; width: 0%; border-radius: inherit; background: linear-gradient(90deg,#8fd3a5,#4eaa74,#a5dfb5); }
    .np-loader-footnote { margin-top: 16px; font-size: 13px; color: #648b71; font-weight: 700; }
    .np-loader-spark { position: absolute; font-size: 50px; color: #a4d8b2; opacity: .5; animation: np-fix-bob 3s ease-in-out infinite; }
    .np-spark-one { top: 13%; left: 12%; } .np-spark-two { bottom: 14%; right: 12%; }
    body.np-loading { overflow: hidden !important; }
    @keyframes np-fix-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
    @keyframes np-fix-heart { 0%,100% { transform: scale(1); } 50% { transform: scale(1.2); } }
    @media (prefers-reduced-motion: reduce) { .np-loader * { animation: none !important; } }
  `;
  document.head.appendChild(essentialStyle);
  const DURATION = 3000;
  const KEY = 'ninapets_pending_navigation';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loader = document.createElement('div');
  loader.className = 'np-loader oculto';
  loader.setAttribute('role','status');
  loader.setAttribute('aria-live','polite');
  loader.setAttribute('aria-label','Carregando página do NinaPets');
  loader.innerHTML = `<div class="np-loader-spark np-spark-one">✦</div><div class="np-loader-spark np-spark-two">✧</div>
    <div class="np-loader-content"><div class="np-loader-mascots" aria-hidden="true"><span class="np-loader-dog">🐶</span><span class="np-loader-heart">♥</span><span class="np-loader-cat">🐱</span></div>
    <div class="np-loader-brand">Nina<span>Pets</span><span class="np-loader-brand-paw">🐾</span></div>
    <h2 class="np-loader-title">Preparando tudo com carinho...</h2>
    <p class="np-loader-text">Um momentinho! Seu cantinho está quase pronto 💚</p>
    <div class="np-loader-progress" aria-hidden="true"><div class="np-loader-progress-fill"></div></div>
    <div class="np-loader-footnote"><span class="np-loader-mini-paw">🐾</span> Patinhas a caminho...</div></div>`;
  document.body.appendChild(loader);
  const title = loader.querySelector('.np-loader-title');
  const description = loader.querySelector('.np-loader-text');
  const progress = loader.querySelector('.np-loader-progress-fill');
  let navigating = false;
  const labels = {
    'perfil-pet.html':['Preparando o espaço do seu pet...','Um lugar especial para cada amiguinho 🐾'],
    'alimentador.html':['Organizando a visão geral...','Tudo sobre os cuidados do seu pet 💚'],
    'horarios.html':['Conferindo os horários...','Cada refeição merece carinho 🍽️'],
    'historico.html':['Buscando as lembranças...','Cada refeição conta uma história 🐾'],
    'login.html':['Preparando seu acesso...','Que bom ter você por aqui! 💚'],
    'cadastro.html':['Criando um cantinho especial...','Uma nova amizade começa aqui ✨'],
    'recuperar-senha.html':['Cuidando da sua conta...','Já vamos te ajudar 💌'],
    'inicio.html':['Bem-vindo ao NinaPets!','Cuidar é um gesto de amor 💚']
  };
  const setMessage = (url) => {
    const name = new URL(url, location.href).pathname.split('/').pop();
    const lines = labels[name] || ['Preparando tudo com carinho...','Um momentinho! Seu cantinho está quase pronto 💚'];
    title.textContent = lines[0]; description.textContent = lines[1];
  };
  const show = (url, elapsed=0) => {
    setMessage(url);
    loader.classList.remove('oculto');
    loader.classList.add('visivel');
    loader.style.setProperty('--np-progress-start', `${Math.min(100,elapsed / DURATION * 100)}%`);
    progress.style.animation = 'none';
    progress.style.width = `${Math.min(100,elapsed / DURATION * 100)}%`;
    requestAnimationFrame(() => {
      progress.style.transition = `width ${Math.max(0,DURATION-elapsed)}ms linear`;
      progress.style.width = '100%';
    });
    document.body.classList.add('np-loading');
  };
  const hide = () => {
    loader.classList.remove('visivel'); loader.classList.add('oculto');
    document.body.classList.remove('np-loading');
    progress.style.transition = 'none'; progress.style.width = '0%';
  };
  let pending = null;
  try { pending = JSON.parse(sessionStorage.getItem(KEY) || 'null'); sessionStorage.removeItem(KEY); } catch (_) {}
  if (pending && typeof pending.started === 'number' && Date.now()-pending.started < 15000) {
    const elapsed = Math.max(0,Date.now()-pending.started);
    show(location.href, elapsed);
    const finish = () => setTimeout(hide, Math.max(0,DURATION-(Date.now()-pending.started)));
    if (document.readyState === 'complete') finish();
    else window.addEventListener('load',finish,{once:true});
  }
  window.ninaNavigate = (destination, options={}) => {
    if (!destination || navigating) return;
    const target = new URL(destination,location.href);
    if (target.origin !== location.origin) { location.assign(target.href); return; }
    if (target.href === location.href) return;
    navigating = true;
    const started = Date.now();
    try { sessionStorage.setItem(KEY,JSON.stringify({started})); } catch (_) {}
    show(target.href);
    // Pequena espera na página atual; o restante dos 3s ocorre na página de destino.
    setTimeout(() => options.replace ? location.replace(target.href) : location.assign(target.href), reduce ? 80 : 550);
  };
  window.ninaReload = () => window.ninaNavigate(location.href + (location.search ? '&' : '?') + 'np_reload=' + Date.now(),{replace:true});
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.menu-paginas a[href]').forEach(a => {
    const name = new URL(a.href,location.href).pathname.split('/').pop();
    a.classList.toggle('ativo',name===current);
    if (name===current) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
  });
  document.addEventListener('click',event => {
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const href=link.getAttribute('href');
    if (!href || href.startsWith('#') || /^(mailto:|tel:|javascript:)/i.test(href)) return;
    const target=new URL(link.href,location.href);
    if (target.origin !== location.origin || target.href===location.href) return;
    event.preventDefault(); window.ninaNavigate(target.href);
  },true);
  window.addEventListener('pageshow',event => { if(event.persisted){navigating=false;hide();} });
})();
