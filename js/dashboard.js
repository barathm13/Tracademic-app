document.addEventListener('DOMContentLoaded', () => {
  const state = {
    user: null,
    profile: null,
    tasks: [],
    attendance: [],
    filter: 'all',
    search: ''
  };

  const els = {
    userName: document.getElementById('userName'),
    logoutBtn: document.getElementById('logoutBtn'),
    themeToggle: document.getElementById('themeToggle'),
    todayDate: document.getElementById('todayDate'),
    heroAttendance: document.getElementById('heroAttendance'),
    totalTasks: document.getElementById('totalTasks'),
    completedTasks: document.getElementById('completedTasks'),
    pendingTasks: document.getElementById('pendingTasks'),
    attendancePercent: document.getElementById('attendancePercent'),
    taskCompletionPercent: document.getElementById('taskCompletionPercent'),
    taskDonut: document.getElementById('taskDonut'),
    taskForm: document.getElementById('taskForm'),
    taskId: document.getElementById('taskId'),
    taskTitle: document.getElementById('taskTitle'),
    taskDescription: document.getElementById('taskDescription'),
    dueDate: document.getElementById('dueDate'),
    saveTaskBtn: document.getElementById('saveTaskBtn'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),
    taskList: document.getElementById('taskList'),
    taskFilter: document.getElementById('taskFilter'),
    taskSearch: document.getElementById('taskSearch'),
    presentBtn: document.getElementById('presentBtn'),
    absentBtn: document.getElementById('absentBtn'),
    attendanceStatus: document.getElementById('attendanceStatus'),
    attendanceTable: document.getElementById('attendanceTable'),
    toastContainer: document.getElementById('toastContainer')
  };

  const today = new Date().toISOString().slice(0, 10);
  els.todayDate.textContent = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  els.dueDate.min = today;

  function toast(message, type = 'success') {
    const node = document.createElement('div');
    node.className = `toast ${type}`;
    node.textContent = message;
    els.toastContainer.appendChild(node);
    setTimeout(() => node.remove(), 3600);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function attendancePercentage() {
    if (!state.attendance.length) return 0;
    const presentCount = state.attendance.filter((entry) => entry.status === 'Present').length;
    return Math.round((presentCount / state.attendance.length) * 100);
  }

  function renderStats() {
    const total = state.tasks.length;
    const completed = state.tasks.filter((task) => task.status === 'Completed').length;
    const pending = total - completed;
    const completion = total ? Math.round((completed / total) * 100) : 0;
    const attendance = attendancePercentage();

    els.totalTasks.textContent = total;
    els.completedTasks.textContent = completed;
    els.pendingTasks.textContent = pending;
    els.attendancePercent.textContent = `${attendance}%`;
    els.heroAttendance.textContent = `${attendance}%`;
    els.taskCompletionPercent.textContent = `${completion}%`;
    els.taskDonut.style.setProperty('--progress', completion);
  }

  function renderTasks() {
    const normalizedSearch = state.search.toLowerCase();
    const visibleTasks = state.tasks.filter((task) => {
      const matchesFilter = state.filter === 'all' || task.status === state.filter;
      const matchesSearch = `${task.title} ${task.description || ''}`.toLowerCase().includes(normalizedSearch);
      return matchesFilter && matchesSearch;
    });

    if (!visibleTasks.length) {
      els.taskList.innerHTML = '<div class="empty-state">No tasks found. Add a task to get started.</div>';
      return;
    }

    els.taskList.innerHTML = visibleTasks.map((task) => `
      <article class="task-item ${task.status === 'Completed' ? 'completed' : ''}">
        <div>
          <h3>${escapeHtml(task.title)}</h3>
          <p>${escapeHtml(task.description || 'No description added.')}</p>
          <span class="badge ${task.status === 'Completed' ? 'completed' : ''}">${task.status}</span>
          <span class="badge">Due: ${escapeHtml(task.due_date)}</span>
        </div>
        <div class="task-actions">
          <button class="btn btn-success" data-action="toggle" data-id="${task.id}" type="button">
            ${task.status === 'Completed' ? 'Pending' : 'Done'}
          </button>
          <button class="btn btn-ghost" data-action="edit" data-id="${task.id}" type="button">Edit</button>
          <button class="btn btn-danger" data-action="delete" data-id="${task.id}" type="button">Delete</button>
        </div>
      </article>
    `).join('');
  }

  function renderAttendance() {
    const markedToday = state.attendance.find((entry) => entry.date === today);
    els.presentBtn.disabled = Boolean(markedToday);
    els.absentBtn.disabled = Boolean(markedToday);
    els.attendanceStatus.textContent = markedToday
      ? `Today's attendance is already marked as ${markedToday.status}.`
      : 'You can mark attendance only once per day.';

    if (!state.attendance.length) {
      els.attendanceTable.innerHTML = '<tr><td colspan="2">No attendance records yet.</td></tr>';
      return;
    }

    els.attendanceTable.innerHTML = state.attendance.map((entry) => `
      <tr>
        <td>${escapeHtml(entry.date)}</td>
        <td><span class="badge ${entry.status === 'Present' ? 'completed' : ''}">${entry.status}</span></td>
      </tr>
    `).join('');
  }

  function renderAll() {
    renderStats();
    renderTasks();
    renderAttendance();
  }

  function resetTaskForm() {
    els.taskForm.reset();
    els.taskId.value = '';
    els.saveTaskBtn.textContent = 'Add task';
    els.cancelEditBtn.classList.add('hidden');
  }

  async function loadDashboard() {
    try {
      const session = await StudentTracker.auth.getSession();
      if (!session) {
        window.location.href = 'login.html';
        return;
      }

      state.user = session.user;
      const fallbackName = state.user.user_metadata?.name || state.user.email;

      try {
        state.profile = await StudentTracker.db.getProfile(state.user.id);
      } catch (error) {
        state.profile = await StudentTracker.db.upsertProfile(state.user.id, fallbackName, state.user.email);
      }

      els.userName.textContent = state.profile.name || fallbackName;
      const [tasks, attendance] = await Promise.all([
        StudentTracker.db.getTasks(state.user.id),
        StudentTracker.db.getAttendance(state.user.id)
      ]);
      state.tasks = tasks;
      state.attendance = attendance;
      renderAll();
    } catch (error) {
      toast(error.message || 'Unable to load dashboard.', 'error');
      if (String(error.message).includes('Supabase is not configured')) {
        els.taskList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
      }
    }
  }

  els.taskForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const title = els.taskTitle.value.trim();
    const description = els.taskDescription.value.trim();
    const dueDate = els.dueDate.value;

    if (!title || !dueDate) {
      toast('Task title and due date are required.', 'error');
      return;
    }

    try {
      els.saveTaskBtn.disabled = true;
      const payload = {
        user_id: state.user.id,
        title,
        description,
        due_date: dueDate,
        status: 'Pending'
      };

      if (els.taskId.value) {
        const updatedTask = await StudentTracker.db.updateTask(els.taskId.value, {
          title,
          description,
          due_date: dueDate
        });
        state.tasks = state.tasks.map((task) => task.id === updatedTask.id ? updatedTask : task);
        toast('Task updated successfully.');
      } else {
        const createdTask = await StudentTracker.db.createTask(payload);
        state.tasks = [createdTask, ...state.tasks];
        toast('Task added successfully.');
      }

      resetTaskForm();
      renderAll();
    } catch (error) {
      toast(error.message || 'Unable to save task.', 'error');
    } finally {
      els.saveTaskBtn.disabled = false;
    }
  });

  els.cancelEditBtn.addEventListener('click', resetTaskForm);

  els.taskList.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const task = state.tasks.find((item) => item.id === button.dataset.id);
    if (!task) return;

    if (button.dataset.action === 'edit') {
      els.taskId.value = task.id;
      els.taskTitle.value = task.title;
      els.taskDescription.value = task.description || '';
      els.dueDate.value = task.due_date;
      els.saveTaskBtn.textContent = 'Update task';
      els.cancelEditBtn.classList.remove('hidden');
      els.taskTitle.focus();
      return;
    }

    try {
      button.disabled = true;
      if (button.dataset.action === 'toggle') {
        const updatedTask = await StudentTracker.db.updateTask(task.id, {
          status: task.status === 'Completed' ? 'Pending' : 'Completed'
        });
        state.tasks = state.tasks.map((item) => item.id === updatedTask.id ? updatedTask : item);
        toast('Task status updated.');
      }

      if (button.dataset.action === 'delete') {
        const confirmed = window.confirm('Delete this task?');
        if (!confirmed) return;
        await StudentTracker.db.deleteTask(task.id);
        state.tasks = state.tasks.filter((item) => item.id !== task.id);
        toast('Task deleted.');
      }
      renderAll();
    } catch (error) {
      toast(error.message || 'Task action failed.', 'error');
    } finally {
      button.disabled = false;
    }
  });

  els.taskFilter.addEventListener('change', (event) => {
    state.filter = event.target.value;
    renderTasks();
  });

  els.taskSearch.addEventListener('input', (event) => {
    state.search = event.target.value.trim();
    renderTasks();
  });

  async function markToday(status) {
    if (state.attendance.some((entry) => entry.date === today)) {
      toast('Attendance is already marked for today.', 'error');
      return;
    }

    try {
      els.presentBtn.disabled = true;
      els.absentBtn.disabled = true;
      const entry = await StudentTracker.db.markAttendance(state.user.id, today, status);
      state.attendance = [entry, ...state.attendance];
      toast(`Marked ${status} for today.`);
      renderAll();
    } catch (error) {
      toast(error.message || 'Unable to mark attendance.', 'error');
      renderAttendance();
    }
  }

  els.presentBtn.addEventListener('click', () => markToday('Present'));
  els.absentBtn.addEventListener('click', () => markToday('Absent'));

  els.logoutBtn.addEventListener('click', async () => {
    try {
      await StudentTracker.auth.logout();
      window.location.href = 'login.html';
    } catch (error) {
      toast(error.message || 'Logout failed.', 'error');
    }
  });

  els.themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const enabled = document.body.classList.contains('dark');
    localStorage.setItem('studentTrackerDarkMode', enabled ? 'true' : 'false');
    els.themeToggle.textContent = enabled ? '☀️' : '🌙';
  });

  if (localStorage.getItem('studentTrackerDarkMode') === 'true') {
    document.body.classList.add('dark');
    els.themeToggle.textContent = '☀️';
  }

  loadDashboard();
});
