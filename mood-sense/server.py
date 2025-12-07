from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Simple mood analysis (you can replace with actual ML model)
def analyze_mood_simple(text):
    text_lower = text.lower()
    positive_words = ['happy', 'good', 'great', 'excellent', 'wonderful', 'amazing', 'love', 'joy', 'excited']
    negative_words = ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'depressed', 'anxious', 'worried', 'stressed']

    positive_score = sum(1 for word in positive_words if word in text_lower)
    negative_score = sum(1 for word in negative_words if word in text_lower)

    if positive_score > negative_score:
        emotion = 'happy'
        intensity = 'moderate' if positive_score < 3 else 'high'
        sentiment = 'positive'
        emoji = '😊'
    elif negative_score > positive_score:
        emotion = 'sad' if negative_score < 3 else 'depressed'
        intensity = 'moderate' if negative_score < 3 else 'severe'
        sentiment = 'negative'
        emoji = '😢' if negative_score < 3 else '😭'
    else:
        emotion = 'neutral'
        intensity = 'low'
        sentiment = 'neutral'
        emoji = '😐'

    return {
        'primaryEmotion': emotion,
        'intensity': intensity,
        'sentiment': sentiment,
        'emoji': emoji,
        'affirmations': [
            'You are worthy of love and respect.',
            'This moment will pass, and you will be okay.',
            'You have the strength to overcome challenges.'
        ],
        'musicSuggestions': get_music_suggestions(emotion),
        'suggestedActivities': [
            'Take a few deep breaths',
            'Go for a short walk',
            'Write down three things you\'re grateful for'
        ],
        'copingSteps': [
            '1. Acknowledge your feelings',
            '2. Practice self-compassion',
            '3. Reach out to someone you trust',
            '4. Try a relaxation technique'
        ],
        'breakdown': {
            'joy': positive_score * 0.2,
            'sadness': negative_score * 0.2,
            'anger': 0.1,
            'fear': 0.1,
            'surprise': 0.1
        }
    }

def get_music_suggestions(mood):
    music_library = {
        'happy': [
            {'title': 'Happy', 'artist': 'Pharrell Williams', 'spotifyLink': 'https://open.spotify.com/track/60nZcImufyMA1MKQY3dcCH', 'youtubeLink': 'https://www.youtube.com/watch?v=ZbZSe6N_BXs'},
            {'title': 'Can\'t Stop the Feeling!', 'artist': 'Justin Timberlake', 'spotifyLink': 'https://open.spotify.com/track/1Je1IMUlBXcx1Fz0WE7oPT', 'youtubeLink': 'https://www.youtube.com/watch?v=ru0K8uYEZWw'}
        ],
        'sad': [
            {'title': 'Someone Like You', 'artist': 'Adele', 'spotifyLink': 'https://open.spotify.com/track/1zwMYTA5nlNjZxYrvBB2pV', 'youtubeLink': 'https://www.youtube.com/watch?v=hLQl3WQQoQ0'},
            {'title': 'Hurt', 'artist': 'Johnny Cash', 'spotifyLink': 'https://open.spotify.com/track/28cnXtME493VX9NOw9cIUh', 'youtubeLink': 'https://www.youtube.com/watch?v=vt1Pwfnh5pc'}
        ],
        'depressed': [
            {'title': 'The Night We Met', 'artist': 'Lord Huron', 'spotifyLink': 'https://open.spotify.com/track/0QZ5yyl6B6utIWkxeBDxQN', 'youtubeLink': 'https://www.youtube.com/watch?v=KtlgYxa6BMU'},
            {'title': 'Skinny Love', 'artist': 'Bon Iver', 'spotifyLink': 'https://open.spotify.com/track/4iUO8z7Mq7cVQOMXzQXxAh', 'youtubeLink': 'https://www.youtube.com/watch?v=aNzCDt9Lm1E'}
        ],
        'angry': [
            {'title': 'Break Stuff', 'artist': 'Limp Bizkit', 'spotifyLink': 'https://open.spotify.com/track/5cZqsjVs6MevCnAkasbEOX', 'youtubeLink': 'https://www.youtube.com/watch?v=gP5b2P4pGZQ'},
            {'title': 'Killing in the Name', 'artist': 'Rage Against the Machine', 'spotifyLink': 'https://open.spotify.com/track/59WN2psjkt1tyaxjspN8fp', 'youtubeLink': 'https://www.youtube.com/watch?v=bWXazVhlyxQ'}
        ],
        'anxious': [
            {'title': 'Weightless', 'artist': 'Marconi Union', 'spotifyLink': 'https://open.spotify.com/track/1WJzDVVVFG1gKz1d0P8twz', 'youtubeLink': 'https://www.youtube.com/watch?v=UfcAVejs1Ac'},
            {'title': 'River', 'artist': 'Joni Mitchell', 'spotifyLink': 'https://open.spotify.com/track/4Kd4QUDYzcDRbWyCIUgdi8', 'youtubeLink': 'https://www.youtube.com/watch?v=2HpXG5-vVK8'}
        ],
        'neutral': [
            {'title': 'Imagine', 'artist': 'John Lennon', 'spotifyLink': 'https://open.spotify.com/track/1Je1IMUlBXcx1Fz0WE7oPT', 'youtubeLink': 'https://www.youtube.com/watch?v=YkgkThdzX-8'},
            {'title': 'What a Wonderful World', 'artist': 'Louis Armstrong', 'spotifyLink': 'https://open.spotify.com/track/29U7stRjqHU6rMiS8BfaI9', 'youtubeLink': 'https://www.youtube.com/watch?v=A3yCcXgbKrE'}
        ]
    }
    return music_library.get(mood, music_library['neutral'])

def generate_chat_response(message, persona, language):
    responses = {
        'parent': 'My dear child, I\'m here for you. Tell me what\'s troubling you.',
        'mentor': 'Let\'s approach this with wisdom. What insights can we gain from this situation?',
        'doctor': 'I understand this is difficult. Let\'s explore your feelings together.',
        'friend': 'Hey buddy, I\'m here. What\'s going on?',
        'auto': 'I\'m here to listen and support you. How are you feeling?'
    }

    response = responses.get(persona, responses['auto'])

    # Simple language translation (you can expand this)
    if language == 'hi':
        response = 'मैं आपकी मदद करने के लिए यहाँ हूँ। कृपया मुझे बताएं कि क्या बात है।'
    elif language == 'te':
        response = 'నేను మీకు సహాయం చేయడానికి ఇక్కడ ఉన్నాను. దయచేసి నాకు చెప్పండి ఏమి జరుగుతోంది.'

    return {
        'message': response,
        'persona': persona.title() if persona != 'auto' else 'AI Companion'
    }

@app.route('/api/mood/analyze', methods=['POST'])
def analyze_mood():
    data = request.get_json()
    text = data.get('text', '')
    language = data.get('language', 'en')

    result = analyze_mood_simple(text)
    return jsonify(result)

@app.route('/api/mood/chat', methods=['POST'])
def chat():
    data = request.get_json()
    message = data.get('message', '')
    persona = data.get('persona', 'auto')
    language = data.get('language', 'en')

    response = generate_chat_response(message, persona, language)
    return jsonify(response)

@app.route('/api/mood/songs', methods=['POST'])
def get_songs():
    data = request.get_json()
    mood = data.get('mood', 'neutral')
    language = data.get('language', 'en')

    suggestions = get_music_suggestions(mood)
    return jsonify({'songs': suggestions})

if __name__ == '__main__':
    app.run(debug=True, port=5000)