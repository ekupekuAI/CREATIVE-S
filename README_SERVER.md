Quick server instructions

1) Create a Python virtual environment and activate it (PowerShell):

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1
```

2) Install top-level requirements (this installs the unified server and OpenAI client). If you need the ML model dependencies for the AI Study Summarizer, also install its backend requirements in the `ai-study-summarizer/backend/` folder.

```powershell
pip install -r requirements.txt
# If you need the study-summarizer model dependencies (torch, transformers):
pip install -r .\ai-study-summarizer\backend\requirements.txt
```

3) Set the OpenAI API key (Mindmap needs this):

```powershell
$env:OPENAI_API_KEY = "your_key_here"
```

4) Run the unified server (serves frontends as static files and mounts backends at `/api/ai-study` and `/api/mindmap`):

```powershell
python server.py
```

5) Open the dashboard in your browser:

- http://127.0.0.1:8000/index.html

Notes
- The server attempts to mount the backend FastAPI apps from the backend `main.py` files. Ensure they exist and have an `app` variable (they do already).
- The Mindmap backend now requires `OPENAI_API_KEY` in the environment (no hardcoded key).
- If you prefer running each backend separately (for development), you can run `uvicorn` inside their backend folders instead of the unified server.
