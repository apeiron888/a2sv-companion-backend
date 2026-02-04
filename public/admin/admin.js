const apiBaseInput = document.getElementById("apiBase");
const adminKeyInput = document.getElementById("adminKey");
const settingsStatus = document.getElementById("settingsStatus");

const groupStatus = document.getElementById("groupStatus");
const questionStatus = document.getElementById("questionStatus");
const mappingStatus = document.getElementById("mappingStatus");
const deleteMappingStatus = document.getElementById("deleteMappingStatus");
const dataTable = document.getElementById("dataTable");

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
  mappingQuestionId: document.getElementById("mappingQuestionId"),
  mappingGroupId: document.getElementById("mappingGroupId"),
  mappingTrial: document.getElementById("mappingTrial"),
  mappingTime: document.getElementById("mappingTime"),
  deleteMappingId: document.getElementById("deleteMappingId")
};

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
  const payload = {
    question_id: fields.mappingQuestionId.value.trim(),
    group_id: fields.mappingGroupId.value.trim(),
    trial_column: fields.mappingTrial.value.trim(),
    time_column: fields.mappingTime.value.trim()
  };
  try {
    const data = await callApi("/api/admin/mappings", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    mappingStatus.textContent = `Mapping created: ${data.id}`;
  } catch (error) {
    mappingStatus.textContent = error.message;
  }
}

async function deleteMapping() {
  deleteMappingStatus.textContent = "";
  const id = fields.deleteMappingId.value.trim();
  if (!id) {
    deleteMappingStatus.textContent = "Mapping ID required";
    return;
  }
  try {
    await callApi(`/api/admin/mappings/${id}`, { method: "DELETE" });
    deleteMappingStatus.textContent = "Mapping deleted";
  } catch (error) {
    deleteMappingStatus.textContent = error.message;
  }
}

async function loadGroups() {
  dataTable.innerHTML = "Loading...";
  try {
    const data = await callApi("/api/admin/groups", { method: "GET" });
    dataTable.innerHTML = `<pre>${JSON.stringify(data.groups, null, 2)}</pre>`;
  } catch (error) {
    dataTable.innerHTML = `<pre>${error.message}</pre>`;
  }
}

async function loadQuestions() {
  dataTable.innerHTML = "Loading...";
  try {
    const data = await callApi("/api/admin/questions", { method: "GET" });
    dataTable.innerHTML = `<pre>${JSON.stringify(data.questions, null, 2)}</pre>`;
  } catch (error) {
    dataTable.innerHTML = `<pre>${error.message}</pre>`;
  }
}

async function loadMappings() {
  dataTable.innerHTML = "Loading...";
  try {
    const data = await callApi("/api/admin/mappings", { method: "GET" });
    dataTable.innerHTML = `<pre>${JSON.stringify(data.mappings, null, 2)}</pre>`;
  } catch (error) {
    dataTable.innerHTML = `<pre>${error.message}</pre>`;
  }
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
