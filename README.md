# 🎨 Creative Studio - All-in-One Design Platform

A comprehensive web-based creative platform that combines **Certificate Generation**, **Magazine/Poster Design**, **Task Management**, **Event Planning**, **Activity Reports**, **AI Tools**, and **Mind Mapping** in one elegant, unified dashboard.

![Creative Studio](https://img.shields.io/badge/Creative-Studio-blue?style=for-the-badge&logo=palette)
![Version](https://img.shields.io/badge/Version-2.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

## ✨ What's New in v2.0

### 🏠 Unified Dashboard
- **Central Hub**: Single entry point for all creative tools
- **Iframe Integration**: Seamless tool switching without page reloads
- **Backend Monitoring**: Real-time status of servers (ports 8000 & 8001)
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Keyboard Shortcuts**: Quick tool access with Alt+1-7 keys
- **URL Hash Navigation**: Direct links to specific tools

### 🛠️ Integrated Tools
- **MindMap AI**: Intelligent mind mapping with AI assistance
- **Event Planner**: Complete event management with budgeting
- **Certificate Generator**: Professional certificate creation
- **Activity Report**: Structured report generation and analytics
- **MoodSense+**: AI-powered mood tracking and wellness
- **Poster Maker**: Canvas-based design with drag-and-drop
- **Task Manager**: Smart task organization and tracking

## 🚀 Quick Start

### Option 1: Run with Live Server (Recommended)
1. Install the Live Server extension in VS Code
2. Open `index.html` in VS Code
3. Right-click and select "Open with Live Server"
4. The dashboard will open at `http://localhost:5500`

### Option 2: Run Backend Servers
```bash
# Start the main server (port 8000)
python server.py

# In another terminal, start certificate server (port 8001)
python certificate_server.py

# Or run both servers simultaneously
python run_both_servers.py
```

### Option 3: Use Batch File (Windows)
```bash
# Run the batch file to start both servers
run_servers.bat
```

## 🎯 How to Use the Dashboard

1. **Welcome Screen**: Overview of all available tools with descriptions
2. **Sidebar Navigation**: Click any tool to open it in the main area
3. **Backend Status**: Green indicators show server availability
4. **Tool Switching**: Use sidebar or welcome cards to switch tools
5. **Keyboard Shortcuts**:
   - `Ctrl/Cmd + B`: Toggle sidebar
   - `Alt + 1-7`: Quick tool switching
   - `Escape`: Return to welcome screen

## 🛠️ Technology Stack

### Frontend Framework
- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **JavaScript ES6+**: Vanilla JS with modern features
- **Bootstrap 5.3**: Responsive UI components and utilities

### Libraries & Dependencies
- **Fabric.js** (4.6.0) - Canvas object manipulation for poster maker
- **html2canvas** (1.4.1) - Export functionality for high-quality image generation
- **jsPDF** (2.5.1) - PDF export capabilities
- **SortableJS** (1.15.0) - Drag and drop functionality
- **Font Awesome** (6.4.0) - Professional icon set
- **Google Fonts** - Typography with Poppins, Inter, Playfair Display

### Design System
- **Light/Dark Theme Support** - Automatic theme switching with persistence
- **Responsive Design** - Mobile-first approach with breakpoint optimization
- **Modern UI/UX** - Glassmorphism effects and smooth animations
- **Accessibility** - WCAG compliant with proper ARIA labels

## 📁 Project Structure

```
creative-studio/
├── index.html              # Main homepage with module navigation
├── certificate.html        # Certificate generator interface
├── poster.html            # Magazine/poster maker interface  
├── todo.html              # Task manager interface
├── css/
│   ├── style.css          # Global styles and theme system
│   ├── certificate.css    # Certificate generator specific styles
│   ├── poster.css         # Poster maker specific styles
│   └── todo.css           # Task manager specific styles
├── js/
│   ├── main.js            # Core functionality and theme management
│   ├── certificate.js     # Certificate generation logic
│   ├── poster.js          # Canvas-based design functionality
│   └── todo.js            # Task management and data persistence
└── README.md              # Project documentation
```

## 🚀 Installation & Setup

### Prerequisites
- **Python 3.8+** - Backend server requirements
- **Modern Web Browser** - Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Internet Connection** - Required for CDN resources and AI features

### Quick Start

1. **Clone or Download** the repository
2. **Install Python Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the Application**:
   ```bash
   python server.py
   ```

4. **Open in Browser**: Navigate to `http://localhost:8000`

### Certificate Generator Setup

The Certificate Generator requires both the main server and a dedicated backend:

**Option 1: Manual Setup**
```bash
# Terminal 1 - Main server
python server.py

# Terminal 2 - Certificate backend  
python certificate_server.py
```

**Option 2: Convenient Scripts**
```bash
# Windows
run_servers.bat

# Cross-platform
python run_both_servers.py
```

Then access the Certificate Generator from the main page by clicking "Certificate Generator".

## 🎯 Module Documentation

### Certificate Generator (`certificate.html`)

**Main Features:**
- Template selection with live preview
- Custom text editing (recipient name, course, organization, date)
- Image upload for backgrounds, logos, and signatures
- Font and color customization
- Export to PNG (1080p) and PDF (A4)

**Key Functions:**
- `selectTemplate(templateName)` - Switch between certificate templates
- `updateCertificateText()` - Real-time text updates
- `uploadImage(type)` - Handle image uploads for background/logo/signature
- `exportCertificate(format)` - Export as PNG or PDF
- `saveCertificate()` / `loadCertificate()` - Persistence functionality

**Storage:**
- Auto-saves current state to `localStorage` as `certificate_autosave`
- Manual saves to `certificate_current`
- Supports image data as base64 strings

### Poster & Magazine Maker (`poster.html`)

**Main Features:**
- Canvas size presets (Instagram 1080x1080, A4, A3, Facebook, Twitter, Custom)
- Template gallery with 6 pre-designed layouts
- Object manipulation (text, images, shapes)
- Layer management with visibility controls
- Real-time property editing panel

**Key Functions:**
- `setupCanvas()` - Initialize Fabric.js canvas
- `addTextElement()` / `addImageElement()` - Add design elements
- `updatePropertiesPanel()` - Dynamic property editing
- `exportDesign(format)` - Export as PNG or PDF
- `saveDesign()` / `loadDesign()` - Project persistence

**Canvas Objects:**
- Text objects with font, size, color control
- Image objects with scaling and positioning
- Shape objects (rectangles, circles) with fill and stroke
- Background images and colors

### Task Manager (`todo.html`)

**Main Features:**
- Task creation with title, description, due date, priority, tags
- Multiple filter views (All, Today, Week, Pending, Overdue, Completed)
- Priority-based filtering and sorting
- Search functionality across all task fields
- Statistics dashboard with completion tracking

**Key Functions:**
- `addNewTask(event)` - Create new tasks with validation
- `filterTasks(filterType)` - Apply view filters
- `toggleTaskComplete(taskId)` - Mark tasks complete/incomplete
- `exportTasks(format)` - Export data as JSON, CSV, or TXT
- `updateStatistics()` - Calculate completion metrics

**Data Structure:**
```javascript
{
  id: "unique-identifier",
  title: "Task title",
  description: "Optional description", 
  dueDate: "YYYY-MM-DD",
  priority: "high|medium|low",
  status: "pending|in-progress|completed",
  tags: ["array", "of", "tags"],
  completed: boolean,
  createdAt: "ISO timestamp",
  updatedAt: "ISO timestamp"
}
```

## 💾 Data Management

### Local Storage Schema

**Certificate Data:**
```javascript
{
  recipientName: "John Doe",
  courseName: "Web Development", 
  organizationName: "Creative Academy",
  date: "2024-01-15",
  backgroundImage: "base64-string",
  logoImage: "base64-string", 
  signatureImage: "base64-string",
  fontFamily: "Poppins",
  textColor: "#1a1a1a",
  template: "classic"
}
```

**Poster Design Data:**
```javascript
{
  canvas: fabric.Canvas.toJSON(),
  template: "fashion",
  canvasSize: "instagram", 
  savedAt: "ISO timestamp"
}
```

**Task Manager Data:**
```javascript
{
  tasks: [/* array of task objects */],
  filters: {
    current: "all",
    priority: { high: true, medium: true, low: true }
  },
  sort: "created",
  savedAt: "ISO timestamp"
}
```

### Export Capabilities

**Certificate Generator:**
- PNG export at 2x resolution (1600x1200px)
- PDF export in A4 landscape format
- Maintains image quality and font rendering

**Poster Maker:**
- PNG export at 2x resolution for print quality
- PDF export with proper dimensions based on canvas size
- Preserves vector graphics and image quality

**Task Manager:**
- JSON export with complete task data and metadata
- CSV export for spreadsheet applications
- TXT export for readable plain-text format

## 🎨 Theme System

### CSS Variables
The application uses CSS custom properties for theme consistency:

```css
:root {
  --primary-color: #6366f1;
  --secondary-color: #8b5cf6;
  --accent-color: #06b6d4;
  --bg-color: #ffffff;
  --text-primary: #1e293b;
  --border-color: #e2e8f0;
  /* ... additional variables */
}
```

### Dark Theme Support
- Automatic detection of system theme preference
- Manual toggle with persistence
- Smooth transitions between themes
- Optimized contrast ratios for accessibility

## 📱 Responsive Design

### Breakpoint Strategy
- **Desktop**: 1200px+ (Full three-column layout)
- **Tablet**: 768px-1199px (Two-column layout)  
- **Mobile**: Below 768px (Single-column stacked layout)

### Mobile Optimizations
- Touch-friendly interface with larger tap targets
- Simplified toolbars for smaller screens
- Collapsible sidebars and navigation
- Optimized canvas interactions for touch devices

## 🔧 Setup & Installation

### Quick Start
1. Clone or download the project files
2. Open `index.html` in a modern web browser
3. No build process or dependencies required!

### Browser Requirements
- **Chrome** 90+ (Recommended)
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+

### Features Requiring HTTPS
- Service Worker registration (future notifications)
- Advanced canvas export features
- Clipboard API integration

## 🚀 Deployment Options

### Static Hosting (Recommended)
- **GitHub Pages**: Push to repository and enable Pages
- **Netlify**: Drag and drop deployment  
- **Vercel**: Git integration with automatic deploys
- **Surge.sh**: Command-line deployment

### Custom Domain Setup
1. Configure your static hosting provider
2. Update any absolute URLs in the code
3. Ensure HTTPS is enabled for full functionality

## 🎯 Usage Examples

### Creating a Certificate
1. Open Certificate Generator from homepage
2. Select a template (Classic, Modern, Tech, etc.)
3. Fill in recipient details and course information  
4. Upload optional background image and logo
5. Customize fonts and colors
6. Export as PNG or PDF

### Designing a Poster  
1. Open Poster Maker from homepage
2. Choose canvas size (Instagram, A4, etc.)
3. Select a template or start blank
4. Add text, images, and shapes using toolbar
5. Arrange elements with drag and drop
6. Adjust properties using right sidebar
7. Export final design

### Managing Tasks
1. Open Task Manager from homepage
2. Add new task with title, due date, and priority
3. Use filters to view specific task groups
4. Mark tasks complete by clicking checkbox
5. Search and sort for better organization
6. Export task list for external use

## 🔮 Future Enhancements

### Planned Features
- **User Accounts**: Cloud storage and synchronization
- **Collaboration**: Real-time multi-user editing
- **Template Marketplace**: Community-shared designs
- **Advanced Export**: More file formats and sizes
- **Integration APIs**: Connect with external services
- **Mobile Apps**: Native iOS and Android versions

### Technical Improvements  
- **PWA Support**: Offline functionality with Service Workers
- **Performance**: Lazy loading and code splitting
- **Accessibility**: Enhanced screen reader support
- **Internationalization**: Multi-language support

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow existing code style and patterns
- Add comments for complex functionality  
- Test across different browsers and devices
- Update documentation for new features

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Bootstrap Team** - Responsive framework
- **Fabric.js** - Canvas manipulation library
- **Font Awesome** - Icon library
- **Google Fonts** - Typography
- **Unsplash** - Template inspiration images

## 📞 Support

### Getting Help
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Community support in GitHub Discussions  
- **Documentation**: Check this README and inline code comments

### Common Issues
- **Export not working**: Ensure browser supports canvas.toBlob()
- **Images not loading**: Check file size limits (5MB certificates, 10MB posters)
- **Theme not persisting**: Verify localStorage is enabled

---

**Built with ❤️ for creators, designers, and productivity enthusiasts.**

*Last updated: December 2024*#   C S 
 
 #   C S 
 
 #   C S 
 
 