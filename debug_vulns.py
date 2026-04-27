from app.database import SessionLocal
from app.models import ScanResult
import json

def check_vulns():
    db = SessionLocal()
    try:
        results = db.query(ScanResult).filter(ScanResult.tool_name == 'VulnScanner').all()
        print(f"Found {len(results)} VulnScanner entries.")
        for r in results:
            print(f"ID: {r.id}, Task: {r.task_id}")
            print(f"Result Type: {type(r.result)}")
            print(f"Result Content (Preview): {str(r.result)[:200]}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_vulns()
