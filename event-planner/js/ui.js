// AI Event Architect - Premium UI Manager

import { Utils } from './utils.js';
import { planner } from './planner.js';

export class UIManager {
    constructor() {
        this.currentPanel = 'dashboard';
        this.currentTheme = 'neon';
        this.sidebarCollapsed = false;
        this.mobileMenuOpen = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.loadSavedPreferences();
        this.showPanel('dashboard');
        this.updateBreadcrumb();
        this.initializeThemeButtons();
    }

    setupEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.nav-link[data-panel]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const panelId = link.getAttribute('data-panel');
                this.showPanel(panelId);
            });
        });

        // Theme selector buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.currentTarget.getAttribute('data-theme');
                this.setTheme(theme);
            });
        });

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Mobile menu toggle
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }

        // AI Quick Action
        const aiQuickAction = document.getElementById('ai-quick-action');
        if (aiQuickAction) {
            aiQuickAction.addEventListener('click', () => {
                this.showPanel('ai-planner');
                Utils.showToast('AI Assistant activated!', 'success');
            });
        }

        // Global search
        const globalSearch = document.getElementById('global-search');
        if (globalSearch) {
            globalSearch.addEventListener('input', (e) => {
                this.handleGlobalSearch(e.target.value);
            });
            globalSearch.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.performGlobalSearch(e.target.value);
                }
            });
        }

        // Handle buttons that navigate to panels
        document.addEventListener('click', (e) => {
            if (e.target.hasAttribute('data-panel') || e.target.closest('[data-panel]')) {
                e.preventDefault();
                const target = e.target.hasAttribute('data-panel') ? e.target : e.target.closest('[data-panel]');
                const panelId = target.getAttribute('data-panel');
                this.showPanel(panelId);
            }
        });

        // Delegate generate-component actions (e.g., regenerate budget/schedule/tasks/vendors)
        document.addEventListener('click', async (e) => {
            const target = e.target.closest('[data-generate-component]');
            if (!target) return;
            const component = target.getAttribute('data-generate-component');
            if (!component) return;
            try {
                this.createToast(`Generating ${component}...`, 'info');
                await planner.generateComponentForCurrentEvent(component);
                this.createToast(`${component} generated`, 'success');
            } catch (err) {
                console.error('Generate component error', err);
                this.createToast(`Failed to generate ${component}`, 'danger');
            }
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            const sidebar = document.querySelector('.sidebar');
            const mobileToggle = document.getElementById('mobile-menu-toggle');

            if (this.mobileMenuOpen &&
                !sidebar.contains(e.target) &&
                !mobileToggle.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && this.mobileMenuOpen) {
                this.closeMobileMenu();
            }
        });
    }

    showPanel(panelId) {
        // Update navigation active states
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        const activeLink = document.querySelector(`.nav-link[data-panel="${panelId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Hide all panels with animation
        document.querySelectorAll('.panel').forEach(panel => {
            if (panel.classList.contains('active')) {
                panel.style.animation = 'panelExit 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                setTimeout(() => {
                    panel.classList.remove('active');
                    panel.style.animation = '';
                }, 250);
            }
        });

        // Show target panel with animation
        const targetPanel = document.getElementById(`${panelId}-panel`);
        if (targetPanel) {
            setTimeout(() => {
                targetPanel.classList.add('active');
                this.currentPanel = panelId;
                this.updateBreadcrumb();
                this.initializePanel(panelId);
            }, 150);
        }

        // Close mobile menu on panel change
        if (this.mobileMenuOpen) {
            this.closeMobileMenu();
        }
    }

    initializePanel(panelId) {
        // Trigger panel-specific initialization
        const event = new CustomEvent('panelShown', { detail: { panelId } });
        document.dispatchEvent(event);

        // Panel-specific logic
        switch (panelId) {
            case 'dashboard':
                this.updateDashboardStats();
                break;
            case 'ai-planner':
                this.initializeAIPlanner();
                break;
        }
    }

    updateBreadcrumb() {
        const breadcrumbItem = document.getElementById('current-panel-title');
        if (breadcrumbItem) {
            const panelNames = {
                'dashboard': 'Dashboard',
                'ai-planner': 'AI Planner',
                'basics': 'Event Basics',
                'budget': 'Budget',
                'schedule': 'Schedule',
                'tasks': 'Tasks',
                'vendors': 'Vendors',
                'export': 'Export'
            };
            breadcrumbItem.textContent = panelNames[this.currentPanel] || 'Dashboard';
        }
    }

    setTheme(theme) {
        const body = document.body;
        const themes = ['neon', 'pastel', 'midnight', 'gold'];

        // Remove current theme
        themes.forEach(t => body.classList.remove(`theme-${t}`));

        // Add new theme
        body.classList.add(`theme-${theme}`);
        this.currentTheme = theme;

        // Update theme button states
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`.theme-btn[data-theme="${theme}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        Utils.showToast(`Switched to ${theme} theme`, 'success');
        this.savePreferences();
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        this.sidebarCollapsed = !this.sidebarCollapsed;

        if (this.sidebarCollapsed) {
            sidebar.classList.add('collapsed');
        } else {
            sidebar.classList.remove('collapsed');
        }
    }

    toggleMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        this.mobileMenuOpen = !this.mobileMenuOpen;

        if (this.mobileMenuOpen) {
            sidebar.classList.add('open');
        } else {
            sidebar.classList.remove('open');
        }
    }

    closeMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.remove('open');
        this.mobileMenuOpen = false;
    }

    handleGlobalSearch(query) {
        // Real-time search suggestions could be implemented here
        if (query.length > 2) {
            // Show search suggestions
            console.log('Searching for:', query);
        }
    }

    performGlobalSearch(query) {
        if (!query.trim()) return;

        Utils.showToast(`Searching for "${query}"...`, 'info');

        // Implement global search across all panels
        // This would search through event data, tasks, vendors, etc.
        const event = new CustomEvent('globalSearch', { detail: { query } });
        document.dispatchEvent(event);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.triggerSave();
            }

            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('global-search');
                if (searchInput) {
                    searchInput.focus();
                }
            }

            // Alt + number keys for quick panel navigation
            if (e.altKey && e.key >= '1' && e.key <= '8') {
                e.preventDefault();
                const panels = ['dashboard', 'ai-planner', 'basics', 'budget', 'schedule', 'tasks', 'vendors', 'export'];
                const index = parseInt(e.key) - 1;
                if (panels[index]) {
                    this.showPanel(panels[index]);
                }
            }

            // Escape to close mobile menu or go to dashboard
            if (e.key === 'Escape') {
                if (this.mobileMenuOpen) {
                    this.closeMobileMenu();
                } else {
                    this.showPanel('dashboard');
                }
            }

            // Ctrl/Cmd + B to toggle sidebar
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                this.toggleSidebar();
            }
        });
    }

    triggerSave() {
        const event = new CustomEvent('globalSave');
        document.dispatchEvent(event);
        Utils.showToast('Saving changes...', 'info');
    }

    loadSavedPreferences() {
        const preferences = Utils.loadFromLocalStorage('uiPreferences') || {};

        this.currentTheme = preferences.theme || 'neon';
        this.sidebarCollapsed = preferences.sidebarCollapsed || false;

        // Apply saved theme
        this.setTheme(this.currentTheme);

        // Apply sidebar state
        if (this.sidebarCollapsed) {
            document.querySelector('.sidebar').classList.add('collapsed');
        }
    }

    savePreferences() {
        const preferences = {
            theme: this.currentTheme,
            sidebarCollapsed: this.sidebarCollapsed
        };
        Utils.saveToLocalStorage('uiPreferences', preferences);
    }

    initializeThemeButtons() {
        // Set initial active theme button
        const activeBtn = document.querySelector(`.theme-btn[data-theme="${this.currentTheme}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    updateDashboardStats() {
        // Update dashboard statistics
        const stats = {
            basics: this.getCompletionPercentage('basics'),
            budget: this.getCompletionPercentage('budget'),
            schedule: this.getCompletionPercentage('schedule'),
            vendors: this.getCompletionPercentage('vendors')
        };

        Object.keys(stats).forEach(key => {
            const element = document.getElementById(`stats-${key}`);
            if (element) {
                element.textContent = `${stats[key]}%`;
            }
        });
    }

    getCompletionPercentage(section) {
        // This would be implemented to check actual completion status
        // For now, return mock data
        const mockData = {
            basics: 25,
            budget: 0,
            schedule: 0,
            vendors: 0
        };
        return mockData[section] || 0;
    }

    initializeAIPlanner() {
        // Initialize AI planner specific functionality
        const aiInput = document.getElementById('ai-input');
        const aiSendBtn = document.getElementById('ai-send-btn');

        if (aiInput && aiSendBtn) {
            aiSendBtn.addEventListener('click', () => {
                this.sendAIMessage(aiInput.value);
                aiInput.value = '';
            });

            aiInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendAIMessage(aiInput.value);
                    aiInput.value = '';
                }
            });
        }
    }

    sendAIMessage(message) {
        if (!message.trim()) return;

        // Add user message to chat
        this.addChatMessage(message, 'user');

        // Trigger AI processing
        const event = new CustomEvent('aiMessage', { detail: { message } });
        document.dispatchEvent(event);

        Utils.showToast('AI is processing your request...', 'info');
    }

    addChatMessage(message, type = 'user') {
        const chatMessages = document.getElementById('ai-chat-messages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;

        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-${type === 'user' ? 'user' : 'robot'}"></i>
            </div>
            <div class="message-content">
                <div class="message-text">${message}</div>
                <div class="message-time">${new Date().toLocaleTimeString()}</div>
            </div>
        `;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    showModal(modalId) {
        const modal = new bootstrap.Modal(document.getElementById(modalId));
        modal.show();
    }

    hideModal(modalId) {
        const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
        if (modal) {
            modal.hide();
        }
    }

    createToast(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toastId = 'toast-' + Date.now();
        const toastHTML = `
            <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', toastHTML);

        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: duration });
        toast.show();

        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    getCurrentPanel() {
        return this.currentPanel;
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    isSidebarCollapsed() {
        return this.sidebarCollapsed;
    }
}

// Global instance
export const uiManager = new UIManager();
