// AI Event Architect - AI Conversation + Guided Intake System

import { Utils } from './utils.js';
import { planner } from './planner.js';
import { uiManager } from './ui.js';
import { api } from './api-config.js';

// Runtime safeguard: if Utils.delay isn't available (old cached utils.js), add a fallback.
if (!Utils.delay || typeof Utils.delay !== 'function') {
    Utils.delay = function(ms) { return new Promise(resolve => setTimeout(resolve, ms)); };
}

export class AIAssistant {
    constructor() {
        this.conversation = [];
        this.currentStep = 'idea'; // idea, questions, generate, review
        this.eventData = {};
        this.analyzedData = null;
        this.questions = [
            {
                id: 'event_type',
                question: "What type of event are you planning?",
                type: 'select',
                options: ['Wedding', 'Corporate Conference', 'Birthday Party', 'Tech Conference', 'Music Festival', 'Charity Gala', 'Other'],
                required: true
            },
            {
                id: 'attendees',
                question: "How many people do you expect to attend?",
                type: 'number',
                validation: (value) => value > 0 && value <= 10000,
                required: true
            },
            {
                id: 'budget',
                question: "What's your approximate budget range?",
                type: 'select',
                options: ['$1,000 - $5,000', '$5,000 - $10,000', '$10,000 - $25,000', '$25,000 - $50,000', '$50,000+', 'Flexible'],
                required: true
            },
            {
                id: 'date',
                question: "When is the event scheduled for?",
                type: 'date',
                required: true
            },
            {
                id: 'venue_type',
                question: "What type of venue are you considering?",
                type: 'select',
                options: ['Hotel Ballroom', 'Conference Center', 'Outdoor Park', 'Restaurant', 'Home/Backyard', 'Stadium/Arena', 'Other'],
                required: false
            },
            {
                id: 'location',
                question: "Where will the event take place?",
                type: 'text',
                required: true
            },
            {
                id: 'duration',
                question: "How long will the event last?",
                type: 'select',
                options: ['2-4 hours', '4-6 hours', 'All day', 'Multiple days'],
                required: false
            },
            {
                id: 'special_requirements',
                question: "Any special requirements or themes?",
                type: 'textarea',
                required: false
            }
        ];
        this.currentQuestionIndex = 0;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeChat();
    }

    setupEventListeners() {
        // Listen for AI message events from UI
        document.addEventListener('aiMessage', (e) => {
            this.handleUserMessage(e.detail.message);
        });

        // Listen for panel shown events
        document.addEventListener('panelShown', (e) => {
            if (e.detail.panelId === 'ai-planner') {
                this.scrollToBottom();
            }
        });

        // Clear chat button
        const clearBtn = document.getElementById('ai-clear-chat');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearChat();
            });
        }

        // Generate plan button
        const generateBtn = document.getElementById('ai-generate-plan');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generateCompletePlan();
            });
        }
    }

    initializeChat() {
        this.addAIMessage('Hello! I\'m your AI Event Architect. Describe your event idea, and I\'ll help you plan it perfectly. What kind of event are you thinking of?');
        this.updateProgressStep('idea');
    }

    handleUserMessage(message) {
        this.addUserMessage(message);

        switch (this.currentStep) {
            case 'idea':
                this.analyzeIdea(message);
                break;
            case 'questions':
                this.processQuestionAnswer(message);
                break;
            case 'generate':
                this.handleGenerationFeedback(message);
                break;
            case 'review':
                this.handleReviewFeedback(message);
                break;
        }
    }

    async analyzeIdea(idea) {
        try {
            uiManager.createToast('AI is analyzing your idea...', 'info');

            // Build basics payload from any data we already have
            this.eventData = { ...this.eventData, description: idea };
            const basics = {
                name: this.eventData.name || '',
                type: this.eventData.event_type || this.eventData.type || '',
                date: this.eventData.date || null,
                attendees: this.eventData.attendees || null,
                duration: this.eventData.duration || null,
                description: this.eventData.description || idea
            };

            const res = await fetch(api('/ai/plan'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(basics)
            });

            if (!res.ok) throw new Error('AI analysis request failed');
            const payload = await res.json();

            // payload.data contains preview, missing_fields, questions
            const data = payload && payload.data ? payload.data : {};
            this.analyzedData = { preview: data.preview || {} };

            // If there are follow-up questions, present them
            if (data.missing_fields && data.missing_fields.length > 0) {
                this.questions = (data.questions || []).map(q => ({ id: q.field, question: q.question, required: true }));
                this.currentQuestionIndex = 0;
                this.updateProgressStep('questions');
                this.currentStep = 'questions';
                this.addAIMessage('I have a few follow-up questions to complete the plan.');
                this.askNextQuestion();
                return;
            }

            // No missing fields — show preview and offer to add event
            const preview = data.preview || {};
            this.eventData = { ...this.eventData, ...preview };
            this.analyzedData.preview = preview;

            this.addAIMessage('Great — I generated an initial plan preview for your event. Would you like me to add this event to your planner?');
            // Offer Add Event button in chat
            uiManager.addChatMessage(`<button id="ai-add-event-btn" class="btn btn-primary">Add this event</button>`, 'ai');

            // Attach listener for the Add button
            setTimeout(() => {
                const addBtn = document.getElementById('ai-add-event-btn');
                if (addBtn) {
                    addBtn.addEventListener('click', async () => {
                        try {
                            uiManager.createToast('Creating event...', 'info');
                            const body = { basics: basics, preview: preview };
                            const r = await fetch(api('/events'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                            if (!r.ok) throw new Error('Failed to create event');
                            const created = await r.json();
                            const eventId = created.id;
                            // Load event into planner
                            await planner.loadEventById(eventId);
                            uiManager.createToast('Event added and loaded', 'success');
                            // Navigate to basics panel for review
                            uiManager.showPanel('basics');
                        } catch (err) {
                            console.error('Add event failed', err);
                            uiManager.createToast('Failed to add event', 'danger');
                        }
                    });
                }
            }, 200);

            this.updateProgressStep('review');
            this.currentStep = 'review';

        } catch (error) {
            console.error('AI Analysis failed:', error);
            this.addAIMessage('I\'m having trouble analyzing your idea right now. Let\'s try asking you some questions directly instead.');
            this.updateProgressStep('questions');
            this.currentStep = 'questions';
            this.askNextQuestion();
        }
    }

    async mockAnalyzeIdea(idea) {
        // Simulate AI analysis - replace with actual API call
        await Utils.delay(2000); // Simulate processing time

        const lowerIdea = idea.toLowerCase();

        let eventType = 'Other';
        if (lowerIdea.includes('wedding')) eventType = 'Wedding';
        else if (lowerIdea.includes('conference') || lowerIdea.includes('corporate')) eventType = 'Corporate Conference';
        else if (lowerIdea.includes('birthday')) eventType = 'Birthday Party';
        else if (lowerIdea.includes('tech') || lowerIdea.includes('technology')) eventType = 'Tech Conference';
        else if (lowerIdea.includes('music') || lowerIdea.includes('festival')) eventType = 'Music Festival';
        else if (lowerIdea.includes('charity') || lowerIdea.includes('gala')) eventType = 'Charity Gala';

        const attendees = this.extractNumber(idea) || null;
        const budget = this.extractBudget(idea);

        return {
            extractedInfo: {
                eventType,
                attendees,
                budget,
                description: idea
            },
            suggestions: {
                timeline: '3-6 months preparation recommended',
                keyConsiderations: ['Venue selection', 'Budget allocation', 'Guest list management']
            },
            confidence: 0.85
        };
    }

    extractNumber(text) {
        const matches = text.match(/\d+/);
        return matches ? parseInt(matches[0]) : null;
    }

    extractBudget(text) {
        const budgetKeywords = {
            'thousand': 1000,
            'k': 1000,
            'grand': 1000,
            'ten thousand': 10000,
            'twenty': 20000,
            'thirty': 30000,
            'fifty': 50000
        };

        for (const [keyword, multiplier] of Object.entries(budgetKeywords)) {
            if (text.toLowerCase().includes(keyword)) {
                const numbers = text.match(/\d+/);
                if (numbers) {
                    return parseInt(numbers[0]) * multiplier;
                }
            }
        }
        return null;
    }

    askNextQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.finishQuestions();
            return;
        }

        const question = this.questions[this.currentQuestionIndex];
        let message = question.question;

        if (question.options) {
            message += '\n\nOptions: ' + question.options.join(', ');
        }

        this.addAIMessage(message);
    }

    processQuestionAnswer(answer) {
        const currentQuestion = this.questions[this.currentQuestionIndex];

        // Validate answer if needed
        if (currentQuestion.validation && !currentQuestion.validation(answer)) {
            this.addAIMessage('That doesn\'t seem right. Please provide a valid response.');
            return;
        }

        // Store answer
        this.eventData[currentQuestion.id] = answer;

        this.currentQuestionIndex++;

        if (this.currentQuestionIndex >= this.questions.length) {
            this.finishQuestions();
        } else {
            setTimeout(() => this.askNextQuestion(), 500);
        }
    }

    finishQuestions() {
        this.addAIMessage('Perfect! I have all the information I need. Let me generate your complete event plan...');

        this.updateProgressStep('generate');
        this.currentStep = 'generate';

        setTimeout(async () => {
            try {
                const basics = {
                    name: this.eventData.name || '',
                    type: this.eventData.event_type || this.eventData.type || '',
                    date: this.eventData.date || null,
                    attendees: this.eventData.attendees || null,
                    duration: this.eventData.duration || null,
                    description: this.eventData.description || ''
                };

                            const res = await fetch(api('/ai/plan'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(basics) });
                if (!res.ok) throw new Error('AI plan request failed');
                const payload = await res.json();
                const data = payload && payload.data ? payload.data : {};
                const preview = data.preview || {};
                this.analyzedData.preview = preview;

                this.addAIMessage('I\'ve generated a preview based on your answers. Would you like to add this event to your planner?');
                uiManager.addChatMessage(`<button id="ai-add-event-btn" class="btn btn-primary">Add this event</button>`, 'ai');

                setTimeout(() => {
                    const addBtn = document.getElementById('ai-add-event-btn');
                    if (addBtn) {
                        addBtn.addEventListener('click', async () => {
                            try {
                                uiManager.createToast('Creating event...', 'info');
                                const body = { basics: basics, preview: preview };
                                const r = await fetch(api('/events'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                                if (!r.ok) throw new Error('Failed to create event');
                                const created = await r.json();
                                const eventId = created.id;
                                await planner.loadEventById(eventId);
                                uiManager.createToast('Event added and loaded', 'success');
                                uiManager.showPanel('basics');
                            } catch (err) {
                                console.error('Add event failed', err);
                                uiManager.createToast('Failed to add event', 'danger');
                            }
                        });
                    }
                }, 200);

                this.updateProgressStep('review');
                this.currentStep = 'review';

            } catch (err) {
                console.error('Error finalizing preview', err);
                this.addAIMessage('Sorry, something went wrong creating the preview. You can still edit the basics manually.');
            }
        }, 1000);
    }

    async generateCompletePlan() {
        try {
            uiManager.createToast('Generating your complete event plan...', 'info');

            // Build request payload from collected eventData
            const text = this.eventData.description || '';

            // Call backend endpoints in parallel
            const [planRes, budgetRes, vendorsRes, scheduleRes] = await Promise.all([
                fetch(api('/ai/plan'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) }),
                fetch(api('/ai/budget'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) }),
                fetch(api('/ai/vendors'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) }),
                fetch(api('/ai/schedule'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
            ]);

            if (!planRes.ok) throw new Error('Plan generation failed');

            const planPayload = await planRes.json().catch(() => ({}));
            const budgetPayload = budgetRes.ok ? await budgetRes.json().catch(() => ({})) : {};
            const vendorsPayload = vendorsRes.ok ? await vendorsRes.json().catch(() => ({})) : {};
            const schedulePayload = scheduleRes.ok ? await scheduleRes.json().catch(() => ({})) : {};

            // Normalize into the internal plan shape
            const plan = {
                basics: {
                    name: this.eventData.name || (this.eventData.description ? (this.eventData.description.substring(0, 30) + '...') : 'Event'),
                    type: this.eventData.event_type || this.eventData.type || 'General Event',
                    attendees: this.eventData.attendees || this.eventData.attendees || 100,
                    date: this.eventData.date || null,
                    location: this.eventData.location || null,
                    duration: this.eventData.duration || null
                },
                tasks: (planPayload && planPayload.data) ? planPayload.data.map(item => ({ title: item.title || 'Task', description: item.text || '' })) : [],
                budget: (budgetPayload && budgetPayload.data) ? budgetPayload.data : [],
                schedule: (schedulePayload && schedulePayload.data) ? schedulePayload.data : [],
                vendors: (vendorsPayload && vendorsPayload.data) ? vendorsPayload.data : []
            };

            this.applyGeneratedPlan(plan);

            this.addAIMessage(`🎉 Your event plan has been generated! Here's what I've created for you:

📋 **${plan.tasks.length} tasks** organized by priority
💰 **Detailed budget breakdown** with ${plan.budget.length} categories
📅 **Complete schedule** with ${plan.schedule.length} timeline items
🏢 **${plan.vendors.length} vendor recommendations**

You can now review and customize everything in the respective panels. Would you like me to make any adjustments?`);

            this.updateProgressStep('review');
            this.currentStep = 'review';

        } catch (error) {
            console.error('Plan generation failed:', error);
            this.addAIMessage('❌ Sorry, I couldn\'t generate your plan right now. Please try again or fill in the details manually in the other panels.');
        }
    }

    async mockGeneratePlan() {
        await Utils.delay(3000); // Simulate processing time

        const eventType = this.eventData.event_type || 'General Event';
        const attendees = parseInt(this.eventData.attendees) || 100;
        const budget = this.parseBudgetRange(this.eventData.budget);

        return {
            basics: {
                name: `${eventType} Event`,
                type: eventType,
                attendees: attendees,
                date: this.eventData.date,
                location: this.eventData.location,
                duration: this.eventData.duration
            },
            budget: this.generateBudgetItems(budget, eventType),
            schedule: this.generateSchedule(eventType),
            tasks: this.generateTasks(eventType),
            vendors: this.generateVendors(eventType, attendees)
        };
    }

    parseBudgetRange(budgetString) {
        const budgetMap = {
            '$1,000 - $5,000': 3000,
            '$5,000 - $10,000': 7500,
            '$10,000 - $25,000': 17500,
            '$25,000 - $50,000': 37500,
            '$50,000+': 75000,
            'Flexible': 25000
        };
        return budgetMap[budgetString] || 25000;
    }

    generateBudgetItems(totalBudget, eventType) {
        const categories = {
            'Wedding': [
                { category: 'Venue', percentage: 0.4 },
                { category: 'Catering', percentage: 0.3 },
                { category: 'Photography', percentage: 0.15 },
                { category: 'Decorations', percentage: 0.1 },
                { category: 'Entertainment', percentage: 0.05 }
            ],
            'Corporate Conference': [
                { category: 'Venue', percentage: 0.35 },
                { category: 'AV Equipment', percentage: 0.25 },
                { category: 'Catering', percentage: 0.2 },
                { category: 'Marketing', percentage: 0.15 },
                { category: 'Speakers', percentage: 0.05 }
            ],
            'Birthday Party': [
                { category: 'Venue', percentage: 0.3 },
                { category: 'Catering', percentage: 0.25 },
                { category: 'Decorations', percentage: 0.2 },
                { category: 'Entertainment', percentage: 0.15 },
                { category: 'Cake', percentage: 0.1 }
            ]
        };

        const defaultCategories = [
            { category: 'Venue', percentage: 0.4 },
            { category: 'Food & Beverage', percentage: 0.3 },
            { category: 'Decorations', percentage: 0.15 },
            { category: 'Entertainment', percentage: 0.1 },
            { category: 'Miscellaneous', percentage: 0.05 }
        ];

        const budgetCategories = categories[eventType] || defaultCategories;

        return budgetCategories.map(cat => ({
            category: cat.category,
            amount: Math.round(totalBudget * cat.percentage),
            description: `Budget allocation for ${cat.category.toLowerCase()}`
        }));
    }

    generateSchedule(eventType) {
        const schedules = {
            'Wedding': [
                { title: 'Ceremony', startTime: '16:00', endTime: '17:00', description: 'Wedding ceremony' },
                { title: 'Cocktail Hour', startTime: '17:00', endTime: '18:00', description: 'Drinks and appetizers' },
                { title: 'Reception', startTime: '18:00', endTime: '22:00', description: 'Dinner and dancing' }
            ],
            'Corporate Conference': [
                { title: 'Registration', startTime: '08:00', endTime: '09:00', description: 'Attendee check-in' },
                { title: 'Opening Keynote', startTime: '09:00', endTime: '10:00', description: 'Opening presentation' },
                { title: 'Breakout Sessions', startTime: '10:30', endTime: '12:00', description: 'Concurrent sessions' },
                { title: 'Lunch', startTime: '12:00', endTime: '13:30', description: 'Networking lunch' },
                { title: 'Closing Keynote', startTime: '15:00', endTime: '16:00', description: 'Closing presentation' }
            ]
        };

        return schedules[eventType] || [
            { title: 'Setup', startTime: '09:00', endTime: '10:00', description: 'Event setup' },
            { title: 'Main Event', startTime: '10:00', endTime: '16:00', description: 'Main event activities' },
            { title: 'Cleanup', startTime: '16:00', endTime: '17:00', description: 'Post-event cleanup' }
        ];
    }

    generateTasks(eventType) {
        const taskLists = {
            'Wedding': [
                { title: 'Book venue', category: 'Planning', priority: 'high' },
                { title: 'Send invitations', category: 'Guest Management', priority: 'high' },
                { title: 'Arrange catering', category: 'Food & Beverage', priority: 'high' },
                { title: 'Book photographer', category: 'Photography', priority: 'medium' },
                { title: 'Choose wedding cake', category: 'Food & Beverage', priority: 'medium' },
                { title: 'Select music/DJ', category: 'Entertainment', priority: 'medium' },
                { title: 'Buy wedding rings', category: 'Personal', priority: 'low' }
            ],
            'Corporate Conference': [
                { title: 'Book conference venue', category: 'Planning', priority: 'high' },
                { title: 'Arrange AV equipment', category: 'Technical', priority: 'high' },
                { title: 'Book keynote speakers', category: 'Content', priority: 'high' },
                { title: 'Create conference program', category: 'Content', priority: 'medium' },
                { title: 'Arrange catering', category: 'Food & Beverage', priority: 'medium' },
                { title: 'Set up registration system', category: 'Administration', priority: 'medium' }
            ]
        };

        return taskLists[eventType] || [
            { title: 'Plan event details', category: 'Planning', priority: 'high' },
            { title: 'Book venue', category: 'Planning', priority: 'high' },
            { title: 'Arrange catering', category: 'Food & Beverage', priority: 'medium' },
            { title: 'Send invitations', category: 'Guest Management', priority: 'medium' },
            { title: 'Plan entertainment', category: 'Entertainment', priority: 'low' }
        ];
    }

    generateVendors(eventType, attendees) {
        const vendorLists = {
            'Wedding': [
                { name: 'Grand Ballroom Hotel', category: 'Venue', contact: '555-0101', rating: 5, notes: 'Beautiful ballroom with garden views' },
                { name: 'Elegant Catering Co.', category: 'Catering', contact: '555-0102', rating: 4, notes: 'Specializes in wedding menus' },
                { name: 'Dream Photography', category: 'Photography', contact: '555-0103', rating: 5, notes: 'Award-winning wedding photographer' },
                { name: 'Floral Dreams', category: 'Decorations', contact: '555-0104', rating: 4, notes: 'Custom floral arrangements' }
            ],
            'Corporate Conference': [
                { name: 'Tech Conference Center', category: 'Venue', contact: '555-0201', rating: 5, notes: 'Modern facility with AV capabilities' },
                { name: 'AV Solutions Pro', category: 'AV Equipment', contact: '555-0202', rating: 4, notes: 'Full conference AV setup' },
                { name: 'Corporate Catering Plus', category: 'Catering', contact: '555-0203', rating: 4, notes: 'Business lunch specialists' },
                { name: 'EventTech Solutions', category: 'Registration', contact: '555-0204', rating: 5, notes: 'Digital check-in systems' }
            ]
        };

        return vendorLists[eventType] || [
            { name: 'Local Event Venue', category: 'Venue', contact: '555-0001', rating: 4, notes: 'Suitable for events up to 200 people' },
            { name: 'City Catering', category: 'Catering', contact: '555-0002', rating: 4, notes: 'Local catering service' },
            { name: 'Pro Sound & Light', category: 'Entertainment', contact: '555-0003', rating: 4, notes: 'Audio/visual services' }
        ];
    }

    applyGeneratedPlan(plan) {
        // Update basics
        if (plan.basics) {
            planner.updateBasics(plan.basics);
        }

        // Add budget items
        if (plan.budget && Array.isArray(plan.budget)) {
            plan.budget.forEach(item => {
                planner.addBudgetItem(item);
            });
        }

        // Add schedule items
        if (plan.schedule && Array.isArray(plan.schedule)) {
            plan.schedule.forEach(item => {
                planner.addScheduleItem(item);
            });
        }

        // Add tasks
        if (plan.tasks && Array.isArray(plan.tasks)) {
            plan.tasks.forEach(task => {
                planner.addTask(task);
            });
        }

        // Add vendors
        if (plan.vendors && Array.isArray(plan.vendors)) {
            plan.vendors.forEach(vendor => {
                planner.addVendor(vendor);
            });
        }

        Utils.showToast('Complete event plan generated!', 'success');
    }

    handleGenerationFeedback(message) {
        this.addAIMessage('Thanks for the feedback! Your plan has been generated and applied. You can now customize it further in the individual panels.');
    }

    handleReviewFeedback(message) {
        this.addAIMessage('Great! I\'ve noted your feedback. Feel free to continue customizing your event plan in the other sections.');
    }

    addAIMessage(message) {
        uiManager.addChatMessage(message, 'ai');
    }

    addUserMessage(message) {
        uiManager.addChatMessage(message, 'user');
    }

    updateProgressStep(step) {
        // Update progress step indicators
        document.querySelectorAll('.progress-step').forEach(stepEl => {
            stepEl.classList.remove('active');
        });

        const activeStep = document.querySelector(`[data-step="${step}"]`);
        if (activeStep) {
            activeStep.classList.add('active');
        }

        this.currentStep = step;
    }

    clearChat() {
        const messagesContainer = document.getElementById('ai-chat-messages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
            this.conversation = [];
            this.initializeChat();
        }
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('ai-chat-messages');
        if (messagesContainer) {
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 100);
        }
    }

    reset() {
        this.conversation = [];
        this.currentStep = 'idea';
        this.eventData = {};
        this.analyzedData = null;
        this.currentQuestionIndex = 0;
        this.clearChat();
    }
}

// Global instance
export const aiAssistant = new AIAssistant();
