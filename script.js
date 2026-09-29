/**
 * Daily Task Planner - Core Controller
 */
class TaskPlanner {
    constructor() {
        this.tasks = this.loadFromLocalStorage();
        this.currentFilter = 'all';

        // DOM Elements
        this.taskForm = document.getElementById('taskForm');
        this.taskInput = document.getElementById('taskInput');
        this.taskList = document.getElementById('taskList');
        this.emptyNotice = document.getElementById('emptyNotice');
        this.currentDateEl = document.getElementById('currentDate');
        this.pendingCounter = document.getElementById('pendingCounter');
        this.completedCounter = document.getElementById('completedCounter');
        this.filterControls = document.getElementById('filterControls');
        this.clearCompletedBtn = document.getElementById('clearCompletedBtn');
        this.validationAlert = document.getElementById('validationAlert');

        this.init();
    }

    init() {
        this.displayCurrentDate();
        this.bindEvents();
        this.render();
    }

    displayCurrentDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
        if (this.currentDateEl) {
            this.currentDateEl.textContent = new Date().toLocaleDateString('en-US', options);
        }
    }

    loadFromLocalStorage() {
        try {
            const data = localStorage.getItem('planner_tasks');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error parsing localStorage:', error);
            return [];
        }
    }

    saveToLocalStorage() {
        localStorage.setItem('planner_tasks', JSON.stringify(this.tasks));
    }

    bindEvents() {
        // Form submit
        this.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask(this.taskInput.value.trim());
        });

        // Event delegation on task list
        this.taskList.addEventListener('click', (e) => {
            const target = e.target;
            const li = target.closest('li[data-id]');
            if (!li) return;
            const id = Number(li.dataset.id);

            if (target.matches('.task-checkbox')) {
                this.toggleTask(id);
            } else if (target.closest('.delete-btn')) {
                this.deleteTask(id);
            } else if (target.closest('.edit-btn')) {
                this.enableInlineEdit(id, li);
            } else if (target.closest('.save-edit-btn')) {
                this.saveInlineEdit(id, li);
            } else if (target.closest('.cancel-edit-btn')) {
                this.render();
            }
        });

        // Keyboard controls inside inline edit input
        this.taskList.addEventListener('keydown', (e) => {
            if (e.target.classList.contains('inline-edit-input')) {
                const li = e.target.closest('li[data-id]');
                const id = Number(li.dataset.id);

                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.saveInlineEdit(id, li);
                } else if (e.key === 'Escape') {
                    this.render();
                }
            }
        });

        // Filter controls
        this.filterControls.addEventListener('click', (e) => {
            const btn = e.target.closest('.filter-btn');
            if (btn) {
                this.filterControls.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.render();
            }
        });

        // Clear completed tasks
        this.clearCompletedBtn.addEventListener('click', () => {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveToLocalStorage();
            this.render();
        });
    }

    addTask(title) {
        if (!title) {
            if (this.validationAlert) this.validationAlert.classList.remove('d-none');
            return;
        }
        if (this.validationAlert) this.validationAlert.classList.add('d-none');

        const newTask = {
            id: Date.now(),
            title: title,
            completed: false
        };

        this.tasks.unshift(newTask);
        this.saveToLocalStorage();
        this.taskInput.value = '';
        this.render();
    }

    toggleTask(id) {
        this.tasks = this.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
        this.saveToLocalStorage();
        this.render();
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveToLocalStorage();
        this.render();
    }

    enableInlineEdit(id, li) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        li.innerHTML = `
            <div class="input-group">
                <input type="text" class="form-control custom-input py-2 inline-edit-input" value="${this.escapeHtml(task.title)}">
                <button class="btn btn-sm btn-success px-3 save-edit-btn" type="button" title="Save"><i class="bi bi-check-lg"></i></button>
                <button class="btn btn-sm btn-secondary px-3 cancel-edit-btn" type="button" title="Cancel"><i class="bi bi-x-lg"></i></button>
            </div>
        `;

        const input = li.querySelector('.inline-edit-input');
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
    }

    saveInlineEdit(id, li) {
        const input = li.querySelector('.inline-edit-input');
        const updatedTitle = input.value.trim();
        if (!updatedTitle) return;

        this.tasks = this.tasks.map(t => t.id === id ? { ...t, title: updatedTitle } : t);
        this.saveToLocalStorage();
        this.render();
    }

    getFilteredTasks() {
        if (this.currentFilter === 'pending') return this.tasks.filter(t => !t.completed);
        if (this.currentFilter === 'completed') return this.tasks.filter(t => t.completed);
        return this.tasks;
    }

    escapeHtml(str) {
        return str.replace(/[&<>"']/g, m => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[m]);
    }

    render() {
        const filtered = this.getFilteredTasks();
        const pendingCount = this.tasks.filter(t => !t.completed).length;
        const completedCount = this.tasks.filter(t => t.completed).length;

        if (this.pendingCounter) this.pendingCounter.textContent = `${pendingCount} Pending`;
        if (this.completedCounter) this.completedCounter.textContent = `${completedCount} Done`;

        this.taskList.innerHTML = '';

        if (filtered.length === 0) {
            this.emptyNotice.classList.remove('d-none');
        } else {
            this.emptyNotice.classList.add('d-none');
            filtered.forEach(task => {
                const li = document.createElement('li');
                li.dataset.id = task.id;
                li.className = `list-group-item task-item d-flex justify-content-between align-items-center ${task.completed ? 'task-completed' : ''}`;

                li.innerHTML = `
                    <div class="d-flex align-items-center gap-3 flex-grow-1 overflow-hidden me-2">
                        <input type="checkbox" class="form-check-input task-checkbox m-0" ${task.completed ? 'checked' : ''}>
                        <span class="task-text text-truncate">${this.escapeHtml(task.title)}</span>
                    </div>
                    <div class="d-flex align-items-center gap-1">
                        <button class="action-btn edit-btn" title="Edit Task" type="button">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="action-btn delete-btn" title="Delete Task" type="button">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                `;

                this.taskList.appendChild(li);
            });
        }
    }
}

// Ensure the class instantiates after DOM is completely ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new TaskPlanner());
} else {
    new TaskPlanner();
}