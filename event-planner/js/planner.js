// AI Event Architect - Core Planner State Manager

import { Utils } from './utils.js';
import { api } from './api-config.js';

export class EventPlanner {
    constructor() {
        this.eventState = {
            basics: {
                name: '',
                type: '',
                attendees: 0,
                date: '',
                venue: '',
                budget: 0
            },
            budget: [],
            schedule: [],
            checklist: [],
            vendors: [],
            aiInsights: {}
        };
        this.currentEventId = null;
        this.loadState();
        this.setupAutoSave();
        // If a currentEventId was saved previously, try to load it
        this.loadCurrentEventIfNeeded();
    }

    loadState() {
        const saved = Utils.loadFromLocalStorage('eventPlannerState');
        if (saved) {
            this.eventState = { ...this.eventState, ...saved };
        }
    }

    saveState() {
        Utils.saveToLocalStorage('eventPlannerState', this.eventState);
        Utils.showToast('Event saved successfully!', 'success');
    }

    setCurrentEventId(id) {
        this.currentEventId = id;
        Utils.saveToLocalStorage('currentEventId', id);
    }

    async loadEventById(id) {
        try {
            const res = await fetch(api(`/events/${id}`));
            if (!res.ok) throw new Error('Failed to load event');
            const data = await res.json();
            // Apply basics
            if (data.basics) this.updateBasics(data.basics);
            // Apply preview if present
            if (data.preview) this.updateAIInsights(data.preview);
            // Apply components if present
            if (data.components) {
                if (data.components.budget && data.components.budget.budget_items) {
                    // clear existing budget and set
                    this.eventState.budget = [];
                    data.components.budget.budget_items.forEach(item => this.addBudgetItem(item));
                }
                if (data.components.schedule && data.components.schedule.schedule_items) {
                    this.eventState.schedule = [];
                    data.components.schedule.schedule_items.forEach(item => this.addScheduleItem(item));
                }
                if (data.components.tasks && data.components.tasks.task_list) {
                    this.eventState.checklist = [];
                    data.components.tasks.task_list.forEach(t => this.addTask(t));
                }
                if (data.components.vendors && data.components.vendors.vendor_recommendations) {
                    this.eventState.vendors = [];
                    data.components.vendors.vendor_recommendations.forEach(v => this.addVendor(v));
                }
            }
            this.setCurrentEventId(id);
            Utils.showToast('Event loaded from server', 'success');
            // Notify UI that an event was loaded so panels can re-render
            const evt = new CustomEvent('eventLoaded', { detail: { id } });
            document.dispatchEvent(evt);
            return data;
        } catch (err) {
            console.error('loadEventById error', err);
            Utils.showToast('Failed to load event from server', 'error');
            throw err;
        }
    }

    async loadCurrentEventIfNeeded() {
        try {
            const stored = Utils.loadFromLocalStorage('currentEventId');
            if (stored && !this.currentEventId) {
                await this.loadEventById(stored);
            }
        } catch (err) {
            console.warn('Could not auto-load current event', err);
        }
    }

    async generateComponentForCurrentEvent(component) {
        if (!this.currentEventId) throw new Error('No current event selected');
        if (component === 'schedule') {
            // Use main server's AI for schedule
            const res = await fetch('/ai/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ basics: this.eventState.basics })
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`Schedule generation failed: ${txt}`);
            }
            const payload = await res.json();
            if (payload && payload.data && payload.data.schedule_items) {
                this.eventState.schedule = [];
                payload.data.schedule_items.forEach(item => this.addScheduleItem({
                    title: item.title,
                    startTime: item.start_time,
                    endTime: item.end_time,
                    description: item.description
                }));
                // Save to server after generation
                await this.saveEventToServer();
            }
            Utils.showToast(`${component} generated for event`, 'success');
            return payload;
        } else if (component === 'tasks') {
            // Use main server's AI for tasks with integrated data
            const res = await fetch('/ai/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    basics: this.eventState.basics,
                    schedule: this.eventState.schedule,
                    budget: this.eventState.budget
                })
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`Tasks generation failed: ${txt}`);
            }
            const payload = await res.json();
            if (payload && payload.data && payload.data.tasks) {
                this.eventState.checklist = [];
                payload.data.tasks.forEach(task => this.addTask({
                    title: task.title,
                    category: task.category,
                    priority: task.priority
                }));
                // Save to server after generation
                await this.saveEventToServer();
            }
            Utils.showToast(`${component} generated for event`, 'success');
            return payload;
        } else {
            // Use backend for other components
            const res = await fetch(api(`/events/${this.currentEventId}/generate/${component}`), { method: 'POST' });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`Generation failed: ${txt}`);
            }
            const payload = await res.json();
            if (payload && payload.data) {
                // Apply components similarly to load
                const data = payload.data;
                if (component === 'budget' && data.budget_items) {
                    this.eventState.budget = [];
                    data.budget_items.forEach(item => this.addBudgetItem(item));
                    // Save to server after generation
                    await this.saveEventToServer();
                }
                if (component === 'vendors' && data.vendor_recommendations) {
                    this.eventState.vendors = [];
                    data.vendor_recommendations.forEach(v => this.addVendor(v));
                    // Save to server after generation
                    await this.saveEventToServer();
                }
                Utils.showToast(`${component} generated for event`, 'success');
                return payload;
            }
            return null;
        }
    }

    setupAutoSave() {
        // Auto-save every 5 seconds when data changes
        let saveTimeout;
        const autoSave = Utils.debounce(() => {
            this.saveState();
        }, 5000);

        // Watch for changes in the state
        this.watchState(autoSave);
    }

    watchState(callback) {
        // Simple state watcher - in a real app, use a proper state management library
        const handler = {
            set: (target, property, value) => {
                target[property] = value;
                callback();
                return true;
            }
        };

        // Proxy the main state object
        this.eventState = new Proxy(this.eventState, handler);

        // Also proxy nested objects
        Object.keys(this.eventState).forEach(key => {
            if (Array.isArray(this.eventState[key])) {
                this.eventState[key] = new Proxy(this.eventState[key], {
                    set: (target, property, value) => {
                        target[property] = value;
                        callback();
                        return true;
                    }
                });
            } else if (typeof this.eventState[key] === 'object' && this.eventState[key] !== null) {
                this.eventState[key] = new Proxy(this.eventState[key], handler);
            }
        });
    }

    updateBasics(basics) {
        this.eventState.basics = { ...this.eventState.basics, ...basics };
    }

    addBudgetItem(item) {
        this.eventState.budget.push({
            id: Utils.generateId(),
            category: item.category || '',
            amount: item.amount || 0,
            description: item.description || item.notes || '',
            arranged: item.arranged || false,
            createdAt: new Date().toISOString()
        });
    }

    updateBudgetItem(id, updates) {
        const index = this.eventState.budget.findIndex(item => item.id === id);
        if (index !== -1) {
            this.eventState.budget[index] = { ...this.eventState.budget[index], ...updates };
        }
    }

    removeBudgetItem(id) {
        this.eventState.budget = this.eventState.budget.filter(item => item.id !== id);
    }

    getTotalBudget() {
        return this.eventState.budget.reduce((total, item) => total + (item.amount || 0), 0);
    }

    addScheduleItem(item) {
        this.eventState.schedule.push({
            id: Utils.generateId(),
            ...item,
            scheduled: item.scheduled || false,
            createdAt: new Date().toISOString()
        });
        this.eventState.schedule.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    }

    updateScheduleItem(id, updates) {
        const index = this.eventState.schedule.findIndex(item => item.id === id);
        if (index !== -1) {
            this.eventState.schedule[index] = { ...this.eventState.schedule[index], ...updates };
            this.eventState.schedule.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        }
    }

    removeScheduleItem(id) {
        this.eventState.schedule = this.eventState.schedule.filter(item => item.id !== id);
    }

    addTask(task) {
        this.eventState.checklist.push({
            id: Utils.generateId(),
            ...task,
            completed: false,
            createdAt: new Date().toISOString()
        });
    }

    updateTask(id, updates) {
        const index = this.eventState.checklist.findIndex(task => task.id === id);
        if (index !== -1) {
            this.eventState.checklist[index] = { ...this.eventState.checklist[index], ...updates };
        }
    }

    removeTask(id) {
        this.eventState.checklist = this.eventState.checklist.filter(task => task.id !== id);
    }

    getCompletedTasksCount() {
        return this.eventState.checklist.filter(task => task.completed).length;
    }

    getTotalTasksCount() {
        return this.eventState.checklist.length;
    }

    addVendor(vendor) {
        this.eventState.vendors.push({
            id: Utils.generateId(),
            ...vendor,
            createdAt: new Date().toISOString()
        });
    }

    updateVendor(id, updates) {
        const index = this.eventState.vendors.findIndex(vendor => vendor.id === id);
        if (index !== -1) {
            this.eventState.vendors[index] = { ...this.eventState.vendors[index], ...updates };
        }
    }

    removeVendor(id) {
        this.eventState.vendors = this.eventState.vendors.filter(vendor => vendor.id !== id);
    }

    updateAIInsights(insights) {
        this.eventState.aiInsights = { ...this.eventState.aiInsights, ...insights };
    }

    exportData() {
        return Utils.deepClone(this.eventState);
    }

    importData(data) {
        this.eventState = { ...this.eventState, ...data };
        this.saveState();
    }

    async saveEventToServer() {
        if (!this.currentEventId) return;
        try {
            const eventData = {
                basics: this.eventState.basics,
                preview: this.eventState.aiInsights || {},
                components: {
                    budget: {
                        total_budget: this.getTotalBudget(),
                        budget_items: this.eventState.budget.map(item => ({
                            category: item.category,
                            name: item.category,
                            amount: item.amount,
                            percentage: 0, // Can calculate if needed
                            notes: item.description,
                            arranged: item.arranged
                        }))
                    },
                    schedule: {
                        schedule_items: this.eventState.schedule.map(item => ({
                            title: item.title,
                            start_time: item.startTime,
                            end_time: item.endTime,
                            description: item.description,
                            scheduled: item.scheduled
                        }))
                    },
                    tasks: {
                        task_list: this.eventState.checklist.map(task => ({
                            title: task.title,
                            category: task.category,
                            priority: task.priority,
                            completed: task.completed
                        }))
                    },
                    vendors: {
                        vendor_recommendations: this.eventState.vendors
                    }
                }
            };
            const res = await fetch(api(`/events/${this.currentEventId}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData)
            });
            if (!res.ok) {
                throw new Error('Save failed');
            }
            Utils.showToast('Event saved to server!', 'success');
        } catch (err) {
            console.error('saveEventToServer error', err);
            Utils.showToast('Failed to save to server', 'error');
        }
    }
}

// Global instance
export const planner = new EventPlanner();
