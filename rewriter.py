from transformers import pipeline
import json
import os

# Advanced Multi-Task AI Models
emotion_model = pipeline(
    "text-classification",
    model="SamLowe/roberta-base-go_emotions",
    top_k=5  # Get top 5 emotions
)

sentiment_model = pipeline(
    "sentiment-analysis",
    model="cardiffnlp/twitter-roberta-base-sentiment-latest"
)

# Topic classification (simplified - can be expanded)
topic_keywords = {
    "love": ["love", "romantic", "affection", "heart", "relationship", "crush", "dating"],
    "stress": ["stress", "anxious", "worried", "overwhelmed", "pressure", "tension"],
    "work": ["work", "job", "career", "office", "boss", "deadline", "meeting"],
    "family": ["family", "parents", "children", "home", "marriage", "siblings"],
    "study": ["study", "exam", "school", "college", "learn", "education", "test"],
    "health": ["health", "sick", "pain", "doctor", "medicine", "illness"],
    "friendship": ["friend", "social", "party", "hangout", "lonely", "alone"],
    "general": []
}

# Intent classification (rule-based for now)
intent_patterns = {
    "seeking_help": ["help", "advice", "support", "how to", "what should I do"],
    "venting": ["frustrated", "angry", "upset", "can't stand", "hate"],
    "seeking_comfort": ["comfort", "soothe", "calm", "relax", "peace"],
    "expressing_gratitude": ["thankful", "grateful", "appreciate", "blessed"],
    "sharing_joy": ["happy", "excited", "great", "awesome", "wonderful"],
    "asking_info": ["what", "how", "why", "tell me", "explain"],
    "general": []
}

def classify_topic(text):
    text_lower = text.lower()
    for topic, keywords in topic_keywords.items():
        if any(keyword in text_lower for keyword in keywords):
            return topic
    return "general"

def classify_intent(text):
    text_lower = text.lower()
    for intent, patterns in intent_patterns.items():
        if any(pattern in text_lower for pattern in patterns):
            return intent
    return "general"

def generate_mood_profile(text):
    # Emotion analysis
    emotions = emotion_model(text)
    
    # Sentiment analysis
    sentiment = sentiment_model(text)[0]
    
    # Topic and intent
    topic = classify_topic(text)
    intent = classify_intent(text)
    
    # Calculate intensity (average of top emotion scores)
    intensity = sum(e['score'] for e in emotions[:3]) / 3
    
    # Categorize emotions
    emotion_categories = {
        "primary": ["joy", "sadness", "fear", "anger", "disgust", "surprise"],
        "secondary": ["calm", "frustrated", "lonely", "burnt out", "hopeful", "guilty", "ashamed", "confused", "overwhelmed", "affectionate", "anxious", "numb", "irritated", "empowered"],
        "social": ["rejected", "ignored", "taken for granted", "under-appreciated", "pressured", "heartbroken", "jealous", "embarrassed", "insecure", "defeated", "motivated", "ambitious", "productive", "creative", "romantic"]
    }
    
    primary_emotions = []
    secondary_emotions = []
    social_emotions = []
    
    for emotion in emotions:
        label = emotion['label']
        if label in emotion_categories["primary"]:
            primary_emotions.append(label)
        elif label in emotion_categories["secondary"]:
            secondary_emotions.append(label)
        elif label in emotion_categories["social"]:
            social_emotions.append(label)
        else:
            # Map GoEmotions to our categories
            if label in ["admiration", "amusement", "approval", "caring", "gratitude", "optimism", "pride", "relief"]:
                secondary_emotions.append("hopeful" if label == "optimism" else "calm")
            elif label in ["annoyance", "disappointment", "disapproval"]:
                secondary_emotions.append("frustrated")
            elif label in ["confusion", "curiosity", "realization"]:
                secondary_emotions.append("confused")
            elif label in ["desire", "excitement", "love"]:
                social_emotions.append("romantic")
            elif label in ["embarrassment", "nervousness"]:
                social_emotions.append("embarrassed")
            elif label in ["remorse"]:
                secondary_emotions.append("guilty")
            else:
                secondary_emotions.append("neutral")
    
def generate_mood_profile(text):
    # Emotion analysis
    emotions = emotion_model(text)
    
    # Sentiment analysis
    sentiment = sentiment_model(text)[0]
    
    # Topic and intent
    topic = classify_topic(text)
    intent = classify_intent(text)
    
    # Calculate intensity (average of top emotion scores)
    intensity = sum(e['score'] for e in emotions[:3]) / 3
    
    # Categorize emotions
    emotion_categories = {
        "primary": ["joy", "sadness", "fear", "anger", "disgust", "surprise"],
        "secondary": ["calm", "frustrated", "lonely", "burnt out", "hopeful", "guilty", "ashamed", "confused", "overwhelmed", "affectionate", "anxious", "numb", "irritated", "empowered"],
        "social": ["rejected", "ignored", "taken for granted", "under-appreciated", "pressured", "heartbroken", "jealous", "embarrassed", "insecure", "defeated", "motivated", "ambitious", "productive", "creative", "romantic"]
    }
    
    primary_emotions = []
    secondary_emotions = []
    social_emotions = []
    
    for emotion in emotions:
        label = emotion['label']
        if label in emotion_categories["primary"]:
            primary_emotions.append(label)
        elif label in emotion_categories["secondary"]:
            secondary_emotions.append(label)
        elif label in emotion_categories["social"]:
            social_emotions.append(label)
        else:
            # Map GoEmotions to our categories
            if label in ["admiration", "amusement", "approval", "caring", "gratitude", "optimism", "pride", "relief"]:
                secondary_emotions.append("hopeful" if label == "optimism" else "calm")
            elif label in ["annoyance", "disappointment", "disapproval"]:
                secondary_emotions.append("frustrated")
            elif label in ["confusion", "curiosity", "realization"]:
                secondary_emotions.append("confused")
            elif label in ["desire", "excitement", "love"]:
                social_emotions.append("romantic")
            elif label in ["embarrassment", "nervousness"]:
                social_emotions.append("embarrassed")
            elif label in ["remorse"]:
                secondary_emotions.append("guilty")
            else:
                secondary_emotions.append("neutral")
    
    return {
        "primary_emotion": primary_emotions[0] if primary_emotions else "neutral",
        "secondary_emotions": (secondary_emotions + social_emotions)[:3],
        "intent": intent,
        "sentiment": {
            "label": sentiment['label'],
            "score": sentiment['score']
        },
        "topic": topic,
        "intensity": intensity,
        "all_emotions": emotions
    }

def recommend_songs(mood_profile, language, num_songs=5):
    # Load songs database
    with open(os.path.join(os.path.dirname(__file__), 'songs.json'), 'r') as f:
        songs_data = json.load(f)
    
    songs = songs_data['songs']
    
    # Filter by language
    language_songs = [s for s in songs if s['language'] == language]
    
    if not language_songs:
        return []
    
    # Scoring system
    scored_songs = []
    for song in language_songs:
        score = 0
        
        # Emotion match (primary weight more)
        primary_match = mood_profile['primary_emotion'] in song['emotion_spectrum']
        secondary_match = any(emotion in song['emotion_spectrum'] for emotion in mood_profile['secondary_emotions'])
        
        if primary_match:
            score += 3
        if secondary_match:
            score += 2
        
        # Intent match
        intent = mood_profile['intent']
        if intent == 'seeking_comfort' and song['energy'] < 0.6:
            score += 2
        elif intent == 'venting' and song['energy'] > 0.7:
            score += 2
        elif intent == 'sharing_joy' and song['energy'] > 0.8:
            score += 2
        
        # Topic match
        if mood_profile['topic'] in song['topic_match']:
            score += 1
        
        # Intensity match
        intensity = mood_profile['intensity']
        if intensity > 0.7 and song['intensity_match'] == 'high':
            score += 1
        elif intensity < 0.4 and song['intensity_match'] == 'low':
            score += 1
        
        # Sentiment alignment
        sentiment = mood_profile['sentiment']['label']
        if sentiment == 'negative' and song['energy'] < 0.5:
            score += 1
        elif sentiment == 'positive' and song['energy'] > 0.6:
            score += 1
        
        scored_songs.append((song, score))
    
    # Sort by score and return top songs
    scored_songs.sort(key=lambda x: x[1], reverse=True)
    return [song for song, score in scored_songs[:num_songs]]

def detect_emotion(text):
    profile = generate_mood_profile(text)
    return profile


# Strong paraphrasing model


# Strong paraphrasing model
rewriter_model = pipeline(
    "text2text-generation",
    model="humarin/chatgpt_paraphraser_on_T5_base"
)


def rewrite_text(text: str, target_emotion: str = None) -> str:
    """
    Rewrite text conditioned on emotion.
    If target_emotion is None, we detect emotion first.
    """
    if not target_emotion:
        mood_profile = detect_emotion(text)
        target_emotion = mood_profile["primary_emotion"]

    prompt = f"Rewrite this text to sound {target_emotion}: {text}"

    rewritten = rewriter_model(
        prompt,
        max_length=180,
        do_sample=True,
        top_p=0.92,
        temperature=0.75
    )[0]["generated_text"]

    return rewritten
