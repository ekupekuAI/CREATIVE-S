# AI Event Architect - Premium Event Planning System

A comprehensive, AI-driven event planning application built with modern web technologies. Features a premium UI/UX inspired by Apple, Notion, Linear, and Monday.com, with modular ES6 JavaScript architecture and a FastAPI backend.

## 🚀 Features

### Core Functionality
- **AI-Powered Planning**: Chat-style intake with guided questions for comprehensive event planning
- **Auto-Generation**: AI generates budgets, schedules, tasks, and vendor recommendations
- **Manual Control**: Full manual editing capabilities for all planning aspects
- **Real-time Collaboration**: Live updates and state synchronization
- **Professional Reports**: PDF export with customizable templates

### Premium UI/UX
- **Glassmorphism Design**: Modern glassmorphism effects with backdrop-filter
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile
- **Dark/Light Themes**: Automatic system preference detection with manual override
- **Smooth Animations**: CSS transitions and keyframe animations throughout
- **Keyboard Shortcuts**: Alt+1-9 for panel navigation, Ctrl+S for save

### Technical Stack
- **Frontend**: HTML5, CSS3 + Bootstrap 5.3, ES6 JavaScript (modular)
- **Backend**: Python FastAPI with CORS support
- **Charts**: Chart.js for budget visualization
- **Export**: jsPDF + html2canvas for PDF generation
- **Storage**: localStorage with auto-save every 5 seconds

## 📁 Project Structure

```
event-planner/
├── index.html              # Main application interface
├── server.py               # FastAPI backend server
├── requirements.txt        # Python dependencies
├── css/
│   ├── style.css          # Main styling with glassmorphism
│   └── themes.css         # Theme system (light/dark/color)
├── js/
│   ├── utils.js           # Utility functions and helpers
│   ├── planner.js         # Core state management
│   ├── ui.js              # UI management and navigation
│   ├── ai.js              # AI chat interface and backend integration
│   ├── budget.js          # Budget management with Chart.js
│   ├── schedule.js        # Schedule/timeline management
│   ├── tasks.js           # Task checklist with progress tracking
│   ├── vendors.js         # Vendor management and recommendations
│   └── export.js          # PDF export functionality
├── data/
│   └── sample-event.json  # Sample data for testing
└── assets/
    ├── backgrounds/       # Background images
    ├── icons/            # Icon assets
    └── illustrations/    # Illustration assets
```

## 🛠 Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js (for development/testing)
- Modern web browser

### Backend Setup
1. **Install Python dependencies:**
   ```bash
   cd event-planner
   pip install -r requirements.txt
   ```

2. **Start the FastAPI server:**
   ```bash
   python server.py
   ```
   The server will start on `http://localhost:8000`

### Frontend Setup
1. **Open the application:**
   - Open `index.html` in your web browser
   - Or serve via a local web server for better functionality

2. **For development with live reload:**
   ```bash
   # Using Python's built-in server
   cd event-planner
   python -m http.server 3000

   # Or using Node.js
   npx serve . -p 3000
   ```

## 🎯 Usage Guide

### Getting Started
1. **Launch the application** by opening `index.html` in your browser
2. **Start with AI Planning** - Click the "AI Auto-Tasks" button in the Tasks panel
3. **Fill in basic event details** in the Basics panel
4. **Use AI recommendations** for budget, schedule, vendors, and tasks
5. **Customize manually** as needed using the manual modes
6. **Export professional reports** using the Export panel

### Navigation
- **Sidebar**: Click panel names or use Alt+1-9 shortcuts
- **Top Bar**: Theme switcher, help, and profile access
- **Keyboard Shortcuts**:
  - `Alt+1-9`: Jump to panels 1-9
  - `Ctrl+S`: Save current state
  - `Escape`: Return to home/dashboard

### AI Features
- **Chat Interface**: Natural conversation for event planning
- **Guided Questions**: 8-step intake process for comprehensive planning
- **Auto-Generation**: Instant creation of budgets, schedules, tasks, and vendor lists
- **Smart Recommendations**: Context-aware suggestions based on event type and size

### Manual Editing
- **Budget**: Add/edit/delete budget items with real-time chart updates
- **Schedule**: Timeline and list views with drag-and-drop editing
- **Tasks**: Categorized checklist with progress tracking
- **Vendors**: Vendor management with booking status and contact info

## 🔧 API Endpoints

The FastAPI backend provides the following endpoints:

```
GET  /               # Health check
GET  /health         # Detailed health status
POST /ai/plan        # Generate comprehensive event plan
POST /ai/budget      # Generate budget recommendations
POST /ai/vendors     # Generate vendor recommendations
POST /ai/schedule    # Generate event schedule
POST /ai/tasks       # Generate task checklist
```

### Example API Usage

```python
import requests

# Generate budget recommendations
response = requests.post('http://localhost:8000/ai/budget', json={
    'basics': {
        'name': 'Wedding Celebration',
        'type': 'wedding',
        'attendees': 150
    }
})

budget_plan = response.json()
```

## 🎨 Customization

### Themes
The application supports multiple themes:
- **Light Theme**: Clean, bright interface
- **Dark Theme**: Easy on the eyes for extended use
- **Color Themes**: Blue, purple, green, orange variants

### Styling
- **CSS Variables**: Easy theme customization via CSS custom properties
- **Glassmorphism**: Configurable blur and transparency effects
- **Responsive Breakpoints**: Mobile-first design approach

### Extending Functionality
- **Add New Panels**: Follow the modular pattern in `js/ui.js`
- **New AI Features**: Extend the backend API endpoints
- **Custom Charts**: Integrate additional Chart.js visualizations

## 📊 Data Structure

The application uses a comprehensive data model:

```javascript
{
  basics: {
    name: string,
    type: string,
    date: string,
    attendees: number,
    duration: string
  },
  budget: Array<BudgetItem>,
  schedule: Array<ScheduleItem>,
  checklist: Array<TaskItem>,
  vendors: Array<VendorItem>,
  aiInsights: Object
}
```

## 🔒 Security & Privacy

- **Local Storage**: All data stored locally in browser
- **No External APIs**: AI features use local mock implementations
- **CORS Enabled**: Backend allows cross-origin requests for development
- **Input Validation**: Client and server-side validation

## 🐛 Troubleshooting

### Common Issues

1. **PDF Export Not Working**
   - Ensure jsPDF and html2canvas libraries are loaded
   - Check browser console for errors

2. **AI Features Not Responding**
   - Verify FastAPI server is running on port 8000
   - Check network connectivity

3. **Styling Issues**
   - Ensure Bootstrap 5.3 CSS is loaded
   - Check for CSS conflicts

4. **Data Not Saving**
   - Check browser localStorage permissions
   - Verify no JavaScript errors in console

### Development Tips

- **Use Browser DevTools** for debugging
- **Check Console** for JavaScript errors
- **Network Tab** for API call monitoring
- **Local Storage Inspector** for data persistence

## 🚀 Deployment

### Production Backend
```bash
# Install production dependencies
pip install fastapi uvicorn

# Run with production server
uvicorn server:app --host 0.0.0.0 --port 8000
```

### Frontend Deployment
- Host static files on any web server
- Ensure CORS is properly configured for API calls
- Use HTTPS in production for security

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style
- Use ES6+ JavaScript features
- Follow modular architecture patterns
- Include JSDoc comments for functions
- Use meaningful variable and function names

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Bootstrap 5.3** for responsive design framework
- **Chart.js** for data visualization
- **jsPDF & html2canvas** for PDF generation
- **FastAPI** for the Python backend framework
- **Font Awesome** for icons

---

**Built with ❤️ for event planners everywhere**

*AI Event Architect - Making event planning intelligent, beautiful, and effortless*