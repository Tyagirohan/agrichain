"""
Background Scheduler for Periodic Scheme Updates
Checks for scheme updates every 2 days and generates notifications
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timedelta
import logging

from schemes_scraper import fetch_government_schemes
from scheme_tracker import SchemeUpdateTracker

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SchemeUpdateScheduler:
    """
    Manages periodic scheme updates and notifications
    """
    
    def __init__(self, update_interval_days: int = 2):
        self.scheduler = BackgroundScheduler()
        self.tracker = SchemeUpdateTracker()
        self.update_interval_days = update_interval_days
        self.is_running = False
    
    def check_for_updates(self):
        """
        Main function that checks for scheme updates
        Called by the scheduler
        """
        try:
            logger.info("[UPDATE CHECK] Starting periodic scheme update check...")
            
            # Fetch latest schemes from source (currently mock data)
            # In production, this would fetch from government APIs
            new_schemes = fetch_government_schemes(language='en')
            
            logger.info(f"[DATA] Fetched {len(new_schemes)} schemes")
            
            # Detect changes
            changes = self.tracker.detect_changes(new_schemes)
            
            # Log changes
            logger.info(f"Changes detected:")
            logger.info(f"  - New schemes: {len(changes['new'])}")
            logger.info(f"  - Updated schemes: {len(changes['updated'])}")
            logger.info(f"  - Removed schemes: {len(changes['removed'])}")
            logger.info(f"  - Deadlines approaching: {len(changes['deadline_approaching'])}")
            
            # Create notifications if there are changes
            if any(changes.values()):
                notifications = self.tracker.create_notifications(changes)
                self.tracker.save_notifications(notifications)
                logger.info(f"[OK] Created {len(notifications)} notifications")
            else:
                logger.info("[INFO] No changes detected")
            
            # Save current schemes
            self.tracker.save_current_schemes(new_schemes)
            
            # Update last check time
            self.tracker.update_last_check_time()
            
            logger.info(f"[OK] Update check completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            logger.info(f"[NEXT] Next check scheduled in {self.update_interval_days} days")
            
        except Exception as e:
            logger.error(f"[ERROR] Error during update check: {e}")
    
    def start(self):
        """Start the background scheduler"""
        if self.is_running:
            logger.warning("Scheduler is already running")
            return
        
        # Run immediately on startup
        logger.info("[STARTUP] Running initial scheme update check...")
        self.check_for_updates()
        
        # Schedule periodic updates
        self.scheduler.add_job(
            func=self.check_for_updates,
            trigger=IntervalTrigger(days=self.update_interval_days),
            id='scheme_update_job',
            name='Check for scheme updates',
            replace_existing=True
        )
        
        self.scheduler.start()
        self.is_running = True
        
        logger.info(f"[OK] Scheduler started! Checking for updates every {self.update_interval_days} days")
        logger.info(f"[NEXT] Next update: {(datetime.now() + timedelta(days=self.update_interval_days)).strftime('%Y-%m-%d %H:%M:%S')}")
    
    def stop(self):
        """Stop the background scheduler"""
        if self.is_running:
            self.scheduler.shutdown()
            self.is_running = False
            logger.info("[STOPPED] Scheduler stopped")
    
    def get_next_run_time(self) -> str:
        """Get the next scheduled run time"""
        job = self.scheduler.get_job('scheme_update_job')
        if job:
            return job.next_run_time.strftime('%Y-%m-%d %H:%M:%S')
        return "Not scheduled"
    
    def trigger_manual_update(self):
        """Manually trigger an update check"""
        logger.info("[MANUAL] Manual update triggered")
        self.check_for_updates()


# Global scheduler instance
scheme_scheduler = SchemeUpdateScheduler(update_interval_days=2)


# For testing
if __name__ == "__main__":
    import time
    
    print("Starting scheme update scheduler...")
    print("Update interval: 2 days")
    print("\nPress Ctrl+C to stop\n")
    
    scheduler = SchemeUpdateScheduler(update_interval_days=2)
    scheduler.start()
    
    try:
        # Keep the script running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\nStopping scheduler...")
        scheduler.stop()
        print("Scheduler stopped.")

