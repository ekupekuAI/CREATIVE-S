# MoodSense+ AI Emotional Companion

A professional, modern emotional companion app that analyzes mood, provides personalized support, and helps users manage their emotional well-being.

## Features

### 🎭 Two Interaction Modes
- **Analyzer Mode**: Analyze text input for emotions, intensity, and sentiment
- **Chat Mode**: Conversational AI support with different personas

### 🌍 Multi-Language Support
- English
- Hindi
- Telugu

### 🎵 Personalized Music Recommendations
- Mood-based song suggestions
- Direct links to Spotify and YouTube
- Categorized playlists for different emotions

### 🎮 Interactive Activities
- Breathing exercises with visual animation
- Anger management bubble-popping game
- 5-4-3-2-1 grounding technique
- Mini journaling prompts
- Self-check wellness lists
- Focus timers

### 📊 Mood History & Analytics
- Weekly mood tracking graphs
- Emotion frequency analysis
- Activity completion statistics
- Achievement badges
- Personal progress insights

### 🚨 Crisis-Safe Mode
- Automatic detection of severe emotional distress
- Emergency hotline links
- Safe, supportive responses
- Immediate breathing exercises

### 👥 AI Personas
- **Parent**: Nurturing, caring support
- **Mentor**: Wise, encouraging guidance
- **Doctor/Therapist**: Professional, empathetic counseling
- **Friend**: Casual, relatable companionship
- **Auto**: Intelligent persona selection based on mood

## Installation & Setup

### Prerequisites
- Python 3.7+
- Flask
- Flask-CORS

### Installation
1. Navigate to the mood-sense directory:
   ```bash
   cd mood-sense
   ```

2. Install Python dependencies:
   ```bash
   pip install flask flask-cors
   ```

3. Start the backend server:
   ```bash
   python server.py
   ```

4. Open `index.html` in your web browser

## Usage

### Analyzer Mode
1. Select your preferred language
2. Choose a persona (or leave as Auto)
3. Type your thoughts and feelings in the text area
4. Click "Analyze Mood"
5. View your emotional analysis, suggestions, and recommendations

### Chat Mode
1. Switch to the Chat tab
2. Select your preferred persona
3. Start a conversation with the AI companion
4. Use quick-reply buttons for common interactions

### Activities
1. Browse available activities in the Activities tab
2. Click "Start" on any activity to begin
3. Follow the interactive prompts and exercises

### History & Analytics
1. View your mood history in the History tab
2. Track your emotional journey with graphs and statistics
3. Earn achievements for consistent engagement

## Technical Architecture

### Frontend
- **HTML5**: Semantic structure and accessibility
- **CSS3**: Modern styling with gradients and animations
- **JavaScript (ES6+)**: Modular architecture with classes
- **Chart.js**: Data visualization for analytics

### Backend
- **Flask**: Lightweight Python web framework
- **RESTful API**: Clean endpoint design
- **CORS Support**: Cross-origin resource sharing

### Data Storage
- **LocalStorage**: Client-side data persistence
- **JSON**: Structured data format

## File Structure
```
mood-sense/
├── index.html          # Main application interface
├── style.css           # Modern UI styling
├── themes.css          # Mood-based theme styles
├── script.js           # Main application logic
├── ui.js              # UI management utilities
├── chats.js           # Chat functionality
├── activities.js      # Interactive activities
├── backend_api.js     # API communication
├── server.py          # Flask backend server
└── assets/
    ├── icons/         # UI icons
    ├── animations/    # Animation assets
    └── activities/    # Activity-specific assets
```

## API Endpoints

### POST /api/mood/analyze
Analyzes text for emotional content.

**Request Body:**
```json
{
  "text": "I feel really happy today!",
  "language": "en"
}
```

**Response:**
```json
{
  "primaryEmotion": "happy",
  "intensity": "moderate",
  "sentiment": "positive",
  "emoji": "😊",
  "affirmations": [...],
  "musicSuggestions": [...],
  "suggestedActivities": [...],
  "copingSteps": [...],
  "breakdown": {...}
}
```

### POST /api/mood/chat
Generates AI chat responses.

**Request Body:**
```json
{
  "message": "I'm feeling anxious",
  "persona": "doctor",
  "language": "en"
}
```

### POST /api/mood/songs
Retrieves mood-based music recommendations.

## Privacy & Safety

- All data is stored locally in the browser
- No personal information is transmitted to external servers
- Crisis detection provides immediate access to professional help resources
- Content is designed to be safe and supportive

## Future Enhancements

- Advanced NLP models for more accurate emotion detection
- Integration with wearable devices for physiological data
- Social features for community support
- Advanced analytics with machine learning insights
- Mobile app versions

## Contributing

This is a college project designed to demonstrate modern web development skills and emotional wellness technology. For educational purposes only.

## License

This project is for educational use and should not be used for clinical mental health treatment.