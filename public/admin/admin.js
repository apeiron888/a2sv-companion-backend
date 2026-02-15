/* ═══════════════════════════════════════════════════════════════════
   A2SV Companion Admin — Dashboard Logic
   ═══════════════════════════════════════════════════════════════════ */

// ─── DOM References ───────────────────────────────────────────────
const adminKeyInput = document.getElementById("adminKey");
const settingsStatus = document.getElementById("settingsStatus");
const settingsPanel = document.getElementById("settingsPanel");
const settingsToggle = document.getElementById("settingsToggle");
const toastContainer = document.getElementById("toastContainer");
const masterSheetIdInput = document.getElementById("masterSheetId");
const syncStatus = document.getElementById("syncStatus");
const syncTabsTable = document.getElementById("syncTabsTable");
const syncQuestionsTable = document.getElementById("syncQuestionsTable");
const syncWarningsTable = document.getElementById("syncWarningsTable");
const tabHealthTable = document.getElementById("tabHealthTable");

// Phase fields
const phaseFields = {
  name: document.getElementById("phaseName"),
  tabName: document.getElementById("phaseTabName"),
  masterSheetId: document.getElementById("phaseMasterSheetId"),
  startColumn: document.getElementById("phaseStartColumn"),
  order: document.getElementById("phaseOrder")
};

// Add-to-sheet fields
const addFields = {
  phaseId: document.getElementById("addPhaseId"),
  platform: document.getElementById("addPlatform"),
  questionKey: document.getElementById("addQuestionKey"),
  title: document.getElementById("addTitle"),
  url: document.getElementById("addUrl"),
  difficulty: document.getElementById("addDifficulty"),
  tagInput: document.getElementById("tagInput"),
  tagChips: document.getElementById("tagChips")
};

// Simple question fields
const questionFields = {
  platform: document.getElementById("questionPlatform"),
  key: document.getElementById("questionKey"),
  title: document.getElementById("questionTitle"),
  url: document.getElementById("questionUrl")
};

// Group fields
const groupFields = {
  name: document.getElementById("groupName"),
  sheetId: document.getElementById("sheetId"),
  nameColumn: document.getElementById("nameColumn"),
  nameStart: document.getElementById("nameStart"),
  nameEnd: document.getElementById("nameEnd")
};

// Mapping fields
const mappingFields = {
  groupName: document.getElementById("mappingGroupName"),
  questionKey: document.getElementById("mappingQuestionKey"),
  trial: document.getElementById("mappingTrial"),
  time: document.getElementById("mappingTime"),
  deleteMappingId: document.getElementById("deleteMappingId")
};

// Status elements
const statuses = {
  phase: document.getElementById("phaseStatus"),
  addToSheet: document.getElementById("addToSheetStatus"),
  question: document.getElementById("questionStatus"),
  group: document.getElementById("groupStatus"),
  mapping: document.getElementById("mappingStatus"),
  deleteMapping: document.getElementById("deleteMappingStatus")
};

// Table containers
const tables = {
  phases: document.getElementById("phasesTable"),
  questions: document.getElementById("questionsTable"),
  groups: document.getElementById("groupsTable"),
  mappings: document.getElementById("mappingsTable")
};

// Preview elements
const previewEls = {
  column: document.getElementById("previewColumn"),
  diff: document.getElementById("previewDiff"),
  tags: document.getElementById("previewTags"),
  platform: document.getElementById("previewPlatform"),
  title: document.getElementById("previewTitle")
};

// Filter
const filterPhaseId = document.getElementById("filterPhaseId");

// ─── State ────────────────────────────────────────────────────────

let cachedPhases = [];
let cachedGroups = [];
let cachedQuestions = [];
let cachedMappings = [];
let currentTags = [];
let cachedSyncTabs = [];
let cachedSyncQuestions = [];
let cachedSyncWarnings = [];
let cachedTabHealth = [];

// ─── Settings ─────────────────────────────────────────────────────

function loadSettings() {
  const adminKey = localStorage.getItem("adminKey") || "";
  const masterSheetId = localStorage.getItem("masterSheetId") || "";
  adminKeyInput.value = adminKey;
  masterSheetIdInput.value = masterSheetId;
}

function saveSettings() {
  localStorage.setItem("adminKey", adminKeyInput.value.trim());
  localStorage.setItem("masterSheetId", masterSheetIdInput.value.trim());
  settingsStatus.textContent = "Settings saved";
  showToast("Settings saved", "success");
  setTimeout(() => { settingsStatus.textContent = ""; }, 2000);
}

function getConfig() {
  const apiBase = window.location.origin;
  const adminKey = adminKeyInput.value.trim();
  return { apiBase, adminKey };
}

// ─── API Call Helper ──────────────────────────────────────────────

async function callApi(path, options) {
  const { apiBase, adminKey } = getConfig();
  if (!apiBase) throw new Error("API base URL required");

  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(adminKey ? { "x-admin-key": adminKey } : {}),
      ...(options?.headers || {})
    }
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || "Request failed");
  return data;
}

// ─── Toast Notifications ─────────────────────────────────────────

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  const icon = type === "success" ? "✓" : "✕";
  toast.innerHTML = `<span>${icon}</span> ${message}`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("removing");
    setTimeout(() => toast.remove(), 200);
  }, 3000);
}

// ─── Skeleton Loader ──────────────────────────────────────────────

function showSkeleton(container, rows = 3) {
  let html = "";
  for (let i = 0; i < rows; i++) {
    html += `<div class="skeleton-row">
      <div class="skeleton" style="width: ${30 + Math.random() * 40}%"></div>
      <div class="skeleton" style="width: ${20 + Math.random() * 30}%"></div>
      <div class="skeleton" style="width: ${15 + Math.random() * 25}%"></div>
    </div>`;
  }
  container.innerHTML = html;
}

// ─── Tab Navigation ───────────────────────────────────────────────

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    const tab = document.getElementById(`tab-${btn.dataset.tab}`);
    if (tab) tab.classList.add("active");
  });
});

// ─── Tag Chips ────────────────────────────────────────────────────

function renderTags() {
  addFields.tagChips.innerHTML = currentTags
    .map(
      (tag, i) =>
        `<span class="tag-chip">${tag}<span class="remove-tag" data-index="${i}">×</span></span>`
    )
    .join("");
  updatePreview();
}

addFields.tagInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === ",") {
    e.preventDefault();
    const value = addFields.tagInput.value.trim();
    if (value && !currentTags.includes(value)) {
      currentTags.push(value);
      renderTags();
    }
    addFields.tagInput.value = "";
  }
  if (e.key === "Backspace" && !addFields.tagInput.value && currentTags.length) {
    currentTags.pop();
    renderTags();
  }
});

addFields.tagChips.addEventListener("click", (e) => {
  const removeBtn = e.target.closest(".remove-tag");
  if (removeBtn) {
    const index = parseInt(removeBtn.dataset.index, 10);
    currentTags.splice(index, 1);
    renderTags();
  }
});

// ─── Live Preview ─────────────────────────────────────────────────

function updatePreview() {
  const difficulty = addFields.difficulty.value;
  const platform = addFields.platform.value;
  const title = addFields.title.value.trim() || "—";
  const tags = currentTags.length ? currentTags.join(", ") : "—";

  // Difficulty cell
  previewEls.diff.textContent = difficulty;
  previewEls.diff.className = "preview-cell diff-cell";
  if (difficulty === "Medium") previewEls.diff.classList.add("medium");
  if (difficulty === "Hard") previewEls.diff.classList.add("hard");

  // Platform cell
  const platNames = { leetcode: "LeetCode", codeforces: "Codeforces", hackerrank: "HackerRank" };
  previewEls.platform.textContent = platNames[platform] || platform;
  previewEls.platform.className = "preview-cell plat-cell";
  if (platform === "codeforces") previewEls.platform.classList.add("codeforces");
  if (platform === "hackerrank") previewEls.platform.classList.add("hackerrank");

  previewEls.tags.textContent = tags;
  previewEls.title.textContent = title;
}

addFields.difficulty.addEventListener("change", updatePreview);
addFields.platform.addEventListener("change", updatePreview);
addFields.title.addEventListener("input", updatePreview);

// Fetch next column when phase changes
addFields.phaseId.addEventListener("change", fetchNextColumn);

async function fetchNextColumn() {
  const phaseId = addFields.phaseId.value;
  if (!phaseId) {
    previewEls.column.textContent = "—";
    return;
  }
  try {
    const data = await callApi(`/api/admin/questions/next-column/${phaseId}`, { method: "GET" });
    previewEls.column.textContent = `${data.nextQuestionCol} / ${data.nextTimeCol}`;
  } catch {
    previewEls.column.textContent = "—";
  }
}

// ═══════════════════════════════════════════════════════════════════
//  PHASE OPERATIONS
// ═══════════════════════════════════════════════════════════════════

async function createPhase() {
  statuses.phase.textContent = "";
  const payload = {
    name: phaseFields.name.value.trim(),
    tab_name: phaseFields.tabName.value.trim(),
    master_sheet_id: phaseFields.masterSheetId.value.trim(),
    start_column: phaseFields.startColumn.value.trim() || "E",
    order: Number(phaseFields.order.value) || 0
  };

  if (!payload.name || !payload.tab_name || !payload.master_sheet_id) {
    statuses.phase.textContent = "Name, tab name, and Master Sheet ID are required";
    return;
  }

  try {
    const data = await callApi("/api/admin/phases", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    showToast(`Phase created: ${payload.name}`, "success");
    statuses.phase.textContent = `Phase created: ${data.id}`;
    phaseFields.name.value = "";
    phaseFields.tabName.value = "";
    await loadPhases();
  } catch (error) {
    statuses.phase.textContent = error.message;
    showToast(error.message, "error");
  }
}

async function loadPhases() {
  showSkeleton(tables.phases);
  try {
    const data = await callApi("/api/admin/phases", { method: "GET" });
    cachedPhases = data.phases || [];
    renderPhasesTable();
    populatePhaseSelects();
  } catch (error) {
    tables.phases.innerHTML = `<div class="muted">${error.message}</div>`;
  }
}

function renderPhasesTable() {
  if (!cachedPhases.length) {
    tables.phases.innerHTML = '<div class="muted" style="padding:16px">No phases created yet.</div>';
    return;
  }
  const rows = cachedPhases
    .map(
      (p) => `<tr>
        <td>${p.name}</td>
        <td><code>${p.tabName}</code></td>
        <td><code>${p.masterSheetId?.slice(0, 12)}...</code></td>
        <td><code>${p.startColumn}</code></td>
        <td><code>${p.lastQuestionColumn || "—"}</code></td>
        <td>${p.questionCount || 0}</td>
        <td><span class="badge ${p.active ? "badge-active" : "badge-inactive"}">${p.active ? "Active" : "Inactive"}</span></td>
      </tr>`
    )
    .join("");

  tables.phases.innerHTML = `<table>
    <thead><tr>
      <th>Name</th><th>Tab</th><th>Sheet ID</th><th>Start</th><th>Last Col</th><th>Questions</th><th>Status</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function populatePhaseSelects() {
  const selects = [addFields.phaseId, filterPhaseId];
  selects.forEach((sel) => {
    const currentValue = sel.value;
    const isFilter = sel === filterPhaseId;

    sel.innerHTML = "";
    if (isFilter) {
      const all = document.createElement("option");
      all.value = "";
      all.textContent = "All";
      sel.appendChild(all);
    }

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select phase";
    if (!isFilter) sel.appendChild(placeholder);

    cachedPhases.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p._id || p.id;
      opt.textContent = p.name;
      sel.appendChild(opt);
    });

    if (currentValue) sel.value = currentValue;
  });
}

// ═══════════════════════════════════════════════════════════════════
//  QUESTION OPERATIONS
// ═══════════════════════════════════════════════════════════════════

async function addQuestionToSheet() {
  statuses.addToSheet.textContent = "";
  const addBtn = document.getElementById("addToSheet");
  addBtn.disabled = true;
  addBtn.textContent = "Adding...";

  const payload = {
    phase_id: addFields.phaseId.value,
    platform: addFields.platform.value,
    question_key: addFields.questionKey.value.trim(),
    title: addFields.title.value.trim(),
    url: addFields.url.value.trim(),
    difficulty: addFields.difficulty.value,
    tags: [...currentTags]
  };

  if (!payload.phase_id || !payload.question_key || !payload.title || !payload.url) {
    statuses.addToSheet.textContent = "All fields are required";
    addBtn.disabled = false;
    addBtn.textContent = "Add to Master Sheet & DB";
    return;
  }

  try {
    const data = await callApi("/api/admin/questions/add-to-sheet", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const msg = `Added! Column: ${data.master_column}/${data.time_column} • ${data.mappings_created} mappings created`;
    statuses.addToSheet.textContent = msg;
    showToast(msg, "success");

    // Reset form
    addFields.questionKey.value = "";
    addFields.title.value = "";
    addFields.url.value = "";
    currentTags = [];
    renderTags();
    updatePreview();

    // Refresh data
    await Promise.all([loadQuestions(), loadPhases(), fetchNextColumn()]);
  } catch (error) {
    statuses.addToSheet.textContent = error.message;
    showToast(error.message, "error");
  } finally {
    addBtn.disabled = false;
    addBtn.textContent = "Add to Master Sheet & DB";
  }
}

async function createQuestion() {
  statuses.question.textContent = "";
  const payload = {
    platform: questionFields.platform.value,
    question_key: questionFields.key.value.trim(),
    title: questionFields.title.value.trim(),
    url: questionFields.url.value.trim()
  };

  try {
    const data = await callApi("/api/admin/questions", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    statuses.question.textContent = `Question created: ${data.id}`;
    showToast("Question created (DB only)", "success");
    await loadQuestions();
  } catch (error) {
    statuses.question.textContent = error.message;
    showToast(error.message, "error");
  }
}

async function loadQuestions() {
  showSkeleton(tables.questions);
  try {
    const phaseFilter = filterPhaseId.value;
    const query = phaseFilter ? `?phase_id=${phaseFilter}` : "";
    const data = await callApi(`/api/admin/questions${query}`, { method: "GET" });
    cachedQuestions = data.questions || [];
    renderQuestionsTable();
    populateQuestionOptions();
  } catch (error) {
    tables.questions.innerHTML = `<div class="muted">${error.message}</div>`;
  }
}

function renderQuestionsTable() {
  if (!cachedQuestions.length) {
    tables.questions.innerHTML = '<div class="muted" style="padding:16px">No questions found.</div>';
    return;
  }

  const platBadge = (p) => {
    const cls = p === "leetcode" ? "badge-lc" : p === "codeforces" ? "badge-cf" : "badge-hr";
    const name = p === "leetcode" ? "LC" : p === "codeforces" ? "CF" : "HR";
    return `<span class="badge ${cls}">${name}</span>`;
  };

  const diffBadge = (d) => {
    if (!d) return "—";
    const cls = d === "Easy" ? "badge-easy" : d === "Medium" ? "badge-medium" : "badge-hard";
    return `<span class="badge ${cls}">${d}</span>`;
  };

  const rows = cachedQuestions
    .map((q) => {
      const phase = q.phaseId;
      const phaseName = typeof phase === "object" && phase?.name ? phase.name : "—";
      return `<tr>
        <td>${platBadge(q.platform)}</td>
        <td>${q.title}</td>
        <td><code>${q.questionKey}</code></td>
        <td>${diffBadge(q.difficulty)}</td>
        <td><code>${q.masterColumn || "—"}</code></td>
        <td>${phaseName}</td>
        <td><a href="${q.url}" target="_blank" rel="noreferrer">Open</a></td>
      </tr>`;
    })
    .join("");

  tables.questions.innerHTML = `<table>
    <thead><tr>
      <th>Platform</th><th>Title</th><th>Key</th><th>Diff</th><th>Col</th><th>Phase</th><th>URL</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

// ═══════════════════════════════════════════════════════════════════
//  GROUP OPERATIONS
// ═══════════════════════════════════════════════════════════════════

async function createGroup() {
  statuses.group.textContent = "";
  const payload = {
    group_name: groupFields.name.value.trim(),
    sheet_id: groupFields.sheetId.value.trim(),
    name_column: groupFields.nameColumn.value.trim(),
    name_start_row: Number(groupFields.nameStart.value),
    name_end_row: Number(groupFields.nameEnd.value)
  };

  try {
    const data = await callApi("/api/admin/groups", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    statuses.group.textContent = `Group created: ${data.id}`;
    showToast(`Group "${payload.group_name}" created`, "success");
    await loadGroups();
  } catch (error) {
    statuses.group.textContent = error.message;
    showToast(error.message, "error");
  }
}

async function loadGroups() {
  showSkeleton(tables.groups);
  try {
    const data = await callApi("/api/admin/groups", { method: "GET" });
    cachedGroups = data.groups || [];
    renderGroupsTable();
    populateGroupOptions();
  } catch (error) {
    tables.groups.innerHTML = `<div class="muted">${error.message}</div>`;
  }
}

function renderGroupsTable() {
  if (!cachedGroups.length) {
    tables.groups.innerHTML = '<div class="muted" style="padding:16px">No groups found.</div>';
    return;
  }
  const rows = cachedGroups
    .map(
      (g) => `<tr>
        <td>${g.groupName}</td>
        <td><code>${g.sheetId?.slice(0, 12)}...</code></td>
        <td><code>${g.nameColumn}${g.nameStartRow}–${g.nameEndRow}</code></td>
        <td><span class="badge ${g.active ? "badge-active" : "badge-inactive"}">${g.active ? "Active" : "Inactive"}</span></td>
      </tr>`
    )
    .join("");

  tables.groups.innerHTML = `<table>
    <thead><tr><th>Group</th><th>Sheet ID</th><th>Name Range</th><th>Status</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function populateGroupOptions() {
  mappingFields.groupName.innerHTML = '<option value="">Select group</option>';
  cachedGroups.forEach((g) => {
    const opt = document.createElement("option");
    opt.value = g.groupName;
    opt.textContent = g.groupName;
    mappingFields.groupName.appendChild(opt);
  });
}

// ═══════════════════════════════════════════════════════════════════
//  MAPPING OPERATIONS
// ═══════════════════════════════════════════════════════════════════

function populateQuestionOptions() {
  mappingFields.questionKey.innerHTML = '<option value="">Select question</option>';
  cachedQuestions.forEach((q) => {
    const opt = document.createElement("option");
    opt.value = q.questionKey;
    opt.textContent = `${q.platform} • ${q.questionKey}`;
    mappingFields.questionKey.appendChild(opt);
  });
}

async function createMapping() {
  statuses.mapping.textContent = "";
  const groupName = mappingFields.groupName.value;
  const questionKey = mappingFields.questionKey.value;
  const group = cachedGroups.find((g) => g.groupName === groupName);
  const question = cachedQuestions.find((q) => q.questionKey === questionKey);

  if (!group || !question) {
    statuses.mapping.textContent = "Select a valid group and question";
    return;
  }

  const payload = {
    question_id: question._id || question.id,
    group_id: group._id || group.id,
    trial_column: mappingFields.trial.value.trim(),
    time_column: mappingFields.time.value.trim()
  };

  try {
    const data = await callApi("/api/admin/mappings", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    statuses.mapping.textContent = `Mapping created: ${data.id}`;
    showToast("Mapping created", "success");
    await loadMappings();
  } catch (error) {
    statuses.mapping.textContent = error.message;
    showToast(error.message, "error");
  }
}

async function deleteMapping() {
  statuses.deleteMapping.textContent = "";
  const id = mappingFields.deleteMappingId.value;
  if (!id) {
    statuses.deleteMapping.textContent = "Select a mapping";
    return;
  }
  try {
    await callApi(`/api/admin/mappings/${id}`, { method: "DELETE" });
    statuses.deleteMapping.textContent = "Mapping deleted";
    showToast("Mapping deleted", "success");
    await loadMappings();
  } catch (error) {
    statuses.deleteMapping.textContent = error.message;
    showToast(error.message, "error");
  }
}

async function loadMappings() {
  showSkeleton(tables.mappings);
  try {
    const data = await callApi("/api/admin/mappings", { method: "GET" });
    cachedMappings = data.mappings || [];
    renderMappingsTable();
    populateMappingDeleteOptions();
  } catch (error) {
    tables.mappings.innerHTML = `<div class="muted">${error.message}</div>`;
  }
}
async function runSync() {
  syncStatus.textContent = "";
  syncTabsTable.innerHTML = "";
  syncQuestionsTable.innerHTML = "";
  syncWarningsTable.innerHTML = "";
  tabHealthTable.innerHTML = "";
  const masterSheetId = masterSheetIdInput.value.trim();
  try {
    const query = masterSheetId ? `?master_sheet_id=${encodeURIComponent(masterSheetId)}` : "";
    const data = await callApi(`/api/admin/sync${query}`, { method: "GET" });
    cachedSyncTabs = data.newTabs || [];
    cachedSyncQuestions = data.newQuestions || [];
    cachedSyncWarnings = data.warnings || [];
    renderSyncTabs();
    renderSyncQuestions();
    renderSyncWarnings();
    syncStatus.textContent = `Sync completed. Tabs: ${cachedSyncTabs.length}, Questions: ${cachedSyncQuestions.length}, Warnings: ${cachedSyncWarnings.length}`;
  } catch (error) {
    syncStatus.textContent = error.message;
  }
}

async function checkTabsHealth() {
  syncStatus.textContent = "";
  tabHealthTable.innerHTML = "";
  const masterSheetId = masterSheetIdInput.value.trim();
  try {
    const query = masterSheetId ? `?master_sheet_id=${encodeURIComponent(masterSheetId)}` : "";
    const data = await callApi(`/api/admin/tabs/health${query}`, { method: "GET" });
    cachedTabHealth = data.groups || [];
    renderTabHealth(data.expectedTabs || []);
    const missingCount = cachedTabHealth.reduce(
      (total, item) => total + (item.missingTabs?.length || 0),
      0
    );
    syncStatus.textContent = `Tab health check completed. Missing tabs: ${missingCount}`;
  } catch (error) {
    syncStatus.textContent = error.message;
  }
}

async function approveSync() {
  syncStatus.textContent = "";
  const masterSheetId = masterSheetIdInput.value.trim();

  const selectedTabs = cachedSyncTabs.filter((tab) => {
    const checkbox = document.querySelector(`input[data-tab-name="${tab.tabName}"]`);
    return checkbox && checkbox.checked;
  });

  const selectedQuestions = cachedSyncQuestions.filter((question) => {
    const checkbox = document.querySelector(
      `input[data-question-key="${question.platform}:${question.questionKey}"]`
    );
    return checkbox && checkbox.checked;
  });

  if (!selectedTabs.length && !selectedQuestions.length) {
    syncStatus.textContent = "Select at least one tab or question";
    return;
  }

  const payload = {
    ...(masterSheetId && { master_sheet_id: masterSheetId }),
    tabs: selectedTabs.map((tab) => ({
      tab_name: tab.tabName,
      start_column: tab.startColumn
    })),
    questions: selectedQuestions.map((question) => ({
      tab_name: question.tabName,
      platform: question.platform,
      question_key: question.questionKey,
      title: question.title,
      url: question.url,
      difficulty: question.difficulty || undefined,
      tags: question.tags || [],
      master_column: question.masterColumn,
      time_column: question.timeColumn
    }))
  };

  try {
    const data = await callApi("/api/admin/sync/approve", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    syncStatus.textContent = `Approved. Phases: ${data.created_phases}, Questions: ${data.created_questions}`;
    await runSync();
    await loadQuestions();
    await loadMappings();
  } catch (error) {
    syncStatus.textContent = error.message;
  }
}

function renderGroupsTable() {
  if (!cachedGroups.length) {
    tables.groups.innerHTML = '<div class="muted">No groups found.</div>';
    return;
  }
  const rows = cachedGroups
    .map(
      (item) => `
      <tr>
        <td>${item.groupName}</td>
        <td>${item.sheetId}</td>
        <td>${item.nameColumn}${item.nameStartRow}-${item.nameEndRow}</td>
        <td>${item.active ? "Active" : "Inactive"}</td>
      </tr>`
    )
    .join("");

  tables.groups.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Group</th>
          <th>Sheet ID</th>
          <th>Name Range</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderQuestionsTable() {
  if (!cachedQuestions.length) {
    tables.questions.innerHTML = '<div class="muted">No questions found.</div>';
    return;
  }
  const rows = cachedQuestions
    .map(
      (item) => `
      <tr>
        <td>${item.platform}</td>
        <td>${item.questionKey}</td>
        <td>${item.title}</td>
        <td><a href="${item.url}" target="_blank" rel="noreferrer">Open</a></td>
      </tr>`
    )
    .join("");

  tables.questions.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Platform</th>
          <th>Key</th>
          <th>Title</th>
          <th>URL</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}
function renderMappingsTable() {
  if (!cachedMappings.length) {
    tables.mappings.innerHTML = '<div class="muted" style="padding:16px">No mappings found.</div>';
    return;
  }
  const groupById = new Map(cachedGroups.map((g) => [g._id || g.id, g]));
  const questionById = new Map(cachedQuestions.map((q) => [q._id || q.id, q]));

  const rows = cachedMappings
    .map((m) => {
      const group = groupById.get(m.groupId);
      const question = questionById.get(m.questionId);
      return `<tr>
        <td>${group?.groupName || "—"}</td>
        <td>${question?.questionKey || "—"}</td>
        <td><code>${m.trialColumn}</code></td>
        <td><code>${m.timeColumn}</code></td>
      </tr>`;
    })
    .join("");

  tables.mappings.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Group</th>
          <th>Question</th>
          <th>Trial Column</th>
          <th>Time Column</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderSyncTabs() {
  if (!cachedSyncTabs.length) {
    syncTabsTable.innerHTML = '<div class="muted">No new tabs detected.</div>';
    return;
  }
  const rows = cachedSyncTabs
    .map(
      (tab) => `
      <tr>
        <td><input type="checkbox" data-tab-name="${tab.tabName}" checked /></td>
        <td>${tab.tabName}</td>
        <td>${tab.startColumn || "E"}</td>
      </tr>`
    )
    .join("");

  syncTabsTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Select</th>
          <th>Tab</th>
          <th>Start Column</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderSyncQuestions() {
  if (!cachedSyncQuestions.length) {
    syncQuestionsTable.innerHTML = '<div class="muted">No new questions detected.</div>';
    return;
  }
  const rows = cachedSyncQuestions
    .map(
      (question) => `
      <tr>
        <td><input type="checkbox" data-question-key="${question.platform}:${question.questionKey}" checked /></td>
        <td>${question.tabName}</td>
        <td>${question.platform}</td>
        <td>${question.questionKey}</td>
        <td>${question.title}</td>
        <td>${question.difficulty || "—"}</td>
        <td>${(question.tags || []).join(", ") || "—"}</td>
        <td>${question.url ? `<a href="${question.url}" target="_blank" rel="noreferrer">Open</a>` : "—"}</td>
        <td>${question.masterColumn}/${question.timeColumn}</td>
      </tr>`
    )
    .join("");

  syncQuestionsTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Select</th>
          <th>Tab</th>
          <th>Platform</th>
          <th>Key</th>
          <th>Title</th>
          <th>Difficulty</th>
          <th>Tags</th>
          <th>URL</th>
          <th>Cols</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderSyncWarnings() {
  if (!cachedSyncWarnings.length) {
    syncWarningsTable.innerHTML = '<div class="muted">No warnings detected.</div>';
    return;
  }
  const rows = cachedSyncWarnings
    .map(
      (item) => `
      <tr>
        <td>${item.tabName}</td>
        <td>${item.column}</td>
        <td>${item.issue}</td>
      </tr>`
    )
    .join("");

  syncWarningsTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Tab</th>
          <th>Column</th>
          <th>Issue</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderTabHealth(expectedTabs) {
  if (!cachedTabHealth.length) {
    tabHealthTable.innerHTML = '<div class="muted">No group sheets found.</div>';
    return;
  }
  const rows = cachedTabHealth
    .map((group) => {
      const missing = group.missingTabs?.length ? group.missingTabs.join(", ") : "—";
      return `
      <tr>
        <td>${group.groupName}</td>
        <td>${missing}</td>
      </tr>`;
    })
    .join("");

  const expectedList = expectedTabs.length ? expectedTabs.join(", ") : "—";

  tabHealthTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th colspan="2">Expected Tabs: ${expectedList}</th>
        </tr>
        <tr>
          <th>Group</th>
          <th>Missing Tabs</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function populateMappingDeleteOptions() {
  mappingFields.deleteMappingId.innerHTML = '<option value="">Select mapping</option>';
  const groupById = new Map(cachedGroups.map((g) => [g._id || g.id, g]));
  const questionById = new Map(cachedQuestions.map((q) => [q._id || q.id, q]));

  cachedMappings.forEach((m) => {
    const opt = document.createElement("option");
    const group = groupById.get(m.groupId);
    const question = questionById.get(m.questionId);
    opt.value = m._id || m.id;
    opt.textContent = `${group?.groupName || "—"} • ${question?.questionKey || "—"}`;
    mappingFields.deleteMappingId.appendChild(opt);
  });
}

// ─── Event Listeners ──────────────────────────────────────────────

settingsToggle.addEventListener("click", () => {
  settingsPanel.classList.toggle("hidden");
});

document.getElementById("saveSettings").addEventListener("click", saveSettings);
document.getElementById("createPhase").addEventListener("click", createPhase);
document.getElementById("loadPhases").addEventListener("click", loadPhases);
document.getElementById("addToSheet").addEventListener("click", addQuestionToSheet);
document.getElementById("createQuestion").addEventListener("click", createQuestion);
document.getElementById("loadQuestions").addEventListener("click", loadQuestions);
document.getElementById("createGroup").addEventListener("click", createGroup);
document.getElementById("loadGroups").addEventListener("click", loadGroups);
document.getElementById("createMapping").addEventListener("click", createMapping);
document.getElementById("deleteMapping").addEventListener("click", deleteMapping);
document.getElementById("loadMappings").addEventListener("click", loadMappings);
document.getElementById("runSync").addEventListener("click", runSync);
document.getElementById("approveSync").addEventListener("click", approveSync);
document.getElementById("checkTabs").addEventListener("click", checkTabsHealth);

filterPhaseId.addEventListener("change", loadQuestions);

// ─── Init ─────────────────────────────────────────────────────────

loadSettings();
Promise.all([loadPhases(), loadGroups(), loadQuestions(), loadMappings()]);
