const taskList = document.getElementById('taskList');
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const statusBox = document.getElementById('status');
const refreshBtn = document.getElementById('refreshBtn');
const exportBtn = document.getElementById('exportBtn');
const configMessage = document.getElementById('configMessage');
const appTitle = document.getElementById('appTitle');
const dataModeBadge = document.getElementById('dataModeBadge');

function setStatus(message, isError = false) {
  statusBox.textContent = message;
  statusBox.style.color = isError ? '#b91c1c' : '#6b7280';
}

async function loadConfig() {
  try {
    const response = await fetch('/api/config');
    const config = await response.json();
    if (!response.ok) throw new Error(config.error || 'Erreur de configuration');

    appTitle.textContent = config.appTitle;
    configMessage.textContent = config.message;
    dataModeBadge.textContent = config.dataMode;
  } catch (error) {
    configMessage.textContent = 'Configuration indisponible';
    setStatus(error.message, true);
  }
}

function taskTemplate(task) {
  const li = document.createElement('li');
  li.className = 'task-item';

  const left = document.createElement('div');
  left.className = 'task-left';

  const title = document.createElement('div');
  title.className = `task-title ${task.completed ? 'completed' : ''}`;
  title.textContent = task.title;

  const meta = document.createElement('div');
  meta.className = 'task-meta';
  meta.textContent = `Créée: ${new Date(task.createdAt).toLocaleString()} • source: ${task.source}`;

  left.appendChild(title);
  left.appendChild(meta);

  const actions = document.createElement('div');
  actions.className = 'task-actions';

  const toggleBtn = document.createElement('button');
  toggleBtn.className = `toggle-btn ${task.completed ? 'done' : ''}`;
  toggleBtn.textContent = task.completed ? 'Marquer à faire' : 'Terminer';
  toggleBtn.addEventListener('click', async () => {
    await fetch(`/api/tasks/${task.id}/toggle`, { method: 'PATCH' });
    await loadTasks();
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = 'Supprimer';
  deleteBtn.addEventListener('click', async () => {
    await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
    await loadTasks();
  });

  actions.appendChild(toggleBtn);
  actions.appendChild(deleteBtn);

  li.appendChild(left);
  li.appendChild(actions);
  return li;
}

async function loadTasks() {
  try {
    const response = await fetch('/api/tasks');
    const tasks = await response.json();
    if (!response.ok) throw new Error(tasks.error || 'Impossible de charger les tâches');

    taskList.innerHTML = '';
    if (tasks.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'empty';
      empty.textContent = 'Aucune tâche pour le moment.';
      taskList.appendChild(empty);
    } else {
      tasks.forEach((task) => taskList.appendChild(taskTemplate(task)));
    }
    setStatus(`${tasks.length} tâche(s) chargée(s).`);
  } catch (error) {
    setStatus(error.message, true);
  }
}

taskForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const title = taskInput.value.trim();
  if (!title) return;

  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Impossible de créer la tâche');

    taskInput.value = '';
    await loadTasks();
  } catch (error) {
    setStatus(error.message, true);
  }
});

refreshBtn.addEventListener('click', loadTasks);

exportBtn.addEventListener('click', async () => {
  try {
    const response = await fetch('/api/tasks/export', { method: 'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Impossible d’exporter');

    const location = data.result.url || data.result.path;
    setStatus(`Export réussi (${data.result.provider}) : ${location}`);
  } catch (error) {
    setStatus(error.message, true);
  }
});

(async function init() {
  await loadConfig();
  await loadTasks();
})();
