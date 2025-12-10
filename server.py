import os
import json
import re
import io
import time
import random
import importlib.util
from pathlib import Path
from datetime import datetime, timedelta

from fastapi import FastAPI, HTTPException, UploadFile, File, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, RedirectResponse
from pydantic import BaseModel

try:
    from openai import OpenAI
except Exception:
    OpenAI = None

try:
    import PyPDF2
except Exception:
    PyPDF2 = None

try:
    import pytesseract
    from PIL import Image
except Exception:
    pytesseract = None
    Image = None

ROOT = Path(__file__).resolve().parent
app = FastAPI(title="Creative Studio API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

mounted_projects: list[tuple[str, str]] = []
client = None  # Will initialise after loading environment variables


# Mount core static asset folders (css/js/assets) so dashboard requests resolve
STATIC_FOLDERS: list[tuple[str, Path]] = [
    ("/css", ROOT / "css"),
    ("/js", ROOT / "js"),
    ("/assets", ROOT / "assets"),
]

for mount_path, directory in STATIC_FOLDERS:
    if directory.exists():
        app.mount(mount_path, StaticFiles(directory=str(directory)), name=mount_path.strip("/"))



@app.get("/auth/login.html")
async def serve_login_html():
    auth_dir = ROOT / "auth"
    file_path = auth_dir / "login.html"
    if file_path.exists():
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return HTMLResponse(content=content)
    raise HTTPException(status_code=404, detail="Login page not found")


_rewriter_module = None


def get_rewriter_module():
    """Lazy-load the optional rewriter.py helper if available."""
    global _rewriter_module
    if _rewriter_module is not None:
        return _rewriter_module

    rewriter_path = ROOT / "rewriter.py"
    if not rewriter_path.exists():
        return None

    try:
        spec = importlib.util.spec_from_file_location("creative_rewriter", rewriter_path)
        if spec and spec.loader:
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            _rewriter_module = module
            return module
    except Exception as exc:
        print("Failed to load rewriter module:", exc)

    _rewriter_module = None
    return None

@app.get("/auth/login.css")
async def serve_login_css():
    auth_dir = ROOT / "auth"
    file_path = auth_dir / "login.css"
    if file_path.exists():
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return HTMLResponse(content=content, media_type="text/css")
    raise HTTPException(status_code=404, detail="Login CSS not found")

@app.get("/auth/login.js")
async def serve_login_js():
    auth_dir = ROOT / "auth"
    file_path = auth_dir / "login.js"
    if file_path.exists():
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return HTMLResponse(content=content, media_type="application/javascript")
    raise HTTPException(status_code=404, detail="Login JS not found")

@app.get('/', response_class=HTMLResponse)
async def root_index(request: Request):
    # Check if user is authenticated
    cookies = request.cookies
    if "session" in cookies and cookies["session"] == "true":
        # Serve dashboard for authenticated users
        index_path = ROOT / "index.html"
        if index_path.exists():
            with open(index_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return HTMLResponse(content=content)
        else:
            return HTMLResponse(content="<h1>Dashboard not found</h1>")
    else:
        # Redirect to login page for unauthenticated users
        return RedirectResponse(url="/auth/login.html", status_code=302)

@app.get('/index.html', response_class=HTMLResponse)
async def serve_index_html(request: Request):
    # Check if user is authenticated
    cookies = request.cookies
    if "session" in cookies and cookies["session"] == "true":
        # Serve dashboard for authenticated users
        index_path = ROOT / "index.html"
        if index_path.exists():
            with open(index_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return HTMLResponse(content=content)
        else:
            return HTMLResponse(content="<h1>Dashboard not found</h1>")
    else:
        # Redirect to login page for unauthenticated users
        return RedirectResponse(url="/auth/login.html", status_code=302)

# Middleware to check authentication for protected routes
@app.middleware("http")
async def auth_middleware(request, call_next):
    # Allow access to auth routes and static files
    if (request.url.path.startswith("/auth") or
        request.url.path.startswith("/css") or
        request.url.path.startswith("/js") or
        request.url.path.startswith("/assets") or
        request.url.path in ["/", "/index.html", "/docs", "/openapi.json", "/sw.js", "/favicon.ico"] or
        request.url.path.startswith("/.well-known")):
        response = await call_next(request)
        return response

    # For all other routes, check if user is authenticated
    # Simple cookie check (in production, use proper JWT/session management)
    cookies = request.cookies
    if "session" not in cookies or cookies["session"] != "true":
        # Redirect to login page
        return RedirectResponse(url="/auth/login.html", status_code=302)

    response = await call_next(request)
    return response

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

# Handle Chrome DevTools well-known probe to avoid noisy 404s
@app.get("/.well-known/appspecific/com.chrome.devtools.json")
async def serve_chrome_devtools_probe():
    return HTMLResponse(content="{}", media_type="application/json")

# Auto-mount frontend folders (any folder or immediate subfolder with index.html)
for child in ROOT.iterdir():
    if child.is_dir():
        # Mount folder if it has index.html
        index_file = child / 'index.html'
        if index_file.exists():
            mount_path = f"/{child.name}"
            app.mount(mount_path, StaticFiles(directory=str(child), html=True), name=f"static_{child.name}")
            mounted_projects.append((child.name, mount_path + '/'))
            print(f"Mounted {child.name} at {mount_path}/")

        # Also check immediate subfolders (e.g., mindmap-ai/frontend/index.html)
        for sub in child.iterdir():
            if sub.is_dir():
                sub_index = sub / 'index.html'
                if sub_index.exists():
                    sub_mount_path = f"/{child.name}/{sub.name}"
                    app.mount(sub_mount_path, StaticFiles(directory=str(sub), html=True), name=f"static_{child.name}_{sub.name}")
                    mounted_projects.append((f"{child.name}/{sub.name}", sub_mount_path + '/'))
                    print(f"Mounted {child.name}/{sub.name} at {sub_mount_path}/")

# Mount certificate generator static files (support both space and hyphen folder names)
CERT_DIR = None
if (ROOT / "certificate generator").exists():
    CERT_DIR = ROOT / "certificate generator"
elif (ROOT / "certificate-generator").exists():
    CERT_DIR = ROOT / "certificate-generator"

if CERT_DIR:
    # Optional subfolders (css/js/templates) if present
    if (CERT_DIR / "css").exists():
        app.mount("/certificate-css", StaticFiles(directory=str(CERT_DIR / "css")), name="certificate_css")
    if (CERT_DIR / "js").exists():
        app.mount("/certificate-js", StaticFiles(directory=str(CERT_DIR / "js")), name="certificate_js")
    if (CERT_DIR / "templates").exists():
        app.mount("/certificate-templates", StaticFiles(directory=str(CERT_DIR / "templates")), name="certificate_templates")

    # Mount the entire folder for direct access to HTML and assets
    try:
        # Encoded space path (kept for backward compatibility)
        app.mount("/certificate%20generator", StaticFiles(directory=str(CERT_DIR), html=True), name="certificate_generator_encoded")
        # Hyphen alias
        app.mount("/certificate-generator", StaticFiles(directory=str(CERT_DIR), html=True), name="certificate_generator_alias")
        print(f"Mounted Certificate Generator from {CERT_DIR} at /certificate%20generator/ and /certificate-generator/")
    except Exception as e:
        print("Failed to mount Certificate Generator folder:", e)

    # Explicit asset routes for files at root (not under css/js folders)
    @app.get('/certificate-css/certificate.css')
    async def serve_cert_root_css():
        path = CERT_DIR / 'certificate.css'
        if path.exists():
            with open(path, 'r', encoding='utf-8') as f:
                return HTMLResponse(f.read(), media_type='text/css')
        raise HTTPException(status_code=404, detail='certificate.css not found')

    @app.get('/certificate-js/{name}.js')
    async def serve_cert_root_js(name: str):
        # Allow certificate.js, ai-hooks.js, export.js located at the folder root
        path = CERT_DIR / f'{name}.js'
        if path.exists():
            with open(path, 'r', encoding='utf-8') as f:
                return HTMLResponse(f.read(), media_type='application/javascript')
        raise HTTPException(status_code=404, detail=f'{name}.js not found')

# Mount Event Planner Backend as sub-app (includes mindmap API)
try:
    # Import the event-planner backend app and its mindmap API
    event_planner_path = ROOT / "event-planner" / "backend" / "server.py"
    if event_planner_path.exists():
        spec = importlib.util.spec_from_file_location("event_planner_server", event_planner_path)
        event_planner_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(event_planner_module)
        event_planner_app = event_planner_module.app
        mindmap_api = event_planner_module.mindmap_api

        # Mount the event-planner backend at /api/event-planner
        app.mount("/api/event-planner", event_planner_app, name="event_planner_api")
        print("Mounted Event Planner Backend at /api/event-planner/")

        # Include mindmap API directly in main app at /api/mindmap
        app.include_router(mindmap_api, prefix="/api/mindmap", tags=["mindmap"])
        print("Mounted Mindmap API at /api/mindmap/")
    else:
        print("Event Planner Backend not found at expected location")
except Exception as e:
    print(f"Failed to mount Event Planner Backend: {e}")
    # Fallback: try to define basic mindmap endpoints
    try:
        from fastapi import APIRouter
        from pydantic import BaseModel
        from typing import Dict

        fallback_mindmap_api = APIRouter()

        class MindmapClassifyRequest(BaseModel):
            text: str

        @fallback_mindmap_api.get('/health')
        async def fallback_mindmap_health():
            return {"status": "fallback mode", "message": "Event planner backend not available"}

        @fallback_mindmap_api.post('/classify')
        async def fallback_mindmap_classify(req: MindmapClassifyRequest):
            if not req.text or not req.text.strip():
                raise HTTPException(status_code=400, detail='text is required')
            # Simple fallback implementation
            tokens = [t.strip('.,;:!?').lower() for t in req.text.split() if len(t) > 4]
            freq: Dict[str, int] = {}
            for t in tokens:
                freq[t] = freq.get(t, 0) + 1
            topics = sorted(freq.keys(), key=lambda k: freq[k], reverse=True)[:5]
            return {"success": True, "data": {"topics": topics}}

        app.include_router(fallback_mindmap_api, prefix="/api/mindmap", tags=["mindmap"])
        print("Using fallback Mindmap API implementation")
    except Exception as fallback_e:
        print(f"Fallback mindmap API also failed: {fallback_e}")

# Serve individual HTML files from root or subdirectories
@app.get("/{html_file}.html")
async def serve_html(html_file: str):
    allowed_files = ["certificate", "magazine", "Mag", "todo"]
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

@app.get('/certificate', response_class=HTMLResponse)
async def serve_certificate():
    """Serve the certificate generator page"""
    cert_path = (CERT_DIR or (ROOT / "certificate generator")) / "certificate.html"
    if cert_path.exists():
        with open(cert_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return HTMLResponse(content=content)
    else:
        return HTMLResponse(content="<h1>Certificate Generator not found</h1><p>Please ensure the certificate generator is properly installed.</p>")

# Explicit path handler for folders with spaces
@app.get('/certificate%20generator/certificate.html', response_class=HTMLResponse)
async def serve_certificate_space_path():
    cert_path = (CERT_DIR or (ROOT / "certificate generator")) / "certificate.html"
    if cert_path.exists():
        with open(cert_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return HTMLResponse(content=content)
    raise HTTPException(status_code=404, detail="Certificate Generator not found")

# Decoded space path (browsers may send decoded URL)
@app.get('/certificate generator/certificate.html', response_class=HTMLResponse)
async def serve_certificate_decoded_space_path():
    cert_path = (CERT_DIR or (ROOT / "certificate generator")) / "certificate.html"
    if cert_path.exists():
        with open(cert_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return HTMLResponse(content=content)
    raise HTTPException(status_code=404, detail="Certificate Generator not found")

# Fallback file server for Certificate Generator space-path
@app.get('/certificate%20generator/{file_path:path}')
async def serve_certificate_static_file(file_path: str):
    full_path = (CERT_DIR or (ROOT / 'certificate generator')) / file_path
    if not full_path.exists() or not full_path.is_file():
        raise HTTPException(status_code=404, detail='Asset not found')
    # Determine content type
    ext = full_path.suffix.lower()
    media = 'text/plain'
    if ext == '.css':
        media = 'text/css'
    elif ext == '.js':
        media = 'application/javascript'
    elif ext in ('.html', '.htm'):
        media = 'text/html'
    elif ext == '.json':
        media = 'application/json'
    elif ext in ('.png', '.jpg', '.jpeg', '.gif', '.svg'):
        media = {
            '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml'
        }[ext]
    with open(full_path, 'rb') as f:
        content = f.read()
    return HTMLResponse(content=content, media_type=media)

# Friendly alias without space
@app.get('/certificate-generator', response_class=HTMLResponse)
async def serve_certificate_alias():
    # Redirect to the canonical space path to keep links consistent
    return RedirectResponse(url="/certificate%20generator/certificate.html")

# Explicit asset handlers for Certificate Generator (encoded space path)
@app.get('/certificate%20generator/certificate.css')
async def serve_cert_css():
    path = (CERT_DIR or (ROOT / 'certificate generator')) / 'certificate.css'
    if path.exists():
        with open(path, 'r', encoding='utf-8') as f:
            return HTMLResponse(f.read(), media_type='text/css')
    raise HTTPException(status_code=404, detail='CSS not found')

@app.get('/certificate%20generator/ai-hooks.js')
async def serve_cert_ai_hooks():
    path = (CERT_DIR or (ROOT / 'certificate generator')) / 'ai-hooks.js'
    if path.exists():
        with open(path, 'r', encoding='utf-8') as f:
            return HTMLResponse(f.read(), media_type='application/javascript')
    raise HTTPException(status_code=404, detail='JS not found')

@app.get('/certificate%20generator/export.js')
async def serve_cert_export_js():
    path = (CERT_DIR or (ROOT / 'certificate generator')) / 'export.js'
    if path.exists():
        with open(path, 'r', encoding='utf-8') as f:
            return HTMLResponse(f.read(), media_type='application/javascript')
    raise HTTPException(status_code=404, detail='JS not found')

@app.get('/certificate%20generator/certificate.js')
async def serve_cert_js():
    path = (CERT_DIR or (ROOT / 'certificate generator')) / 'certificate.js'
    if path.exists():
        with open(path, 'r', encoding='utf-8') as f:
            return HTMLResponse(f.read(), media_type='application/javascript')
    raise HTTPException(status_code=404, detail='JS not found')

"""
Note:
There was a duplicate route definition for '/index.html'. The authoritative
handler (with authentication awareness) is defined earlier in the file.
To avoid routing conflicts and potential redirect loops, the duplicate
definition has been removed.
"""

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

# Root health endpoint for dashboard status checks
@app.get("/health")
async def root_health():
    return {"status": "healthy"}

# ============================================================
# Certificate Generator AI helper endpoints
# These power ai-hooks.js: /api/ai/suggest, /api/ai/autofill, /api/ai/design
# They are intentionally lightweight so the tool works even without
# external AI services.

class CertificateSuggestRequest(BaseModel):
    title: str | None = None
    subtitle: str | None = None
    description: str | None = None


@app.post("/api/ai/suggest")
async def api_ai_suggest(req: CertificateSuggestRequest):
    base_title = req.title.strip() if req.title else "Certificate of Achievement"
    return {
        "title": base_title or "Certificate of Achievement",
        "subtitle": "This certifies that",
        "description": req.description.strip() if req.description else "For outstanding performance and dedication.",
    }


class CertificateAutofillRequest(BaseModel):
    # We accept the full state but only use a few fields; keep it open-ended.
    # Using a generic dict here avoids mirroring the entire front-end schema.
    state: dict | None = None


@app.post("/api/ai/autofill")
async def api_ai_autofill(req: CertificateAutofillRequest):
    data = req.state or {}
    recipient = (
        data.get("recipient")
        or data.get("name")
        or data.get("student_name")
        or "Recipient Name"
    )
    return {
        "recipient": recipient,
        "date": os.getenv("CERTIFICATE_DEFAULT_DATE") or "" ,
        "signatureLabel": "Authorized Signature",
    }


class CertificateDesignRequest(BaseModel):
    state: dict | None = None


@app.post("/api/ai/design")
async def api_ai_design(req: CertificateDesignRequest):
    data = req.state or {}
    canvas = data.get("canvas", {})
    width = canvas.get("width", 2480)
    height = canvas.get("height", 1754)
    orientation = "landscape" if width >= height else "portrait"

    suggestions: list[str] = []
    suggestions.append("Use a bold, readable font for the recipient's name (e.g., 60–72px).")
    suggestions.append("Keep generous margins (40–60px) so the border has breathing room.")
    suggestions.append("Align the main title and recipient name centrally for balance.")
    if orientation == "landscape":
        suggestions.append("Landscape layout detected – place logos and seals in the corners.")
    else:
        suggestions.append("Portrait layout – use more vertical spacing between sections.")

    return {"suggestions": suggestions}

class AnalyzeTextRequest(BaseModel):
    text: str
    template: str | None = None

@app.post("/api/ai/analyze_text")
async def api_ai_analyze_text(req: AnalyzeTextRequest):
    text = req.text.strip()
    template = req.template
    if not text:
        raise HTTPException(status_code=400, detail="Text is empty")

    if client:
        try:
            theme_instruction = ""
            if template:
                if "corporate" in template.lower():
                    theme_instruction = "Use a formal, professional tone. Center-align titles and key sections. Use structured, business-like language."
                elif "modern" in template.lower():
                    theme_instruction = "Use a clean, minimal tone. Left-align text for a modern look. Keep it concise and contemporary."
                elif "academic" in template.lower():
                    theme_instruction = "Use formal academic language. Center-align titles, left-align body text. Include citations if relevant."
                elif "pastel" in template.lower():
                    theme_instruction = "Use a soft, elegant tone. Center-align for balance. Gentle and approachable language."
                else:
                    theme_instruction = "Adapt to a general professional theme with center-aligned titles."

            prompt = f"""
Analyze the following activity report text. Extract the main title and break it down into logical sections with headings and content.

{theme_instruction}

Text:
{text}

Respond in JSON format:
{{
  "title": "Main Title",
  "sections": [
    {{"heading": "Section Heading", "content": "Section content here."}},
    ...
  ]
}}
"""
            response = _chat_completion_with_retry(
                model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                messages=[{"role": "user", "content": prompt}],
                max_tokens=800,
                temperature=0.2
            )
            result_text = response.choices[0].message.content.strip()
            # Clean the response: remove markdown code blocks if present
            if result_text.startswith('```json'):
                result_text = result_text[7:]
            if result_text.endswith('```'):
                result_text = result_text[:-3]
            result_text = result_text.strip()
            # Try to parse as JSON
            try:
                result = json.loads(result_text)
                return result
            except json.JSONDecodeError as je:
                print(f"OpenAI response not valid JSON: {result_text} Error: {je}")
                # Fall back to simple parsing
        except Exception as e:
            print(f"OpenAI analysis failed: {e}")
            # Fall back to simple parsing

    # Fallback: Simple parsing
    lines = text.split('\n')
    sections = []
    current_heading = None
    current_content = []

    for line in lines:
        line = line.strip()
        if not line:
            continue
        # Assume lines starting with number or capital are headings
        if re.match(r'^\d+\.', line) or line.isupper() or (len(line) < 50 and not line.endswith('.')):
            if current_heading and current_content:
                sections.append({"heading": current_heading, "content": ' '.join(current_content)})
            current_heading = line
            current_content = []
        else:
            current_content.append(line)

    if current_heading and current_content:
        sections.append({"heading": current_heading, "content": ' '.join(current_content)})

    if not sections:
        sections = [{"heading": "Introduction", "content": text}]

    title = sections[0]["heading"] if sections else "Activity Report"

    return {
        "title": title,
        "sections": sections
    }

@app.post("/api/ai/analyze_document")
async def api_ai_analyze_document(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")

    # Extract text from file
    content = await file.read()
    filename = file.filename.lower()

    extracted_text = ""
    try:
        if filename.endswith('.pdf'):
            extracted_text = extract_text_from_pdf(content)
        elif filename.endswith(('.jpg', '.jpeg', '.png')):
            extracted_text = extract_text_from_image(content)
        else:
            # Assume text file or try as text
            try:
                extracted_text = content.decode('utf-8')
            except:
                raise HTTPException(status_code=400, detail="Unsupported file type")
    except Exception as e:
        print(f"Text extraction failed: {e}")
        raise HTTPException(status_code=400, detail="Failed to extract text from file")

    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="No text found in file")

    # Now analyze the extracted text with AI
    if client:
        try:
            prompt = f"""
Analyze the following activity report document text. Extract the main title, detect the layout structure (alignment, formatting), and break it down into logical sections with headings and content.

Document Text:
{extracted_text[:4000]}  # Limit to avoid token limits

Respond in JSON format:
{{
  "title": "Main Title",
  "layout": {{
    "alignment": "left|center|right",
    "hasHeader": true|false,
    "hasFooter": true|false,
    "fontStyle": "formal|casual|academic"
  }},
  "sections": [
    {{"heading": "Section Heading", "content": "Section content here."}},
    ...
  ]
}}
"""
            response = _chat_completion_with_retry(
                model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1200,
                temperature=0.2
            )
            result_text = response.choices[0].message.content.strip()
            # Clean the response
            if result_text.startswith('```json'):
                result_text = result_text[7:]
            if result_text.endswith('```'):
                result_text = result_text[:-3]
            result_text = result_text.strip()
            try:
                result = json.loads(result_text)
                return result
            except json.JSONDecodeError as je:
                print(f"OpenAI response not valid JSON: {result_text} Error: {je}")
        except Exception as e:
            print(f"OpenAI document analysis failed: {e}")

    # Fallback parsing
    lines = extracted_text.split('\n')
    sections = []
    current_heading = None
    current_content = []

    for line in lines:
        line = line.strip()
        if not line:
            continue
        if re.match(r'^\d+\.', line) or line.isupper() or (len(line) < 50 and not line.endswith('.')):
            if current_heading and current_content:
                sections.append({"heading": current_heading, "content": ' '.join(current_content)})
            current_heading = line
            current_content = []
        else:
            current_content.append(line)

    if current_heading and current_content:
        sections.append({"heading": current_heading, "content": ' '.join(current_content)})

    if not sections:
        sections = [{"heading": "Content", "content": extracted_text}]

    title = sections[0]["heading"] if sections else "Activity Report"

    return {
        "title": title,
        "layout": {
            "alignment": "left",
            "hasHeader": False,
            "hasFooter": False,
            "fontStyle": "formal"
        },
        "sections": sections
    }

def extract_text_from_pdf(content):
    if not PyPDF2:
        raise Exception("PyPDF2 not available")
    pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text() + "\n"
    return text

def extract_text_from_image(content):
    if not pytesseract or not Image:
        raise Exception("OCR libraries not available")
    image = Image.open(io.BytesIO(content))
    text = pytesseract.image_to_string(image)
    return text

# OpenAI client for mindmap (use environment variable; do not hardcode keys)
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print('Warning: OPENAI_API_KEY not set. OpenAI features will be disabled.')
    client = None
else:
    try:
        # Optional Gemini support
        import os
        client = OpenAI(api_key=api_key)
        # Masked log to confirm which key is loaded
        print("OpenAI client initialized (key suffix ...{}).".format(api_key[-6:]))
    except Exception as e:
        print('OpenAI client import/initialization failed:', e)
        client = None

# Simple retry wrapper for OpenAI rate limits / transient errors
def _chat_completion_with_retry(model, messages, max_tokens=None, temperature=0, retries=3):
    if client is None:
        raise RuntimeError("openai_client_missing")
    delay = 1.0
    last_exc = None
    for _ in range(retries):
        try:
            return client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature
            )
        except Exception as e:
            s = str(e).lower()
            # Retry on common transient issues including 429
            if ('rate limit' in s) or ('429' in s) or ('temporarily unavailable' in s) or ('timeout' in s) or ('overloaded' in s):
                last_exc = e
                time.sleep(delay + random.random() * 0.5)
                delay = min(delay * 2, 8.0)
                continue
            raise
    # Exhausted retries
    if last_exc:
        raise last_exc
    raise RuntimeError('openai_retry_failed')

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
    mode: str = "flowchart"
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
    """Call OpenAI; fallback to deterministic JSON on failure."""
    try:
        if client is None:
            raise RuntimeError("openai_client_missing")
        completion = _chat_completion_with_retry(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0
        )
        return completion.choices[0].message.content
    except Exception:
        snippet = (user_prompt or "").strip()
        snippet = snippet.splitlines()
        snippet = " ".join([s.strip() for s in snippet if s.strip()])[:400]
        return (
            '{\n'
            ' "title": "Summary",\n'
            f' "summary_short": "{snippet[:120]}",\n'
            f' "summary_medium": "{snippet[:240]}",\n'
            f' "summary_detailed": "{snippet}",\n'
            ' "key_points": [],\n'
            ' "keywords": []\n'
            '}'
        )

def force_json(text: str):
    """Extract a JSON object from a string, or return None."""
    import json, re
    if not text:
        return None
    text = text.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(text)
    except Exception:
        pass
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        return None
    json_text = match.group(0)
    json_text = re.sub(r",\s*}", "}", json_text)
    json_text = re.sub(r",\s*]", "]", json_text)
    try:
        return json.loads(json_text)
    except Exception:
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

# Provide transparent placeholder images for missing activity-report backgrounds
TRANSPARENT_PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
    b"\x00\x00\x00\x0cIDAT\x78\x9c\x63\x60\x00\x00\x00\x02\x00\x01\xe2!\xbc\x33\x00\x00\x00\x00IEND\xaeB`\x82"
)

@app.get("/activity-report-generator/assets/backgrounds/{name}.jpg")
async def serve_activity_report_background(name: str):
    from fastapi.responses import Response
    # Return a 1x1 transparent PNG to satisfy image requests and eliminate 404s
    return Response(content=TRANSPARENT_PNG, media_type="image/png")

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
Generate a {req.mode} graph strictly.
Text:
{req.text}

Return EXACT JSON with keys:
{{
 "type": "{req.mode}",
 "nodes": [{{"id":"n0","label":"Root"}}],
 "edges": [{{"from":"n0","to":"n1"}}]
}}
Only include JSON. No explanations.
"""

    raw = use_llm(SYSTEM_MINDENGINE, prompt)
    parsed = force_json(raw)

    # Helper: basic keyword extractor for fallback
    def _extract_keywords(text):
        import re
        if not text:
            return []
        tokens = re.findall(r"[A-Za-z][A-Za-z0-9\-]+", text.lower())
        stop = {
            'the','and','of','to','in','for','on','with','a','an','is','are','this','that','it','at','as','by','from','or','be','into','your','you','we','our'
        }
        freq = {}
        for t in tokens:
            if t in stop or len(t) < 3:
                continue
            freq[t] = freq.get(t, 0) + 1
        kws = sorted(freq.items(), key=lambda x: (-x[1], x[0]))
        return [k for k,_ in kws[:12]]

    # Normalize to strict graph schema expected by frontend
    def _normalize_graph(obj):
        nodes = []
        edges = []

        # If already in schema, trust but verify
        if isinstance(obj, dict):
            in_nodes = obj.get("nodes")
            in_edges = obj.get("edges")
            if isinstance(in_nodes, list) and isinstance(in_edges, list):
                # Ensure each node has id+label; coerce minimal
                for i, n in enumerate(in_nodes):
                    nid = str(n.get("id", i))
                    lbl = n.get("label") or n.get("text") or n.get("name") or f"Node {i}"
                    nodes.append({"id": nid, "label": str(lbl)})
                for e in in_edges:
                    frm = str(e.get("from", e.get("source", "")))
                    to = str(e.get("to", e.get("target", "")))
                    if frm and to:
                        edges.append({"from": frm, "to": to})
                if nodes:
                    return {"type": req.mode, "nodes": nodes, "edges": edges}

        # Derive from summary/key_points/keywords
        title = "MindGraph"
        kp = []
        kw = []
        if isinstance(obj, dict):
            title = obj.get("title") or obj.get("topic") or title
            kp = obj.get("key_points") or []
            kw = obj.get("keywords") or []
            if not kw:
                kw = _extract_keywords((obj.get("summary_detailed") or obj.get("summary_medium") or obj.get("summary_short") or ""))

        # Build simple star graph: title -> each key point; then keywords
        nodes.append({"id": "title", "label": str(title)})
        seen = set()
        for i, k in enumerate(kp):
            nid = f"kp_{i}"
            lbl = str(k).strip()
            if not lbl or lbl in seen:
                continue
            seen.add(lbl)
            nodes.append({"id": nid, "label": lbl})
            edges.append({"from": "title", "to": nid})
        for j, k in enumerate(kw):
            nid = f"kw_{j}"
            lbl = str(k).strip()
            if not lbl or lbl in seen:
                continue
            seen.add(lbl)
            nodes.append({"id": nid, "label": lbl})
            edges.append({"from": "title", "to": nid})

        # If nothing found, create a minimal two-node graph from text snippet
        if len(nodes) == 1:
            snippet = (req.text or "").strip().split()
            second = "Snippet" if not snippet else " ".join(snippet[:5])
            nodes.append({"id": "n1", "label": second})
            edges.append({"from": "title", "to": "n1"})

        # Limit size to keep graph readable
        if len(nodes) > 24:
            nodes = nodes[:24]
            valid = {n["id"] for n in nodes}
            edges = [e for e in edges if e["from"] in valid and e["to"] in valid]

        return {"type": req.mode, "nodes": nodes, "edges": edges}

    normalized = _normalize_graph(parsed)
    return normalized if normalized else {"error": "Invalid JSON", "raw": raw}

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
    userPrompt: str | None = None

@app.post("/api/magazine/generate")
def generate_magazine(req: MagazineRequest):
    prompt = f"""Act as a professional Magazine Feature Writer and Editor for a college publication titled '{req.magTitle or 'The Campus Chronicle'}'.

Generate a concise 2-paragraph summary (first "thick" paragraph and second "thin" concluding paragraph), a 400-word feature article, two short photo captions, and one bold impactful pull-quote. Use an upbeat, encouraging, and professional tone. Include any raw facts provided below and adapt names/dates as given.

Event: {req.eventName}
Raw: {req.rawData}
Article type: {req.articleType}
Issue: {req.magIssue}
User instructions: {req.userPrompt or 'N/A'}

Format your output in JSON with keys: summary_thick, summary_thin, main_body, pull_quote, caption1, caption2.
"""

    # Send the full compiled prompt as the user message so fallback uses all fields
    raw = use_llm("MagazineWriter", prompt)
    parsed = force_json(raw)

    if not parsed:
        return {"error": "Invalid JSON", "raw": raw}

    # If model returned our expected magazine shape, pass through
    expected_keys = {"summary_thick", "summary_thin", "main_body", "pull_quote", "caption1", "caption2"}
    if expected_keys.issubset(set(parsed.keys())):
        return parsed

    # Otherwise, synthesize a readable magazine-style response from input fields
    title = (parsed or {}).get("title") or (req.magTitle or "The Campus Chronicle")
    event = req.eventName
    issue = req.magIssue
    raw_notes = (req.rawData or "").strip()
    article_type = req.articleType or "Feature Article"

    thick = (
        f"{event} brought together students and faculty in {issue}, blending energy and purpose into a "
        f"memorable {article_type.lower()}. Key details: {raw_notes[:220]}" if raw_notes else
        f"{event} brought together students and faculty in {issue}, delivering a memorable {article_type.lower()}."
    )
    thin = f"In summary — {event} showcased collaboration, creativity, and campus pride."
    main_body = (
        f"{thick}\n\nOrganizers coordinated logistics, schedules, and outreach; volunteers kept the experience smooth and welcoming. "
        f"Judges highlighted originality and impact across submissions. The showcase encouraged interdisciplinary work and gave students a platform to shine.\n\n"
        f"Looking ahead, lessons from {event} will inform future editions, building stronger partnerships and broader participation."
    )
    pull = f'"{event}"'
    return {
        "summary_thick": thick,
        "summary_thin": thin,
        "main_body": main_body,
        "pull_quote": pull,
        "caption1": "Moments from the event floor as teams present.",
        "caption2": "Judges confer during the final showcase round."
    }

# MoodSense+ Routes
class MoodAnalyzeRequest(BaseModel):
    text: str
    language: str = "english"
    persona: str = "auto"

class MoodChatRequest(BaseModel):
    message: str
    history: list = []
    language: str = "english"
    persona: str = "auto"
    mood_profile: dict = {}

class MoodSongsRequest(BaseModel):
    mood_profile: dict
    language: str = "english"

@app.post("/mood/analyze")
def mood_analyze(req: MoodAnalyzeRequest):
    try:
        rw = get_rewriter_module()
        if rw and hasattr(rw, 'generate_mood_profile'):
            mood_profile = rw.generate_mood_profile(req.text)
        else:
            # Fallback
            mood_profile = {
                "primary_emotion": "neutral",
                "secondary_emotions": [],
                "intent": "general",
                "sentiment": {"label": "neutral", "score": 0.5},
                "topic": "general",
                "intensity": 0.5,
                "all_emotions": []
            }
        
        # Add suggestions
        activities = ["breathing", "journaling", "grounding"]
        affirmations = ["You are capable", "This moment will pass", "You are not alone"]
        
        return {
            "mood_profile": mood_profile,
            "activities": activities,
            "affirmations": affirmations,
            "songs": []  # Separate call
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/mood/chat")
def mood_chat(req: MoodChatRequest):
    try:
        persona_prompts = {
            "parent": "Respond as a caring parent, supportive and nurturing.",
            "mentor": "Respond as a wise mentor, guiding and encouraging.",
            "doctor": "Respond as a therapist, professional and empathetic.",
            "friend": "Respond as a close friend, casual and understanding.",
            "auto": "Respond appropriately based on the mood."
        }
        prompt = f"{persona_prompts.get(req.persona, 'Respond empathetically.')}\nMessage: {req.message}\nMood: {req.mood_profile}\nLanguage: {req.language}\nRespond in {req.language}."
        response = use_llm(prompt, "Mood chat")
        return {"response": response}
    except Exception as e:
        return {"error": str(e)}

@app.post("/mood/songs")
def mood_songs(req: MoodSongsRequest):
    try:
        rw = get_rewriter_module()
        if rw and hasattr(rw, 'recommend_songs'):
            songs = rw.recommend_songs(req.mood_profile, req.language, 5)
        else:
            songs = [{"title": "Mock Song", "artist": "Artist", "spotify": "#", "youtube": "#"}]
        return {"songs": songs}
    except Exception as e:
        return {"error": str(e)}

# ===== Todo AI Endpoints =====
class TodoAnalyzeRequest(BaseModel):
    action: str
    text: str = ""
    tasks: list = []

class TodoSuggestRequest(BaseModel):
    action: str
    text: str = ""
    tasks: list = []

@app.post("/todo/analyze")
def todo_analyze(req: TodoAnalyzeRequest):
    """AI analysis for tasks: rewrite, priority prediction, summarize, weekly insights"""
    try:
        action = req.action
        text = req.text or ""
        tasks = req.tasks or []
        
        if action == "rewrite":
            prompt = f"Rewrite this task into an actionable, professional format:\n'{text}'\nProvide only the rewritten task."
            rewritten = use_llm(prompt, "Task rewrite")
            return {"rewrite": rewritten}
        
        elif action == "priority":
            prompt = f"Predict the priority level (low/medium/high/urgent) for this task:\n'{text}'\nRespond with only the priority word."
            priority = use_llm(prompt, "Priority prediction").lower().strip()
            if priority not in ["low", "medium", "high", "urgent"]:
                priority = "medium"
            return {"priority": priority}
        
        elif action == "summarize":
            total = len(tasks)
            completed = sum(1 for t in tasks if t.get("status") == "completed")
            pending = total - completed
            high_count = sum(1 for t in tasks if t.get("priority") == "high")
            prompt = f"Summarize the productivity of a user with {total} tasks: {completed} completed, {pending} pending, {high_count} high-priority. Provide a 2-3 sentence insight."
            summary = use_llm(prompt, "Task list summary")
            return {"summary": summary}
        
        elif action == "weeklyInsights":
            today_str = datetime.now().strftime("%Y-%m-%d")
            week_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
            prompt = f"Analyze weekly productivity: {len(tasks)} tasks total, {sum(1 for t in tasks if t.get('status')=='completed')} completed this week. Provide 3-4 key insights and recommendations."
            insights = use_llm(prompt, "Weekly insights")
            return {"insights": insights}
        
        else:
            return {"error": f"Unknown action: {action}"}
    
    except Exception as e:
        return {"error": str(e)}

@app.post("/todo/suggest")
def todo_suggest(req: TodoSuggestRequest):
    """AI suggestions for tasks: subtasks, ideal time, duration estimates"""
    try:
        action = req.action
        text = req.text or ""
        tasks = req.tasks or []
        
        if action == "subtasks":
            prompt = f"Break down this task into 5-7 concrete subtasks:\n'{text}'\nProvide as a simple numbered list."
            subtasks_text = use_llm(prompt, "Subtask generation")
            subtasks = [s.strip() for s in subtasks_text.split('\n') if s.strip()]
            return {"subtasks": subtasks}
        
        elif action == "bestTime":
            prompt = f"What is the ideal time of day to complete this task?\n'{text}'\nRespond with one of: morning / midday / afternoon / evening"
            best_time = use_llm(prompt, "Ideal time suggestion").lower().strip()
            if best_time not in ["morning", "midday", "afternoon", "evening"]:
                best_time = "midday"
            return {"bestTime": best_time}
        
        elif action == "duration":
            prompt = f"Estimate the duration (in minutes) for this task:\n'{text}'\nRespond with only a number (e.g., 45)."
            duration_str = use_llm(prompt, "Duration estimate")
            try:
                duration = int(''.join(filter(str.isdigit, duration_str)) or "40")
                duration = max(5, min(480, duration))  # Clamp 5-480 min
            except:
                duration = 40
            return {"duration": duration}
        
        else:
            return {"error": f"Unknown action: {action}"}
    
    except Exception as e:
        return {"error": str(e)}

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
