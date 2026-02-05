const apiBaseInput = document.getElementById("apiBase");
const adminKeyInput = document.getElementById("adminKey");
const settingsStatus = document.getElementById("settingsStatus");

const groupStatus = document.getElementById("groupStatus");
const questionStatus = document.getElementById("questionStatus");
const mappingStatus = document.getElementById("mappingStatus");
const deleteMappingStatus = document.getElementById("deleteMappingStatus");
const groupsTable = document.getElementById("groupsTable");
const questionsTable = document.getElementById("questionsTable");
const mappingsTable = document.getElementById("mappingsTable");

const fields = {
  groupName: document.getElementById("groupName"),
  sheetId: document.getElementById("sheetId"),
  nameColumn: document.getElementById("nameColumn"),
  nameStart: document.getElementById("nameStart"),
  nameEnd: document.getElementById("nameEnd"),
  questionPlatform: document.getElementById("questionPlatform"),
  questionKey: document.getElementById("questionKey"),
  questionTitle: document.getElementById("questionTitle"),
  questionUrl: document.getElementById("questionUrl"),
  mappingGroupName: document.getElementById("mappingGroupName"),
  mappingQuestionKey: document.getElementById("mappingQuestionKey"),
  mappingTrial: document.getElementById("mappingTrial"),
  mappingTime: document.getElementById("mappingTime"),
  deleteMappingId: document.getElementById("deleteMappingId")
};

let cachedGroups = [];
let cachedQuestions = [];
let cachedMappings = [];

function loadSettings() {
  const apiBase = localStorage.getItem("apiBase") || window.location.origin;
  const adminKey = localStorage.getItem("adminKey") || "";
  apiBaseInput.value = apiBase;
  adminKeyInput.value = adminKey;
}

function saveSettings() {
  localStorage.setItem("apiBase", apiBaseInput.value.trim());
  localStorage.setItem("adminKey", adminKeyInput.value.trim());
  settingsStatus.textContent = "Settings saved";
}

function getConfig() {
  const apiBase = apiBaseInput.value.trim();
  const adminKey = adminKeyInput.value.trim();
  return { apiBase, adminKey };
}

async function callApi(path, options) {
  const { apiBase, adminKey } = getConfig();
  if (!apiBase || !adminKey) {
    throw new Error("API base and admin key required");
  }
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": adminKey,
      ...(options?.headers || {})
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }
  return data;
}

async function createGroup() {
  groupStatus.textContent = "";
  const payload = {
    group_name: fields.groupName.value.trim(),
    sheet_id: fields.sheetId.value.trim(),
    name_column: fields.nameColumn.value.trim(),
    name_start_row: Number(fields.nameStart.value),
    name_end_row: Number(fields.nameEnd.value)
  };
  try {
    const data = await callApi("/api/admin/groups", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    groupStatus.textContent = `Group created: ${data.id}`;
  } catch (error) {
    groupStatus.textContent = error.message;
  }
}

async function createQuestion() {
  questionStatus.textContent = "";
  const payload = {
    platform: fields.questionPlatform.value,
    question_key: fields.questionKey.value.trim(),
    title: fields.questionTitle.value.trim(),
    url: fields.questionUrl.value.trim()
  };
  try {
    const data = await callApi("/api/admin/questions", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    questionStatus.textContent = `Question created: ${data.id}`;
  } catch (error) {
    questionStatus.textContent = error.message;
  }
}

async function createMapping() {
  mappingStatus.textContent = "";
  const groupName = fields.mappingGroupName.value;
  const questionKey = fields.mappingQuestionKey.value;

  const group = cachedGroups.find((item) => item.groupName === groupName);
  const question = cachedQuestions.find((item) => item.questionKey === questionKey);
  if (!group || !question) {
    mappingStatus.textContent = "Select a valid group and question";
    return;
  }

  const payload = {
    question_id: question._id || question.id,
    group_id: group._id || group.id,
    trial_column: fields.mappingTrial.value.trim(),
    time_column: fields.mappingTime.value.trim()
  };
  try {
    const data = await callApi("/api/admin/mappings", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    mappingStatus.textContent = `Mapping created: ${data.id}`;
    await loadMappings();
  } catch (error) {
    mappingStatus.textContent = error.message;
  }
}

async function deleteMapping() {
  deleteMappingStatus.textContent = "";
  const id = fields.deleteMappingId.value;
  if (!id) {
    deleteMappingStatus.textContent = "Mapping ID required";
    return;
  }
  try {
    await callApi(`/api/admin/mappings/${id}`, { method: "DELETE" });
    deleteMappingStatus.textContent = "Mapping deleted";
    await loadMappings();
  } catch (error) {
    deleteMappingStatus.textContent = error.message;
  }
}

async function loadGroups() {
  groupsTable.innerHTML = "Loading...";
  try {
    const data = await callApi("/api/admin/groups", { method: "GET" });
    cachedGroups = data.groups || [];
    renderGroupsTable();
    populateGroupOptions();
  } catch (error) {
    groupsTable.innerHTML = `<div class="muted">${error.message}</div>`;
  }
}

async function loadQuestions() {
  questionsTable.innerHTML = "Loading...";
  try {
    const data = await callApi("/api/admin/questions", { method: "GET" });
    cachedQuestions = data.questions || [];
    renderQuestionsTable();
    populateQuestionOptions();
  } catch (error) {
    questionsTable.innerHTML = `<div class="muted">${error.message}</div>`;
  }
}

async function loadMappings() {
  mappingsTable.innerHTML = "Loading...";
  try {
    const data = await callApi("/api/admin/mappings", { method: "GET" });
    cachedMappings = data.mappings || [];
    renderMappingsTable();
    populateMappingDeleteOptions();
  } catch (error) {
    mappingsTable.innerHTML = `<div class="muted">${error.message}</div>`;
  }
}

function renderGroupsTable() {
  if (!cachedGroups.length) {
    groupsTable.innerHTML = '<div class="muted">No groups found.</div>';
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

  groupsTable.innerHTML = `
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
    questionsTable.innerHTML = '<div class="muted">No questions found.</div>';
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

  questionsTable.innerHTML = `
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
    mappingsTable.innerHTML = '<div class="muted">No mappings found.</div>';
    return;
  }
  const groupById = new Map(cachedGroups.map((item) => [item._id || item.id, item]));
  const questionById = new Map(cachedQuestions.map((item) => [item._id || item.id, item]));

  const rows = cachedMappings
    .map((item) => {
      const group = groupById.get(item.groupId);
      const question = questionById.get(item.questionId);
      return `
      <tr>
        <td>${group?.groupName || "—"}</td>
        <td>${question?.questionKey || "—"}</td>
        <td>${item.trialColumn}</td>
        <td>${item.timeColumn}</td>
      </tr>`;
    })
    .join("");

  mappingsTable.innerHTML = `
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

function populateGroupOptions() {
  fields.mappingGroupName.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select a group";
  fields.mappingGroupName.appendChild(placeholder);

  cachedGroups.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.groupName;
    option.textContent = item.groupName;
    fields.mappingGroupName.appendChild(option);
  });
}

function populateQuestionOptions() {
  fields.mappingQuestionKey.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select a question";
  fields.mappingQuestionKey.appendChild(placeholder);

  cachedQuestions.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.questionKey;
    option.textContent = `${item.platform} • ${item.questionKey}`;
    fields.mappingQuestionKey.appendChild(option);
  });
}

function populateMappingDeleteOptions() {
  fields.deleteMappingId.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select a mapping";
  fields.deleteMappingId.appendChild(placeholder);

  const groupById = new Map(cachedGroups.map((item) => [item._id || item.id, item]));
  const questionById = new Map(cachedQuestions.map((item) => [item._id || item.id, item]));

  cachedMappings.forEach((item) => {
    const option = document.createElement("option");
    const group = groupById.get(item.groupId);
    const question = questionById.get(item.questionId);
    option.value = item._id || item.id;
    option.textContent = `${group?.groupName || "—"} • ${question?.questionKey || "—"}`;
    fields.deleteMappingId.appendChild(option);
  });
}

document.getElementById("saveSettings").addEventListener("click", saveSettings);
document.getElementById("createGroup").addEventListener("click", createGroup);
document.getElementById("createQuestion").addEventListener("click", createQuestion);
document.getElementById("createMapping").addEventListener("click", createMapping);
document.getElementById("deleteMapping").addEventListener("click", deleteMapping);
document.getElementById("loadGroups").addEventListener("click", loadGroups);
document.getElementById("loadQuestions").addEventListener("click", loadQuestions);
document.getElementById("loadMappings").addEventListener("click", loadMappings);

loadSettings();
loadGroups();
loadQuestions();
loadMappings();
