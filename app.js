import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getFirestore, doc, setDoc, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const $ = (id) => document.getElementById(id);
const periods = [
  { id: 'manha', label: 'Manhã', emoji: '☀️' },
  { id: 'tarde', label: 'Tarde', emoji: '🌤️' },
  { id: 'noite', label: 'Noite', emoji: '🌙' },
];
const defaultConfigText = localStorage.getItem('rf_firebaseConfig') || '';
let familyCode = localStorage.getItem('rf_familyCode') || '';
let momPin = localStorage.getItem('rf_momPin') || '1234';
let appState = loadLocalState();
let db = null;
let remoteRef = null;
let unsub = null;
let saveTimer = null;
let applyingRemote = false;
let mode = localStorage.getItem('rf_mode') || 'mom';
let selectedChildId = localStorage.getItem('rf_selectedChild') || '';
let editingChildId = '';
let editingPeriod = 'manha';

function loadLocalState(){
  const saved = localStorage.getItem('rf_state');
  if(saved){
    try { return normalizeState(JSON.parse(saved)); } catch(e) {}
  }
  return normalizeState({
    children: [
      { id: crypto.randomUUID(), name: 'Criança', age: '', avatar: '⭐', routines: emptyRoutines(), done: {} }
    ],
    updatedAtLocal: new Date().toISOString()
  });
}

function emptyRoutines(){
  return {
    manha: [
      { id: crypto.randomUUID(), emoji: '🦷', name: 'Escovar os dentes', time: '07:30' },
      { id: crypto.randomUUID(), emoji: '🎒', name: 'Pegar mochila', time: '07:50' }
    ],
    tarde: [
      { id: crypto.randomUUID(), emoji: '📚', name: 'Fazer tarefa', time: '14:30' }
    ],
    noite: [
      { id: crypto.randomUUID(), emoji: '😴', name: 'Dormir', time: '20:30' }
    ]
  };
}

function normalizeState(state){
  state.children = Array.isArray(state.children) ? state.children : [];
  if(!state.children.length) state.children.push({ id: crypto.randomUUID(), name:'Criança', age:'', avatar:'⭐', routines: emptyRoutines(), done:{} });
  state.children.forEach(child => {
    child.id ||= crypto.randomUUID();
    child.name ||= 'Criança';
    child.age ??= '';
    child.avatar ||= '⭐';
    child.routines ||= emptyRoutines();
    child.done ||= {};
    periods.forEach(p => child.routines[p.id] ||= []);
  });
  return state;
}

function todayKey(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function currentPeriod(){
  const h = new Date().getHours();
  return h < 12 ? 'manha' : h < 18 ? 'tarde' : 'noite';
}

function saveLocal(){
  localStorage.setItem('rf_state', JSON.stringify(appState));
}

function scheduleSave(){
  saveLocal();
  if(!remoteRef || applyingRemote) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(pushState, 500);
}

async function pushState(){
  if(!remoteRef) return;
  appState.updatedAtLocal = new Date().toISOString();
  await setDoc(remoteRef, { state: appState, updatedAt: serverTimestamp() }, { merge: true });
  setStatus('Salvo no Firebase', true);
}

function setStatus(text, ok=false){
  $('syncStatus').textContent = text;
  $('syncStatus').style.color = ok ? 'var(--green)' : 'var(--muted)';
}

function parseFirebaseConfig(text){
  const raw = text.trim();
  if(!raw) throw new Error('config');
  try { return JSON.parse(raw); } catch(e) {}
  const match = raw.match(/\{[\s\S]*\}/);
  if(!match) throw new Error('config');
  return Function('"use strict";return (' + match[0] + ');')();
}

async function connectFirebase(){
  try{
    const cfgText = $('firebaseConfig').value.trim();
    familyCode = cleanFamilyCode($('familyCode').value);
    momPin = ($('momPin').value || '1234').trim();
    if(!familyCode) throw new Error('family');
    const firebaseConfig = parseFirebaseConfig(cfgText);
    localStorage.setItem('rf_firebaseConfig', cfgText);
    localStorage.setItem('rf_familyCode', familyCode);
    localStorage.setItem('rf_momPin', momPin);
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    remoteRef = doc(db, 'familias', familyCode, 'plataforma', 'principal');
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
      setStatus('Conectado ao Firestore', true);
    }, () => setStatus('Sem permissão no Firestore'));
    $('setupPanel').hidden = true;
    $('modePanel').hidden = false;
    renderAll();
  }catch(e){
    setStatus('Confira firebaseConfig, código e regras');
  }
}

function cleanFamilyCode(code){
  return (code || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').slice(0, 40);
}

function childById(id){
  return appState.children.find(c => c.id === id) || appState.children[0];
}

function renderAll(){
  renderMode();
  renderMom();
  renderChild();
}

function renderMode(){
  document.querySelectorAll('.segmented button').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
  $('momView').hidden = mode !== 'mom';
  $('childView').hidden = mode !== 'child';
}

function renderMom(){
  $('childrenGrid').innerHTML = appState.children.map(child => `
    <div class="child-card">
      <div class="child-card-head">
        <div class="avatar">${child.avatar}</div>
        <div>
          <div class="task-name">${child.name}</div>
          <div class="task-time">${child.age !== '' ? child.age + ' anos' : 'idade não informada'}</div>
        </div>
      </div>
      <div class="child-fields">
        <input value="${escapeAttr(child.name)}" data-child-name="${child.id}" placeholder="Nome">
        <input value="${escapeAttr(child.age)}" data-child-age="${child.id}" type="number" min="0" max="18" placeholder="Idade">
      </div>
      <div class="child-fields">
        <input value="${escapeAttr(child.avatar)}" data-child-avatar="${child.id}" maxlength="2" placeholder="⭐">
        <button class="secondary" data-edit="${child.id}">Rotina</button>
      </div>
      <div class="child-card-actions">
        <button class="secondary" data-speak="${child.id}">Falar</button>
        <button class="secondary" data-remove="${child.id}">Remover</button>
      </div>
    </div>
  `).join('');
  bindChildCards();
  if(editingChildId) renderEditor();
}

function bindChildCards(){
  document.querySelectorAll('[data-child-name]').forEach(el => el.addEventListener('input', () => updateChild(el.dataset.childName, { name: el.value || 'Criança' })));
  document.querySelectorAll('[data-child-age]').forEach(el => el.addEventListener('input', () => updateChild(el.dataset.childAge, { age: el.value })));
  document.querySelectorAll('[data-child-avatar]').forEach(el => el.addEventListener('input', () => updateChild(el.dataset.childAvatar, { avatar: el.value || '⭐' })));
  document.querySelectorAll('[data-edit]').forEach(el => el.addEventListener('click', () => openEditor(el.dataset.edit)));
  document.querySelectorAll('[data-remove]').forEach(el => el.addEventListener('click', () => removeChild(el.dataset.remove)));
  document.querySelectorAll('[data-speak]').forEach(el => el.addEventListener('click', () => speakChild(childById(el.dataset.speak))));
}

function updateChild(id, patch){
  const child = childById(id);
  Object.assign(child, patch);
  scheduleSave();
  renderChild();
}

function removeChild(id){
  if(appState.children.length <= 1) return;
  appState.children = appState.children.filter(c => c.id !== id);
  if(selectedChildId === id) selectedChildId = appState.children[0].id;
  if(editingChildId === id) editingChildId = '';
  scheduleSave();
  renderAll();
}

function openEditor(id){
  editingChildId = id;
  editingPeriod = currentPeriod();
  $('routineEditor').hidden = false;
  renderEditor();
}

function renderEditor(){
  const child = childById(editingChildId);
  $('editorTitle').textContent = `${child.avatar} Rotina de ${child.name}`;
  $('editorSubtitle').textContent = child.age !== '' ? `${child.age} anos` : 'Sem idade cadastrada';
  $('periodTabs').innerHTML = periods.map(p => `<button class="${p.id===editingPeriod?'active':''}" data-period="${p.id}">${p.emoji} ${p.label}</button>`).join('');
  document.querySelectorAll('[data-period]').forEach(btn => btn.addEventListener('click', () => { editingPeriod = btn.dataset.period; renderEditor(); }));
  const tasks = child.routines[editingPeriod] || [];
  $('taskList').innerHTML = tasks.length ? tasks.map(task => taskHtml(task, child)).join('') : '<p class="muted">Sem tarefas neste período.</p>';
  document.querySelectorAll('[data-delete-task]').forEach(btn => btn.addEventListener('click', () => deleteTask(btn.dataset.deleteTask)));
}

function taskHtml(task, child){
  const done = isDone(child, task.id);
  return `
    <div class="task-item ${done?'done':''}">
      <div class="task-emoji">${task.emoji || '✅'}</div>
      <div>
        <div class="task-name">${task.name}</div>
        <div class="task-time">${task.time || 'Sem horário'}</div>
      </div>
      <button class="secondary" data-delete-task="${task.id}">Excluir</button>
    </div>
  `;
}

function addTask(){
  if(!editingChildId) return;
  const name = $('taskName').value.trim();
  if(!name) return;
  const child = childById(editingChildId);
  child.routines[editingPeriod].push({
    id: crypto.randomUUID(),
    emoji: $('taskEmoji').value || '✅',
    name,
    time: $('taskTime').value
  });
  $('taskEmoji').value = '';
  $('taskName').value = '';
  $('taskTime').value = '';
  scheduleSave();
  renderEditor();
  renderChild();
}

function deleteTask(taskId){
  const child = childById(editingChildId);
  child.routines[editingPeriod] = child.routines[editingPeriod].filter(t => t.id !== taskId);
  scheduleSave();
  renderEditor();
  renderChild();
}

function renderChild(){
  if(!selectedChildId || !childById(selectedChildId)) selectedChildId = appState.children[0].id;
  localStorage.setItem('rf_selectedChild', selectedChildId);
  const child = childById(selectedChildId);
  $('childPicker').innerHTML = appState.children.map(c => `<button class="${c.id===selectedChildId?'active':''}" data-pick-child="${c.id}">${c.avatar} ${c.name}</button>`).join('');
  document.querySelectorAll('[data-pick-child]').forEach(btn => btn.addEventListener('click', () => { selectedChildId = btn.dataset.pickChild; renderChild(); }));
  $('childName').textContent = `${child.avatar} ${child.name}${child.age !== '' ? ' · ' + child.age + ' anos' : ''}`;
  const period = currentPeriod();
  $('childPeriod').textContent = `Rotina da ${periods.find(p => p.id === period).label.toLowerCase()}`;
  const next = nextTask(child, period);
  $('taskFocus').innerHTML = next ? `
    <div class="focus-emoji">${next.emoji || '✅'}</div>
    <div class="focus-name">${next.name}</div>
    <div class="focus-time">${next.time || 'Sem horário'}</div>
  ` : `
    <div class="focus-emoji">⭐</div>
    <div class="focus-name">Tudo pronto</div>
    <div class="focus-time">Sem tarefa pendente agora</div>
  `;
  $('doneBtn').disabled = !next;
  $('doneBtn').dataset.task = next?.id || '';
  const tasks = child.routines[period] || [];
  $('todayList').innerHTML = tasks.map(task => childTaskHtml(task, child)).join('');
}

function childTaskHtml(task, child){
  const done = isDone(child, task.id);
  return `
    <div class="task-item ${done?'done':''}">
      <div class="task-emoji">${done ? '✅' : (task.emoji || '✅')}</div>
      <div>
        <div class="task-name">${task.name}</div>
        <div class="task-time">${done ? 'Feita hoje' : (task.time || 'Sem horário')}</div>
      </div>
      <div class="task-time">${done ? 'OK' : ''}</div>
    </div>
  `;
}

function nextTask(child, period){
  return (child.routines[period] || []).find(task => !isDone(child, task.id));
}

function isDone(child, taskId){
  return !!child.done?.[todayKey()]?.[taskId];
}

function markDone(){
  const child = childById(selectedChildId);
  const taskId = $('doneBtn').dataset.task;
  if(!taskId) return;
  child.done[todayKey()] ||= {};
  child.done[todayKey()][taskId] = true;
  scheduleSave();
  speak('Muito bem! Tarefa concluída.');
  renderChild();
}

function speakChild(child){
  const period = currentPeriod();
  const task = nextTask(child, period);
  if(!task) return speak(`${child.name}, todas as tarefas foram feitas. Muito bem!`);
  speak(`${child.name}, agora é hora de ${task.name}. ${task.time ? 'Horário: ' + task.time + '.' : ''}`);
}

function speak(text){
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'pt-BR';
  u.rate = .88;
  speechSynthesis.speak(u);
}

function speakTime(){
  const d = new Date();
  speak(`Agora são ${String(d.getHours()).padStart(2,'0')} horas e ${String(d.getMinutes()).padStart(2,'0')} minutos.`);
}

function tick(){
  const d = new Date();
  $('clock').textContent = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function escapeAttr(value){
  return String(value ?? '').replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
}

function addChild(){
  const child = { id: crypto.randomUUID(), name: `Filho ${appState.children.length + 1}`, age: '', avatar: '⭐', routines: emptyRoutines(), done: {} };
  appState.children.push(child);
  editingChildId = child.id;
  selectedChildId = child.id;
  scheduleSave();
  renderAll();
}

function clearConfig(){
  localStorage.removeItem('rf_firebaseConfig');
  localStorage.removeItem('rf_familyCode');
  location.reload();
}

$('firebaseConfig').value = defaultConfigText;
$('familyCode').value = familyCode;
$('momPin').value = momPin;
$('connectBtn').addEventListener('click', connectFirebase);
$('clearConfigBtn').addEventListener('click', clearConfig);
$('addChildBtn').addEventListener('click', addChild);
$('closeEditorBtn').addEventListener('click', () => { editingChildId = ''; $('routineEditor').hidden = true; });
$('addTaskBtn').addEventListener('click', addTask);
$('doneBtn').addEventListener('click', markDone);
$('repeatBtn').addEventListener('click', () => speakChild(childById(selectedChildId)));
$('speakTimeBtn').addEventListener('click', speakTime);
document.querySelectorAll('.segmented button').forEach(btn => btn.addEventListener('click', () => {
  if(mode === 'child' && btn.dataset.mode === 'mom'){
    const pin = prompt('Senha do modo mãe:');
    if(pin !== momPin) return;
  }
  mode = btn.dataset.mode;
  localStorage.setItem('rf_mode', mode);
  renderAll();
}));
setInterval(tick, 1000);
tick();
if(defaultConfigText && familyCode) connectFirebase();
else renderAll();
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
