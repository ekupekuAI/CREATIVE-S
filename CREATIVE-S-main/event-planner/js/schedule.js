// AI Event Architect - Schedule Module (Auto + Manual Schedule with Timeline)

import { Utils } from './utils.js';
import { planner } from './planner.js';
import { uiManager } from './ui.js';

export class ScheduleManager {
    constructor() {
        this.viewMode = 'timeline'; // 'timeline' or 'list'
        this.init();
    }

    init() {
        this.setupSchedulePanel();
        this.renderSchedule();
        this.setupEventListeners();

        // Listen for panel shown event
        document.addEventListener('panelShown', (e) => {
            if (e.detail.panelId === 'schedule') {
                this.renderSchedule();
            }
        });
        // Re-render when an event is loaded from server
        document.addEventListener('eventLoaded', () => {
            this.renderSchedule();
        });
    }

    setupSchedulePanel() {
        const container = document.getElementById('schedule-content');
        if (!container) return;

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3>Event Schedule</h3>
                <div class="d-flex gap-2">
                    <div class="btn-group" role="group">
                        <button class="btn btn-outline-primary btn-sm" id="schedule-mode-auto">AI Auto-Schedule</button>
                        <button class="btn btn-outline-secondary btn-sm" id="schedule-mode-manual">Manual Schedule</button>
                    </div>
                    <button class="btn btn-outline-success btn-sm" data-generate-component="schedule">Regenerate</button>
                </div>
            </div>

            <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="btn-group" role="group">
                    <button class="btn btn-outline-info btn-sm active" id="view-timeline">Timeline View</button>
                    <button class="btn btn-outline-info btn-sm" id="view-list">List View</button>
                </div>
                <button class="btn btn-primary btn-sm" id="add-schedule-item">
                    <i class="fas fa-plus me-2"></i>Add Item
                </button>
            </div>

            <div id="schedule-container">
                <!-- Schedule will be rendered here -->
            </div>
        `;

        this.setMode('auto');
    }

    setupEventListeners() {
        // Mode switching
        document.getElementById('schedule-mode-auto')?.addEventListener('click', () => {
            this.setMode('auto');
        });

        document.getElementById('schedule-mode-manual')?.addEventListener('click', () => {
            this.setMode('manual');
        });

        // View switching
        document.getElementById('view-timeline')?.addEventListener('click', () => {
            this.setViewMode('timeline');
        });

        document.getElementById('view-list')?.addEventListener('click', () => {
            this.setViewMode('list');
        });

        // Add new item
        document.getElementById('add-schedule-item')?.addEventListener('click', () => {
            this.addNewScheduleItem();
        });

        // Global save event
        document.addEventListener('globalSave', () => {
            this.saveSchedule();
        });
    }

    setMode(mode) {
        const autoBtn = document.getElementById('schedule-mode-auto');
        const manualBtn = document.getElementById('schedule-mode-manual');

        if (mode === 'auto') {
            autoBtn.classList.add('active');
            manualBtn.classList.remove('active');
            this.generateAutoSchedule();
        } else {
            manualBtn.classList.add('active');
            autoBtn.classList.remove('active');
            this.renderManualSchedule();
        }
    }

    setViewMode(mode) {
        this.viewMode = mode;
        const timelineBtn = document.getElementById('view-timeline');
        const listBtn = document.getElementById('view-list');

        if (mode === 'timeline') {
            timelineBtn.classList.add('active');
            listBtn.classList.remove('active');
        } else {
            listBtn.classList.add('active');
            timelineBtn.classList.remove('active');
        }

        this.renderSchedule();
    }

    generateAutoSchedule() {
        // Call the API to generate AI-powered schedule
        if (planner.currentEventId) {
            planner.generateComponentForCurrentEvent('schedule').then(() => {
                this.renderSchedule();
                Utils.showToast('AI schedule generated!', 'success');
            }).catch(err => {
                console.error('Failed to generate schedule:', err);
                Utils.showToast('Failed to generate AI schedule', 'error');
            });
        } else {
            Utils.showToast('Please save event basics first', 'warning');
        }
    }

    renderManualSchedule() {
        // Manual mode just shows the current schedule with editing capabilities
        this.renderSchedule();
    }

    renderSchedule() {
        const container = document.getElementById('schedule-container');
        if (!container) return;

        const items = planner.eventState.schedule;

        if (this.viewMode === 'timeline') {
            this.renderTimelineView(container, items);
        } else {
            this.renderListView(container, items);
        }
    }

    renderTimelineView(container, items) {
        container.innerHTML = '<div class="timeline" id="schedule-timeline"></div>';

        const timeline = document.getElementById('schedule-timeline');
        items.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'timeline-item';
            itemDiv.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6>${item.title}</h6>
                        <p class="mb-1">${Utils.formatTime(item.startTime)} - ${Utils.formatTime(item.endTime)}</p>
                        <p class="mb-0">${item.description}</p>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <div class="form-check">
                            <input class="form-check-input schedule-checkbox" type="checkbox" 
                                   data-id="${item.id}" ${item.scheduled ? 'checked' : ''}>
                            <label class="form-check-label small">Scheduled</label>
                        </div>
                        <div>
                            <button class="btn btn-outline-primary btn-sm me-1" data-action="edit" data-index="${index}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm" data-action="delete" data-index="${index}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            timeline.appendChild(itemDiv);
        });

        this.setupTimelineEventListeners();
    }

    renderListView(container, items) {
        container.innerHTML = '<div class="list-group" id="schedule-list"></div>';

        const list = document.getElementById('schedule-list');
        items.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'list-group-item d-flex justify-content-between align-items-center';
            itemDiv.innerHTML = `
                <div class="flex-grow-1">
                    <h6 class="mb-1">${item.title}</h6>
                    <small class="text-muted">${Utils.formatTime(item.startTime)} - ${Utils.formatTime(item.endTime)}</small>
                    <p class="mb-0 mt-1">${item.description}</p>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <div class="form-check">
                        <input class="form-check-input schedule-checkbox" type="checkbox" 
                               data-id="${item.id}" ${item.scheduled ? 'checked' : ''}>
                        <label class="form-check-label small">Scheduled</label>
                    </div>
                    <div>
                        <button class="btn btn-outline-primary btn-sm me-1" data-action="edit" data-index="${index}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" data-action="delete" data-index="${index}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            list.appendChild(itemDiv);
        });

        this.setupListEventListeners();
    }

    setupTimelineEventListeners() {
        document.getElementById('schedule-timeline')?.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.getAttribute('data-action');
            const index = parseInt(target.getAttribute('data-index'));

            if (action === 'edit') {
                this.editScheduleItem(index);
            } else if (action === 'delete') {
                this.deleteScheduleItem(index);
            }
        });

        // Schedule checkbox event listeners
        document.getElementById('schedule-timeline')?.addEventListener('change', (e) => {
            if (e.target.classList.contains('schedule-checkbox')) {
                const itemId = e.target.getAttribute('data-id');
                const isScheduled = e.target.checked;
                this.updateScheduleStatus(itemId, isScheduled);
            }
        });
    }

    setupListEventListeners() {
        document.getElementById('schedule-list')?.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.getAttribute('data-action');
            const index = parseInt(target.getAttribute('data-index'));

            if (action === 'edit') {
                this.editScheduleItem(index);
            } else if (action === 'delete') {
                this.deleteScheduleItem(index);
            }
        });

        // Schedule checkbox event listeners
        document.getElementById('schedule-list')?.addEventListener('change', (e) => {
            if (e.target.classList.contains('schedule-checkbox')) {
                const itemId = e.target.getAttribute('data-id');
                const isScheduled = e.target.checked;
                this.updateScheduleStatus(itemId, isScheduled);
            }
        });
    }

    addNewScheduleItem() {
        const item = {
            title: 'New Activity',
            startTime: '09:00',
            endTime: '10:00',
            description: 'Description of the activity'
        };
        planner.addScheduleItem(item);
        this.renderSchedule();
    }

    editScheduleItem(index) {
        const item = planner.eventState.schedule[index];
        if (!item) return;

        // Simple inline editing - in a real app, use a modal
        const newTitle = prompt('Edit title:', item.title);
        if (newTitle !== null) {
            planner.updateScheduleItem(item.id, { title: newTitle });
            this.renderSchedule();
        }
    }

    deleteScheduleItem(index) {
        const item = planner.eventState.schedule[index];
        if (!item) return;

        if (confirm(`Delete "${item.title}"?`)) {
            planner.removeScheduleItem(item.id);
            this.renderSchedule();
        }
    }

    updateScheduleStatus(itemId, isScheduled) {
        planner.updateScheduleItem(itemId, { scheduled: isScheduled });
        Utils.showToast(`Schedule item ${isScheduled ? 'marked as scheduled' : 'unmarked'}`, 'success');
    }
}

// Global instance
export const scheduleManager = new ScheduleManager();
