// =============================================
// TaskFlow — script.js
// Notion-inspired task productivity app
// Features:
//   • Add, edit (inline), delete tasks
//   • Category, Priority, Status, Due Date
//   • Search by keyword
//   • Sort by due date
//   • Overdue task highlighting
//   • Archive (completed tasks) section
//   • Filter by category (sidebar) and status (chips)
//   • All data saved to localStorage
// =============================================


// =============================================
// 1. ELEMENT REFERENCES
//    Get all the HTML elements we need to work with
// =============================================

const taskInput      = document.getElementById('task-input');       // Main text input
const addBtn         = document.getElementById('add-btn');          // "Add Task" button
const categorySelect = document.getElementById('category-select');  // Category dropdown
const prioritySelect = document.getElementById('priority-select');  // Priority dropdown
const statusSelect   = document.getElementById('status-select');    // Status dropdown
const dateInput      = document.getElementById('date-input');       // Due date picker
const taskList       = document.getElementById('task-list');        // Active tasks <ul>
const archiveList    = document.getElementById('archive-list');     // Archive <ul>
const archiveSection = document.getElementById('archive-section'); // Archive wrapper
const archiveToggle  = document.getElementById('archive-toggle');   // Click to expand/collapse
const archiveChevron = document.getElementById('archive-chevron'); // The ▾ icon
const taskCounter    = document.getElementById('task-counter');     // Counter text
const searchInput    = document.getElementById('search-input');     // Search box
const sortSelect     = document.getElementById('sort-select');      // Sort dropdown
const emptyState     = document.getElementById('empty-state');      // "No tasks" message

// All status filter chip buttons
const statusChips = document.querySelectorAll('#status-filter-bar .chip');

// All category nav items in the sidebar
const categoryNavItems = document.querySelectorAll('[data-filter-type="category"]');

// The main navigation buttons (All Tasks / Active / Archive)
const navAll     = document.getElementById('nav-all');
const navActive  = document.getElementById('nav-active');
const navArchive = document.getElementById('nav-archive');


// =============================================
// 2. STATE VARIABLES
//    Track what filters and view are currently active
// =============================================

let currentCategoryFilter = 'All';  // "All", "Work", "Learning", "Personal", "Hobby"
let currentStatusFilter   = 'All';  // "All", "WIP", "Ongoing", "Hold", "Done"
let currentNavView        = 'all';  // "all", "active", "archive"
let currentSort           = 'default'; // "default", "date-asc", "date-desc"
let isArchiveCollapsed    = false;  // Whether the archive section is folded up


// =============================================
// 3. LOCALSTORAGE HELPERS
//    Simple functions to read/write tasks to localStorage
// =============================================

// Key to use in localStorage
const STORAGE_KEY = 'taskFlowData';

/**
 * Load all saved tasks from localStorage.
 * Returns an array of task objects, or [] if nothing is saved yet.
 */
function loadTasksFromStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

/**
 * Collect every task currently in the DOM and save to localStorage.
 * Reads both the active list and the archive list.
 */
function saveTasksToStorage() {
  const allItems = [
    ...taskList.querySelectorAll('.task-item'),
    ...archiveList.querySelectorAll('.task-item')
  ];

  const tasksData = allItems.map(function (li) {
    return {
      text:      li.dataset.text,
      category:  li.dataset.category,
      priority:  li.dataset.priority,
      status:    li.dataset.status,
      date:      li.dataset.date,
      completed: li.classList.contains('completed')
    };
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksData));
}


// =============================================
// 4. PAGE LOAD — Restore Saved Tasks
// =============================================

window.addEventListener('load', function () {
  const savedTasks = loadTasksFromStorage();

  savedTasks.forEach(function (taskData) {
    // Rebuild the task element from stored data
    const taskItem = createTaskItem(
      taskData.text,
      taskData.category,
      taskData.priority,
      taskData.status || 'WIP', // Fallback for older saved data
      taskData.date,
      taskData.completed
    );

    // Completed tasks go directly into the archive list
    if (taskData.completed) {
      archiveList.appendChild(taskItem);
    } else {
      taskList.appendChild(taskItem);
    }
  });

  // Show or hide the archive section depending on whether it has items
  refreshArchiveVisibility();

  // Apply sorting, filters, and update the counter
  applySortAndFilter();
  updateCounter();
});


// =============================================
// 5. ADD TASK
// =============================================

// Click the button to add a task
addBtn.addEventListener('click', addTask);

// Press Enter in the text input to add a task
taskInput.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    addTask();
  }
});

/**
 * Reads the input fields, creates a new task, and appends it to the list.
 */
function addTask() {
  const taskText = taskInput.value.trim();

  // Don't add if the input is empty
  if (taskText === '') {
    taskInput.focus();
    return;
  }

  const category  = categorySelect.value;
  const priority  = prioritySelect.value;
  const status    = statusSelect.value;
  const date      = dateInput.value;           // "YYYY-MM-DD" or ""
  const completed = (status === 'Done');       // Auto-complete if status is "Done"

  // Build the task element
  const taskItem = createTaskItem(taskText, category, priority, status, date, completed);

  // Completed tasks go straight to the archive
  if (completed) {
    archiveList.appendChild(taskItem);
  } else {
    taskList.appendChild(taskItem);
  }

  // Persist and refresh the UI
  saveTasksToStorage();
  refreshArchiveVisibility();
  applySortAndFilter();
  updateCounter();

  // Reset inputs for next task
  taskInput.value = '';
  taskInput.focus();
}


// =============================================
// 6. CREATE TASK ITEM
//    Builds and returns a complete <li> task element
// =============================================

/**
 * Create an <li> element representing a single task.
 *
 * @param {string}  text      - The task description
 * @param {string}  category  - e.g. "Work", "Personal"
 * @param {string}  priority  - "High", "Medium", or "Low"
 * @param {string}  status    - "WIP", "Ongoing", "Hold", or "Done"
 * @param {string}  date      - Due date "YYYY-MM-DD", or ""
 * @param {boolean} completed - Whether the task is marked done
 */
function createTaskItem(text, category, priority, status, date, completed) {

  // Keep status and completed in sync (handles edge cases in old saved data)
  if (completed && status !== 'Done') status = 'Done';
  if (status === 'Done') completed = true;

  // ---- Create the <li> ----
  const li = document.createElement('li');
  li.classList.add('task-item');

  // Store data as attributes (used for filtering, sorting, and saving)
  li.dataset.text     = text;
  li.dataset.category = category;
  li.dataset.priority = priority;
  li.dataset.status   = status;
  li.dataset.date     = date;

  // Apply priority colour class (e.g. "priority-high")
  li.classList.add('priority-' + priority.toLowerCase());

  // Mark as completed if needed
  if (completed) li.classList.add('completed');

  // Mark as overdue if the due date is in the past (and not already done)
  if (date && !completed && isOverdue(date)) {
    li.classList.add('overdue');
  }


  // ---- CHECKBOX BUTTON ----
  const checkBtn = document.createElement('button');
  checkBtn.classList.add('check-btn');
  checkBtn.title = 'Toggle complete';
  if (completed) checkBtn.textContent = '✓';

  // Clicking the checkbox toggles the task's completion
  checkBtn.addEventListener('click', function () {
    const isDone = li.classList.contains('completed');
    updateStatusLabel(li, isDone ? 'WIP' : 'Done');
  });


  // ---- TASK CONTENT DIV ----
  const contentDiv = document.createElement('div');
  contentDiv.classList.add('task-content');


  // ---- EDITABLE TASK TEXT ----
  // The user can click it to edit inline, then press Enter or click away to save.
  const span = document.createElement('span');
  span.classList.add('task-text');
  span.textContent = text;
  span.title = 'Click to edit';

  // Start editing when the user clicks the text
  span.addEventListener('click', function () {
    startEditing(span, li);
  });


  // ---- BADGES ROW ----
  const metaDiv = document.createElement('div');
  metaDiv.classList.add('task-meta');

  // Category badge (e.g. "Work")
  const categoryBadge = document.createElement('span');
  categoryBadge.classList.add('badge', 'badge-' + category.toLowerCase());
  categoryBadge.textContent = category;

  // Priority badge (e.g. "High")
  const priorityBadge = document.createElement('span');
  priorityBadge.classList.add('badge', 'badge-' + priority.toLowerCase());
  priorityBadge.textContent = priority;

  // Inline status dropdown (lets the user change status on the task itself)
  const statusDropdown = document.createElement('select');
  statusDropdown.classList.add('task-status-select', 'status-' + status.toLowerCase());

  // Add each status option
  [
    { value: 'WIP',     label: '🔶 WIP'     },
    { value: 'Ongoing', label: '🔵 Ongoing'  },
    { value: 'Hold',    label: '⏸ Hold'     },
    { value: 'Done',    label: '✅ Done'     }
  ].forEach(function (opt) {
    const option = document.createElement('option');
    option.value       = opt.value;
    option.textContent = opt.label;
    if (opt.value === status) option.selected = true;
    statusDropdown.appendChild(option);
  });

  // When the dropdown changes, sync the rest of the task UI
  statusDropdown.addEventListener('change', function () {
    updateStatusLabel(li, statusDropdown.value);
  });

  // ---- DUE DATE DISPLAY ----
  if (date) {
    const dateSpan = document.createElement('span');
    dateSpan.classList.add('task-date');

    const overdue = !completed && isOverdue(date);
    if (overdue) dateSpan.classList.add('overdue-date');

    // Friendly format: "📅 20 Apr 2026"
    dateSpan.textContent = '📅 ' + formatDate(date);

    // Add a small "Overdue" pill if past due
    if (overdue) {
      const overdueTag = document.createElement('span');
      overdueTag.classList.add('overdue-badge');
      overdueTag.textContent = 'Overdue';
      metaDiv.appendChild(dateSpan);
      metaDiv.appendChild(overdueTag);
    } else {
      metaDiv.appendChild(dateSpan);
    }
  }

  // Assemble the badges row
  metaDiv.prepend(statusDropdown);  // Status dropdown first
  metaDiv.prepend(priorityBadge);   // Then priority
  metaDiv.prepend(categoryBadge);   // Then category (leftmost)


  // ---- DELETE BUTTON ----
  const deleteBtn = document.createElement('button');
  deleteBtn.classList.add('delete-btn');
  deleteBtn.textContent = '🗑';
  deleteBtn.title = 'Delete task';

  deleteBtn.addEventListener('click', function () {
    li.remove();
    saveTasksToStorage();
    refreshArchiveVisibility();
    updateCounter();
  });


  // ---- ASSEMBLE EVERYTHING ----
  contentDiv.appendChild(span);
  contentDiv.appendChild(metaDiv);

  li.appendChild(checkBtn);
  li.appendChild(contentDiv);
  li.appendChild(deleteBtn);

  return li;
}


// =============================================
// 7. INLINE EDITING
//    Let the user click task text to edit it in place
// =============================================

/**
 * Turn the task text span into an editable contenteditable field.
 * Pressing Enter or clicking outside saves the edit.
 *
 * @param {HTMLElement} span - The .task-text element to edit
 * @param {HTMLElement} li   - The parent .task-item <li>
 */
function startEditing(span, li) {
  // Don't open two edit sessions at once
  if (span.classList.contains('editing')) return;

  // Add the "editing" CSS class for visual feedback
  span.classList.add('editing');

  // Make the span focusable and editable
  span.setAttribute('contenteditable', 'true');
  span.focus();

  // Move the cursor to the end of the text
  const range = document.createRange();
  const sel   = window.getSelection();
  range.selectNodeContents(span);
  range.collapse(false);  // false = end
  sel.removeAllRanges();
  sel.addRange(range);

  // ---- Save on Enter key ----
  span.addEventListener('keydown', function handleKey(e) {
    if (e.key === 'Enter') {
      e.preventDefault();   // Don't insert a newline character
      span.blur();           // Trigger the blur/save handler
    }
  }, { once: true });

  // ---- Save on click away (blur) ----
  span.addEventListener('blur', function saveEdit() {
    const newText = span.textContent.trim();

    // If text was cleared, revert to the original value
    if (newText === '') {
      span.textContent = li.dataset.text;
    } else {
      // Update both the display and the stored data attribute
      span.textContent  = newText;
      li.dataset.text   = newText;
    }

    // Exit editing mode
    span.removeAttribute('contenteditable');
    span.classList.remove('editing');

    // Persist the change
    saveTasksToStorage();
  }, { once: true });
}


// =============================================
// 8. UPDATE STATUS (Checkbox ↔ Status Dropdown Sync)
//    The single source of truth for changing a task's status
// =============================================

/**
 * Update a task's status everywhere: data attribute, dropdown colour,
 * checkbox tick, completed class, overdue class, archive placement.
 *
 * @param {HTMLElement} li        - The .task-item <li>
 * @param {string}      newStatus - "WIP", "Ongoing", "Hold", or "Done"
 */
function updateStatusLabel(li, newStatus) {
  // 1. Update the data attribute
  li.dataset.status = newStatus;

  // 2. Update the inline dropdown colour class
  const dropdown = li.querySelector('.task-status-select');
  if (dropdown) {
    dropdown.value     = newStatus;
    dropdown.className = 'task-status-select status-' + newStatus.toLowerCase();
  }

  // 3. Sync the checkbox and completed/overdue classes
  const checkBtn = li.querySelector('.check-btn');
  const date     = li.dataset.date;

  if (newStatus === 'Done') {
    // Mark as done
    li.classList.add('completed');
    li.classList.remove('overdue');   // Done tasks are no longer "overdue"
    if (checkBtn) checkBtn.textContent = '✓';

    // Move from active list → archive list
    archiveList.appendChild(li);

  } else {
    // Unmark as done
    li.classList.remove('completed');
    if (checkBtn) checkBtn.textContent = '';

    // Re-apply overdue highlighting if applicable
    if (date && isOverdue(date)) {
      li.classList.add('overdue');
    } else {
      li.classList.remove('overdue');
    }

    // Move back from archive list → active list
    taskList.appendChild(li);
  }

  // 4. Persist and refresh
  saveTasksToStorage();
  refreshArchiveVisibility();
  applySortAndFilter();
  updateCounter();
}


// =============================================
// 9. SEARCH — Live keyword filtering
// =============================================

// Re-filter whenever the user types in the search box
searchInput.addEventListener('input', function () {
  applySortAndFilter();
  updateCounter();
});


// =============================================
// 10. SORT TASKS BY DUE DATE
// =============================================

// Re-sort whenever the user changes the sort dropdown
sortSelect.addEventListener('change', function () {
  currentSort = sortSelect.value;
  applySortAndFilter();
});

/**
 * Sort the active task list by due date.
 * Tasks without a due date are sorted to the end.
 *
 * @param {string} direction - "date-asc" or "date-desc"
 */
function sortTasks(direction) {
  const items = Array.from(taskList.querySelectorAll('.task-item'));

  items.sort(function (a, b) {
    const dateA = a.dataset.date;
    const dateB = b.dataset.date;

    // No date → push to bottom
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;

    const diff = new Date(dateA) - new Date(dateB);
    return direction === 'date-asc' ? diff : -diff;
  });

  // Re-append tasks in sorted order
  items.forEach(function (item) {
    taskList.appendChild(item);
  });
}


// =============================================
// 11. APPLY SORT + FILTER + SEARCH
//    The master function that runs whenever anything changes.
//    It handles: sorting, search text, category filter, status filter,
//    and the current nav view (all / active / archive).
// =============================================

function applySortAndFilter() {
  const query = searchInput.value.trim().toLowerCase();

  // Sort first (only affects the active list)
  if (currentSort !== 'default') {
    sortTasks(currentSort);
  }

  // Now filter every task item in the active list
  const activeTasks = taskList.querySelectorAll('.task-item');
  let visibleActiveCount = 0;

  activeTasks.forEach(function (task) {
    const matchesCategory = (currentCategoryFilter === 'All') || (task.dataset.category === currentCategoryFilter);
    const matchesStatus   = (currentStatusFilter   === 'All') || (task.dataset.status   === currentStatusFilter);
    const matchesSearch   = (query === '') || task.dataset.text.toLowerCase().includes(query);

    // Show/hide based on all three conditions
    if (matchesCategory && matchesStatus && matchesSearch) {
      task.style.display = '';
      visibleActiveCount++;
    } else {
      task.style.display = 'none';
    }
  });

  // Show the empty state message if no active tasks are visible
  if (emptyState) {
    emptyState.style.display = visibleActiveCount === 0 ? 'flex' : 'none';
  }

  updateCounter();
}


// =============================================
// 12. STATUS FILTER CHIPS
// =============================================

statusChips.forEach(function (chip) {
  chip.addEventListener('click', function () {
    // Highlight only the clicked chip
    statusChips.forEach(function (c) { c.classList.remove('active'); });
    chip.classList.add('active');

    currentStatusFilter = chip.dataset.filter;  // e.g. "WIP", "All"
    applySortAndFilter();
  });
});


// =============================================
// 13. CATEGORY FILTER — Sidebar nav items
// =============================================

categoryNavItems.forEach(function (item) {
  item.addEventListener('click', function () {
    // Remove "active" from all category nav items
    categoryNavItems.forEach(function (n) { n.classList.remove('active'); });
    item.classList.add('active');

    currentCategoryFilter = item.dataset.filter;  // e.g. "Work"
    applySortAndFilter();
  });
});


// =============================================
// 14. MAIN NAV (All / Active / Archive)
//    Controls which sections are visible
// =============================================

/** Switch the active main nav button */
function setActiveNav(btn) {
  [navAll, navActive, navArchive].forEach(function (n) {
    if (n) n.classList.remove('active');
  });
  if (btn) btn.classList.add('active');
}

// "All Tasks" — show both active list and archive
if (navAll) {
  navAll.addEventListener('click', function () {
    currentNavView = 'all';
    setActiveNav(navAll);
    document.getElementById('active-section').style.display = '';
    refreshArchiveVisibility();
  });
}

// "Active" — show only the active list
if (navActive) {
  navActive.addEventListener('click', function () {
    currentNavView = 'active';
    setActiveNav(navActive);
    document.getElementById('active-section').style.display = '';
    archiveSection.style.display = 'none';
  });
}

// "Archive" — show only the archive list
if (navArchive) {
  navArchive.addEventListener('click', function () {
    currentNavView = 'archive';
    setActiveNav(navArchive);
    document.getElementById('active-section').style.display = 'none';
    archiveSection.style.display = '';
  });
}


// =============================================
// 15. ARCHIVE COLLAPSE / EXPAND
// =============================================

archiveToggle.addEventListener('click', function () {
  isArchiveCollapsed = !isArchiveCollapsed;

  // Toggle the chevron rotation
  archiveChevron.classList.toggle('collapsed', isArchiveCollapsed);

  // Show or hide the archive list
  archiveList.style.display = isArchiveCollapsed ? 'none' : '';
});

/**
 * Show or hide the entire archive section based on
 * whether there are any completed tasks and the current nav view.
 */
function refreshArchiveVisibility() {
  const hasArchiveTasks = archiveList.querySelectorAll('.task-item').length > 0;

  // Only show archive if we're in "all" or "archive" view and there are tasks
  if (hasArchiveTasks && currentNavView !== 'active') {
    archiveSection.style.display = '';
  } else {
    archiveSection.style.display = 'none';
  }
}


// =============================================
// 16. TASK COUNTER
//    Shows how many active / completed tasks are visible
// =============================================

function updateCounter() {
  const allActive    = taskList.querySelectorAll('.task-item');
  const allArchive   = archiveList.querySelectorAll('.task-item');
  const visibleAct   = Array.from(allActive).filter(t => t.style.display !== 'none');
  const totalTasks   = allActive.length + allArchive.length;

  if (totalTasks === 0) {
    taskCounter.textContent = 'No tasks yet. Add one above!';
  } else if (visibleAct.length === 0) {
    taskCounter.textContent = 'No tasks match the current filter.';
  } else {
    taskCounter.textContent =
      visibleAct.length + ' active task' + (visibleAct.length !== 1 ? 's' : '') +
      ' · ' + allArchive.length + ' completed';
  }
}


// =============================================
// 17. HELPER — Overdue Check
//    Returns true if a date string is before today
// =============================================

/**
 * Returns true if the provided date string ("YYYY-MM-DD") is in the past.
 * Today's date is NOT considered overdue.
 */
function isOverdue(dateStr) {
  if (!dateStr) return false;

  // Compare date strings directly (YYYY-MM-DD sorts lexicographically)
  const today = new Date();
  const todayStr = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');

  return dateStr < todayStr;
}


// =============================================
// 18. HELPER — Date Formatter
//    Converts "2026-04-20" → "20 Apr 2026"
// =============================================

function formatDate(dateStr) {
  if (!dateStr) return '';

  const parts = dateStr.split('-');                    // ["2026", "04", "20"]
  const year  = parts[0];
  const month = parseInt(parts[1], 10) - 1;           // JS months are 0-indexed
  const day   = parseInt(parts[2], 10);

  const months = ['Jan','Feb','Mar','Apr','May','Jun',
                  'Jul','Aug','Sep','Oct','Nov','Dec'];

  return day + ' ' + months[month] + ' ' + year;      // "20 Apr 2026"
}


// =============================================
// 19. HELPER — Status Labels
//    Returns the emoji + text label for a status
// =============================================

function getStatusLabel(status) {
  switch (status) {
    case 'WIP':     return '🔶 WIP';
    case 'Ongoing': return '🔵 Ongoing';
    case 'Hold':    return '⏸ Hold';
    case 'Done':    return '✅ Done';
    default:        return status;
  }
}
