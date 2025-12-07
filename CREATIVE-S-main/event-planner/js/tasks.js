// AI Event Architect - Tasks Module (Checklist with Progress Tracking)

import { Utils } from './utils.js';
import { planner } from './planner.js';
import { uiManager } from './ui.js';

export class TaskManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupTasksPanel();
        this.renderTasks();
        this.setupEventListeners();

        // Listen for panel shown event
        document.addEventListener('panelShown', (e) => {
            if (e.detail.panelId === 'tasks') {
                this.renderTasks();
            }
        });
        // Re-render when an event is loaded from server
        document.addEventListener('eventLoaded', () => {
            this.renderTasks();
        });
    }

    setupTasksPanel() {
        const container = document.getElementById('tasks-content');
        if (!container) return;

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3>Event Checklist</h3>
                <div class="d-flex gap-2">
                    <div class="btn-group" role="group">
                        <button class="btn btn-outline-primary btn-sm" id="tasks-mode-auto">AI Auto-Tasks</button>
                        <button class="btn btn-outline-secondary btn-sm" id="tasks-mode-manual">Manual Tasks</button>
                    </div>
                    <button class="btn btn-outline-success btn-sm" data-generate-component="tasks">Regenerate</button>
                </div>
            </div>

            <div class="progress mb-3" style="height: 20px;">
                <div class="progress-bar bg-success" id="tasks-progress" role="progressbar" style="width: 0%"></div>
            </div>
            <div class="text-center mb-4">
                <small class="text-muted" id="tasks-completion-text">0% Complete</small>
            </div>

            <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="btn-group" role="group">
                    <button class="btn btn-outline-info btn-sm active" id="filter-all">All Tasks</button>
                    <button class="btn btn-outline-info btn-sm" id="filter-pending">Pending</button>
                    <button class="btn btn-outline-info btn-sm" id="filter-completed">Completed</button>
                </div>
                <button class="btn btn-primary btn-sm" id="add-task">
                    <i class="fas fa-plus me-2"></i>Add Task
                </button>
            </div>

            <div id="tasks-container">
                <!-- Tasks will be rendered here -->
            </div>
        `;

        this.setMode('auto');
        this.currentFilter = 'all';
    }

    setupEventListeners() {
        // Mode switching
        document.getElementById('tasks-mode-auto')?.addEventListener('click', () => {
            this.setMode('auto');
        });

        document.getElementById('tasks-mode-manual')?.addEventListener('click', () => {
            this.setMode('manual');
        });

        // Filter switching
        document.getElementById('filter-all')?.addEventListener('click', () => {
            this.setFilter('all');
        });

        document.getElementById('filter-pending')?.addEventListener('click', () => {
            this.setFilter('pending');
        });

        document.getElementById('filter-completed')?.addEventListener('click', () => {
            this.setFilter('completed');
        });

        // Add new task
        document.getElementById('add-task')?.addEventListener('click', () => {
            this.addNewTask();
        });

        // Global save event
        document.addEventListener('globalSave', () => {
            this.saveTasks();
        });
    }

    setMode(mode) {
        const autoBtn = document.getElementById('tasks-mode-auto');
        const manualBtn = document.getElementById('tasks-mode-manual');

        if (mode === 'auto') {
            autoBtn.classList.add('active');
            manualBtn.classList.remove('active');
            this.generateAutoTasks();
        } else {
            manualBtn.classList.add('active');
            autoBtn.classList.remove('active');
            this.renderTasks();
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        const allBtn = document.getElementById('filter-all');
        const pendingBtn = document.getElementById('filter-pending');
        const completedBtn = document.getElementById('filter-completed');

        [allBtn, pendingBtn, completedBtn].forEach(btn => btn.classList.remove('active'));

        if (filter === 'all') allBtn.classList.add('active');
        else if (filter === 'pending') pendingBtn.classList.add('active');
        else if (filter === 'completed') completedBtn.classList.add('active');

        this.renderTasks();
    }

    generateAutoTasks() {
        // Call the API to generate AI-powered tasks
        if (planner.currentEventId) {
            planner.generateComponentForCurrentEvent('tasks').then(() => {
                this.renderTasks();
                Utils.showToast('AI tasks generated!', 'success');
            }).catch(err => {
                console.error('Failed to generate tasks:', err);
                Utils.showToast('Failed to generate AI tasks', 'error');
            });
        } else {
            Utils.showToast('Please save event basics first', 'warning');
        }
    }

    renderTasks() {
        const container = document.getElementById('tasks-container');
        if (!container) return;

        const tasks = planner.eventState.checklist;
        const filteredTasks = this.filterTasks(tasks);

        container.innerHTML = '';

        if (filteredTasks.length === 0) {
            container.innerHTML = '<div class="text-center text-muted mt-4"><i class="fas fa-check-circle fa-3x mb-3"></i><p>No tasks found</p></div>';
            return;
        }

        // Group by category
        const groupedTasks = this.groupTasksByCategory(filteredTasks);

        Object.entries(groupedTasks).forEach(([category, categoryTasks]) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'mb-4';
            categoryDiv.innerHTML = `<h5 class="mb-3">${category}</h5>`;

            const taskList = document.createElement('div');
            taskList.className = 'list-group';

            categoryTasks.forEach(task => {
                const taskDiv = document.createElement('div');
                taskDiv.className = `list-group-item d-flex align-items-center ${task.completed ? 'list-group-item-success' : ''}`;
                taskDiv.innerHTML = `
                    <div class="form-check me-3">
                        <input class="form-check-input" type="checkbox" ${task.completed ? 'checked' : ''} data-task-id="${task.id}">
                    </div>
                    <div class="flex-grow-1">
                        <span class="${task.completed ? 'text-decoration-line-through text-muted' : ''}">${task.title}</span>
                        <small class="text-muted d-block">${task.priority} priority</small>
                    </div>
                    <div>
                        <button class="btn btn-outline-primary btn-sm me-1" data-action="edit" data-task-id="${task.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" data-action="delete" data-task-id="${task.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                taskList.appendChild(taskDiv);
            });

            categoryDiv.appendChild(taskList);
            container.appendChild(categoryDiv);
        });

        this.updateProgress();
        this.setupTaskEventListeners();
    }

    filterTasks(tasks) {
        if (this.currentFilter === 'all') return tasks;
        if (this.currentFilter === 'pending') return tasks.filter(task => !task.completed);
        if (this.currentFilter === 'completed') return tasks.filter(task => task.completed);
        return tasks;
    }

    groupTasksByCategory(tasks) {
        const grouped = {};
        tasks.forEach(task => {
            const category = task.category || 'General';
            if (!grouped[category]) grouped[category] = [];
            grouped[category].push(task);
        });
        return grouped;
    }

    setupTaskEventListeners() {
        document.getElementById('tasks-container')?.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox' && e.target.hasAttribute('data-task-id')) {
                const taskId = e.target.getAttribute('data-task-id');
                this.toggleTask(taskId);
            }
        });

        document.getElementById('tasks-container')?.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const taskId = target.getAttribute('data-task-id');
            const action = target.getAttribute('data-action');

            if (action === 'edit') {
                this.editTask(taskId);
            } else if (action === 'delete') {
                this.deleteTask(taskId);
            }
        });
    }

    toggleTask(taskId) {
        const task = planner.eventState.checklist.find(t => t.id === taskId);
        if (task) {
            planner.updateTask(taskId, { completed: !task.completed });
            this.renderTasks();
        }
    }

    addNewTask() {
        const task = {
            title: 'New Task',
            category: 'General',
            completed: false,
            priority: 'medium'
        };
        planner.addTask(task);
        this.renderTasks();
    }

    editTask(taskId) {
        const task = planner.eventState.checklist.find(t => t.id === taskId);
        if (!task) return;

        const newTitle = prompt('Edit task:', task.title);
        if (newTitle !== null) {
            planner.updateTask(taskId, { title: newTitle });
            this.renderTasks();
        }
    }

    deleteTask(taskId) {
        const task = planner.eventState.checklist.find(t => t.id === taskId);
        if (!task) return;

        if (confirm(`Delete "${task.title}"?`)) {
            planner.removeTask(taskId);
            this.renderTasks();
        }
    }

    updateProgress() {
        const tasks = planner.eventState.checklist;
        const completed = tasks.filter(task => task.completed).length;
        const total = tasks.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        const progressBar = document.getElementById('tasks-progress');
        const progressText = document.getElementById('tasks-completion-text');

        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
        if (progressText) {
            progressText.textContent = `${percentage}% Complete (${completed}/${total} tasks)`;
        }
    }

    saveTasks() {
        // Tasks are auto-saved via planner
        Utils.showToast('Tasks saved!', 'success');
    }
}

// Global instance
export const taskManager = new TaskManager();