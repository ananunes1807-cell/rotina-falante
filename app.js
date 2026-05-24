import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getFirestore, doc, setDoc, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const $ = (id) => document.getElementById(id);
const periods = [
  { id: 'manha', label: 'Manhã', emoji: '☀️' },
  { id: 'tarde', label: 'Tarde', emoji: '🌤️' },
  { id: 'noite', label: 'Noite', emoji: '🌙' },
];
const weekDays = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const longWeekDays = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const taskEmojis = ['✅','🦷','🚿','👕','🍽️','🍎','💊','📚','🎒','🧹','🛁','🎮','📖','😴','☕','🚗','🧘','⭐'];
const themes = [
  { id:'ceu', label:'Céu', emoji:'💙' },
  { id:'arcoiris', label:'Arco-íris', emoji:'🌈' },
  { id:'galaxia', label:'Galáxia', emoji:'🚀' },
  { id:'jardim', label:'Jardim', emoji:'🌿' },
];
const profileThemes = [
  { id:'bichinhos', label:'Bichinhos', emoji:'🐾', bg:'linear-gradient(135deg,#d7f8dc,#b4e4ff)' },
  { id:'dinossauro', label:'Dino', emoji:'🦕', bg:'linear-gradient(135deg,#d8f5c8,#7ed957)' },
  { id:'princesa', label:'Princesa', emoji:'🌸', bg:'linear-gradient(135deg,#ffe1f1,#ffc6df)' },
  { id:'espaco', label:'Espaço', emoji:'🚀', bg:'linear-gradient(135deg,#202955,#6877ff)' },
  { id:'mae', label:'Mãe', emoji:'☕', bg:'linear-gradient(135deg,#f2e8ff,#d8c7ff)' },
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
let selectedTaskDays = new Set([0,1,2,3,4,5,6]);
let selectedTaskEmoji = '✅';
let firedAlarmKeys = new Set();
let persistentAlarm = null;

function loadLocalState(){
  const saved = localStorage.getItem('rf_state');
  if(saved){
    try { return normalizeState(JSON.parse(saved)); } catch(e) {}
  }
  return normalizeState({
    theme: 'ceu',
    children: [
      { id: crypto.randomUUID(), type:'child', name: 'Criança', birthDate: '', avatar: '⭐', profileTheme:'bichinhos', routines: emptyRoutines(), done: {} },
      { id: crypto.randomUUID(), type:'mom', name: 'Mãe', birthDate: '', avatar: '☕', profileTheme:'mae', routines: emptyRoutines(), done: {} }
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
  state.children = Array.isArray(state.children) ? state.children : [];
  if(!state.children.length) state.children.push({ id: crypto.randomUUID(), type:'child', name:'Criança', birthDate:'', avatar:'⭐', profileTheme:'bichinhos', routines: emptyRoutines(), done:{} });
  if(!state.children.some(child => child.type === 'mom')) state.children.push({ id: crypto.randomUUID(), type:'mom', name:'Mãe', birthDate:'', avatar:'☕', profileTheme:'mae', routines: emptyRoutines(), done:{} });
  state.children.forEach(child => {
    child.id ||= crypto.randomUUID();
    child.name ||= 'Criança';
    child.type ||= child.name.toLowerCase().includes('mãe') || child.name.toLowerCase().includes('mae') ? 'mom' : 'child';
    child.birthDate ||= '';
    child.manualAge = child.manualAge ?? child.age ?? '';
    delete child.age;
    child.avatar ||= '⭐';
    child.profileTheme ||= child.type === 'mom' ? 'mae' : 'bichinhos';
    child.stars = Number(child.stars || 0);
    child.routines ||= emptyRoutines();
    child.done ||= {};
    periods.forEach(p => child.routines[p.id] ||= []);
    periods.forEach(p => child.routines[p.id].forEach(task => {
      task.days = Array.isArray(task.days) ? task.days : [0,1,2,3,4,5,6];
    }));
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

function childProfiles(){
  return appState.children.filter(child => child.type !== 'mom');
}

function profileThemeById(id){
  return profileThemes.find(theme => theme.id === id) || profileThemes[0];
}

function renderAll(){
  applyTheme(appState.theme);
  renderMode();
  renderThemes();
  renderMom();
  renderChild();
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
    scheduleSave();
    renderAll();
  }));
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
          <div class="task-time">${child.type === 'mom' ? 'Rotina da mãe' : ageText(child)} · ⭐ ${child.stars || 0}</div>
        </div>
      </div>
      <div class="child-fields">
        <input value="${escapeAttr(child.name)}" data-child-name="${child.id}" placeholder="Nome">
        <input value="${escapeAttr(child.birthDate)}" data-child-birth="${child.id}" type="date" title="Data de nascimento">
      </div>
      <div class="child-fields">
        <input value="${escapeAttr(child.avatar)}" data-child-avatar="${child.id}" maxlength="2" placeholder="⭐">
        <button class="secondary" data-edit="${child.id}">Rotina</button>
      </div>
      <div class="profile-theme-row">
        ${profileThemes.map(theme => `<button class="profile-theme-chip ${child.profileTheme===theme.id?'active':''}" data-profile-theme="${child.id}:${theme.id}">${theme.emoji} ${theme.label}</button>`).join('')}
      </div>
      <label class="type-toggle">
        <input type="checkbox" ${child.type === 'mom' ? 'checked' : ''} data-profile-type="${child.id}">
        Rotina da mãe
      </label>
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
  document.querySelectorAll('[data-child-birth]').forEach(el => el.addEventListener('input', () => updateChild(el.dataset.childBirth, { birthDate: el.value })));
  document.querySelectorAll('[data-child-avatar]').forEach(el => el.addEventListener('input', () => updateChild(el.dataset.childAvatar, { avatar: el.value || '⭐' })));
  document.querySelectorAll('[data-profile-theme]').forEach(el => el.addEventListener('click', () => {
    const [id, profileTheme] = el.dataset.profileTheme.split(':');
    updateChild(id, { profileTheme });
    renderMom();
  }));
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
  Object.assign(child, patch);
  scheduleSave();
  renderChild();
}

function removeChild(id){
  if(appState.children.length <= 1) return;
  if(childById(id).type === 'mom' && appState.children.filter(child => child.type === 'mom').length <= 1) return;
  appState.children = appState.children.filter(c => c.id !== id);
  if(selectedChildId === id) selectedChildId = childProfiles()[0]?.id || appState.children[0].id;
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
  $('editorSubtitle').textContent = ageText(child);
  $('periodTabs').innerHTML = periods.map(p => `<button class="${p.id===editingPeriod?'active':''}" data-period="${p.id}">${p.emoji} ${p.label}</button>`).join('');
  document.querySelectorAll('[data-period]').forEach(btn => btn.addEventListener('click', () => { editingPeriod = btn.dataset.period; renderEditor(); }));
  renderEmojiPicker();
  renderWeekdayPicker();
  const tasks = child.routines[editingPeriod] || [];
  $('taskList').innerHTML = tasks.length ? tasks.map(task => taskHtml(task, child)).join('') : '<p class="muted">Sem tarefas neste período.</p>';
  document.querySelectorAll('[data-delete-task]').forEach(btn => btn.addEventListener('click', () => deleteTask(btn.dataset.deleteTask)));
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
  return `
    <div class="task-item ${done?'done':''}">
      <div class="task-emoji">${task.emoji || '✅'}</div>
      <div>
        <div class="task-name">${task.name}</div>
        <div class="task-time">${task.time || 'Sem horário'} · ${dayLabel}</div>
      </div>
      <button class="secondary" data-delete-task="${task.id}">Excluir</button>
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
  child.routines[editingPeriod].push({
    id: crypto.randomUUID(),
    emoji: selectedTaskEmoji || '✅',
    name,
    time: $('taskTime').value,
    days: [...selectedTaskDays].sort((a,b) => a-b)
  });
  selectedTaskEmoji = '✅';
  $('taskEmoji').value = selectedTaskEmoji;
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
  const visibleChildren = childProfiles();
  if(!selectedChildId || !visibleChildren.some(child => child.id === selectedChildId)) selectedChildId = visibleChildren[0]?.id || appState.children[0].id;
  localStorage.setItem('rf_selectedChild', selectedChildId);
  const child = childById(selectedChildId);
  const visual = profileThemeById(child.profileTheme);
  document.documentElement.style.setProperty('--child-profile-bg', visual.bg);
  $('childPicker').innerHTML = visibleChildren.map(c => `<button class="${c.id===selectedChildId?'active':''}" data-pick-child="${c.id}">${c.avatar} ${c.name}</button>`).join('');
  document.querySelectorAll('[data-pick-child]').forEach(btn => btn.addEventListener('click', () => { selectedChildId = btn.dataset.pickChild; renderChild(); }));
  const age = childAge(child);
  $('childName').textContent = `${child.avatar} ${child.name}${age !== '' ? ' · ' + age + ' anos' : ''}`;
  $('childStars').textContent = `⭐ ${child.stars || 0}`;
  const period = currentPeriod();
  $('childPeriod').textContent = `Rotina da ${periods.find(p => p.id === period).label.toLowerCase()}`;
  const next = nextTask(child, period);
  const waiting = next ? null : nextUpcomingTask(child);
  $('taskFocus').classList.toggle('waiting', !next);
  $('taskFocus').innerHTML = next ? `
    <div class="focus-emoji">${next.emoji || '✅'}</div>
    <div class="focus-name">${next.name}</div>
    <div class="focus-time">${next.time || 'Sem horário'}</div>
  ` : waiting ? `
    <div class="focus-emoji">${visual.emoji}</div>
    <div class="focus-name">Modo espera</div>
    <div class="focus-time">Próxima: ${waiting.task.name} ${waiting.task.time ? 'às ' + waiting.task.time : ''}</div>
  ` : `
    <div class="focus-emoji">${visual.emoji}</div>
    <div class="focus-name">Tudo pronto</div>
    <div class="focus-time">Sem tarefa pendente agora</div>
  `;
  $('doneBtn').disabled = !next;
  $('doneBtn').dataset.task = next?.id || '';
  const tasks = tasksForToday(child, period);
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
  return tasksForToday(child, period).find(task => !isDone(child, task.id));
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

function markDone(){
  const child = childById(selectedChildId);
  const taskId = $('doneBtn').dataset.task;
  if(!taskId) return;
  child.done[todayKey()] ||= {};
  child.done[todayKey()][taskId] = true;
  child.stars = Number(child.stars || 0) + 1;
  if(persistentAlarm && persistentAlarm.task.id === taskId) persistentAlarm = null;
  scheduleSave();
  speak(`Muito bem! Tarefa concluída. Você ganhou uma estrela. Agora você tem ${child.stars} estrelas.`);
  renderChild();
}

function speakChild(child){
  const period = currentPeriod();
  const task = nextTask(child, period);
  if(!task){
    const waiting = nextUpcomingTask(child);
    if(waiting) return speak(`${dateSpeech()} ${child.name}, sua rotina de agora está completa. Modo espera. A próxima tarefa é ${waiting.task.name}${waiting.task.time ? ' às ' + waiting.task.time : ''}.`);
    return speak(`${dateSpeech()} ${child.name}, todas as tarefas foram feitas. Muito bem!`);
  }
  speak(`${dateSpeech()} ${child.name}, sua rotina de agora é ${periods.find(p => p.id === period).label}. Você tem que fazer: ${task.name}. ${task.time ? 'Horário: ' + task.time + '.' : ''}`);
}

function dateSpeech(){
  const d = new Date();
  return `Hoje é ${longWeekDays[d.getDay()]}, dia ${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}.`;
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
  speak(`${dateSpeech()} Agora são ${String(d.getHours()).padStart(2,'0')} horas e ${String(d.getMinutes()).padStart(2,'0')} minutos.`);
}

function tick(){
  const d = new Date();
  const timeText = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
  if($('momClock')) $('momClock').textContent = timeText;
  if($('momDate')) $('momDate').textContent = `${longWeekDays[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]}`;
  $('clock').textContent = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function checkTaskAlarms(){
  if(persistentAlarm && !isDone(persistentAlarm.child, persistentAlarm.task.id)){
    speak(`${persistentAlarm.child.name}, ainda está na hora de ${persistentAlarm.task.name}. Aperte Já fiz quando terminar.`);
    return;
  }
  if(persistentAlarm && isDone(persistentAlarm.child, persistentAlarm.task.id)) persistentAlarm = null;
  const now = new Date();
  const today = now.getDay();
  const current = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  appState.children.forEach(child => {
    periods.forEach(period => {
      (child.routines[period.id] || []).forEach(task => {
        if(!task.time || task.time !== current) return;
        if(task.days && !task.days.includes(today)) return;
        const key = `${todayKey()}_${child.id}_${task.id}_${current}`;
        if(firedAlarmKeys.has(key)) return;
        firedAlarmKeys.add(key);
        persistentAlarm = { child, task, period };
        if(child.type !== 'mom'){
          selectedChildId = child.id;
          mode = 'child';
          localStorage.setItem('rf_mode', mode);
          renderAll();
        }
        speak(`${dateSpeech()} ${child.name}, chegou a hora. Sua rotina de agora é ${period.label}. Você tem que fazer: ${task.name}.`);
      });
    });
  });
}

function escapeAttr(value){
  return String(value ?? '').replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
}

function addChild(){
  const child = { id: crypto.randomUUID(), type:'child', name: `Filho ${childProfiles().length + 1}`, birthDate: '', avatar: '⭐', profileTheme:'bichinhos', routines: emptyRoutines(), done: {} };
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
setInterval(checkTaskAlarms, 30000);
tick();
if(defaultConfigText && familyCode) connectFirebase();
else renderAll();
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
