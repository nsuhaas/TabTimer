const STORAGE_KEY = 'tabTimes';

let allTabData = [];
let sortOldestFirst = true;
let searchQuery = '';

// ─── Time helpers ────────────────────────────────────────────────────────────

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days >= 1) {
    const remH = hours % 24;
    return remH > 0 ? `${days}d ${remH}h` : `${days}d`;
  }
  if (hours >= 1) {
    const remM = minutes % 60;
    return remM > 0 ? `${hours}h ${remM}m` : `${hours}h`;
  }
  if (minutes >= 1) return `${minutes}m`;
  if (totalSeconds >= 10) return `${totalSeconds}s`;
  return 'just now';
}

function getAgeClass(ms) {
  const hours = ms / 3_600_000;
  if (hours >= 24) return 'forgotten';
  if (hours >= 8)  return 'old';
  if (hours >= 1)  return 'moderate';
  return 'fresh';
}

function sectionMeta(ageClass) {
  const map = {
    forgotten: { color: 'red',    label: 'Forgotten  (>24h)' },
    old:       { color: 'orange', label: 'Aging  (8 – 24h)'  },
    moderate:  { color: 'yellow', label: 'Moderate  (1 – 8h)' },
    fresh:     { color: 'green',  label: 'Fresh  (<1h)'      },
  };
  return map[ageClass];
}

// ─── Favicon helpers ─────────────────────────────────────────────────────────

function makeFaviconEl(tab) {
  if (tab.favIconUrl && !tab.favIconUrl.startsWith('chrome://')) {
    const img = document.createElement('img');
    img.className = 'favicon';
    img.src = tab.favIconUrl;
    img.alt = '';
    img.onerror = () => img.replaceWith(makePlaceholder(tab));
    return img;
  }
  return makePlaceholder(tab);
}

function makePlaceholder(tab) {
  const div = document.createElement('div');
  div.className = 'favicon-placeholder';
  div.textContent = (tab.title || '?')[0].toUpperCase();
  return div;
}

function getHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url || '';
  }
}

// ─── Render ──────────────────────────────────────────────────────────────────

function applyFiltersAndSort(data) {
  let filtered = data;

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = data.filter(
      d => d.tab.title?.toLowerCase().includes(q) || d.tab.url?.toLowerCase().includes(q)
    );
  }

  filtered = [...filtered].sort((a, b) =>
    sortOldestFirst ? b.duration - a.duration : a.duration - b.duration
  );

  return filtered;
}

function updateStats(data) {
  const counts = { forgotten: 0, old: 0, moderate: 0, fresh: 0 };
  for (const d of data) counts[getAgeClass(d.duration)]++;
  document.getElementById('statForgotten').textContent = counts.forgotten;
  document.getElementById('statAging').textContent     = counts.old;
  document.getElementById('statModerate').textContent  = counts.moderate;
  document.getElementById('statFresh').textContent     = counts.fresh;
  document.getElementById('tabCountBadge').textContent = `${data.length} tab${data.length !== 1 ? 's' : ''}`;

  const closeBtn = document.getElementById('closeOldBtn');
  closeBtn.disabled = counts.forgotten === 0;
  closeBtn.textContent = counts.forgotten > 0
    ? `Close ${counts.forgotten} Forgotten Tab${counts.forgotten !== 1 ? 's' : ''} (>24h)`
    : 'No Forgotten Tabs';
}

function renderTabs(data) {
  const list = document.getElementById('tabList');
  list.innerHTML = '';

  const filtered = applyFiltersAndSort(data);

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <p>No tabs match your search.</p>
      </div>`;
    return;
  }

  const sections = ['forgotten', 'old', 'moderate', 'fresh'];
  const grouped = { forgotten: [], old: [], moderate: [], fresh: [] };
  for (const d of filtered) grouped[getAgeClass(d.duration)].push(d);

  const orderedSections = sortOldestFirst ? sections : [...sections].reverse();

  for (const section of orderedSections) {
    const items = grouped[section];
    if (items.length === 0) continue;

    const meta = sectionMeta(section);

    const label = document.createElement('div');
    label.className = 'section-label';
    label.innerHTML = `<span class="section-dot ${meta.color}"></span>${meta.label}`;
    list.appendChild(label);

    for (const { tab, duration } of items) {
      const item = document.createElement('div');
      item.className = 'tab-item' + (tab.active ? ' active-tab' : '');
      item.setAttribute('data-tab-id', tab.id);

      const favicon = makeFaviconEl(tab);

      const info = document.createElement('div');
      info.className = 'tab-info';

      const title = document.createElement('div');
      title.className = 'tab-title';
      title.textContent = tab.title || '(untitled)';

      const url = document.createElement('div');
      url.className = 'tab-url';
      url.textContent = getHost(tab.url);

      info.append(title, url);

      const right = document.createElement('div');
      right.className = 'tab-right';

      const badge = document.createElement('span');
      badge.className = `time-badge ${section}`;
      badge.textContent = formatDuration(duration);

      const closeBtn = document.createElement('button');
      closeBtn.className = 'close-btn';
      closeBtn.title = 'Close tab';
      closeBtn.innerHTML = '×';
      closeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await chrome.tabs.remove(tab.id);
        item.remove();
        allTabData = allTabData.filter(d => d.tab.id !== tab.id);
        updateStats(allTabData);
      });

      right.append(badge, closeBtn);
      item.append(favicon, info, right);

      item.addEventListener('click', async () => {
        await chrome.tabs.update(tab.id, { active: true });
        const win = await chrome.windows.get(tab.windowId);
        if (!win.focused) await chrome.windows.update(tab.windowId, { focused: true });
        window.close();
      });

      list.appendChild(item);
    }
  }
}

// ─── Data loading ─────────────────────────────────────────────────────────────

async function loadData() {
  const [tabs, stored] = await Promise.all([
    chrome.tabs.query({}),
    chrome.storage.local.get(STORAGE_KEY),
  ]);

  const tabTimes = stored[STORAGE_KEY] || {};
  const now = Date.now();

  allTabData = tabs.map(tab => ({
    tab,
    duration: tabTimes[tab.id] ? now - tabTimes[tab.id] : 0,
  }));

  updateStats(allTabData);
  renderTabs(allTabData);
}

// ─── Event wiring ─────────────────────────────────────────────────────────────

document.getElementById('searchInput').addEventListener('input', (e) => {
  searchQuery = e.target.value.trim();
  renderTabs(allTabData);
});

document.getElementById('sortBtn').addEventListener('click', () => {
  sortOldestFirst = !sortOldestFirst;
  document.getElementById('sortLabel').textContent = sortOldestFirst ? 'Oldest First' : 'Newest First';
  renderTabs(allTabData);
});

document.getElementById('closeOldBtn').addEventListener('click', async () => {
  const forgotten = allTabData
    .filter(d => getAgeClass(d.duration) === 'forgotten')
    .map(d => d.tab.id);
  if (forgotten.length === 0) return;
  await Promise.all(forgotten.map(id => chrome.tabs.remove(id)));
  allTabData = allTabData.filter(d => getAgeClass(d.duration) !== 'forgotten');
  updateStats(allTabData);
  renderTabs(allTabData);
});

document.getElementById('refreshBtn').addEventListener('click', loadData);

// ─── Init ─────────────────────────────────────────────────────────────────────

loadData();
