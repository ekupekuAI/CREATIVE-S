import os
import json
import re
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, RedirectResponse
from pydantic import BaseModel
import importlib
import importlib.util

# NOTE: heavy ML/model code (in `rewriter.py`) is imported lazily to avoid
# blocking server startup. Use `get_rewriter_module()` to access functions
# if available. If local models are unavailable or fail to load, endpoints
# fall back to lightweight OpenAI calls or mock data.

_rewriter = None
def get_rewriter_module():
    global _rewriter
    if _rewriter is not None:
        return _rewriter
    try:
        _rewriter = importlib.import_module('rewriter')
        return _rewriter
    except Exception as e:
        # keep _rewriter as None and return None to indicate unavailable
        print('rewriter module lazy-load failed:', e)
        _rewriter = None
        return None

ROOT = Path(__file__).resolve().parent

app = FastAPI(title="Creative Studio Unified Server")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Mount root static files
app.mount("/css", StaticFiles(directory=str(ROOT / "css")), name="css")
app.mount("/js", StaticFiles(directory=str(ROOT / "js")), name="js")
app.mount("/assets", StaticFiles(directory=str(ROOT / "assets")), name="assets")

# Serve service worker from root
@app.get("/sw.js")
async def serve_service_worker():
    sw_path = ROOT / "sw.js"
    if sw_path.exists():
        with open(sw_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return HTMLResponse(content=content, media_type="application/javascript")
    raise HTTPException(status_code=404, detail="Service worker not found")

# Serve favicon (prevent 404)
@app.get("/favicon.ico")
async def serve_favicon():
    # Return empty response to prevent 404 errors
    return HTMLResponse(content="", status_code=204)

# Auto-mount frontend folders (any folder with index.html) and provide index
mounted_projects = []
for child in ROOT.iterdir():
    if child.is_dir():
        index_file = child / 'index.html'
        if index_file.exists():
            mount_path = f"/{child.name}"
            app.mount(mount_path, StaticFiles(directory=str(child), html=True), name=f"static_{child.name}")
            mounted_projects.append((child.name, mount_path + '/'))
            print(f"Mounted {child.name} at {mount_path}/")

# Mount certificate generator static files
if (ROOT / "certificate generator").exists():
    app.mount("/certificate-css", StaticFiles(directory=str(ROOT / "certificate generator" / "css")), name="certificate_css")
    app.mount("/certificate-js", StaticFiles(directory=str(ROOT / "certificate generator" / "js")), name="certificate_js")
    app.mount("/certificate-templates", StaticFiles(directory=str(ROOT / "certificate generator" / "templates")), name="certificate_templates")

# Serve individual HTML files from root or subdirectories
@app.get("/{html_file}.html")
async def serve_html(html_file: str):
    allowed_files = ["certificate", "poster", "Mag", "todo"]
    if html_file in allowed_files:
        # Check root first
        file_path = ROOT / f"{html_file}.html"
        if file_path.exists():
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return HTMLResponse(content=content)

        # Check subdirectories for projects with spaces in names
        for child in ROOT.iterdir():
            if child.is_dir() and html_file.lower().replace(' ', '') in child.name.lower().replace(' ', ''):
                sub_file = child / f"{html_file}.html"
                if sub_file.exists():
                    with open(sub_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                    return HTMLResponse(content=content)

    raise HTTPException(status_code=404, detail="File not found")

@app.get('/', response_class=HTMLResponse)
async def projects_index():
    # Serve the main Creative Studio index.html
    index_path = ROOT / 'index.html'
    if index_path.exists():
        with open(index_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return HTMLResponse(content=content)
    else:
        # Fallback to auto-generated list if index.html not found
        links = ''.join([f'<li><a href="{path}">{name}</a></li>' for name, path in mounted_projects])
        body = f"""
        <html>
          <head><title>Hosted Projects</title></head>
          <body>
            <h2>Hosted Projects</h2>
            <ul>
              {links}
            </ul>
            <p>API docs: <a href="/docs">/docs</a></p>
          </body>
        </html>
        """
        return HTMLResponse(content=body)

# Auto-discover backend server apps and mount under /api/<project>
def import_fastapi_app_from(path: Path):
    try:
        spec = importlib.util.spec_from_file_location(f"backend_{path.parent.name}", str(path))
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return getattr(module, 'app', None)
    except Exception as e:
        print('Failed to import backend app from', path, e)
        return None

for child in ROOT.iterdir():
    backend_server = child / 'backend' / 'server.py'
    if backend_server.exists():
        sub_app = import_fastapi_app_from(backend_server)
        if sub_app:
            mount_point = f"/api/{child.name}"
            app.mount(mount_point, sub_app)
            print(f"Mounted backend app for {child.name} at {mount_point}")

# Optional: load a local .env file from the project root if present.
# This allows you to keep a local `.env` (uncommitted) with values like
# OPENAI_API_KEY=sk-... for development. The repository's `.gitignore`
# already contains `.env` so files created locally won't be committed.
try:
    from dotenv import load_dotenv
    dotenv_path = ROOT / '.env'
    if dotenv_path.exists():
        load_dotenv(dotenv_path)
        print('Loaded .env from', dotenv_path)
except Exception:
    # python-dotenv not installed or failed; just continue relying
    # on real environment variables. requirements.txt already lists
    # python-dotenv for convenience.
    pass

# OpenAI client for mindmap (use environment variable; don't hardcode keys)
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print('Warning: OPENAI_API_KEY not set. OpenAI features will be disabled.')
    client = None
else:
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
    except Exception as e:
        print('OpenAI client import/initialization failed:', e)
        client = None

# ============================================================
# AI Study Summarizer Routes (/api/ai-study)
# ============================================================

class TextRequest(BaseModel):
    text: str
    target_emotion: str | None = None

@app.post("/api/ai-study/get_songs")
def get_songs(request: dict):
    mood_profile = request.get('mood_profile')
    language = request.get('language', 'english')
    if not mood_profile:
        raise HTTPException(status_code=400, detail="Mood profile required")

    try:
        # Try local rewriter/recommender first (lazy)
        rw = get_rewriter_module()
        if rw and hasattr(rw, 'recommend_songs'):
            songs = rw.recommend_songs(mood_profile, language)
            return {"songs": songs}
        # Fallback: return mock songs
        return {"songs": ["Mock Song 1", "Mock Song 2", "Mock Song 3"]}
    except Exception as e:
        # Fallback mock songs
        return {"songs": ["Mock Song 1", "Mock Song 2", "Mock Song 3"]}

@app.post("/api/ai-study/rewrite")
def rewrite(request: dict):
    text = request.get('text', '')
    target_emotion = request.get('target_emotion')

    if not text.strip():
        raise HTTPException(status_code=400, detail="Text is empty")

    try:
        # Try to use local rewriter if available (lazy import)
        rw = get_rewriter_module()
        if rw:
            try:
                mood_profile = rw.detect_emotion(text) if hasattr(rw, 'detect_emotion') else {"primary_emotion": "neutral", "emotions": []}
                primary_emotion = mood_profile.get('primary_emotion', 'neutral')
                emotion_used = target_emotion if target_emotion else primary_emotion
                rewritten = rw.rewrite_text(text, target_emotion=emotion_used) if hasattr(rw, 'rewrite_text') else text
                return {
                    "original_text": text,
                    "mood_profile": mood_profile,
                    "rewritten_text": rewritten
                }
            except Exception as e:
                # fall through to OpenAI/mock fallback
                print('local rewriter failed:', e)

        # Fallback: return original text and neutral mood
        return {
            "original_text": text,
            "mood_profile": {
                "primary_emotion": "neutral",
                "emotions": [{"label": "neutral", "score": 1.0}]
            },
            "rewritten_text": text
        }

    except Exception as e:
        # Fallback mock response
        return {
            "original_text": text,
            "mood_profile": {
                "primary_emotion": "neutral",
                "emotions": [{"label": "neutral", "score": 1.0}]
            },
            "rewritten_text": text  # Return original text as fallback
        }

# ============================================================
# Mindmap AI Routes (/api/mindmap)
# ============================================================

class AnalyzeRequest(BaseModel):
    text: str
    mode: str
    enable_web: bool = False

class ClassifyRequest(BaseModel):
    text: str

class SummarizeRequest(BaseModel):
    text: str

SYSTEM_MINDENGINE = """
You are MindGraph-AI, an NLP engine that generates flowcharts, mind maps, summaries, and keywords using STRICT logic.

================================================================
MIND MAP RULES (STRICT)
================================================================
1. Identify ONE central topic (noun phrase).
2. Identify 3–6 conceptual categories:
   - Features, Benefits, Components, Methods, Applications,
     Challenges, Impact, Use-Cases, Advantages.
3. Subnodes MUST:
   - Be meaningful concepts.
   - Be noun phrases or verb–noun concepts.
   - NOT be adjectives (big, heavy).
   - NOT be broken phrases.
   - NOT be hallucinated.
   - NOT be words copied without meaning.
4. Cluster subnodes under correct category logically.
5. Output as JSON:
{
  "type": "mindgraph",
  "nodes": [...],
  "edges": [...]
}
Rules:
- Level 0 → Central Topic
- Level 1 → Category
- Level 2 → Subnode

================================================================
FLOWCHART RULES (STRICT)
================================================================
1. Identify the goal (objective).
2. Extract steps sequentially.
3. Decisions only if text clearly implies choice.
4. Nodes: Start, Process, Decision (optional), End
Output JSON:
{
  "type": "flowchart",
  "nodes": [...],
  "edges": [...]
}

================================================================
KEYWORD RULE
================================================================
Return 8–15 meaningful keywords (no stopwords, no adjectives).

================================================================
SUMMARY RULE
================================================================
Return JSON ONLY:
{
 "title": "",
 "summary_short": "",
 "summary_medium": "",
 "summary_detailed": "",
 "key_points": [],
 "keywords": []
}

================================================================
GENERAL RULES
================================================================
• No hallucinations.
• No reuse of previous outputs.
• Every new text is processed fresh.
• Output must ALWAYS be valid JSON.
• No adjectives as categories or nodes.
• No broken English.
"""

def use_llm(system_prompt: str, user_prompt: str):
    if client is None:
        raise HTTPException(status_code=503, detail="OpenAI client not configured")
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0
    )
    return completion.choices[0].message.content

def force_json(text: str):
    # Remove ``` blocks
    text = text.replace("```json", "").replace("```", "").strip()

    # Capture JSON object
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        return None

    json_text = match.group(0)

    # Fix trailing commas
    json_text = re.sub(r",\s*}", "}", json_text)
    json_text = re.sub(r",\s*]", "]", json_text)

    try:
        return json.loads(json_text)
    except:
        return None

@app.post("/api/mindmap/classify")
def classify(req: dict):
    text = req.get('text', '')
    prompt = f"""
Classify the best visualization type for this text:

Text:
{text}

Choose ONLY ONE:
- mindgraph
- flowchart
- summary
- keywords

Rules:
• If text explains a concept → mindgraph
• If text describes steps or process → flowchart
• If long informational → summary
• If shallow → keywords

Return ONLY:
{{"mode": "<one>"}}
"""

    raw = use_llm(SYSTEM_MINDENGINE, prompt)
    parsed = force_json(raw)

    return parsed if parsed else {"error": "Invalid JSON", "raw": raw}

# ============================================================
# Event Planner AI Stubs (/ai)
# ============================================================

@app.post("/ai/plan")
def ai_plan(payload: dict):
    # payload expected: {"text": "..."}
    text = payload.get('text', '')
    # Lightweight logging for debugging frontend calls
    try:
        print(f"[AI REQUEST] /ai/plan payload (truncated): {str(text)[:200]!r} client_configured={client is not None}")
    except Exception:
        print('[AI REQUEST] /ai/plan payload (unprintable)')
    # Try local planner first (lazy)
    rw = get_rewriter_module()
    if rw and hasattr(rw, 'plan_event'):
        try:
            result = rw.plan_event(text)
            return {"status": "ok", "data": result if isinstance(result, list) else [{"title": "Plan", "text": str(result)}]}
        except Exception as e:
            print('local plan_event failed:', e)

    # Fallback: use OpenAI to generate a simple plan snippet
    try:
        prompt = f"Generate a concise event plan for the following event description. Return a JSON array of objects with keys 'title' and 'text'.\n\nDescription:\n{text}"
        raw = use_llm('EventPlanner', prompt)
        parsed = force_json(raw)
        if parsed and isinstance(parsed, list):
            return {"status": "ok", "data": parsed}
    except Exception as e:
        print('openai plan fallback failed:', e)

    # Final fallback: simple echo
    resp = {"status": "ok", "data": [{"title": "Basic Plan", "text": text}]}
    print(f"[AI RESPONSE] /ai/plan fallback used, returning {len(resp['data'])} items")
    return resp


@app.post("/ai/budget")
def ai_budget(payload: dict):
    text = payload.get('text', '')
    try:
        print(f"[AI REQUEST] /ai/budget payload (truncated): {str(text)[:200]!r} client_configured={client is not None}")
    except Exception:
        print('[AI REQUEST] /ai/budget payload (unprintable)')
    # return simple mock budget items
    rw = get_rewriter_module()
    if rw and hasattr(rw, 'estimate_budget'):
        try:
            items = rw.estimate_budget(text)
            return {"status": "ok", "data": items}
        except Exception as e:
            print('local estimate_budget failed:', e)

    # Try OpenAI to produce JSON list
    try:
        prompt = f"Estimate a simple event budget for the description below. Return ONLY a JSON array of objects like [{'{'}\"category\":\"...\",\"estimate\":123{'}'}].\n\n{text}"
        raw = use_llm('EventBudget', prompt)
        parsed = force_json(raw)
        if parsed and isinstance(parsed, list):
            return {"status": "ok", "data": parsed}
    except Exception as e:
        print('openai budget fallback failed:', e)

    # Fallback mock
    resp = {"status": "ok", "data": [
        {"category": "venue", "estimate": 20000},
        {"category": "food", "estimate": 30000},
        {"category": "decor", "estimate": 8000}
    ]}
    print(f"[AI RESPONSE] /ai/budget fallback used, returning {len(resp['data'])} items")
    return resp


@app.post("/ai/vendors")
def ai_vendors(payload: dict):
    text = payload.get('text', '')
    try:
        print(f"[AI REQUEST] /ai/vendors payload (truncated): {str(text)[:200]!r} client_configured={client is not None}")
    except Exception:
        print('[AI REQUEST] /ai/vendors payload (unprintable)')
    rw = get_rewriter_module()
    if rw and hasattr(rw, 'suggest_vendors'):
        try:
            vendors = rw.suggest_vendors(text)
            return {"status": "ok", "data": vendors}
        except Exception as e:
            print('local suggest_vendors failed:', e)

    # Fallback: simple mock vendors
    resp = {"status": "ok", "data": [
        {"name": "Prime Catering", "category": "Catering", "rating": 4.6, "contact": "123-456"},
        {"name": "StageCraft Decor", "category": "Decoration", "rating": 4.4, "contact": "234-567"}
    ]}
    print(f"[AI RESPONSE] /ai/vendors fallback used, returning {len(resp['data'])} items")
    return resp


@app.post("/ai/schedule")
def ai_schedule(payload: dict):
    basics = payload.get('basics', {})
    try:
        print(f"[AI REQUEST] /ai/schedule payload (truncated): {str(basics)[:200]!r} client_configured={client is not None}")
    except Exception:
        print('[AI REQUEST] /ai/schedule payload (unprintable)')
    # Try OpenAI for intelligent schedule generation
    if client:
        try:
            system = 'You are an expert event planner. Return ONLY valid JSON for the requested component. Do not include any extra text, explanations, or markdown.'
            user = f"""Generate a schedule for the following event basics: {json.dumps(basics, ensure_ascii=False)}.

CRITICAL INSTRUCTIONS FOR SCHEDULE GENERATION:
- You are an expert event planner AI. Read and analyze EVERY SINGLE DETAIL in the event basics provided above.
- Understand the event type, description, venue, location, theme, duration, attendees, date, and all other fields.
- Think deeply about what this specific event entails and what unique activities and timing it would have.
- DO NOT use any generic templates or predefined schedules like standard wedding/ceremony/reception or conference/registration/keynote/lunch.
- Instead, create COMPLETELY CUSTOM schedule items based on the event's specific requirements and activities mentioned.
- IMPORTANT: Do not hallucinate or add details not present in the input. Base everything on the provided data.
- For example:
  * If it's a "Sangeet event in college ground with food stalls, entertainment games, gaming zones, halls, bedrooms", create items like "Food Stall Setup and Opening", "Gaming Zone Inauguration", "Hall Decoration and Sound Check", "Bedroom Guest Check-in", "Entertainment Games Kickoff", "Cultural Performances", "Food Stall Peak Hours Management", "Late Night Gaming Sessions", etc.
  * If it's a "Tech conference with VR demos", create "VR Demo Booth Setup", "Attendee Registration with Tech Check", "Opening Keynote on AI Trends", "VR Demo Sessions", "Networking Breaks with Tech Showcases", "Panel on Future Tech", "Closing Ceremony with Awards", etc.
  * If it's a "Beach wedding", create "Sunset Ceremony Setup", "Beach Guest Arrival and Seating", "Ocean View Vows Exchange", "Sand Ceremony Ritual", "Reception Under Tiki Torches", "Beach Bonfire Celebration", "Late Night Stargazing", etc.
- Each schedule item must be SPECIFIC to this event's unique features, activities, and requirements mentioned in the description and other fields.
- Analyze the description word by word and create schedule items that directly correspond to the activities, locations, and flow of the event.
- Consider the event duration and spread activities appropriately across the time frame. Assume a typical event day from 9 AM to 10 PM unless specified otherwise.
- Include realistic time slots with start_time and end_time in HH:MM format (24-hour). Ensure no overlaps and logical progression.
- Ensure the schedule flows logically from start to finish, with appropriate breaks and transitions.
- Generate 8-12 schedule items that cover the entire event timeline.
- Make the schedule comprehensive and tailored to this exact event.

Return JSON with schedule_items (array of objects with title, start_time, end_time, description)."""
            raw = use_llm(system, user)
            parsed = force_json(raw)
            if parsed and 'schedule_items' in parsed:
                print(f"[AI RESPONSE] /ai/schedule OpenAI succeeded, items: {len(parsed['schedule_items'])}")
                return {"status": "ok", "data": parsed}
        except Exception as e:
            print('OpenAI schedule generation failed:', e)

    # Try local rewriter
    rw = get_rewriter_module()
    if rw and hasattr(rw, 'generate_schedule'):
        try:
            sched = rw.generate_schedule(json.dumps(basics))
            return {"status": "ok", "data": {"schedule_items": sched}}
        except Exception as e:
            print('local generate_schedule failed:', e)

    # Fallback: simple suggested schedule
    resp = {"status": "ok", "data": {"schedule_items": [
        {"title": "Setup", "start_time": "08:00", "end_time": "09:00", "description": "Final preparations"},
        {"title": "Welcome", "start_time": "09:00", "end_time": "10:00", "description": "Opening ceremony"},
        {"title": "Main Activities", "start_time": "10:00", "end_time": "16:00", "description": "Event activities"},
        {"title": "Break", "start_time": "16:00", "end_time": "17:00", "description": "Refreshments"},
        {"title": "Closing", "start_time": "17:00", "end_time": "18:00", "description": "Wrap-up"}
    ]}}
    print(f"[AI RESPONSE] /ai/schedule fallback used, returning {len(resp['data']['schedule_items'])} items")
    return resp

@app.post("/ai/tasks")
def generate_tasks(req: dict):
    basics = req.get('basics', {})
    schedule = req.get('schedule', [])
    budget = req.get('budget', [])

    # Try OpenAI for intelligent tasks generation
    if client:
        try:
            system = 'You are an expert event planner. Return ONLY valid JSON for the requested component. Do not include any extra text, explanations, or markdown.'
            user = f"""Generate a checklist of tasks for the following event.

Event Basics: {json.dumps(basics, ensure_ascii=False)}

Scheduled Activities: {json.dumps(schedule, ensure_ascii=False)}

Budgeted Items: {json.dumps(budget, ensure_ascii=False)}

CRITICAL INSTRUCTIONS FOR TASKS GENERATION:
- You are an expert event planner AI. Read and analyze EVERY SINGLE DETAIL in the event basics, scheduled activities, and budgeted items provided above.
- Create COMPLETELY CUSTOM tasks that directly support and align with the scheduled activities and budgeted items.
- IMPORTANT: Do not hallucinate or add details not present in the input. Base everything on the provided data.
- For each scheduled activity, generate specific tasks needed to execute it, such as setup, coordination, execution, and follow-up.
- For each budgeted item, generate tasks related to procurement, setup, management, and utilization.
- Tasks should be practical, actionable, and organized by logical categories (e.g., Planning, Setup, Execution, Logistics, Cleanup).
- Each task should have:
  - title: Clear, specific task description
  - category: Logical grouping (Planning, Setup, Execution, Logistics, etc.)
  - priority: high, medium, or low based on importance and timing
- Ensure tasks are comprehensive but not overwhelming - aim for 15-25 total tasks depending on event complexity.
- Consider dependencies between tasks and the event timeline.
- Make tasks specific to this event's unique features and requirements.
- Generate tasks that are realistic and directly tied to the event's components.

Return JSON with tasks (array of objects with title, category, priority)."""
            raw = use_llm(system, user)
            parsed = force_json(raw)
            if parsed and 'tasks' in parsed:
                print(f"[AI RESPONSE] /ai/tasks OpenAI succeeded, items: {len(parsed['tasks'])}")
                return {"status": "ok", "data": parsed}
        except Exception as e:
            print('OpenAI tasks generation failed:', e)

    # Fallback: simple suggested tasks
    resp = {"status": "ok", "data": {"tasks": [
        {"title": "Final preparations", "category": "Planning", "priority": "high"},
        {"title": "Setup venue", "category": "Setup", "priority": "high"},
        {"title": "Welcome guests", "category": "Execution", "priority": "medium"},
        {"title": "Manage activities", "category": "Execution", "priority": "medium"},
        {"title": "Serve food/drinks", "category": "Logistics", "priority": "medium"},
        {"title": "Coordinate vendors", "category": "Logistics", "priority": "low"},
        {"title": "Take photos", "category": "Execution", "priority": "low"},
        {"title": "Clean up", "category": "Cleanup", "priority": "low"}
    ]}}
    print(f"[AI RESPONSE] /ai/tasks fallback used, returning {len(resp['data']['tasks'])} items")
    return resp

@app.post("/ai/report")
def generate_ai_report(req: dict):
    eventData = req.get('eventData', {})
    options = req.get('options', {})

    try:
        print(f"[AI REQUEST] /ai/report eventData keys: {list(eventData.keys())} client_configured={client is not None}")
    except Exception:
        print('[AI REQUEST] /ai/report payload (unprintable)')

    # Try OpenAI for intelligent report generation
    if client:
        try:
            system = 'You are an expert event planning consultant and report writer. Generate comprehensive, professional event analysis reports. Return ONLY valid JSON as specified.'
            user = f"""Generate a comprehensive AI-powered event planning report based on the following data:

Event Data: {json.dumps(eventData, ensure_ascii=False)}

Report Options: {json.dumps(options, ensure_ascii=False)}

CRITICAL INSTRUCTIONS FOR REPORT GENERATION:
- You are an expert event planning consultant. Analyze EVERY SINGLE DETAIL in the event data provided above.
- Create a comprehensive, professional report that covers all aspects of the event planning.
- Structure the report with clear sections that analyze different components.
- Include intelligent insights, recommendations, and risk assessments based on the data.
- Consider the event's unique characteristics, budget constraints, timeline, and requirements.
- Provide actionable recommendations for improvement and optimization.
- Include risk assessment and mitigation strategies.
- Make the report tone match the specified tone (professional, casual, formal).
- Include recommendations only if requested in options.
- Include risk assessment only if requested in options.
- Generate the report in HTML format for direct display in the preview.
- Use professional styling with Bootstrap classes for the HTML.
- Structure the HTML with clear sections, headings, and organized content.
- Include charts, tables, and visual elements where appropriate.
- Make the report comprehensive but concise - focus on key insights and actionable information.

Return JSON with:
- html: Complete HTML content for the report preview
- sections: Array of section objects with title and content for PDF generation
- summary: Brief summary of the report findings"""

            raw = use_llm(system, user)
            parsed = force_json(raw)
            if parsed and 'html' in parsed:
                print(f"[AI RESPONSE] /ai/report OpenAI succeeded, HTML length: {len(parsed['html'])}")
                return {"status": "ok", "data": parsed}
        except Exception as e:
            print('OpenAI report generation failed:', e)

    # Fallback: generate basic HTML report
    basics = eventData.get('basics', {})
    budget = eventData.get('budget', [])
    schedule = eventData.get('schedule', [])
    tasks = eventData.get('checklist', [])
    vendors = eventData.get('vendors', [])

    # Calculate some basic metrics
    total_budget = sum(item.get('amount', 0) for item in budget)
    completed_tasks = len([t for t in tasks if t.get('completed')])
    total_tasks = len(tasks)
    booked_vendors = len([v for v in vendors if v.get('status') == 'booked'])

    html = f"""
    <div class="ai-report">
        <div class="alert alert-info mb-4">
            <h5><i class="fas fa-robot me-2"></i>AI-Generated Event Analysis Report</h5>
            <p class="mb-0">This report provides a comprehensive analysis of your event planning data.</p>
        </div>

        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Event Overview</h6>
                    </div>
                    <div class="card-body">
                        <h5>{basics.get('name', 'Event Name')}</h5>
                        <p class="text-muted mb-2">{basics.get('type', 'Event Type')}</p>
                        <div class="row">
                            <div class="col-6">
                                <small class="text-muted">Date</small><br>
                                <strong>{basics.get('date', 'TBD')}</strong>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Attendees</small><br>
                                <strong>{basics.get('attendees', 'TBD')}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Planning Progress</h6>
                    </div>
                    <div class="card-body">
                        <div class="row text-center">
                            <div class="col-4">
                                <div class="progress-circle" style="width: 60px; height: 60px; margin: 0 auto;">
                                    <div class="progress-bar bg-success" style="width: {(booked_vendors/len(vendors)*100) if vendors else 0}%"></div>
                                </div>
                                <small>Vendors<br><strong>{booked_vendors}/{len(vendors)}</strong></small>
                            </div>
                            <div class="col-4">
                                <div class="progress-circle" style="width: 60px; height: 60px; margin: 0 auto;">
                                    <div class="progress-bar bg-info" style="width: {(completed_tasks/total_tasks*100) if total_tasks else 0}%"></div>
                                </div>
                                <small>Tasks<br><strong>{completed_tasks}/{total_tasks}</strong></small>
                            </div>
                            <div class="col-4">
                                <div class="progress-circle" style="width: 60px; height: 60px; margin: 0 auto;">
                                    <div class="progress-bar bg-warning" style="width: {min(total_budget/50000*100, 100) if total_budget else 0}%"></div>
                                </div>
                                <small>Budget<br><strong>${total_budget:,.0f}</strong></small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Budget Analysis</h6>
                    </div>
                    <div class="card-body">
                        <h4 class="text-primary">${total_budget:,.0f}</h4>
                        <p class="text-muted mb-3">Total Estimated Budget</p>
                        <div class="budget-breakdown">
                            {''.join([f'<div class="d-flex justify-content-between mb-2"><span>{item.get("category", "General")}</span><span>${item.get("amount", 0):,.0f}</span></div>' for item in budget[:5]])}
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Schedule Timeline</h6>
                    </div>
                    <div class="card-body">
                        <div class="timeline-small">
                            {''.join([f'<div class="timeline-item-small mb-2"><div class="timeline-marker"></div><div class="timeline-content"><small class="fw-bold">{item.get("title", "")}</small><br><small class="text-muted">{item.get("start_time", "")} - {item.get("end_time", "")}</small></div></div>' for item in schedule[:4]])}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h6 class="mb-0">AI Recommendations</h6>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <h6>Planning Recommendations</h6>
                        <ul class="list-unstyled">
                            <li class="mb-2"><i class="fas fa-check-circle text-success me-2"></i>Complete vendor bookings at least 2 weeks before event</li>
                            <li class="mb-2"><i class="fas fa-check-circle text-success me-2"></i>Finalize budget allocations and secure deposits</li>
                            <li class="mb-2"><i class="fas fa-check-circle text-success me-2"></i>Create detailed contingency plans</li>
                        </ul>
                    </div>
                    <div class="col-md-6">
                        <h6>Risk Assessment</h6>
                        <ul class="list-unstyled">
                            <li class="mb-2"><i class="fas fa-exclamation-triangle text-warning me-2"></i>Weather contingency for outdoor elements</li>
                            <li class="mb-2"><i class="fas fa-exclamation-triangle text-warning me-2"></i>Vendor reliability and backup options</li>
                            <li class="mb-2"><i class="fas fa-exclamation-triangle text-warning me-2"></i>Attendee communication and updates</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
    """

    # Calculate completion percentage
    completion_percentage = (completed_tasks / total_tasks * 100) if total_tasks else 0

    # Calculate vendor status message
    vendor_status = 'All vendors are booked and ready.' if booked_vendors == len(vendors) else f'{len(vendors) - booked_vendors} vendors still need confirmation.'

    # Calculate key budget items string
    key_budget_items = ', '.join([f'{item.get("category", "General")}: ${item.get("amount", 0):,.0f}' for item in budget[:3]])

    sections = [
        {
            "title": "Executive Summary",
            "content": f"This comprehensive event planning report analyzes the {basics.get('name', 'event')} scheduled for {basics.get('date', 'TBD')}. The event is projected to accommodate {basics.get('attendees', 'TBD')} attendees with a total budget of ${total_budget:,.0f}."
        },
        {
            "title": "Budget Analysis",
            "content": f"The total estimated budget is ${total_budget:,.0f}, distributed across {len(budget)} categories. Key budget items include {key_budget_items}."
        },
        {
            "title": "Schedule Overview",
            "content": f"The event schedule includes {len(schedule)} activities spanning the planned duration. Key activities include {', '.join([item.get('title', '') for item in schedule[:3]])}."
        },
        {
            "title": "Task Progress",
            "content": f"Task completion stands at {completed_tasks}/{total_tasks} ({completion_percentage:.1f}%). {len([t for t in tasks if t.get('priority') == 'high' and not t.get('completed')])} high-priority tasks remain outstanding."
        },
        {
            "title": "Vendor Status",
            "content": f"Vendor coordination shows {booked_vendors} out of {len(vendors)} vendors confirmed. {vendor_status}"
        },
        {
            "title": "Recommendations",
            "content": "Focus on completing remaining high-priority tasks, confirming all vendor bookings, and establishing contingency plans. Regular progress reviews and clear communication channels will ensure successful event execution."
        }
    ]

    resp = {
        "status": "ok",
        "data": {
            "html": html,
            "sections": sections,
            "summary": f"Comprehensive analysis of {basics.get('name', 'event')} planning progress. Budget: ${total_budget:,.0f}, Tasks: {completed_tasks}/{total_tasks} complete, Vendors: {booked_vendors}/{len(vendors)} booked."
        }
    }
    print(f"[AI RESPONSE] /ai/report fallback used, HTML length: {len(resp['data']['html'])}")
    return resp

@app.post("/api/mindmap/analyze")
def analyze(req: AnalyzeRequest):
    prompt = f"""
Generate a {req.mode} using STRICT RULES.
Text:
{req.text}

Return ONLY JSON:
{{
 "type": "{req.mode}",
 "nodes": [],
 "edges": []
}}
"""

    raw = use_llm(SYSTEM_MINDENGINE, prompt)
    parsed = force_json(raw)

    return parsed if parsed else {"error": "Invalid JSON", "raw": raw}

@app.post("/api/mindmap/summarize")
def summarize(req: SummarizeRequest):
    prompt = f"""
Summarize this text using STRICT summary format:

Text:
{req.text}

Return EXACT JSON:
{{
 "title": "",
 "summary_short": "",
 "summary_medium": "",
 "summary_detailed": "",
 "key_points": [],
 "keywords": []
}}
"""

    raw = use_llm(SYSTEM_MINDENGINE, prompt)
    parsed = force_json(raw)

    return parsed if parsed else {"error": "Invalid JSON", "raw": raw}

# ============================================================
# Certificate Generator AI Routes (/ai/certificate)
# ============================================================

@app.post("/ai/certificate/generate")
def ai_certificate_generate(payload: dict):
    """Generate certificate template suggestions based on event type and requirements"""
    event_type = payload.get('event_type', '')
    requirements = payload.get('requirements', '')
    theme = payload.get('theme', 'professional')

    try:
        print(f"[AI REQUEST] /ai/certificate/generate event_type: {event_type} theme: {theme}")
    except Exception:
        print('[AI REQUEST] /ai/certificate/generate payload (unprintable)')

    # Try OpenAI for intelligent template generation
    if client:
        try:
            system = 'You are an expert certificate designer. Generate professional certificate templates with appropriate layouts, colors, and elements.'
            user = f"""Generate a certificate template design for the following:

Event Type: {event_type}
Requirements: {requirements}
Theme: {theme}

Return JSON with:
- template_name: Creative name for the template
- layout: Object with background, border, text_styles, elements array
- color_scheme: Primary, secondary, accent colors
- suggested_elements: Array of certificate elements (title, recipient, date, signature, etc.)
- description: Brief description of the template style"""

            raw = use_llm(system, user)
            parsed = force_json(raw)
            if parsed:
                print(f"[AI RESPONSE] /ai/certificate/generate OpenAI succeeded")
                return {"status": "ok", "data": parsed}
        except Exception as e:
            print('OpenAI certificate generate failed:', e)

    # Fallback: predefined templates based on event type
    templates = {
        'academic': {
            'template_name': 'Academic Excellence',
            'layout': {
                'background': 'gradient-gold',
                'border': 'elegant-frame',
                'text_styles': {'title': 'serif-bold', 'body': 'serif-regular'},
                'elements': ['university_seal', 'signature_lines', 'date_field']
            },
            'color_scheme': {'primary': '#D4AF37', 'secondary': '#8B4513', 'accent': '#000000'},
            'suggested_elements': ['Certificate of Achievement', 'Awarded to', 'For excellence in', 'Date', 'Signatures'],
            'description': 'Classic academic certificate with gold accents and formal typography'
        },
        'corporate': {
            'template_name': 'Corporate Recognition',
            'layout': {
                'background': 'clean-white',
                'border': 'minimal-line',
                'text_styles': {'title': 'sans-bold', 'body': 'sans-regular'},
                'elements': ['company_logo', 'signature_line', 'date_field']
            },
            'color_scheme': {'primary': '#2C3E50', 'secondary': '#3498DB', 'accent': '#E74C3C'},
            'suggested_elements': ['Certificate of Appreciation', 'Presented to', 'In recognition of', 'Date', 'Authorized Signature'],
            'description': 'Modern corporate certificate with clean design and professional styling'
        },
        'event': {
            'template_name': 'Event Participation',
            'layout': {
                'background': 'colorful-gradient',
                'border': 'decorative-frame',
                'text_styles': {'title': 'script-bold', 'body': 'sans-regular'},
                'elements': ['event_logo', 'medal_icon', 'date_field']
            },
            'color_scheme': {'primary': '#9B59B6', 'secondary': '#1ABC9C', 'accent': '#F39C12'},
            'suggested_elements': ['Certificate of Participation', 'Awarded to', 'For attending', 'Event Date', 'Organizer Signature'],
            'description': 'Fun and colorful certificate perfect for events and workshops'
        }
    }

    fallback_template = templates.get(event_type.lower(), templates['academic'])
    resp = {"status": "ok", "data": fallback_template}
    print(f"[AI RESPONSE] /ai/certificate/generate fallback used: {fallback_template['template_name']}")
    return resp

@app.post("/ai/certificate/analyze")
def ai_certificate_analyze(payload: dict):
    """Analyze existing certificate content and provide improvement suggestions"""
    certificate_text = payload.get('certificate_text', '')
    current_design = payload.get('current_design', {})

    try:
        print(f"[AI REQUEST] /ai/certificate/analyze text_length: {len(certificate_text)}")
    except Exception:
        print('[AI REQUEST] /ai/certificate/analyze payload (unprintable)')

    # Try OpenAI for intelligent analysis
    if client:
        try:
            system = 'You are an expert certificate designer and content analyst. Provide detailed analysis and improvement suggestions.'
            user = f"""Analyze this certificate content and design:

Certificate Text:
{certificate_text}

Current Design: {json.dumps(current_design, ensure_ascii=False)}

Provide analysis covering:
- Content clarity and completeness
- Design effectiveness
- Professional appearance
- Suggested improvements
- Missing elements

Return JSON with analysis sections."""

            raw = use_llm(system, user)
            parsed = force_json(raw)
            if parsed:
                print(f"[AI RESPONSE] /ai/certificate/analyze OpenAI succeeded")
                return {"status": "ok", "data": parsed}
        except Exception as e:
            print('OpenAI certificate analyze failed:', e)

    # Fallback analysis
    analysis = {
        'content_analysis': {
            'clarity': 'good',
            'completeness': 'adequate',
            'tone': 'professional',
            'suggestions': ['Consider adding more specific achievement details', 'Ensure all required fields are included']
        },
        'design_analysis': {
            'layout': 'balanced',
            'color_scheme': 'appropriate',
            'typography': 'readable',
            'suggestions': ['Consider adding decorative elements', 'Ensure proper spacing between elements']
        },
        'overall_score': 8,
        'recommendations': [
            'Add company/university seal if applicable',
            'Include signature lines for authenticity',
            'Consider adding border or decorative elements',
            'Ensure text hierarchy is clear'
        ]
    }

    resp = {"status": "ok", "data": analysis}
    print(f"[AI RESPONSE] /ai/certificate/analyze fallback used")
    return resp

@app.post("/ai/certificate/suggest")
def ai_certificate_suggest(payload: dict):
    """Suggest wording improvements for certificate text"""
    current_text = payload.get('current_text', '')
    certificate_type = payload.get('certificate_type', 'achievement')
    tone = payload.get('tone', 'professional')

    try:
        print(f"[AI REQUEST] /ai/certificate/suggest type: {certificate_type} tone: {tone}")
    except Exception:
        print('[AI REQUEST] /ai/certificate/suggest payload (unprintable)')

    # Try OpenAI for intelligent suggestions
    if client:
        try:
            system = f'You are an expert certificate writer. Suggest professional, {tone} wording for certificates.'
            user = f"""Improve the wording for this {certificate_type} certificate:

Current Text:
{current_text}

Certificate Type: {certificate_type}
Desired Tone: {tone}

Provide:
- Improved full text
- Specific wording suggestions
- Alternative phrasings
- Tone adjustments"""

            raw = use_llm(system, user)
            parsed = force_json(raw)
            if parsed:
                print(f"[AI RESPONSE] /ai/certificate/suggest OpenAI succeeded")
                return {"status": "ok", "data": parsed}
        except Exception as e:
            print('OpenAI certificate suggest failed:', e)

    # Fallback suggestions based on type
    suggestions = {
        'achievement': {
            'improved_text': 'This is to certify that [Recipient Name] has successfully completed [Achievement] with distinction and excellence.',
            'suggestions': [
                'Use more specific language about the achievement',
                'Add qualifying adjectives like "successfully" or "with distinction"',
                'Consider mentioning the significance of the achievement'
            ],
            'alternatives': [
                'Awarded to [Recipient] for outstanding performance in [Field]',
                '[Recipient] is hereby recognized for excellence in [Achievement]'
            ]
        },
        'participation': {
            'improved_text': 'This certificate recognizes [Recipient Name] for their active participation and valuable contribution to [Event/Activity].',
            'suggestions': [
                'Emphasize the value of participation',
                'Mention specific contributions if possible',
                'Use positive, encouraging language'
            ],
            'alternatives': [
                'Presented to [Recipient] in appreciation of their involvement in [Event]',
                '[Recipient] successfully participated in [Activity] and contributed meaningfully'
            ]
        },
        'completion': {
            'improved_text': 'This certifies that [Recipient Name] has satisfactorily completed all requirements for [Program/Course/Activity].',
            'suggestions': [
                'Specify what was completed',
                'Use formal certification language',
                'Include completion criteria if relevant'
            ],
            'alternatives': [
                '[Recipient] has fulfilled all obligations and completed [Program] successfully',
                'Awarded upon completion of [Course/Activity] to [Recipient]'
            ]
        }
    }

    fallback_suggestion = suggestions.get(certificate_type.lower(), suggestions['achievement'])
    resp = {"status": "ok", "data": fallback_suggestion}
    print(f"[AI RESPONSE] /ai/certificate/suggest fallback used for type: {certificate_type}")
    return resp

@app.post("/ai/certificate/autofill")
def ai_certificate_autofill(payload: dict):
    """Auto-fill certificate fields based on context and recipient information"""
    recipient_info = payload.get('recipient_info', {})
    event_context = payload.get('event_context', {})
    template_fields = payload.get('template_fields', [])

    try:
        print(f"[AI REQUEST] /ai/certificate/autofill recipient: {recipient_info.get('name', 'unknown')}")
    except Exception:
        print('[AI REQUEST] /ai/certificate/autofill payload (unprintable)')

    # Try OpenAI for intelligent auto-fill
    if client:
        try:
            system = 'You are an expert at filling certificate templates with appropriate information based on context.'
            user = f"""Auto-fill this certificate template:

Recipient Info: {json.dumps(recipient_info, ensure_ascii=False)}
Event Context: {json.dumps(event_context, ensure_ascii=False)}
Template Fields: {json.dumps(template_fields, ensure_ascii=False)}

Provide appropriate values for each field based on the context and recipient information."""

            raw = use_llm(system, user)
            parsed = force_json(raw)
            if parsed:
                print(f"[AI RESPONSE] /ai/certificate/autofill OpenAI succeeded")
                return {"status": "ok", "data": parsed}
        except Exception as e:
            print('OpenAI certificate autofill failed:', e)

    # Fallback auto-fill logic
    autofill_data = {}

    # Basic recipient information
    if 'name' in recipient_info:
        autofill_data['recipient_name'] = recipient_info['name']
        autofill_data['recipient_full_name'] = recipient_info.get('full_name', recipient_info['name'])

    # Date handling
    if 'date' in event_context:
        autofill_data['event_date'] = event_context['date']
        autofill_data['issue_date'] = event_context.get('issue_date', event_context['date'])

    # Event/achievement details
    if 'event_name' in event_context:
        autofill_data['event_name'] = event_context['event_name']
        autofill_data['achievement'] = f"participation in {event_context['event_name']}"

    if 'achievement' in recipient_info:
        autofill_data['achievement'] = recipient_info['achievement']

    # Organization details
    if 'organization' in event_context:
        autofill_data['organization'] = event_context['organization']
        autofill_data['issuer'] = event_context['organization']

    # Standard fields
    autofill_data['certificate_title'] = event_context.get('certificate_title', 'Certificate of Achievement')
    autofill_data['presented_by'] = event_context.get('presented_by', event_context.get('organization', 'Organization'))

    resp = {"status": "ok", "data": autofill_data}
    print(f"[AI RESPONSE] /ai/certificate/autofill fallback used, filled {len(autofill_data)} fields")
    return resp

class MagazineRequest(BaseModel):
    magTitle: str | None = None
    eventName: str
    rawData: str
    articleType: str
    magIssue: str

@app.post("/api/magazine/generate")
def generate_magazine(req: MagazineRequest):
    prompt = f"""Act as a professional Magazine Feature Writer and Editor for a college publication titled '{req.magTitle or 'The Campus Chronicle'}'.

Generate a concise 2-paragraph summary (first "thick" paragraph and second "thin" concluding paragraph), a 400-word feature article, two short photo captions, and one bold impactful pull-quote. Use an upbeat, encouraging, and professional tone. Include any raw facts provided below and adapt names/dates as given.

Event: {req.eventName}
Raw: {req.rawData}
Article type: {req.articleType}
Issue: {req.magIssue}

Format your output in JSON with keys: summary_thick, summary_thin, main_body, pull_quote, caption1, caption2.
"""

    raw = use_llm(prompt, f"Generate magazine content: {req.eventName}")
    parsed = force_json(raw)

    return parsed if parsed else {"error": "Invalid JSON", "raw": raw}

@app.get("/test")
def test():
    return {"message": "Server is working"}

@app.post("/test")
def test_post():
    return {"message": "POST works"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)
