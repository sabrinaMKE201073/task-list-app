// ========================================
// Get references to the HTML elements
// ========================================
const taskInput = document.getElementById('task-input');         // The text input
const addBtn = document.getElementById('add-btn');               // The "Add" button
const categorySelect = document.getElementById('category-select'); // Category dropdown
const prioritySelect = document.getElementById('priority-select'); // Priority dropdown
const taskList = document.getElementById('task-list');           // The <ul> list
const taskCounter = document.getElementById('task-counter');     // The counter text
const filterBtns = document.querySelectorAll('.filter-btn');     // All filter buttons

// Keep track of the currently active filter
let currentFilter = 'All';


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

  // Read the selected category and priority
  const category = categorySelect.value;
  const priority = prioritySelect.value;

  // Create the task element and add it to the list
  const taskItem = createTaskItem(taskText, category, priority);
  taskList.appendChild(taskItem);

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

function createTaskItem(text, category, priority) {
  // Create the list item (<li>)
  const li = document.createElement('li');
  li.classList.add('task-item');

  // Store category and priority as data attributes for filtering
  li.dataset.category = category;
  li.dataset.priority = priority;

  // Add a priority class for visual highlighting
  li.classList.add('priority-' + priority.toLowerCase());

  // --- Checkbox / Complete button ---
  const checkBtn = document.createElement('button');
  checkBtn.classList.add('check-btn');
  checkBtn.title = 'Mark as complete';

  // When clicked, toggle the "completed" style
  checkBtn.addEventListener('click', function () {
    li.classList.toggle('completed');

    // Show a tick icon when completed, empty when not
    if (li.classList.contains('completed')) {
      checkBtn.textContent = '✓';
    } else {
      checkBtn.textContent = '';
    }

    updateCounter();
  });

  // --- Task Content (text + badges) ---
  const contentDiv = document.createElement('div');
  contentDiv.classList.add('task-content');

  // Task text
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

  contentDiv.appendChild(span);
  contentDiv.appendChild(metaDiv);

  // --- Delete Button ---
  const deleteBtn = document.createElement('button');
  deleteBtn.classList.add('delete-btn');
  deleteBtn.textContent = '🗑';
  deleteBtn.title = 'Delete task';

  // When clicked, remove this task from the list
  deleteBtn.addEventListener('click', function () {
    li.remove();
    updateCounter();
  });

  // Put the pieces together inside the list item
  li.appendChild(checkBtn);
  li.appendChild(contentDiv);
  li.appendChild(deleteBtn);

  return li;
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
