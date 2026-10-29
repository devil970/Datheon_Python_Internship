# Task Manager Web Application

A clean, responsive, and beginner-friendly Task Manager web application built with pure HTML5, CSS3, and modern Vanilla JavaScript (ES6+). This project demonstrates core frontend web development fundamentals, DOM manipulation, event handling, and client-side data persistence with the browser's `localStorage` API.

---

## 🚀 Live Demo & How to Run

Because this application relies solely on native browser technologies (HTML, CSS, and Vanilla JavaScript), there are no build steps, compilers, or server dependencies needed.

### Method 1: Direct File Opening
1. Download or clone this project repository to your local computer.
2. Locate the file `index.html`.
3. Double-click `index.html` (or right-click and select **Open with** -> **Google Chrome**, **Mozilla Firefox**, **Microsoft Edge**, or **Safari**).

### Method 2: Using VS Code Live Server (Recommended)
1. Open the project folder in **Visual Studio Code**.
2. If installed, click on the **Go Live** button in the bottom status bar (from the *Live Server* extension).
3. The application will open automatically at `http://127.0.0.1:5500`.

---

## 🛠️ Technologies Used

- **HTML5**: Semantic tags (`<header>`, `<section>`, `<form>`, `<label>`, `<ul>`, `<button>`) for accessible and clean page structure.
- **CSS3**: Modern CSS variables, Flexbox, Grid layout, responsive media queries, and subtle transitions without external CSS frameworks.
- **Vanilla JavaScript (ES6+)**: Clean, modular functions, template strings, arrow functions, and array methods (`filter`, `find`, `findIndex`, `splice`, `unshift`).
- **DOM Manipulation**: Native element creation (`document.createElement`), class manipulation (`classList`), event listeners, and safe text injection via `.textContent` to protect against Cross-Site Scripting (XSS).
- **Web Storage API (`localStorage`)**: Persistent storage of tasks across browser sessions and reloads.
- **HTML5 Drag and Drop API**: Native reordering of tasks without external libraries.

---

## ✨ Features Checklist

| Feature | Description |
| :--- | :--- |
| **Add Task** | Input task title, select a category (Work, Personal, Study), and an optional due date. |
| **Validation** | Shows an inline error message and highlights the input if the task title is empty. |
| **Display Tasks** | Renders tasks with category badges, due dates, and completion status. |
| **Overdue Detection** | Highlights overdue tasks with an indicator badge if the due date is in the past and the task is incomplete. |
| **Edit Task** | Edit the title, category, and due date of any existing task without creating duplicate entries. Includes a "Cancel" option. |
| **Delete Task** | Prompts for user confirmation before deleting a task from the list and storage. |
| **Toggle Status** | Checkbox toggles task between active and completed, applying a line-through style and subtle opacity change. |
| **Filter by Status** | Switch views between **All**, **Active**, and **Completed** tasks in real time. |
| **Search Tasks** | Real-time case-insensitive search by task title that works harmoniously with status filters. |
| **Task Statistics** | Live counters showing **Total Tasks**, **Active Tasks**, and **Completed Tasks**. |
| **LocalStorage** | Automatic persistence so tasks remain intact after page reload. |
| **Drag & Drop Reordering** | Easily reorder tasks by dragging and dropping them into place (persisted in `localStorage`). |
| **Responsive Design** | Adapts seamlessly to both mobile screens and desktop displays. |

---

## 📁 File Structure

```text
task-manager/
├── index.html     # Semantic markup and accessible UI structure
├── style.css      # Custom styling, color system, and responsive layout
├── script.js      # Application state, CRUD logic, and event handling
└── README.md      # Project documentation, architecture, and review guide
```

---

## 🧠 Code Architecture & Core JavaScript Functions

Here is a breakdown of how the key functions in `script.js` work:

### 1. `loadFromLocalStorage()` & `saveToLocalStorage()`
- **`saveToLocalStorage()`**: Serializes the `tasks` array into a JSON string using `JSON.stringify(tasks)` and stores it under the key `'taskManagerTasks'`.
- **`loadFromLocalStorage()`**: Reads the stored string with `localStorage.getItem('taskManagerTasks')` and parses it safely inside a `try...catch` block with `JSON.parse()`. It also confirms that the parsed data is a valid array to prevent crashes from corrupted data.

### 2. `addTask()`
- Handles both **creating a new task** and **updating an existing task** (when `editingTaskId` is set).
- Reads values from the title input, category select, and due date picker.
- Validates that the title is not empty. If empty, calls `showValidationError(true)`.
- When creating: creates an object with a unique timestamp ID (`Date.now().toString()`), prepends it with `tasks.unshift(newTask)`, and clears the form.
- When updating: finds the task by ID in the `tasks` array and updates its properties directly.
- Calls `saveToLocalStorage()`, `updateTaskSummary()`, and `renderTasks()`.

### 3. `renderTasks()`
- Filters the global `tasks` array using the current filter (`all`, `active`, or `completed`) and active search term (`searchQuery`).
- Toggles the empty state message if no matching tasks exist.
- Empties the `<ul>` element and calls `createTaskElement()` for each matching task.

### 4. `createTaskElement(task)`
- Creates DOM nodes programmatically (`document.createElement`).
- **Security / XSS Prevention**: Sets user input with `.textContent = task.title` rather than `.innerHTML`.
- Configures event listeners for the checkbox (`toggleTaskStatus`), edit button (`editTask`), and delete button (`deleteTask`).
- Sets up native HTML5 drag-and-drop listeners (`setupDragAndDrop`).

### 5. `editTask(id)`
- Sets the global `editingTaskId` to the selected task's ID.
- Fills the form inputs with the existing task's values.
- Updates the submit button text to **"Update Task"** and reveals the **"Cancel"** button.

### 6. `deleteTask(id)`
- Asks for user confirmation via `window.confirm()`.
- Filters out the task matching the `id`.
- If the deleted task was currently being edited, resets the form back to add mode.
- Updates `localStorage`, statistics, and UI.

### 7. `toggleTaskStatus(id)`
- Inverts the boolean `task.completed` of the target task (`true` <-> `false`).
- Updates `localStorage`, statistics, and UI.

### 8. `filterTasks(status)`
- Updates the `currentFilter` variable (`'all'`, `'active'`, or `'completed'`).
- Toggles the `.active` CSS class on the filter buttons.
- Re-renders the visible tasks.

### 9. `updateTaskSummary()`
- Computes `total = tasks.length`, `completed = tasks.filter(t => t.completed).length`, and `active = total - completed`.
- Updates the DOM counters for Total, Active, and Completed tasks.

### 10. `setupDragAndDrop(itemElement, id)`
- Listens for `dragstart`, `dragover`, `drop`, and `dragend` events.
- On `drop`, swaps or repositions the dragged task within the `tasks` array using `splice()`.
- Saves the new order in `localStorage` and re-renders the list.

---

## 🔒 Security Best Practices

- **Safe DOM Injection**: All dynamic user-generated text is inserted using `.textContent` instead of `.innerHTML`. This prevents arbitrary JavaScript execution (Cross-Site Scripting / XSS).
- **Data Validation**: Validates user inputs before mutating the application state.
- **Defensive Parsing**: Uses `try...catch` blocks and type checks around `localStorage` operations.

---

## 📋 Testing & Verification Steps

To verify all required features during review:

1. **Add Task**: Enter "Complete internship assignment", select "Study", pick a tomorrow due date, and click "Add Task". Verify that it appears at the top.
2. **Validation**: Try clicking "Add Task" with an empty input. Verify that an inline red warning appears and the input gets focused.
3. **Completion**: Click the checkbox next to a task. Verify that the task title receives a strikethrough and the "Completed" counter increments by 1.
4. **Filters**: Add multiple tasks, mark one completed, and test the "Active", "Completed", and "All" buttons.
5. **Search**: Type in the search box to find a task by title. Test typing while an "Active" filter is chosen. Click the "×" clear button to restore the full list.
6. **Edit Task**: Click "Edit", modify the title or category, and click "Update Task". Verify that the changes save without creating a duplicate task.
7. **Delete Task**: Click "Delete". Confirm the dialog. Verify that the task disappears and the statistics decrease accordingly.
8. **Persistence**: Refresh or close and reopen the browser. Verify that all tasks and statistics persist exactly as left.
9. **Drag & Drop**: Drag a task up or down in the list. Refresh the page and confirm the reordered position is preserved.
10. **Responsive View**: Open Developer Tools (`F12`), toggle Device Toolbar (mobile view), and test on small screen dimensions.

---

## 📄 License
This project was developed for learning and internship demonstration purposes. Feel free to use, modify, and build upon it!
