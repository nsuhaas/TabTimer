const STORAGE_KEY = 'tabTimes';

async function getTabTimes() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || {};
}

async function saveTabTimes(tabTimes) {
  await chrome.storage.local.set({ [STORAGE_KEY]: tabTimes });
}

async function seedExistingTabs() {
  const tabs = await chrome.tabs.query({});
  const tabTimes = await getTabTimes();
  const now = Date.now();
  let changed = false;
  for (const tab of tabs) {
    if (!tabTimes[tab.id]) {
      tabTimes[tab.id] = now;
      changed = true;
    }
  }
  if (changed) await saveTabTimes(tabTimes);
}

chrome.runtime.onInstalled.addListener(seedExistingTabs);
chrome.runtime.onStartup.addListener(seedExistingTabs);

chrome.tabs.onCreated.addListener(async (tab) => {
  const tabTimes = await getTabTimes();
  tabTimes[tab.id] = Date.now();
  await saveTabTimes(tabTimes);
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const tabTimes = await getTabTimes();
  delete tabTimes[tabId];
  await saveTabTimes(tabTimes);
});

// Periodically clean up stale entries for tabs that no longer exist
async function pruneStaleEntries() {
  const [tabs, tabTimes] = await Promise.all([
    chrome.tabs.query({}),
    getTabTimes(),
  ]);
  const liveIds = new Set(tabs.map(t => t.id));
  let pruned = false;
  for (const id of Object.keys(tabTimes)) {
    if (!liveIds.has(Number(id))) {
      delete tabTimes[id];
      pruned = true;
    }
  }
  if (pruned) await saveTabTimes(tabTimes);
}

chrome.alarms.create('prune', { periodInMinutes: 5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'prune') pruneStaleEntries();
});
