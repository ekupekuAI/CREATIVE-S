#!/usr/bin/env python3
"""
Unified Creative Studio Server Runner
Runs the main FastAPI server that serves all applications
"""

import subprocess
import sys
import time
import os
import requests
from pathlib import Path

def check_dependencies():
    """Check if required dependencies are installed"""
    print("Checking dependencies...")

    try:
        import fastapi
        import uvicorn
        print("OK: FastAPI and Uvicorn available")
    except ImportError:
        print("ERROR: FastAPI/Uvicorn not installed. Run: pip install fastapi uvicorn")
        return False

    try:
        import transformers
        print("OK: Transformers available")
    except ImportError:
        print("WARNING: Transformers not available - AI features will be limited")

    try:
        import openai
        print("OK: OpenAI available")
    except ImportError:
        print("WARNING: OpenAI not available - some AI features will be limited")

    return True

def start_main_server():
    """Start the main FastAPI server"""
    print("Starting Creative Studio Unified Server...")

    current_dir = Path(__file__).resolve().parent

    try:
        # Start the main server
        print("Starting Main Server on port 8000...")
        server_process = subprocess.Popen(
            [sys.executable, "server.py"],
            cwd=current_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        # Wait for server to start
        print("Waiting for server to initialize...")
        time.sleep(3)

        # Check if server is responding
        try:
            response = requests.get("http://localhost:8000/health", timeout=5)
            if response.status_code == 200:
                print("OK: Server health check passed!")
            else:
                print(f"WARNING: Server responded with status {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"ERROR: Server health check failed: {e}")
            print("Checking server process...")
            if server_process.poll() is not None:
                print("ERROR: Server process terminated unexpectedly")
                stdout, stderr = server_process.communicate()
                if stderr:
                    print("Server error output:")
                    print(stderr)
                return None

        print("\nSUCCESS: Creative Studio Server Started Successfully!")
        print("=" * 60)
        print("Main URL: http://localhost:8000")
        print("\nAvailable Applications:")
        print("   • Magazine Designer Pro: http://localhost:8000/Mag.html")
        print("   • Certificate Generator: http://localhost:8000/certificate")
        print("   • Activity Report Generator: http://localhost:8000/activity-report-generator/")
        print("   • Event Planner: http://localhost:8000/event-planner/")
        print("   • Mind Map AI: http://localhost:8000/mindmap-ai/")
        print("   • Mood Sense: http://localhost:8000/mood-sense/")
        print("   • Magazine Maker: http://localhost:8000/Mag.html")
        print("   • Todo App: http://localhost:8000/todo.html")
        print("\nAPI Endpoints:")
        print("   • Health Check: http://localhost:8000/health")
        print("   • AI Certificate API: http://localhost:8000/api/ai/*")
        print("   • Mood Analysis: http://localhost:8000/mood/*")
        print("   • Event Planner API: http://localhost:8000/api/event-planner/*")
        print("\nInstructions:")
        print("1. Open http://localhost:8000 in your browser")
        print("2. Click on any application link above")
        print("3. All apps share the same server and are fully connected")
        print("\nPress Ctrl+C to stop the server")

        return server_process

    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        return None

def check_server_connectivity():
    """Check connectivity between different parts of the application"""
    print("\nChecking Server Connectivity...")

    endpoints_to_check = [
        ("Main Health", "http://localhost:8000/health"),
        ("Magazine Page", "http://localhost:8000/Mag.html"),
        ("Certificate API", "http://localhost:8000/api/ai/suggest"),
        ("Mood API", "http://localhost:8000/mood/analyze"),
    ]

    all_connected = True

    for name, url in endpoints_to_check:
        try:
            if url.endswith('/suggest') or url.endswith('/analyze'):
                # POST request for API endpoints
                response = requests.post(url, json={}, timeout=5)
            else:
                # GET request for pages/health
                response = requests.get(url, timeout=5)

            if response.status_code in [200, 405]:  # 405 is OK for POST to GET endpoint
                print(f"OK: {name}: Connected")
            else:
                print(f"WARNING: {name}: HTTP {response.status_code}")
                all_connected = False
        except requests.exceptions.RequestException as e:
            print(f"ERROR: {name}: Failed to connect - {e}")
            all_connected = False

    return all_connected

def main():
    """Main function to run the unified server"""
    print("Creative Studio - Unified Server Launcher")
    print("=" * 50)

    # Check dependencies
    if not check_dependencies():
        print("\nERROR: Dependency check failed. Please install required packages.")
        sys.exit(1)

    # Start the main server
    server_process = start_main_server()
    if not server_process:
        print("\nERROR: Failed to start server. Exiting.")
        sys.exit(1)

    # Check connectivity
    time.sleep(2)  # Give server more time to fully start
    connectivity_ok = check_server_connectivity()

    if connectivity_ok:
        print("\nSUCCESS: All systems connected and operational!")
        print("Ready to create amazing content!")
    else:
        print("\nWARNING: Some connections may not be working properly.")
        print("Check the server logs above for details.")

    print("\n" + "=" * 60)
    print("Server is running in the background...")
    print("Press Ctrl+C to stop all servers")

    try:
        # Keep the script running
        server_process.wait()
    except KeyboardInterrupt:
        print("\n\nStopping servers...")
        server_process.terminate()
        server_process.wait()
        print("OK: Servers stopped. Goodbye!")

if __name__ == "__main__":
    main()