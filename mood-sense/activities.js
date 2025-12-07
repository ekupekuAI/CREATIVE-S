// MoodSense+ Activities Module

class ActivitiesManager {
    constructor() {
        this.activitiesCompleted = JSON.parse(localStorage.getItem('activitiesCompleted')) || {};
        this.translations = {
            en: {
                breathingTitle: 'Breathing Exercise',
                breathingInstruction: 'Inhale for 4 seconds',
                bubblesTitle: 'Pop the Bubbles',
                groundingTitle: '5-4-3-2-1 Grounding',
                journalingTitle: 'Mini Journaling',
                checklistTitle: 'Self-Check List',
                timerTitle: 'Focus Timer',
                breathingInhale: 'Inhale for 4 seconds',
                breathingHold: 'Hold for 4 seconds',
                breathingExhale: 'Exhale for 4 seconds',
                groundingComplete: 'Great job! You\'ve completed the grounding exercise.',
                journalPrompt: 'What\'s on your mind right now?',
                journalSaved: 'Journal entry saved!',
                bubblesComplete: 'Great job! You popped all the bubbles. How do you feel now?',
                checklistComplete: 'You completed {completed} out of {total} self-care items. Great job!',
                timerDone: 'Time\'s up!'
            },
            hi: {
                breathingTitle: 'साँस लेने का अभ्यास',
                breathingInstruction: '4 सेकंड के लिए साँस लें',
                bubblesTitle: 'बुलबुले फोड़ें',
                groundingTitle: '5-4-3-2-1 ग्राउंडिंग',
                journalingTitle: 'मिनी जर्नलिंग',
                checklistTitle: 'सेल्फ-चेक लिस्ट',
                timerTitle: 'फोकस टाइमर',
                breathingInhale: '4 सेकंड के लिए साँस लें',
                breathingHold: '4 सेकंड तक रोकें',
                breathingExhale: '4 सेकंड के लिए साँस छोड़ें',
                groundingComplete: 'बहुत बढ़िया! आपने ग्राउंडिंग अभ्यास पूरा कर लिया है।',
                journalPrompt: 'अभी आपके मन में क्या है?',
                journalSaved: 'जर्नल प्रविष्टि सहेजी गई!',
                bubblesComplete: 'बहुत बढ़िया! आपने सभी बुलबुले फोड़ दिए। अब आप कैसा महसूस कर रहे हैं?',
                checklistComplete: 'आपने {total} में से {completed} सेल्फ-केयर आइटम पूरे किए। बहुत बढ़िया!',
                timerDone: 'समय समाप्त!'
            },
            te: {
                breathingTitle: 'శ్వాస సాధన',
                breathingInstruction: '4 సెకన్ల పాటు శ్వాస తీసుకోండి',
                bubblesTitle: 'బుడగలను పేల్చు',
                groundingTitle: '5-4-3-2-1 గ్రౌండింగ్',
                journalingTitle: 'మినీ జర్నలింగ్',
                checklistTitle: 'సెల్ఫ్-చెక్ లిస్ట్',
                timerTitle: 'ఫోకస్ టైమర్',
                breathingInhale: '4 సెకన్ల పాటు శ్వాస తీసుకోండి',
                breathingHold: '4 సెకన్ల పాటు ఆపండి',
                breathingExhale: '4 సెకన్ల పాటు శ్వాస వదలండి',
                groundingComplete: 'బాగుంది! మీరు గ్రౌండింగ్ వ్యాయామాన్ని పూర్తి చేసారు.',
                journalPrompt: 'ఇప్పుడు మీ మనసులో ఏముంది?',
                journalSaved: 'జర్నల్ ఎంట్రీ సేవ్ చేయబడింది!',
                bubblesComplete: 'బాగుంది! మీరు అన్ని బుడగలను పేల్చారు. ఇప్పుడు మీరు ఎలా అనుభూతి చెందుతున్నారు?',
                checklistComplete: 'మీరు {total}లో {completed} సెల్ఫ్-కేర్ ఐటెమ్‌లను పూర్తి చేసారు. బాగుంది!',
                timerDone: 'సమయం అయిపోయింది!'
            }
        };
        this.currentLanguage = 'en';
        this.setupActivityListeners();
    }

    setupActivityListeners() {
        document.querySelectorAll('.activity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const activity = e.target.closest('.activity-card').dataset.activity;
                this.startActivity(activity);
            });
        });

        // Breathing modal
        document.getElementById('breathing-emergency').addEventListener('click', () => {
            this.startActivity('breathing');
        });
    }

    startActivity(activityType) {
        switch (activityType) {
            case 'breathing':
                this.showBreathingExercise();
                break;
            case 'bubbles':
                this.showBubbleGame();
                break;
            case 'grounding':
                this.showGroundingExercise();
                break;
            case 'journaling':
                this.showJournalingModal();
                break;
            case 'checklist':
                this.showSelfCheckList();
                break;
            case 'timer':
                this.showFocusTimer();
                break;
        }

        // Track activity completion
        this.activitiesCompleted[activityType] = (this.activitiesCompleted[activityType] || 0) + 1;
        localStorage.setItem('activitiesCompleted', JSON.stringify(this.activitiesCompleted));
    }

    showBreathingExercise() {
        const modal = document.getElementById('breathing-modal');
        modal.style.display = 'block';

        const instruction = document.getElementById('breathing-instruction');
        const circle = document.querySelector('.breathing-circle');
        const t = this.translations[this.currentLanguage] || this.translations.en;

        let phase = 0;
        const phases = [
            { text: t.breathingInhale, duration: 4000 },
            { text: t.breathingHold, duration: 4000 },
            { text: t.breathingExhale, duration: 4000 },
            { text: t.breathingHold, duration: 4000 }
        ];

        const runPhase = () => {
            instruction.textContent = phases[phase].text;
            circle.style.animation = `breathe ${phases[phase].duration}ms infinite`;

            setTimeout(() => {
                phase = (phase + 1) % phases.length;
                runPhase();
            }, phases[phase].duration);
        };

        runPhase();
    }

    showBubbleGame() {
        const modal = document.getElementById('bubbles-modal');
        modal.style.display = 'block';

        const container = document.querySelector('.bubbles-container');
        container.innerHTML = '';

        let bubblesPopped = 0;
        const totalBubbles = 20;

        for (let i = 0; i < totalBubbles; i++) {
            const bubble = document.createElement('div');
            bubble.className = 'bubble';
            bubble.style.left = Math.random() * 80 + '%';
            bubble.style.top = Math.random() * 80 + '%';
            bubble.style.animationDelay = Math.random() * 2 + 's';

            bubble.addEventListener('click', () => {
                bubble.remove();
                bubblesPopped++;
                if (bubblesPopped === totalBubbles) {
                    setTimeout(() => {
                        const t = this.translations[this.currentLanguage] || this.translations.en;
                        alert(t.bubblesComplete);
                        modal.style.display = 'none';
                    }, 500);
                }
            });

            container.appendChild(bubble);
        }
    }

    showGroundingExercise() {
        const modal = document.getElementById('grounding-modal');
        modal.style.display = 'block';

        const stepsContainer = document.getElementById('grounding-steps');
        stepsContainer.innerHTML = '';

        const steps = [
            '5 things you can see',
            '4 things you can touch',
            '3 things you can hear',
            '2 things you can smell',
            '1 thing you can taste'
        ];

        let currentStep = 0;

        const showStep = () => {
            if (currentStep < steps.length) {
                const stepDiv = document.createElement('div');
                stepDiv.innerHTML = `
                    <h3>${steps[currentStep]}</h3>
                    <textarea placeholder="List them here..." rows="3"></textarea>
                    <button class="next-step-btn">Next</button>
                `;

                const nextBtn = stepDiv.querySelector('.next-step-btn');
                nextBtn.addEventListener('click', () => {
                    currentStep++;
                    stepsContainer.innerHTML = '';
                    showStep();
                });

                stepsContainer.appendChild(stepDiv);
            } else {
                const t = this.translations[this.currentLanguage] || this.translations.en;
                stepsContainer.innerHTML = `<h3>${t.groundingComplete}</h3>`;
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 3000);
            }
        };

        showStep();
    }

    showJournalingModal() {
        const modal = document.getElementById('journaling-modal');
        modal.style.display = 'block';

        const prompts = [
            this.translations[this.currentLanguage]?.journalPrompt || 'What\'s on your mind right now?',
            'What emotions are you feeling today?',
            'What\'s one thing you\'re grateful for?',
            'What\'s a challenge you\'re facing?',
            'What would you tell your younger self?'
        ];

        document.getElementById('journal-prompt').textContent =
            prompts[Math.floor(Math.random() * prompts.length)];

        document.getElementById('save-journal').addEventListener('click', () => {
            const entry = document.getElementById('journal-entry').value;
            if (entry.trim()) {
                const journalEntries = JSON.parse(localStorage.getItem('journalEntries')) || [];
                journalEntries.push({
                    prompt: document.getElementById('journal-prompt').textContent,
                    entry,
                    timestamp: new Date().toISOString()
                });
                localStorage.setItem('journalEntries', JSON.stringify(journalEntries));
                const t = this.translations[this.currentLanguage] || this.translations.en;
                alert(t.journalSaved);
                modal.style.display = 'none';
            }
        });
    }

    showSelfCheckList() {
        const modal = document.getElementById('checklist-modal');
        modal.style.display = 'block';

        const checklistItems = document.getElementById('checklist-items');
        checklistItems.innerHTML = '';

        const items = [
            { text: 'Have you had enough water today?', checked: false },
            { text: 'Have you eaten something nutritious?', checked: false },
            { text: 'Have you moved your body today?', checked: false },
            { text: 'Have you taken deep breaths?', checked: false },
            { text: 'Have you connected with someone?', checked: false },
            { text: 'Have you done something you enjoy?', checked: false }
        ];

        items.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <label>
                    <input type="checkbox" id="check-${index}">
                    ${item.text}
                </label>
            `;
            checklistItems.appendChild(li);
        });

        // Save checklist state
        setTimeout(() => {
            modal.style.display = 'none';
            const completedItems = items.filter((_, index) =>
                document.getElementById(`check-${index}`).checked
            ).length;
            const t = this.translations[this.currentLanguage] || this.translations.en;
            const message = t.checklistComplete.replace('{completed}', completedItems).replace('{total}', items.length);
            alert(message);
        }, 10000); // Auto-close after 10 seconds
    }

    showFocusTimer() {
        const modal = document.getElementById('timer-modal');
        modal.style.display = 'block';

        const display = document.querySelector('.timer-display');
        const startBtn = document.getElementById('start-timer');

        let timeLeft = 60;
        let timerId = null;

        const updateDisplay = () => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };

        const startTimer = () => {
            if (timerId) return;

            startBtn.textContent = 'Running...';
            startBtn.disabled = true;

            timerId = setInterval(() => {
                timeLeft--;
                updateDisplay();

                if (timeLeft <= 0) {
                    clearInterval(timerId);
                    const t = this.translations[this.currentLanguage] || this.translations.en;
                    display.textContent = t.timerDone;
                    startBtn.textContent = 'Done!';
                    setTimeout(() => {
                        modal.style.display = 'none';
                    }, 2000);
                }
            }, 1000);
        };

        startBtn.addEventListener('click', startTimer);
        updateDisplay();
    }

    getActivityStats() {
        return this.activitiesCompleted;
    }

    resetActivityStats() {
        this.activitiesCompleted = {};
        localStorage.setItem('activitiesCompleted', JSON.stringify(this.activitiesCompleted));
    }

    setLanguage(language) {
        this.currentLanguage = language;
    }
}

// Export for use in other modules
window.ActivitiesManager = ActivitiesManager;