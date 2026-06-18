import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getFirestore, doc, setDoc, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';

const $ = (id) => document.getElementById(id);
const APP_VERSION = 'v33';
const DEFAULT_FAMILY_CODE = 'familia-ana';
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCVbpOCdBe6I_sOB2zVv_9G9oUg_x3H6TE',
  authDomain: 'rotina-falante.firebaseapp.com',
  projectId: 'rotina-falante',
  storageBucket: 'rotina-falante.firebasestorage.app',
  messagingSenderId: '800689968868',
  appId: '1:800689968868:web:6c076be1b02e5357783ef1',
  measurementId: 'G-9YW15GBDFB'
};
const RESPONSIBLE_EMAILS = [
  'anacarolinamoraisdosreis@gmail.com',
  'carlionison.43@gmail.com'
];
const periods = [
  { id: 'manha', label: 'Manhã', emoji: '☀️' },
  { id: 'tarde', label: 'Tarde', emoji: '🌤️' },
  { id: 'noite', label: 'Noite', emoji: '🌙' },
];
const weekDays = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const longWeekDays = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const taskEmojis = ['✅','🦷','🚿','👕','🍽️','🍎','💊','📚','🎒','🧹','🛁','🎮','📖','😴','☕','🚗','🧘','⭐','🧸','🌈','🦕','🚀','🌸'];
const profileEmojis = ['☕','🌸','💜','📚','🧘','⭐','🌈','🦋','🚀','🦕','🎮','🎨','⚽','🎵','🍓','💎'];
const themes = [
  { id:'ceu', label:'Céu', emoji:'💙' },
  { id:'arcoiris', label:'Arco-íris', emoji:'🌈' },
  { id:'galaxia', label:'Galáxia', emoji:'🚀' },
  { id:'jardim', label:'Jardim', emoji:'🌿' },
];
const profileThemes = [
  { id:'bichinhos', label:'Cantinho fofo', emoji:'🐾', bg:'linear-gradient(135deg,#d7f8dc,#b4e4ff)' },
  { id:'dinossauro', label:'Mundo dino', emoji:'🦕', bg:'linear-gradient(135deg,#d8f5c8,#7ed957)' },
  { id:'princesa', label:'Jardim mágico', emoji:'🌸', bg:'linear-gradient(135deg,#ffe1f1,#ffc6df)' },
  { id:'espaco', label:'Espaço estelar', emoji:'🚀', bg:'linear-gradient(135deg,#202955,#6877ff)' },
  { id:'mae', label:'Cantinho da família', emoji:'☕', bg:'linear-gradient(135deg,#f2e8ff,#d8c7ff)' },
];
const soundOptions = [
  { id:'suave', label:'Sininho suave', emoji:'🔔' },
  { id:'estrelas', label:'Estrelinhas', emoji:'✨' },
  { id:'agua', label:'Água calma', emoji:'💧' },
  { id:'tambor', label:'Tamborzinho leve', emoji:'🥁' },
  { id:'voz', label:'Só voz', emoji:'🗣️' },
  { id:'mudo', label:'Sem som', emoji:'🔇' }
];
const mascots = {
  bichinhos: { emoji:'🧸', name:'Amigo Fofo', wait:'Estou aqui esperando a próxima missão.' },
  dinossauro: { emoji:'🦕', name:'Dino Guia', wait:'O Dino está descansando até a próxima missão.' },
  princesa: { emoji:'🌸', name:'Flor Mágica', wait:'A flor está brilhando enquanto esperamos.' },
  espaco: { emoji:'🚀', name:'Foguetinho', wait:'O foguete está em órbita até a próxima missão.' },
  mae: { emoji:'☕', name:'Lembrete da família', wait:'O cantinho da família está em espera.' },
};
const routineTemplates = [
  {
    id: 'escola',
    label: 'Rotina escolar',
    emoji: '🎒',
    tasks: {
      manha: [
        { emoji:'🦷', name:'Escovar os dentes', time:'07:00', days:[1,2,3,4,5], steps:['pegar escova','passar pasta','escovar com calma'] },
        { emoji:'👕', name:'Colocar uniforme', time:'07:15', days:[1,2,3,4,5], steps:['pegar roupa','vestir','calçar sapato'] },
        { emoji:'🎒', name:'Pegar mochila', time:'07:30', days:[1,2,3,4,5], steps:['garrafa','lanche','material'] }
      ],
      tarde: [
        { emoji:'📚', name:'Tarefa da escola', time:'15:00', days:[1,2,3,4,5], steps:['sentar','abrir caderno','fazer uma parte por vez'] }
      ],
      noite: []
    }
  },
  {
    id: 'sono',
    label: 'Rotina do sono',
    emoji: '😴',
    tasks: {
      manha: [],
      tarde: [],
      noite: [
        { emoji:'🛁', name:'Banho', time:'19:00', days:[0,1,2,3,4,5,6], steps:['pegar toalha','tomar banho','colocar pijama'] },
        { emoji:'🦷', name:'Escovar os dentes', time:'19:40', days:[0,1,2,3,4,5,6], steps:['escova','pasta','enxaguar'] },
        { emoji:'📖', name:'História calma', time:'20:00', days:[0,1,2,3,4,5,6], steps:['escolher livro','deitar','ouvir com calma'] },
        { emoji:'😴', name:'Dormir', time:'20:30', days:[0,1,2,3,4,5,6], steps:['luz baixa','cobertor','descansar'] }
      ]
    }
  },
  {
    id: 'remedio',
    label: 'Remédios',
    emoji: '💊',
    tasks: {
      manha: [
        { emoji:'💊', name:'Remédio da manhã', time:'08:00', days:[0,1,2,3,4,5,6], steps:['pegar remédio','tomar com água','avisar que tomou'] }
      ],
      tarde: [],
      noite: [
        { emoji:'💊', name:'Remédio da noite', time:'20:00', days:[0,1,2,3,4,5,6], steps:['pegar remédio','tomar com água','guardar'] }
      ]
    }
  },
  {
    id: 'fimsemana',
    label: 'Fim de semana',
    emoji: '🌈',
    tasks: {
      manha: [
        { emoji:'🍽️', name:'Café da manhã', time:'09:00', days:[0,6], steps:['sentar','comer','guardar prato'] }
      ],
      tarde: [
        { emoji:'🎮', name:'Tempo livre', time:'15:00', days:[0,6], steps:['escolher brincadeira','combinar tempo','guardar depois'] }
      ],
      noite: [
        { emoji:'🛁', name:'Banho', time:'19:30', days:[0,6], steps:['toalha','banho','pijama'] }
      ]
    }
  }
];
const savedConfigText = localStorage.getItem('rf_firebaseConfig') || '';
const badEmbeddedApiKey = 'AIzaSyCVbpOCdBe6I_sOB2zVv_9G9oUg_X3H6TE';
const embeddedConfigText = JSON.stringify(DEFAULT_FIREBASE_CONFIG, null, 2);
const defaultConfigText = savedConfigText && !savedConfigText.includes(badEmbeddedApiKey) ? savedConfigText : embeddedConfigText;
let familyCode = localStorage.getItem('rf_familyCode') || DEFAULT_FAMILY_CODE;
let momPin = localStorage.getItem('rf_momPin') || '1234';
let appState = loadLocalState();
let firebaseApp = null;
let db = null;
let auth = null;
let authUser = null;
let authPersistenceReady = Promise.resolve();
let remoteRef = null;
let unsub = null;
let saveTimer = null;
let applyingRemote = false;
let mode = localStorage.getItem('rf_mode') || 'mom';
let selectedChildId = localStorage.getItem('rf_selectedChild') || '';
let selectedProfileTab = localStorage.getItem('rf_profileTab') || 'children';
let editingChildId = '';
let editingPeriod = 'manha';
let editingTaskId = '';
let selectedTaskDays = new Set([0,1,2,3,4,5,6]);
let selectedTaskEmoji = '✅';
let firedAlarmKeys = new Set();
let persistentAlarm = null;
let timeAnnounceInterval = Number(localStorage.getItem('rf_timeAnnounceInterval') || 0);
let timeAnnounceTimer = null;
let audioContext = null;
let pendingSpeechTimer = null;
let pendingChangeReason = '';

function loadLocalState(){
  const saved = localStorage.getItem('rf_state');
  if(saved){
    try { return normalizeState(JSON.parse(saved)); } catch(e) {}
  }
  return normalizeState({
    theme: 'ceu',
    children: [
      { id: crypto.randomUUID(), type:'child', name: 'Criança', birthDate: '', avatar: '⭐', profileTheme:'bichinhos', routines: emptyRoutines(), done: {} },
      { id: crypto.randomUUID(), type:'mom', name: 'Responsável', birthDate: '', avatar: '☕', profileTheme:'mae', routines: emptyRoutines(), done: {} }
    ],
    updatedAtLocal: new Date().toISOString()
  });
}

function emptyRoutines(){
  return {
    manha: [
      { id: crypto.randomUUID(), emoji: '🦷', name: 'Escovar os dentes', time: '07:30', days: [1,2,3,4,5] },
      { id: crypto.randomUUID(), emoji: '🎒', name: 'Pegar mochila', time: '07:50', days: [1,2,3,4,5] }
    ],
    tarde: [
      { id: crypto.randomUUID(), emoji: '📚', name: 'Fazer tarefa', time: '14:30', days: [1,2,3,4,5] }
    ],
    noite: [
      { id: crypto.randomUUID(), emoji: '😴', name: 'Dormir', time: '20:30', days: [0,1,2,3,4,5,6] }
    ]
  };
}

function normalizeState(state){
  state.theme ||= 'ceu';
  state.family ||= {};
  state.family.code ||= DEFAULT_FAMILY_CODE;
  state.family.responsibles = RESPONSIBLE_EMAILS.map(email => ({
    email,
    name: state.family?.responsibles?.find(item => item.email === email)?.name || responsibleNameFromEmail(email)
  }));
  state.family.changes = Array.isArray(state.family.changes) ? state.family.changes.slice(-12) : [];
  state.family.invites = Array.isArray(state.family.invites) ? state.family.invites.slice(-12) : [];
  state.childProtection ||= { enabled: false, childId: '' };
  state.childProtection.enabled = !!state.childProtection.enabled;
  state.childProtection.childId ||= '';
  state.children = Array.isArray(state.children) ? state.children : [];
  if(!state.children.length) state.children.push({ id: crypto.randomUUID(), type:'child', name:'Criança', birthDate:'', avatar:'⭐', profileTheme:'bichinhos', routines: emptyRoutines(), done:{} });
  if(!state.children.some(child => child.type === 'mom')) state.children.push({ id: crypto.randomUUID(), type:'mom', name:'Responsável', birthDate:'', avatar:'☕', profileTheme:'mae', routines: emptyRoutines(), done:{} });
  state.children.forEach(child => {
    child.id ||= crypto.randomUUID();
    child.name ||= 'Criança';
    child.type ||= child.name.toLowerCase().includes('mãe') || child.name.toLowerCase().includes('mae') || child.name.toLowerCase().includes('responsável') || child.name.toLowerCase().includes('responsavel') ? 'mom' : 'child';
    child.birthDate ||= '';
    child.manualAge = child.manualAge ?? child.age ?? '';
    delete child.age;
    child.avatar ||= '⭐';
    child.profileTheme ||= child.type === 'mom' ? 'mae' : 'bichinhos';
    child.alarmSound ||= 'suave';
    child.stars = Number(child.stars || 0);
    child.routines ||= emptyRoutines();
    child.done ||= {};
    child.skipped ||= {};
    periods.forEach(p => child.routines[p.id] ||= []);
    periods.forEach(p => child.routines[p.id].forEach(task => {
      task.days = Array.isArray(task.days) ? task.days : [0,1,2,3,4,5,6];
      task.steps = Array.isArray(task.steps) ? task.steps : [];
      task.message ||= '';
      task.important = !!task.important;
    }));
  });
  return state;
}

function todayKey(){
  const d = new Date();
  return dateKey(d);
}

function dateKey(d){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function currentPeriod(){
  const h = new Date().getHours();
  return h < 12 ? 'manha' : h < 18 ? 'tarde' : 'noite';
}

function childAge(child){
  if(!child.birthDate) return '';
  const birth = new Date(`${child.birthDate}T00:00:00`);
  if(Number.isNaN(birth.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hadBirthday = today.getMonth() > birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if(!hadBirthday) age--;
  return age >= 0 ? age : '';
}

function ageText(child){
  const age = childAge(child);
  if(age !== '') return `${age} anos`;
  if(child.manualAge !== '') return `${child.manualAge} anos até informar nascimento`;
  return 'nascimento não informado';
}

function saveLocal(){
  localStorage.setItem('rf_state', JSON.stringify(appState));
}

function scheduleSave(reason=''){
  if(reason) noteChange(reason);
  saveLocal();
  if(!remoteRef || applyingRemote) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(pushState, 500);
}

async function pushState(){
  if(!remoteRef) return;
  appState.updatedAtLocal = new Date().toISOString();
  registerPendingChange();
  await setDoc(remoteRef, { state: appState, updatedAt: serverTimestamp() }, { merge: true });
  setStatus('Salvo no Firebase', true);
}

function setStatus(text, ok=false){
  $('syncStatus').textContent = text;
  $('syncStatus').style.color = ok ? 'var(--green)' : 'var(--muted)';
}

function googleErrorText(error){
  const code = error?.code || 'sem-codigo';
  const message = error?.message ? ` - ${String(error.message).slice(0, 90)}` : '';
  return `Erro Google: ${code}${message}`;
}

function normalizedEmail(email){
  return String(email || '').trim().toLowerCase();
}

function responsibleNameFromEmail(email){
  const normalized = normalizedEmail(email);
  if(normalized.startsWith('anacarolina')) return 'Ana Carolina';
  if(normalized.startsWith('carlionison')) return 'Carlionison';
  return normalized.split('@')[0] || 'Responsável';
}

function currentResponsibleEmail(){
  return normalizedEmail(authUser?.email);
}

function isAuthorizedResponsible(user=authUser){
  return RESPONSIBLE_EMAILS.includes(normalizedEmail(user?.email));
}

function responsibleDocRef(){
  const code = cleanFamilyCode($('familyCode')?.value || familyCode || DEFAULT_FAMILY_CODE) || DEFAULT_FAMILY_CODE;
  familyCode = code;
  localStorage.setItem('rf_familyCode', familyCode);
  appState.family ||= {};
  appState.family.code = code;
  return doc(db, 'familias', code, 'plataforma', 'principal');
}

function registerPendingChange(){
  if(!pendingChangeReason || !authUser) return;
  appState.family ||= {};
  appState.family.changes = Array.isArray(appState.family.changes) ? appState.family.changes : [];
  appState.family.changes.push({
    id: crypto.randomUUID(),
    by: currentResponsibleEmail(),
    byName: authUser.displayName || responsibleNameFromEmail(authUser.email),
    text: pendingChangeReason,
    at: new Date().toISOString()
  });
  appState.family.changes = appState.family.changes.slice(-12);
  pendingChangeReason = '';
}

function noteChange(text){
  pendingChangeReason = text || 'atualizou o painel família';
}

function firebaseConfigText(){
  const raw = ($('firebaseConfig').value || '').trim();
  if(!raw || raw.includes('"..."') || raw.includes(":'...'") || raw.includes(badEmbeddedApiKey)) return '';
  return raw;
}

function parseFirebaseConfig(text){
  let raw = text.trim();
  if(!raw) throw new Error('config');
  try { return JSON.parse(raw); } catch(e) {}
  if(!raw.includes('{') && raw.includes('apiKey')){
    raw = `{${raw.replace(/};?\s*$/, '')}}`;
    return Function('"use strict";return (' + raw + ');')();
  }
  const match = raw.match(/\{[\s\S]*\}/);
  if(!match) throw new Error('config');
  return Function('"use strict";return (' + match[0] + ');')();
}

function initFirebaseFromForm(){
  const cfgText = firebaseConfigText();
  $('firebaseConfig').value = cfgText;
  const firebaseConfig = parseFirebaseConfig(cfgText);
  localStorage.setItem('rf_firebaseConfig', cfgText);
  momPin = ($('momPin').value || '1234').trim();
  localStorage.setItem('rf_momPin', momPin);
  if(!firebaseApp) firebaseApp = initializeApp(firebaseConfig);
  db ||= getFirestore(firebaseApp);
  if(!auth){
    auth = getAuth(firebaseApp);
    authPersistenceReady = setPersistence(auth, browserLocalPersistence).catch((e) => {
      setStatus(`Erro Google: ${e.code || 'persistencia'}`);
    });
    onAuthStateChanged(auth, (user) => {
      authUser = user;
      renderAuthBar();
      if(user && db){
        if(!isAuthorizedResponsible(user)){
          setStatus('Este e-mail não está liberado para o modo família');
          signOut(auth).catch(()=>{});
          return;
        }
        localStorage.setItem('rf_authMode', 'google');
        listenToRemote(responsibleDocRef(), `Modo família: ${user.email || user.displayName || 'conta Google'}`);
      }
    });
    authPersistenceReady.then(() => getRedirectResult(auth)).then((result) => {
      if(result?.user && db){
        authUser = result.user;
        if(!isAuthorizedResponsible(authUser)){
          setStatus('Este e-mail não está liberado para o modo família');
          signOut(auth).catch(()=>{});
          return;
        }
        localStorage.setItem('rf_authMode', 'google');
        listenToRemote(responsibleDocRef(), `Modo família: ${authUser.email || authUser.displayName || 'conta Google'}`);
      }
    }).catch((e) => {
      setStatus(googleErrorText(e));
    });
  }
  return cfgText;
}

function listenToRemote(ref, label){
  remoteRef = ref;
  if(unsub) unsub();
  unsub = onSnapshot(remoteRef, (snap) => {
    if(!snap.exists()){
      pushState();
      return;
    }
    const data = snap.data();
    if(data.state){
      applyingRemote = true;
      appState = normalizeState(data.state);
      saveLocal();
      applyingRemote = false;
      renderAll();
    }
    setStatus(label, true);
  }, () => setStatus('Sem permissão no Firestore'));
  $('setupPanel').hidden = true;
  $('modePanel').hidden = false;
  renderAll();
}

async function connectFirebase(){
  try{
    initFirebaseFromForm();
    familyCode = cleanFamilyCode($('familyCode').value);
    if(!familyCode) throw new Error('family');
    localStorage.setItem('rf_familyCode', familyCode);
    listenToRemote(doc(db, 'familias', familyCode, 'plataforma', 'principal'), 'Conectado ao Firestore');
  }catch(e){
    setStatus('Confira firebaseConfig, código e regras');
  }
}

async function loginGoogle(){
  try{
    initFirebaseFromForm();
    await authPersistenceReady;
    localStorage.setItem('rf_authMode', 'google');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const isMobile = matchMedia('(max-width: 780px)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if(isMobile){
      await signInWithRedirect(auth, provider);
      return;
    }
    try{
      await signInWithPopup(auth, provider);
    }catch(e){
      await signInWithRedirect(auth, provider);
      return;
    }
    authUser = auth.currentUser;
    if(!authUser) throw new Error('auth');
    if(!isAuthorizedResponsible(authUser)){
      await signOut(auth).catch(()=>{});
      throw new Error('email-nao-liberado');
    }
    localStorage.setItem('rf_authMode', 'google');
    listenToRemote(responsibleDocRef(), `Modo família: ${authUser.email || authUser.displayName || 'conta Google'}`);
  }catch(e){
    setStatus(googleErrorText(e));
  }
}

async function logoutGoogle(){
  if(auth) await signOut(auth).catch(()=>{});
  authUser = null;
  localStorage.removeItem('rf_authMode');
  renderAuthBar();
  location.reload();
}

function renderAuthBar(){
  if(!$('authBar')) return;
  $('authBar').hidden = !authUser;
  if(authUser) $('authUserLabel').textContent = `Google: ${authUser.email || authUser.displayName || 'conectado'}`;
}

function cleanFamilyCode(code){
  return (code || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').slice(0, 40);
}

function childById(id){
  return appState.children.find(c => c.id === id) || appState.children[0];
}

function childProfiles(){
  return appState.children.filter(child => child.type !== 'mom');
}

function isChildProtectionOn(){
  return !!appState.childProtection?.enabled;
}

function protectedChild(){
  const children = childProfiles();
  return children.find(child => child.id === appState.childProtection?.childId) || children[0] || null;
}

function momProfile(){
  let profile = appState.children.find(child => child.type === 'mom');
  if(!profile){
    profile = { id: crypto.randomUUID(), type:'mom', name:'Responsável', birthDate:'', avatar:'☕', profileTheme:'mae', routines: emptyRoutines(), done:{} };
    appState.children.push(profile);
  }
  return profile;
}

function profileThemeById(id){
  return profileThemes.find(theme => theme.id === id) || profileThemes[0];
}

function mascotByTheme(id){
  return mascots[id] || mascots.bichinhos;
}

function applyChildPageTheme(child){
  document.body.classList.remove('child-theme-active', ...profileThemes.map(theme => `profile-bg-${theme.id}`));
  if(mode !== 'child' || !child) return;
  const visual = profileThemeById(child.profileTheme);
  document.documentElement.style.setProperty('--child-profile-bg', visual.bg);
  document.body.classList.add('child-theme-active', `profile-bg-${visual.id}`);
}

function renderAll(){
  applyTheme(appState.theme);
  renderMode();
  renderThemes();
  renderTimeSpeechSettings();
  renderMom();
  renderChild();
  renderAlarmOverlay();
}

function applyTheme(themeId){
  document.body.classList.remove(...themes.map(t => `theme-${t.id}`));
  document.body.classList.add(`theme-${themeId || 'ceu'}`);
}

function renderThemes(){
  const picker = $('themePicker');
  if(!picker) return;
  picker.innerHTML = themes.map(t => `<button class="theme-chip ${appState.theme===t.id?'active':''}" data-theme="${t.id}">${t.emoji} ${t.label}</button>`).join('');
  document.querySelectorAll('[data-theme]').forEach(btn => btn.addEventListener('click', () => {
    appState.theme = btn.dataset.theme;
    scheduleSave('alterou o tema do app');
    renderAll();
  }));
}

function renderMode(){
  const protectedOn = isChildProtectionOn();
  document.querySelectorAll('.segmented button').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
  $('momView').hidden = mode !== 'mom';
  $('childView').hidden = mode !== 'child';
  $('modePanel').classList.toggle('protected-active', protectedOn && mode === 'child');
  if(mode !== 'child') applyChildPageTheme(null);
}

function renderMom(){
  const inMomTab = selectedProfileTab === 'mom';
  renderMomDashboard();
  renderMomTools();
  renderFamilyPanel();
  $('profilesTitle').textContent = inMomTab ? 'Rotina dos responsáveis' : 'Filhos e rotinas';
  $('profilesHint').textContent = inMomTab ? 'Edite nome, emoji e alarmes dos responsáveis. Essa rotina toca separada das crianças.' : 'Edite aqui. Os aparelhos das crianças atualizam automaticamente.';
  $('addChildBtn').hidden = inMomTab;
  document.querySelectorAll('[data-profile-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.profileTab === selectedProfileTab);
    btn.onclick = () => {
      selectedProfileTab = btn.dataset.profileTab;
      localStorage.setItem('rf_profileTab', selectedProfileTab);
      renderMom();
    };
  });
  const visibleProfiles = inMomTab ? [momProfile()] : childProfiles();
  if(inMomTab) editingChildId = visibleProfiles[0].id;
  $('childrenGrid').innerHTML = visibleProfiles.map(child => `
    <button class="profile-tile ${editingChildId===child.id?'active':''} profile-card-${child.type}" style="--tile-profile-bg:${profileThemeById(child.profileTheme).bg}" data-open-profile="${child.id}">
      <div class="profile-tile-avatar">${child.avatar}</div>
      <div class="profile-tile-name">${child.name}</div>
      <div class="profile-tile-meta">${child.type === 'mom' ? 'Rotina da família' : ageText(child)}</div>
    </button>
  `).join('');
  if(!inMomTab && editingChildId && !visibleProfiles.some(child => child.id === editingChildId)) editingChildId = '';
  bindChildCards();
  if(editingChildId) renderEditor();
  else $('routineEditor').hidden = true;
}

function todayAgendaItems(){
  const today = new Date().getDay();
  const items = [];
  appState.children.forEach(child => {
    periods.forEach(period => {
      (child.routines[period.id] || []).forEach(task => {
        if(task.days && !task.days.includes(today)) return;
        items.push({
          child,
          period,
          task,
          total: task.time ? timeToMinutes(task.time) : 9999,
          done: isDone(child, task.id),
          skipped: isSkipped(child, task.id)
        });
      });
    });
  });
  return items.sort((a,b) => a.total - b.total || a.child.name.localeCompare(b.child.name));
}

function renderMomDashboard(){
  if(!$('todayAgenda')) return;
  const items = todayAgendaItems();
  const pending = items.filter(item => !item.done && !item.skipped);
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const next = pending.find(item => item.total >= nowMin) || pending[0];
  $('nextAlarmCard').innerHTML = next ? `
    <div class="next-alarm-time">${next.task.time || 'Sem horário'}</div>
    <div><strong>${next.child.avatar} ${escapeHtml(next.child.name)}</strong></div>
    <div class="muted">${next.task.emoji || '✅'} ${escapeHtml(next.task.name)} · ${next.period.label}</div>
    <button class="secondary small-btn" data-edit-agenda="${next.child.id}">Editar perfil</button>
  ` : '<div class="next-alarm-time">Tudo feito</div><div class="muted">Nenhuma tarefa pendente hoje.</div>';
  const alerts = momAlerts();
  $('momAlerts').innerHTML = alerts.length ? alerts.map(alert => `<div class="alert-line">${alert}</div>`).join('') : '<div class="alert-line good">Tudo certo por aqui.</div>';
  $('momDaySummary').innerHTML = momSummaryHtml(items);
  $('todayAgenda').innerHTML = items.length ? items.map(item => agendaItemHtml(item)).join('') : '<div class="empty-state">Nenhuma tarefa marcada para hoje.</div>';
}

function momSummaryHtml(items){
  const done = items.filter(item => item.done).length;
  const skipped = items.filter(item => item.skipped).length;
  const pending = items.length - done - skipped;
  return `
    <div class="summary-grid">
      <div><strong>${done}</strong><span>feitas</span></div>
      <div><strong>${pending}</strong><span>pendentes</span></div>
      <div><strong>${skipped}</strong><span>puladas</span></div>
    </div>
  `;
}

function momAlerts(){
  const alerts = [];
  childProfiles().forEach(child => {
    if(!child.birthDate) alerts.push(`${child.avatar} ${escapeHtml(child.name)} sem nascimento.`);
    const total = periods.flatMap(period => child.routines[period.id] || []).length;
    if(!total) alerts.push(`${child.avatar} ${escapeHtml(child.name)} sem tarefas.`);
  });
  const noTime = appState.children.flatMap(child => periods.flatMap(period => (child.routines[period.id] || []).map(task => ({ child, task })))).filter(item => !item.task.time);
  if(noTime.length) alerts.push(`${noTime.length} tarefa${noTime.length > 1 ? 's' : ''} sem horário.`);
  return alerts.slice(0, 5);
}

function agendaItemHtml(item){
  const status = item.done ? 'Feita' : item.skipped ? 'Pulada hoje' : item.total === 9999 ? 'Sem horário' : countdownText(item.total);
  return `
    <div class="agenda-row period-${item.period.id} ${item.done ? 'done' : ''} ${item.skipped ? 'skipped' : ''} ${item.task.important ? 'important' : ''}">
      <div class="agenda-time">${item.task.time || '--:--'}</div>
      <div class="agenda-main">
        <div class="task-name">${item.task.important ? '❗ ' : ''}${item.task.emoji || '✅'} ${escapeHtml(item.task.name)}</div>
        <div class="task-time">${item.child.avatar} ${escapeHtml(item.child.name)} · ${item.period.label} · ${status}</div>
      </div>
      <button class="secondary small-btn" data-edit-agenda="${item.child.id}">Editar</button>
      <button class="secondary small-btn" data-speak-agenda-task="${item.child.id}:${item.task.id}">🔊</button>
      <button class="secondary small-btn" data-test-alarm="${item.child.id}:${item.period.id}:${item.task.id}">Teste</button>
    </div>
  `;
}

function renderMomTools(){
  if(!$('templateGrid')) return;
  $('templateGrid').innerHTML = routineTemplates.map(template => `<button class="template-btn" data-template="${template.id}">${template.emoji} ${template.label}</button>`).join('');
  const options = appState.children.map(child => `<option value="${child.id}">${child.avatar} ${escapeHtml(child.name)}</option>`).join('');
  $('copyFrom').innerHTML = options;
  $('copyTo').innerHTML = options;
  const current = editingChildId || selectedChildId || childProfiles()[0]?.id || momProfile().id;
  $('copyFrom').value = current;
  $('copyTo').value = appState.children.find(child => child.id !== current)?.id || current;
}

function renderFamilyPanel(){
  if(!$('responsibleGrid')) return;
  const me = currentResponsibleEmail();
  const responsibles = RESPONSIBLE_EMAILS.map(email => ({
    email,
    name: responsibleNameFromEmail(email),
    active: email === me
  }));
  $('responsibleGrid').innerHTML = responsibles.map(person => `
    <div class="responsible-card ${person.active ? 'active' : ''}">
      <div class="responsible-avatar">${person.name.slice(0,1).toUpperCase()}</div>
      <div>
        <div class="task-name">${escapeHtml(person.name)}${person.active ? ' · você' : ''}</div>
        <div class="task-time">${escapeHtml(person.email)}</div>
      </div>
    </div>
  `).join('');
  const changes = (appState.family?.changes || []).filter(change => change.by !== me).slice(-3).reverse();
  $('changeNotice').innerHTML = changes.length ? changes.map(change => `
    <div class="alert-line">
      ${escapeHtml(change.byName || responsibleNameFromEmail(change.by))} ${escapeHtml(change.text)}.
      <span>${formatShortDate(change.at)}</span>
    </div>
  `).join('') : '<div class="alert-line good">Nenhuma mudança nova de outro responsável.</div>';
  $('inviteTarget').innerHTML = RESPONSIBLE_EMAILS
    .filter(email => email !== me)
    .map(email => `<option value="${email}">${escapeHtml(responsibleNameFromEmail(email))}</option>`)
    .join('');
  $('inviteRoutine').innerHTML = appState.children.map(child => `<option value="${child.id}">${child.avatar} ${escapeHtml(child.name)}</option>`).join('');
  renderProtectedControl();
  renderInviteList();
}

function renderProtectedControl(){
  if(!$('protectedChildSelect')) return;
  const children = childProfiles();
  const protectedProfile = protectedChild();
  $('protectedChildSelect').innerHTML = children.length
    ? children.map(child => `<option value="${child.id}">${child.avatar} ${escapeHtml(child.name)}</option>`).join('')
    : '<option value="">Nenhuma criança cadastrada</option>';
  $('protectedChildSelect').value = protectedProfile?.id || '';
  const active = isChildProtectionOn();
  $('enableProtectedBtn').disabled = !children.length || active;
  $('disableProtectedBtn').disabled = !active;
  $('protectedStatus').textContent = active && protectedProfile
    ? `Protegido para ${protectedProfile.avatar} ${protectedProfile.name}. Para sair, use a senha do modo família.`
    : 'Proteção desligada.';
}

function renderInviteList(){
  if(!$('inviteList')) return;
  const me = currentResponsibleEmail();
  const invites = (appState.family?.invites || []).slice().reverse();
  $('inviteList').innerHTML = invites.length ? invites.map(invite => {
    const mine = invite.to === me;
    const status = invite.status === 'accepted' ? 'Aceito' : invite.status === 'declined' ? 'Recusado' : 'Pendente';
    const canAnswer = mine && invite.status === 'pending';
    return `
      <div class="invite-item ${invite.status || 'pending'}">
        <div>
          <div class="task-name">${escapeHtml(invite.profileName || 'Rotina')} · ${status}</div>
          <div class="task-time">De ${escapeHtml(responsibleNameFromEmail(invite.from))} para ${escapeHtml(responsibleNameFromEmail(invite.to))}</div>
          ${invite.message ? `<div class="task-message">💬 ${escapeHtml(invite.message)}</div>` : ''}
        </div>
        ${canAnswer ? `<div class="task-actions"><button class="secondary" data-invite-accept="${invite.id}">Aceitar</button><button class="secondary danger" data-invite-decline="${invite.id}">Recusar</button></div>` : ''}
      </div>
    `;
  }).join('') : '<div class="empty-state">Nenhum convite ainda.</div>';
}

function sendInvite(){
  if(!authUser || !isAuthorizedResponsible()) return setStatus('Entre com um e-mail responsável para convidar');
  const to = $('inviteTarget').value;
  const profile = childById($('inviteRoutine').value);
  if(!to || !profile) return;
  appState.family ||= {};
  appState.family.invites = Array.isArray(appState.family.invites) ? appState.family.invites : [];
  appState.family.invites.push({
    id: crypto.randomUUID(),
    from: currentResponsibleEmail(),
    to,
    profileId: profile.id,
    profileName: profile.name,
    message: $('inviteMessage').value.trim(),
    status: 'pending',
    at: new Date().toISOString()
  });
  appState.family.invites = appState.family.invites.slice(-12);
  $('inviteMessage').value = '';
  scheduleSave(`enviou um convite sobre a rotina de ${profile.name}`);
  renderFamilyPanel();
}

function answerInvite(id, status){
  const invite = (appState.family?.invites || []).find(item => item.id === id);
  if(!invite || invite.to !== currentResponsibleEmail()) return;
  invite.status = status;
  invite.answeredAt = new Date().toISOString();
  scheduleSave(`${status === 'accepted' ? 'aceitou' : 'recusou'} um convite de rotina`);
  renderFamilyPanel();
}

function profileDetailHtml(child){
  return `
    <div class="profile-detail-head">
      <div class="avatar">${child.avatar}</div>
      <div>
        <div class="task-name">${child.name}</div>
        <div class="task-time">${child.type === 'mom' ? 'Rotina da família' : ageText(child)} · ⭐ ${child.stars || 0}</div>
      </div>
    </div>
    <div class="profile-detail-grid">
      <label>
        Nome
        <input value="${escapeAttr(child.name)}" data-child-name="${child.id}" placeholder="Nome">
      </label>
      <label>
        Data de nascimento
        <input value="${escapeAttr(child.birthDate)}" data-child-birth="${child.id}" type="date">
      </label>
      <label>
        Emoji do perfil
        <input value="${escapeAttr(child.avatar)}" data-child-avatar="${child.id}" maxlength="2" placeholder="⭐">
      </label>
    </div>
    <div class="profile-avatar-picker">
      ${profileEmojis.map(emoji => `<button class="avatar-choice ${child.avatar===emoji?'active':''}" data-profile-avatar="${child.id}:${emoji}">${emoji}</button>`).join('')}
    </div>
    <div class="profile-theme-row">
      ${profileThemes.map(theme => `<button class="profile-theme-chip ${child.profileTheme===theme.id?'active':''}" data-profile-theme="${child.id}:${theme.id}">${theme.emoji} ${theme.label}</button>`).join('')}
    </div>
    <div class="sound-row">
      <label>
        Som do alarme
        <select data-profile-sound="${child.id}">
          ${soundOptions.map(sound => `<option value="${sound.id}" ${child.alarmSound===sound.id?'selected':''}>${sound.emoji} ${sound.label}</option>`).join('')}
        </select>
      </label>
      <button class="secondary" data-test-sound="${child.id}">Testar som</button>
    </div>
    <div class="child-card-actions">
      <button class="secondary" data-speak="${child.id}">Falar rotina</button>
      ${child.type === 'mom' ? '' : `<button class="secondary" data-remove="${child.id}">Remover perfil</button>`}
    </div>
  `;
}

function renderProfileCalendar(child){
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const blanks = Array.from({ length: first.getDay() }, () => '<div class="calendar-day blank"></div>');
  const days = Array.from({ length: last.getDate() }, (_, index) => {
    const day = index + 1;
    const dateKey = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const hasDone = child.done?.[dateKey] && Object.values(child.done[dateKey]).some(Boolean);
    const isToday = day === now.getDate();
    return `<div class="calendar-day ${hasDone?'marked':''} ${isToday?'today':''}">
      <span>${day}</span>
      <strong>${hasDone ? '⭐' : ''}</strong>
    </div>`;
  });
  return `
    <div class="calendar-title">Calendário de ${months[month]} ${year}</div>
    <div class="calendar-week">${weekDays.map(day => `<span>${day}</span>`).join('')}</div>
    <div class="calendar-grid">${blanks.join('')}${days.join('')}</div>
  `;
}

function bindChildCards(){
  document.querySelectorAll('[data-open-profile]').forEach(el => el.addEventListener('click', () => openEditor(el.dataset.openProfile)));
  document.querySelectorAll('[data-child-name]').forEach(el => el.addEventListener('input', () => updateChild(el.dataset.childName, { name: el.value })));
  document.querySelectorAll('[data-child-birth]').forEach(el => el.addEventListener('input', () => updateChild(el.dataset.childBirth, { birthDate: el.value })));
  document.querySelectorAll('[data-child-avatar]').forEach(el => el.addEventListener('input', () => updateChild(el.dataset.childAvatar, { avatar: el.value || '⭐' })));
  document.querySelectorAll('[data-profile-avatar]').forEach(el => el.addEventListener('click', () => {
    const [id, avatar] = el.dataset.profileAvatar.split(':');
    updateChild(id, { avatar });
    renderMom();
  }));
  document.querySelectorAll('[data-profile-theme]').forEach(el => el.addEventListener('click', () => {
    const [id, profileTheme] = el.dataset.profileTheme.split(':');
    updateChild(id, { profileTheme });
    renderMom();
  }));
  document.querySelectorAll('[data-profile-sound]').forEach(el => el.addEventListener('change', () => updateChild(el.dataset.profileSound, { alarmSound: el.value })));
  document.querySelectorAll('[data-test-sound]').forEach(el => el.addEventListener('click', () => playAlarmSound(childById(el.dataset.testSound))));
  document.querySelectorAll('[data-profile-type]').forEach(el => el.addEventListener('change', () => {
    updateChild(el.dataset.profileType, { type: el.checked ? 'mom' : 'child', profileTheme: el.checked ? 'mae' : 'bichinhos' });
    renderMom();
  }));
  document.querySelectorAll('[data-edit]').forEach(el => el.addEventListener('click', () => openEditor(el.dataset.edit)));
  document.querySelectorAll('[data-remove]').forEach(el => el.addEventListener('click', () => removeChild(el.dataset.remove)));
  document.querySelectorAll('[data-speak]').forEach(el => el.addEventListener('click', () => speakChild(childById(el.dataset.speak))));
}

function updateChild(id, patch){
  const child = childById(id);
  if(patch.name !== undefined && !patch.name) patch.name = child.type === 'mom' ? 'Responsável' : 'Criança';
  Object.assign(child, patch);
  scheduleSave(`alterou o perfil de ${child.name}`);
  renderChild();
}

function removeChild(id){
  if(appState.children.length <= 1) return;
  const child = childById(id);
  if(child.type === 'mom' && appState.children.filter(child => child.type === 'mom').length <= 1) return;
  appState.children = appState.children.filter(c => c.id !== id);
  if(selectedChildId === id) selectedChildId = childProfiles()[0]?.id || appState.children[0].id;
  if(editingChildId === id) editingChildId = '';
  scheduleSave(`removeu o perfil de ${child.name}`);
  renderAll();
}

function openEditor(id){
  editingChildId = id;
  editingPeriod = currentPeriod();
  resetTaskForm(false);
  $('routineEditor').hidden = false;
  renderEditor();
  $('routineEditor').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderEditor(){
  const child = childById(editingChildId);
  const visual = profileThemeById(child.profileTheme);
  $('routineEditor').style.setProperty('--editor-profile-bg', visual.bg);
  $('routineEditor').classList.toggle('profile-dark', child.profileTheme === 'espaco');
  $('editorTitle').textContent = `${child.avatar} Rotina de ${child.name}`;
  $('editorSubtitle').textContent = ageText(child);
  $('profileDetailForm').innerHTML = profileDetailHtml(child);
  $('profileCalendar').innerHTML = renderProfileCalendar(child);
  $('periodTabs').innerHTML = periods.map(p => `<button class="${p.id===editingPeriod?'active':''}" data-period="${p.id}">${p.emoji} ${p.label}</button>`).join('');
  bindChildCards();
  document.querySelectorAll('[data-period]').forEach(btn => btn.addEventListener('click', () => { editingPeriod = btn.dataset.period; resetTaskForm(false); renderEditor(); }));
  $('addTaskBtn').textContent = editingTaskId ? 'Salvar' : 'Adicionar';
  $('cancelTaskEditBtn').hidden = !editingTaskId;
  renderEmojiPicker();
  renderWeekdayPicker();
  const tasks = child.routines[editingPeriod] || [];
  $('taskList').innerHTML = tasks.length ? tasks.map(task => taskHtml(task, child)).join('') : '<p class="muted">Sem tarefas neste período.</p>';
  document.querySelectorAll('[data-load-task]').forEach(btn => btn.addEventListener('click', () => loadTaskForEdit(btn.dataset.loadTask)));
  document.querySelectorAll('[data-delete-task]').forEach(btn => btn.addEventListener('click', () => deleteTask(btn.dataset.deleteTask)));
  document.querySelectorAll('[data-move-task]').forEach(btn => btn.addEventListener('click', () => {
    const [taskId, dir] = btn.dataset.moveTask.split(':');
    moveTask(taskId, Number(dir));
  }));
}

function renderEmojiPicker(){
  const picker = $('emojiPicker');
  if(!picker) return;
  $('taskEmoji').value = selectedTaskEmoji;
  picker.innerHTML = taskEmojis.map(emoji => `<button class="emoji-choice ${emoji===selectedTaskEmoji?'active':''}" data-task-emoji="${emoji}">${emoji}</button>`).join('');
  document.querySelectorAll('[data-task-emoji]').forEach(btn => btn.addEventListener('click', () => {
    selectedTaskEmoji = btn.dataset.taskEmoji;
    $('taskEmoji').value = selectedTaskEmoji;
    renderEmojiPicker();
  }));
}

function taskHtml(task, child){
  const done = isDone(child, task.id);
  const dayLabel = (task.days || []).length === 7 ? 'Todos os dias' : (task.days || []).map(d => weekDays[d]).join(', ');
  const tasks = child.routines[editingPeriod] || [];
  const index = tasks.findIndex(item => item.id === task.id);
  const steps = Array.isArray(task.steps) && task.steps.length ? `<div class="task-steps">${task.steps.map(step => `<span>${escapeHtml(step)}</span>`).join('')}</div>` : '';
  const message = task.message ? `<div class="task-message">💬 ${escapeHtml(task.message)}</div>` : '';
  return `
    <div class="task-item agenda-block ${done?'done':''} ${task.important?'important':''}">
      <div class="task-emoji">${task.important ? '❗' : (task.emoji || '✅')}</div>
      <div>
        <div class="task-name">${task.name}</div>
        <div class="task-time">${task.time || 'Sem horário'} · ${dayLabel}</div>
        ${message}
        ${steps}
      </div>
      <div class="task-actions">
        <button class="secondary" data-load-task="${task.id}">Editar</button>
        <button class="secondary" data-test-alarm="${child.id}:${editingPeriod}:${task.id}">Testar</button>
        <button class="secondary" data-move-task="${task.id}:-1" ${index===0?'disabled':''}>↑</button>
        <button class="secondary" data-move-task="${task.id}:1" ${index===tasks.length-1?'disabled':''}>↓</button>
        <button class="secondary" data-delete-task="${task.id}">Excluir</button>
      </div>
    </div>
  `;
}

function renderWeekdayPicker(){
  $('weekdayPicker').innerHTML = weekDays.map((day, idx) => `<button class="weekday-btn ${selectedTaskDays.has(idx)?'active':''}" data-weekday="${idx}">${day}</button>`).join('');
  document.querySelectorAll('[data-weekday]').forEach(btn => btn.addEventListener('click', () => {
    const day = Number(btn.dataset.weekday);
    if(selectedTaskDays.has(day) && selectedTaskDays.size > 1) selectedTaskDays.delete(day);
    else selectedTaskDays.add(day);
    renderWeekdayPicker();
  }));
}

function addTask(){
  if(!editingChildId) return;
  const name = $('taskName').value.trim();
  if(!name) return;
  const child = childById(editingChildId);
  const taskData = {
    emoji: selectedTaskEmoji || '✅',
    name,
    time: $('taskTime').value,
    days: [...selectedTaskDays].sort((a,b) => a-b),
    steps: $('taskSteps').value.split(',').map(step => step.trim()).filter(Boolean),
    message: $('taskMessage').value.trim(),
    important: $('taskImportant').checked
  };
  if(editingTaskId){
    const task = child.routines[editingPeriod].find(item => item.id === editingTaskId);
    if(task) Object.assign(task, taskData);
  } else {
    child.routines[editingPeriod].push({ id: crypto.randomUUID(), ...taskData });
  }
  resetTaskForm(false);
  scheduleSave(editingTaskId ? `editou uma tarefa de ${child.name}` : `adicionou uma tarefa para ${child.name}`);
  renderEditor();
  renderChild();
}

function loadTaskForEdit(taskId){
  const child = childById(editingChildId);
  const task = (child.routines[editingPeriod] || []).find(item => item.id === taskId);
  if(!task) return;
  editingTaskId = task.id;
  selectedTaskEmoji = task.emoji || '✅';
  selectedTaskDays = new Set(Array.isArray(task.days) && task.days.length ? task.days : [0,1,2,3,4,5,6]);
  $('taskEmoji').value = selectedTaskEmoji;
  $('taskName').value = task.name || '';
  $('taskTime').value = task.time || '';
  $('taskSteps').value = Array.isArray(task.steps) ? task.steps.join(', ') : '';
  $('taskMessage').value = task.message || '';
  $('taskImportant').checked = !!task.important;
  renderEditor();
  $('taskName').focus();
}

function resetTaskForm(shouldRender=true){
  editingTaskId = '';
  selectedTaskEmoji = '✅';
  selectedTaskDays = new Set([0,1,2,3,4,5,6]);
  if($('taskEmoji')) $('taskEmoji').value = selectedTaskEmoji;
  if($('taskName')) $('taskName').value = '';
  if($('taskTime')) $('taskTime').value = '';
  if($('taskSteps')) $('taskSteps').value = '';
  if($('taskMessage')) $('taskMessage').value = '';
  if($('taskImportant')) $('taskImportant').checked = false;
  if(shouldRender) renderEditor();
}

function deleteTask(taskId){
  const child = childById(editingChildId);
  child.routines[editingPeriod] = child.routines[editingPeriod].filter(t => t.id !== taskId);
  if(editingTaskId === taskId) resetTaskForm(false);
  scheduleSave(`excluiu uma tarefa de ${child.name}`);
  renderEditor();
  renderChild();
}

function moveTask(taskId, dir){
  const child = childById(editingChildId);
  const tasks = child.routines[editingPeriod];
  const index = tasks.findIndex(task => task.id === taskId);
  const nextIndex = index + dir;
  if(index < 0 || nextIndex < 0 || nextIndex >= tasks.length) return;
  [tasks[index], tasks[nextIndex]] = [tasks[nextIndex], tasks[index]];
  scheduleSave(`reorganizou a rotina de ${child.name}`);
  renderEditor();
  renderChild();
}

function cloneTask(task){
  return {
    ...task,
    id: crypto.randomUUID(),
    days: Array.isArray(task.days) ? [...task.days] : [0,1,2,3,4,5,6],
    steps: Array.isArray(task.steps) ? [...task.steps] : []
  };
}

function applyTemplate(templateId){
  const template = routineTemplates.find(item => item.id === templateId);
  if(!template) return;
  const target = childById(editingChildId || selectedChildId || childProfiles()[0]?.id || momProfile().id);
  periods.forEach(period => {
    target.routines[period.id] ||= [];
    (template.tasks[period.id] || []).forEach(task => target.routines[period.id].push(cloneTask(task)));
  });
  editingChildId = target.id;
  selectedProfileTab = target.type === 'mom' ? 'mom' : 'children';
  localStorage.setItem('rf_profileTab', selectedProfileTab);
  scheduleSave(`adicionou modelo pronto para ${target.name}`);
  renderAll();
  openEditor(target.id);
}

function copyRoutine(){
  const from = childById($('copyFrom').value);
  const to = childById($('copyTo').value);
  if(!from || !to || from.id === to.id) return;
  const ok = confirm(`Copiar toda a rotina de ${from.name} para ${to.name}? Isso troca as tarefas atuais do destino.`);
  if(!ok) return;
  to.routines = {
    manha: (from.routines.manha || []).map(cloneTask),
    tarde: (from.routines.tarde || []).map(cloneTask),
    noite: (from.routines.noite || []).map(cloneTask)
  };
  editingChildId = to.id;
  selectedProfileTab = to.type === 'mom' ? 'mom' : 'children';
  localStorage.setItem('rf_profileTab', selectedProfileTab);
  scheduleSave(`copiou a rotina de ${from.name} para ${to.name}`);
  renderAll();
  openEditor(to.id);
}

function editAgendaProfile(id){
  const profile = childById(id);
  selectedProfileTab = profile.type === 'mom' ? 'mom' : 'children';
  localStorage.setItem('rf_profileTab', selectedProfileTab);
  editingChildId = id;
  renderMom();
  openEditor(id);
}

function renderChild(){
  if(!$('childPicker') || !$('taskFocus') || !$('todayList')) return;
  const protectedOn = isChildProtectionOn();
  const lockedChild = protectedChild();
  const visibleChildren = protectedOn && lockedChild ? [lockedChild] : childProfiles();
  if(!selectedChildId || !visibleChildren.some(child => child.id === selectedChildId)) selectedChildId = visibleChildren[0]?.id || appState.children[0].id;
  localStorage.setItem('rf_selectedChild', selectedChildId);
  const child = childById(selectedChildId);
  const visual = profileThemeById(child.profileTheme);
  const mascot = mascotByTheme(child.profileTheme);
  applyChildPageTheme(child);
  $('childPicker').classList.toggle('protected-picker', protectedOn);
  $('childPicker').innerHTML = protectedOn
    ? `<div class="protected-child-label">🔒 Modo protegido: ${child.avatar} ${escapeHtml(child.name)}</div>`
    : visibleChildren.map(c => `<button class="${c.id===selectedChildId?'active':''}" data-pick-child="${c.id}">${c.avatar} ${c.name}</button>`).join('');
  if(!protectedOn) document.querySelectorAll('[data-pick-child]').forEach(btn => btn.addEventListener('click', () => { selectedChildId = btn.dataset.pickChild; renderChild(); }));
  if($('unlockProtectedBtn')) $('unlockProtectedBtn').hidden = !protectedOn;
  const age = childAge(child);
  $('childName').textContent = `${child.avatar} ${child.name}${age !== '' ? ' · ' + age + ' anos' : ''}`;
  $('childStars').textContent = `⭐ ${child.stars || 0}`;
  const period = currentPeriod();
  $('childPeriod').textContent = `Rotina da ${periods.find(p => p.id === period).label.toLowerCase()}`;
  const next = nextTask(child, period);
  const waiting = next ? null : nextUpcomingTask(child);
  renderDailyBadge(child);
  renderStreakBadge(child);
  if($('mascotCard')) $('mascotCard').innerHTML = `
    <div class="mascot-emoji">${next ? mascot.emoji : '😴'}</div>
    <div>
      <div class="mascot-name">${mascot.name}</div>
      <div class="mascot-text">${next ? 'Vamos fazer uma missão de cada vez.' : mascot.wait}</div>
    </div>
  `;
  $('taskFocus').classList.toggle('waiting', !next);
  $('taskFocus').innerHTML = next ? `
    <div class="focus-emoji">${next.important ? '❗' : (next.emoji || '✅')}</div>
    <div class="focus-name">${next.name}</div>
    <div class="focus-time">${next.time || 'Sem horário'}</div>
    ${next.message ? `<div class="focus-message">${escapeHtml(next.message)}</div>` : ''}
    ${taskStepsHtml(next)}
  ` : waiting ? `
    <div class="focus-emoji">${mascot.emoji}</div>
    <div class="focus-name">Modo espera</div>
    <div class="focus-time">Próxima missão: ${waiting.task.name} ${waiting.task.time ? 'às ' + waiting.task.time : ''}</div>
    <div class="countdown-pill">${countdownText(waiting.total)}</div>
  ` : `
    <div class="focus-emoji">🏅</div>
    <div class="focus-name">Dia completo</div>
    <div class="focus-time">Todas as missões de hoje foram feitas</div>
  `;
  if($('doneBtn')){
    $('doneBtn').disabled = !next;
    $('doneBtn').dataset.task = next?.id || '';
  }
  if($('skipBtn')){
    $('skipBtn').disabled = !next;
  }
  const tasks = tasksForToday(child, period);
  $('todayList').innerHTML = tasks.map(task => childTaskHtml(task, child)).join('');
}

function taskStepsHtml(task){
  if(!Array.isArray(task.steps) || !task.steps.length) return '';
  return `<div class="focus-steps">${task.steps.map((step, index) => `<div><strong>${index + 1}</strong> ${escapeHtml(step)}</div>`).join('')}</div>`;
}

function renderDailyBadge(child){
  if(!$('dailyBadge')) return;
  const todayTasks = periods.flatMap(period => tasksForToday(child, period.id));
  const doneCount = todayTasks.filter(task => isDone(child, task.id) || isSkipped(child, task.id)).length;
  const total = todayTasks.length;
  const complete = total > 0 && doneCount === total;
  $('dailyBadge').textContent = complete ? '🏅 Dia completo' : `⭐ ${doneCount}/${total} missões hoje`;
  $('dailyBadge').classList.toggle('complete', complete);
}

function renderStreakBadge(child){
  if(!$('streakBadge')) return;
  let streak = 0;
  const d = new Date();
  for(let i = 0; i < 30; i++){
    const key = dateKey(d);
    const done = child.done?.[key] && Object.values(child.done[key]).some(Boolean);
    if(!done) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  $('streakBadge').textContent = streak ? `🔥 ${streak} dia${streak > 1 ? 's' : ''} seguido${streak > 1 ? 's' : ''}` : '🌱 Começando hoje';
  $('streakBadge').classList.toggle('active', streak > 0);
}

function childTaskHtml(task, child){
  const done = isDone(child, task.id);
  const skipped = isSkipped(child, task.id);
  const steps = Array.isArray(task.steps) && task.steps.length ? `<div class="task-time">${task.steps.length} passinhos</div>` : '';
  return `
    <div class="task-item ${done?'done':''} ${skipped?'skipped':''} ${task.important?'important':''}">
      <div class="task-emoji">${done ? '✅' : skipped ? '⏭️' : task.important ? '❗' : (task.emoji || '✅')}</div>
      <div>
        <div class="task-name">${task.name}</div>
        <div class="task-time">${done ? 'Feita hoje' : skipped ? 'Pulada hoje' : (task.time || 'Sem horário')}</div>
        ${steps}
      </div>
      <button class="speak-part-btn" data-speak-task="${task.id}" title="Falar esta tarefa">🔊</button>
    </div>
  `;
}

function speakTask(child, taskId){
  const task = periods.flatMap(period => child.routines[period.id] || []).find(item => item.id === taskId);
  if(!task) return;
  const steps = Array.isArray(task.steps) && task.steps.length ? ` Passinhos: ${task.steps.join(', ')}.` : '';
  speak(task.message || `${child.name}, tarefa: ${task.name}.${task.time ? ' Horário: ' + task.time + '.' : ''}${steps}`);
}

function speakTodayTasks(){
  const child = childById(selectedChildId);
  const tasks = periods.flatMap(period => tasksForToday(child, period.id).map(task => ({ ...task, period: period.label })));
  if(!tasks.length) return speak(`${child.name}, não tem tarefas marcadas para hoje.`);
  const text = tasks.map(task => `${task.period}: ${task.name}${task.time ? ' às ' + task.time : ''}`).join('. ');
  speak(`${child.name}, suas tarefas de hoje são: ${text}.`);
}

function speakMomToday(){
  const items = todayAgendaItems();
  if(!items.length) return speak('Hoje não tem tarefas marcadas na agenda.');
  const text = items.map(item => `${item.task.time || 'sem horário'}, ${item.child.name}, ${item.task.name}`).join('. ');
  speak(`Agenda de hoje: ${text}.`);
}

function countdownText(targetMin){
  if(targetMin >= 9999) return 'Sem horário marcado';
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const diff = Math.max(0, targetMin - currentMin);
  if(diff === 0) return 'Está chegando agora';
  if(diff < 60) return `Faltam ${diff} min`;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m ? `Faltam ${h}h ${m}min` : `Faltam ${h}h`;
}

function nextTask(child, period){
  return tasksForToday(child, period).find(task => !isDone(child, task.id) && !isSkipped(child, task.id));
}

function tasksForToday(child, period){
  const today = new Date().getDay();
  return (child.routines[period] || [])
    .filter(task => !task.days || task.days.includes(today))
    .sort((a,b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
}

function nextUpcomingTask(child){
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const options = [];
  periods.forEach(period => {
    tasksForToday(child, period.id).forEach(task => {
      if(isDone(child, task.id)) return;
      if(isSkipped(child, task.id)) return;
      const total = task.time ? timeToMinutes(task.time) : 9999;
      if(total >= nowMin) options.push({ period, task, total });
    });
  });
  options.sort((a,b) => a.total - b.total);
  return options[0] || null;
}

function timeToMinutes(time){
  const [h,m] = String(time || '00:00').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function isDone(child, taskId){
  return !!child.done?.[todayKey()]?.[taskId];
}

function isSkipped(child, taskId){
  return !!child.skipped?.[todayKey()]?.[taskId];
}

function finishTask(child, taskId, announce=true){
  if(!child || !taskId) return;
  const task = periods.flatMap(period => child.routines[period.id] || []).find(item => item.id === taskId);
  child.done[todayKey()] ||= {};
  child.done[todayKey()][taskId] = true;
  if(child.skipped?.[todayKey()]) delete child.skipped[todayKey()][taskId];
  child.stars = Number(child.stars || 0) + 1;
  if(persistentAlarm && persistentAlarm.child.id === child.id && persistentAlarm.task.id === taskId) persistentAlarm = null;
  scheduleSave();
  if(announce) {
    showCelebration(child, task);
    gentleAlarmSpeak(`Muito bem, ${child.name}! Missão concluída. Você ganhou uma estrela.`, child);
  }
  renderAll();
}

function markDone(){
  const child = childById(selectedChildId);
  const taskId = $('doneBtn').dataset.task;
  if(!taskId) return;
  finishTask(child, taskId);
}

function skipTaskToday(child, taskId, announce=true){
  if(!taskId) return;
  child.skipped[todayKey()] ||= {};
  child.skipped[todayKey()][taskId] = true;
  if(persistentAlarm && persistentAlarm.child.id === child.id && persistentAlarm.task.id === taskId) persistentAlarm = null;
  scheduleSave();
  if(announce) speak(`${child.name}, tarefa pulada só por hoje.`);
  renderAll();
}

function skipToday(){
  skipTaskToday(childById(selectedChildId), $('doneBtn').dataset.task);
}

function finishAlarm(){
  if(!persistentAlarm) return;
  finishTask(persistentAlarm.child, persistentAlarm.task.id);
}

function skipAlarm(){
  if(!persistentAlarm) return;
  skipTaskToday(persistentAlarm.child, persistentAlarm.task.id);
}

function dismissAlarm(){
  stopSpeaking();
  persistentAlarm = null;
  renderAlarmOverlay();
  renderMomDashboard();
}

function showCelebration(child, task){
  const todayTasks = periods.flatMap(period => tasksForToday(child, period.id));
  const doneCount = todayTasks.filter(item => item.id === task?.id || isDone(child, item.id)).length;
  const complete = todayTasks.length > 0 && doneCount === todayTasks.length;
  const box = $('celebration');
  box.hidden = false;
  box.innerHTML = `
    <div class="celebration-card">
      <div class="celebration-emoji">${complete ? '🏅' : '⭐'}</div>
      <div class="celebration-title">${complete ? 'Dia completo!' : 'Você conseguiu!'}</div>
      <div class="celebration-text">${task ? escapeHtml(task.name) : 'Missão feita'} ${complete ? 'Todas as missões de hoje foram feitas.' : 'Mais uma estrelinha para você.'}</div>
    </div>
  `;
  setTimeout(() => { box.hidden = true; }, 3800);
}

function speakChild(child){
  const period = currentPeriod();
  const task = nextTask(child, period);
  if(!task){
    const waiting = nextUpcomingTask(child);
    if(waiting) return speak(`${dateSpeech()} ${child.name}, sua rotina de agora está completa. Modo espera. A próxima tarefa é ${waiting.task.name}${waiting.task.time ? ' às ' + waiting.task.time : ''}.`);
    return speak(`${dateSpeech()} ${child.name}, todas as tarefas foram feitas. Muito bem!`);
  }
  const steps = Array.isArray(task.steps) && task.steps.length ? ` Os passinhos são: ${task.steps.join(', ')}.` : '';
  speak(task.message || `${dateSpeech()} ${child.name}, sua rotina de agora é ${periods.find(p => p.id === period).label}. Você tem que fazer: ${task.name}.${steps} ${task.time ? 'Horário: ' + task.time + '.' : ''}`);
}

function speakCurrentMission(){
  const child = childById(selectedChildId);
  const period = currentPeriod();
  const task = nextTask(child, period);
  const periodLabel = periods.find(p => p.id === period)?.label || 'agora';
  if(!task){
    const waiting = nextUpcomingTask(child);
    if(waiting) return speak(`${child.name}, a rotina de ${periodLabel} está completa. Modo espera. Próxima tarefa: ${waiting.task.name}${waiting.task.time ? ' às ' + waiting.task.time : ''}.`);
    return speak(`${child.name}, todas as tarefas de hoje foram feitas. Muito bem!`);
  }
  const steps = Array.isArray(task.steps) && task.steps.length ? ` Passinhos: ${task.steps.join(', ')}.` : '';
  speak(task.message || `${child.name}, missão de agora: ${task.name}.${task.time ? ' Horário: ' + task.time + '.' : ''}${steps}`);
}

function alarmText(child, period, task){
  return task.message || `${dateSpeech()} ${child.name}, chegou a hora com calma. Sua rotina de agora é ${period.label}. Agora é hora de ${task.name}.`;
}

function renderAlarmOverlay(){
  const box = $('alarmOverlay');
  if(!box) return;
  if(!persistentAlarm || isDone(persistentAlarm.child, persistentAlarm.task.id) || isSkipped(persistentAlarm.child, persistentAlarm.task.id)){
    box.hidden = true;
    box.innerHTML = '';
    return;
  }
  const { child, task, period } = persistentAlarm;
  box.hidden = false;
  box.innerHTML = `
    <div class="alarm-card">
      <div class="alarm-kicker">Alarme tocando</div>
      <div class="alarm-time">${task.time || 'Agora'}</div>
      <div class="alarm-profile">${child.avatar} ${escapeHtml(child.name)}</div>
      <div class="alarm-task">${task.important ? '❗ ' : ''}${task.emoji || '✅'} ${escapeHtml(task.name)}</div>
      <div class="alarm-period">${period.label}</div>
      ${task.message ? `<div class="alarm-message">${escapeHtml(task.message)}</div>` : ''}
      <div class="alarm-actions">
        <button class="primary" id="alarmDoneBtn">Já fiz</button>
        <button class="secondary" id="alarmRepeatBtn">🔊 Falar de novo</button>
        <button class="secondary" id="alarmSkipBtn">Pular hoje</button>
        <button class="secondary danger" id="alarmDismissBtn">Desligar</button>
      </div>
    </div>
  `;
}

function testFullAlarm(childId, periodId, taskId){
  const child = childById(childId);
  const period = periods.find(item => item.id === periodId) || periods.find(item => item.id === currentPeriod());
  const task = (child.routines[period.id] || []).find(item => item.id === taskId);
  if(!task) return;
  gentleAlarmSpeak(alarmText(child, period, task), child);
}

function askForHelp(){
  const child = childById(selectedChildId);
  gentleAlarmSpeak(`${child.name} precisa de ajuda com a rotina.`, child);
}

function enterFullscreen(){
  const target = $('childView') || document.documentElement;
  if(document.fullscreenElement) return document.exitFullscreen?.();
  target.requestFullscreen?.();
}

function dateSpeech(){
  const d = new Date();
  return `Hoje é ${longWeekDays[d.getDay()]}, dia ${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}.`;
}

function speak(text){
  if(!('speechSynthesis' in window)) return;
  stopSpeaking();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'pt-BR';
  u.rate = .84;
  u.pitch = 1.08;
  speechSynthesis.speak(u);
}

function stopSpeaking(){
  if(pendingSpeechTimer){
    clearTimeout(pendingSpeechTimer);
    pendingSpeechTimer = null;
  }
  if('speechSynthesis' in window) speechSynthesis.cancel();
}

function playToneSequence(notes, duration=.55, volume=.045, wave='sine'){
  try{
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if(!Ctx) return;
    audioContext ||= new Ctx();
    if(audioContext.state === 'suspended') audioContext.resume();
    const now = audioContext.currentTime;
    notes.forEach((freq, index) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = wave;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + index * 0.18);
      gain.gain.exponentialRampToValueAtTime(volume, now + index * 0.18 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.18 + duration);
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.start(now + index * 0.18);
      osc.stop(now + index * 0.18 + duration + 0.05);
    });
  }catch(e){}
}

function playAlarmSound(child){
  const sound = child?.alarmSound || 'suave';
  if(sound === 'mudo' || sound === 'voz') return;
  const presets = {
    suave: { notes:[523.25, 659.25, 783.99], duration:.55, volume:.045, wave:'sine' },
    estrelas: { notes:[880, 1174.66, 1046.5, 1318.51], duration:.34, volume:.035, wave:'sine' },
    agua: { notes:[392, 493.88, 587.33], duration:.75, volume:.032, wave:'triangle' },
    tambor: { notes:[180, 150, 210], duration:.16, volume:.055, wave:'sine' }
  };
  const preset = presets[sound] || presets.suave;
  playToneSequence(preset.notes, preset.duration, preset.volume, preset.wave);
}

function gentleAlarmSpeak(text, child=null){
  stopSpeaking();
  if(child?.alarmSound === 'mudo') return;
  playAlarmSound(child);
  pendingSpeechTimer = setTimeout(() => {
    pendingSpeechTimer = null;
    speak(text);
  }, child?.alarmSound === 'voz' || child?.alarmSound === 'mudo' ? 120 : 900);
}

function speakTime(){
  const d = new Date();
  speak(`${dateSpeech()} Agora são ${String(d.getHours()).padStart(2,'0')} horas e ${String(d.getMinutes()).padStart(2,'0')} minutos.`);
}

function renderTimeSpeechSettings(){
  const select = $('timeAnnounceInterval');
  if(!select) return;
  select.value = String(timeAnnounceInterval);
}

function setTimeAnnounceInterval(minutes){
  timeAnnounceInterval = Number(minutes || 0);
  localStorage.setItem('rf_timeAnnounceInterval', String(timeAnnounceInterval));
  startTimeAnnouncer();
}

function startTimeAnnouncer(){
  clearInterval(timeAnnounceTimer);
  timeAnnounceTimer = null;
  if(timeAnnounceInterval > 0){
    timeAnnounceTimer = setInterval(speakTime, timeAnnounceInterval * 60 * 1000);
  }
}

function tick(){
  const d = new Date();
  const timeText = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
  if($('momClock')) $('momClock').textContent = timeText;
  if($('momDate')) $('momDate').textContent = `${longWeekDays[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]}`;
  if($('momBigClock')) $('momBigClock').textContent = timeText;
  if($('momBigDate')) $('momBigDate').textContent = `${longWeekDays[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
  $('clock').textContent = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function checkTaskAlarms(){
  if(persistentAlarm && !isDone(persistentAlarm.child, persistentAlarm.task.id) && !isSkipped(persistentAlarm.child, persistentAlarm.task.id)){
    renderAlarmOverlay();
    const now = Date.now();
    if(!persistentAlarm.lastReminderAt || now - persistentAlarm.lastReminderAt > 90000){
      persistentAlarm.lastReminderAt = now;
      gentleAlarmSpeak(`${persistentAlarm.child.name}, lembrete calminho. Ainda está na hora de ${persistentAlarm.task.name}. Quando terminar, toque no botão Já fiz.`, persistentAlarm.child);
    }
    return;
  }
  if(persistentAlarm && (isDone(persistentAlarm.child, persistentAlarm.task.id) || isSkipped(persistentAlarm.child, persistentAlarm.task.id))) {
    persistentAlarm = null;
    renderAlarmOverlay();
  }
  const now = new Date();
  const today = now.getDay();
  const current = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const lockedChild = isChildProtectionOn() ? protectedChild() : null;
  appState.children.forEach(child => {
    if(lockedChild && child.id !== lockedChild.id) return;
    periods.forEach(period => {
      (child.routines[period.id] || []).forEach(task => {
        if(!task.time || task.time !== current) return;
        if(task.days && !task.days.includes(today)) return;
        if(isSkipped(child, task.id)) return;
        const key = `${todayKey()}_${child.id}_${task.id}_${current}`;
        if(firedAlarmKeys.has(key)) return;
        firedAlarmKeys.add(key);
        persistentAlarm = { child, task, period, lastReminderAt: Date.now() };
        if(child.type !== 'mom'){
          selectedChildId = child.id;
          mode = 'child';
          localStorage.setItem('rf_mode', mode);
          renderAll();
        }
        renderAlarmOverlay();
        gentleAlarmSpeak(alarmText(child, period, task), child);
      });
    });
  });
}

function escapeAttr(value){
  return String(value ?? '').replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
}

function escapeHtml(value){
  return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}

function formatShortDate(value){
  const d = new Date(value);
  if(Number.isNaN(d.getTime())) return '';
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function addChild(){
  if(selectedProfileTab === 'mom'){
    const profile = momProfile();
    editingChildId = profile.id;
    renderMom();
    openEditor(profile.id);
    return;
  }
  const child = { id: crypto.randomUUID(), type:'child', name: `Filho ${childProfiles().length + 1}`, birthDate: '', avatar: '⭐', profileTheme:'bichinhos', routines: emptyRoutines(), done: {} };
  appState.children.push(child);
  editingChildId = child.id;
  selectedChildId = child.id;
  scheduleSave(`adicionou o perfil de ${child.name}`);
  renderAll();
}

function askFamilyPin(){
  const pin = prompt('Senha do modo família:');
  return pin === momPin;
}

function enableProtectedChildMode(){
  const childId = $('protectedChildSelect')?.value || childProfiles()[0]?.id || '';
  const child = childById(childId);
  if(!child || child.type === 'mom') return;
  appState.childProtection = { enabled: true, childId: child.id };
  selectedChildId = child.id;
  mode = 'child';
  localStorage.setItem('rf_selectedChild', selectedChildId);
  localStorage.setItem('rf_mode', mode);
  scheduleSave(`ativou o modo criança protegido para ${child.name}`);
  renderAll();
}

function disableProtectedChildMode(requirePin=true){
  if(requirePin && !askFamilyPin()) return;
  const child = protectedChild();
  appState.childProtection = { enabled: false, childId: child?.id || '' };
  mode = 'mom';
  localStorage.setItem('rf_mode', mode);
  scheduleSave(child ? `desativou o modo criança protegido de ${child.name}` : 'desativou o modo criança protegido');
  renderAll();
}

function clearConfig(){
  localStorage.removeItem('rf_firebaseConfig');
  localStorage.removeItem('rf_familyCode');
  localStorage.removeItem('rf_authMode');
  location.reload();
}

$('firebaseConfig').value = defaultConfigText;
$('familyCode').value = familyCode;
$('momPin').value = momPin;
$('connectBtn').addEventListener('click', connectFirebase);
$('googleLoginBtn').addEventListener('click', loginGoogle);
$('logoutBtn').addEventListener('click', logoutGoogle);
$('clearConfigBtn').addEventListener('click', clearConfig);
$('addChildBtn').addEventListener('click', addChild);
$('closeEditorBtn').addEventListener('click', () => { editingChildId = ''; $('routineEditor').hidden = true; });
$('addTaskBtn').addEventListener('click', addTask);
$('cancelTaskEditBtn').addEventListener('click', () => resetTaskForm(true));
if($('timeAnnounceInterval')) $('timeAnnounceInterval').addEventListener('change', () => setTimeAnnounceInterval($('timeAnnounceInterval').value));
document.addEventListener('click', (event) => {
  const target = event.target.closest('button');
  if(!target) return;
  const run = (action) => {
    event.preventDefault();
    event.stopPropagation();
    action();
  };
  if(target.dataset.mode) return run(() => switchMode(target.dataset.mode));
  if(target.id === 'doneBtn') return run(markDone);
  if(target.id === 'skipBtn') return run(skipToday);
  if(target.id === 'repeatBtn') return run(speakCurrentMission);
  if(target.id === 'speakTodayBtn') return run(speakTodayTasks);
  if(target.id === 'speakMomTodayBtn') return run(speakMomToday);
  if(target.id === 'copyRoutineBtn') return run(copyRoutine);
  if(target.id === 'sendInviteBtn') return run(sendInvite);
  if(target.id === 'enableProtectedBtn') return run(enableProtectedChildMode);
  if(target.id === 'disableProtectedBtn') return run(() => disableProtectedChildMode(true));
  if(target.id === 'unlockProtectedBtn') return run(() => disableProtectedChildMode(true));
  if(target.id === 'stopSpeechBtn') return run(stopSpeaking);
  if(target.id === 'fullscreenBtn') return run(enterFullscreen);
  if(target.id === 'helpBtn') return run(askForHelp);
  if(target.id === 'alarmDoneBtn') return run(finishAlarm);
  if(target.id === 'alarmSkipBtn') return run(skipAlarm);
  if(target.id === 'alarmDismissBtn') return run(dismissAlarm);
  if(target.id === 'alarmRepeatBtn') return run(() => persistentAlarm && gentleAlarmSpeak(alarmText(persistentAlarm.child, persistentAlarm.period, persistentAlarm.task), persistentAlarm.child));
  if(target.id === 'speakTimeBtn' || target.id === 'speakTimeBigBtn' || target.id === 'childSpeakTimeBtn') return run(speakTime);
  if(target.dataset.speakTask) return run(() => speakTask(childById(selectedChildId), target.dataset.speakTask));
  if(target.dataset.speakAgendaTask){
    const [childId, taskId] = target.dataset.speakAgendaTask.split(':');
    return run(() => speakTask(childById(childId), taskId));
  }
  if(target.dataset.editAgenda) return run(() => editAgendaProfile(target.dataset.editAgenda));
  if(target.dataset.testAlarm){
    const [childId, periodId, taskId] = target.dataset.testAlarm.split(':');
    return run(() => testFullAlarm(childId, periodId, taskId));
  }
  if(target.dataset.inviteAccept) return run(() => answerInvite(target.dataset.inviteAccept, 'accepted'));
  if(target.dataset.inviteDecline) return run(() => answerInvite(target.dataset.inviteDecline, 'declined'));
  if(target.dataset.template) return run(() => applyTemplate(target.dataset.template));
});
function switchMode(nextMode){
  if(isChildProtectionOn() && nextMode === 'mom') return disableProtectedChildMode(true);
  if(mode === 'child' && nextMode === 'mom'){
    if(!askFamilyPin()) return;
  }
  mode = nextMode;
  localStorage.setItem('rf_mode', mode);
  renderAll();
}
setInterval(tick, 1000);
setInterval(checkTaskAlarms, 30000);
tick();
startTimeAnnouncer();
if(defaultConfigText && localStorage.getItem('rf_authMode') === 'google') {
  try { initFirebaseFromForm(); } catch(e) { renderAll(); }
} else if(defaultConfigText && familyCode) connectFirebase();
else renderAll();
if('serviceWorker' in navigator){
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if(refreshing) return;
    refreshing = true;
    location.reload();
  });
  navigator.serviceWorker.register(`./sw.js?${APP_VERSION}`).then(reg => reg.update()).catch(()=>{});
}
