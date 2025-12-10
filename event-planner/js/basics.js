// AI Event Architect - Event Basics Panel

import { Utils } from './utils.js';
import { planner } from './planner.js';
import { api } from './api-config.js';
import { uiManager } from './ui.js';

export class BasicsManager {
    constructor() {
        this.init();
    }

    init() {
        // Listen for panel shown event
        document.addEventListener('panelShown', (e) => {
            if (e.detail.panelId === 'basics') {
                this.setupBasicsPanel();
            }
        });
        // Re-render when an event is loaded from server
        document.addEventListener('eventLoaded', () => {
            this.setupBasicsPanel();
        });
    }

    setupBasicsPanel() {
        const container = document.getElementById('basics-content');
        if (!container) return;

        const basics = planner.eventState.basics;

        container.innerHTML = `
            <div class="row">
                <div class="col-lg-8">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">
                                <i class="fas fa-info-circle me-2"></i>Event Details
                            </h5>
                        </div>
                        <div class="card-body">
                            <form id="basics-form">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="event-name" class="form-label">Event Name *</label>
                                        <input type="text" class="form-control" id="event-name" value="${basics.name || ''}" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="event-type" class="form-label">Event Type *</label>
                                        <input type="text" class="form-control" id="event-type" value="${basics.type || ''}" placeholder="e.g., Wedding, Corporate Conference, Birthday Party, or Custom Type" required>
                                    </div>
                                </div>

                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="event-date" class="form-label">Event Date *</label>
                                        <input type="date" class="form-control" id="event-date" value="${basics.date || ''}" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="event-attendees" class="form-label">Expected Attendees *</label>
                                        <input type="number" class="form-control" id="event-attendees" value="${basics.attendees || ''}" min="1" max="10000" required>
                                    </div>
                                </div>

                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="event-venue" class="form-label">Venue Type</label>
                                        <input type="text" class="form-control" id="event-venue" value="${basics.venue || ''}" placeholder="e.g., Beach Resort, Conference Center, Home Backyard">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="event-budget" class="form-label">Budget Range</label>
                                        <select class="form-select" id="event-budget">
                                            <option value="">Select budget range...</option>
                                            <option value="$1,000 - $5,000" ${basics.budget === '$1,000 - $5,000' ? 'selected' : ''}>$1,000 - $5,000</option>
                                            <option value="$5,000 - $10,000" ${basics.budget === '$5,000 - $10,000' ? 'selected' : ''}>$5,000 - $10,000</option>
                                            <option value="$10,000 - $25,000" ${basics.budget === '$10,000 - $25,000' ? 'selected' : ''}>$10,000 - $25,000</option>
                                            <option value="$25,000 - $50,000" ${basics.budget === '$25,000 - $50,000' ? 'selected' : ''}>$25,000 - $50,000</option>
                                            <option value="$50,000+" ${basics.budget === '$50,000+' ? 'selected' : ''}>$50,000+</option>
                                            <option value="Flexible" ${basics.budget === 'Flexible' ? 'selected' : ''}>Flexible</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label for="event-location" class="form-label">Location</label>
                                    <input type="text" class="form-control" id="event-location" value="${basics.location || ''}" placeholder="City, State or specific address">
                                </div>

                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="event-duration" class="form-label">Duration</label>
                                        <select class="form-select" id="event-duration">
                                            <option value="">Select duration...</option>
                                            <option value="2-4 hours" ${basics.duration === '2-4 hours' ? 'selected' : ''}>2-4 hours</option>
                                            <option value="4-6 hours" ${basics.duration === '4-6 hours' ? 'selected' : ''}>4-6 hours</option>
                                            <option value="6-8 hours" ${basics.duration === '6-8 hours' ? 'selected' : ''}>6-8 hours</option>
                                            <option value="All day" ${basics.duration === 'All day' ? 'selected' : ''}>All day</option>
                                            <option value="Multiple days" ${basics.duration === 'Multiple days' ? 'selected' : ''}>Multiple days</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="event-theme" class="form-label">Theme/Style</label>
                                        <input type="text" class="form-control" id="event-theme" value="${basics.theme || ''}" placeholder="e.g., Rustic, Modern, Tropical">
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label for="event-description" class="form-label">Event Description</label>
                                    <textarea class="form-control" id="event-description" rows="3" placeholder="Describe your event vision...">${basics.description || ''}</textarea>
                                </div>

                                <div class="d-flex gap-2">
                                    <button type="submit" class="btn btn-primary">
                                        <i class="fas fa-save me-2"></i>Save Changes
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary" id="reset-basics">
                                        <i class="fas fa-undo me-2"></i>Reset
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <div class="col-lg-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">
                                <i class="fas fa-lightbulb me-2"></i>AI Suggestions
                            </h5>
                        </div>
                        <div class="card-body">
                            <div id="ai-suggestions" class="ai-suggestions">
                                <div class="suggestion-item">
                                    <div class="suggestion-icon">
                                        <i class="fas fa-calendar-check"></i>
                                    </div>
                                    <div class="suggestion-content">
                                        <div class="suggestion-title">Complete your event details</div>
                                        <div class="suggestion-text">Fill in all required fields to get personalized AI recommendations</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card mt-3">
                        <div class="card-header">
                            <h5 class="mb-0">
                                <i class="fas fa-chart-line me-2"></i>Progress
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="progress mb-3">
                                <div class="progress-bar" id="basics-progress" role="progressbar" style="width: ${this.getCompletionPercentage()}%"></div>
                            </div>
                            <div class="text-center">
                                <small class="text-muted">${this.getCompletionPercentage()}% Complete</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupFormListeners();
        this.updateAISuggestions();
    }

    setupFormListeners() {
        const form = document.getElementById('basics-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveBasics();
            });
        }

        const resetBtn = document.getElementById('reset-basics');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetBasics();
            });
        }

        // Auto-save on input changes
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.autoSave();
            });
        });
    }

    async saveBasics() {
        const formData = {
            name: document.getElementById('event-name').value.trim(),
            type: document.getElementById('event-type').value,
            date: document.getElementById('event-date').value,
            attendees: parseInt(document.getElementById('event-attendees').value) || 0,
            venue: document.getElementById('event-venue').value,
            budget: document.getElementById('event-budget').value,
            location: document.getElementById('event-location').value.trim(),
            duration: document.getElementById('event-duration').value,
            theme: document.getElementById('event-theme').value.trim(),
            description: document.getElementById('event-description').value.trim()
        };

        // Validate required fields
        if (!formData.name || !formData.type || !formData.date || !formData.attendees) {
            Utils.showToast('Please fill in all required fields', 'warning');
            return;
        }

        planner.updateBasics(formData);
        Utils.showToast('Event basics saved successfully!', 'success');

        // If this event was created on the server, persist updates
        try {
            const storedId = planner.currentEventId || await Utils.loadFromLocalStorage('currentEventId');
            if (storedId) {
                const body = { basics: formData, preview: planner.eventState.aiInsights || {} };
                fetch(api(`/events/${storedId}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
                    .then(res => {
                        if (!res.ok) throw new Error('Failed to save event to server');
                        Utils.showToast('Saved event changes to server', 'success');
                    })
                    .catch(err => {
                        console.warn('Failed to save basics to server', err);
                        Utils.showToast('Could not save to server', 'warning');
                    });
            }
        } catch (err) {
            console.warn('Error persisting basics', err);
        }
        this.updateProgress();
        this.updateAISuggestions();
    }

    resetBasics() {
        if (confirm('Are you sure you want to reset all event basics? This cannot be undone.')) {
            planner.updateBasics({
                name: '',
                type: '',
                attendees: 0,
                date: '',
                venue: '',
                budget: 0,
                location: '',
                duration: '',
                theme: '',
                description: ''
            });

            this.setupBasicsPanel(); // Re-render the form
            Utils.showToast('Event basics reset successfully!', 'warning');
        }
    }

    autoSave() {
        // Debounced auto-save
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            const formData = {
                name: document.getElementById('event-name').value.trim(),
                type: document.getElementById('event-type').value,
                date: document.getElementById('event-date').value,
                attendees: parseInt(document.getElementById('event-attendees').value) || 0,
                venue: document.getElementById('event-venue').value,
                budget: document.getElementById('event-budget').value,
                location: document.getElementById('event-location').value.trim(),
                duration: document.getElementById('event-duration').value,
                theme: document.getElementById('event-theme').value.trim(),
                description: document.getElementById('event-description').value.trim()
            };

            planner.updateBasics(formData);
        }, 1000);
    }

    getCompletionPercentage() {
        const basics = planner.eventState.basics;
        const requiredFields = ['name', 'type', 'date', 'attendees'];
        const optionalFields = ['venue', 'budget', 'location', 'duration', 'theme', 'description'];

        let completed = 0;
        let total = requiredFields.length + optionalFields.length;

        // Check required fields
        requiredFields.forEach(field => {
            if (basics[field] && basics[field] !== '') {
                completed++;
            }
        });

        // Check optional fields
        optionalFields.forEach(field => {
            if (basics[field] && basics[field] !== '') {
                completed++;
            }
        });

        return Math.round((completed / total) * 100);
    }

    updateProgress() {
        const progressBar = document.getElementById('basics-progress');
        if (progressBar) {
            progressBar.style.width = `${this.getCompletionPercentage()}%`;
        }

        const progressText = progressBar.nextElementSibling;
        if (progressText) {
            progressText.textContent = `${this.getCompletionPercentage()}% Complete`;
        }
    }

    updateAISuggestions() {
        const suggestionsContainer = document.getElementById('ai-suggestions');
        if (!suggestionsContainer) return;

        const basics = planner.eventState.basics;
        const suggestions = [];

        if (!basics.name) {
            suggestions.push({
                icon: 'fas fa-tag',
                title: 'Add Event Name',
                text: 'Give your event a memorable name to make planning easier'
            });
        }

        if (!basics.type) {
            suggestions.push({
                icon: 'fas fa-crown',
                title: 'Choose Event Type',
                text: 'Select the type of event to get tailored recommendations'
            });
        }

        if (!basics.date) {
            suggestions.push({
                icon: 'fas fa-calendar-alt',
                title: 'Set Event Date',
                text: 'Pick a date to start planning your timeline'
            });
        }

        if (!basics.attendees) {
            suggestions.push({
                icon: 'fas fa-users',
                title: 'Estimate Attendees',
                text: 'Know your guest count to plan venue and catering'
            });
        }

        if (suggestions.length === 0) {
            suggestions.push({
                icon: 'fas fa-check-circle',
                title: 'Great Start!',
                text: 'Your event basics are complete. Ready to move to the next step?'
            });
        }

        suggestionsContainer.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-item">
                <div class="suggestion-icon">
                    <i class="${suggestion.icon}"></i>
                </div>
                <div class="suggestion-content">
                    <div class="suggestion-title">${suggestion.title}</div>
                    <div class="suggestion-text">${suggestion.text}</div>
                </div>
            </div>
        `).join('');
    }
}

// Global instance
export const basicsManager = new BasicsManager();