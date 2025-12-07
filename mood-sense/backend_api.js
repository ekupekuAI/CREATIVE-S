// MoodSense+ Backend API Module

class BackendAPI {
    static baseURL = ''; // Use relative URLs for main server integration

    static async analyzeMood(text, language = 'en') {
        try {
            // Enhanced semantic analysis with communication properties
            const semanticAnalysis = this.performSemanticAnalysis(text, language);

            const response = await fetch('/mood/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    language,
                    semantic_analysis: semanticAnalysis,
                    communication_properties: this.extractCommunicationProperties(text),
                    context: {
                        timestamp: new Date().toISOString(),
                        language,
                        text_length: text.length,
                        word_count: text.split(' ').length
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return this.transformServerResponse(data, semanticAnalysis);
        } catch (error) {
            console.error('Mood analysis API error:', error);
            return this.getIntelligentFallbackAnalysis(text, language);
        }
    }

    static transformServerResponse(data, semanticAnalysis) {
        // Transform server response to match frontend expectations with enhanced intelligence
        const moodProfile = data.mood_profile || {};
        const primaryEmotion = moodProfile.primary_emotion || 'neutral';

        // Enhance with semantic analysis
        const enhancedIntensity = this.combineIntensities(
            moodProfile.intensity || 0.5,
            semanticAnalysis.emotional_intensity
        );

        return {
            primaryEmotion,
            intensity: this.mapIntensity(enhancedIntensity),
            sentiment: moodProfile.sentiment?.label || 'neutral',
            emoji: this.getEmojiForEmotion(primaryEmotion),
            affirmations: data.affirmations || this.getIntelligentAffirmations(primaryEmotion, semanticAnalysis, data.language || 'en'),
            musicSuggestions: [], // Will be populated after language selection
            suggestedActivities: data.activities || this.getIntelligentActivities(primaryEmotion, semanticAnalysis, data.language || 'en'),
            copingSteps: this.getIntelligentCopingSteps(primaryEmotion, semanticAnalysis, data.language || 'en'),
            breakdown: this.createEnhancedEmotionBreakdown(moodProfile.all_emotions || [], semanticAnalysis),
            semanticInsights: semanticAnalysis,
            communicationProfile: data.communication_properties || {},
            analysisConfidence: this.calculateAnalysisConfidence(semanticAnalysis)
        };
    }

    static combineIntensities(serverIntensity, semanticIntensity) {
        // Combine server and semantic analysis for more accurate intensity
        return (serverIntensity * 0.7) + (semanticIntensity * 0.3);
    }

    static calculateAnalysisConfidence(semanticAnalysis) {
        // Calculate confidence based on various factors
        let confidence = 0.5; // baseline

        // Higher confidence with more emotional indicators
        if (semanticAnalysis.emotional_intensity > 0.7) confidence += 0.2;
        if (semanticAnalysis.sentiment_layers.surface !== 'neutral') confidence += 0.1;
        if (Object.keys(semanticAnalysis.cognitive_patterns).length > 0) confidence += 0.1;
        if (Object.keys(semanticAnalysis.behavioral_indicators).length > 0) confidence += 0.1;

        // Lower confidence with contradictions
        if (semanticAnalysis.sentiment_layers.conflicted) confidence -= 0.1;
        if (semanticAnalysis.sentiment_layers.suppressed) confidence -= 0.1;

        return Math.max(0.1, Math.min(1.0, confidence));
    }

    static getIntelligentAffirmations(emotion, semanticAnalysis, language = 'en') {
        const baseAffirmations = this.getAffirmations(emotion, language);
        const enhancedAffirmations = [...baseAffirmations];

        // Add personalized affirmations based on semantic analysis
        if (semanticAnalysis.cognitive_patterns.rumination) {
            enhancedAffirmations.push(this.getAffirmationForPattern('rumination', language));
        }
        if (semanticAnalysis.behavioral_indicators.avoidance) {
            enhancedAffirmations.push(this.getAffirmationForPattern('avoidance', language));
        }
        if (semanticAnalysis.sentiment_layers.conflicted) {
            enhancedAffirmations.push(this.getAffirmationForPattern('conflict', language));
        }
        if (semanticAnalysis.communication_style.directness === 'indirect') {
            enhancedAffirmations.push(this.getAffirmationForPattern('indirect', language));
        }

        return enhancedAffirmations.slice(0, 5); // Limit to 5 affirmations
    }

    static getAffirmationForPattern(pattern, language = 'en') {
        const patternAffirmations = {
            rumination: {
                en: 'I can choose to redirect my thoughts to the present moment.',
                hi: 'मैं अपने विचारों को वर्तमान क्षण की ओर मोड़ने का चुनाव कर सकता हूं।',
                te: 'నేను నా ఆలోచనలను ప్రస్తుత క్షణం వైపు మళ్లించుకోవచ్చు.'
            },
            avoidance: {
                en: 'I am capable of facing challenges with courage and support.',
                hi: 'मैं साहस और समर्थन के साथ चुनौतियों का सामना करने में सक्षम हूं।',
                te: 'నేను సాహసం మరియు మద్దతుతో సవాళ్లను ఎదుర్కోగలను.'
            },
            conflict: {
                en: 'It\'s okay to have mixed feelings; I can sit with them compassionately.',
                hi: 'मिली-जुली भावनाएं होना ठीक है; मैं उनके साथ दयापूर्वक बैठ सकता हूं।',
                te: 'మిశ్రమ భావాలు ఉండటం సరే; నేను వాటితో కరుణాత్మకంగా కూర్చొవచ్చు.'
            },
            indirect: {
                en: 'My feelings are valid, and I deserve to express them clearly.',
                hi: 'मेरी भावनाएं वैध हैं, और मुझे उन्हें स्पष्ट रूप से व्यक्त करने का हक है।',
                te: 'నా భావాలు చెల్లుబడతాయి, మరియు నేను వాటిని స్పష్టంగా వ్యక్తం చేయడానికి అర్హుడిని.'
            }
        };

        return patternAffirmations[pattern]?.[language] || patternAffirmations[pattern]?.en || 'I am worthy of love and respect.';
    }

    static getIntelligentActivities(emotion, semanticAnalysis, language = 'en') {
        const baseActivities = this.getSuggestedActivities(emotion, language);
        const enhancedActivities = [...baseActivities];

        // Add activities based on semantic patterns
        if (semanticAnalysis.cognitive_patterns.rumination) {
            enhancedActivities.push(this.getActivityForPattern('rumination', language));
        }
        if (semanticAnalysis.behavioral_indicators.sleep_disturbance) {
            enhancedActivities.push(this.getActivityForPattern('sleep', language));
        }
        if (semanticAnalysis.sentiment_layers.underlying === 'underlying_negative') {
            enhancedActivities.push(this.getActivityForPattern('underlying', language));
        }
        if (semanticAnalysis.communication_style.cognitive_processing === 'analytical') {
            enhancedActivities.push(this.getActivityForPattern('analytical', language));
        }

        return enhancedActivities.slice(0, 5); // Limit to 5 activities
    }

    static getActivityForPattern(pattern, language = 'en') {
        const patternActivities = {
            rumination: {
                en: 'Try the 5-4-3-2-1 grounding exercise to stay present.',
                hi: 'वर्तमान में बने रहने के लिए 5-4-3-2-1 ग्राउंडिंग अभ्यास का प्रयास करें।',
                te: 'ప్రస్తుతంలో ఉండటానికి 5-4-3-2-1 గ్రౌండింగ్ వ్యాయామాన్ని ప్రయత్నించండి.'
            },
            sleep: {
                en: 'Practice a relaxing bedtime routine with deep breathing.',
                hi: 'गहरी सांस लेने के साथ आरामदायक बेडटाइम रूटीन का अभ्यास करें।',
                te: 'లోతైన శ్వాసతో విశ్రాంతి బెడ్‌టైమ్ రూటీన్‌ను అభ్యసించండి.'
            },
            underlying: {
                en: 'Write a letter to yourself expressing compassion for your deeper feelings.',
                hi: 'अपनी गहरी भावनाओं के लिए करुणा व्यक्त करते हुए खुद को पत्र लिखें।',
                te: 'మీ లోతైన భావాలకు కరుణను వ్యక్తం చేస్తూ మీకు మీరు లేఖ రాయండి.'
            },
            analytical: {
                en: 'Create a pros/cons list to organize your thoughts and feelings.',
                hi: 'अपने विचारों और भावनाओं को व्यवस्थित करने के लिए फायदे/नुकसान की सूची बनाएं।',
                te: 'మీ ఆలోచనలు మరియు భావాలను నిర్వహించడానికి ప్రోస్/కాన్స్ జాబితాను సృష్టించండి.'
            }
        };

        return patternActivities[pattern]?.[language] || patternActivities[pattern]?.en || 'Take a few deep breaths and center yourself.';
    }

    static getIntelligentCopingSteps(emotion, semanticAnalysis, language = 'en') {
        const baseSteps = this.getCopingSteps(emotion, language);
        const enhancedSteps = [...baseSteps];

        // Add intelligent coping steps based on analysis
        if (semanticAnalysis.cognitive_patterns.catastrophizing) {
            enhancedSteps.push(this.getCopingStepForPattern('catastrophizing', language));
        }
        if (semanticAnalysis.behavioral_indicators.social_withdrawal) {
            enhancedSteps.push(this.getCopingStepForPattern('withdrawal', language));
        }
        if (semanticAnalysis.sentiment_layers.suppressed) {
            enhancedSteps.push(this.getCopingStepForPattern('suppressed', language));
        }

        return enhancedSteps.slice(0, 6); // Limit to 6 steps
    }

    static getCopingStepForPattern(pattern, language = 'en') {
        const patternSteps = {
            catastrophizing: {
                en: 'Challenge catastrophic thinking by asking: "What evidence supports this worst-case scenario?"',
                hi: 'बिगड़ने की सोच को चुनौती दें: "इस सबसे बुरे परिदृश्य का समर्थन कौन सा सबूत करता है?"',
                te: 'విపత్తు ఆలోచనకు సవాలు విసిరండి: "ఈ అత్యంత చెత్త సందర్భాన్ని ఏ సాక్ష్యం మద్దతు చేస్తుంది?"'
            },
            withdrawal: {
                en: 'Reach out to one trusted person, even if just for a brief, low-pressure interaction.',
                hi: 'एक विश्वसनीय व्यक्ति से संपर्क करें, भले ही सिर्फ संक्षिप्त, कम दबाव वाला संपर्क हो।',
                te: 'ఒక విశ్వసనీయ వ్యక్తితో సంప్రదించండి, భలే అది సంక్షిప్త, తక్కువ ఒత్తిడి సంప్రదింపే అయినా.'
            },
            suppressed: {
                en: 'Give yourself permission to feel and express your emotions in a safe way.',
                hi: 'अपने आप को सुरक्षित तरीके से भावनाओं को महसूस करने और व्यक्त करने की अनुमति दें।',
                te: 'మీకు మీరు సురక్షితమైన మార్గంలో భావాలను అనుభూతి చెందటానికి మరియు వ్యక్తం చేయటానికి అనుమతినివ్వండి.'
            }
        };

        return patternSteps[pattern]?.[language] || patternSteps[pattern]?.en || 'Take a moment to breathe and center yourself.';
    }

    static createEnhancedEmotionBreakdown(emotions, semanticAnalysis) {
        // Create enhanced breakdown combining server data with semantic analysis
        const breakdown = this.createEmotionBreakdown(emotions);

        // Enhance with semantic insights
        if (semanticAnalysis.sentiment_layers.surface === 'positive' && semanticAnalysis.sentiment_layers.underlying === 'underlying_negative') {
            breakdown.sadness = (breakdown.sadness || 0) + 0.2;
        }

        if (semanticAnalysis.cognitive_patterns.rumination) {
            breakdown.fear = (breakdown.fear || 0) + 0.3;
        }

        if (semanticAnalysis.behavioral_indicators.anger) {
            breakdown.anger = (breakdown.anger || 0) + 0.4;
        }

        // Normalize values
        const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
        if (total > 0) {
            Object.keys(breakdown).forEach(key => {
                breakdown[key] = breakdown[key] / total;
            });
        }

        return breakdown;
    }

    static performSemanticAnalysis(text, language) {
        const lowerText = text.toLowerCase();

        // Enhanced semantic analysis with multiple dimensions
        return {
            emotional_intensity: this.calculateEmotionalIntensity(text),
            cognitive_patterns: this.identifyCognitivePatterns(text),
            behavioral_indicators: this.extractBehavioralIndicators(text),
            contextual_clues: this.analyzeContextualClues(text),
            linguistic_features: this.extractLinguisticFeatures(text),
            sentiment_layers: this.analyzeSentimentLayers(text),
            emotional_trajectory: this.trackEmotionalTrajectory(text),
            communication_style: this.analyzeCommunicationStyle(text)
        };
    }

    static calculateEmotionalIntensity(text) {
        const intensityWords = {
            high: ['extremely', 'intensely', 'overwhelmingly', 'terribly', 'absolutely', 'completely', 'totally'],
            medium: ['very', 'really', 'quite', 'pretty', 'fairly', 'somewhat'],
            low: ['slightly', 'a bit', 'kind of', 'sort of', 'a little']
        };

        let score = 0.5; // baseline
        const lowerText = text.toLowerCase();

        intensityWords.high.forEach(word => {
            if (lowerText.includes(word)) score += 0.2;
        });
        intensityWords.medium.forEach(word => {
            if (lowerText.includes(word)) score += 0.1;
        });
        intensityWords.low.forEach(word => {
            if (lowerText.includes(word)) score -= 0.1;
        });

        return Math.max(0, Math.min(1, score));
    }

    static identifyCognitivePatterns(text) {
        const patterns = {
            rumination: ['keep thinking', 'can\'t stop thinking', 'over and over', 'going round in circles'],
            catastrophizing: ['worst case', 'disaster', 'terrible thing', 'awful outcome', 'catastrophe'],
            all_or_nothing: ['always', 'never', 'everyone', 'nobody', 'everything', 'nothing'],
            overgeneralization: ['tend to', 'usually', 'generally', 'always happens'],
            personalization: ['because of me', 'my fault', 'blame myself', 'responsible for']
        };

        const detected = {};
        const lowerText = text.toLowerCase();

        Object.entries(patterns).forEach(([pattern, keywords]) => {
            const matches = keywords.filter(keyword => lowerText.includes(keyword)).length;
            if (matches > 0) {
                detected[pattern] = matches;
            }
        });

        return detected;
    }

    static extractBehavioralIndicators(text) {
        const indicators = {
            avoidance: ['avoid', 'stay away', 'don\'t want to', 'can\'t face', 'postpone'],
            social_withdrawal: ['alone', 'isolated', 'withdrawn', 'don\'t see anyone', 'stay home'],
            sleep_disturbance: ['can\'t sleep', 'insomnia', 'sleeping too much', 'tired all day'],
            appetite_changes: ['no appetite', 'can\'t eat', 'eating too much', 'comfort eating'],
            concentration_issues: ['can\'t focus', 'distracted', 'mind wandering', 'forget things']
        };

        const detected = {};
        const lowerText = text.toLowerCase();

        Object.entries(indicators).forEach(([indicator, keywords]) => {
            const matches = keywords.filter(keyword => lowerText.includes(keyword)).length;
            if (matches > 0) {
                detected[indicator] = matches;
            }
        });

        return detected;
    }

    static analyzeContextualClues(text) {
        const clues = {
            temporal: ['today', 'yesterday', 'lately', 'recently', 'these days', 'this week'],
            situational: ['at work', 'at home', 'with friends', 'at school', 'during meeting'],
            relational: ['my partner', 'my friend', 'my family', 'my boss', 'my colleague'],
            physical: ['headache', 'stomach ache', 'tired', 'sick', 'pain', 'uncomfortable']
        };

        const detected = {};
        const lowerText = text.toLowerCase();

        Object.entries(clues).forEach(([clue, keywords]) => {
            const matches = keywords.filter(keyword => lowerText.includes(keyword)).length;
            if (matches > 0) {
                detected[clue] = matches;
            }
        });

        return detected;
    }

    static extractLinguisticFeatures(text) {
        const words = text.split(' ');
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

        return {
            word_count: words.length,
            sentence_count: sentences.length,
            avg_sentence_length: words.length / sentences.length,
            question_count: (text.match(/\?/g) || []).length,
            exclamation_count: (text.match(/!/g) || []).length,
            uppercase_ratio: text.replace(/[^A-Z]/g, '').length / text.replace(/[^a-zA-Z]/g, '').length,
            first_person_pronouns: ['i', 'me', 'my', 'mine', 'myself'].filter(word =>
                words.some(w => w.toLowerCase() === word)
            ).length
        };
    }

    static analyzeSentimentLayers(text) {
        const layers = {
            surface: this.analyzeSurfaceSentiment(text),
            underlying: this.analyzeUnderlyingSentiment(text),
            conflicted: this.detectConflictedSentiment(text),
            suppressed: this.detectSuppressedEmotion(text)
        };

        return layers;
    }

    static analyzeSurfaceSentiment(text) {
        const positive = ['happy', 'good', 'great', 'excellent', 'wonderful', 'amazing', 'love', 'joy'];
        const negative = ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'depressed', 'anxious'];

        const lowerText = text.toLowerCase();
        const posCount = positive.filter(word => lowerText.includes(word)).length;
        const negCount = negative.filter(word => lowerText.includes(word)).length;

        if (posCount > negCount) return 'positive';
        if (negCount > posCount) return 'negative';
        return 'neutral';
    }

    static analyzeUnderlyingSentiment(text) {
        // Look for contradictions and deeper emotions
        const contradictions = ['but', 'however', 'although', 'despite', 'yet'];
        const deeperEmotions = ['worried', 'concerned', 'overwhelmed', 'exhausted', 'confused', 'lost'];

        const lowerText = text.toLowerCase();
        const hasContradictions = contradictions.some(word => lowerText.includes(word));
        const hasDeeperEmotions = deeperEmotions.some(word => lowerText.includes(word));

        if (hasContradictions && hasDeeperEmotions) return 'complex';
        if (hasDeeperEmotions) return 'underlying_negative';
        return 'straightforward';
    }

    static detectConflictedSentiment(text) {
        const conflictIndicators = ['but', 'however', 'although', 'mixed feelings', 'conflicted', 'torn'];
        return conflictIndicators.some(word => text.toLowerCase().includes(word));
    }

    static detectSuppressedEmotion(text) {
        const suppressionIndicators = ['fine', 'okay', 'alright', 'not bad', 'could be worse'];
        const emotionIndicators = ['actually', 'really', 'truth is', 'to be honest'];

        const lowerText = text.toLowerCase();
        const hasSuppression = suppressionIndicators.some(word => lowerText.includes(word));
        const hasEmotionReveal = emotionIndicators.some(word => lowerText.includes(word));

        return hasSuppression && hasEmotionReveal;
    }

    static trackEmotionalTrajectory(text) {
        // Analyze emotional progression through the text
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const trajectory = [];

        sentences.forEach((sentence, index) => {
            const sentiment = this.analyzeSurfaceSentiment(sentence);
            trajectory.push({
                sentence: index + 1,
                sentiment,
                intensity: this.calculateEmotionalIntensity(sentence)
            });
        });

        return trajectory;
    }

    static analyzeCommunicationStyle(text) {
        const style = {
            directness: this.measureDirectness(text),
            emotional_expression: this.measureEmotionalExpression(text),
            cognitive_processing: this.measureCognitiveProcessing(text),
            social_orientation: this.measureSocialOrientation(text)
        };

        return style;
    }

    static measureDirectness(text) {
        const directIndicators = ['i feel', 'i am', 'i think', 'i want', 'i need'];
        const indirectIndicators = ['maybe', 'perhaps', 'i wonder', 'it seems', 'i guess'];

        const lowerText = text.toLowerCase();
        const directCount = directIndicators.filter(word => lowerText.includes(word)).length;
        const indirectCount = indirectIndicators.filter(word => lowerText.includes(word)).length;

        return directCount > indirectCount ? 'direct' : 'indirect';
    }

    static measureEmotionalExpression(text) {
        const emotionWords = ['feel', 'feeling', 'emotion', 'mood', 'sad', 'happy', 'angry', 'anxious'];
        const words = text.split(' ');
        const emotionWordCount = emotionWords.filter(word =>
            words.some(w => w.toLowerCase().includes(word))
        ).length;

        return emotionWordCount > 2 ? 'expressive' : 'reserved';
    }

    static measureCognitiveProcessing(text) {
        const cognitiveIndicators = ['think', 'thought', 'reason', 'logic', 'analyze', 'understand', 'realize'];
        const words = text.split(' ');
        const cognitiveCount = cognitiveIndicators.filter(word =>
            words.some(w => w.toLowerCase().includes(word))
        ).length;

        return cognitiveCount > 1 ? 'analytical' : 'intuitive';
    }

    static measureSocialOrientation(text) {
        const socialIndicators = ['help', 'support', 'talk', 'listen', 'understand', 'share', 'together', 'we', 'us', 'our'];
        const solitaryIndicators = ['alone', 'lonely', 'by myself', 'isolated', 'independent'];

        const lowerText = text.toLowerCase();
        const socialCount = socialIndicators.filter(word => lowerText.includes(word)).length;
        const solitaryCount = solitaryIndicators.filter(word => lowerText.includes(word)).length;

        if (socialCount > solitaryCount) return 'social';
        if (solitaryCount > socialCount) return 'solitary';
        return 'balanced';
    }

    static assessFormality(text) {
        const formalIndicators = ['please', 'thank you', 'excuse me', 'pardon', 'sir', 'madam', 'dear'];
        const informalIndicators = ['hey', 'hi', 'yeah', 'nah', 'kinda', 'sorta', 'wanna', 'gonna'];

        const lowerText = text.toLowerCase();
        const formalCount = formalIndicators.filter(word => lowerText.includes(word)).length;
        const informalCount = informalIndicators.filter(word => lowerText.includes(word)).length;

        if (formalCount > informalCount) return 'formal';
        if (informalCount > formalCount) return 'informal';
        return 'neutral';
    }

    static detectUrgency(text) {
        const urgencyIndicators = ['urgent', 'immediately', 'right now', 'asap', 'quickly', 'fast', 'hurry'];
        const lowerText = text.toLowerCase();

        const urgencyCount = urgencyIndicators.filter(word => lowerText.includes(word)).length;
        return urgencyCount > 0 ? 'high' : 'normal';
    }

    static analyzeSocialOrientation(text) {
        const socialIndicators = ['help', 'support', 'talk', 'listen', 'understand', 'share', 'together'];
        const lowerText = text.toLowerCase();

        const socialCount = socialIndicators.filter(word => lowerText.includes(word)).length;
        return socialCount > 1 ? 'help_seeking' : 'expressive';
    }

    static measureCognitiveLoad(text) {
        const complexIndicators = ['confused', 'overwhelmed', 'complicated', 'difficult', 'hard to', 'struggling'];
        const simpleIndicators = ['clear', 'simple', 'easy', 'straightforward'];

        const lowerText = text.toLowerCase();
        const complexCount = complexIndicators.filter(word => lowerText.includes(word)).length;
        const simpleCount = simpleIndicators.filter(word => lowerText.includes(word)).length;

        if (complexCount > simpleCount) return 'high';
        if (simpleCount > complexCount) return 'low';
        return 'moderate';
    }

    static analyzeEmotionalExpression(text) {
        const emotionIndicators = ['feel', 'feeling', 'emotion', 'mood', 'sad', 'happy', 'angry', 'anxious', 'worried'];
        const words = text.split(' ');
        const emotionCount = emotionIndicators.filter(word =>
            words.some(w => w.toLowerCase().includes(word))
        ).length;

        return emotionCount > 2 ? 'high' : emotionCount > 0 ? 'moderate' : 'low';
    }

    static detectHelpSeeking(text) {
        const helpIndicators = ['help', 'advice', 'suggestion', 'what should i do', 'how can i', 'i need', 'please help'];
        const lowerText = text.toLowerCase();

        return helpIndicators.some(word => lowerText.includes(word));
    }

    static measureSelfReflection(text) {
        const reflectionIndicators = ['i think', 'i feel', 'i realize', 'i wonder', 'i question', 'i reflect'];
        const lowerText = text.toLowerCase();

        const reflectionCount = reflectionIndicators.filter(word => lowerText.includes(word)).length;
        return reflectionCount > 1 ? 'high' : reflectionCount > 0 ? 'moderate' : 'low';
    }

    static analyzeFutureOrientation(text) {
        const futureIndicators = ['will', 'going to', 'plan to', 'hope to', 'want to', 'tomorrow', 'future'];
        const pastIndicators = ['did', 'was', 'were', 'had', 'yesterday', 'last week', 'before'];

        const lowerText = text.toLowerCase();
        const futureCount = futureIndicators.filter(word => lowerText.includes(word)).length;
        const pastCount = pastIndicators.filter(word => lowerText.includes(word)).length;

        if (futureCount > pastCount) return 'future_focused';
        if (pastCount > futureCount) return 'past_focused';
        return 'present_focused';
    }

    static mapIntensity(intensity) {
        if (intensity < 0.3) return 'low';
        if (intensity < 0.7) return 'moderate';
        return 'high';
    }

    static getEmojiForEmotion(emotion) {
        const emojiMap = {
            happy: '😊',
            sad: '😢',
            angry: '😠',
            anxious: '😰',
            depressed: '😭',
            calm: '😌',
            neutral: '😐'
        };
        return emojiMap[emotion.toLowerCase()] || '😐';
    }

    static createEmotionBreakdown(emotions) {
        // Create a breakdown from the emotions array
        const breakdown = {};
        emotions.forEach(emotion => {
            breakdown[emotion.label || emotion] = emotion.score || 0.1;
        });

        // Ensure we have some basic emotions
        if (Object.keys(breakdown).length === 0) {
            breakdown.joy = 0.2;
            breakdown.sadness = 0.2;
            breakdown.anger = 0.1;
            breakdown.fear = 0.1;
            breakdown.surprise = 0.1;
        }

        return breakdown;
    }

    static async chat(message, persona = 'auto', language = 'en') {
        try {
            const response = await fetch('/mood/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    persona,
                    language,
                    history: [],
                    mood_profile: {}
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return {
                message: data.response || 'I\'m here to listen.',
                persona: persona === 'auto' ? 'AI Companion' : persona.charAt(0).toUpperCase() + persona.slice(1)
            };
        } catch (error) {
            console.error('Chat API error:', error);
            return this.getFallbackChatResponse(message, persona, language);
        }
    }

    static async getMusicSuggestions(mood, language = 'en', musicLanguage = 'auto') {
        try {
            const response = await fetch('/mood/songs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mood_profile: { primary_emotion: mood },
                    language,
                    music_language: musicLanguage
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.songs || this.getIntelligentMusic(mood, musicLanguage);
        } catch (error) {
            console.error('Music suggestions API error:', error);
            return this.getIntelligentMusic(mood, musicLanguage);
        }
    }

    static async saveUserData(data) {
        try {
            const response = await fetch(`${this.baseURL}/user/data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Save user data API error:', error);
            throw error;
        }
    }

    static async getUserData(userId) {
        try {
            const response = await fetch(`${this.baseURL}/user/data/${userId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Get user data API error:', error);
            throw error;
        }
    }

    static getFallbackAnalysis(text, language = 'en') {
        // Simple sentiment analysis fallback
        const positiveWords = ['happy', 'good', 'great', 'excellent', 'wonderful', 'amazing', 'love', 'joy', 'excited', 'calm', 'peaceful'];
        const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'depressed', 'anxious', 'worried', 'stressed', 'fear', 'scared'];

        const lowerText = text.toLowerCase();
        let positiveScore = 0;
        let negativeScore = 0;

        positiveWords.forEach(word => {
            if (lowerText.includes(word)) positiveScore++;
        });

        negativeWords.forEach(word => {
            if (lowerText.includes(word)) negativeScore++;
        });

        let primaryEmotion = 'neutral';
        let intensity = 'moderate';
        let sentiment = 'neutral';
        let emoji = '😐';

        if (positiveScore > negativeScore) {
            primaryEmotion = positiveScore > 2 ? 'happy' : 'calm';
            sentiment = 'positive';
            emoji = positiveScore > 2 ? '😊' : '😌';
            intensity = positiveScore > 3 ? 'high' : 'moderate';
        } else if (negativeScore > positiveScore) {
            if (negativeScore > 3) {
                primaryEmotion = 'depressed';
                intensity = 'severe';
                emoji = '😭';
            } else if (lowerText.includes('angry') || lowerText.includes('hate')) {
                primaryEmotion = 'angry';
                emoji = '😠';
            } else if (lowerText.includes('anxious') || lowerText.includes('worried') || lowerText.includes('stressed')) {
                primaryEmotion = 'anxious';
                emoji = '😰';
            } else {
                primaryEmotion = 'sad';
                emoji = '😢';
            }
            sentiment = 'negative';
            intensity = negativeScore > 2 ? 'high' : 'moderate';
        }

        return {
            primaryEmotion,
            intensity,
            sentiment,
            emoji,
            affirmations: this.getAffirmations(primaryEmotion, language),
            musicSuggestions: this.getFallbackMusic(primaryEmotion),
            suggestedActivities: this.getSuggestedActivities(primaryEmotion, language),
            copingSteps: this.getCopingSteps(primaryEmotion, language),
            breakdown: {
                joy: positiveScore * 0.2,
                sadness: negativeScore * 0.2,
                anger: lowerText.includes('angry') ? 0.3 : 0.1,
                fear: lowerText.includes('fear') || lowerText.includes('anxious') ? 0.3 : 0.1,
                surprise: 0.1
            }
        };
    }

    static getFallbackMusic(mood) {
        const musicLibrary = {
            happy: [
                { title: 'Happy', artist: 'Pharrell Williams', spotifyLink: 'https://open.spotify.com/track/60nZcImufyMA1MKQY3dcCH', youtubeLink: 'https://www.youtube.com/watch?v=ZbZSe6N_BXs' },
                { title: 'Can\'t Stop the Feeling!', artist: 'Justin Timberlake', spotifyLink: 'https://open.spotify.com/track/1Je1IMUlBXcx1Fz0WE7oPT', youtubeLink: 'https://www.youtube.com/watch?v=ru0K8uYEZWw' }
            ],
            sad: [
                { title: 'Someone Like You', artist: 'Adele', spotifyLink: 'https://open.spotify.com/track/1zwMYTA5nlNjZxYrvBB2pV', youtubeLink: 'https://www.youtube.com/watch?v=hLQl3WQQoQ0' },
                { title: 'Hurt', artist: 'Johnny Cash', spotifyLink: 'https://open.spotify.com/track/28cnXtME493VX9NOw9cIUh', youtubeLink: 'https://www.youtube.com/watch?v=vt1Pwfnh5pc' }
            ],
            angry: [
                { title: 'Break Stuff', artist: ' Limp Bizkit', spotifyLink: 'https://open.spotify.com/track/5cZqsjVs6MevCnAkasbEOX', youtubeLink: 'https://www.youtube.com/watch?v=gP5b2P4pGZQ' },
                { title: 'Killing in the Name', artist: 'Rage Against the Machine', spotifyLink: 'https://open.spotify.com/track/59WN2psjkt1tyaxjspN8fp', youtubeLink: 'https://www.youtube.com/watch?v=bWXazVhlyxQ' }
            ],
            anxious: [
                { title: 'Weightless', artist: 'Marconi Union', spotifyLink: 'https://open.spotify.com/track/1WJzDVVVFG1gKz1d0P8twz', youtubeLink: 'https://www.youtube.com/watch?v=UfcAVejs1Ac' },
                { title: 'River', artist: 'Joni Mitchell', spotifyLink: 'https://open.spotify.com/track/4Kd4QUDYzcDRbWyCIUgdi8', youtubeLink: 'https://www.youtube.com/watch?v=2HpXG5-vVK8' }
            ],
            neutral: [
                { title: 'Imagine', artist: 'John Lennon', spotifyLink: 'https://open.spotify.com/track/1Je1IMUlBXcx1Fz0WE7oPT', youtubeLink: 'https://www.youtube.com/watch?v=YkgkThdzX-8' },
                { title: 'What a Wonderful World', artist: 'Louis Armstrong', spotifyLink: 'https://open.spotify.com/track/29U7stRjqHU6rMiS8BfaI9', youtubeLink: 'https://www.youtube.com/watch?v=A3yCcXgbKrE' }
            ]
        };

        return musicLibrary[mood] || musicLibrary.neutral;
    }

    static getFallbackChatResponse(message, persona, language) {
        const responses = {
            parent: {
                en: 'My dear child, I\'m here for you. Tell me what\'s troubling you.',
                hi: 'मेरे प्यारे बच्चे, मैं तुम्हारे लिए यहां हूं। मुझे बताओ कि क्या बात तुम्हें परेशान कर रही है।',
                te: 'నా ప్రియమైన బిడ్డా, నేను నీ కోసం ఇక్కడ ఉన్నాను. నిన్ను ఏమి బాధిస్తోందో చెప్పు.'
            },
            mentor: {
                en: 'Let\'s approach this with wisdom. What insights can we gain from this situation?',
                hi: 'आइए इसको बुद्धिमानी से संभालें। इस स्थिति से हमें क्या सीख मिल सकती है?',
                te: 'దీనిని జ్ఞానంతో ఎదుర్కోండి. ఈ పరిస్థితి నుండి మనం ఏమి అంతర్దృష్టులు పొందవచ్చు?'
            },
            doctor: {
                en: 'I understand this is difficult. Let\'s explore your feelings together.',
                hi: 'मैं समझता हूं कि यह कठिन है। आइए आपके भावनाओं का साथ में पता लगाएं।',
                te: 'ఇది కష్టమని నేను అర్థం చేసుకున్నాను. మనం కలిసి మీ భావాలను అన్వేషించుదాం.'
            },
            friend: {
                en: 'Hey buddy, I\'m here. What\'s going on?',
                hi: 'अरे यार, मैं यहां हूं। क्या हो रहा है?',
                te: 'అయ్యో మిత్రమా, నేను ఇక్కడ ఉన్నాను. ఏమి జరుగుతోంది?'
            },
            auto: {
                en: 'I\'m here to listen and support you. How are you feeling?',
                hi: 'मैं सुनने और आपका समर्थन करने के लिए यहां हूं। आप कैसा महसूस कर रहे हैं?',
                te: 'నేను వినడానికి మరియు మిమ్మల్ని మద్దతు చేయడానికి ఇక్కడ ఉన్నాను. మీరు ఎలా అనుభూతి చెందుతున్నారు?'
            }
        };

        const response = responses[persona]?.[language] || responses.auto.en;

        return {
            message: response,
            persona: persona === 'auto' ? 'AI Companion' : persona.charAt(0).toUpperCase() + persona.slice(1)
        };
    }

    static getAffirmations(emotion, language = 'en') {
        const affirmations = {
            happy: {
                en: ['You are worthy of love and respect.', 'This moment will pass, and you will be okay.', 'You have the strength to overcome challenges.'],
                hi: ['तुम प्यार और सम्मान के योग्य हो।', 'यह पल बीत जाएगा, और तुम ठीक हो जाओगे।', 'तुम्हारे पास चुनौतियों पर काबू पाने की ताकत है।'],
                te: ['మీరు ప్రేమ మరియు గౌరవానికి అర్హులు.', 'ఈ క్షణము గడచిపోతుంది, మరియు మీరు సరే అవుతారు.', 'సవాళ్లను అధిగమించే శక్తి మీకు ఉంది.']
            },
            sad: {
                en: ['Your feelings are valid.', 'It\'s okay to not be okay.', 'You are stronger than you know.'],
                hi: ['तुम्हारे भाव वैध हैं।', 'ठीक न होना भी ठीक है।', 'तुम जितने मजबूत हो, उतना तुम नहीं जानते।'],
                te: ['మీ భావాలు చెల్లుబడతాయి.', 'సరేకాకపోవడం సరే.', 'మీరు తెలిసినంత మట్టి బలంగా ఉన్నారు.']
            },
            angry: {
                en: ['Your anger is valid.', 'Take deep breaths.', 'This feeling will pass.'],
                hi: ['तुम्हारा गुस्सा वैध है।', 'गहरी सांस लो।', 'यह भावना बीत जाएगी।'],
                te: ['మీ కోపం చెల్లుబడతాయి.', 'లోతైన శ్వాసలు తీసుకోండి.', 'ఈ భావన గడచిపోతుంది.']
            },
            anxious: {
                en: ['You are safe in this moment.', 'Breathe in peace, breathe out worry.', 'One step at a time.'],
                hi: ['तुम इस पल में सुरक्षित हो।', 'शांति में सांस लो, चिंता बाहर निकालो।', 'एक कदम एक समय।'],
                te: ['మీరు ఈ క్షణంలో సురక్షితంగా ఉన్నారు.', 'శాంతిలో శ్వాస తీసుకోండి, చింతను వదలండి.', 'ఒక అడుగు ఒకసారి.']
            },
            depressed: {
                en: ['You are not alone.', 'Reach out for help.', 'Small steps lead to healing.'],
                hi: ['तुम अकेले नहीं हो।', 'मदद के लिए पहुंचो।', 'छोटे कदम उपचार की ओर ले जाते हैं।'],
                te: ['మీరు ఒంటరిగా లేదు.', 'సహాయం కోసం చేరండి.', 'చిన్న అడుగులు శ్రేయస్సుకు దారితీస్తాయి.']
            },
            calm: {
                en: ['Peace is within you.', 'You are grounded.', 'This moment is yours.'],
                hi: ['शांति तुम्हारे अंदर है।', 'तुम जमीन से जुड़े हुए हो।', 'यह पल तुम्हारा है।'],
                te: ['శాంతి మీలో ఉంది.', 'మీరు గ్రౌండెడ్.', 'ఈ క్షణము మీది.']
            },
            neutral: {
                en: ['You are worthy of love and respect.', 'This moment will pass, and you will be okay.', 'You have the strength to overcome challenges.'],
                hi: ['तुम प्यार और सम्मान के योग्य हो।', 'यह पल बीत जाएगा, और तुम ठीक हो जाओगे।', 'तुम्हारे पास चुनौतियों पर काबू पाने की ताकत है।'],
                te: ['మీరు ప్రేమ మరియు గౌరవానికి అర్హులు.', 'ఈ క్షణము గడచిపోతుంది, మరియు మీరు సరే అవుతారు.', 'సవాళ్లను అధిగమించే శక్తి మీకు ఉంది.']
            }
        };

        return affirmations[emotion]?.[language] || affirmations.neutral.en;
    }

    static getSuggestedActivities(emotion, language = 'en') {
        const activities = {
            happy: {
                en: ['Share your joy with someone', 'Dance to your favorite song', 'Write down what you\'re grateful for'],
                hi: ['अपनी खुशी किसी के साथ साझा करें', 'अपनी पसंदीदा गाना पर नाचें', 'लिखें कि आप किसके लिए आभारी हैं'],
                te: ['మీ ఆనందాన్ని ఎవరితోనైనా పంచుకోండి', 'మీకు ఇష్టమైన పాటపై నృత్యం చేయండి', 'మీరు ఎవరికి కృతజ్ఞత చెప్పాలో వ్రాయండి']
            },
            sad: {
                en: ['Take a warm shower', 'Call a friend', 'Watch a comforting movie'],
                hi: ['गरम पानी का नहान लें', 'मित्र को कॉल करें', 'एक आरामदायक फिल्म देखें'],
                te: ['వెచ్చని స్నానం తీసుకోండి', 'స్నేహితుడిని పిలవండి', 'ఒక ఆశ్వాసకరమైన సినిమా చూడండి']
            },
            angry: {
                en: ['Go for a run', 'Punch a pillow', 'Write down your frustrations'],
                hi: ['दौड़ने जाएं', 'तकिये पर मुक्का मारें', 'अपनी निराशाएं लिखें'],
                te: ['పరిగెత్తడానికి వెళ్లండి', 'తలుపుకు ముష్టి కొట్టండి', 'మీ నిరాశలను వ్రాయండి']
            },
            anxious: {
                en: ['Practice deep breathing', 'Ground yourself with 5-4-3-2-1', 'Listen to calming music'],
                hi: ['गहरी सांस लेने का अभ्यास करें', '5-4-3-2-1 से खुद को जमीन से जोड़ें', 'शांत संगीत सुनें'],
                te: ['లోతైన శ్వాస తీసుకోవడం అభ్యసించండి', '5-4-3-2-1తో మిమ్మల్ని గ్రౌండ్ చేయండి', 'శాంత సంగీతం వినండి']
            },
            depressed: {
                en: ['Reach out to a loved one', 'Take a small walk outside', 'Practice self-compassion'],
                hi: ['प्रियजन से संपर्क करें', 'बाहर छोटी सैर करें', 'स्वयं पर दया का अभ्यास करें'],
                te: ['ప్రియమైన వారితో సంప్రదించండి', 'వెలుపల చిన్న నడక తీసుకోండి', 'స్వీయ కరుణ అభ్యసించండి']
            },
            calm: {
                en: ['Meditate for 5 minutes', 'Read something inspiring', 'Practice mindfulness'],
                hi: ['5 मिनट ध्यान करें', 'कुछ प्रेरणादायक पढ़ें', 'जागरूकता का अभ्यास करें'],
                te: ['5 నిమిషాలు ధ్యానం చేయండి', 'ఏదో ప్రేరణాత్మకమైనది చదవండి', 'మైండ్ఫుల్నెస్ అభ్యసించండి']
            },
            neutral: {
                en: ['Take a few deep breaths', 'Go for a short walk', 'Write down three things you\'re grateful for'],
                hi: ['कुछ गहरी सांस लें', 'छोटी सैर करें', 'तीन चीजें लिखें जिनके लिए आप आभारी हैं'],
                te: ['కొన్ని లోతైన శ్వాసలు తీసుకోండి', 'చిన్న నడక తీసుకోండి', 'మీరు ఎవరికి కృతజ్ఞత చెప్పాలో మూడు విషయాలు వ్రాయండి']
            }
        };

        return activities[emotion]?.[language] || activities.neutral.en;
    }

    static getCopingSteps(emotion, language = 'en') {
        const copingSteps = {
            happy: {
                en: ['1. Share your positive energy', '2. Express gratitude', '3. Plan something enjoyable'],
                hi: ['1. अपनी सकारात्मक ऊर्जा साझा करें', '2. कृतज्ञता व्यक्त करें', '3. कुछ आनंददायक योजना बनाएं'],
                te: ['1. మీ సానుకూల శక్తిని పంచుకోండి', '2. కృతజ్ఞతను వ్యక్తం చేయండि', '3. ఏదో ఆనందకరమైనది ప్లాన్ చేయండి']
            },
            sad: {
                en: ['1. Allow yourself to feel', '2. Reach out for support', '3. Do something comforting'],
                hi: ['1. खुद को महसूस करने दें', '2. समर्थन के लिए पहुंचें', '3. कुछ आरामदायक करें'],
                te: ['1. మిమ్మల్ని అనుభూతి చెందనివ్వండి', '2. మద్దతు కోసం చేరండి', '3. ఏదో ఆశ్వాసకరమైనది చేయండి']
            },
            angry: {
                en: ['1. Step away if needed', '2. Use physical activity', '3. Express feelings safely'],
                hi: ['1. जरूरत पड़ने पर दूर हटें', '2. शारीरिक गतिविधि का उपयोग करें', '3. भावनाओं को सुरक्षित रूप से व्यक्त करें'],
                te: ['1. అవసరమైతే వెనక్కి తగ్గండి', '2. శారీరక కార్యాచరణను ఉపయోగించండి', '3. భావాలను సురక్షితంగా వ్యక్తం చేయండి']
            },
            anxious: {
                en: ['1. Focus on your breath', '2. Ground yourself', '3. Challenge anxious thoughts'],
                hi: ['1. अपनी सांस पर ध्यान दें', '2. खुद को जमीन से जोड़ें', '3. चिंताजनक विचारों को चुनौती दें'],
                te: ['1. మీ శ్వాసపై దృష్టి పెట్టండి', '2. మిమ్మల్ని గ్రౌండ్ చేయండి', '3. ఆందోళనకరమైన ఆలోచనలకు సవాలు విసిరండి']
            },
            depressed: {
                en: ['1. Acknowledge your feelings', '2. Reach out for professional help', '3. Take small positive steps'],
                hi: ['1. अपने भावनाओं को स्वीकार करें', '2. व्यावसायिक मदद के लिए पहुंचें', '3. छोटे सकारात्मक कदम उठाएं'],
                te: ['1. మీ భావాలను అంగీకరించండి', '2. వృత్తిపరమైన సహాయం కోసం చేరండి', '3. చిన్న సానుకూల అడుగులు తీసుకోండి']
            },
            calm: {
                en: ['1. Maintain your peace', '2. Practice mindfulness', '3. Share calmness with others'],
                hi: ['1. अपनी शांति बनाए रखें', '2. जागरूकता का अभ्यास करें', '3. शांति को दूसरों के साथ साझा करें'],
                te: ['1. మీ శాంతిని కాపాడుకోండి', '2. మైండ్ఫుల్నెస్ అభ్యసించండి', '3. శాంతిని ఇతరులతో పంచుకోండి']
            },
            neutral: {
                en: ['1. Acknowledge your feelings', '2. Practice self-compassion', '3. Reach out to someone you trust', '4. Try a relaxation technique'],
                hi: ['1. अपने भावनाओं को स्वीकार करें', '2. स्वयं पर दया का अभ्यास करें', '3. किसी विश्वसनीय व्यक्ति से संपर्क करें', '4. विश्राम तकनीक आजमाएं'],
                te: ['1. మీ భావాలను అంగీకరించండి', '2. స్వీయ కరుణ అభ్యసించండి', '3. మీరు నమ్మే వారితో సంప్రదించండి', '4. విశ్రాంతి పద్ధతిని ప్రయత్నించండి']
            }
        };

        return copingSteps[emotion]?.[language] || copingSteps.neutral.en;
    }

    static getIntelligentFallbackAnalysis(text, language = 'en') {
        // Perform semantic analysis for intelligent fallback
        const semanticAnalysis = this.performSemanticAnalysis(text, language);
        const communicationProps = this.extractCommunicationProperties(text);

        // Enhanced sentiment analysis using semantic insights
        const lowerText = text.toLowerCase();
        let positiveScore = 0, negativeScore = 0;

        // Enhanced word analysis
        const positiveWords = ['happy', 'good', 'great', 'excellent', 'wonderful', 'amazing', 'love', 'joy', 'excited', 'calm', 'peaceful', 'grateful', 'thankful'];
        const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'depressed', 'anxious', 'worried', 'stressed', 'fear', 'scared', 'overwhelmed', 'exhausted'];

        positiveWords.forEach(word => {
            if (lowerText.includes(word)) positiveScore++;
        });
        negativeWords.forEach(word => {
            if (lowerText.includes(word)) negativeScore++;
        });

        // Factor in semantic analysis
        if (semanticAnalysis.sentiment_layers.underlying === 'underlying_negative') {
            negativeScore += 2;
        }
        if (semanticAnalysis.cognitive_patterns.catastrophizing) {
            negativeScore += 1;
        }
        if (semanticAnalysis.behavioral_indicators.avoidance) {
            negativeScore += 1;
        }

        let primaryEmotion = 'neutral';
        let intensity = 'moderate';
        let sentiment = 'neutral';
        let emoji = '😐';

        if (positiveScore > negativeScore) {
            primaryEmotion = positiveScore > 3 ? 'happy' : 'calm';
            sentiment = 'positive';
            emoji = positiveScore > 3 ? '😊' : '😌';
            intensity = positiveScore > 4 ? 'high' : 'moderate';
        } else if (negativeScore > positiveScore) {
            if (negativeScore > 4) {
                primaryEmotion = 'depressed';
                intensity = 'severe';
                emoji = '😭';
            } else if (lowerText.includes('angry') || lowerText.includes('hate') || semanticAnalysis.behavioral_indicators.anger) {
                primaryEmotion = 'angry';
                emoji = '😠';
            } else if (lowerText.includes('anxious') || lowerText.includes('worried') || lowerText.includes('stressed') || semanticAnalysis.behavioral_indicators.anxiety) {
                primaryEmotion = 'anxious';
                emoji = '😰';
            } else {
                primaryEmotion = 'sad';
                emoji = '😢';
            }
            sentiment = 'negative';
            intensity = negativeScore > 3 ? 'high' : 'moderate';
        }

        return {
            primaryEmotion,
            intensity,
            sentiment,
            emoji,
            affirmations: this.getIntelligentAffirmations(primaryEmotion, semanticAnalysis, language),
            musicSuggestions: [], // Will be populated after language selection
            suggestedActivities: this.getIntelligentActivities(primaryEmotion, semanticAnalysis, language),
            copingSteps: this.getIntelligentCopingSteps(primaryEmotion, semanticAnalysis, language),
            breakdown: this.createEnhancedEmotionBreakdown([], semanticAnalysis),
            semanticInsights: semanticAnalysis,
            communicationProfile: communicationProps,
            analysisConfidence: this.calculateAnalysisConfidence(semanticAnalysis)
        };
    }

    static getIntelligentMusic(mood, musicLanguage = 'auto') {
        // Intelligent music selection based on language preference
        const musicLibraries = {
            en: {
                happy: [
                    { title: 'Happy', artist: 'Pharrell Williams', spotifyLink: 'https://open.spotify.com/track/60nZcImufyMA1MKQY3dcCH', youtubeLink: 'https://www.youtube.com/watch?v=ZbZSe6N_BXs' },
                    { title: 'Can\'t Stop the Feeling!', artist: 'Justin Timberlake', spotifyLink: 'https://open.spotify.com/track/1Je1IMUlBXcx1Fz0WE7oPT', youtubeLink: 'https://www.youtube.com/watch?v=ru0K8uYEZWw' },
                    { title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', spotifyLink: 'https://open.spotify.com/track/32OlwWuMpZ6b0aN2RZOeUy', youtubeLink: 'https://www.youtube.com/watch?v=OPf0YbXqDm0' }
                ],
                sad: [
                    { title: 'Someone Like You', artist: 'Adele', spotifyLink: 'https://open.spotify.com/track/1zwMYTA5nlNjZxYrvBB2pV', youtubeLink: 'https://www.youtube.com/watch?v=hLQl3WQQoQ0' },
                    { title: 'Hurt', artist: 'Johnny Cash', spotifyLink: 'https://open.spotify.com/track/28cnXtME493VX9NOw9cIUh', youtubeLink: 'https://www.youtube.com/watch?v=vt1Pwfnh5pc' },
                    { title: 'The Night We Met', artist: 'Lord Huron', spotifyLink: 'https://open.spotify.com/track/0QZ5yyl6B6utIWkxeC0X5m', youtubeLink: 'https://www.youtube.com/watch?v=KtlgYvqNmno' }
                ],
                angry: [
                    { title: 'Break Stuff', artist: 'Limp Bizkit', spotifyLink: 'https://open.spotify.com/track/5cZqsjVs6MevCnAkasbEOX', youtubeLink: 'https://www.youtube.com/watch?v=gP5b2P4pGZQ' },
                    { title: 'Killing in the Name', artist: 'Rage Against the Machine', spotifyLink: 'https://open.spotify.com/track/59WN2psjkt1tyaxjspN8fp', youtubeLink: 'https://www.youtube.com/watch?v=bWXazVhlyxQ' },
                    { title: 'Bulls on Parade', artist: 'Rage Against the Machine', spotifyLink: 'https://open.spotify.com/track/0JQ5I0hzBJcLk9rLOJzNzg', youtubeLink: 'https://www.youtube.com/watch?v=3L4YrGaR8E4' }
                ],
                anxious: [
                    { title: 'Weightless', artist: 'Marconi Union', spotifyLink: 'https://open.spotify.com/track/1WJzDVVVFG1gKz1d0P8twz', youtubeLink: 'https://www.youtube.com/watch?v=UfcAVejs1Ac' },
                    { title: 'River', artist: 'Joni Mitchell', spotifyLink: 'https://open.spotify.com/track/4Kd4QUDYzcDRbWyCIUgdi8', youtubeLink: 'https://www.youtube.com/watch?v=2HpXG5-vVK8' },
                    { title: 'Holocene', artist: 'Bon Iver', spotifyLink: 'https://open.spotify.com/track/4MrfQL4TYQXzrO8TCbWyCIUgdi8', youtubeLink: 'https://www.youtube.com/watch?v=TWcyIpul8OE' }
                ],
                neutral: [
                    { title: 'Imagine', artist: 'John Lennon', spotifyLink: 'https://open.spotify.com/track/1Je1IMUlBXcx1Fz0WE7oPT', youtubeLink: 'https://www.youtube.com/watch?v=YkgkThdzX-8' },
                    { title: 'What a Wonderful World', artist: 'Louis Armstrong', spotifyLink: 'https://open.spotify.com/track/29U7stRjqHU6rMiS8BfaI9', youtubeLink: 'https://www.youtube.com/watch?v=A3yCcXgbKrE' },
                    { title: 'Three Little Birds', artist: 'Bob Marley', spotifyLink: 'https://open.spotify.com/track/0QkWikH5Z3U0f79JE8w4JZ', youtubeLink: 'https://www.youtube.com/watch?v=zaGUr6wzyT8' }
                ]
            },
            hi: {
                happy: [
                    { title: 'Tum Hi Ho', artist: 'Arijit Singh', spotifyLink: 'https://open.spotify.com/track/1mXVgsBdtIVeCLJnSnmtdV', youtubeLink: 'https://www.youtube.com/watch?v=IJq0yyWug1k' },
                    { title: 'Gerua', artist: 'Arijit Singh & Antara Mitra', spotifyLink: 'https://open.spotify.com/track/1n8nUo2OOCQQgH9LGpP4Qp', youtubeLink: 'https://www.youtube.com/watch?v=8aKDjKFqlOE' },
                    { title: 'Kabira', artist: 'Tochi Raina & Rekha Bhardwaj', spotifyLink: 'https://open.spotify.com/track/7g8hOWXtGS6bK3G2k8JzXa', youtubeLink: 'https://www.youtube.com/watch?v=jHNNMj5bNQw' }
                ],
                sad: [
                    { title: 'Channa Mereya', artist: 'Arijit Singh', spotifyLink: 'https://open.spotify.com/track/0ZmPJc2Z0fVy1L6V6VnFyE', youtubeLink: 'https://www.youtube.com/watch?v=284Ov7ysmfA' },
                    { title: 'Tera Ban Jaunga', artist: 'Akhil Sachdeva & Tulsi Kumar', spotifyLink: 'https://open.spotify.com/track/4eBvRhTJ5F7FGLcYc4FNMz', youtubeLink: 'https://www.youtube.com/watch?v=AV0XWlOdLn8' },
                    { title: 'Phir Bhi Tumko Chaahungi', artist: 'Arijit Singh & Shashaa Tirupati', spotifyLink: 'https://open.spotify.com/track/0Tk7JOMGVB6FgWZaD2B5xa', youtubeLink: 'https://www.youtube.com/watch?v=2y3NBQNDCP0' }
                ],
                angry: [
                    { title: 'Bheege Hont Tere', artist: 'Murder', spotifyLink: 'https://open.spotify.com/track/3l2GJx5vpGDx8pK1X1k7wL', youtubeLink: 'https://www.youtube.com/watch?v=9Y8OlMqLZQU' },
                    { title: 'Abhi Toh Party Shuru Hui Hai', artist: 'Badshah & Aastha Gill', spotifyLink: 'https://open.spotify.com/track/4gzsuuZypVbxs0Af1LSZyB', youtubeLink: 'https://www.youtube.com/watch?v=3XxYQKXMqNk' },
                    { title: 'Kar Gayi Chull', artist: 'Badshah & Amaal Mallik ft. Fazilpuria & Sukriti Kakar', spotifyLink: 'https://open.spotify.com/track/1Z8ODX0AzwufYxd2nZX2Va', youtubeLink: 'https://www.youtube.com/watch?v=2y3NBQNDCP0' }
                ],
                anxious: [
                    { title: 'Tum Mile', artist: 'Neeraj Shridhar & Tulsi Kumar', spotifyLink: 'https://open.spotify.com/track/2HjH5X3oJxXIkFL1g5JJLM', youtubeLink: 'https://www.youtube.com/watch?v=0fC3qRmA9dM' },
                    { title: 'Jeena Jeena', artist: 'Atif Aslam', spotifyLink: 'https://open.spotify.com/track/3pNApLe5yqL8X6EVZvQeM3', youtubeLink: 'https://www.youtube.com/watch?v=1BYQ0XqW4QY' },
                    { title: 'Pehla Nasha', artist: 'Udit Narayan & Sadhana Sargam', spotifyLink: 'https://open.spotify.com/track/5wXWJdC6VnPJYpQXz0HtJC', youtubeLink: 'https://www.youtube.com/watch?v=9Y8OlMqLZQU' }
                ],
                neutral: [
                    { title: 'Tum Ho', artist: 'Mohit Chauhan', spotifyLink: 'https://open.spotify.com/track/0Tk7JOMGVB6FgWZaD2B5xa', youtubeLink: 'https://www.youtube.com/watch?v=0fC3qRmA9dM' },
                    { title: 'Kun Faya Kun', artist: 'A.R. Rahman, Javed Ali & Mohit Chauhan', spotifyLink: 'https://open.spotify.com/track/3l2GJx5vpGDx8pK1X1k7wL', youtubeLink: 'https://www.youtube.com/watch?v=9Y8OlMqLZQU' },
                    { title: 'Tera Yaar Hoon Main', artist: 'Arijit Singh', spotifyLink: 'https://open.spotify.com/track/4eBvRhTJ5F7FGLcYc4FNMz', youtubeLink: 'https://www.youtube.com/watch?v=AV0XWlOdLn8' }
                ]
            },
            te: {
                happy: [
                    { title: 'Samajavaragamana', artist: 'Sid Sriram', spotifyLink: 'https://open.spotify.com/track/1mXVgsBdtIVeCLJnSnmtdV', youtubeLink: 'https://www.youtube.com/watch?v=IJq0yyWug1k' },
                    { title: 'Vachinde', artist: 'Vandemataram Srinivas', spotifyLink: 'https://open.spotify.com/track/1n8nUo2OOCQQgH9LGpP4Qp', youtubeLink: 'https://www.youtube.com/watch?v=8aKDjKFqlOE' },
                    { title: 'Nee Kannu Neeli Samudram', artist: 'Gopi Sundar & Shreya Ghoshal', spotifyLink: 'https://open.spotify.com/track/7g8hOWXtGS6bK3G2k8JzXa', youtubeLink: 'https://www.youtube.com/watch?v=jHNNMj5bNQw' }
                ],
                sad: [
                    { title: 'Priyatama', artist: 'Karunya', spotifyLink: 'https://open.spotify.com/track/0ZmPJc2Z0fVy1L6V6VnFyE', youtubeLink: 'https://www.youtube.com/watch?v=284Ov7ysmfA' },
                    { title: 'Manasu Mangalyam', artist: 'Gopi Sundar & Shweta Mohan', spotifyLink: 'https://open.spotify.com/track/4eBvRhTJ5F7FGLcYc4FNMz', youtubeLink: 'https://www.youtube.com/watch?v=AV0XWlOdLn8' },
                    { title: 'Ninne Pelladatha', artist: 'Thaman S & Karunya', spotifyLink: 'https://open.spotify.com/track/0Tk7JOMGVB6FgWZaD2B5xa', youtubeLink: 'https://www.youtube.com/watch?v=2y3NBQNDCP0' }
                ],
                angry: [
                    { title: 'Blockbuster', artist: 'Thaman S & Nakash Aziz', spotifyLink: 'https://open.spotify.com/track/3l2GJx5vpGDx8pK1X1k7wL', youtubeLink: 'https://www.youtube.com/watch?v=9Y8OlMqLZQU' },
                    { title: 'Dheevara', artist: 'Thaman S & Ramya Behara', spotifyLink: 'https://open.spotify.com/track/4gzsuuZypVbxs0Af1LSZyB', youtubeLink: 'https://www.youtube.com/watch?v=3XxYQKXMqNk' },
                    { title: 'Mirchi', artist: 'DSP & Ranina Reddy', spotifyLink: 'https://open.spotify.com/track/1Z8ODX0AzwufYxd2nZX2Va', youtubeLink: 'https://www.youtube.com/watch?v=2y3NBQNDCP0' }
                ],
                anxious: [
                    { title: 'Punnami Rathri', artist: 'Hariharan & K.S. Chitra', spotifyLink: 'https://open.spotify.com/track/2HjH5X3oJxXIkFL1g5JJLM', youtubeLink: 'https://www.youtube.com/watch?v=0fC3qRmA9dM' },
                    { title: 'Anukoledenadu', artist: 'Rajesh & Anuradha Sriram', spotifyLink: 'https://open.spotify.com/track/3pNApLe5yqL8X6EVZvQeM3', youtubeLink: 'https://www.youtube.com/watch?v=1BYQ0XqW4QY' },
                    { title: 'Gulabi', artist: 'Sachet Tandon', spotifyLink: 'https://open.spotify.com/track/5wXWJdC6VnPJYpQXz0HtJC', youtubeLink: 'https://www.youtube.com/watch?v=9Y8OlMqLZQU' }
                ],
                neutral: [
                    { title: 'Nee Jathaga', artist: 'Thaman S & Shreya Ghoshal', spotifyLink: 'https://open.spotify.com/track/0Tk7JOMGVB6FgWZaD2B5xa', youtubeLink: 'https://www.youtube.com/watch?v=0fC3qRmA9dM' },
                    { title: 'Manmadhudu', artist: 'Devi Sri Prasad & Anuradha Sriram', spotifyLink: 'https://open.spotify.com/track/3l2GJx5vpGDx8pK1X1k7wL', youtubeLink: 'https://www.youtube.com/watch?v=9Y8OlMqLZQU' },
                    { title: 'Oh My Dog', artist: 'Anirudh Ravichander & Saptha Thirumurai', spotifyLink: 'https://open.spotify.com/track/4eBvRhTJ5F7FGLcYc4FNMz', youtubeLink: 'https://www.youtube.com/watch?v=AV0XWlOdLn8' }
                ]
            }
        };

        // Determine which language library to use
        let selectedLibrary = musicLibraries.en; // default

        if (musicLanguage === 'auto') {
            // Auto-select based on mood and context (could be enhanced)
            selectedLibrary = musicLibraries.en;
        } else if (musicLibraries[musicLanguage]) {
            selectedLibrary = musicLibraries[musicLanguage];
        }

        return selectedLibrary[mood] || selectedLibrary.neutral || this.getFallbackMusic(mood);
    }
}

// Export for use in other modules
window.BackendAPI = BackendAPI;