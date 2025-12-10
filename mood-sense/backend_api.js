                    'use strict';

                    (function attachBackendAPI(global) {
                        const API_BASE = window.MOOD_API_BASE || '';
                        const API = {
                            analyze: `${API_BASE}/api/mood/analyze`,
                            chat: `${API_BASE}/api/mood/chat`,
                            songs: `${API_BASE}/api/mood/songs`
                        };

                        const DEFAULT_LANGUAGE = 'en';
                        const DEFAULT_PERSONA = 'companion';

                        const CRISIS_TERMS = [
                            'self harm',
                            'suicide',
                            'end it',
                            'kill myself',
                            'hurt myself',
                            'ending everything',
                            'can\'t go on',
                            'hopeless',
                            'no reason to live'
                        ];

                        const EMOTION_KEYWORDS = {
                            joy: ['happy', 'joy', 'excited', 'grateful', 'optimistic', 'peaceful'],
                            sadness: ['sad', 'down', 'lonely', 'cry', 'empty', 'heartbroken'],
                            anger: ['angry', 'mad', 'furious', 'irritated', 'frustrated'],
                            anxiety: ['worried', 'anxious', 'nervous', 'panic', 'scared', 'tense'],
                            fear: ['afraid', 'fear', 'terrified', 'unsafe'],
                            disgust: ['disgusted', 'gross', 'repulsed'],
                            surprise: ['shocked', 'surprised', 'can\'t believe'],
                            calm: ['calm', 'relaxed', 'grounded']
                        };

                        const SENTIMENT_TOKENS = {
                            positive: ['happy', 'good', 'great', 'love', 'grateful', 'excited', 'proud', 'hopeful'],
                            negative: ['sad', 'bad', 'hate', 'awful', 'terrible', 'worried', 'angry', 'stress', 'tired']
                        };

                        const INTENSITY_WORDS = {
                            high: ['extremely', 'overwhelmed', 'can\'t breathe', 'terrified', 'furious', 'devastated'],
                            elevated: ['really', 'very', 'so much', 'too much', 'super'],
                            low: ['slightly', 'a bit', 'kind of']
                        };

                        const AFFIRMATIONS = {
                            joy: ['Share this light; it inspires others.', 'You earned this feeling—enjoy it fully.'],
                            sadness: ['Your feelings are valid.', 'Small steps forward still count.'],
                            anger: ['You can honor anger without letting it lead.', 'Pause; calm strength is still strength.'],
                            anxiety: ['Breathe—your body can relearn calm.', 'Worries are thoughts, not facts.'],
                            fear: ['Courage often looks like staying present.', 'Safety is built one small choice at a time.'],
                            disgust: ['It is okay to step away from what drains you.', 'You can choose what deserves your energy.'],
                            surprise: ['Uncertainty can hold new possibilities.', 'You adapt even when plans shift.'],
                            calm: ['Grounded moments refill your reserves.', 'Protect this peace; it is powerful.'],
                            neutral: ['Every feeling is welcome information.', 'You are allowed to take up space.']
                        };

                        const ACTIVITIES = {
                            joy: ['Text someone who would celebrate with you.', 'Capture this moment in a journal.'],
                            sadness: ['Step outside for light or air.', 'Play a song that mirrors and soothes.'],
                            anger: ['Move your body—walk fast, stretch, punch a pillow.', 'Write the unfiltered thoughts, then rip the page.'],
                            anxiety: ['Trace five things you can see, four you can touch.', 'Slow inhale for four, hold four, exhale six.'],
                            fear: ['List what you control right now.', 'Reach out to a steady person or hotline.'],
                            disgust: ['Declutter a tiny space to reset.', 'Drink water or rinse your face for a sensory reset.'],
                            surprise: ['Name three anchors you trust.', 'Plan one gentle next step.'],
                            calm: ['Do a mindful stretch.', 'Share encouragement with someone who needs it.'],
                            neutral: ['Check in with your body posture.', 'Queue a playlist that fits the vibe you want next.']
                        };

                        const COPING_STEPS = {
                            joy: ['1. Notice where joy sits in your body.', '2. Thank yourself for nurturing it.', '3. Decide how to sustain it.'],
                            sadness: ['1. Allow tears or silence.', '2. Text or call one person.', '3. Hydrate and eat something nourishing.'],
                            anger: ['1. Pause and breathe from the diaphragm.', '2. Channel energy into movement.', '3. Revisit the situation once calmer.'],
                            anxiety: ['1. Anchor to senses.', '2. Challenge the loudest worry.', '3. Choose one manageable action.'],
                            fear: ['1. Assess immediate safety.', '2. Ground with cold water or a weighted blanket.', '3. Create a short safety plan.'],
                            disgust: ['1. Name what crosses your boundary.', '2. Reaffirm your standards.', '3. Engage in a cleansing ritual (shower, tidy).'],
                            surprise: ['1. Write what changed.', '2. Identify support.', '3. Break response into micro-steps.'],
                            calm: ['1. Protect the space (silence notifications).', '2. Extend calm breathing.', '3. Set an intention for the next hour.'],
                            neutral: ['1. Scan body from head to toe.', '2. Stretch or walk briefly.', '3. Choose the next nourishing task.']
                        };

                        const PERSONA_FALLBACKS = {
                            companion: 'I am right here. What feels heaviest at this moment?',
                            mentor: 'Let us unpack this together. What pattern do you notice?',
                            parent: 'You are cared for. Tell me what is weighing on you.',
                            friend: 'I am listening—say whatever you need.',
                            professional: 'We can explore this safely. Describe what you are feeling.'
                        };

                        const FALLBACK_MUSIC = {
                            en: {
                                joy: [
                                    { title: 'Good as Hell', artist: 'Lizzo', spotify: 'https://open.spotify.com/track/2t8yVaLvJ0RenpXUIAC52d', youtube: 'https://www.youtube.com/watch?v=SmbmeOgWsqE' },
                                    { title: 'Classic', artist: 'MKTO', spotify: 'https://open.spotify.com/track/1HFf9oufQcojrZ9AgP9iwF', youtube: 'https://www.youtube.com/watch?v=4Ba_qTPA4Ds' }
                                ],
                                sadness: [
                                    { title: 'The Night We Met', artist: 'Lord Huron', spotify: 'https://open.spotify.com/track/0s6jHS9M0V1rzo1Th9uVIB', youtube: 'https://www.youtube.com/watch?v=KtlgYxa6BMU' },
                                    { title: 'Turning Tables', artist: 'Adele', spotify: 'https://open.spotify.com/track/7H8zKQ6tp7cY9tDpdqnNFO', youtube: 'https://www.youtube.com/watch?v=bsFCO8-oCEQ' }
                                ],
                                anger: [
                                    { title: 'Believer', artist: 'Imagine Dragons', spotify: 'https://open.spotify.com/track/0pqnGHJpmpxLKifKRmU6wp', youtube: 'https://www.youtube.com/watch?v=7wtfhZwyrcc' },
                                    { title: 'Titanium', artist: 'David Guetta ft. Sia', spotify: 'https://open.spotify.com/track/0lHAMNU8RGiIObScrsRgmP', youtube: 'https://www.youtube.com/watch?v=JRfuAukYTKg' }
                                ],
                                anxiety: [
                                    { title: 'Weightless', artist: 'Marconi Union', spotify: 'https://open.spotify.com/track/1WJzDVVVFG1gKz1d0P8twz', youtube: 'https://www.youtube.com/watch?v=UfcAVejs1Ac' },
                                    { title: 'Holocene', artist: 'Bon Iver', spotify: 'https://open.spotify.com/track/4JqP8qHNsZpqBsW7g0RJn0', youtube: 'https://www.youtube.com/watch?v=TWcyIpul8OE' }
                                ],
                                neutral: [
                                    { title: 'Bloom', artist: 'ODESZA', spotify: 'https://open.spotify.com/track/3bH1m0Ys8MRQXz18kI7cP1', youtube: 'https://www.youtube.com/watch?v=PLFVGwGQcB0' },
                                    { title: 'Midnight City', artist: 'M83', spotify: 'https://open.spotify.com/track/6qspW4YKycviDFjHBOaqUY', youtube: 'https://www.youtube.com/watch?v=dX3k_QDnzHE' }
                                ]
                            },
                            hi: {
                                joy: [
                                    { title: 'Ilahi', artist: 'Arijit Singh', spotify: 'https://open.spotify.com/track/4Tuglexj7IqlEKxCwGkU1C', youtube: 'https://www.youtube.com/watch?v=FJ55SHCzt88' },
                                    { title: 'Zinda', artist: 'Siddharth Mahadevan', spotify: 'https://open.spotify.com/track/1mXVgsBdtIVeCLJnSnmtdV', youtube: 'https://www.youtube.com/watch?v=W9vpcnXwW4M' }
                                ],
                                sadness: [
                                    { title: 'Channa Mereya', artist: 'Arijit Singh', spotify: 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC', youtube: 'https://www.youtube.com/watch?v=284Ov7ysmfA' },
                                    { title: 'Kabira (Encore)', artist: 'Arijit Singh & Harshdeep Kaur', spotify: 'https://open.spotify.com/track/4GcvDaXWLeE8P6GjqrxA0T', youtube: 'https://www.youtube.com/watch?v=jHNNMj5bNQw' }
                                ],
                                anger: [
                                    { title: 'Zinda Rehti Hain Mohabbatein', artist: 'Shankar-Ehsaan-Loy', spotify: 'https://open.spotify.com/track/5pEEiR5D1ZsaAJ2bXqIuAv', youtube: 'https://www.youtube.com/watch?v=MBwR1ek4Qts' },
                                    { title: 'Sultan (Title Track)', artist: 'Sukhwinder Singh', spotify: 'https://open.spotify.com/track/0HI7QovnFykdfz7xgVK8Nj', youtube: 'https://www.youtube.com/watch?v=wPxqcq6Byq0' }
                                ],
                                anxiety: [
                                    { title: 'Ae Watan', artist: 'Sunidhi Chauhan', spotify: 'https://open.spotify.com/track/6wxVfZ7x8Wc1Kqz3PaVTm7', youtube: 'https://www.youtube.com/watch?v=K4DyBUG242c' },
                                    { title: 'Yeh Honsla', artist: 'Shafqat Amanat Ali', spotify: 'https://open.spotify.com/track/6wyLEdCNXas7aP42ZpZgdK', youtube: 'https://www.youtube.com/watch?v=y3wyY6YBX1Y' }
                                ],
                                neutral: [
                                    { title: 'Dil Dhadakne Do', artist: 'Priyanka Chopra & Farhan Akhtar', spotify: 'https://open.spotify.com/track/1Je1IMUlBXcx1Fz0WE7oPT', youtube: 'https://www.youtube.com/watch?v=0fC3qRmA9dM' },
                                    { title: 'Tera Yaar Hoon Main', artist: 'Arijit Singh', spotify: 'https://open.spotify.com/track/4iJyoBOLtHqaGxP12qzhQI', youtube: 'https://www.youtube.com/watch?v=COz9lDCFHjw' }
                                ]
                            },
                            te: {
                                joy: [
                                    { title: 'Samajavaragamana', artist: 'Sid Sriram', spotify: 'https://open.spotify.com/track/5sAqGzu1ntrQK1p3sZG3Lj', youtube: 'https://www.youtube.com/watch?v=UFua94d1Z40' },
                                    { title: 'Butta Bomma', artist: 'Armaan Malik', spotify: 'https://open.spotify.com/track/0sR2xer0j0BhzHq2elvAtp', youtube: 'https://www.youtube.com/watch?v=1JNmz17gnMw' }
                                ],
                                sadness: [
                                    { title: 'Priyathama Priyathama', artist: 'Niranj Suresh', spotify: 'https://open.spotify.com/track/5I71RJKVQ1BM8DT6vKrrf5', youtube: 'https://www.youtube.com/watch?v=MV5fJChER4Q' },
                                    { title: 'Ninu Chusthu', artist: 'S. P. Balasubrahmanyam', spotify: 'https://open.spotify.com/track/14knc8LZRxurx8Wc58SUqC', youtube: 'https://www.youtube.com/watch?v=C_3d6GntKbk' }
                                ],
                                anger: [
                                    { title: 'Blockbuster', artist: 'Thaman S', spotify: 'https://open.spotify.com/track/4JedLdwNJxElb5TADaBrZE', youtube: 'https://www.youtube.com/watch?v=Q0qsF8ZvpfM' },
                                    { title: 'Psycho Saiyaan', artist: 'Dhruv Vikram & Shreya Ghoshal', spotify: 'https://open.spotify.com/track/5JkZdgVw5dUvNbzH6JNhyk', youtube: 'https://www.youtube.com/watch?v=Rr7E-5bYuyE' }
                                ],
                                anxiety: [
                                    { title: 'Inthandham', artist: 'Chaitra Ambadipudi', spotify: 'https://open.spotify.com/track/4iJyoBOLtHqaGxP12qzhQI', youtube: 'https://www.youtube.com/watch?v=SN6PzGJYZ1k' },
                                    { title: 'Padara Padara', artist: 'Gopi Sundar', spotify: 'https://open.spotify.com/track/1Je1IMUlBXcx1Fz0WE7oPT', youtube: 'https://www.youtube.com/watch?v=2qTa3J8wNHc' }
                                ],
                                neutral: [
                                    { title: 'Nadikalila', artist: 'Anirudh Ravichander', spotify: 'https://open.spotify.com/track/3XVBdLihbNbxUwZosxcGuJ', youtube: 'https://www.youtube.com/watch?v=c6zQvLp-wYY' },
                                    { title: 'Yemito', artist: 'Karthik & Sunitha', spotify: 'https://open.spotify.com/track/0DUURSoCdvUBY0KU32qJg1', youtube: 'https://www.youtube.com/watch?v=ssW5JVaod0U' }
                                ]
                            }
                        };

                        class BackendAPI {
                            static async analyze(text, language = DEFAULT_LANGUAGE) {
                                const cleanText = text?.trim();
                                if (!cleanText) {
                                    return this.fallbackAnalyze('', language);
                                }

                                try {
                                    const payload = {
                                        text: cleanText,
                                        language,
                                        timestamp: new Date().toISOString()
                                    };
                                    const response = await this.requestJSON(API.analyze, payload);
                                    return this.normalizeAnalysis(response, cleanText, language);
                                } catch (error) {
                                    console.warn('Mood analysis failed, using fallback.', error);
                                    return this.fallbackAnalyze(cleanText, language);
                                }
                            }

                            static async chat(message, persona = DEFAULT_PERSONA, language = DEFAULT_LANGUAGE, history = [], moodProfile = null) {
                                const cleanMessage = message?.trim();
                                if (!cleanMessage) {
                                    return {
                                        message: 'Share a thought or feeling so I can respond.',
                                        persona,
                                        timestamp: new Date().toISOString()
                                    };
                                }

                                try {
                                    const payload = {
                                        message: cleanMessage,
                                        persona,
                                        language,
                                        history,
                                        mood_profile: moodProfile
                                    };
                                    const response = await this.requestJSON(API.chat, payload);
                                    return {
                                        message: response?.response || PERSONA_FALLBACKS[persona] || PERSONA_FALLBACKS.companion,
                                        persona: response?.persona || persona,
                                        suggestions: response?.suggestions || [],
                                        timestamp: new Date().toISOString()
                                    };
                                } catch (error) {
                                    console.warn('Chat endpoint unavailable, using fallback.', error);
                                    return {
                                        message: PERSONA_FALLBACKS[persona] || PERSONA_FALLBACKS.companion,
                                        persona,
                                        suggestions: [],
                                        timestamp: new Date().toISOString()
                                    };
                                }
                            }

                            static async getMusicSuggestions(emotion = 'neutral', language = DEFAULT_LANGUAGE) {
                                const mood = emotion || 'neutral';
                                try {
                                    const payload = {
                                        mood_profile: { primary_emotion: mood },
                                        language
                                    };
                                    const response = await this.requestJSON(API.songs, payload);
                                    return this.normalizeSongs(response?.songs, mood, language);
                                } catch (error) {
                                    console.warn('Music suggestions fallback in use.', error);
                                    return this.normalizeSongs(null, mood, language);
                                }
                            }

                            static normalizeAnalysis(payload, text, language) {
                                const profile = payload?.mood_profile || {};
                                const heuristics = this.runHeuristics(text);
                                const emotion = profile.primary_emotion || payload?.emotion || heuristics.emotion;
                                const sentiment = profile.sentiment?.label || payload?.sentiment || heuristics.sentiment;
                                const intensityScore = typeof profile.intensity === 'number' ? profile.intensity : payload?.intensity;
                                const intensityValue = typeof intensityScore === 'number' ? intensityScore : heuristics.intensity;
                                const breakdown = this.normalizeBreakdown(profile.all_emotions || payload?.breakdown || heuristics.breakdown);
                                const crisis = this.detectCrisis(text);

                                return {
                                    emotion,
                                    sentiment,
                                    intensity: {
                                        label: this.mapIntensity(intensityValue),
                                        value: Number(intensityValue?.toFixed?.(2) ?? heuristics.intensity)
                                    },
                                    emoji: this.emojiFor(emotion),
                                    breakdown,
                                    affirmations: payload?.affirmations || this.getAffirmations(emotion, language),
                                    activities: payload?.activities || this.getActivities(emotion, language),
                                    coping: payload?.coping || this.getCoping(emotion, language),
                                    music: this.normalizeSongs(payload?.songs, emotion, language),
                                    crisis,
                                    confidence: payload?.confidence || profile?.confidence || heuristics.confidence,
                                    timestamp: new Date().toISOString(),
                                    raw: payload
                                };
                            }

                            static normalizeBreakdown(input) {
                                if (!input) {
                                    return { joy: 0.2, sadness: 0.2, anger: 0.2, anxiety: 0.2, calm: 0.2 };
                                }

                                if (Array.isArray(input)) {
                                    const normalized = {};
                                    input.forEach(({ label, score }) => {
                                        if (label) {
                                            normalized[label.toLowerCase()] = Number(score || 0);
                                        }
                                    });
                                    return this.normalizeScores(normalized);
                                }

                                if (typeof input === 'object') {
                                    return this.normalizeScores(input);
                                }

                                return { joy: 0.2, sadness: 0.2, anger: 0.2, anxiety: 0.2, calm: 0.2 };
                            }

                            static normalizeScores(scores) {
                                const entries = Object.entries(scores);
                                const safeEntries = entries.filter(([key, value]) => typeof value === 'number' && !Number.isNaN(value));
                                const total = safeEntries.reduce((sum, [, value]) => sum + Math.max(value, 0), 0);
                                if (!total) {
                                    return { joy: 0.2, sadness: 0.2, anger: 0.2, anxiety: 0.2, calm: 0.2 };
                                }

                                return safeEntries.reduce((acc, [key, value]) => {
                                    acc[key.toLowerCase()] = value / total;
                                    return acc;
                                }, {});
                            }

                            static normalizeSongs(songs, emotion = 'neutral', language = DEFAULT_LANGUAGE) {
                                if (Array.isArray(songs) && songs.length) {
                                    return songs.map((song) => ({
                                        title: song.title || song.name || 'Untitled',
                                        artist: song.artist || song.by || 'Unknown artist',
                                        links: {
                                            spotify: song.spotifyLink || song.spotify || null,
                                            youtube: song.youtubeLink || song.youtube || null
                                        },
                                        mood: song.mood || emotion
                                    }));
                                }

                                const library = FALLBACK_MUSIC[language] || FALLBACK_MUSIC.en;
                                const bucket = library[emotion] || library.neutral;
                                return bucket.map((song) => ({
                                    title: song.title,
                                    artist: song.artist,
                                    links: { spotify: song.spotify, youtube: song.youtube },
                                    mood: emotion
                                }));
                            }

                            static fallbackAnalyze(text, language) {
                                const heuristics = this.runHeuristics(text);
                                return {
                                    emotion: heuristics.emotion,
                                    sentiment: heuristics.sentiment,
                                    intensity: {
                                        label: this.mapIntensity(heuristics.intensity),
                                        value: Number(heuristics.intensity.toFixed(2))
                                    },
                                    emoji: this.emojiFor(heuristics.emotion),
                                    breakdown: heuristics.breakdown,
                                    affirmations: this.getAffirmations(heuristics.emotion, language),
                                    activities: this.getActivities(heuristics.emotion, language),
                                    coping: this.getCoping(heuristics.emotion, language),
                                    music: this.normalizeSongs(null, heuristics.emotion, language),
                                    crisis: this.detectCrisis(text),
                                    confidence: heuristics.confidence,
                                    timestamp: new Date().toISOString(),
                                    raw: { fallback: true }
                                };
                            }

                            static runHeuristics(text) {
                                const lower = (text || '').toLowerCase();
                                const counts = {};
                                Object.entries(EMOTION_KEYWORDS).forEach(([emotion, keywords]) => {
                                    counts[emotion] = keywords.reduce((sum, keyword) => sum + (lower.includes(keyword) ? 1 : 0), 0);
                                });

                                const emotion = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
                                const sentimentScores = {
                                    positive: SENTIMENT_TOKENS.positive.reduce((sum, token) => sum + (lower.includes(token) ? 1 : 0), 0),
                                    negative: SENTIMENT_TOKENS.negative.reduce((sum, token) => sum + (lower.includes(token) ? 1 : 0), 0)
                                };
                                let sentiment = 'neutral';
                                if (sentimentScores.positive > sentimentScores.negative) sentiment = 'positive';
                                if (sentimentScores.negative > sentimentScores.positive) sentiment = 'negative';

                                let intensity = 0.45;
                                if (INTENSITY_WORDS.high.some((word) => lower.includes(word))) intensity += 0.35;
                                if (INTENSITY_WORDS.elevated.some((word) => lower.includes(word))) intensity += 0.2;
                                if (INTENSITY_WORDS.low.some((word) => lower.includes(word))) intensity -= 0.15;
                                intensity = Math.min(Math.max(intensity, 0), 1);

                                const breakdown = this.normalizeScores({
                                    joy: counts.joy || 0.1,
                                    sadness: counts.sadness || 0.1,
                                    anger: counts.anger || 0.1,
                                    anxiety: counts.anxiety || counts.fear || 0.1,
                                    calm: counts.calm || 0.1
                                });

                                return {
                                    emotion,
                                    sentiment,
                                    intensity,
                                    breakdown,
                                    confidence: 0.55 + Math.min(intensity, 0.35)
                                };
                            }

                            static detectCrisis(text) {
                                const lower = (text || '').toLowerCase();
                                const matches = CRISIS_TERMS.filter((term) => lower.includes(term));
                                return { flagged: matches.length > 0, keywords: matches };
                            }

                            static emojiFor(emotion = 'neutral') {
                                const map = {
                                    joy: '😊',
                                    sadness: '😢',
                                    anger: '😠',
                                    anxiety: '😰',
                                    fear: '😨',
                                    disgust: '🤢',
                                    surprise: '😮',
                                    calm: '😌',
                                    neutral: '😐'
                                };
                                return map[emotion] || map.neutral;
                            }

                            static mapIntensity(value = 0.5) {
                                if (value >= 0.75) return 'high';
                                if (value >= 0.55) return 'elevated';
                                if (value >= 0.3) return 'moderate';
                                return 'low';
                            }

                            static getAffirmations(emotion, language) {
                                const bucket = AFFIRMATIONS[emotion] || AFFIRMATIONS.neutral;
                                return this.translateList(bucket, language);
                            }

                            static getActivities(emotion, language) {
                                const bucket = ACTIVITIES[emotion] || ACTIVITIES.neutral;
                                return this.translateList(bucket, language);
                            }

                            static getCoping(emotion, language) {
                                const bucket = COPING_STEPS[emotion] || COPING_STEPS.neutral;
                                return this.translateList(bucket, language);
                            }

                            static translateList(list, language) {
                                // Placeholder for future localization pipeline. Currently returns the original list.
                                return Array.isArray(list) ? [...list] : [];
                            }

                            static async requestJSON(url, body) {
                                const response = await fetch(url, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(body)
                                });

                                if (!response.ok) {
                                    throw new Error(`Request failed with ${response.status}`);
                                }

                                return response.json();
                            }
                        }

                        global.BackendAPI = BackendAPI;
                    })(window);