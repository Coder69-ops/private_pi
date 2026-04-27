from sqlalchemy import text
from app.database import engine, Base

def migrate():
    with engine.connect() as conn:
        with conn.begin():
            # Add missing columns to scan_tasks
            queries = [
                "ALTER TABLE scan_tasks ADD COLUMN IF NOT EXISTS screenshot_paths JSON;",
                "ALTER TABLE scan_tasks ADD COLUMN IF NOT EXISTS ai_summary JSON;",
                "ALTER TABLE scan_tasks ADD COLUMN IF NOT EXISTS risk_score VARCHAR;",
                "ALTER TABLE scan_tasks ADD COLUMN IF NOT EXISTS pdf_report_path VARCHAR;",
                "ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS openrouter_api_key VARCHAR;",
                "ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS openrouter_model VARCHAR DEFAULT 'google/gemini-pro';",
                # Subscriptions table might not exist yet if create_all run before, but create_all handles it.
                # However, if we need to migrate it:
                # "ALTER TABLE subscriptions ADD COLUMN ..." (new table so create_all should catch it if running from scratch, but here we assume it might exist or we just let create_all handle new tables)
            ]
            
            for q in queries:
                try:
                    conn.execute(text(q))
                    print(f"Executed: {q}")
                except Exception as e:
                    print(f"Error executing {q}: {e}")
            
    print("Migration complete.")
    
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    print("Tables created (if not existed).")

if __name__ == "__main__":
    migrate()
