# AI Event Architect - FastAPI Backend Server
# server.py - FastAPI server with AI endpoints for event planning

from fastapi import FastAPI, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from pathlib import Path
import json
import os
from datetime import datetime
import uuid
import tempfile
from shutil import move
try:
    # Load .env if present
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

# Optional OpenAI integration: use when OPENAI_API_KEY is set in env
OPENAI_KEY = os.getenv('OPENAI_API_KEY')
OPENAI_MODEL = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')
openai_client = None
if OPENAI_KEY:
    try:
        from openai import OpenAI
        openai_client = OpenAI(api_key=OPENAI_KEY)
        print("OpenAI client initialized successfully")
    except Exception as _e:
        print('OpenAI library not available or failed to initialize:', _e)

app = FastAPI(title="AI Event Architect API", version="1.0.0")

# Create router for event-planner API
event_planner_api = APIRouter()

# --- Static project mounting ---
# This server will automatically detect sibling project folders in the workspace
# root and mount any folder that contains an `index.html` under `/folder-name/`.
try:
    # `server.py` lives at: <workspace>/event-planner/backend/server.py
    # workspace root is two parents up from this file
    workspace_root = Path(__file__).resolve().parents[2]
    mounted = []
    for child in workspace_root.iterdir():
        if child.is_dir():
            index_html = child / 'index.html'
            if index_html.exists():
                mount_path = f"/{child.name}"
                app.mount(mount_path, StaticFiles(directory=str(child), html=True), name=child.name)
                mounted.append((child.name, mount_path + '/'))

    # Also provide a simple index listing the mounted projects
    @app.get('/', response_class=HTMLResponse)
    async def projects_index():
        links = ''.join([f'<li><a href="{path}">{name}</a></li>' for name, path in mounted])
        body = f"""
            <html>
            <head><title>AI Event Architect - Hosted Projects</title></head>
            <body>
                <h2>Hosted Projects</h2>
                <ul>
                    {links}
                </ul>
                <p>API docs available at <a href="/docs">/docs</a></p>
            </body>
            </html>
        """
        return HTMLResponse(content=body)
except Exception as e:
    # If mounting fails, continue with API-only behavior
    print('Warning: failed to auto-mount static projects:', e)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class EventBasics(BaseModel):
    name: str
    type: str
    date: Optional[str] = None
    attendees: Optional[int] = None
    duration: Optional[str] = None
    description: Optional[str] = None
    budget: Optional[str] = None
    venue: Optional[str] = None
    location: Optional[str] = None
    theme: Optional[str] = None

class BudgetRequest(BaseModel):
    basics: EventBasics
    current_budget: Optional[List[Dict[str, Any]]] = None

class VendorRequest(BaseModel):
    basics: EventBasics
    category: Optional[str] = None

class ScheduleRequest(BaseModel):
    basics: EventBasics
    current_schedule: Optional[List[Dict[str, Any]]] = None

class TaskRequest(BaseModel):
    basics: EventBasics
    current_tasks: Optional[List[Dict[str, Any]]] = None

class AIResponse(BaseModel):
    success: bool
    data: Dict[str, Any]
    message: str

# --- Simple JSON persistence for events ---
try:
    data_dir = workspace_root / 'event-planner' / 'data'
except NameError:
    # fallback: assume this file is in event-planner/backend
    data_dir = Path(__file__).resolve().parents[1] / 'data'

data_dir.mkdir(parents=True, exist_ok=True)
EVENTS_FILE = data_dir / 'events.json'

def load_events() -> Dict[str, Any]:
    if not EVENTS_FILE.exists():
        return {}
    try:
        with open(EVENTS_FILE, 'r', encoding='utf-8-sig') as f:
            return json.load(f)
    except Exception:
        return {}

def save_events(events: Dict[str, Any]):
    # Atomic write
    tmp = Path(tempfile.gettempdir()) / f"events_{uuid.uuid4().hex}.json"
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(events, f, indent=2, ensure_ascii=False)
    move(str(tmp), str(EVENTS_FILE))

# Initialize events store if missing
if not EVENTS_FILE.exists():
    save_events({})

# --- OpenAI helper: attempt to call and parse JSON output, otherwise return None ---
def _clean_assistant_json(text: str) -> str:
    t = text.strip()
    # remove triple backticks if present
    if t.startswith("```") and t.endswith("```"):
        # remove surrounding fences
        parts = t.split('\n', 1)
        if len(parts) > 1 and parts[0].startswith('```'):
            t = parts[1]
            if t.endswith('```'):
                t = t[:-3]
    # strip stray backticks
    return t.strip('`\n ')

def try_openai_json(messages, model=OPENAI_MODEL, max_tokens=2000):
    if not openai_client:
        return None
    try:
        response = openai_client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.2,
            max_tokens=max_tokens
        )
        content = response.choices[0].message.content
        content_clean = _clean_assistant_json(content)
        return json.loads(content_clean)
    except Exception as e:
        print('OpenAI JSON parsing failed:', e)
        return None

def openai_enhance_plan(basics: EventBasics, template_preview: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    # Build a prompt asking the model to return a JSON object matching the template keys
    system = {
        'role': 'system',
        'content': 'You are an expert event planner. When asked, return ONLY valid JSON matching the requested schema.'
    }
    user = {
        'role': 'user',
        'content': f"""
Enhance and expand the following event plan using the provided basic event information. Return a single JSON object with keys exactly matching the example.

Basics: {basics.dict()}

TemplateExample: {json.dumps(template_preview, ensure_ascii=False)}

Instructions:
- Return a JSON object with the same keys as the TemplateExample.
- Populate fields with concrete, helpful suggestions based on the Basics.
"""
    }
    return try_openai_json([system, user])

def openai_generate_component(component: str, basics: EventBasics, current_data: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
    system = {'role': 'system', 'content': 'You are an expert event planner. Return ONLY valid JSON for the requested component. Do not include any extra text, explanations, or markdown.'}
    user_content = f"Generate a {component} for the following event basics: {basics.dict()}."
    if current_data:
        user_content += f" Use the current data as context: {json.dumps(current_data, ensure_ascii=False)}"
    if component == 'budget':
        user_content += f""" The event budget range is: {basics.budget or 'Not specified'}.

CRITICAL INSTRUCTIONS FOR BUDGET GENERATION:
- You are an expert event planner AI. Read and analyze EVERY SINGLE DETAIL in the event basics provided above.
- Understand the event type, description, venue, location, theme, duration, attendees, and all other fields.
- Think deeply about what this specific event entails and what unique expenses it would have.
- DO NOT use any generic templates or predefined categories like "Venue", "Catering", "Entertainment", "Decorations", "Marketing", "Miscellaneous".
- Instead, create COMPLETELY CUSTOM categories based on the event's specific requirements.
- For example:
  * If it's a "Sangeet event in college ground with food stalls, entertainment games, gaming zones, halls, bedrooms", create categories like "Food Stall Rentals", "Gaming Equipment Setup", "Hall Sound System", "Bedroom Accommodation Setup", "Entertainment Game Rentals", etc.
  * If it's a "Tech conference with VR demos", create "VR Equipment Rental", "Demo Booth Setup", "Technical Support Staff", "Conference WiFi Upgrade", etc.
  * If it's a "Beach wedding", create "Beach Permits", "Sand Ceremony Setup", "Ocean View Photography", "Tropical Flower Arrangements", etc.
- Each category must be SPECIFIC to this event's unique features mentioned in the description and other fields.
- Analyze the description word by word and create budget items that directly correspond to the activities, locations, and requirements mentioned.
- Ensure the total budget fits within the specified range, and percentages add up to 100%.
- Make the budget realistic and comprehensive for this exact event.

Return JSON with total_budget (number) and budget_items (array of objects with category, name, amount, percentage, notes)."""
    elif component == 'schedule':
        user_content += f""" The event duration is: {basics.duration or 'Not specified'}. The event date is: {basics.date or 'Not specified'}.

CRITICAL INSTRUCTIONS FOR SCHEDULE GENERATION:
- You are an expert event planner AI. Read and analyze EVERY SINGLE DETAIL in the event basics provided above.
- Understand the event type, description, venue, location, theme, duration, attendees, date, and all other fields.
- Think deeply about what this specific event entails and what unique activities and timing it would have.
- DO NOT use any generic templates or predefined schedules like standard wedding/ceremony/reception or conference/registration/keynote/lunch.
- Instead, create COMPLETELY CUSTOM schedule items based on the event's specific requirements and activities mentioned.
- For example:
  * If it's a "Sangeet event in college ground with food stalls, entertainment games, gaming zones, halls, bedrooms", create items like "Food Stall Setup and Opening", "Gaming Zone Inauguration", "Hall Decoration and Sound Check", "Bedroom Guest Check-in", "Entertainment Games Kickoff", "Cultural Performances", "Food Stall Peak Hours Management", "Late Night Gaming Sessions", etc.
  * If it's a "Tech conference with VR demos", create "VR Demo Booth Setup", "Attendee Registration with Tech Check", "Opening Keynote on AI Trends", "VR Demo Sessions", "Networking Breaks with Tech Showcases", "Panel on Future Tech", "Closing Ceremony with Awards", etc.
  * If it's a "Beach wedding", create "Sunset Ceremony Setup", "Beach Guest Arrival and Seating", "Ocean View Vows Exchange", "Sand Ceremony Ritual", "Reception Under Tiki Torches", "Beach Bonfire Celebration", "Late Night Stargazing", etc.
- Each schedule item must be SPECIFIC to this event's unique features, activities, and requirements mentioned in the description and other fields.
- Analyze the description word by word and create schedule items that directly correspond to the activities, locations, and flow of the event.
- Consider the event duration and spread activities appropriately across the time frame.
- Include realistic time slots with start_time and end_time in HH:MM format (24-hour).
- Ensure the schedule flows logically from start to finish, with appropriate breaks and transitions.
- Make the schedule comprehensive and tailored to this exact event.

Return JSON with schedule_items (array of objects with title, start_time, end_time, description)."""
    user = {'role': 'user', 'content': user_content}
    return try_openai_json([system, user])

def extract_info_from_text(text: str) -> Dict[str, Any]:
    """Extract event information from natural language text"""
    extracted = {}
    text_lower = text.lower()

    # Extract attendees (numbers)
    import re
    numbers = re.findall(r'\b\d+\b', text)
    if numbers:
        # Take the largest number as attendees, assuming it's the main count
        extracted['attendees'] = max(int(n) for n in numbers)

    # Extract event type
    type_keywords = {
        'wedding': 'Wedding',
        'conference': 'Corporate Conference',
        'birthday': 'Birthday Party',
        'tech': 'Tech Conference',
        'music': 'Music Festival',
        'charity': 'Charity Gala',
        'college': 'College Event',
        'sangeet': 'Sangeet',
        'corporate': 'Corporate Conference',
        'party': 'Birthday Party',
        'festival': 'Music Festival',
        'gala': 'Charity Gala'
    }
    for keyword, event_type in type_keywords.items():
        if keyword in text_lower:
            extracted['type'] = event_type
            break

    # Extract name (try to find quoted names or capitalized phrases)
    quotes = re.findall(r'"([^"]*)"', text)
    if quotes:
        extracted['name'] = quotes[0]
    else:
        # Look for capitalized words at start
        words = text.split()
        if words and words[0][0].isupper():
            # Take first 3-4 words as potential name
            name_words = []
            for word in words[:4]:
                if word[0].isupper() or word.lower() in ['event', 'party', 'conference']:
                    name_words.append(word)
                else:
                    break
            if name_words:
                extracted['name'] = ' '.join(name_words)

    # Extract date (look for YYYY-MM-DD or month names)
    date_patterns = [
        r'\b\d{4}-\d{2}-\d{2}\b',  # YYYY-MM-DD
        r'\b\d{2}/\d{2}/\d{4}\b',  # MM/DD/YYYY
        r'\b\d{2}-\d{2}-\d{4}\b',  # MM-DD-YYYY
    ]
    for pattern in date_patterns:
        match = re.search(pattern, text)
        if match:
            extracted['date'] = match.group()
            break

    # Extract budget (look for $ amounts)
    budget_match = re.search(r'\$[\d,]+(?:\.\d{2})?', text)
    if budget_match:
        extracted['budget'] = budget_match.group()

    # Extract venue/location
    venue_indicators = ['at', 'in', 'venue', 'location', 'ground', 'hall']
    for indicator in venue_indicators:
        if indicator in text_lower:
            parts = text_lower.split(indicator, 1)
            if len(parts) > 1:
                venue_text = parts[1].strip().split()[0]  # Take first word after indicator
                if venue_text and len(venue_text) > 2:  # Avoid short words
                    extracted['venue'] = venue_text.title()
                    break

    print(f"[Extract] From '{text}' -> {extracted}")
    return extracted

def generate_budget_plan(request: BudgetRequest) -> Dict[str, Any]:
    """Generate AI-powered budget recommendations"""
    basics = request.basics
    attendee_count = basics.attendees if basics.attendees and basics.attendees > 0 else 50

    # Parse budget range from basics
    budget_range = basics.budget or ''
    target_total = None
    if budget_range:
        # Extract numbers from range like "$10,000 - $25,000"
        import re
        numbers = re.findall(r'\d+', budget_range.replace(',', ''))
        if len(numbers) >= 2:
            min_budget = int(numbers[0])
            max_budget = int(numbers[1])
            target_total = (min_budget + max_budget) // 2  # Use midpoint
        elif len(numbers) == 1:
            target_total = int(numbers[0])

    # Base costs per attendee by event type
    base_costs = {
        'wedding': {
            'venue': 150,
            'catering': 125,
            'photography': 75,
            'entertainment': 50,
            'decorations': 25,
            'attire': 20,
            'miscellaneous': 15
        },
        'corporate conference': {
            'venue': 200,
            'catering': 75,
            'av_equipment': 50,
            'speakers': 100,
            'marketing': 30,
            'miscellaneous': 20
        },
        'birthday party': {
            'venue': 20,
            'catering': 25,
            'entertainment': 15,
            'decorations': 10,
            'party_favors': 8,
            'cake': 5,
            'miscellaneous': 5
        },
        'general': {
            'venue': 50,
            'catering': 40,
            'entertainment': 20,
            'decorations': 15,
            'miscellaneous': 10
        }
    }

    costs = base_costs.get(basics.type.lower(), base_costs['general'])

    # Calculate initial total budget
    initial_total = sum(cost * attendee_count for cost in costs.values())

    # Adjust to target total if specified
    if target_total:
        if initial_total > 0:
            scale_factor = target_total / initial_total
            costs = {k: v * scale_factor for k, v in costs.items()}
        total_budget = target_total
    else:
        total_budget = initial_total

    # Generate budget items
    budget_items = []
    for category, cost_per_person in costs.items():
        amount = cost_per_person * attendee_count
        budget_items.append({
            'category': category.replace('_', ' ').title(),
            'name': f'{category.replace("_", " ").title()} Services',
            'amount': round(amount, 2),
            'percentage': round((amount / total_budget) * 100, 1) if total_budget > 0 else 0,
            'notes': f'Estimated cost for {attendee_count} attendees'
        })

    return {
        'total_budget': round(total_budget, 2),
        'budget_items': budget_items,
        'cost_breakdown': costs,
        'attendee_count': attendee_count,
        'budget_range_used': budget_range,
        'recommendations': [
            f'Budget planned within range: {budget_range}' if budget_range else f'Budget allocated based on {attendee_count} expected attendees',
            'Consider 10-15% contingency for unexpected expenses',
            'Review vendor quotes for actual pricing',
            'Track expenses throughout planning process'
        ]
    }

def generate_event_plan(basics: EventBasics) -> Dict[str, Any]:
    """Generate a comprehensive event plan based on basics"""
    event_type = basics.type.lower()

    # Base plan templates
    plans = {
        'wedding': {
            'objectives': [
                'Create unforgettable celebration for couple and guests',
                'Ensure smooth coordination of all wedding elements',
                'Capture memories through professional photography/videography',
                'Provide exceptional catering and entertainment'
            ],
            'key_considerations': [
                'Guest list management and RSVPs',
                'Ceremony and reception venue coordination',
                'Wedding party responsibilities',
                'Timeline management for wedding day',
                'Vendor coordination and contracts'
            ],
            'themes': ['Romantic Garden', 'Elegant Ballroom', 'Rustic Barn', 'Beach Wedding'],
            'estimated_budget_range': '$15000-$50000'
        },
        'corporate conference': {
            'objectives': [
                'Facilitate knowledge sharing and networking',
                'Showcase company innovations and products',
                'Build relationships with clients and partners',
                'Provide valuable learning opportunities'
            ],
            'key_considerations': [
                'Speaker lineup and session topics',
                'AV equipment and technical requirements',
                'Registration and attendee management',
                'Sponsorship opportunities',
                'Post-event follow-up and content sharing'
            ],
            'themes': ['Innovation Summit', 'Industry Leadership', 'Tech Conference', 'Business Growth'],
            'estimated_budget_range': '$25000-$100000'
        },
        'birthday party': {
            'objectives': [
                'Create fun and memorable celebration',
                'Ensure age-appropriate entertainment',
                'Capture special moments',
                'Provide delicious food and cake'
            ],
            'key_considerations': [
                'Age-appropriate activities and games',
                'Guest list and invitations',
                'Theme and decorations',
                'Food allergies and preferences',
                'Party favors and goody bags'
            ],
            'themes': ['Superhero Adventure', 'Princess Party', 'Space Explorer', 'Under the Sea'],
            'estimated_budget_range': '$500-$2000'
        },
        'general': {
            'objectives': [
                'Create engaging and successful event',
                'Ensure positive attendee experience',
                'Achieve event goals and objectives',
                'Stay within budget constraints'
            ],
            'key_considerations': [
                'Clear event purpose and goals',
                'Target audience understanding',
                'Venue selection and logistics',
                'Marketing and promotion',
                'Event execution and follow-up'
            ],
            'themes': ['Professional', 'Casual', 'Creative', 'Traditional'],
            'estimated_budget_range': '$1000-$10000'
        }
    }

    plan = plans.get(event_type, plans['general'])

    return {
        'event_name': basics.name,
        'event_type': basics.type,
        'objectives': plan['objectives'],
        'key_considerations': plan['key_considerations'],
        'recommended_themes': plan['themes'],
        'estimated_budget_range': plan['estimated_budget_range'],
        'attendee_count': basics.attendees or 50,
        'suggested_duration': basics.duration or '4-6 hours',
        'planning_timeline': [
            '1-2 months out: Secure venue and key vendors',
            '1 month out: Finalize guest list and send invitations',
            '2 weeks out: Confirm all arrangements and logistics',
            '1 week out: Final headcount and last-minute preparations',
            'Day of: Execute plan and enjoy the event!'
        ]
    }

def generate_vendor_recommendations(request: VendorRequest) -> Dict[str, Any]:
    """Generate AI vendor recommendations"""
    basics = request.basics
    event_type = basics.type.lower()

    # Mock vendor database
    vendors_db = {
        'wedding': {
            'venue': [
                {'name': 'Grand Ballroom', 'rating': 4.8, 'price_range': '$5000-$15000', 'contact': 'info@grandballroom.com'},
                {'name': 'Garden Estate', 'rating': 4.7, 'price_range': '$8000-$20000', 'contact': 'events@gardenestate.com'}
            ],
            'catering': [
                {'name': 'Elegant Cuisine', 'rating': 4.9, 'price_range': '$75-$150/person', 'contact': 'bookings@elegantcuisine.com'},
                {'name': 'Gourmet Catering', 'rating': 4.8, 'price_range': '$85-$160/person', 'contact': 'info@gourmetcatering.com'}
            ],
            'photography': [
                {'name': 'Forever Moments', 'rating': 4.7, 'price_range': '$2000-$5000', 'contact': 'hello@forevermoments.com'},
                {'name': 'Memory Captures', 'rating': 4.6, 'price_range': '$1800-$4500', 'contact': 'book@memorycaptures.com'}
            ]
        },
        'corporate conference': {
            'venue': [
                {'name': 'Tech Conference Center', 'rating': 4.7, 'price_range': '$3000-$8000', 'contact': 'events@techcenter.com'},
                {'name': 'Business Plaza', 'rating': 4.5, 'price_range': '$2500-$6000', 'contact': 'rentals@businessplaza.com'}
            ],
            'catering': [
                {'name': 'Corporate Catering Co', 'rating': 4.8, 'price_range': '$45-$85/person', 'contact': 'corporate@catco.com'},
                {'name': 'Executive Dining', 'rating': 4.6, 'price_range': '$50-$90/person', 'contact': 'events@executivedining.com'}
            ],
            'av_equipment': [
                {'name': 'Pro AV Solutions', 'rating': 4.6, 'price_range': '$1000-$3000', 'contact': 'rentals@proav.com'},
                {'name': 'Tech Presentations', 'rating': 4.5, 'price_range': '$800-$2500', 'contact': 'info@techpresentations.com'}
            ]
        },
        'birthday party': {
            'venue': [
                {'name': 'Fun Zone Party Center', 'rating': 4.4, 'price_range': '$500-$1500', 'contact': 'parties@funzone.com'},
                {'name': 'Adventure Park', 'rating': 4.3, 'price_range': '$300-$1000', 'contact': 'events@adventurepark.com'}
            ],
            'catering': [
                {'name': 'Kids Cuisine', 'rating': 4.6, 'price_range': '$15-$35/person', 'contact': 'orders@kidscuisine.com'},
                {'name': 'Party Foods R Us', 'rating': 4.4, 'price_range': '$12-$30/person', 'contact': 'catering@partyfoodsrus.com'}
            ],
            'entertainment': [
                {'name': 'Magic Mike Entertainment', 'rating': 4.8, 'price_range': '$300-$600', 'contact': 'book@magicmike.com'},
                {'name': 'Party Animators', 'rating': 4.5, 'price_range': '$250-$500', 'contact': 'fun@partyanimators.com'}
            ]
        }
    }

    vendors = vendors_db.get(event_type, {})

    # If specific category requested, filter by category
    if request.category and request.category in vendors:
        vendors = {request.category: vendors[request.category]}

    # Format vendor recommendations
    recommendations = []
    for category, vendor_list in vendors.items():
        for vendor in vendor_list:
            recommendations.append({
                'category': category.title(),
                'name': vendor['name'],
                'type': f'{category.title()} Services',
                'rating': vendor['rating'],
                'price_range': vendor['price_range'],
                'contact': vendor['contact'],
                'phone': '(555) 123-4567',  # Mock phone
                'status': 'pending',
                'notes': f'Recommended {category} vendor for {basics.type} events'
            })

    return {
        'event_type': basics.type,
        'vendor_recommendations': recommendations,
        'total_recommendations': len(recommendations),
        'categories_covered': list(vendors.keys()),
        'recommendation_notes': [
            'Vendors selected based on event type and positive reviews',
            'Contact vendors directly to check availability and get quotes',
            'Consider location and transportation logistics',
            'Read reviews and check references before booking'
        ]
    }

def generate_schedule_plan(request: ScheduleRequest) -> Dict[str, Any]:
    """Generate AI-powered schedule recommendations"""
    basics = request.basics
    event_type = basics.type.lower()

    # Base schedule templates
    schedules = {
        'wedding': [
            {'title': 'Ceremony', 'start_time': '16:00', 'end_time': '17:00', 'description': 'Wedding ceremony and vows'},
            {'title': 'Cocktail Hour', 'start_time': '17:00', 'end_time': '18:00', 'description': 'Drinks and appetizers'},
            {'title': 'Reception', 'start_time': '18:00', 'end_time': '22:00', 'description': 'Dinner, dancing, and celebration'}
        ],
        'corporate conference': [
            {'title': 'Registration', 'start_time': '08:00', 'end_time': '09:00', 'description': 'Check-in and networking'},
            {'title': 'Opening Keynote', 'start_time': '09:00', 'end_time': '10:00', 'description': 'Welcome and agenda'},
            {'title': 'Sessions', 'start_time': '10:00', 'end_time': '12:00', 'description': 'Main presentations'},
            {'title': 'Lunch', 'start_time': '12:00', 'end_time': '13:00', 'description': 'Networking lunch'},
            {'title': 'Afternoon Sessions', 'start_time': '13:00', 'end_time': '16:00', 'description': 'Workshops and panels'},
            {'title': 'Closing', 'start_time': '16:00', 'end_time': '17:00', 'description': 'Wrap-up and next steps'}
        ],
        'birthday party': [
            {'title': 'Arrival & Games', 'start_time': '14:00', 'end_time': '16:00', 'description': 'Welcome and activities'},
            {'title': 'Cake Cutting', 'start_time': '16:00', 'end_time': '17:00', 'description': 'Birthday celebration'},
            {'title': 'Party Time', 'start_time': '17:00', 'end_time': '19:00', 'description': 'Games and fun'}
        ],
        'general': [
            {'title': 'Setup', 'start_time': '08:00', 'end_time': '09:00', 'description': 'Final preparations'},
            {'title': 'Welcome', 'start_time': '09:00', 'end_time': '10:00', 'description': 'Opening ceremony'},
            {'title': 'Main Activities', 'start_time': '10:00', 'end_time': '16:00', 'description': 'Event activities'},
            {'title': 'Break', 'start_time': '16:00', 'end_time': '17:00', 'description': 'Refreshments'},
            {'title': 'Closing', 'start_time': '17:00', 'end_time': '18:00', 'description': 'Wrap-up'}
        ]
    }

    schedule_items = schedules.get(event_type, schedules['general'])

    return {
        'event_type': basics.type,
        'schedule_items': schedule_items,
        'total_items': len(schedule_items),
        'estimated_duration': basics.duration or '4-6 hours',
        'schedule_notes': [
            'Schedule is flexible and can be adjusted based on specific needs',
            'Allow buffer time between activities for transitions',
            'Consider guest arrival patterns when setting start times',
            'Include contingency time for unexpected delays'
        ]
    }

def generate_task_list(request: TaskRequest) -> Dict[str, Any]:
    """Generate AI-powered task recommendations"""
    basics = request.basics
    event_type = basics.type.lower()

    # Base task templates by category
    task_templates = {
        'wedding': {
            'Planning': [
                'Book venue and date',
                'Send save-the-dates',
                'Choose wedding party',
                'Select wedding attire',
                'Book photographer/videographer',
                'Choose florist and flowers',
                'Select wedding cake',
                'Book caterer',
                'Choose music/DJ',
                'Send invitations'
            ],
            'Day-of': [
                'Setup ceremony decorations',
                'Setup reception decorations',
                'Coordinate with vendors',
                'Manage timeline',
                'Take photos',
                'Serve food and drinks',
                'Cut the cake',
                'First dance',
                'Bouquet toss',
                'Send-off'
            ]
        },
        'corporate conference': {
            'Planning': [
                'Book conference venue',
                'Create agenda and schedule',
                'Book keynote speakers',
                'Arrange catering',
                'Setup registration system',
                'Book AV equipment',
                'Create marketing materials',
                'Arrange transportation',
                'Book accommodation blocks',
                'Setup networking events'
            ],
            'Logistics': [
                'Setup registration desk',
                'Welcome attendees',
                'Manage sessions',
                'Coordinate breaks',
                'Handle AV issues',
                'Facilitate networking',
                'Collect feedback',
                'Wrap-up and thank you'
            ]
        },
        'birthday party': {
            'Planning': [
                'Choose theme and decorations',
                'Send invitations',
                'Book venue',
                'Order cake',
                'Plan games and activities',
                'Arrange food and drinks',
                'Buy party favors',
                'Plan entertainment'
            ],
            'Day-of': [
                'Setup decorations',
                'Welcome guests',
                'Organize games',
                'Serve food',
                'Cut the cake',
                'Open presents',
                'Clean up'
            ]
        },
        'general': {
            'Planning': [
                'Define event objectives',
                'Set budget',
                'Choose date and venue',
                'Create guest list',
                'Send invitations',
                'Arrange catering',
                'Plan activities',
                'Book entertainment'
            ],
            'Execution': [
                'Setup venue',
                'Welcome guests',
                'Manage activities',
                'Serve food/drinks',
                'Coordinate vendors',
                'Take photos',
                'Clean up'
            ]
        }
    }

    templates = task_templates.get(event_type, task_templates['general'])

    # Generate task list
    tasks = []
    for category, task_list in templates.items():
        for task in task_list:
            tasks.append({
                'title': task,
                'category': category,
                'completed': False,
                'priority': 'medium'
            })

    return {
        'event_type': basics.type,
        'task_list': tasks,
        'total_tasks': len(tasks),
        'categories': list(templates.keys()),
        'task_notes': [
            'Tasks are organized by planning phase and priority',
            'Mark tasks complete as you finish them',
            'Set reminders for time-sensitive tasks',
            'Delegate tasks to team members when possible'
        ]
    }

# API Endpoints
@app.get("/api-root")
async def root():
    return {"message": "AI Event Architect API", "version": "1.0.0"}

@event_planner_api.post("/ai/plan", response_model=AIResponse)
async def generate_plan(basics: EventBasics):
    """Generate comprehensive event plan"""
    try:
        print(f"[AI Plan] Received basics: {basics.dict()}")

        # Extract information from description if provided
        extracted = extract_info_from_text(basics.description or '')
        print(f"[AI Plan] Extracted info: {extracted}")

        # Merge extracted info with provided basics
        merged_basics = basics.dict()
        for key, value in extracted.items():
            if key in merged_basics and (merged_basics[key] is None or merged_basics[key] == ''):
                merged_basics[key] = value
        basics = EventBasics(**merged_basics)
        print(f"[AI Plan] Merged basics: {basics.dict()}")

        # Determine missing fields from the basics provided
        required = ['name', 'type', 'date', 'attendees']
        missing = [f for f in required if not getattr(basics, f, None)]
        print(f"[AI Plan] Missing fields: {missing}")

        # Generate a preview plan (using template-based generator for now)
        preview = generate_event_plan(basics)
        print(f"[AI Plan] Generated template preview: {preview}")

        # If OpenAI key present, attempt to enhance the preview via the model
        try:
            if OPENAI_KEY:
                print("[AI Plan] Attempting OpenAI enhancement")
                ai_preview = openai_enhance_plan(basics, preview)
                if ai_preview:
                    preview = ai_preview
                    print("[AI Plan] OpenAI enhancement succeeded")
                else:
                    print("[AI Plan] OpenAI enhancement returned None")
            else:
                print("[AI Plan] No OpenAI key, using template")
        except Exception as e:
            print(f"[AI Plan] OpenAI enhancement failed: {e}")
            # if anything goes wrong, continue with the template preview
            pass

        # Create follow-up questions only for missing fields
        question_map = {
            'name': 'What is the event name?',
            'type': 'What type of event is this? (e.g., Wedding, Corporate Conference, Birthday Party, Tech Conference, Music Festival, Charity Gala, College Event, Other)',
            'date': 'What is the event date? (YYYY-MM-DD)',
            'attendees': 'How many attendees do you expect?'
        }
        questions = [{ 'field': m, 'question': question_map.get(m, f'Please provide {m}') } for m in missing]
        print(f"[AI Plan] Questions: {questions}")

        response = AIResponse(
            success=True,
            data={
                'preview': preview,
                'missing_fields': missing,
                'questions': questions,
            },
            message="Plan preview generated; answer follow-up questions to complete the plan"
        )
        print(f"[AI Plan] Response: {response.dict()}")
        return response
    except Exception as e:
        print(f"[AI Plan] Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Plan generation failed: {str(e)}")


# ----------------- Event CRUD and per-event generation -----------------
class CreateEventRequest(BaseModel):
    basics: EventBasics
    preview: Optional[Dict[str, Any]] = None


@event_planner_api.get('/events')
async def list_events():
    events = load_events()
    # return list of events (id + basics)
    out = []
    for eid, ev in events.items():
        out.append({ 'id': eid, 'basics': ev.get('basics', {}), 'preview': ev.get('preview', {}) })
    return {'count': len(out), 'events': out}


@event_planner_api.post('/events')
async def create_event(req: CreateEventRequest):
    events = load_events()
    event_id = uuid.uuid4().hex
    events[event_id] = {
        'id': event_id,
        'basics': req.basics.dict(),
        'preview': req.preview or {},
        'components': {},
        'created_at': datetime.utcnow().isoformat()
    }
    save_events(events)
    return {'id': event_id, 'event': events[event_id]}


@event_planner_api.get('/events/{event_id}')
async def get_event(event_id: str):
    events = load_events()
    if event_id not in events:
        raise HTTPException(status_code=404, detail='Event not found')
    return events[event_id]


@event_planner_api.put('/events/{event_id}')
async def update_event(event_id: str, req: CreateEventRequest):
    events = load_events()
    if event_id not in events:
        raise HTTPException(status_code=404, detail='Event not found')
    events[event_id]['basics'] = req.basics.dict()
    if req.preview:
        events[event_id]['preview'] = req.preview
    events[event_id]['updated_at'] = datetime.utcnow().isoformat()
    save_events(events)
    return events[event_id]


@event_planner_api.post('/events/{event_id}/generate/{component}')
async def generate_component(event_id: str, component: str):
    """Generate or regenerate a component for a stored event.
    component: one of 'budget','schedule','tasks','vendors'"""
    events = load_events()
    if event_id not in events:
        raise HTTPException(status_code=404, detail='Event not found')

    basics = EventBasics(**events[event_id]['basics'])

    try:
        if component == 'budget':
            req = BudgetRequest(basics=basics, current_budget=events[event_id].get('components', {}).get('budget', {}).get('budget_items'))
            result = generate_budget_plan(req)
        elif component == 'schedule':
            req = ScheduleRequest(basics=basics, current_schedule=events[event_id].get('components', {}).get('schedule', {}).get('schedule_items'))
            result = generate_schedule_plan(req)
        elif component == 'tasks':
            req = TaskRequest(basics=basics, current_tasks=events[event_id].get('components', {}).get('tasks', {}).get('task_list'))
            result = generate_task_list(req)
        elif component == 'vendors':
            req = VendorRequest(basics=basics)
            result = generate_vendor_recommendations(req)
        else:
            raise HTTPException(status_code=400, detail='Unknown component')

        # Attempt to call OpenAI for more tailored component output; fall back to template result
        try:
            if OPENAI_KEY:
                print(f'[AI] Attempting OpenAI for {component} generation with basics: {basics.dict()}')
                current_component_data = events[event_id].get('components', {}).get(component)
                ai_result = openai_generate_component(component, basics, current_component_data)
                if ai_result:
                    print(f'[AI] OpenAI succeeded for {component}, keys: {list(ai_result.keys())}, categories: {[item.get("category", "") for item in ai_result.get("budget_items", [])] if component == "budget" else [item.get("title", "") for item in ai_result.get("schedule_items", [])] if component == "schedule" else "N/A"}')
                    result = ai_result
                else:
                    print(f'[AI] OpenAI returned None for {component}, using template')
            else:
                print(f'[AI] No OpenAI key set, using template for {component}')
        except Exception as e:
            print(f'[AI] Exception in OpenAI call for {component}: {e}, using template')

        # store component under event
        events[event_id].setdefault('components', {})[component] = result
        events[event_id]['updated_at'] = datetime.utcnow().isoformat()
        save_events(events)

        return AIResponse(success=True, data=result, message=f"{component} generated and saved for event {event_id}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Component generation failed: {str(e)}")

@event_planner_api.post("/ai/budget", response_model=AIResponse)
async def generate_budget(request: BudgetRequest):
    """Generate AI-powered budget recommendations"""
    try:
        budget_plan = generate_budget_plan(request)
        return AIResponse(
            success=True,
            data=budget_plan,
            message="Budget plan generated successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Budget generation failed: {str(e)}")

@event_planner_api.post("/ai/vendors", response_model=AIResponse)
async def generate_vendors(request: VendorRequest):
    """Generate vendor recommendations"""
    try:
        vendor_recommendations = generate_vendor_recommendations(request)
        return AIResponse(
            success=True,
            data=vendor_recommendations,
            message="Vendor recommendations generated successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vendor recommendations failed: {str(e)}")

@event_planner_api.post("/ai/schedule", response_model=AIResponse)
async def generate_schedule(request: ScheduleRequest):
    """Generate event schedule"""
    try:
        schedule_plan = generate_schedule_plan(request)
        return AIResponse(
            success=True,
            data=schedule_plan,
            message="Schedule generated successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Schedule generation failed: {str(e)}")

@event_planner_api.post("/ai/tasks", response_model=AIResponse)
async def generate_tasks(request: TaskRequest):
    """Generate task checklist"""
    try:
        task_list = generate_task_list(request)
        return AIResponse(
            success=True,
            data=task_list,
            message="Task list generated successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Task generation failed: {str(e)}")

# Health check endpoint
@event_planner_api.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Include the event planner API router
app.include_router(event_planner_api)

if __name__ == "__main__":
    import uvicorn
    import sys
    port = int(os.getenv('PORT', '8000'))
    host = os.getenv('HOST', '0.0.0.0')
    uvicorn.run(app, host=host, port=port)