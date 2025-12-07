// AI Event Architect - AI Conversation + Guided Intake System

import { Utils } from './utils.js';
import { planner } from './planner.js';
import { api } from './api-config.js';

export class AIAssistant {
    constructor() {
        this.conversation = [];
        this.currentStep = 0;
        this.eventData = {};
        this.questions = [
            {
                id: 'event_type',
                question: "What type of event are you planning? (e.g., wedding, corporate conference, birthday party, tech conference)",
                type: 'text',
                options: ['Wedding', 'Corporate Conference', 'Birthday Party', 'Tech Conference', 'Music Festival', 'Charity Gala', 'Other']
            },
            {
                id: 'attendees',
                question: "How many people do you expect to attend?",
                type: 'number',
                validation: (value) => value > 0 && value <= 10000
            },
            {
                id: 'budget',
                question: "What's your approximate budget range?",
                type: 'select',
                options: ['$1,000 - $5,000', '$5,000 - $10,000', '$10,000 - $25,000', '$25,000 - $50,000', '$50,000+', 'Flexible']
            },
            {
                id: 'date',
                question: "When is the event scheduled for?",
                type: 'date'
            },
            {
                id: 'venue_type',
                question: "What type of venue are you considering?",
                type: 'select',
                options: ['Hotel Ballroom', 'Conference Center', 'Outdoor Park', 'Restaurant', 'Home/Backyard', 'Stadium/Arena', 'Other']
            },
            {
                id: 'location',
                question: "Where will the event take place? (city or specific location)",
                type: 'text'
            },
            {
                id: 'duration',
                question: "How long will the event last?",
                type: 'select',
                options: ['2-4 hours', '4-6 hours', '6-8 hours', 'All day', 'Multiple days']
            },
            {
                id: 'special_requirements',
                question: "Any special requirements or themes? (optional)",
                type: 'textarea',
                required: false
            }
        ];
        this.init();
    }

    init() {
        this.setupChatInterface();
        this.startConversation();
        this.setupEventListeners();
    }

    setupChatInterface() {
        const container = document.getElementById('ai-chat-container');
        if (!container) return;

        container.innerHTML = `
            <div class="chat-messages" id="chat-messages"></div>
            <div class="chat-input-container">
                <div class="input-group">
                    <input type="text" class="form-control" id="chat-input" placeholder="Type your response...">
                    <button class="btn btn-primary" id="send-button">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
                <div class="mt-2 text-center">
                    <button class="btn btn-outline-secondary btn-sm" id="skip-question">Skip this question</button>
                </div>
            </div>
            <div class="progress mt-3">
                <div class="progress-bar" id="conversation-progress" role="progressbar" style="width: 0%"></div>
            </div>
        `;

        this.messagesContainer = document.getElementById('chat-messages');
        this.input = document.getElementById('chat-input');
        this.sendButton = document.getElementById('send-button');
        this.skipButton = document.getElementById('skip-question');
        this.progressBar = document.getElementById('conversation-progress');
    }

    setupEventListeners() {
        this.sendButton.addEventListener('click', () => this.handleUserInput());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleUserInput();
            }
        });
        this.skipButton.addEventListener('click', () => this.skipCurrentQuestion());

        // Listen for panel shown event
        document.addEventListener('panelShown', (e) => {
            if (e.detail.panelId === 'ai-planner') {
                this.scrollToBottom();
            }
        });
    }

    startConversation() {
        this.addMessage('ai', '👋 Welcome to AI Event Architect! I\'ll help you plan your perfect event. Let\'s start with some basic information.');
        this.askNextQuestion();
    }

    askNextQuestion() {
        if (this.currentStep >= this.questions.length) {
            this.finishConversation();
            return;
        }

        const question = this.questions[this.currentStep];
        this.addMessage('ai', question.question, question);
        this.updateProgress();
    }

    addMessage(sender, text, data = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${sender}`;

        const avatar = sender === 'ai' ? '🤖' : '👤';
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-text">${text}</div>
                ${data && data.options ? this.renderOptions(data.options) : ''}
                <div class="message-time">${time}</div>
            </div>
        `;

        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();

        this.conversation.push({ sender, text, data, timestamp: new Date() });
    }

    renderOptions(options) {
        return `
            <div class="message-options mt-2">
                ${options.map(option => `<button class="btn btn-outline-primary btn-sm me-2 mb-1 option-btn" data-option="${option}">${option}</button>`).join('')}
            </div>
        `;
    }

    handleUserInput() {
        const input = this.input.value.trim();
        if (!input) return;

        this.addMessage('user', input);
        this.processUserResponse(input);
        this.input.value = '';
    }

    processUserResponse(response) {
        const currentQuestion = this.questions[this.currentStep];
        this.eventData[currentQuestion.id] = response;

        // Validate response if needed
        if (currentQuestion.validation && !currentQuestion.validation(response)) {
            this.addMessage('ai', 'That doesn\'t seem right. Please provide a valid response.');
            return;
        }

        this.currentStep++;
        setTimeout(() => this.askNextQuestion(), 500);
    }

    skipCurrentQuestion() {
        const currentQuestion = this.questions[this.currentStep];
        if (!currentQuestion.required) {
            this.addMessage('user', 'Skipped');
            this.currentStep++;
            setTimeout(() => this.askNextQuestion(), 500);
        } else {
            this.addMessage('ai', 'This question is required. Please provide an answer.');
        }
    }

    finishConversation() {
        this.addMessage('ai', 'Great! I have all the information I need. Let me generate your event plan...');

        // Update planner with collected data
        planner.updateBasics({
            name: this.eventData.event_type || 'Untitled Event',
            type: this.eventData.event_type,
            attendees: parseInt(this.eventData.attendees) || 0,
            date: this.eventData.date,
            venue: this.eventData.venue_type,
            budget: this.parseBudget(this.eventData.budget)
        });

        // Generate AI plan
        this.generateAIPlan();
    }

    parseBudget(budgetString) {
        const budgetMap = {
            '$1,000 - $5,000': 3000,
            '$5,000 - $10,000': 7500,
            '$10,000 - $25,000': 17500,
            '$25,000 - $50,000': 37500,
            '$50,000+': 75000,
            'Flexible': 0
        };
        return budgetMap[budgetString] || 0;
    }

    async generateAIPlan() {
        try {
            const response = await this.callBackend('/ai/plan', {
                eventData: this.eventData,
                conversation: this.conversation
            });

            if (response.status === 'success') {
                this.applyAIResults(response.data);
                this.addMessage('ai', '✅ Your event plan has been generated! Check out the different sections to see your budget, schedule, tasks, and vendor recommendations.');
            } else {
                throw new Error(response.error || 'Failed to generate plan');
            }
        } catch (error) {
            console.error('AI Plan generation failed:', error);
            this.addMessage('ai', '❌ Sorry, I couldn\'t generate your plan right now. Please try again or fill in the details manually.');
        }
    }

    async callBackend(endpoint, data) {
        try {
            const response = await fetch(api(endpoint), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    applyAIResults(data) {
        // Apply budget
        if (data.budget && Array.isArray(data.budget)) {
            data.budget.forEach(item => {
                planner.addBudgetItem({
                    category: item.category,
                    amount: item.amount,
                    description: item.description || ''
                });
            });
        }

        // Apply schedule
        if (data.schedule && Array.isArray(data.schedule)) {
            data.schedule.forEach(item => {
                planner.addScheduleItem({
                    title: item.title,
                    startTime: item.startTime,
                    endTime: item.endTime,
                    description: item.description || ''
                });
            });
        }

        // Apply tasks
        if (data.tasks && Array.isArray(data.tasks)) {
            data.tasks.forEach(task => {
                planner.addTask({
                    title: task.title,
                    category: task.category,
                    priority: task.priority || 'medium'
                });
            });
        }

        // Apply vendors
        if (data.vendors && Array.isArray(data.vendors)) {
            data.vendors.forEach(vendor => {
                planner.addVendor({
                    name: vendor.name,
                    category: vendor.category,
                    contact: vendor.contact,
                    rating: vendor.rating || 5,
                    notes: vendor.notes || ''
                });
            });
        }

        // Update AI insights
        if (data.insights) {
            planner.updateAIInsights(data.insights);
        }

        Utils.showToast('AI plan applied successfully!', 'success');
    }

    updateProgress() {
        const progress = ((this.currentStep + 1) / this.questions.length) * 100;
        this.progressBar.style.width = `${progress}%`;
    }

    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }

    reset() {
        this.conversation = [];
        this.currentStep = 0;
        this.eventData = {};
        this.setupChatInterface();
        this.startConversation();
    }
}

// Handle option button clicks
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('option-btn')) {
        const option = e.target.getAttribute('data-option');
        const input = document.getElementById('chat-input');
        input.value = option;
        document.getElementById('send-button').click();
    }
});

// Global instance
export const aiAssistant = new AIAssistant();