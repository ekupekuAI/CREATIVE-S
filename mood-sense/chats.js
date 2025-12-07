// MoodSense+ Chat Module

class ChatManager {
    constructor() {
        this.personas = {
            parent: {
                name: 'Parent',
                tone: 'caring, supportive, nurturing',
                responses: {
                    greeting: 'Hello my dear, I\'m here for you. What\'s on your mind?',
                    support: 'I love you and I\'m proud of you. You\'re stronger than you know.',
                    advice: 'Remember, every storm passes. Let\'s take this one step at a time.'
                }
            },
            mentor: {
                name: 'Mentor',
                tone: 'wise, encouraging, professional',
                responses: {
                    greeting: 'Welcome. I\'m here to guide you through your emotional journey.',
                    support: 'You have immense potential. This challenge is an opportunity for growth.',
                    advice: 'Let\'s analyze this situation objectively and find the best path forward.'
                }
            },
            doctor: {
                name: 'Doctor/Therapist',
                tone: 'professional, empathetic, clinical',
                responses: {
                    greeting: 'Hello. I\'m here to listen and help you process your emotions.',
                    support: 'Your feelings are valid. Let\'s explore them together.',
                    advice: 'Based on what you\'re describing, here are some therapeutic approaches...'
                }
            },
            friend: {
                name: 'Friend',
                tone: 'casual, empathetic, relatable',
                responses: {
                    greeting: 'Hey buddy! What\'s up? I\'m all ears.',
                    support: 'Dude, I totally get it. We all have rough days.',
                    advice: 'You know what always helps me? Let\'s try this together.'
                }
            }
        };

        this.conversationContext = [];
        this.currentMoodContext = null;
        this.crisisMode = false;
    }

    async sendMessage(message, persona = 'auto', language = 'en') {
        this.conversationContext.push({ role: 'user', content: message });

        let selectedPersona = persona;
        if (this.crisisMode && this.forcedPersona) {
            selectedPersona = this.forcedPersona;
        } else if (persona === 'auto') {
            selectedPersona = this.selectPersonaBasedOnContext(message);
        }

        const response = await this.generateResponse(message, selectedPersona, language);
        this.conversationContext.push({ role: 'assistant', content: response });

        return {
            message: response,
            persona: this.personas[selectedPersona].name
        };
    }

    selectPersonaBasedOnContext(message) {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('help') || lowerMessage.includes('advice') || lowerMessage.includes('guidance')) {
            return 'mentor';
        } else if (lowerMessage.includes('listen') || lowerMessage.includes('talk') || lowerMessage.includes('feel')) {
            return 'doctor';
        } else if (lowerMessage.includes('love') || lowerMessage.includes('family') || lowerMessage.includes('support')) {
            return 'parent';
        } else {
            return 'friend';
        }
    }

    async generateResponse(message, persona, language) {
        // This would typically call the backend API
        // For now, we'll simulate responses based on persona

        const personaData = this.personas[persona];
        const lowerMessage = message.toLowerCase();

        let response = '';

        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            response = personaData.responses.greeting;
        } else if (lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('anxious')) {
            response = personaData.responses.support;
        } else if (lowerMessage.includes('help') || lowerMessage.includes('what should i do')) {
            response = personaData.responses.advice;
        } else {
            // Generate contextual response
            response = this.generateContextualResponse(message, persona);
        }

        // Translate if needed (simplified)
        if (language !== 'en') {
            response = this.translateResponse(response, language);
        }

        return response;
    }

    generateContextualResponse(message, persona) {
        const responses = {
            parent: [
                'I\'m here for you, sweetheart. Tell me more about how you\'re feeling.',
                'You\'re not alone in this. I\'ve been through similar situations.',
                'Let\'s focus on what we can control right now. What\'s one small step you can take?',
                'Remember when you overcame that challenge before? You\'re capable of so much.'
            ],
            mentor: [
                'Interesting perspective. Let\'s break this down together.',
                'What patterns do you notice in your emotional responses?',
                'Consider reframing this situation. What\'s another way to look at it?',
                'Your growth comes from facing these challenges. What can you learn here?'
            ],
            doctor: [
                'I hear you. Can you tell me more about when these feelings started?',
                'Let\'s identify some coping strategies that have worked for you before.',
                'It\'s normal to feel this way. Let\'s explore some healthy ways to process these emotions.',
                'How has this been affecting your daily life and relationships?'
            ],
            friend: [
                'Whoa, that sounds tough. I\'m here for you, man.',
                'I totally get where you\'re coming from. Been there!',
                'You know what? Let\'s grab some ice cream and talk about something fun.',
                'Hey, remember that time we [positive memory]? That was awesome!'
            ]
        };

        const personaResponses = responses[persona];
        return personaResponses[Math.floor(Math.random() * personaResponses.length)];
    }

    translateResponse(response, language) {
        // Simplified translation simulation
        const translations = {
            hi: {
                'Hello': 'नमस्ते',
                'I\'m here': 'मैं यहाँ हूँ',
                'You\'re not alone': 'तुम अकेले नहीं हो',
                'Let\'s talk': 'आइए बात करें'
            },
            te: {
                'Hello': 'హలో',
                'I\'m here': 'నేను ఇక్కడ ఉన్నాను',
                'You\'re not alone': 'మీరు ఒంటరిగా లేదు',
                'Let\'s talk': 'మాట్లాడుదాం'
            }
        };

        if (translations[language]) {
            for (const [en, translated] of Object.entries(translations[language])) {
                response = response.replace(new RegExp(en, 'gi'), translated);
            }
        }

        return response;
    }

    getConversationHistory() {
        return this.conversationContext;
    }

    clearConversation() {
        this.conversationContext = [];
    }

    exportConversation() {
        return JSON.stringify(this.conversationContext, null, 2);
    }

    updateMoodContext(moodData) {
        this.currentMoodContext = moodData;
        // Add mood context to conversation history
        this.conversationContext.push({
            role: 'system',
            content: `User's current mood: ${moodData.primaryEmotion}, intensity: ${moodData.intensity}, sentiment: ${moodData.sentiment}`
        });
    }

    getCurrentMoodContext() {
        return this.currentMoodContext;
    }

    setCrisisMode(enabled) {
        this.crisisMode = enabled;
        if (enabled) {
            // In crisis mode, override persona to doctor/therapist
            this.forcedPersona = 'doctor';
        } else {
            this.forcedPersona = null;
        }
    }
}

// Export for use in other modules
window.ChatManager = ChatManager;