'use strict';

class ChatManager {
    constructor() {
        this.chatHistory = [];
        this.currentPersona = 'companion';
        this.lastAnalysis = null;
    }

    async init() {
        this.chatHistory = await AppStorage.load('moodSense/chat', []);
        this.renderChat();
    }

    async sendMessage(message) {
        if (!message.trim()) return;

        this.chatHistory.push({ role: 'user', content: message, timestamp: new Date().toISOString() });
        this.renderChat();

        UIManager.showLoader();

        try {
            const persona = this.selectPersona();
            const response = await BackendAPI.chat(message, persona);
            this.chatHistory.push({ role: 'assistant', content: response.message, persona: response.persona, timestamp: new Date().toISOString() });
        } catch (error) {
            console.warn('Chat failed, using fallback', error);
            const fallback = this.getFallbackResponse(message);
            this.chatHistory.push({ role: 'assistant', content: fallback, persona: 'Fallback', timestamp: new Date().toISOString() });
        }

        UIManager.hideLoader();
        this.renderChat();
        await AppStorage.save('moodSense/chat', this.chatHistory);
    }

    selectPersona() {
        if (!this.lastAnalysis) return 'companion';
        const emotion = this.lastAnalysis.emotion;
        const intensity = this.lastAnalysis.intensity.label;
        if (emotion === 'sadness' || intensity === 'high') {
            return 'therapist';
        }
        return 'companion';
    }

    getFallbackResponse(message) {
        return 'I\'m here to listen. How are you feeling right now?';
    }

    renderChat() {
        const thread = document.getElementById('chatThread');
        if (!thread) return;
        UIManager.clean(thread);
        this.chatHistory.forEach(msg => {
            const msgEl = UIManager.createEl('div', { class: msg.role === 'user' ? 'user-message' : 'assistant-message' });
            msgEl.textContent = msg.content;
            thread.appendChild(msgEl);
        });
        thread.scrollTop = thread.scrollHeight;
    }

    updateLastAnalysis(analysis) {
        this.lastAnalysis = analysis;
    }
}

const chatManager = new ChatManager();
window.ChatManager = chatManager;