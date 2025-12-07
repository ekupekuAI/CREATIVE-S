// AI Event Architect - Budget Module (Auto + Manual Budget with Charts)

import { Utils } from './utils.js';
import { planner } from './planner.js';
import { uiManager } from './ui.js';
import { api } from './api-config.js';

export class BudgetManager {
    constructor() {
        this.chart = null;
        this.mode = 'auto'; // 'auto' or 'manual'
        this.init();
    }

    init() {
        this.setupBudgetPanel();
        this.renderBudget();
        this.setupEventListeners();

        // Listen for panel shown event
        document.addEventListener('panelShown', (e) => {
            if (e.detail.panelId === 'budget') {
                this.renderBudget();
            }
        });
        // Re-render when an event is loaded from server
        document.addEventListener('eventLoaded', () => {
            this.renderBudget();
        });
    }

    setupBudgetPanel() {
        const container = document.getElementById('budget-content');
        if (!container) return;

        const eventName = planner.eventState.basics.name || 'Unnamed Event';

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3>Event Budget</h3>
                    <small class="text-muted">For: <strong>${eventName}</strong></small>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-primary btn-sm" id="budget-ai-suggestions">AI Budget Suggestions</button>
                    <button class="btn btn-outline-secondary btn-sm" id="budget-mode-manual">Manual Budget</button>
                    <button class="btn btn-outline-success btn-sm" data-generate-component="budget" style="display:none;">Regenerate</button>
                </div>
            </div>

            <div id="budget-suggestions" class="mb-4" style="display:none;">
                <div class="card glassmorphism">
                    <div class="card-header">
                        <h5 class="mb-0">AI Budget Suggestions</h5>
                    </div>
                    <div class="card-body">
                        <div id="suggestions-content">
                            <p class="text-muted">Click "AI Budget Suggestions" to generate personalized budget recommendations based on your event details.</p>
                        </div>
                        <div class="d-flex gap-2 mt-3">
                            <button class="btn btn-success btn-sm" id="accept-suggestions" style="display:none;">Accept Suggestions</button>
                            <button class="btn btn-outline-primary btn-sm" id="edit-suggestions" style="display:none;">Edit Manually</button>
                            <button class="btn btn-outline-secondary btn-sm" id="close-suggestions">Close</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-8">
                    <div class="chart-container mb-4">
                        <canvas id="budget-chart"></canvas>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card glassmorphism">
                        <div class="card-body">
                            <h5 class="card-title">Budget Summary</h5>
                            <div id="budget-summary">
                                <p>Total Budget: <span id="total-budget">$0</span></p>
                                <p>Allocated: <span id="allocated-budget">$0</span></p>
                                <p>Remaining: <span id="remaining-budget">$0</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="budget-controls" class="mt-4" style="display:none;">
                <!-- Controls will be rendered here -->
            </div>
        `;

        this.setupChart();
    }

    setupChart() {
        const ctx = document.getElementById('budget-chart');
        if (!ctx) return;

        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                    ],
                    borderWidth: 2,
                    borderColor: 'rgba(255, 255, 255, 0.8)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = Utils.formatCurrency(context.parsed);
                                const percentage = context.dataset.data.length > 0 ?
                                    ((context.parsed / context.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });
    }

    setupEventListeners() {
        // AI Suggestions
        document.getElementById('budget-ai-suggestions')?.addEventListener('click', () => {
            this.showAISuggestions();
        });

        // Accept suggestions
        document.getElementById('accept-suggestions')?.addEventListener('click', () => {
            this.acceptSuggestions();
        });

        // Edit suggestions
        document.getElementById('edit-suggestions')?.addEventListener('click', () => {
            this.editSuggestions();
        });

        // Close suggestions
        document.getElementById('close-suggestions')?.addEventListener('click', () => {
            this.closeSuggestions();
        });

        // Manual Budget
        document.getElementById('budget-mode-manual')?.addEventListener('click', () => {
            this.showManualBudget();
        });

        // Global save event
        document.addEventListener('globalSave', () => {
            this.saveBudget();
        });
    }

    showAISuggestions() {
        const suggestionsDiv = document.getElementById('budget-suggestions');
        const content = document.getElementById('suggestions-content');
        const acceptBtn = document.getElementById('accept-suggestions');
        const editBtn = document.getElementById('edit-suggestions');

        content.innerHTML = '<p class="text-muted">Generating AI budget suggestions...</p>';
        suggestionsDiv.style.display = 'block';

        // Call the server to generate budget
        planner.generateComponentForCurrentEvent('budget').then(result => {
            if (result && result.data && result.data.budget_items) {
                const items = result.data.budget_items;
                content.innerHTML = `
                    <div class="mb-3">
                        <h6>Total Budget: $${result.data.total_budget.toLocaleString()}</h6>
                        <ul class="list-group">
                            ${items.map(item => `
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    ${item.category}
                                    <span class="badge bg-primary rounded-pill">$${item.amount.toLocaleString()} (${item.percentage}%)</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
                acceptBtn.style.display = 'inline-block';
                editBtn.style.display = 'inline-block';
                this.currentSuggestions = items;
            } else {
                content.innerHTML = '<p class="text-danger">Failed to generate suggestions. Try again.</p>';
            }
        }).catch(err => {
            content.innerHTML = '<p class="text-danger">Error generating suggestions.</p>';
            console.error(err);
        });
    }

    acceptSuggestions() {
        if (this.currentSuggestions) {
            planner.eventState.budget = this.currentSuggestions.map(item => ({
                id: Utils.generateId(),
                category: item.category,
                amount: item.amount,
                description: item.notes || '',
                arranged: false // Add arranged status
            }));
            this.renderBudget();
            this.closeSuggestions();
            Utils.showToast('Budget suggestions accepted!', 'success');
            // Trigger save to server
            document.dispatchEvent(new Event('globalSave'));
        }
    }

    editSuggestions() {
        if (this.currentSuggestions) {
            planner.eventState.budget = this.currentSuggestions.map(item => ({
                id: Utils.generateId(),
                category: item.category,
                amount: item.amount,
                description: item.notes || ''
            }));
            this.closeSuggestions();
            this.showManualBudget();
            Utils.showToast('Suggestions loaded for editing', 'info');
        }
    }

    closeSuggestions() {
        document.getElementById('budget-suggestions').style.display = 'none';
        document.getElementById('accept-suggestions').style.display = 'none';
        document.getElementById('edit-suggestions').style.display = 'none';
        this.currentSuggestions = null;
    }

    showManualBudget() {
        document.getElementById('budget-controls').style.display = 'block';
        this.renderManualControls();
    }

    generateAutoBudget() {
        const basics = planner.eventState.basics;
        const attendees = basics.attendees || 100;
        const eventType = basics.type || 'general';

        // Base costs per attendee
        const baseCosts = {
            venue: attendees < 50 ? 2000 : attendees < 200 ? 5000 : 15000,
            catering: attendees * 25, // $25 per person
            decor: attendees * 5, // $5 per person
            entertainment: attendees < 100 ? 1000 : attendees < 500 ? 3000 : 8000,
            marketing: attendees * 2, // $2 per person
            staff: attendees < 100 ? 500 : attendees < 500 ? 1500 : 3000,
            miscellaneous: attendees * 3 // $3 per person
        };

        // Adjust for event type
        const typeMultipliers = {
            'wedding': 1.5,
            'corporate conference': 1.2,
            'birthday party': 0.8,
            'tech conference': 1.3,
            'music festival': 2.0,
            'charity gala': 1.4
        };

        const multiplier = typeMultipliers[eventType.toLowerCase()] || 1.0;

        // Clear existing budget
        planner.eventState.budget = [];

        // Add adjusted costs
        Object.entries(baseCosts).forEach(([category, amount]) => {
            planner.addBudgetItem({
                category: Utils.capitalizeFirst(category),
                amount: Math.round(amount * multiplier),
                description: `Auto-generated for ${attendees} attendees`,
                arranged: false
            });
        });

        this.renderBudget();
        Utils.showToast('AI budget generated!', 'success');
    }

    renderManualControls() {
        const controls = document.getElementById('budget-controls');
        if (!controls) return;

        controls.innerHTML = `
            <div class="card glassmorphism">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Manual Budget Items</h5>
                    <button class="btn btn-primary btn-sm" id="save-manual-budget">Save Budget</button>
                </div>
                <div class="card-body">
                    <div id="budget-items-list" class="mb-3">
                        <!-- Items will be rendered here -->
                    </div>
                    <button class="btn btn-primary" id="add-budget-item">
                        <i class="fas fa-plus me-2"></i>Add Budget Item
                    </button>
                </div>
            </div>
        `;

        this.renderBudgetItems();
        this.setupManualEventListeners();
    }

    renderBudgetItems() {
        const list = document.getElementById('budget-items-list');
        if (!list) return;

        const items = planner.eventState.budget;
        list.innerHTML = '';

        if (items.length === 0) {
            list.innerHTML = '<p class="text-muted">No budget items yet. Add your first item below.</p>';
            return;
        }

        items.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = `budget-item d-flex align-items-center mb-2 p-2 border rounded ${item.arranged ? 'bg-success bg-opacity-10 border-success' : ''}`;
            itemDiv.innerHTML = `
                <div class="flex-grow-1">
                    <input type="text" class="form-control form-control-sm mb-1" value="${item.category}" data-field="category" data-index="${index}">
                    <input type="number" class="form-control form-control-sm" value="${item.amount}" data-field="amount" data-index="${index}" step="0.01">
                </div>
                <div class="d-flex align-items-center ms-2">
                    <div class="form-check me-2">
                        <input class="form-check-input" type="checkbox" ${item.arranged ? 'checked' : ''} data-field="arranged" data-index="${index}" id="arranged-${index}">
                        <label class="form-check-label small" for="arranged-${index}">
                            Arranged
                        </label>
                    </div>
                    <button class="btn btn-outline-danger btn-sm" data-action="delete" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            list.appendChild(itemDiv);
        });
    }

    setupManualEventListeners() {
        // Save manual budget
        document.getElementById('save-manual-budget')?.addEventListener('click', () => {
            this.saveManualBudget();
        });

        // Add new item
        document.getElementById('add-budget-item')?.addEventListener('click', () => {
            planner.addBudgetItem({
                category: 'New Item',
                amount: 0,
                description: '',
                arranged: false
            });
            this.renderBudgetItems();
            this.renderBudget();
        });

        // Handle item changes
        document.getElementById('budget-items-list')?.addEventListener('change', (e) => {
            const target = e.target;
            const index = parseInt(target.getAttribute('data-index'));
            const field = target.getAttribute('data-field');

            if (field && index >= 0) {
                const updates = {};
                if (field === 'amount') {
                    updates[field] = parseFloat(target.value) || 0;
                } else if (field === 'arranged') {
                    updates[field] = target.checked;
                } else {
                    updates[field] = target.value;
                }
                planner.updateBudgetItem(planner.eventState.budget[index].id, updates);
                this.renderBudgetItems();
                this.renderBudget();
                this.updateArrangedPercentage();
            }
        });

        // Handle delete
        document.getElementById('budget-items-list')?.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="delete"]')) {
                const index = parseInt(e.target.closest('[data-action="delete"]').getAttribute('data-index'));
                const itemId = planner.eventState.budget[index].id;
                planner.removeBudgetItem(itemId);
                this.renderBudgetItems();
                this.renderBudget();
            }
        });
    }

    renderBudget() {
        if (!this.chart) return;

        const items = planner.eventState.budget;
        const labels = items.map(item => item.category);
        const data = items.map(item => item.amount);

        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = data;
        this.chart.update();

        this.updateBudgetSummary();
    }

    updateBudgetSummary() {
        const basics = planner.eventState.basics;
        const total = basics.budget ? this.parseBudgetRange(basics.budget) : planner.getTotalBudget();
        const allocated = planner.getTotalBudget();
        const remaining = total - allocated;
        const arrangedPercentage = this.getArrangedPercentage();

        document.getElementById('total-budget').textContent = Utils.formatCurrency(total);
        document.getElementById('allocated-budget').textContent = Utils.formatCurrency(allocated);
        document.getElementById('remaining-budget').textContent = Utils.formatCurrency(remaining);

        // Update arranged percentage display
        let arrangedEl = document.getElementById('arranged-budget');
        if (!arrangedEl) {
            const summaryDiv = document.getElementById('budget-summary');
            arrangedEl = document.createElement('p');
            arrangedEl.id = 'arranged-budget';
            summaryDiv.appendChild(arrangedEl);
        }
        arrangedEl.textContent = `Arranged: ${arrangedPercentage.toFixed(1)}%`;

        // Color coding
        const remainingEl = document.getElementById('remaining-budget');
        if (remaining < 0) {
            remainingEl.style.color = 'var(--danger-color)';
        } else if (remaining < total * 0.1) {
            remainingEl.style.color = 'var(--warning-color)';
        } else {
            remainingEl.style.color = 'var(--success-color)';
        }

        // Update dashboard
        this.updateDashboardArrangedPercentage(arrangedPercentage);
    }

    getArrangedPercentage() {
        const items = planner.eventState.budget;
        if (items.length === 0) return 0;

        const arrangedAmount = items
            .filter(item => item.arranged)
            .reduce((sum, item) => sum + (item.amount || 0), 0);

        const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);

        return totalAmount > 0 ? (arrangedAmount / totalAmount) * 100 : 0;
    }

    updateArrangedPercentage() {
        const percentage = this.getArrangedPercentage();
        this.updateDashboardArrangedPercentage(percentage);
    }

    updateDashboardArrangedPercentage(percentage) {
        // Update the dashboard budget progress to show arranged percentage
        const budgetStat = document.getElementById('stats-budget');
        if (budgetStat) {
            const currentText = budgetStat.textContent;
            const percentageOnly = currentText.replace('%', '');
            budgetStat.textContent = `${percentageOnly}% (${percentage.toFixed(0)}% arranged)`;
        }
    }

    parseBudgetRange(range) {
        if (!range) return 0;
        const numbers = range.match(/\d+/g);
        if (numbers && numbers.length >= 2) {
            return (parseInt(numbers[0]) + parseInt(numbers[1])) / 2;
        } else if (numbers && numbers.length === 1) {
            return parseInt(numbers[0]);
        }
        return 0;
    }

    saveManualBudget() {
        const currentId = planner.currentEventId;
        if (!currentId) {
            Utils.showToast('No event loaded to save budget', 'warning');
            return;
        }

        const budgetData = {
            total_budget: planner.getTotalBudget(),
            budget_items: planner.eventState.budget.map(item => ({
                category: item.category,
                name: item.category,
                amount: item.amount,
                percentage: 0, // Will be calculated on server if needed
                notes: item.description
            }))
        };

        fetch(api(`/events/${currentId}`), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                basics: planner.eventState.basics,
                preview: planner.eventState.aiInsights || {},
                components: {
                    ...planner.eventState, // Include other components
                    budget: budgetData
                }
            })
        }).then(res => {
            if (res.ok) {
                Utils.showToast('Manual budget saved successfully!', 'success');
            } else {
                throw new Error('Save failed');
            }
        }).catch(err => {
            Utils.showToast('Failed to save budget', 'error');
            console.error(err);
        });
    }
}

// Global instance
export const budgetManager = new BudgetManager();
