'use strict';

class MoodSenseApp {
    constructor() {
        this.currentTab = 'analyze';
        this.init();
    }

    async init() {
        // Wait for AppStorage to be available
        if (window.awaitAppStorage) {
            await window.awaitAppStorage();
        }
        this.setupEventListeners();
        await this.loadData();
        this.switchTab('analyze');
    }

    setupEventListeners() {
        // Tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });

        // Analyze button
        const analyzeBtn = document.getElementById('analyzeButton');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => {
                this.analyzeMood();
            });
        }

        // Chat send
        const chatSend = document.getElementById('chatSend');
        const chatMsg = document.getElementById('chatMessage');
        if (chatSend && chatMsg) {
            chatSend.addEventListener('click', () => {
                if (window.ChatManager && typeof ChatManager.sendMessage === 'function') {
                    ChatManager.sendMessage(chatMsg.value);
                    chatMsg.value = '';
                } else {
                    // Fallback: append message to thread locally
                    const thread = document.getElementById('chatThread');
                    if (thread && chatMsg.value) {
                        const div = document.createElement('div');
                        div.className = 'chat-message user';
                        div.textContent = chatMsg.value;
                        thread.appendChild(div);
                        chatMsg.value = '';
                    }
                }
            });
        }

        // Activities: delegate clicks to start buttons
        const grid = document.getElementById('activitiesGrid');
        if (grid && window.ActivitiesManager) {
            grid.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;
                const card = e.target.closest('.activity-card');
                const key = card?.dataset?.activity;
                if (!key) return;
                const map = {
                    breathing: () => ActivitiesManager.showBreathing(),
                    bubbles: () => ActivitiesManager.showBubbles(),
                    grounding: () => ActivitiesManager.showGrounding(),
                    journaling: () => ActivitiesManager.showJournaling(),
                    checklist: () => ActivitiesManager.showChecklist(),
                    timer: () => ActivitiesManager.showTimer()
                };
                const fn = map[key];
                if (fn) fn();
            });
        }
    }

    switchTab(tab) {
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        const tabBtn = document.querySelector(`[data-tab="${tab}"]`);
        if (tabBtn) tabBtn.classList.add('active');
        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
        const panel = document.getElementById(`tab-${tab}`);
        if (panel) panel.classList.add('active');
        this.currentTab = tab;

        if (tab === 'history') {
            this.loadHistory();
        }
    }

    async analyzeMood() {
        const input = document.getElementById('analysisInput');
        const text = input ? input.value.trim() : '';
        if (!text) return;

        UIManager.showLoader();

        try {
            const result = await BackendAPI.analyze(text);
            this.displayAnalysis(result);
            await this.saveAnalysis(result);
            this.applyTheme(result.emotion);
        } catch (error) {
            console.warn('Analysis failed, using fallback', error);
            const fallback = { emotion: 'neutral', sentiment: 'neutral', intensity: { label: 'moderate', value: 0.5 }, emoji: '😐', breakdown: {}, affirmations: [], activities: [], coping: [], music: [], crisis: false };
            this.displayAnalysis(fallback);
            await this.saveAnalysis(fallback);
            this.applyTheme(fallback.emotion);
        }

        UIManager.hideLoader();
    }

    displayAnalysis(result) {
        document.getElementById('summaryEmoji').textContent = result.emoji;
        document.getElementById('summaryEmotion').textContent = result.emotion;
        document.getElementById('summaryIntensity').textContent = result.intensity.label;
        document.getElementById('summarySentiment').textContent = result.sentiment;
        document.getElementById('summaryConfidence').textContent = Math.round((result.confidence || 0.5) * 100) + '%';

        // Bar chart
        this.renderBarChart(result.breakdown);

        // Lists
        this.fillList('affirmationsList', result.affirmations);
        this.fillList('activitiesList', result.activities);
        this.fillList('copingList', result.coping);
        this.fillMusicGrid(result.music);
    }

    renderBarChart(breakdown) {
        const canvas = document.getElementById('emotionBarChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (this.barChart) this.barChart.destroy();
        this.barChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(breakdown),
                datasets: [{
                    data: Object.values(breakdown),
                    backgroundColor: 'rgba(54, 162, 235, 0.6)'
                }]
            },
            options: { scales: { y: { beginAtZero: true } } }
        });
    }

    fillList(id, items) {
        const list = document.getElementById(id);
        if (!list) return;
        UIManager.clean(list);
        items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            list.appendChild(li);
        });
    }

    fillMusicGrid(music) {
        const grid = document.getElementById('musicGrid');
        if (!grid) return;
        UIManager.clean(grid);
        music.forEach(song => {
            const div = document.createElement('div');
            div.innerHTML = `<strong>${song.title}</strong> by ${song.artist}`;
            grid.appendChild(div);
        });
    }

    async saveAnalysis(result) {
        let history = await AppStorage.load('moodSense/history', []);
        if (!Array.isArray(history)) history = [];
        history.push({ ...result, timestamp: new Date().toISOString() });
        await AppStorage.save('moodSense/history', history);
        await AppStorage.save('moodSense/latestAnalysis', result);
    }

    applyTheme(emotion) {
        const themes = { joy: 'theme-bloom', sadness: 'theme-calm', anger: 'theme-energized', anxiety: 'theme-focused', calm: 'theme-grounded' };
        document.body.className = themes[emotion] || '';
    }

    async loadHistory() {
        const history = await AppStorage.load('moodSense/history', []);
        const streak = this.calculateStreak(history);
        const streakEl = document.getElementById('statStreak');
        if (streakEl) streakEl.textContent = streak;

        let stats = await AppStorage.load('moodSense/stats', {});
        if (!stats || typeof stats !== 'object') stats = {};
        const actEl = document.getElementById('statActivities');
        const songsEl = document.getElementById('statSongs');
        if (actEl) actEl.textContent = Number(stats.activitiesCompleted || 0);
        if (songsEl) songsEl.textContent = Number(stats.songsExplored || 0);

        this.renderTrendChart(history);
        this.renderFrequencyChart(history);
        this.showHistoryList(history);
        this.showJournalList();
    }

    calculateStreak(history) {
        if (!Array.isArray(history) || history.length === 0) return '0 days';
        let streak = 0;
        for (let i = history.length - 1; i >= 0; i--) {
            if (history[i] && history[i].emotion === 'joy') streak++;
            else break;
        }
        return `${streak} days`;
    }

    renderTrendChart(history) {
        const trendCanvas = document.getElementById('trendChart');
        if (!trendCanvas) return;
        const ctx = trendCanvas.getContext('2d');
        if (this.trendChart) this.trendChart.destroy();
        const data = history.slice(-7).map(h => h.intensity.value);
        this.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: history.slice(-7).map((_, i) => `Day ${i+1}`),
                datasets: [{ data, borderColor: 'blue' }]
            }
        });
    }

    renderFrequencyChart(history) {
        const freqCanvas = document.getElementById('frequencyChart');
        if (!freqCanvas) return;
        const ctx = freqCanvas.getContext('2d');
        if (this.freqChart) this.freqChart.destroy();
        const freq = {};
        history.forEach(h => freq[h.emotion] = (freq[h.emotion] || 0) + 1);
        this.freqChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(freq),
                datasets: [{ data: Object.values(freq) }]
            }
        });
    }

    showHistoryList(history) {
        const list = document.getElementById('historyList');
        if (!list) return;
        UIManager.clean(list);
        history.slice(-10).reverse().forEach(h => {
            const li = document.createElement('li');
            li.textContent = `${h.emotion} - ${new Date(h.timestamp).toLocaleDateString()}`;
            list.appendChild(li);
        });
    }

    async showJournalList() {
        const journal = await AppStorage.load('moodSense/journal', []);
        const list = document.getElementById('journalList');
        if (!list) return;
        UIManager.clean(list);
        journal.slice(-5).reverse().forEach(j => {
            const li = document.createElement('li');
            li.textContent = j.entry.substring(0, 50) + '...';
            list.appendChild(li);
        });
    }

    async loadData() {
        // Load initial data if needed
    }
}

const app = new MoodSenseApp();