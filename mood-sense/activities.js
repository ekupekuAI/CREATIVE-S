'use strict';

class ActivitiesManager {
    constructor() {
        this.stats = {};
        // Defer init until AppStorage is available
        if (window.awaitAppStorage) {
            window.awaitAppStorage().then(() => this.init());
        } else {
            // Fallback: try on next tick
            setTimeout(() => this.init(), 0);
        }
    }

    async init() {
        this.stats = await AppStorage.load('moodSense/stats', { activitiesCompleted: 0 });
    }

    showBreathing() {
        UIManager.showModal('modal-breathing');
        const visual = document.getElementById('breathingVisual');
        const instruction = document.getElementById('breathingInstruction');
        if (!visual || !instruction) return;
        let step = 0;
        const steps = ['Inhale for 4', 'Hold for 7', 'Exhale for 8'];
        const animate = () => {
            instruction.textContent = steps[step];
            visual.style.transform = step === 0 ? 'scale(1.2)' : step === 1 ? 'scale(1.2)' : 'scale(1)';
            setTimeout(() => {
                step = (step + 1) % steps.length;
                animate();
            }, 4000);
        };
        animate();
        this.updateStats();
    }

    showBubbles() {
        UIManager.showModal('modal-bubbles');
        const stage = document.getElementById('bubblesStage');
        if (!stage) return;
        UIManager.clean(stage);
        for (let i = 0; i < 10; i++) {
            const bubble = UIManager.createEl('div', { class: 'bubble' });
            bubble.style.left = Math.random() * 100 + '%';
            bubble.style.top = Math.random() * 100 + '%';
            bubble.addEventListener('click', () => bubble.remove());
            stage.appendChild(bubble);
        }
        this.updateStats();
    }

    showGrounding() {
        UIManager.showModal('modal-grounding');
        const steps = document.getElementById('groundingSteps');
        if (!steps) return;
        UIManager.clean(steps);
        const groundingSteps = [
            '5 things you can see',
            '4 things you can touch',
            '3 things you can hear',
            '2 things you can smell',
            '1 thing you can taste'
        ];
        groundingSteps.forEach(step => {
            const div = UIManager.createEl('div', { textContent: step });
            steps.appendChild(div);
        });
        this.updateStats();
    }

    showJournaling() {
        UIManager.showModal('modal-journaling');
        // Assume save button exists
        const saveBtn = document.getElementById('saveJournal');
        const entryEl = document.getElementById('journalEntry');
        if (!saveBtn || !entryEl) return;
        saveBtn.addEventListener('click', async () => {
            const entry = entryEl.value;
            const journal = await AppStorage.load('moodSense/journal', []);
            journal.push({ entry, timestamp: new Date().toISOString() });
            await AppStorage.save('moodSense/journal', journal);
            UIManager.hideModal('modal-journaling');
            this.updateStats();
        });
    }

    showChecklist() {
        UIManager.showModal('modal-checklist');
        const list = document.getElementById('checklistItems');
        if (!list) return;
        UIManager.clean(list);
        const items = ['Drink water', 'Eat healthy', 'Exercise', 'Meditate', 'Call a friend'];
        items.forEach(item => {
            const li = UIManager.createEl('li');
            const checkbox = UIManager.createEl('input', { type: 'checkbox' });
            li.appendChild(checkbox);
            li.appendChild(document.createTextNode(item));
            list.appendChild(li);
        });
        this.updateStats();
    }

    showTimer() {
        UIManager.showModal('modal-timer');
        let time = 60;
        const display = document.getElementById('timerDisplay');
        const startBtn = document.getElementById('startTimer');
        if (!display || !startBtn) return;
        startBtn.addEventListener('click', () => {
            const interval = setInterval(() => {
                time--;
                display.textContent = time;
                if (time <= 0) {
                    clearInterval(interval);
                    UIManager.toast('Time\'s up!');
                }
            }, 1000);
        });
        this.updateStats();
    }

    async updateStats() {
        this.stats.activitiesCompleted++;
        await AppStorage.save('moodSense/stats', this.stats);
    }
}

const activitiesManager = new ActivitiesManager();
window.ActivitiesManager = activitiesManager;