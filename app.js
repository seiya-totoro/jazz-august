const DB_ROOT = window.SWINGBEANS_FIREBASE_ROOT || 'swingbeans/2026-08';
const LOCAL_KEY = 'swingbeans-2026-08-state';
const MEMBER_KEY = 'swingbeans-2026-08-member';

const weights = { '◎': 1, '○': 0.1, '△': 0, '×': 0, '': 0 };
const statusItems = [
  ['◎', '◎'],
  ['○', '○'],
  ['△', '△'],
  ['×', '×'],
];

const seedData = {
  members: [
    { id: 'M01', name: 'おぐら', part: 'Dr' },
    { id: 'M02', name: 'おさべ', part: 'Dr' },
    { id: 'M03', name: 'るあ', part: 'Pf' },
    { id: 'M04', name: 'しょうた', part: 'Pf' },
    { id: 'M05', name: 'たいが', part: 'Cl' },
    { id: 'M06', name: 'ひろな', part: 'Cl' },
    { id: 'M07', name: 'けいか', part: 'Cl' },
    { id: 'M08', name: 'なの', part: 'Tp' },
    { id: 'M09', name: 'ひな', part: 'Tp' },
    { id: 'M10', name: 'ともき', part: 'Tp' },
    { id: 'M11', name: 'こうせい', part: 'A.sax' },
    { id: 'M12', name: 'はる', part: 'A.sax' },
    { id: 'M13', name: 'みさき', part: 'T.sax' },
    { id: 'M14', name: 'ちなつ', part: 'Tb' },
    { id: 'M15', name: 'みわ', part: 'Tb' },
    { id: 'M16', name: 'ゆうあ', part: 'Hr' },
    { id: 'M17', name: 'わかな', part: 'Vn' },
    { id: 'M18', name: 'すずな', part: 'Vn' },
    { id: 'M19', name: 'おぐら', part: 'Bass' },
    { id: 'M20', name: 'おぐら', part: 'A.Gu' },
    { id: 'M21', name: 'はる', part: 'Bass' },
    { id: 'M22', name: 'はるか', part: 'Pf' },
    { id: 'M23', name: 'らくと', part: 'Vo' },
    { id: 'M24', name: 'まな', part: 'T.sax' },
    { id: 'M25', name: 'りょうすけ', part: 'Tp' },
    { id: 'M26', name: 'こうた', part: '' },
    { id: 'M27', name: 'member27', part: '' },
    { id: 'M28', name: 'member28', part: '' },
    { id: 'M29', name: 'member29', part: '' },
    { id: 'M30', name: 'member30', part: '' },
  ],
  dates: createAugustDates(),
  songs: [
    { id: 'S1', title: 'moanin!' },
    { id: 'S2', title: 'シロクマ' },
    { id: 'S3', title: 'ルパン' },
    { id: 'S4', title: '銀河鉄道' },
    { id: 'S5', title: 'マツケンサンバ' },
    { id: 'S6', title: 'ムーンライト' },
  ],
  attendance: {},
  songMembers: {
    S1: { M02: true, M22: true },
    S2: { M01: true, M03: true, M06: true, M07: true, M08: true, M11: true, M19: true },
    S3: { M02: true, M04: true, M14: true, M15: true },
    S4: { M01: true, M08: true, M13: true, M14: true, M15: true, M16: true, M17: true, M18: true },
    S5: { M02: true, M08: true, M09: true, M14: true, M15: true, M16: true, M23: true },
    S6: { M01: true, M08: true, M09: true, M11: true, M13: true, M14: true, M15: true, M16: true, M17: true, M18: true, M19: true },
  },
};

let state = normalizeState(seedData);
let store = null;
let selectedMemberId = localStorage.getItem(MEMBER_KEY) || '';
let selectedDateId = nearestDate(seedData.dates).id;
let firstRender = true;

const $ = (id) => document.getElementById(id);

boot();

async function boot() {
  bindTabs();
  setLoading(true);
  store = await createStore();
  store.subscribe((nextState) => {
    state = normalizeState(nextState);
    if (selectedMemberId && !state.members.some((member) => member.id === selectedMemberId)) {
      selectedMemberId = '';
    }
    renderAll();
    if (firstRender) {
      setLoading(false);
      firstRender = false;
    }
  });
}

async function createStore() {
  const config = window.SWINGBEANS_FIREBASE_CONFIG;
  if (config && config.apiKey && config.databaseURL) {
    try {
      return await withTimeout(createFirebaseStore(config), 6000);
    } catch (error) {
      console.warn(error);
    }
  }
  return createLocalStore();
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Firebase接続がタイムアウトしました')), timeoutMs);
    }),
  ]);
}

async function createFirebaseStore(config) {
  const appModule = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
  const dbModule = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js');
  const app = appModule.initializeApp(config);
  const db = dbModule.getDatabase(app);
  const rootRef = dbModule.ref(db, DB_ROOT);
  const snapshot = await dbModule.get(rootRef);
  if (!snapshot.exists()) {
    await dbModule.set(rootRef, seedData);
  } else {
    const saved = snapshot.val() || {};
    if (!Array.isArray(saved.dates) || saved.dates.length !== seedData.dates.length) {
      await dbModule.update(rootRef, {
        members: seedData.members,
        dates: seedData.dates,
        songs: seedData.songs,
      });
    }
  }
  return {
    subscribe(callback) {
      return dbModule.onValue(rootRef, (snap) => callback(snap.val() || seedData));
    },
    async write(path, value) {
      await dbModule.set(dbModule.ref(db, `${DB_ROOT}/${path}`), value);
    },
  };
}

function createLocalStore() {
  const saved = localStorage.getItem(LOCAL_KEY);
  let localState = normalizeState(saved ? JSON.parse(saved) : seedData);
  const listeners = new Set();
  return {
    subscribe(callback) {
      listeners.add(callback);
      callback(localState);
      return () => listeners.delete(callback);
    },
    async write(path, value) {
      setAtPath(localState, path.split('/'), value);
      localState = normalizeState(localState);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(localState));
      listeners.forEach((callback) => callback(localState));
    },
  };
}

function normalizeState(input) {
  const next = structuredClone(input || seedData);
  next.members = Array.isArray(next.members) && next.members.length ? next.members : seedData.members;
  next.dates = Array.isArray(next.dates) && next.dates.length === seedData.dates.length ? next.dates : seedData.dates;
  next.songs = Array.isArray(next.songs) && next.songs.length ? next.songs : seedData.songs;
  next.attendance = next.attendance || {};
  next.songMembers = normalizeSongMembers(next.songMembers || {});
  next.members.forEach((member) => {
    if (!next.attendance[member.id]) next.attendance[member.id] = {};
  });
  next.songs.forEach((song) => {
    if (!next.songMembers[song.id]) next.songMembers[song.id] = {};
  });
  return next;
}

function normalizeSongMembers(input) {
  const result = {};
  Object.keys(input).forEach((songId) => {
    const value = input[songId];
    result[songId] = {};
    if (Array.isArray(value)) {
      value.forEach((memberId) => { result[songId][memberId] = true; });
    } else {
      Object.keys(value || {}).forEach((memberId) => {
        result[songId][memberId] = Boolean(value[memberId]);
      });
    }
  });
  return result;
}

function setAtPath(target, parts, value) {
  const key = parts[0];
  if (parts.length === 1) {
    target[key] = value;
    return;
  }
  if (!target[key]) target[key] = {};
  setAtPath(target[key], parts.slice(1), value);
}

function bindTabs() {
  document.querySelectorAll('.tab').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('is-active', tab === button));
      document.querySelectorAll('.view').forEach((view) => view.classList.toggle('is-active', view.id === button.dataset.view));
    });
  });
  $('memberSelect').addEventListener('change', (event) => {
    selectedMemberId = event.target.value;
    if (selectedMemberId) {
      localStorage.setItem(MEMBER_KEY, selectedMemberId);
    } else {
      localStorage.removeItem(MEMBER_KEY);
    }
    renderAttendance();
  });
  $('hotDateSelect').addEventListener('change', (event) => {
    selectedDateId = event.target.value;
    renderSelectedDateRanking();
  });
}

function renderAll() {
  renderMemberSelect();
  renderHome();
  renderAttendance();
  renderSongMatrix();
  renderSchedule();
}

function renderMemberSelect() {
  $('memberSelect').innerHTML = '<option value="">選択してください</option>' + state.members.map((member) => (
    `<option value="${member.id}">${member.name}${member.part ? ` / ${member.part}` : ''}</option>`
  )).join('');
  $('memberSelect').value = selectedMemberId;
}

function renderHome() {
  const home = homeDateInfo();
  const date = home.date;
  const scores = songScores(date.id);
  const available = availableMembers(date.id);
  const pending = pendingMembers(date.id);
  $('homeDateText').textContent = home.isToday
    ? `今日 ${home.todayLabel} の出席から見ています。`
    : `今日 ${home.todayLabel}。8月メモでは ${date.label} を表示しています。`;
  $('homeTodayMembers').innerHTML = available.length
    ? available.map((member) => `<span class="member-chip">${memberLabel(member)}</span>`).join('')
    : '<span class="soft-text">まだ参加できる人はいません。</span>';
  $('homeSongs').innerHTML = scores.length
    ? scores.map((song, index) => `
      <div class="home-song-row ${index === 0 ? 'is-first' : ''} ${index === 1 ? 'is-second' : ''}">
        <span>${index + 1}位</span>
        <strong>${song.title}</strong>
        <em>${formatNum(song.available)}人 / ${song.total}人</em>
      </div>
    `).join('')
    : '<span class="soft-text">曲メンバーを設定すると表示されます。</span>';
  $('homePendingText').textContent = pending.length
    ? `${pending.length}人がまだ未入力です。分かる日だけで大丈夫。`
    : 'この日は全員入力済みです。';
  $('homePendingMembers').innerHTML = pending.slice(0, 10).map((member) => (
    `<div class="member-line">${memberLabel(member)}</div>`
  )).join('') + (pending.length > 10 ? `<div class="member-line">ほか ${pending.length - 10}人</div>` : '');
}

function renderAttendance() {
  if (!selectedMemberId) {
    $('attendanceRows').innerHTML = `
      <div class="empty-note">
        自分の名前を選ぶと、8月の日付入力が表示されます。
      </div>
    `;
    return;
  }
  const current = state.attendance[selectedMemberId] || {};
  $('attendanceRows').innerHTML = state.dates.map((date) => (
    `<div class="attendance-row">
      <div>
        <div class="date-title">${date.label}</div>
      </div>
      <div class="status-buttons">
        ${statusItems.map(([value, label]) => (
          `<button class="status-button ${current[date.id] === value ? 'is-active' : ''}" data-date="${date.id}" data-status="${value}">
            ${label}
          </button>`
        )).join('')}
      </div>
    </div>`
  )).join('');
  $('attendanceRows').querySelectorAll('.status-button').forEach((button) => {
    button.addEventListener('click', () => saveAttendance(button.dataset.date, button.dataset.status));
  });
}

function renderSongMatrix() {
  const songHeaders = state.songs.map((song) => `<div class="matrix-cell">${song.title}</div>`).join('');
  const rows = state.members.map((member) => (
    `<div class="matrix-row">
      <div class="matrix-cell">
        <div>
          <div>${member.name}</div>
          <div class="part-text">${member.part || 'partなし'}</div>
        </div>
      </div>
      ${state.songs.map((song) => {
        const on = Boolean(state.songMembers[song.id]?.[member.id]);
        return `<div class="matrix-cell">
          <button class="song-toggle ${on ? 'is-on' : ''}" aria-pressed="${on}" data-song="${song.id}" data-member="${member.id}">
            ${on ? '入' : '・'}
          </button>
        </div>`;
      }).join('')}
    </div>`
  )).join('');
  $('songMatrix').innerHTML = `<div class="matrix-head"><div class="matrix-cell">メンバー</div>${songHeaders}</div>${rows}`;
  $('songMatrix').querySelectorAll('.song-toggle').forEach((button) => {
    button.addEventListener('click', () => saveSongMember(button.dataset.song, button.dataset.member));
  });
}

function renderSchedule() {
  if (!state.dates.some((date) => date.id === selectedDateId)) {
    selectedDateId = nearestDate(state.dates).id;
  }
  renderHotDateSelect();
  renderPracticeCalendar();
  renderSongHotDates();
  renderSelectedDateRanking();
}

function renderHotDateSelect() {
  $('hotDateSelect').innerHTML = state.dates.map((date) => (
    `<option value="${date.id}">${date.label}</option>`
  )).join('');
  $('hotDateSelect').value = selectedDateId;
}

function renderPracticeCalendar() {
  const plan = recommendedPracticeCalendar();
  $('practiceCalendar').innerHTML = plan.map((day) => `
    <section class="practice-day">
      <div class="practice-day-head">
        <strong>${day.date.label}</strong>
        <span>${totalAvailableMembers(day.date.id)}人</span>
      </div>
      <div class="practice-song-picks">
        ${day.songs.map((item) => `
          <span class="practice-song-pill">
            ${item.song.title}
            <small>${item.pickRank}回目候補</small>
          </span>
        `).join('')}
      </div>
    </section>
  `).join('');
}

function renderSongHotDates() {
  $('songHotDates').innerHTML = state.songs.map((song) => {
    const dates = hotDatesForSong(song.id).slice(0, 3);
    return `
      <section class="hot-song-card">
        <h4>${song.title}</h4>
        <div class="hot-date-list">
          ${dates.map((item, index) => `
            <div class="hot-date-item ${index === 0 ? 'is-first' : ''} ${index === 1 ? 'is-second' : ''}">
              <span>${index + 1}位</span>
              <strong>${item.date.label}</strong>
              <em>${formatNum(item.available)}人 / ${item.total}人（${Math.round(item.ratio * 100)}%）</em>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }).join('');
}

function renderSelectedDateRanking() {
  const date = state.dates.find((item) => item.id === selectedDateId) || nearestDate(state.dates);
  const scores = songScores(date.id);
  const focus = focusMembers(date.id);
  $('selectedDateRanking').innerHTML = `
    <section class="date-rank-card">
      <div class="date-rank-head">
        <div class="date-rank-title">${date.label}</div>
        <div class="date-rank-total">${totalAvailableMembers(date.id)}人</div>
      </div>
      <div class="date-song-list">
        ${scores.map((song, index) => `
          <div class="date-song-row ${index === 0 ? 'is-first' : ''} ${index === 1 ? 'is-second' : ''}">
            <span class="date-rank-badge">${index + 1}位</span>
            <div>
              <div class="song-name">${song.title}</div>
              <div class="soft-text">${formatNum(song.available)}人 / ${song.total}人（${Math.round(song.ratio * 100)}%）</div>
            </div>
            <div class="count-text">${Math.round(song.ratio * 100)}%</div>
          </div>
        `).join('')}
      </div>
      ${focus.length ? `
        <div class="date-focus">
          <strong>注目</strong>
          ${focus.map((row) => `
            <div>${memberLabel(row.member)}: ${row.songs.map((song) => song.title).join('、') || '参加曲未設定'}</div>
          `).join('')}
        </div>
      ` : ''}
    </section>
  `;
}

async function saveAttendance(dateId, status) {
  if (!selectedMemberId) return;
  state.attendance[selectedMemberId][dateId] = status;
  renderAttendance();
  renderHome();
  renderSchedule();
  await savePath(`attendance/${selectedMemberId}/${dateId}`, status, 'attendanceSaveNote');
}

async function saveSongMember(songId, memberId) {
  const current = Boolean(state.songMembers[songId]?.[memberId]);
  if (!state.songMembers[songId]) state.songMembers[songId] = {};
  state.songMembers[songId][memberId] = !current;
  renderSongMatrix();
  renderHome();
  renderSchedule();
  await savePath(`songMembers/${songId}/${memberId}`, !current, 'songSaveNote');
}

async function savePath(path, value, noteId) {
  setNote(noteId, '保存中...');
  try {
    await store.write(path, value);
    setNote(noteId, '保存しました');
    showToast('保存しました');
  } catch (error) {
    console.error(error);
    setNote(noteId, '保存失敗');
    showToast('保存に失敗しました');
  }
}

function songScores(dateId) {
  return state.songs.map((song) => songScore(song, dateId))
    .sort(compareSongScores);
}

function songScore(song, dateId) {
  const ids = songMemberIds(song.id);
  const available = ids.reduce((sum, memberId) => sum + statusWeight(memberId, dateId), 0);
  const total = ids.length;
  return { ...song, available, total, ratio: total ? available / total : 0 };
}

function compareSongScores(a, b) {
  return b.ratio - a.ratio || b.available - a.available || a.title.localeCompare(b.title, 'ja');
}

function hotDatesForSong(songId) {
  const song = state.songs.find((item) => item.id === songId);
  if (!song) return [];
  return state.dates.map((date) => ({ ...songScore(song, date.id), date }))
    .sort((a, b) => b.ratio - a.ratio || b.available - a.available || a.date.iso.localeCompare(b.date.iso));
}

function recommendedPracticeCalendar() {
  const byDate = new Map();
  state.songs.forEach((song) => {
    hotDatesForSong(song.id).slice(0, 3).forEach((item, index) => {
      if (!byDate.has(item.date.id)) {
        byDate.set(item.date.id, { date: item.date, songs: [] });
      }
      byDate.get(item.date.id).songs.push({ song, pickRank: index + 1, score: item });
    });
  });
  return state.dates
    .filter((date) => byDate.has(date.id))
    .map((date) => {
      const day = byDate.get(date.id);
      day.songs.sort((a, b) => a.pickRank - b.pickRank || compareSongScores(a.score, b.score));
      return day;
    });
}

function availableMembers(dateId) {
  return state.members.filter((member) => statusWeight(member.id, dateId) > 0);
}

function totalAvailableMembers(dateId) {
  return availableMembers(dateId).length;
}

function songMemberIds(songId) {
  return state.members
    .filter((member) => Boolean(state.songMembers[songId]?.[member.id]))
    .map((member) => member.id);
}

function statusWeight(memberId, dateId) {
  const status = state.attendance[memberId]?.[dateId] || '';
  return weights[status] || 0;
}

function pendingMembers(dateId) {
  return state.members.filter((member) => !state.attendance[member.id]?.[dateId]);
}

function focusMembers(dateId) {
  return state.members.map((member) => {
    const availableDays = state.dates.filter((date) => statusWeight(member.id, date.id) > 0).length;
    const songs = state.songs.filter((song) => Boolean(state.songMembers[song.id]?.[member.id]));
    return { member, availableDays, songs, canCome: statusWeight(member.id, dateId) > 0 };
  }).filter((row) => row.canCome && row.availableDays <= 2);
}

function nearestDate(dates) {
  const today = new Date();
  const todayKey = formatIsoDate(today);
  return dates.find((date) => date.iso >= todayKey) || dates[dates.length - 1] || seedData.dates[0];
}

function homeDateInfo() {
  const today = new Date();
  const todayKey = formatIsoDate(today);
  const date = state.dates.find((item) => item.iso === todayKey) || nearestDate(state.dates);
  return {
    date,
    isToday: date.iso === todayKey,
    todayLabel: formatDisplayDate(today),
  };
}

function formatIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date) {
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  return `${date.getMonth() + 1}/${date.getDate()}(${weekdays[date.getDay()]})`;
}

function createAugustDates() {
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  return Array.from({ length: 31 }, (_, index) => {
    const day = index + 1;
    const dayText = String(day).padStart(2, '0');
    const date = new Date(Date.UTC(2026, 7, day));
    return {
      id: `D${dayText}`,
      label: `8/${day}(${weekdays[date.getUTCDay()]})`,
      iso: `2026-08-${dayText}`,
    };
  });
}

function memberLabel(member) {
  return `${member.name}${member.part ? ` / ${member.part}` : ''}`;
}

function formatNum(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function setLoading(active) {
  $('loading').classList.toggle('is-active', active);
}

function setNote(id, text) {
  const el = $(id);
  el.textContent = text;
  if (text) {
    setTimeout(() => {
      if (el.textContent === text) el.textContent = '';
    }, 1800);
  }
}

function showToast(text) {
  const toast = $('toast');
  toast.textContent = text;
  toast.classList.add('is-active');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('is-active'), 1800);
}
