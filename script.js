// ========================================
// Get references to the HTML elements 
// ========================================
const taskInput      = document.getElementById('task-input');       // The text input
const addBtn         = document.getElementById('add-btn');           // The "Add" button
const categorySelect = document.getElementById('category-select');   // Category dropdown
const prioritySelect = document.getElementById('priority-select');   // Priority dropdown
const dateInput      = document.getElementById('date-input');        // The date picker
const taskList       = document.getElementById('task-list');         // The <ul> list
const taskCounter    = document.getElementById('task-counter');      // The counter text
const filterBtns     = document.querySelectorAll('.filter-btn');     // All filter buttons

// Keep track of the currently active filter
let currentFilter = 'All';


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
      text:      li.dataset.text,
      category:  li.dataset.category,
      priority:  li.dataset.priority,
      date:      li.dataset.date,
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
    const taskItem = createTaskItem(
      taskData.text,
      taskData.category,
      taskData.priority,
      taskData.date,
      taskData.completed   // pass the saved completed state
    );
    taskList.appendChild(taskItem);
  });

  // Apply the current filter and update the counter after restoring
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

  // Read the selected category, priority, and date
  const category = categorySelect.value;
  const priority = prioritySelect.value;
  const date     = dateInput.value;       // e.g. "2026-04-20" or ""

  // Create the task element and add it to the list
  const taskItem = createTaskItem(taskText, category, priority, date, false);
  taskList.appendChild(taskItem);

  // Save to localStorage so the task persists after refresh
  saveTasksToStorage();

  // Clear the input box and focus it, ready for the next task
  taskInput.value = '';
  taskInput.focus();

  // Apply the current filter (hide the task if it doesn't match)
  applyFilter();

  // Update the counter
  updateCounter();
}


// ========================================
// Create a Task Element
// ========================================

// Builds and returns an <li> element for a single task.
// Parameters:
//   text      — the task description
//   category  — e.g. "Work", "Personal"
//   priority  — e.g. "High", "Medium", "Low"
//   date      — a date string like "2026-04-20", or an empty string if none
//   completed — boolean, true if the task was already marked done
function createTaskItem(text, category, priority, date, completed) {
  // Create the list item (<li>)
  const li = document.createElement('li');
  li.classList.add('task-item');

  // Store task data as data attributes (used for filtering and saving)
  li.dataset.text     = text;
  li.dataset.category = category;
  li.dataset.priority = priority;
  li.dataset.date     = date;

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

  // When clicked, toggle the "completed" style and save
  checkBtn.addEventListener('click', function () {
    li.classList.toggle('completed');

    // Show a tick icon when completed, empty when not
    if (li.classList.contains('completed')) {
      checkBtn.textContent = '✓';
    } else {
      checkBtn.textContent = '';
    }

    // Persist the updated completed state
    saveTasksToStorage();
    updateCounter();
  });

  // --- Task Content (text + badges + date) ---
  const contentDiv = document.createElement('div');
  contentDiv.classList.add('task-content');

  // Task main text
  const span = document.createElement('span');
  span.classList.add('task-text');
  span.textContent = text;

  // Badges row (category + priority)
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

  metaDiv.appendChild(categoryBadge);
  metaDiv.appendChild(priorityBadge);

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
// Date Formatter
// ========================================

// Converts "2026-04-20" → "20 Apr 2026"
function formatDate(dateStr) {
  if (!dateStr) return '';

  // Split the date string into parts
  const parts = dateStr.split('-');   // ["2026", "04", "20"]
  const year  = parts[0];
  const month = parseInt(parts[1], 10) - 1;  // JS months are 0-indexed
  const day   = parseInt(parts[2], 10);

  const months = ['Jan','Feb','Mar','Apr','May','Jun',
                  'Jul','Aug','Sep','Oct','Nov','Dec'];

  return day + ' ' + months[month] + ' ' + year;
}


// ========================================
// Filter Tasks by Category
// ========================================

// Add click listeners to each filter button
filterBtns.forEach(function (btn) {
  btn.addEventListener('click', function () {
    // Remove "active" style from all buttons
    filterBtns.forEach(function (b) {
      b.classList.remove('active');
    });

    // Mark the clicked button as active
    btn.classList.add('active');

    // Update the current filter and apply it
    currentFilter = btn.dataset.filter;
    applyFilter();
  });
});

// Show or hide tasks based on the current filter
function applyFilter() {
  const allTasks = taskList.querySelectorAll('.task-item');

  allTasks.forEach(function (task) {
    if (currentFilter === 'All' || task.dataset.category === currentFilter) {
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
    taskCounter.textContent = 'No tasks yet. Add one above!';
  } else if (visibleTasks.length === 0) {
    taskCounter.textContent = 'No tasks in this category.';
  } else {
    taskCounter.textContent =
      remaining + ' task' + (remaining !== 1 ? 's' : '') +
      ' remaining · ' + completedVisible.length + ' completed';
  }
}
