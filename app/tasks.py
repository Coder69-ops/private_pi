import logging
from celery import Celery
import docker
from docker.errors import DockerException, APIError
import json
import os
import socket
import shutil
import requests
import redis
from pathlib import Path
from .database import SessionLocal
from .models import ScanTask, ScanResult, Subscription, UserSettings
from datetime import datetime
import uuid

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Celery Setup
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/0")

app = Celery('tasks', broker=CELERY_BROKER_URL, backend=CELERY_RESULT_BACKEND)

# Redis Client for PubSub
redis_client = redis.Redis.from_url(CELERY_BROKER_URL)

app.conf.beat_schedule = {
    'check-subscriptions-every-hour': {
        'task': 'app.tasks.check_subscriptions',
        'schedule': 3600.0, # Every hour
    },
}

# DB Helper
def save_result(task_id: str, tool_name: str, result_data: dict, status: str = None):
    # Aggressive Debug Logging
    print(f"DEBUG: save_result called for {tool_name} status={status}")
    user_id = None
    
    # Resolve User ID for targeted broadcasting
    db = SessionLocal()
    try:
        task = db.query(ScanTask).filter(ScanTask.id == task_id).first()
        if task:
             user_id = task.user_id
        
        # 1. Publish update to Redis (Real-time feedback)
        try:
            # Re-initialize Redis client locally to safe-guard against Celery pre-fork issues
            broker_url = os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0")
            local_redis = redis.Redis.from_url(broker_url)
            
            msg = json.dumps({
                "task_id": task_id,
                "tool": tool_name,
                "status": status,
                "result": result_data,
                "timestamp": datetime.utcnow().isoformat(),
                "user_id": user_id 
            }, default=str)
            
            # Log Before Publish
            print(f"DEBUG: Publishing to scan_updates: {msg[:50]}...")
            subscribers = local_redis.publish("scan_updates", msg)
            print(f"DEBUG: Published! Subscribers count: {subscribers}")
            
        except Exception as e:
            print(f"DEBUG: Redis publish failed: {e}")
            logger.error(f"Redis publish failed: {e}")

        # 2. Save result to DB (Persistence)
        # Skip persistence for "RUNNING" status to avoid duplicate results in UI
        if status == "RUNNING":
            db.close()
            return

        # Save result
        scan_result = ScanResult(task_id=task_id, tool_name=tool_name, result=result_data)
        db.add(scan_result)
        
        # Update task status if provided
        if status and status != "TOOL_COMPLETED":
            if task: # Re-use task object
                task.status = status
                if status in ["COMPLETED", "FAILED"]:
                    task.completed_at = datetime.utcnow()
        
        db.commit()
    except Exception as e:
        logger.error(f"Database error: {e}")
        db.rollback()
    finally:
        db.close()

@app.task(name="app.tasks.check_subscriptions")
def check_subscriptions():
    db = SessionLocal()
    try:
        subs = db.query(Subscription).all()
        for sub in subs:
            should_scan = False
            now = datetime.utcnow()
            if not sub.last_scan_at:
                 should_scan = True
            else:
                 # Naive check: if > 24h
                 last = sub.last_scan_at.replace(tzinfo=None) if sub.last_scan_at.tzinfo else sub.last_scan_at
                 if (now - last).total_seconds() > 86400:
                     should_scan = True
            
            if should_scan:
                logger.info(f"Triggering scheduled scan for {sub.target}")
                task_id = str(uuid.uuid4())
                new_task = ScanTask(id=task_id, target=sub.target, scan_type="full", status="PENDING")
                db.add(new_task)
                sub.last_scan_at = now
                db.commit() # Commit the new task
                
                perform_scan.delay(task_id, sub.target, "full")
    finally:
        db.close()

def run_container_tool(image: str, command: str, volumes: dict = None, user: str = None) -> dict:
    """
    Spins up a sibling container to run a security tool.
    Captures output and cleans up.
    """
    container = None
    try:
        client = docker.from_env()
        logger.info(f"Pulling image {image}...")
        try:
            client.images.get(image)
        except docker.errors.ImageNotFound:
             logger.info(f"Image {image} not found locally, pulling...")
             client.images.pull(image)
        except Exception as e:
             logger.warning(f"Failed to check/pull image {image}, trying to run anyway: {e}")

        run_kwargs = {
            "image": image,
            "command": command,
            "detach": True,
            "mem_limit": "2048m",
            "nano_cpus": 1000000000, # 1 CPU
        }
        
        if volumes:
             run_kwargs["volumes"] = volumes
        
        if user:
            run_kwargs["user"] = user

        # In Docker, hostname is usually the container ID
        # We try to mount volumes from ourselves so the sibling container
        # shares the /app/scans volume.
        hostname = socket.gethostname()
        try:
            # Check if self is a container (optional, but good practice)
            # For now, just try usage.
            # Only use volumes_from if we are NOT using explicit volumes binding for the same path?
            # Docker allows both.
            run_kwargs["volumes_from"] = [hostname]
            logger.info(f"Attempting to run with volumes_from={hostname}")
            container = client.containers.run(**run_kwargs)
        except Exception as e:
            logger.warning(f"Failed to run with volumes_from={hostname}, retrying without: {e}")
            if "volumes_from" in run_kwargs:
                del run_kwargs["volumes_from"]
            container = client.containers.run(**run_kwargs)
        
        # Add a timeout to the wait (10 minutes = 600s)
        try:
            exit_code = container.wait(timeout=600)
        except Exception as e:
            logger.error(f"Container timed out or failed to wait: {e}")
            try:
                container.kill()
            except:
                pass
            return {"error": "Tool execution timed out after 10 minutes"}

        logs = container.logs().decode('utf-8')
        
        logger.info(f"Container finished with exit code {exit_code}")
        
        if exit_code['StatusCode'] != 0:
            error_msg = "Tool execution failed"
            if exit_code['StatusCode'] == 137:
                 error_msg = "CRASHED: Out Of Memory (OOM). Tool killed by system."
            return {"error": error_msg, "logs": logs}
            
        return {"output": logs}

    except DockerException as e:
        logger.error(f"Docker error: {e}")
        return {"error": str(e)}
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return {"error": str(e)}
    finally:
        if container:
            try:
                container.remove(force=True)
            except Exception as e:
                logger.error(f"Failed to remove container: {e}")

@app.task(name="app.tasks.perform_scan")
def perform_scan(scan_task_id: str, target: str, scan_type: str, modules: list = None):
    logger.info(f"Starting scan for {target} with ID {scan_task_id} (Type: {scan_type}, Modules: {modules})")
    
    save_result(scan_task_id, "System", {"message": "Scan started"}, "RUNNING")

    # Helper for web tools
    target_url = target
    if not target.startswith("http"):
        target_url = f"http://{target}"

    results = {}
    
    # Helper to check if tool should run
    def should_run(tool_id, legacy_type):
        if scan_type == "full": return True
        if scan_type == legacy_type: return True
        if scan_type == "custom" and modules and tool_id in modules: return True
        return False

    # 1. Port Patrol (Nmap)
    if should_run("PortPatrol", "port"):
        results['nmap'] = run_nmap_scan(scan_task_id, target)
    
    # 2. Visual Reconnaissance (Screenshots)
    if should_run("VisualRecon", "visual"):
        results['screenshot_desktop'] = run_visual_recon(scan_task_id, target, target_url)

    # 3. User Hunter (Sherlock)
    if should_run("UserHunter", "user"):
        results['sherlock'] = run_sherlock_scan(scan_task_id, target)

    # 4. Tech Detective (Nmap HTTP Scripts)
    if should_run("TechDetective", "tech"):
        results['wappalyzer'] = run_tech_detective(scan_task_id, target)

    # 5. Vulnerability Scanning (Nuclei)
    if should_run("VulnScanner", modules):
        # target_url logic handled inside now? No, passing raw target (host) is safer for Nmap
        run_vuln_scan(scan_task_id, target)

    # 6. Subdomain Seeker (Sublist3r)
    if should_run("SubdomainSeeker", "sub"):
        results['sublist3r'] = run_sublist3r_scan(scan_task_id, target)

    # 7. Breach Radar (TheHarvester)
    if should_run("BreachRadar", "breach"):
        results['breach_radar'] = run_theharvester_scan(scan_task_id, target)

    # 8. AI Executive Summary (Ollama)
    if should_run("AIExecutiveSummary", "ai"):
        results['ai_summary'] = generate_ai_summary(scan_task_id, target, results)

    # 9. PDF Report Generator
    if should_run("ReportGenerator", "pdf"):
        generate_pdf_report(scan_task_id, target, results)

    save_result(scan_task_id, "System", {"message": "Scan completed"}, "COMPLETED")
    return results

# --- Helper Functions ---

def run_nmap_scan(task_id: str, target: str):
    save_result(task_id, "PortPatrol", {"message": "Initializing port scan..."}, status="RUNNING")
    cmd = f"-F -T4 {target}" 
    output = run_container_tool("instrumentisto/nmap", cmd)
    save_result(task_id, "PortPatrol", output, status="TOOL_COMPLETED")
    return output

def run_visual_recon(task_id: str, target: str, target_url: str):
    save_result(task_id, "VisualRecon", {"message": "Capturing screenshots..."}, status="RUNNING")
    # Output filename: {task_id}_desktop.png
    filename = f"{task_id}_desktop.png"
    # Critical flags for Docker: --disable-dev-shm-usage, --disable-gpu
    # Added --disable-software-rasterizer and --run-all-compositor-stages-before-draw for stability
    cmd = (f"--headless --no-sandbox --screenshot=/app/scans/{filename} "
           f"--window-size=1280,1024 --hide-scrollbars --ignore-certificate-errors "
           f"--timeout=30000 --disable-gpu --disable-dev-shm-usage "
           f"--disable-software-rasterizer {target_url}")
    
    logger.info(f"Running VisualRecon command: {cmd}")
    # We assume /app/scans is mounted via volumes_from
    # Run as root to ensure write permissions to the mounted volume
    output = run_container_tool("zenika/alpine-chrome", cmd, user="root")
    
    # Verify if file exists (on our side)
    file_path = f"/app/scans/{filename}"
    if os.path.exists(file_path):
            # Update ScanTask with screenshot path
            db = SessionLocal()
            task = db.query(ScanTask).filter(ScanTask.id == task_id).first()
            if task:
                current_paths = task.screenshot_paths or {}
                current_paths["desktop"] = f"/scans/{filename}" # Web accessible path
                task.screenshot_paths = current_paths
                db.commit()
                db.close()
            
            save_result(task_id, "VisualRecon", {"desktop": f"/scans/{filename}"}, status="TOOL_COMPLETED")
            return f"/scans/{filename}"
    else:
            logger.error(f"Screenshot file not found at {file_path}")
            save_result(task_id, "VisualRecon", {"error": "Screenshot failed"})
            return None

def run_sherlock_scan(task_id: str, target: str):
    save_result(task_id, "UserHunter", {"message": "Searching social media accounts..."}, status="RUNNING")
    if "." in target:
        username = target.split(".")[0]
    else:
        username = target
    cmd = f"{username} --site Instagram --site Facebook --site Twitter --site Github --timeout 10"
    output = run_container_tool("sherlock/sherlock", cmd)
    
    # Sherlock error handling: sometimes it outputs 'Desired sites not found' which comes as a text in 'output'
    # We want to treat this as valid empty result if possible, or just pass it through.
    if isinstance(output, dict) and "output" in output:
         if "Desired sites not found" in output["output"]:
             # This is not a system error, just no results
             pass
             
    save_result(task_id, "UserHunter", output, status="TOOL_COMPLETED")
    return output

def run_tech_detective(task_id: str, target: str):
    save_result(task_id, "TechDetective", {"message": "Identifying technology stack..."}, status="RUNNING")
    # Fallback to Nmap for broader compatibility and no need for obscure images
    scripts = "http-server-header,http-title,http-methods,http-headers"
    cmd = f"-p 80,443 --script {scripts} {target}"
    output = run_container_tool("instrumentisto/nmap", cmd)
    save_result(task_id, "TechDetective", output, status="TOOL_COMPLETED")
    return output

def run_vuln_scan(task_id: str, target: str):
    save_result(task_id, "VulnScanner", {"message": "Running vulnerability assessment..."}, status="RUNNING")
    # Replacement for Nuclei: Lighter weight Nmap Vulnerability Scan
    # Extract hostname from URL if needed
    host = target.replace("http://", "").replace("https://", "").split("/")[0]
    
    # --script vuln: Runs a suite of vulnerability detection scripts
    # --min-rate 1000: Speeds up the scan
    cmd = f"-p 80,443 --script http-vuln*,http-config-backup,http-cors,http-csrf -T4 --min-rate 1000 {host}"
    
    # Re-use the Nmap image (already pulled)
    output = run_container_tool("instrumentisto/nmap", cmd)
    
    save_result(task_id, "VulnScanner", output, status="TOOL_COMPLETED")
    return output

def run_sublist3r_scan(task_id: str, target: str):
    save_result(task_id, "SubdomainSeeker", {"message": "Discovering subdomains..."}, status="RUNNING")
    cmd = f"-d {target}"
    output = run_container_tool("secsi/sublist3r", cmd)
    save_result(task_id, "SubdomainSeeker", output, status="TOOL_COMPLETED")
    return output

def run_theharvester_scan(task_id: str, target: str):
    save_result(task_id, "BreachRadar", {"message": "Searching breach databases..."}, status="RUNNING")
    # Using TheHarvester to find emails. 
    # Output to shared volume.
    # Note: -f option outputs to file (without extension, it adds it)
    filename_base = f"{task_id}_harvester"
    cmd = f"-d {target} -b all -l 50 -f /app/scans/{filename_base}"
    # Switching to a known working image
    output = run_container_tool("secsi/theharvester", cmd)

    # Check for JSON output
    json_file = f"/app/scans/{filename_base}.json"
    emails_count = 0
    if os.path.exists(json_file):
            try:
                with open(json_file, 'r') as f:
                    data = json.load(f)
                    # Structure depends on tool version, assumes list or dict with emails
                    if isinstance(data, dict):
                        emails = data.get("emails", [])
                        emails_count = len(emails)
                    elif isinstance(data, list):
                        emails_count = len([x for x in data if "@" in str(x)])
            except Exception as e:
                logger.error(f"Failed to parse Harvester output: {e}")
    
    save_result(task_id, "BreachRadar", {"emails_found": emails_count, "logs": output}, status="TOOL_COMPLETED")
    return {"emails_found": emails_count}

def generate_ai_summary(task_id: str, target: str, results: dict):
    save_result(task_id, "AIExecutiveSummary", {"message": "Generating AI analysis..."}, status="RUNNING")
    # Fetch user settings for API Key
    db = SessionLocal()
    task = db.query(ScanTask).filter(ScanTask.id == task_id).first()
    user_settings = None
    if task and task.user_id:
        user_settings = db.query(UserSettings).filter(UserSettings.user_id == task.user_id).first()
    db.close()

    api_key = user_settings.openrouter_api_key if user_settings else None
    model = user_settings.openrouter_model if user_settings and user_settings.openrouter_model else "google/gemini-pro"
    
    # Prepare context (smart truncation)
    # We prioritize high severity vulnerabilities and open ports
    context_data = {
        "nmap": results.get("nmap", {}),
        "open_ports": results.get("port_patrol", {}), 
        "vulns": results.get("nuclei", []),
        "tech": results.get("wappalyzer", {})
    }
    context = str(context_data)[:12000] # Increased context window

    prompt = (f"Analyze these security scan results for target '{target}'. "
              f"Data: {context}. "
              "Act as a Senior Penetration Tester. "
              "1. Assign a Risk Score (Low, Medium, High, Critical). "
              "2. Write a concise Executive Summary (3-4 sentences) focusing on the most critical findings. "
              "3. List 3 key mitigation steps. "
              "Return ONLY valid JSON in this format: "
              "{\"score\": \"High\", \"summary\": \"...\", \"mitigation\": [\"step1\", \"step2\"]}")

    if not api_key:
        # Fallback / No Key Provided
        logger.info("No OpenRouter API key found. Skipping AI analysis.")
        return {"error": "Missing OpenRouter API Key. Add it in Settings."}

    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "https://privatepi.aixplore.me", # Required by OpenRouter
            "X-Title": "Private PI"
        }
        
        payload = {
            "model": model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"}
        }

        # 10s timeout is reasonable for external API
        resp = requests.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers, timeout=20)
        
        if resp.status_code == 200:
            ai_data = resp.json()
            content = ai_data['choices'][0]['message']['content']
            
            # Parse JSON from content
            try:
                # Sometimes models wrap json in markdown code blocks
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                
                parsed = json.loads(content)
                score = parsed.get("score", "Unknown")
                summary_text = parsed.get("summary", "No summary generated.")
                mitigation = parsed.get("mitigation", [])
                
                # Verify validity
                if not isinstance(mitigation, list): mitigation = []

            except:
                # Fallback if model output isn't strict JSON
                summary_text = content[:500] + "..."
                score = "Medium" # Default
                mitigation = []
                if "High" in content or "Critical" in content: score = "High"

            # Save to DB
            db = SessionLocal()
            task = db.query(ScanTask).filter(ScanTask.id == task_id).first()
            if task:
                task.ai_summary = {"summary": summary_text, "mitigation": mitigation}
                task.risk_score = score
                db.commit()
                db.close()
            
            save_result(task_id, "AIExecutiveSummary", {"score": score, "summary": summary_text, "mitigation": mitigation}, status="TOOL_COMPLETED")
            return {"score": score, "summary": summary_text}
        else:
            error_msg = f"OpenRouter Error: {resp.status_code} - {resp.text[:200]}"
            logger.error(error_msg)
            save_result(task_id, "AIExecutiveSummary", {"error": error_msg})
            return {"error": error_msg}

    except Exception as e:
        logger.error(f"AI Summary failed: {e}")
        save_result(task_id, "AIExecutiveSummary", {"error": str(e)})
        return {"error": str(e)}

def generate_pdf_report(task_id: str, target: str, results: dict):
    # Professional PDF Template
    current_date = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    ai_data = results.get('ai_summary', {})
    if isinstance(ai_data, str):
         # Handle case where AI summary failed and returned error string or raw text
         ai_data = {"summary": ai_data, "score": "UNKNOWN", "remediation_priority": "UNKNOWN"}
         
    risk_score = ai_data.get('score', 'PENDING')
    risk_badges = {
        'CRITICAL': ('#dc2626', '#fee2e2'), # Red
        'HIGH': ('#ea580c', '#ffedd5'),     # Orange
        'MEDIUM': ('#ca8a04', '#fef9c3'),   # Yellow
        'LOW': ('#16a34a', '#dcfce7'),      # Green
        'SAFE': ('#16a34a', '#dcfce7'),     # Green
        'UNKNOWN': ('#4b5563', '#f3f4f6'),  # Gray
        'PENDING': ('#4b5563', '#f3f4f6')
    }
    bg_color, text_color = risk_badges.get(risk_score, risk_badges['UNKNOWN'])
    
    # Helper for formatting raw output as terminal code
    def format_terminal(title, content):
        if not content: return ""
        # Clean up if content is dict/list (JSON dump it)
        display_content = content
        if isinstance(content, (dict, list)):
            display_content = json.dumps(content, indent=2)
            
        return f"""
        <div class="section avoid-break">
            <h3 class="section-title">{title}</h3>
            <div class="terminal-window">
                <div class="terminal-header">
                    <span class="dot red"></span>
                    <span class="dot yellow"></span>
                    <span class="dot green"></span>
                </div>
                <pre class="terminal-body">{display_content}</pre>
            </div>
        </div>
        """

    # Build Sections
    sections_html = ""
    
    # 1. Visual Recon (Top Priority)
    screenshot_path = results.get('screenshot_desktop')
    if screenshot_path:
        # Check if it is a dict (legacy/error) or string path
        if isinstance(screenshot_path, dict):
             screenshot_path = screenshot_path.get('desktop')
             
        if screenshot_path and isinstance(screenshot_path, str):
            # Convert web path to local file path
            local_path = screenshot_path.replace("/scans/", "/app/scans/")
            if os.path.exists(local_path):
                 sections_html += f"""
                 <div class="section avoid-break">
                    <h3 class="section-title">Visual Reconnaissance</h3>
                    <div style="border: 1px solid #ddd; padding: 5px; background: white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        <img src="file://{local_path}" style="width: 100%; height: auto; display: block;">
                    </div>
                    <div style="margin-top: 5px; font-size: 10px; color: #666; text-align: right;">Captured via Headless Chrome</div>
                 </div>
                 """

    # 2. Port Patrol (Nmap)
    if 'nmap' in results:
        sections_html += format_terminal("Network Intrusion Scan (Nmap)", results['nmap'])

    # 3. User Hunter (Sherlock)
    if 'sherlock' in results:
        sections_html += format_terminal("Social Media Footprint (Sherlock)", results['sherlock'])
        
    # 4. Tech Detective (Wappalyzer/Nmap Scripts)
    if 'wappalyzer' in results:
        sections_html += format_terminal("Technology Stack Analysis", results['wappalyzer'])

    # 5. Vulnerability Scan (Nuclei/Nmap)
    if 'nuclei' in results:
        sections_html += format_terminal("Vulnerability Assessment", results['nuclei'])
        
    # 6. Subdomain Seeker
    if 'sublist3r' in results:
        sections_html += format_terminal("Subdomain Enumeration", results['sublist3r'])
        
    # 7. Breach Radar
    if 'breach_radar' in results:
        sections_html += format_terminal("Breach Data Intelligence", results['breach_radar'])

    # 8. Neural Network Map (Attached Snapshot)
    map_filename = f"{task_id}_map.png"
    map_path = f"/app/scans/{map_filename}"
    if os.path.exists(map_path):
         sections_html += f"""
         <div class="section avoid-break">
            <h3 class="section-title">Attack Surface Visualization (Neural Map)</h3>
            <div style="border: 1px solid #333; padding: 10px; background: #000; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);">
                <img src="file://{map_path}" style="width: 100%; height: auto; display: block; border-radius: 4px;">
            </div>
            <div style="margin-top: 5px; font-size: 10px; color: #666; text-align: center; font-family: monospace;">
                FIGURE 1.1: LIVE NODE TOPOLOGY
            </div>
         </div>
         """
        
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>INTELLIGENCE REPORT // {target}</title>
        <style>
            @page {{ size: A4; margin: 0; }}
            body {{ 
                font-family: 'Courier New', Courier, monospace; 
                color: #111; 
                margin: 0; 
                background: #fdfdfd; 
            }}
            .cover-page {{
                height: 100vh;
                background: #0a0a0a;
                color: #00ff41;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                text-align: center;
                position: relative;
            }}
            .cover-border {{
                position: absolute;
                top: 20px; left: 20px; right: 20px; bottom: 20px;
                border: 2px solid #00ff41;
            }}
            .cover-title {{
                font-size: 48px;
                font-weight: bold;
                letter-spacing: 4px;
                margin-bottom: 20px;
                text-shadow: 0 0 10px rgba(0, 255, 65, 0.5);
            }}
            .cover-subtitle {{
                font-size: 18px;
                letter-spacing: 2px;
                color: #fff;
                opacity: 0.8;
                margin-bottom: 60px;
            }}
            .cover-meta {{
                font-size: 14px;
                color: #aaa;
                border-top: 1px solid #333;
                padding-top: 20px;
                width: 60%;
            }}
            
            .content-page {{
                padding: 40px 50px;
                min-height: 100vh;
            }}
            
            .header-strip {{
                background: #000;
                color: #fff;
                padding: 10px 50px;
                display: flex;
                justify-content: space-between;
                font-size: 10px;
                text-transform: uppercase;
                border-bottom: 3px solid #00ff41;
            }}
            
            .executive-summary {{
                background: #fff;
                border: 1px solid #000;
                padding: 25px;
                margin-bottom: 40px;
                position: relative;
                box-shadow: 5px 5px 0px rgba(0,0,0,0.1);
            }}
            .risk-badge {{
                position: absolute;
                top: -15px;
                right: 20px;
                background: {bg_color};
                color: {text_color};
                padding: 5px 15px;
                font-weight: bold;
                border: 2px solid #000;
                box-shadow: 3px 3px 0px rgba(0,0,0,0.2);
            }}
            
            h2 {{ font-size: 24px; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }}
            .section-title {{ 
                font-size: 16px; 
                background: #000; 
                color: #fff; 
                display: inline-block; 
                padding: 5px 10px; 
                margin-bottom: 0;
            }}
            
            .terminal-window {{
                background: #1a1b1e;
                border-radius: 6px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                margin-top: 0;
                border: 1px solid #333;
                page-break-inside: avoid;
            }}
            .terminal-header {{
                background: #25262b;
                padding: 8px 12px;
                border-top-left-radius: 6px;
                border-top-right-radius: 6px;
                display: flex;
                gap: 6px;
            }}
            .dot {{ width: 10px; height: 10px; border-radius: 50%; }}
            .red {{ background: #ff5f56; }}
            .yellow {{ background: #ffbd2e; }}
            .green {{ background: #27c93f; }}
            
            .terminal-body {{
                padding: 15px;
                color: #00ff41;
                font-family: 'Courier New', monospace;
                font-size: 10px;
                overflow-x: hidden;
                white-space: pre-wrap;
                margin: 0;
            }}
            
            .section {{ margin-bottom: 30px; }}
            .avoid-break {{ page-break-inside: avoid; }}
            
            .footer {{
                position: fixed; bottom: 0; left: 0; right: 0;
                text-align: center; font-size: 8px; color: #999;
                padding: 10px;
                background: #fff;
                border-top: 1px solid #eee;
            }}
        </style>
    </head>
    <body>
        <!-- Cover Page -->
        <div class="cover-page">
            <div class="cover-border"></div>
            <div class="cover-title">PRIVATE_PI</div>
            <div class="cover-subtitle">OFFENSIVE INTELLIGENCE REPORT</div>
            <div class="cover-meta">
                <p>TARGET: {target}</p>
                <p>DATE: {current_date}</p>
                <p>TASK ID: {task_id}</p>
                <p style="color: #ff5f56; margin-top: 20px;">CONFIDENTIAL DOCUMENT</p>
            </div>
        </div>

        <!-- Header for content pages -->
        <div class="header-strip">
            <span>Private PI v1.0</span>
            <span>Ref: {task_id}</span>
        </div>

        <div class="content-page">
            <!-- Executive Summary -->
            <h2>Mission Intelligence</h2>
            <div class="executive-summary">
                <div class="risk-badge">RISK: {risk_score}</div>
                <h3>Situation Analysis</h3>
                <p style="line-height: 1.5; font-family: Helvetica, Arial, sans-serif;">
                    {ai_data.get('summary', 'No automated intelligence summary available for this mission.')}
                </p>
                <div style="margin-top: 15px; border-top: 1px dashed #ccc; padding-top: 10px; font-size: 12px;">
                    <strong>Remediation Priority:</strong> {ai_data.get('remediation_priority', 'Assessment Pending')}
                </div>
            </div>

            <!-- Findings -->
            {sections_html}
        </div>

        <div class="footer">
            GENERATED BY PRIVATE PI ENGINE // AUTOMATED OSINT RECONNAISSANCE
        </div>
    </body>
    </html>
    """
    
    html_filename = f"{task_id}_report.html"
    html_path = f"/app/scans/{html_filename}"
    
    try:
        with open(html_path, "w", encoding='utf-8') as f:
            f.write(html_content)
    except Exception as e:
        logger.error(f"Failed to write HTML report: {e}")
        return

    # Convert to PDF
    pdf_filename = f"{task_id}_report.pdf"
    cmd = f"--headless --no-sandbox --print-to-pdf=/app/scans/{pdf_filename} --hide-scrollbars file://{html_path}"
    
    result = run_container_tool("zenika/alpine-chrome", cmd, user="root")
    
    pdf_path = f"/app/scans/{pdf_filename}"
    if os.path.exists(pdf_path):
             db = SessionLocal()
             try:
                task = db.query(ScanTask).filter(ScanTask.id == task_id).first()
                if task:
                    task.pdf_report_path = f"/scans/{pdf_filename}"
                    db.commit()
             except Exception as e:
                 logger.error(f"DB Error update pdf path: {e}")
             finally:
                 db.close()
             save_result(task_id, "ReportGenerator", {"pdf_url": f"/scans/{pdf_filename}"}, status="TOOL_COMPLETED")
    else:
             logger.error(f"PDF file not found after generation: {output}") # Output from chrome container
             save_result(task_id, "ReportGenerator", {"error": "PDF generation failed"}, status="FAILED")

@app.task(name="app.tasks.generate_report_task")
def generate_report_task(task_id: str):
    db = SessionLocal()
    try:
        task = db.query(ScanTask).filter(ScanTask.id == task_id).first()
        if not task:
            logger.error(f"Task {task_id} not found for report generation")
            return
            
        # Reconstruct results from DB
        scan_results = db.query(ScanResult).filter(ScanResult.task_id == task_id).all()
        aggregated_results = {}
        
        # Map tool names to keys expected by PDF generator
        tool_map = {
            "PortPatrol": "nmap",
            "VisualRecon": "screenshot_desktop",
            "UserHunter": "sherlock",
            "TechDetective": "wappalyzer",
            "VulnScanner": "nuclei",
            "SubdomainSeeker": "sublist3r",
            "BreachRadar": "breach_radar",
            "AIExecutiveSummary": "ai_summary"
        }
        
        for res in scan_results:
            key = tool_map.get(res.tool_name, res.tool_name.lower())
            aggregated_results[key] = res.result
            
        # Generate
        save_result(task_id, "System", {"message": "Generating PDF Report..."}, "RUNNING")
        generate_pdf_report(task_id, task.target, aggregated_results)
        
        # Check if AI Summary exists, if not, try to generate it first?
        # For now, just rely on existing data.
        
        save_result(task_id, "System", {"message": "Report Generation Completed"}, "COMPLETED")
        
    except Exception as e:
        logger.error(f"Report generation task failed: {e}")
        save_result(task_id, "ReportGenerator", {"error": str(e)})
    finally:
        db.close()
