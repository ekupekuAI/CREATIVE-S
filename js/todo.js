// ===== Task Manager for Creative Studio =====
// Advanced task management with filtering, sorting, and export capabilities

// Global variables
let tasks = [];
let currentFilter = 'all';
let currentSort = 'created';
let priorityFilters = { high: true, medium: true, low: true };
let searchTerm = '';

// Task status definitions
const taskStatuses = {
    'todo': 'To Do',
    'in-progress': 'In Progress',
    'review': 'In Review',
    'completed': 'Completed'
};

// ===== Initialization =====

document.addEventListener('DOMContentLoaded', function() {
    initializeTaskManager();
});

function initializeTaskManager() {
    loadTasks();
    setupEventListeners();
    updateDisplay();
    updateViewTitle();
    
    // Request notification permission for reminders
    requestNotificationPermission();
    
    console.log('Task Manager initialized');
}

// ===== Event Listeners =====

function setupEventListeners() {
    // Add task form
    const addForm = document.getElementById('addTaskForm');
    if (addForm) addForm.addEventListener('submit', addNewTask);
    
    // Filter buttons
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', function() {
            setFilter(this.dataset.filter);
        });
    });
    
    // Sort dropdown
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            currentSort = this.value;
            updateDisplay();
            saveTasks();
        });
    }
    
    // Priority filters
    document.querySelectorAll('.priority-filters input').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            priorityFilters[this.id.replace('filter', '').toLowerCase()] = this.checked;
            updateDisplay();
            saveTasks();
        });
    });
    
    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            searchTerm = this.value.toLowerCase().trim();
            updateDisplay();
        }, 300));
    }
    
    // Clear search
    const clearSearchBtn = document.getElementById('clearSearch');
    if (clearSearchBtn) clearSearchBtn.addEventListener('click', clearSearch);
    
    // Export buttons
    document.querySelectorAll('[data-export]').forEach(btn => {
        btn.addEventListener('click', function() {
            exportTasks(this.dataset.export);
        });
    });
    
    // Import button
    const importBtn = document.getElementById('importTasksBtn');
    if (importBtn) {
        importBtn.addEventListener('click', function() {
            const fileInput = document.getElementById('importFile');
            if (fileInput) fileInput.click();
        });
    }
    
    // Import file input
    const importFileInput = document.getElementById('importFile');
    if (importFileInput) importFileInput.addEventListener('change', handleFileImport);
    
    // Clear completed
    const clearCompletedBtn = document.getElementById('clearCompletedBtn');
    if (clearCompletedBtn) clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Auto-save on page unload
    window.addEventListener('beforeunload', saveTasks);
}

// ===== Task CRUD Operations =====

function addNewTask(event) {
    event.preventDefault();
    
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const dueDate = document.getElementById('taskDueDate').value;
    const priority = document.getElementById('taskPriority').value;
    const tagsInput = document.getElementById('taskTags').value.trim();
    
    if (!title) {
        showNotification('Task title is required!', 'warning');
        document.getElementById('taskTitle').focus();
        return;
    }
    
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    const newTask = {
        id: generateId(),
        title: title,
        description: description,
        dueDate: dueDate,
        priority: priority,
        status: 'todo',
        tags: tags,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    tasks.unshift(newTask);
    saveTasks();
    updateDisplay();
    
    // Reset form
    event.target.reset();
    document.getElementById('taskTitle').focus();
    
    showNotification('Task added successfully!', 'success');
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Populate edit modal
    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskDescription').value = task.description || '';
    document.getElementById('editTaskDueDate').value = task.dueDate || '';
    document.getElementById('editTaskPriority').value = task.priority;
    document.getElementById('editTaskStatus').value = task.status;
    document.getElementById('editTaskTags').value = task.tags.join(', ');
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editTaskModal'));
    modal.show();
    
    // Handle save
    document.getElementById('saveEditBtn').onclick = function() {
        saveEditedTask();
        modal.hide();
    };
}

function saveEditedTask() {
    const taskId = document.getElementById('editTaskId').value;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const title = document.getElementById('editTaskTitle').value.trim();
    const description = document.getElementById('editTaskDescription').value.trim();
    const dueDate = document.getElementById('editTaskDueDate').value;
    const priority = document.getElementById('editTaskPriority').value;
    const status = document.getElementById('editTaskStatus').value;
    const tagsInput = document.getElementById('editTaskTags').value.trim();
    
    if (!title) {
        showNotification('Task title is required!', 'warning');
        return;
    }
    
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    task.title = title;
    task.description = description;
    task.dueDate = dueDate;
    task.priority = priority;
    task.status = status;
    task.tags = tags;
    task.updatedAt = new Date().toISOString();
    
    saveTasks();
    updateDisplay();
    showNotification('Task updated successfully!', 'success');
}

function deleteTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks();
        updateDisplay();
        showNotification('Task deleted successfully!', 'success');
    }
}

function duplicateTask(taskId) {
    const originalTask = tasks.find(t => t.id === taskId);
    if (!originalTask) return;
    
    const duplicatedTask = {
        ...originalTask,
        id: generateId(),
        title: `${originalTask.title} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    tasks.unshift(duplicatedTask);
    saveTasks();
    updateDisplay();
    showNotification('Task duplicated successfully!', 'success');
}

function toggleTaskComplete(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    task.completed = !task.completed;
    task.status = task.completed ? 'completed' : 'todo';
    task.updatedAt = new Date().toISOString();
    
    saveTasks();
    updateDisplay();
    
    const action = task.completed ? 'completed' : 'marked as incomplete';
    showNotification(`Task ${action}!`, 'success');
}

// ===== Filtering and Sorting =====

function setFilter(filterType) {
    currentFilter = filterType;
    
    // Update active button
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filterType}"]`).classList.add('active');
    
    updateDisplay();
    updateViewTitle();
    saveTasks();
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    searchTerm = '';
    updateDisplay();
}

// Provide global functions to match HTML onclicks
function filterTasks(filterType) {
    setFilter(filterType);
}

function sortTasks(criteria) {
    currentSort = criteria;
    updateDisplay();
    saveTasks();
}

function searchTasks() {
    const input = document.getElementById('searchInput');
    searchTerm = (input && input.value ? input.value : '').toLowerCase().trim();
    updateDisplay();
}

function getFilteredTasks() {
    let filteredTasks = [...tasks];
    
    // Apply status filter
    switch (currentFilter) {
        case 'today':
            const today = new Date().toISOString().split('T')[0];
            filteredTasks = filteredTasks.filter(task => task.dueDate === today);
            break;
        case 'week':
            const weekFromNow = new Date();
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            filteredTasks = filteredTasks.filter(task => {
                if (!task.dueDate) return false;
                const dueDate = new Date(task.dueDate);
                return dueDate <= weekFromNow && dueDate >= new Date();
            });
            break;
        case 'pending':
            filteredTasks = filteredTasks.filter(task => !task.completed && task.status !== 'completed');
            break;
        case 'overdue':
            const now = new Date().toISOString().split('T')[0];
            filteredTasks = filteredTasks.filter(task => 
                !task.completed && task.dueDate && task.dueDate < now
            );
            break;
        case 'completed':
            filteredTasks = filteredTasks.filter(task => task.completed || task.status === 'completed');
            break;
        // 'all' shows all tasks
    }
    
    // Apply priority filter
    filteredTasks = filteredTasks.filter(task => priorityFilters[task.priority]);
    
    // Apply search filter
    if (searchTerm) {
        filteredTasks = filteredTasks.filter(task =>
            task.title.toLowerCase().includes(searchTerm) ||
            task.description.toLowerCase().includes(searchTerm) ||
            task.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }
    
    // Sort tasks
    filteredTasks.sort((a, b) => {
        switch (currentSort) {
            case 'dueDate':
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            case 'priority':
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            case 'alphabetical':
                return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
            case 'created':
            default:
                return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });
    
    return filteredTasks;
}

// ===== Display Functions =====

function updateDisplay() {
    const filteredTasks = getFilteredTasks();
    renderTasks(filteredTasks);
    updateCounts();
    updateStatistics();
}

function renderTasks(tasksToRender) {
    const container = document.getElementById('tasksContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (tasksToRender.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    container.style.display = 'block';
    emptyState.style.display = 'none';
    
    container.innerHTML = tasksToRender.map(task => createTaskHTML(task)).join('');
}

function createTaskHTML(task) {
    const dueStatus = getDueStatus(task);
    const tagsHTML = task.tags.map(tag => 
        `<span class="task-tag">${escapeHtml(tag)}</span>`
    ).join('');
    
    const dueDateHTML = task.dueDate ? 
        `<div class="task-due-date ${dueStatus.class}">
            <i class="fas fa-calendar"></i>
            ${formatDate(task.dueDate)} ${dueStatus.text}
        </div>` : '';
    
    const descriptionHTML = task.description ? 
        `<div class="task-description">${escapeHtml(task.description)}</div>` : '';
    
    return `
        <div class="task-item ${task.completed ? 'completed' : ''} ${dueStatus.itemClass}" 
             data-task-id="${task.id}" 
             onclick="selectTask('${task.id}')">
            <div class="task-content">
                <div class="task-header-row">
                    <div class="flex-grow-1">
                        <div class="task-title">${escapeHtml(task.title)}</div>
                        ${descriptionHTML}
                    </div>
                    <div class="task-actions">
                        <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                             onclick="event.stopPropagation(); toggleTaskComplete('${task.id}')">
                            ${task.completed ? '<i class="fas fa-check"></i>' : ''}
                        </div>
                        <button class="task-action-btn" 
                                onclick="event.stopPropagation(); editTask('${task.id}')" 
                                title="Edit Task">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="task-action-btn" 
                                onclick="event.stopPropagation(); duplicateTask('${task.id}')" 
                                title="Duplicate Task">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
                
                <div class="task-meta">
                    ${dueDateHTML}
                    <span class="task-priority ${task.priority}">${task.priority.toUpperCase()}</span>
                    <span class="task-status ${task.status}">${taskStatuses[task.status]}</span>
                </div>
                
                ${task.tags.length > 0 ? `<div class="task-tags">${tagsHTML}</div>` : ''}
            </div>
        </div>
    `;
}

function getDueStatus(task) {
    if (!task.dueDate) return { class: '', text: '', itemClass: '' };
    
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        return { 
            class: 'overdue', 
            text: `(${Math.abs(diffDays)} days overdue)`, 
            itemClass: 'overdue' 
        };
    } else if (diffDays === 0) {
        return { 
            class: 'due-soon', 
            text: '(Due today)', 
            itemClass: 'due-soon' 
        };
    } else if (diffDays === 1) {
        return { 
            class: 'due-soon', 
            text: '(Due tomorrow)', 
            itemClass: 'due-soon' 
        };
    } else if (diffDays <= 3) {
        return { 
            class: 'due-soon', 
            text: `(Due in ${diffDays} days)`, 
            itemClass: 'due-soon' 
        };
    }
    
    return { class: '', text: '', itemClass: '' };
}

function updateCounts() {
    const counts = {
        all: tasks.length,
        today: tasks.filter(t => t.dueDate === new Date().toISOString().split('T')[0]).length,
        week: tasks.filter(t => {
            if (!t.dueDate) return false;
            const weekFromNow = new Date();
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            const dueDate = new Date(t.dueDate);
            return dueDate <= weekFromNow && dueDate >= new Date();
        }).length,
        pending: tasks.filter(t => !t.completed && t.status !== 'completed').length,
        overdue: tasks.filter(t => {
            const now = new Date().toISOString().split('T')[0];
            return !t.completed && t.dueDate && t.dueDate < now;
        }).length,
        completed: tasks.filter(t => t.completed || t.status === 'completed').length
    };
    
    Object.entries(counts).forEach(([key, count]) => {
        const element = document.getElementById(`count${key.charAt(0).toUpperCase() + key.slice(1)}`);
        if (element) {
            element.textContent = count;
        }
    });
}

function updateStatistics() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed || t.status === 'completed').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statCompleted').textContent = completed;
    document.getElementById('statRate').textContent = `${completionRate}%`;
    document.getElementById('progressBar').style.width = `${completionRate}%`;
    document.getElementById('progressBar').setAttribute('aria-valuenow', completionRate);
}

function updateViewTitle() {
    const titles = {
        all: 'All Tasks',
        today: 'Today\'s Tasks',
        week: 'This Week\'s Tasks',
        pending: 'Pending Tasks',
        overdue: 'Overdue Tasks',
        completed: 'Completed Tasks'
    };
    
    const subtitles = {
        all: 'Manage your tasks efficiently',
        today: 'Focus on today\'s priorities',
        week: 'Tasks due this week',
        pending: 'Tasks waiting to be completed',
        overdue: 'Tasks that need immediate attention',
        completed: 'Your accomplished tasks'
    };
    
    document.getElementById('currentViewTitle').textContent = titles[currentFilter];
    document.getElementById('currentViewSubtitle').textContent = subtitles[currentFilter];
}

// ===== Utility Functions =====

function clearCompletedTasks() {
    const completedCount = tasks.filter(t => t.completed || t.status === 'completed').length;
    
    if (completedCount === 0) {
        showNotification('No completed tasks to clear.', 'info');
        return;
    }
    
    if (confirm(`Are you sure you want to delete ${completedCount} completed task(s)?`)) {
        tasks = tasks.filter(t => !t.completed && t.status !== 'completed');
        saveTasks();
        updateDisplay();
        showNotification(`${completedCount} completed tasks cleared.`, 'success');
    }
}

function focusAddTask() {
    document.getElementById('taskTitle').focus();
    document.getElementById('taskTitle').scrollIntoView({ behavior: 'smooth' });
}

function selectTask(taskId) {
    // Add visual feedback for task selection
    document.querySelectorAll('.task-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskElement) {
        taskElement.classList.add('selected');
    }
}

// ===== Data Management =====

function saveTasks() {
    const data = {
        tasks: tasks,
        filters: { current: currentFilter, priority: priorityFilters },
        sort: currentSort,
        savedAt: new Date().toISOString()
    };
    
    if (window.CreativeStudio) {
        window.CreativeStudio.saveToStorage('tasks_data', data);
    } else {
        localStorage.setItem('tasks_data', JSON.stringify(data));
    }
}

function loadTasks() {
    let data = null;
    
    if (window.CreativeStudio) {
        data = window.CreativeStudio.loadFromStorage('tasks_data');
    } else {
        try {
            data = JSON.parse(localStorage.getItem('tasks_data'));
        } catch (e) {
            console.error('Error loading tasks:', e);
        }
    }
    
    if (data) {
        tasks = data.tasks || [];
        currentFilter = data.filters?.current || 'all';
        priorityFilters = data.filters?.priority || { high: true, medium: true, low: true };
        currentSort = data.sort || 'created';
        
        // Update UI to reflect loaded state
        document.querySelector(`[data-filter="${currentFilter}"]`)?.classList.add('active');
        document.getElementById('filterHigh').checked = priorityFilters.high;
        document.getElementById('filterMedium').checked = priorityFilters.medium;
        document.getElementById('filterLow').checked = priorityFilters.low;
    }
}

// ===== Export Functions =====

function exportTasks(format) {
    if (tasks.length === 0) {
        showNotification('No tasks to export.', 'warning');
        return;
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let filename, content, mimeType;
    
    switch (format) {
        case 'json':
            filename = `tasks-${timestamp}.json`;
            content = JSON.stringify({ tasks, exportedAt: new Date().toISOString() }, null, 2);
            mimeType = 'application/json';
            break;
        case 'csv':
            filename = `tasks-${timestamp}.csv`;
            content = generateCSV(tasks);
            mimeType = 'text/csv';
            break;
        case 'txt':
            filename = `tasks-${timestamp}.txt`;
            content = generateTXT(tasks);
            mimeType = 'text/plain';
            break;
        default:
            return;
    }
    
    downloadFile(filename, content, mimeType);
    showNotification(`Tasks exported as ${format.toUpperCase()}!`, 'success');
}

function generateCSV(tasks) {
    const headers = ['Title', 'Description', 'Due Date', 'Priority', 'Status', 'Tags', 'Created', 'Updated'];
    const rows = tasks.map(task => [
        `"${task.title.replace(/"/g, '""')}"`,
        `"${(task.description || '').replace(/"/g, '""')}"`,
        task.dueDate || '',
        task.priority,
        task.status,
        `"${task.tags.join(', ')}"`,
        new Date(task.createdAt).toLocaleString(),
        new Date(task.updatedAt).toLocaleString()
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateTXT(tasks) {
    let content = `TASK LIST EXPORT\n`;
    content += `Generated: ${new Date().toLocaleString()}\n`;
    content += `Total Tasks: ${tasks.length}\n`;
    content += `${'='.repeat(50)}\n\n`;
    
    tasks.forEach((task, index) => {
        content += `${index + 1}. ${task.title}\n`;
        if (task.description) {
            content += `   Description: ${task.description}\n`;
        }
        if (task.dueDate) {
            content += `   Due Date: ${formatDate(task.dueDate)}\n`;
        }
        content += `   Priority: ${task.priority.toUpperCase()}\n`;
        content += `   Status: ${taskStatuses[task.status]}\n`;
        if (task.tags.length > 0) {
            content += `   Tags: ${task.tags.join(', ')}\n`;
        }
        content += `   Created: ${new Date(task.createdAt).toLocaleString()}\n`;
        content += `\n`;
    });
    
    return content;
}

function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.tasks && Array.isArray(data.tasks)) {
                // Merge imported tasks with existing ones
                const importedTasks = data.tasks.map(task => ({
                    ...task,
                    id: generateId(), // Generate new IDs to avoid conflicts
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }));
                
                tasks = [...importedTasks, ...tasks];
                saveTasks();
                updateDisplay();
                
                showNotification(`${importedTasks.length} tasks imported successfully!`, 'success');
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('importTasksModal'));
                if (modal) modal.hide();
            } else {
                throw new Error('Invalid file format');
            }
        } catch (error) {
            console.error('Import error:', error);
            showNotification('Error importing tasks. Please check the file format.', 'danger');
        }
    };
    reader.readAsText(file);
}

// ===== Keyboard Shortcuts =====

function handleKeyboardShortcuts(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }
    
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'n':
                e.preventDefault();
                focusAddTask();
                break;
            case 'f':
                e.preventDefault();
                document.getElementById('searchInput').focus();
                break;
            case 'e':
                e.preventDefault();
                exportTasks('json');
                break;
        }
    } else {
        switch (e.key) {
            case 'Escape':
                clearSearch();
                break;
        }
    }
}

// ===== Helper Functions =====

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showNotification(message, type = 'info') {
    if (window.CreativeStudio) {
        window.CreativeStudio.showNotification(message, type);
    } else {
        // Fallback notification system
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 80px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" onclick="this.parentNode.remove()"></button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// ===== Service Worker for Notifications (Future Enhancement) =====

function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(function(permission) {
            if (permission === 'granted') {
                console.log('Notification permission granted');
            }
        });
    }
}

function showTaskReminder(task) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Task Reminder: ${task.title}`, {
            body: task.description || 'You have a task due soon!',
            icon: '/favicon.ico',
            badge: '/favicon.ico'
        });
    }
}

// Export functions for global use
window.TaskManager = {
    addNewTask,
    editTask,
    deleteTask,
    toggleTaskComplete,
    filterTasks,
    sortTasks,
    exportTasks,
    clearCompletedTasks,
    focusAddTask
};

console.log('%c📝 Task Manager Loaded!', 
    'background: linear-gradient(135deg, #4facfe, #00f2fe); color: white; padding: 8px; border-radius: 4px; font-weight: bold;');