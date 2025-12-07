// MoodSense+ AI Emotional Companion - Main Script

class MoodSenseApp {
    constructor() {
        // Check if running in iframe
        this.isInIframe = window.self !== window.top;

        this.currentTab = 'analyze';
        this.currentLanguage = 'en';
        this.currentPersona = 'auto';
        this.moodHistory = JSON.parse(localStorage.getItem('moodHistory')) || [];
        this.chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
        this.activitiesCompleted = JSON.parse(localStorage.getItem('activitiesCompleted')) || {};
        this.songsExplored = JSON.parse(localStorage.getItem('songsExplored')) || {};

        // Translations
        this.translations = {
            en: {
                analyze: 'Analyze',
                chat: 'Chat',
                activities: 'Activities',
                history: 'History',
                analyzeMood: 'Analyze Mood',
                shareThoughts: 'Share your thoughts and feelings...',
                typeMessage: 'Type your message...',
                send: 'Send',
                refreshMood: '🔄 Refresh Mood Context',
                howFeeling: 'How are you feeling?',
                needAdvice: 'I need advice',
                tellJoke: 'Tell me a joke',
                breathing: 'Breathing Exercise',
                bubbles: 'Pop the Bubbles',
                grounding: '5-4-3-2-1 Grounding',
                journaling: 'Mini Journaling',
                checklist: 'Self-Check List',
                timer: 'Focus Timer',
                weeklyMood: 'Weekly Mood Graph',
                emotionFrequency: 'Emotion Frequency',
                moodStreak: 'Mood Streak',
                activitiesCompleted: 'Activities Completed',
                songsExplored: 'Songs Explored',
                achievements: 'Achievements',
                recentEntries: 'Recent Entries',
                journalEntries: 'Journal Entries'
            },
            hi: {
                analyze: 'विश्लेषण',
                chat: 'चैट',
                activities: 'गतिविधियाँ',
                history: 'इतिहास',
                analyzeMood: 'मूड विश्लेषण करें',
                shareThoughts: 'अपने विचार और भावनाएँ साझा करें...',
                typeMessage: 'अपना संदेश टाइप करें...',
                send: 'भेजें',
                refreshMood: '🔄 मूड संदर्भ ताज़ा करें',
                howFeeling: 'आप कैसा महसूस कर रहे हैं?',
                needAdvice: 'मुझे सलाह चाहिए',
                tellJoke: 'मुझे एक चुटकुला सुनाओ',
                breathing: 'साँस लेने का अभ्यास',
                bubbles: 'बुलबुले फोड़ें',
                grounding: '5-4-3-2-1 ग्राउंडिंग',
                journaling: 'मिनी जर्नलिंग',
                checklist: 'सेल्फ-चेक लिस्ट',
                timer: 'फोकस टाइमर',
                weeklyMood: 'साप्ताहिक मूड ग्राफ',
                emotionFrequency: 'भावना आवृत्ति',
                moodStreak: 'मूड स्ट्रेक',
                activitiesCompleted: 'गतिविधियाँ पूरी हुईं',
                songsExplored: 'गीतों का पता लगाया',
                achievements: 'उपलब्धियाँ',
                recentEntries: 'हाल की प्रविष्टियाँ',
                journalEntries: 'जर्नल प्रविष्टियाँ'
            },
            te: {
                analyze: 'విశ్లేషణ',
                chat: 'చాట్',
                activities: 'కార్యకలాపాలు',
                history: 'చరిత్ర',
                analyzeMood: 'మూడ్ విశ్లేషించు',
                shareThoughts: 'మీ ఆలోచనలు మరియు భావాలను పంచుకోండి...',
                typeMessage: 'మీ సందేశాన్ని టైప్ చేయండి...',
                send: 'పంపు',
                refreshMood: '🔄 మూడ్ సందర్భాన్ని రిఫ్రెష్ చేయండి',
                howFeeling: 'మీరు ఎలా అనుభూతి చెందుతున్నారు?',
                needAdvice: 'నాకు సలహా కావాలి',
                tellJoke: 'నాకు ఒక వినోదం చెప్పు',
                breathing: 'శ్వాస సాధన',
                bubbles: 'బుడగలను పేల్చు',
                grounding: '5-4-3-2-1 గ్రౌండింగ్',
                journaling: 'మినీ జర్నలింగ్',
                checklist: 'సెల్ఫ్-చెక్ లిస్ట్',
                timer: 'ఫోకస్ టైమర్',
                weeklyMood: 'వీక్లీ మూడ్ గ్రాఫ్',
                emotionFrequency: 'భావన ఫ్రీక్వెన్సీ',
                moodStreak: 'మూడ్ స్ట్రీక్',
                activitiesCompleted: 'కార్యకలాపాలు పూర్తైనవి',
                songsExplored: 'పాటలు అన్వేషించబడ్డాయి',
                achievements: 'సాధనలు',
                recentEntries: 'ఇటీవలి ఎంట్రీలు',
                journalEntries: 'జర్నల్ ఎంట్రీలు'
            }
        };

        this.chatManager = new ChatManager();
        this.activitiesManager = new ActivitiesManager();

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadHistory();
        this.updateUI();
        this.updateUIText();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Language and persona selection
        document.getElementById('language-select').addEventListener('change', (e) => {
            this.currentLanguage = e.target.value;
            this.activitiesManager.setLanguage(this.currentLanguage);
            this.updateUIText();
        });

        document.getElementById('persona-select').addEventListener('change', (e) => {
            this.currentPersona = e.target.value;
        });

        // Analyze button
        document.getElementById('analyze-btn').addEventListener('click', () => {
            this.analyzeMood();
        });

        // Chat functionality
        document.getElementById('send-btn').addEventListener('click', () => {
            this.sendChatMessage();
        });

        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });

        // Mood refresh button (single listener)
        document.getElementById('mood-refresh-btn').addEventListener('click', () => {
            this.refreshMoodContext();
        });

        // Modal close buttons
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                closeBtn.closest('.modal').style.display = 'none';
            });
        });

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.currentTab = tabName;
        this.updateUI();
    }

    async analyzeMood() {
        const input = document.getElementById('mood-input').value.trim();
        if (!input) return;

        try {
            const result = await BackendAPI.analyzeMood(input, this.currentLanguage);
            this.displayMoodResult(result);
            this.saveMoodEntry(result);

            // Ask for music language preference after analysis
            this.promptMusicLanguage(result);

            this.checkCrisisMode(result);
            this.applyMoodTheme(result.primaryEmotion);
        } catch (error) {
            console.error('Analysis failed:', error);
            const result = BackendAPI.getIntelligentFallbackAnalysis(input, this.currentLanguage);
            this.displayMoodResult(result);
            this.saveMoodEntry(result);

            // Ask for music language preference even in fallback
            this.promptMusicLanguage(result);

            this.checkCrisisMode(result);
            this.applyMoodTheme(result.primaryEmotion);
        }
    }

    promptMusicLanguage(analysisResult) {
        // Create music language selection modal
        const modal = document.createElement('div');
        modal.className = 'modal music-lang-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Choose Music Language</h3>
                <p>Select your preferred language for music recommendations:</p>
                <div class="music-lang-options">
                    <button class="music-lang-btn" data-lang="en">English</button>
                    <button class="music-lang-btn" data-lang="hi">Hindi</button>
                    <button class="music-lang-btn" data-lang="te">Telugu</button>
                    <button class="music-lang-btn" data-lang="auto">Auto (Based on Analysis)</button>
                </div>
                <button id="skip-music">Skip Music</button>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'block';

        // Handle language selection
        modal.querySelectorAll('.music-lang-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const musicLang = e.target.dataset.lang;
                modal.remove();
                await this.loadMusicRecommendations(analysisResult, musicLang);
            });
        });

        // Handle skip
        document.getElementById('skip-music').addEventListener('click', () => {
            modal.remove();
        });
    }

    async loadMusicRecommendations(analysisResult, musicLanguage) {
        try {
            const musicResult = await BackendAPI.getMusicSuggestions(analysisResult.primaryEmotion, musicLanguage);
            analysisResult.musicSuggestions = musicResult;

            // Update the display with music
            this.updateMusicDisplay(analysisResult.musicSuggestions);
        } catch (error) {
            console.error('Music loading failed:', error);
            // Fallback to default music
            analysisResult.musicSuggestions = BackendAPI.getFallbackMusic(analysisResult.primaryEmotion);
            this.updateMusicDisplay(analysisResult.musicSuggestions);
        }
    }

    updateMusicDisplay(musicSuggestions) {
        const musicList = document.getElementById('music-list');
        musicList.innerHTML = '';

        if (!musicSuggestions || musicSuggestions.length === 0) {
            musicList.innerHTML = '<p>No music suggestions available at this time.</p>';
            return;
        }

        musicSuggestions.forEach(song => {
            const songDiv = document.createElement('div');
            songDiv.className = 'music-item';
            songDiv.innerHTML = `
                <p><strong>${song.title}</strong> by ${song.artist}</p>
                <div class="music-links">
                    <a href="${song.spotifyLink}" target="_blank" class="spotify-link">🎵 Spotify</a> |
                    <a href="${song.youtubeLink}" target="_blank" class="youtube-link">📺 YouTube</a>
                </div>
            `;
            // Track song exploration
            songDiv.addEventListener('click', () => {
                this.songsExplored[song.title] = (this.songsExplored[song.title] || 0) + 1;
                localStorage.setItem('songsExplored', JSON.stringify(this.songsExplored));
            });
            musicList.appendChild(songDiv);
        });
    }

    displayMoodResult(result) {
        const output = document.getElementById('mood-output');
        output.classList.remove('hidden');

        document.getElementById('primary-emotion').textContent = result.primaryEmotion;
        document.getElementById('intensity').textContent = `Intensity: ${result.intensity}`;
        document.getElementById('sentiment').textContent = `Sentiment: ${result.sentiment}`;
        document.querySelector('.mood-emoji').textContent = result.emoji;

        // Update intensity circle animation
        this.updateIntensityCircle(result.intensity);

        // Update affirmations
        const affirmationList = document.getElementById('affirmation-list');
        affirmationList.innerHTML = '';
        result.affirmations.forEach(affirmation => {
            const li = document.createElement('li');
            li.textContent = affirmation;
            affirmationList.appendChild(li);
        });

        // Update music suggestions (will be populated after language selection)
        const musicList = document.getElementById('music-list');
        musicList.innerHTML = '<p class="music-placeholder">Select music language to get personalized recommendations...</p>';

        // Update activities
        const activityList = document.getElementById('activity-list');
        activityList.innerHTML = '';
        result.suggestedActivities.forEach(activity => {
            const li = document.createElement('li');
            li.textContent = activity;
            activityList.appendChild(li);
        });

        // Update coping steps
        const copingList = document.getElementById('coping-list');
        copingList.innerHTML = '';
        result.copingSteps.forEach(step => {
            const li = document.createElement('li');
            li.textContent = step;
            copingList.appendChild(li);
        });

        // Update emotion chart
        this.updateEmotionChart(result.breakdown);
    }

    updateIntensityCircle(intensity) {
        const intensityLevels = { 'low': 0.3, 'moderate': 0.6, 'high': 0.9, 'severe': 1.0 };
        const intensityValue = intensityLevels[intensity.toLowerCase()] || 0.5;

        // Create or update intensity circle
        let intensityCircle = document.querySelector('.intensity-circle');
        if (!intensityCircle) {
            intensityCircle = document.createElement('div');
            intensityCircle.className = 'intensity-circle';
            document.querySelector('.mood-details').appendChild(intensityCircle);
        }

        intensityCircle.style.setProperty('--intensity', intensityValue);
        intensityCircle.title = `Intensity: ${intensity}`;
    }

    updateEmotionChart(breakdown) {
        const ctx = document.getElementById('emotion-chart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(breakdown),
                datasets: [{
                    label: 'Emotion Intensity',
                    data: Object.values(breakdown),
                    backgroundColor: 'rgba(102, 126, 234, 0.6)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    async sendChatMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        if (!message) return;

        this.addChatMessage(message, 'user');
        input.value = '';

        try {
            const response = await this.chatManager.sendMessage(message, this.currentPersona, this.currentLanguage);
            this.addChatMessage(response.message, 'ai', response.persona);
        } catch (error) {
            console.error('Chat failed:', error);
            this.addChatMessage('I\'m here to listen. How are you feeling right now?', 'ai');
        }
    }

    refreshMoodContext() {
        // Get the most recent mood analysis
        const recentMood = this.moodHistory[this.moodHistory.length - 1];
        if (recentMood) {
            const contextMessage = `My current mood is ${recentMood.primaryEmotion} with ${recentMood.intensity} intensity.`;
            this.chatManager.updateMoodContext(recentMood);
            this.addChatMessage('🔄 Mood context refreshed! I now understand your current emotional state.', 'ai', 'System');
        } else {
            this.addChatMessage('Please analyze your mood first so I can better understand your emotional context.', 'ai', 'System');
        }
    }

    addChatMessage(message, sender, persona = null) {
        const messagesDiv = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        if (sender === 'ai' && persona) {
            messageDiv.innerHTML = `<strong>${persona}:</strong> ${message}`;
        } else {
            messageDiv.textContent = message;
        }

        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;

        // Save to chat history
        this.chatHistory.push({
            message,
            sender,
            persona,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
    }

    saveMoodEntry(result) {
        const entry = {
            ...result,
            timestamp: new Date().toISOString(),
            input: document.getElementById('mood-input').value
        };
        this.moodHistory.push(entry);
        localStorage.setItem('moodHistory', JSON.stringify(this.moodHistory));
        this.updateHistoryUI();
    }

    checkCrisisMode(result) {
        if (result.intensity === 'severe' || result.primaryEmotion.toLowerCase() === 'depressed') {
            document.getElementById('crisis-modal').style.display = 'block';
            this.applyMoodTheme('crisis');
            // Force therapist persona in crisis mode
            this.currentPersona = 'doctor';
            document.getElementById('persona-select').value = 'doctor';
            // Enable crisis mode in chat manager
            this.chatManager.setCrisisMode(true);
            // Auto-open breathing exercise
            setTimeout(() => {
                this.activitiesManager.startActivity('breathing');
            }, 2000);
        } else {
            // Disable crisis mode if not in crisis
            this.chatManager.setCrisisMode(false);
        }
    }

    applyMoodTheme(emotion) {
        const themes = {
            happy: 'happy-theme',
            sad: 'sad-theme',
            angry: 'angry-theme',
            anxious: 'anxious-theme',
            calm: 'calm-theme',
            depressed: 'depressed-theme',
            crisis: 'crisis-theme'
        };

        document.body.className = themes[emotion.toLowerCase()] || '';
    }

    loadHistory() {
        this.updateHistoryUI();
    }

    updateHistoryUI() {
        this.updateMoodGraph();
        this.updateEmotionPie();
        this.updateStats();
        this.updateAchievements();
        this.updateHistoryList();
    }

    updateMoodGraph() {
        const ctx = document.getElementById('mood-graph').getContext('2d');
        const recentEntries = this.moodHistory.slice(-7);
        const labels = recentEntries.map(entry => new Date(entry.timestamp).toLocaleDateString());
        const data = recentEntries.map(entry => this.emotionToScore(entry.primaryEmotion));

        new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Mood Score',
                    data,
                    borderColor: 'rgba(102, 126, 234, 1)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.1
                }]
            },
            options: {
                scales: {
                    y: {
                        min: 0,
                        max: 10
                    }
                }
            }
        });
    }

    updateEmotionPie() {
        const ctx = document.getElementById('emotion-pie').getContext('2d');
        const emotionCounts = {};
        this.moodHistory.forEach(entry => {
            emotionCounts[entry.primaryEmotion] = (emotionCounts[entry.primaryEmotion] || 0) + 1;
        });

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(emotionCounts),
                datasets: [{
                    data: Object.values(emotionCounts),
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40'
                    ]
                }]
            }
        });
    }

    updateStats() {
        const streak = this.calculateMoodStreak();
        document.getElementById('mood-streak').textContent = `${streak} days`;
        document.getElementById('activities-completed').textContent = Object.values(this.activitiesCompleted).reduce((a, b) => a + b, 0);
        document.getElementById('songs-explored').textContent = Object.keys(this.songsExplored).length;
    }

    updateAchievements() {
        const achievements = [];
        const journalEntries = JSON.parse(localStorage.getItem('journalEntries')) || [];

        if (this.moodHistory.length >= 7) achievements.push('Week Warrior - 7 mood analyses!');
        if (Object.values(this.activitiesCompleted).reduce((a, b) => a + b, 0) >= 10) achievements.push('Activity Champion - 10+ activities completed!');
        if (this.calculateMoodStreak() >= 3) achievements.push('Mood Streak - 3+ days of positive moods!');
        if (Object.keys(this.songsExplored).length >= 5) achievements.push('Music Explorer - 5+ songs explored!');
        if (journalEntries.length >= 3) achievements.push('Reflective Writer - 3+ journal entries!');

        const achievementList = document.getElementById('achievement-list');
        achievementList.innerHTML = '';
        achievements.forEach(achievement => {
            const badge = document.createElement('span');
            badge.className = 'achievement';
            badge.textContent = achievement;
            achievementList.appendChild(badge);
        });
    }

    updateHistoryList() {
        const historyList = document.getElementById('history-entries');
        historyList.innerHTML = '';
        this.moodHistory.slice(-10).reverse().forEach(entry => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${entry.primaryEmotion}</strong> (${entry.intensity}) -
                ${new Date(entry.timestamp).toLocaleDateString()}
                <br><small>"${entry.input.substring(0, 50)}${entry.input.length > 50 ? '...' : ''}"</small>
            `;
            historyList.appendChild(li);
        });

        // Update journal entries
        this.updateJournalList();
    }

    updateJournalList() {
        const journalEntries = JSON.parse(localStorage.getItem('journalEntries')) || [];
        const journalList = document.getElementById('journal-entries');
        journalList.innerHTML = '';

        journalEntries.slice(-5).reverse().forEach(entry => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${entry.prompt}</strong>
                <br><small>${new Date(entry.timestamp).toLocaleDateString()}</small>
                <br><em>"${entry.entry.substring(0, 100)}${entry.entry.length > 100 ? '...' : ''}"</em>
            `;
            journalList.appendChild(li);
        });
    }

    calculateMoodStreak() {
        // Simple streak calculation - consecutive positive days
        let streak = 0;
        for (let i = this.moodHistory.length - 1; i >= 0; i--) {
            const emotion = this.moodHistory[i].primaryEmotion.toLowerCase();
            if (['happy', 'calm', 'joy'].includes(emotion)) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }

    emotionToScore(emotion) {
        const scores = {
            happy: 8,
            calm: 7,
            sad: 3,
            angry: 2,
            anxious: 4,
            depressed: 1,
            neutral: 5
        };
        return scores[emotion.toLowerCase()] || 5;
    }

    updateUI() {
        // Update UI based on current state
        if (this.currentTab === 'chat') {
            // Load chat history
            document.getElementById('chat-messages').innerHTML = '';
            this.chatHistory.forEach(msg => {
                this.addChatMessage(msg.message, msg.sender, msg.persona);
            });
        }
    }

    updateUIText() {
        const t = this.translations[this.currentLanguage] || this.translations.en;

        // Update tab buttons
        document.querySelector('[data-tab="analyze"]').textContent = t.analyze;
        document.querySelector('[data-tab="chat"]').textContent = t.chat;
        document.querySelector('[data-tab="activities"]').textContent = t.activities;
        document.querySelector('[data-tab="history"]').textContent = t.history;

        // Update analyze tab
        document.getElementById('mood-input').placeholder = t.shareThoughts;
        document.getElementById('analyze-btn').textContent = t.analyzeMood;

        // Update chat tab
        document.getElementById('chat-input').placeholder = t.typeMessage;
        document.getElementById('send-btn').textContent = t.send;
        document.getElementById('mood-refresh-btn').textContent = t.refreshMood;

        // Update quick replies
        const quickReplies = document.querySelectorAll('.quick-reply');
        quickReplies[0].textContent = t.howFeeling;
        quickReplies[1].textContent = t.needAdvice;
        quickReplies[2].textContent = t.tellJoke;

        // Update activity cards
        const activityCards = document.querySelectorAll('.activity-card');
        activityCards[0].querySelector('h3').textContent = t.breathing;
        activityCards[1].querySelector('h3').textContent = t.bubbles;
        activityCards[2].querySelector('h3').textContent = t.grounding;
        activityCards[3].querySelector('h3').textContent = t.journaling;
        activityCards[4].querySelector('h3').textContent = t.checklist;
        activityCards[5].querySelector('h3').textContent = t.timer;

        // Update history tab
        const chartContainers = document.querySelectorAll('.chart-container h3');
        if (chartContainers[0]) chartContainers[0].textContent = t.weeklyMood;
        if (chartContainers[1]) chartContainers[1].textContent = t.emotionFrequency;

        const statCards = document.querySelectorAll('.stat-card h4');
        if (statCards[0]) statCards[0].textContent = t.moodStreak;
        if (statCards[1]) statCards[1].textContent = t.activitiesCompleted;
        if (statCards[2]) statCards[2].textContent = t.songsExplored;

        document.querySelector('.achievements h3').textContent = t.achievements;
        document.querySelector('.history-list h3').textContent = t.recentEntries;
        document.querySelector('.journal-list h3').textContent = t.journalEntries;
    }
}

// Initialize the app
const app = new MoodSenseApp();