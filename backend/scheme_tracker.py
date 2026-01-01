"""
Scheme Update Tracker and Notification System
Monitors government schemes for changes and notifies users
"""

import json
import os
from datetime import datetime
from typing import List, Dict, Set
from pathlib import Path

class SchemeUpdateTracker:
    """
    Tracks scheme updates and generates notifications for users
    """
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        
        self.schemes_file = self.data_dir / "schemes_cache.json"
        self.notifications_file = self.data_dir / "notifications.json"
        self.last_update_file = self.data_dir / "last_update.json"
        
        self.current_schemes: Dict[str, Dict] = {}
        self.previous_schemes: Dict[str, Dict] = {}
        self.notifications: List[Dict] = []
    
    def load_previous_schemes(self) -> Dict[str, Dict]:
        """Load previously cached schemes"""
        try:
            if self.schemes_file.exists():
                with open(self.schemes_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return {s['id']: s for s in data.get('schemes', [])}
        except Exception as e:
            print(f"Error loading previous schemes: {e}")
        return {}
    
    def save_current_schemes(self, schemes: List[Dict]):
        """Save current schemes to cache"""
        try:
            data = {
                'timestamp': datetime.now().isoformat(),
                'schemes': schemes,
                'count': len(schemes)
            }
            with open(self.schemes_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error saving schemes: {e}")
    
    def detect_changes(self, new_schemes: List[Dict]) -> Dict[str, List[Dict]]:
        """
        Detect changes in schemes
        Returns dict with 'new', 'updated', 'removed' schemes
        """
        self.previous_schemes = self.load_previous_schemes()
        self.current_schemes = {s['id']: s for s in new_schemes}
        
        changes = {
            'new': [],
            'updated': [],
            'removed': [],
            'deadline_approaching': []
        }
        
        # Find new schemes
        for scheme_id, scheme in self.current_schemes.items():
            if scheme_id not in self.previous_schemes:
                changes['new'].append(scheme)
                print(f"[NEW] NEW SCHEME: {scheme['name']}")
        
        # Find updated schemes
        for scheme_id, current_scheme in self.current_schemes.items():
            if scheme_id in self.previous_schemes:
                previous_scheme = self.previous_schemes[scheme_id]
                
                # Check if any field changed
                if (current_scheme.get('description') != previous_scheme.get('description') or
                    current_scheme.get('benefits') != previous_scheme.get('benefits') or
                    current_scheme.get('deadline') != previous_scheme.get('deadline') or
                    current_scheme.get('eligibility') != previous_scheme.get('eligibility')):
                    
                    changes['updated'].append({
                        'scheme': current_scheme,
                        'changes': self._get_field_changes(previous_scheme, current_scheme)
                    })
                    print(f"[UPDATE] UPDATED SCHEME: {current_scheme['name']}")
        
        # Find removed schemes
        for scheme_id, scheme in self.previous_schemes.items():
            if scheme_id not in self.current_schemes:
                changes['removed'].append(scheme)
                print(f"[REMOVED] REMOVED SCHEME: {scheme['name']}")
        
        # Check for approaching deadlines
        for scheme in new_schemes:
            if self._is_deadline_approaching(scheme):
                changes['deadline_approaching'].append(scheme)
        
        return changes
    
    def _get_field_changes(self, old: Dict, new: Dict) -> List[str]:
        """Get list of changed fields"""
        changed = []
        if old.get('description') != new.get('description'):
            changed.append('description')
        if old.get('benefits') != new.get('benefits'):
            changed.append('benefits')
        if old.get('deadline') != new.get('deadline'):
            changed.append('deadline')
        if old.get('eligibility') != new.get('eligibility'):
            changed.append('eligibility')
        return changed
    
    def _is_deadline_approaching(self, scheme: Dict) -> bool:
        """Check if scheme deadline is within 30 days"""
        # This is a simplified check
        # In production, parse actual dates from deadline string
        deadline = scheme.get('deadline', '').lower()
        
        # Keywords indicating approaching deadlines
        approaching_keywords = ['soon', 'expiring', 'last', 'final', 'closing']
        return any(keyword in deadline for keyword in approaching_keywords)
    
    def create_notifications(self, changes: Dict[str, List[Dict]]) -> List[Dict]:
        """
        Create user notifications from detected changes
        """
        notifications = []
        timestamp = datetime.now().isoformat()
        
        # New scheme notifications
        for scheme in changes['new']:
            notifications.append({
                'id': f"new_{scheme['id']}_{datetime.now().timestamp()}",
                'type': 'new_scheme',
                'priority': 'high',
                'title': f"🆕 New Scheme Available: {scheme['name']}",
                'message': f"{scheme['description'][:150]}...",
                'scheme_id': scheme['id'],
                'scheme_name': scheme['name'],
                'category': scheme['category'],
                'timestamp': timestamp,
                'read': False,
                'action_url': f"/govt-schemes?scheme={scheme['id']}"
            })
        
        # Updated scheme notifications
        for update in changes['updated']:
            scheme = update['scheme']
            changed_fields = ', '.join(update['changes'])
            notifications.append({
                'id': f"update_{scheme['id']}_{datetime.now().timestamp()}",
                'type': 'scheme_update',
                'priority': 'medium',
                'title': f"🔄 Scheme Updated: {scheme['name']}",
                'message': f"Changes in: {changed_fields}",
                'scheme_id': scheme['id'],
                'scheme_name': scheme['name'],
                'category': scheme['category'],
                'timestamp': timestamp,
                'read': False,
                'action_url': f"/govt-schemes?scheme={scheme['id']}"
            })
        
        # Deadline approaching notifications
        for scheme in changes['deadline_approaching']:
            if scheme['id'] not in [s['id'] for s in changes['new']]:  # Don't duplicate
                notifications.append({
                    'id': f"deadline_{scheme['id']}_{datetime.now().timestamp()}",
                    'type': 'deadline_approaching',
                    'priority': 'urgent',
                    'title': f"⏰ Deadline Approaching: {scheme['name']}",
                    'message': f"Apply before: {scheme['deadline']}",
                    'scheme_id': scheme['id'],
                    'scheme_name': scheme['name'],
                    'category': scheme['category'],
                    'timestamp': timestamp,
                    'read': False,
                'action_url': f"/govt-schemes?scheme={scheme['id']}"
            })
        
        return notifications
    
    def save_notifications(self, notifications: List[Dict]):
        """Save notifications to file"""
        try:
            # Load existing notifications
            existing = []
            if self.notifications_file.exists():
                with open(self.notifications_file, 'r', encoding='utf-8') as f:
                    existing = json.load(f)
            
            # Append new notifications
            all_notifications = existing + notifications
            
            # Keep only last 100 notifications
            all_notifications = all_notifications[-100:]
            
            with open(self.notifications_file, 'w', encoding='utf-8') as f:
                json.dump(all_notifications, f, ensure_ascii=False, indent=2)
            
            print(f"[OK] Saved {len(notifications)} new notifications")
        except Exception as e:
            print(f"Error saving notifications: {e}")
    
    def get_notifications(self, unread_only: bool = False, limit: int = 50) -> List[Dict]:
        """Get notifications for display"""
        try:
            if self.notifications_file.exists():
                with open(self.notifications_file, 'r', encoding='utf-8') as f:
                    notifications = json.load(f)
                
                if unread_only:
                    notifications = [n for n in notifications if not n.get('read', False)]
                
                # Sort by timestamp (newest first)
                notifications.sort(key=lambda x: x['timestamp'], reverse=True)
                
                return notifications[:limit]
        except Exception as e:
            print(f"Error loading notifications: {e}")
        return []
    
    def mark_as_read(self, notification_id: str):
        """Mark a notification as read"""
        try:
            if self.notifications_file.exists():
                with open(self.notifications_file, 'r', encoding='utf-8') as f:
                    notifications = json.load(f)
                
                for notif in notifications:
                    if notif['id'] == notification_id:
                        notif['read'] = True
                
                with open(self.notifications_file, 'w', encoding='utf-8') as f:
                    json.dump(notifications, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error marking notification as read: {e}")
    
    def mark_all_as_read(self):
        """Mark all notifications as read"""
        try:
            if self.notifications_file.exists():
                with open(self.notifications_file, 'r', encoding='utf-8') as f:
                    notifications = json.load(f)
                
                for notif in notifications:
                    notif['read'] = True
                
                with open(self.notifications_file, 'w', encoding='utf-8') as f:
                    json.dump(notifications, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error marking all notifications as read: {e}")
    
    def get_unread_count(self) -> int:
        """Get count of unread notifications"""
        notifications = self.get_notifications(unread_only=True)
        return len(notifications)
    
    def update_last_check_time(self):
        """Update the last check timestamp"""
        try:
            data = {
                'last_check': datetime.now().isoformat(),
                'next_check': datetime.now().isoformat()  # Will be updated by scheduler
            }
            with open(self.last_update_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Error updating last check time: {e}")
    
    def get_last_check_time(self) -> str:
        """Get the last check timestamp"""
        try:
            if self.last_update_file.exists():
                with open(self.last_update_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data.get('last_check', 'Never')
        except Exception as e:
            print(f"Error reading last check time: {e}")
        return 'Never'
    
    def create_order_notification(self, order_id: str, old_status: str, new_status: str, 
                                   consumer_email: str, tracking_id: str = None) -> Dict:
        """
        Create notification for order status change
        """
        # Status emojis
        status_emojis = {
            'Pending': '⏳',
            'Confirmed': '✅',
            'Packed': '📦',
            'In Transit': '🚚',
            'Out for Delivery': '🏃',
            'Delivered': '✅'
        }
        
        # Status messages
        status_messages = {
            'Confirmed': 'Your order has been confirmed by the farmer!',
            'Packed': 'Your order is packed and ready to ship!',
            'In Transit': f'Your order is on the way! Track it with ID: {tracking_id}' if tracking_id else 'Your order is on the way!',
            'Out for Delivery': 'Your order is out for delivery today!',
            'Delivered': 'Your order has been delivered! Please rate your experience.'
        }
        
        emoji = status_emojis.get(new_status, '📋')
        message = status_messages.get(new_status, f'Order status updated to {new_status}')
        
        notification = {
            'id': f"order_{order_id}_{datetime.now().timestamp()}",
            'type': 'order_update',
            'priority': 'high' if new_status == 'Delivered' else 'medium',
            'title': f"{emoji} Order {order_id[:12]}: {new_status}",
            'message': message,
            'order_id': order_id,
            'status': new_status,
            'tracking_id': tracking_id,
            'consumer_email': consumer_email,
            'timestamp': datetime.now().isoformat(),
            'read': False,
            'action_url': f"/consumer-dashboard?order={order_id}"
        }
        
        # Save notification
        self.save_notifications([notification])
        
        return notification


# Example usage
if __name__ == "__main__":
    tracker = SchemeUpdateTracker()
    
    # Simulate some schemes
    schemes = [
        {
            'id': '1',
            'name': 'PM-KISAN',
            'description': 'Direct income support',
            'category': 'Financial Support',
            'deadline': 'Ongoing',
            'benefits': '₹6,000 per year'
        }
    ]
    
    # Detect changes
    changes = tracker.detect_changes(schemes)
    
    # Create notifications
    notifications = tracker.create_notifications(changes)
    
    # Save
    tracker.save_current_schemes(schemes)
    tracker.save_notifications(notifications)
    
    print(f"\nGenerated {len(notifications)} notifications")

