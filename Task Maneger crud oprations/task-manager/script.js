/**
 * ==============================================================================
 * Task Manager Web Application
 * Junior Web Development Internship Project
 * 
 * Features:
 * - CRUD operations (Create, Read, Update, Delete)
 * - Completion toggle with visual feedback
 * - LocalStorage persistence
 * - Status filters (All, Active, Completed)
 * - Real-time case-insensitive search
 * - Overdue task indicator
 * - Safe DOM manipulation (XSS prevention)
 * - HTML5 Drag-and-drop reordering
 * ==============================================================================
 */

// ------------------------------------------------------------------------------
// 1. Application State & Storage Key
// ------------------------------------------------------------------------------
const STORAGE_KEY = 'taskManagerTasks';

// In-memory array of task objects
let tasks = [];

// Current filter state: 'all' | 'active' | 'completed'
let currentFilter = 'all';

// Current search term query
let searchQuery = '';

// Track the ID of the task currently being edited (null if creating a new task)
let editingTaskId = null;

// Track the task being dragged for reordering
let draggedTaskId = null;

// ------------------------------------------------------------------------------
// 2. DOM Element Selectors
// ------------------------------------------------------------------------------
const taskForm = document.getElementById('task-form');
const taskTitleInput = document.getElementById('task-title-input');
const taskCategorySelect = document.getElementById('task-category-select');
const taskDueDateInput = document.getElementById('task-due-date-input');
const taskSubmitBtn = document.getElementById('task-submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const formErrorMsg = document.getElementById('form-error-msg');

const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const filterButtons = document.querySelectorAll('.filter-btn');

const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');

const totalTasksCount = document.getElementById('total-tasks-count');
const activeTasksCount = document.getElementById('active-tasks-count');
const completedTasksCount = document.getElementById('completed-tasks-count');

// ------------------------------------------------------------------------------
// 3. LocalStorage Helper Functions
// ------------------------------------------------------------------------------

/**
 * Saves the current tasks array to browser localStorage.
 */
function saveToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to save tasks to localStorage:', error);
  }
}

/**
 * Loads tasks from browser localStorage.
 * Handles missing or invalid JSON data safely.
 */
function loadFromLocalStorage() {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      // Ensure the parsed data is indeed an array
      if (Array.isArray(parsedData)) {
        tasks = parsedData;
      } else {
        tasks = [];
      }
    } else {
      tasks = [];
    }
  } catch (error) {
    console.error('Failed to read or parse localStorage data:', error);
    tasks = [];
  }
}

// ------------------------------------------------------------------------------
// 4. Task Management Functions (CRUD)
// ------------------------------------------------------------------------------

/**
 * Adds a new task or updates an existing task in edit mode.
 * Reads form inputs, validates task title, and handles persistence.
 */
function addTask() {
  const title = taskTitleInput.value.trim();
  const category = taskCategorySelect.value;
  const dueDate = taskDueDateInput.value;

  // Validation: Check if the title is empty
  if (!title) {
    showValidationError(true);
    taskTitleInput.focus();
    return;
  }

  showValidationError(false);

  if (editingTaskId !== null) {
    // EDIT MODE: Update existing task
    const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
    if (taskIndex !== -1) {
      tasks[taskIndex].title = title;
      tasks[taskIndex].category = category;
      tasks[taskIndex].dueDate = dueDate;
    }
    resetForm();
  } else {
    // CREATE MODE: Add new task
    const newTask = {
      id: Date.now().toString(), // Unique timestamp ID
      title: title,
      category: category,
      dueDate: dueDate,
      completed: false
    };

    // Prepend to beginning of the list
    tasks.unshift(newTask);
    resetForm();
  }

  saveToLocalStorage();
  updateTaskSummary();
  renderTasks();
}

/**
 * Prepares the form to edit an existing task.
 * @param {string} id - The unique ID of the task to edit.
 */
function editTask(id) {
  const taskToEdit = tasks.find(t => t.id === id);
  if (!taskToEdit) return;

  editingTaskId = id;

  // Populate form with existing task data
  taskTitleInput.value = taskToEdit.title;
  taskCategorySelect.value = taskToEdit.category;
  taskDueDateInput.value = taskToEdit.dueDate || '';

  // Update form UI to show edit state
  taskSubmitBtn.textContent = 'Update Task';
  cancelEditBtn.classList.remove('hidden');
  showValidationError(false);

  // Focus the input field and scroll into view smoothly
  taskTitleInput.focus();
  taskForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Deletes a task from the list after user confirmation.
 * @param {string} id - The unique ID of the task to delete.
 */
function deleteTask(id) {
  const taskToDelete = tasks.find(t => t.id === id);
  if (!taskToDelete) return;

  const confirmed = window.confirm(`Are you sure you want to delete "${taskToDelete.title}"?`);
  if (!confirmed) return;

  // Remove task from array
  tasks = tasks.filter(t => t.id !== id);

  // If the deleted task was currently being edited, cancel edit mode
  if (editingTaskId === id) {
    resetForm();
  }

  saveToLocalStorage();
  updateTaskSummary();
  renderTasks();
}

/**
 * Toggles a task's completed status between true and false.
 * @param {string} id - The unique ID of the task.
 */
function toggleTaskStatus(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  task.completed = !task.completed;

  saveToLocalStorage();
  updateTaskSummary();
  renderTasks();
}

// ------------------------------------------------------------------------------
// 5. Filtering, Searching, & Stats
// ------------------------------------------------------------------------------

/**
 * Updates the current filter and re-renders tasks.
 * @param {string} filter - 'all' | 'active' | 'completed'
 */
function filterTasks(filter) {
  currentFilter = filter;

  // Update active class on filter buttons
  filterButtons.forEach(btn => {
    if (btn.getAttribute('data-filter') === filter) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  renderTasks();
}

/**
 * Calculates and updates the three task statistics:
 * Total Tasks, Active Tasks, and Completed Tasks.
 */
function updateTaskSummary() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const active = total - completed;

  totalTasksCount.textContent = total;
  activeTasksCount.textContent = active;
  completedTasksCount.textContent = completed;
}

/**
 * Checks whether a task is overdue.
 * A task is overdue if it has a due date, is not completed,
 * and the due date is strictly before today's date.
 * @param {Object} task
 * @returns {boolean}
 */
function isTaskOverdue(task) {
  if (!task.dueDate || task.completed) return false;

  // Get local date formatted as YYYY-MM-DD
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayString = `${year}-${month}-${day}`;

  return task.dueDate < todayString;
}

/**
 * Formats a YYYY-MM-DD date string into a user-friendly format (e.g. "Oct 30, 2026").
 * @param {string} dateString 
 * @returns {string}
 */
function formatDate(dateString) {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;

  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  return dateObj.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// ------------------------------------------------------------------------------
// 6. DOM Rendering Functions
// ------------------------------------------------------------------------------

/**
 * Renders the task list according to active filter and search query.
 * Uses safe DOM manipulation methods (e.g., textContent) to prevent XSS.
 */
function renderTasks() {
  // Clear current list content safely
  taskList.innerHTML = '';

  // Apply status filter
  let filtered = tasks.filter(task => {
    if (currentFilter === 'active') return !task.completed;
    if (currentFilter === 'completed') return task.completed;
    return true; // 'all'
  });

  // Apply search query (case-insensitive)
  if (searchQuery.trim() !== '') {
    const query = searchQuery.trim().toLowerCase();
    filtered = filtered.filter(task => task.title.toLowerCase().includes(query));
  }

  // Handle Empty State
  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
  }

  // Build each task DOM element
  filtered.forEach(task => {
    const li = createTaskElement(task);
    taskList.appendChild(li);
  });
}

/**
 * Creates and returns the DOM element for a single task.
 * Adheres strictly to safe DOM manipulation (using textContent for user strings).
 * @param {Object} task 
 * @returns {HTMLLIElement}
 */
function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = 'task-item';
  li.setAttribute('data-id', task.id);
  li.setAttribute('draggable', 'true');

  const overdue = isTaskOverdue(task);

  if (task.completed) {
    li.classList.add('task-item--completed');
  }
  if (overdue) {
    li.classList.add('task-item--overdue');
  }

  // --- Left container (Checkbox + Text/Meta) ---
  const taskLeft = document.createElement('div');
  taskLeft.className = 'task-left';

  // Checkbox
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked = task.completed;
  checkbox.setAttribute('aria-label', `Mark "${task.title}" as ${task.completed ? 'active' : 'completed'}`);
  checkbox.addEventListener('change', () => toggleTaskStatus(task.id));

  // Content block
  const taskContent = document.createElement('div');
  taskContent.className = 'task-content';

  // Task title (Safe textContent)
  const titleSpan = document.createElement('span');
  titleSpan.className = 'task-title';
  titleSpan.textContent = task.title;

  // Metadata row
  const metaDiv = document.createElement('div');
  metaDiv.className = 'task-meta';

  // Category badge
  const categoryBadge = document.createElement('span');
  categoryBadge.className = `badge badge-${task.category.toLowerCase()}`;
  categoryBadge.textContent = task.category;
  metaDiv.appendChild(categoryBadge);

  // Due Date (if provided)
  if (task.dueDate) {
    const dueDateSpan = document.createElement('span');
    dueDateSpan.className = 'task-due-date';
    dueDateSpan.textContent = `Due: ${formatDate(task.dueDate)}`;
    metaDiv.appendChild(dueDateSpan);
  }

  // Overdue badge (if overdue and not completed)
  if (overdue) {
    const overdueBadge = document.createElement('span');
    overdueBadge.className = 'badge-overdue';
    overdueBadge.textContent = 'Overdue';
    metaDiv.appendChild(overdueBadge);
  }

  taskContent.appendChild(titleSpan);
  taskContent.appendChild(metaDiv);

  taskLeft.appendChild(checkbox);
  taskLeft.appendChild(taskContent);

  // --- Right container (Action buttons: Edit & Delete) ---
  const taskActions = document.createElement('div');
  taskActions.className = 'task-actions';

  // Edit Button
  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'btn-icon btn-edit';
  editBtn.textContent = 'Edit';
  editBtn.setAttribute('aria-label', `Edit task: ${task.title}`);
  editBtn.addEventListener('click', () => editTask(task.id));

  // Delete Button
  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'btn-icon btn-delete';
  deleteBtn.textContent = 'Delete';
  deleteBtn.setAttribute('aria-label', `Delete task: ${task.title}`);
  deleteBtn.addEventListener('click', () => deleteTask(task.id));

  taskActions.appendChild(editBtn);
  taskActions.appendChild(deleteBtn);

  // Assemble the item
  li.appendChild(taskLeft);
  li.appendChild(taskActions);

  // Attach Drag & Drop Events
  setupDragAndDrop(li, task.id);

  return li;
}

// ------------------------------------------------------------------------------
// 7. Drag-and-Drop Reordering (Optional Enhancement)
// ------------------------------------------------------------------------------

/**
 * Attaches native HTML5 Drag and Drop event listeners to a task element.
 * @param {HTMLElement} itemElement 
 * @param {string} id 
 */
function setupDragAndDrop(itemElement, id) {
  // When drag starts
  itemElement.addEventListener('dragstart', (e) => {
    draggedTaskId = id;
    itemElement.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  });

  // When drag ends
  itemElement.addEventListener('dragend', () => {
    draggedTaskId = null;
    itemElement.classList.remove('dragging');
    document.querySelectorAll('.task-item').forEach(el => {
      el.classList.remove('drag-over');
    });
  });

  // When dragged item hovers over another item
  itemElement.addEventListener('dragover', (e) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
    if (draggedTaskId && draggedTaskId !== id) {
      itemElement.classList.add('drag-over');
    }
  });

  itemElement.addEventListener('dragleave', () => {
    itemElement.classList.remove('drag-over');
  });

  // When dropped onto this item
  itemElement.addEventListener('drop', (e) => {
    e.preventDefault();
    itemElement.classList.remove('drag-over');

    if (!draggedTaskId || draggedTaskId === id) return;

    // Reorder in the tasks array
    const draggedIndex = tasks.findIndex(t => t.id === draggedTaskId);
    const targetIndex = tasks.findIndex(t => t.id === id);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Remove from previous index and insert at target index
      const [movedTask] = tasks.splice(draggedIndex, 1);
      tasks.splice(targetIndex, 0, movedTask);

      saveToLocalStorage();
      renderTasks();
    }
  });
}

// ------------------------------------------------------------------------------
// 8. Helper & Reset Functions
// ------------------------------------------------------------------------------

/**
 * Resets the task form back to default "Add Task" state.
 */
function resetForm() {
  editingTaskId = null;
  taskTitleInput.value = '';
  taskCategorySelect.value = 'Work';
  taskDueDateInput.value = '';
  taskSubmitBtn.textContent = 'Add Task';
  cancelEditBtn.classList.add('hidden');
  showValidationError(false);
}

/**
 * Displays or hides the form validation error message.
 * @param {boolean} show 
 */
function showValidationError(show) {
  if (show) {
    formErrorMsg.classList.remove('hidden');
    taskTitleInput.classList.add('input-error');
  } else {
    formErrorMsg.classList.add('hidden');
    taskTitleInput.classList.remove('input-error');
  }
}

// ------------------------------------------------------------------------------
// 9. Event Listeners & Initialization
// ------------------------------------------------------------------------------

// Form submission (Add or Update)
taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addTask();
});

// Cancel edit button
cancelEditBtn.addEventListener('click', () => {
  resetForm();
});

// Clear validation error on typing
taskTitleInput.addEventListener('input', () => {
  if (taskTitleInput.value.trim() !== '') {
    showValidationError(false);
  }
});

// Status filter button clicks
filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    const filter = button.getAttribute('data-filter');
    filterTasks(filter);
  });
});

// Search input typing
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  if (searchQuery.trim().length > 0) {
    clearSearchBtn.classList.remove('hidden');
  } else {
    clearSearchBtn.classList.add('hidden');
  }
  renderTasks();
});

// Clear search button
clearSearchBtn.addEventListener('click', () => {
  searchQuery = '';
  searchInput.value = '';
  clearSearchBtn.classList.add('hidden');
  searchInput.focus();
  renderTasks();
});

// Initialize application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  loadFromLocalStorage();
  updateTaskSummary();
  renderTasks();
});
