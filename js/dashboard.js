// Creative Studio Dashboard JavaScript

class CreativeStudioDashboard {
    constructor() {
        this.currentTool = null;
        this.sidebarCollapsed = false;
        this.backendStatus = {};
        this.tools = {
            'mindmap': {
                name: 'MindMap AI',
                url: '/mindmap-ai/frontend/',
                icon: 'fas fa-brain',
                description: 'Create intelligent mind maps with AI assistance'
            },
            'event-planner': {
                name: 'Event Planner',
                url: '/event-planner/',
                icon: 'fas fa-calendar-alt',
                description: 'Plan and manage events with AI-powered scheduling'
            },
            'certificate': {
                name: 'Certificate Generator',
                url: '/certificate%20generator/certificate.html',
                icon: 'fas fa-certificate',
                description: 'Generate professional certificates and awards'
            },
            'activity-report': {
                name: 'Activity Report',
                url: '/activity-report-generator/',
                icon: 'fas fa-chart-line',
                description: 'Create comprehensive activity reports and analytics'
            },
            'ai-study': {
                name: 'MoodSense+',
                url: '/mood-sense/',
                icon: 'fas fa-heart',
                description: 'AI-powered mood tracking and wellness insights'
            },
            'magazine': {
                name: 'Magazine Maker',
                url: '/magazine/Mag.html',
                icon: 'fas fa-book-open',
                description: 'Design stunning magazines with AI-powered content'
            },
            'todo': {
                name: 'Task Manager',
                url: '/todo.html',
                icon: 'fas fa-tasks',
                description: 'Organize and track your tasks efficiently'
            }
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.enforceSession();
        this.checkBackendStatus();
        this.handleInitialLoad();
        this.setupKeyboardShortcuts();
        this.hideLoadingScreen();
    }

    enforceSession() {
        const hasLocal = !!localStorage.getItem('cs.session');
        const hasCookie = document.cookie.split('; ').some(c => c.startsWith('session=') && c.split('=')[1] === 'true');
        if (!(hasLocal || hasCookie)) {
            window.location.href = '/auth/login.html';
        }
    }

    bindEvents() {
        // Sidebar toggle
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const toolId = link.dataset.tool;
                if (toolId === 'welcome') {
                    this.showWelcome();
                } else if (toolId === 'logout') {
                    this.handleLogout();
                } else {
                    this.loadTool(toolId);
                }
            });
        });

        // Welcome card clicks
        document.querySelectorAll('.welcome-card').forEach(card => {
            card.addEventListener('click', () => {
                const toolId = card.dataset.tool;
                this.loadTool(toolId);
            });
        });

        // Window resize
        window.addEventListener('resize', () => this.handleResize());

        // Hash change
        window.addEventListener('hashchange', () => this.handleHashChange());

        // Back button handling
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.tool) {
                this.loadTool(e.state.tool, false);
            } else {
                this.showWelcome();
            }
        });
    }

    async toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        this.sidebarCollapsed = !this.sidebarCollapsed;

        if (this.sidebarCollapsed) {
            sidebar.classList.add('collapsed');
        } else {
            sidebar.classList.remove('collapsed');
        }

        // Store preference
        await window.AppStorage.save('dashboard/sidebarCollapsed', this.sidebarCollapsed);
    }

    loadTool(toolId, updateHistory = true) {
        if (!this.tools[toolId]) {
            console.error(`Tool ${toolId} not found`);
            return;
        }

        const tool = this.tools[toolId];
        const toolContainer = document.querySelector('.tool-container');
        const welcomeScreen = document.querySelector('.welcome-screen');
        const iframe = toolContainer.querySelector('iframe');

        // Update navigation
        this.updateNavigation(toolId);

        // Hide welcome screen and show tool container
        welcomeScreen.style.display = 'none';
        toolContainer.style.display = 'block';

        // Load tool in iframe
        iframe.src = tool.url;

        // Update current tool
        this.currentTool = toolId;

        // Update URL hash
        if (updateHistory) {
            window.history.pushState({ tool: toolId }, tool.name, `#${toolId}`);
        }

        // Update page title
        document.title = `${tool.name} - Creative Studio`;

        // Handle iframe load
        iframe.onload = () => {
            this.handleIframeLoad(toolId);
        };
    }

    updateNavigation(activeToolId) {
        // Update nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.tool === activeToolId) {
                link.classList.add('active');
            }
        });
    }

    showWelcome() {
        const toolContainer = document.querySelector('.tool-container');
        const welcomeScreen = document.querySelector('.welcome-screen');

        // Hide tool container and show welcome
        toolContainer.style.display = 'none';
        welcomeScreen.style.display = 'flex';

        // Clear current tool
        this.currentTool = null;

        // Update navigation
        this.updateNavigation(null);

        // Update URL
        window.history.pushState(null, 'Creative Studio', window.location.pathname);

        // Update page title
        document.title = 'Creative Studio - Your Creative Workspace';
    }

    handleIframeLoad(toolId) {
        const iframe = document.querySelector('.tool-container iframe');
        const tool = this.tools[toolId];

        try {
            // Attempt to communicate with iframe (if same origin)
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

            // Add tool-specific styling or scripts if needed
            this.applyToolSpecificAdjustments(toolId, iframe);

        } catch (e) {
            // Cross-origin iframe, can't access content
            console.log(`Tool ${toolId} loaded in cross-origin iframe`);
        }
    }

    applyToolSpecificAdjustments(toolId, iframe) {
        // Add any tool-specific adjustments here
        if (toolId === 'ai-study') {
            // MoodSense+ specific adjustments
            iframe.style.height = '100%';
            iframe.style.width = '100%';
            iframe.style.border = 'none';
        }
    }

    async checkBackendStatus() {
        const backends = [
            { name: 'Main Server', url: '/health', id: 'main' }
        ];

        for (const backend of backends) {
            try {
                const response = await fetch(backend.url, { timeout: 5000 });
                this.updateBackendStatus(backend.id, response.ok);
            } catch (error) {
                this.updateBackendStatus(backend.id, false);
            }
        }

        // Check again in 30 seconds
        setTimeout(() => this.checkBackendStatus(), 30000);
    }

    updateBackendStatus(backendId, isOnline) {
        const statusIndicator = document.querySelector(`.status-${backendId} .status-indicator`);
        const statusText = document.querySelector(`.status-${backendId} .status-text`);

        if (statusIndicator) {
            statusIndicator.classList.toggle('online', isOnline);
            statusIndicator.classList.toggle('offline', !isOnline);
        }

        if (statusText) {
            statusText.textContent = isOnline ? 'Online' : 'Offline';
        }

        this.backendStatus[backendId] = isOnline;
    }

    async handleInitialLoad() {
        // Check for URL hash
        const hash = window.location.hash.substring(1);
        if (hash && this.tools[hash]) {
            this.loadTool(hash, false);
        } else {
            this.showWelcome();
        }

        // Restore sidebar state
        try {
            const saved = await window.AppStorage.load('dashboard/sidebarCollapsed');
            const sidebarCollapsed = (saved === true) || (saved === 'true');
            if (sidebarCollapsed) {
                this.sidebarCollapsed = true;
                document.querySelector('.sidebar').classList.add('collapsed');
            }
        } catch {
            const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
            this.sidebarCollapsed = true;
            document.querySelector('.sidebar').classList.add('collapsed');
        }
    }

    async handleLogout() {
        await window.AppStorage.remove('auth/session');
        document.cookie = 'session=false; path=/; max-age=0';
        window.location.href = '/auth/login.html';
    }

    handleHashChange() {
        const hash = window.location.hash.substring(1);
        if (hash && this.tools[hash]) {
            this.loadTool(hash, false);
        } else {
            this.showWelcome();
        }
    }

    handleResize() {
        // Handle mobile sidebar
        if (window.innerWidth <= 768) {
            const sidebar = document.querySelector('.sidebar');
            if (!sidebar.classList.contains('open')) {
                sidebar.style.transform = 'translateX(-100%)';
            }
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + B: Toggle sidebar
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                this.toggleSidebar();
            }

            // Escape: Close tool and show welcome
            if (e.key === 'Escape' && this.currentTool) {
                e.preventDefault();
                this.showWelcome();
            }

            // Alt + number: Quick tool switching
            if (e.altKey && e.key >= '1' && e.key <= '7') {
                e.preventDefault();
                const toolIndex = parseInt(e.key) - 1;
                const toolIds = Object.keys(this.tools);
                if (toolIds[toolIndex]) {
                    this.loadTool(toolIds[toolIndex]);
                }
            }
        });
    }

    hideLoadingScreen() {
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.classList.add('fade-out');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }, 1000);
        }
    }

    // Utility methods
    showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    getToolInfo(toolId) {
        return this.tools[toolId] || null;
    }

    isToolLoaded(toolId) {
        return this.currentTool === toolId;
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.creativeStudio = new CreativeStudioDashboard();
});

// Export for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CreativeStudioDashboard;
}