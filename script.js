// ========================================
// Get references to the HTML elements
// ========================================
const taskInput = document.getElementById('task-input');       // The text input
const addBtn = document.getElementById('add-btn');           // The "Add" button
const categorySelect = document.getElementById('category-select');   // Category dropdown
const prioritySelect = document.getElementById('priority-select');   // Priority dropdown
const statusSelect = document.getElementById('status-select');     // Status dropdown
const dateInput = document.getElementById('date-input');        // The date picker
const taskList = document.getElementById('task-list');         // The <ul> list
const taskCounter = document.getElementById('task-counter');      // The counter text

// All filter buttons (both category and status filter bars)
const filterBtns = document.querySelectorAll('.filter-btn');

// Keep track of the two active filters separately
let currentCategoryFilter = 'All';  // Category filter (All, Work, Learning, etc.)
let currentStatusFilter = 'All';  // Status filter (All, WIP, Ongoing, Hold, Done)


// ========================================
// localStorage Helpers
// ========================================

// Key used to store tasks in localStorage
const STORAGE_KEY = 'myTaskListData';

// Load all saved tasks from localStorage (returns an array of task objects)
function loadTasksFromStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  // If nothing saved yet, return an empty array
  return saved ? JSON.parse(saved) : [];
}

// Save all current tasks to localStorage
function saveTasksToStorage() {
  // Collect every task item in the list and build a data object for each
  const allTasks = taskList.querySelectorAll('.task-item');
  const tasksData = [];

  allTasks.forEach(function (li) {
    tasksData.push({
      text: li.dataset.text,
      category: li.dataset.category,
      priority: li.dataset.priority,
      status: li.dataset.status,       // Save current status
      date: li.dataset.date,
      completed: li.classList.contains('completed')
    });
  });

  // Store as a JSON string
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksData));
}


// ========================================
// On Page Load — Restore Saved Tasks
// ========================================

// When the page first loads, pull tasks from localStorage and display them
window.addEventListener('load', function () {
  const savedTasks = loadTasksFromStorage();

  savedTasks.forEach(function (taskData) {
    // Recreate each task element from stored data
    // Use 'WIP' as the default status for older tasks that don't have one saved
    const taskItem = createTaskItem(
      taskData.text,
      taskData.category,
      taskData.priority,
      taskData.status || 'WIP',   // Fallback for old saved data
      taskData.date,
      taskData.completed          // Pass the saved completed state
    );
    taskList.appendChild(taskItem);
  });

  // Apply the current filters and update the counter after restoring
  applyFilter();
  updateCounter();
});


// ========================================
// Add Task
// ========================================

// When the "Add" button is clicked, call addTask()
addBtn.addEventListener('click', addTask);

// Also allow pressing the Enter key to add a task
taskInput.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    addTask();
  }
});

function addTask() {
  // Read and clean up the text the user typed
  const taskText = taskInput.value.trim();

  // Don't add an empty task
  if (taskText === '') {
    taskInput.focus();
    return;
  }

  // Read the selected category, priority, status, and date
  const category = categorySelect.value;
  const priority = prioritySelect.value;
  const status = statusSelect.value;    // Read selected status
  const date = dateInput.value;         // e.g. "2026-04-20" or ""

  // If the status is "Done", mark the task as completed from the start
  const isCompleted = (status === 'Done');

  // Create the task element and add it to the list
  const taskItem = createTaskItem(taskText, category, priority, status, date, isCompleted);
  taskList.appendChild(taskItem);

  // Save to localStorage so the task persists after refresh
  saveTasksToStorage();

  // Clear the input box and focus it, ready for the next task
  taskInput.value = '';
  taskInput.focus();

  // Apply the current filters (hide the task if it doesn't match)
  applyFilter();

  // Update the counter
  updateCounter();
}


// ========================================
// Update Status Label — Helper Function
// ========================================
//
// This is the KEY function for checkbox ↔ status sync.
// It updates everything in one place:
//   1. dataset.status (the data attribute)
//   2. The status dropdown value and color
//   3. The checkbox (checked/unchecked) and completed class
//   4. Saves to localStorage
//
// Call this whenever the checkbox OR the status dropdown changes.
//
function updateStatusLabel(li, newStatus) {
  // 1. Update the data attribute on the <li>
  li.dataset.status = newStatus;

  // 2. Update the inline status dropdown value and color
  const dropdown = li.querySelector('.task-status-select');
  if (dropdown) {
    dropdown.value = newStatus;
    // Reset the class to apply the correct color
    dropdown.className = 'task-status-select status-' + newStatus.toLowerCase();
  }

  // 3. Sync the checkbox and completed class
  const checkBtn = li.querySelector('.check-btn');

  if (newStatus === 'Done') {
    // Status is Done → check the checkbox and mark completed
    li.classList.add('completed');
    if (checkBtn) checkBtn.textContent = '✓';
  } else {
    // Status is NOT Done → uncheck the checkbox and remove completed
    li.classList.remove('completed');
    if (checkBtn) checkBtn.textContent = '';
  }

  // 4. Save to localStorage and update UI
  saveTasksToStorage();
  updateCounter();
  applyFilter();
}


// ========================================
// Create a Task Element
// ========================================

// Builds and returns an <li> element for a single task.
// Parameters:
//   text      — the task description
//   category  — e.g. "Work", "Personal"
//   priority  — e.g. "High", "Medium", "Low"
//   status    — e.g. "WIP", "Ongoing", "Hold", "Done"
//   date      — a date string like "2026-04-20", or an empty string if none
//   completed — boolean, true if the task was already marked done
function createTaskItem(text, category, priority, status, date, completed) {

  // Ensure status and completed are in sync for consistency
  // (Handles edge cases from older saved data)
  if (completed && status !== 'Done') {
    status = 'Done';
  }
  if (status === 'Done') {
    completed = true;
  }

  // Create the list item (<li>)
  const li = document.createElement('li');
  li.classList.add('task-item');

  // Store task data as data attributes (used for filtering and saving)
  li.dataset.text = text;
  li.dataset.category = category;
  li.dataset.priority = priority;
  li.dataset.status = status;     // Store status
  li.dataset.date = date;

  // Add a priority class for colour highlighting
  li.classList.add('priority-' + priority.toLowerCase());

  // Restore completed state if this task was already done
  if (completed) {
    li.classList.add('completed');
  }

  // --- Checkbox / Complete button ---
  const checkBtn = document.createElement('button');
  checkBtn.classList.add('check-btn');
  checkBtn.title = 'Mark as complete';

  // Show a tick if the task was already completed when restored
  if (completed) {
    checkBtn.textContent = '✓';
  }

  // CHECKBOX → STATUS SYNC
  // When clicked, toggle completed and sync the status accordingly
  checkBtn.addEventListener('click', function () {
    if (li.classList.contains('completed')) {
      // Currently completed → unchecking → revert status to "WIP"
      updateStatusLabel(li, 'WIP');
    } else {
      // Currently not completed → checking → set status to "Done"
      updateStatusLabel(li, 'Done');
    }
  });

  // --- Task Content (text + badges + date) ---
  const contentDiv = document.createElement('div');
  contentDiv.classList.add('task-content');

  // Task main text
  const span = document.createElement('span');
  span.classList.add('task-text');
  span.textContent = text;

  // Badges row (category + priority + status dropdown)
  const metaDiv = document.createElement('div');
  metaDiv.classList.add('task-meta');

  // Category badge
  const categoryBadge = document.createElement('span');
  categoryBadge.classList.add('badge', 'badge-' + category.toLowerCase());
  categoryBadge.textContent = category;

  // Priority badge
  const priorityBadge = document.createElement('span');
  priorityBadge.classList.add('badge', 'badge-' + priority.toLowerCase());
  priorityBadge.textContent = priority;

  // --- Inline Status Dropdown (replaces static badge) ---
  // This allows the user to change the status directly on the task
  const statusDropdown = document.createElement('select');
  statusDropdown.classList.add('task-status-select', 'status-' + status.toLowerCase());

  // Add the four status options
  const statusOptions = [
    { value: 'WIP', label: '🔶 WIP' },
    { value: 'Ongoing', label: '🔵 Ongoing' },
    { value: 'Hold', label: '⏸ Hold' },
    { value: 'Done', label: '✅ Done' }
  ];

  statusOptions.forEach(function (opt) {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    // Pre-select the current status
    if (opt.value === status) {
      option.selected = true;
    }
    statusDropdown.appendChild(option);
  });

  // STATUS DROPDOWN → CHECKBOX SYNC (reverse sync)
  // When the user changes the status dropdown, update checkbox accordingly
  statusDropdown.addEventListener('change', function () {
    updateStatusLabel(li, statusDropdown.value);
  });

  // Assemble the badges row
  metaDiv.appendChild(categoryBadge);
  metaDiv.appendChild(priorityBadge);
  metaDiv.appendChild(statusDropdown);   // Interactive dropdown instead of static badge

  // Date display (only shown if a date was chosen)
  if (date) {
    const dateSpan = document.createElement('span');
    dateSpan.classList.add('task-date');

    // Format the date in a friendly way, e.g. "📅 20 Apr 2026"
    const formatted = formatDate(date);
    dateSpan.textContent = '📅 ' + formatted;
    metaDiv.appendChild(dateSpan);
  }

  contentDiv.appendChild(span);
  contentDiv.appendChild(metaDiv);

  // --- Delete Button ---
  const deleteBtn = document.createElement('button');
  deleteBtn.classList.add('delete-btn');
  deleteBtn.textContent = '🗑';
  deleteBtn.title = 'Delete task';

  // When clicked, remove this task and update storage
  deleteBtn.addEventListener('click', function () {
    li.remove();
    saveTasksToStorage();   // Remove from localStorage too
    updateCounter();
  });

  // Put the pieces together inside the list item
  li.appendChild(checkBtn);
  li.appendChild(contentDiv);
  li.appendChild(deleteBtn);

  return li;
}


// ========================================
// Status Label Helper
// ========================================

// Returns a friendly display label for each status value
// (Used if you ever need the emoji + text label for a status)
function getStatusLabel(status) {
  switch (status) {
    case 'WIP': return '🔶 WIP';
    case 'Ongoing': return '🔵 Ongoing';
    case 'Hold': return '⏸ Hold';
    case 'Done': return '✅ Done';
    default: return status;
  }
}


// ========================================
// Date Formatter
// ========================================

// Converts "2026-04-20" → "20 Apr 2026"
function formatDate(dateStr) {
  if (!dateStr) return '';

  // Split the date string into parts
  const parts = dateStr.split('-');   // ["2026", "04", "20"]
  const year = parts[0];
  const month = parseInt(parts[1], 10) - 1;  // JS months are 0-indexed
  const day = parseInt(parts[2], 10);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return day + ' ' + months[month] + ' ' + year;
}


// ========================================
// Filter Tasks (by Category AND Status)
// ========================================

// Add click listeners to ALL filter buttons (both filter bars)
filterBtns.forEach(function (btn) {
  btn.addEventListener('click', function () {
    const filterType = btn.dataset.filterType;   // "category" or "status"
    const filterValue = btn.dataset.filter;       // e.g. "All", "Work", "WIP"

    if (filterType === 'category') {
      // Update category filter and highlight the correct button
      document.querySelectorAll('#category-filter-bar .filter-btn').forEach(function (b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');
      currentCategoryFilter = filterValue;

    } else if (filterType === 'status') {
      // Update status filter and highlight the correct button
      document.querySelectorAll('#status-filter-bar .filter-btn').forEach(function (b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');
      currentStatusFilter = filterValue;
    }

    // Re-apply the combined filter
    applyFilter();
  });
});

// Show or hide tasks based on BOTH active filters (category AND status)
function applyFilter() {
  const allTasks = taskList.querySelectorAll('.task-item');

  allTasks.forEach(function (task) {
    // Check if the task matches the category filter
    const matchesCategory =
      currentCategoryFilter === 'All' ||
      task.dataset.category === currentCategoryFilter;

    // Check if the task matches the status filter
    const matchesStatus =
      currentStatusFilter === 'All' ||
      task.dataset.status === currentStatusFilter;

    // Show the task only if it passes BOTH filters
    if (matchesCategory && matchesStatus) {
      task.style.display = '';      // Show the task
    } else {
      task.style.display = 'none';  // Hide the task
    }
  });

  updateCounter();
}


// ========================================
// Update the Task Counter
// ========================================

function updateCounter() {
  // Count only visible (not filtered-out) tasks
  const allTasks = taskList.querySelectorAll('.task-item');
  const visibleTasks = Array.from(allTasks).filter(function (t) {
    return t.style.display !== 'none';
  });
  const completedVisible = visibleTasks.filter(function (t) {
    return t.classList.contains('completed');
  });
  const remaining = visibleTasks.length - completedVisible.length;

  if (allTasks.length === 0) {
    // No tasks exist at all
    taskCounter.textContent = 'No tasks yet. Add one above!';
  } else if (visibleTasks.length === 0) {
    // Tasks exist but none match the current filter
    taskCounter.textContent = 'No tasks match the current filter.';
  } else {
    taskCounter.textContent =
      remaining + ' task' + (remaining !== 1 ? 's' : '') +
      ' remaining · ' + completedVisible.length + ' completed';
  }
}
