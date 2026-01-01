"""
Delivery Management System for AgriChain
Handles delivery partner assignment, tracking, and notifications
"""

import json
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional
import uuid

class DeliveryManager:
    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        self.deliveries_file = self.data_dir / "deliveries.json"
        self.partners_file = self.data_dir / "delivery_partners.json"
        
        # Initialize files
        if not self.deliveries_file.exists():
            self._save_deliveries([])
        if not self.partners_file.exists():
            self._initialize_delivery_partners()
    
    def _load_deliveries(self) -> List[Dict]:
        """Load all deliveries"""
        try:
            with open(self.deliveries_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"[ERROR] Failed to load deliveries: {e}")
            return []
    
    def _save_deliveries(self, deliveries: List[Dict]):
        """Save deliveries"""
        try:
            with open(self.deliveries_file, 'w', encoding='utf-8') as f:
                json.dump(deliveries, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[ERROR] Failed to save deliveries: {e}")
    
    def _load_partners(self) -> List[Dict]:
        """Load delivery partners"""
        try:
            with open(self.partners_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"[ERROR] Failed to load partners: {e}")
            return []
    
    def _save_partners(self, partners: List[Dict]):
        """Save delivery partners"""
        try:
            with open(self.partners_file, 'w', encoding='utf-8') as f:
                json.dump(partners, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[ERROR] Failed to save partners: {e}")
    
    def _initialize_delivery_partners(self):
        """Initialize mock delivery partners"""
        partners = [
            {
                "partner_id": "DP001",
                "name": "Raj Kumar",
                "phone": "+91-9876543210",
                "vehicle": "Bike",
                "rating": 4.8,
                "total_deliveries": 245,
                "status": "available",
                "current_location": "Connaught Place, Delhi"
            },
            {
                "partner_id": "DP002",
                "name": "Amit Singh",
                "phone": "+91-9876543211",
                "vehicle": "Van",
                "rating": 4.6,
                "total_deliveries": 189,
                "status": "available",
                "current_location": "Karol Bagh, Delhi"
            },
            {
                "partner_id": "DP003",
                "name": "Priya Sharma",
                "phone": "+91-9876543212",
                "vehicle": "Bike",
                "rating": 4.9,
                "total_deliveries": 312,
                "status": "available",
                "current_location": "Dwarka, Delhi"
            },
            {
                "partner_id": "DP004",
                "name": "Rahul Verma",
                "phone": "+91-9876543213",
                "vehicle": "Truck",
                "rating": 4.7,
                "total_deliveries": 156,
                "status": "available",
                "current_location": "Rohini, Delhi"
            },
            {
                "partner_id": "DP005",
                "name": "Sunita Devi",
                "phone": "+91-9876543214",
                "vehicle": "Bike",
                "rating": 4.5,
                "total_deliveries": 98,
                "status": "available",
                "current_location": "Saket, Delhi"
            }
        ]
        self._save_partners(partners)
        print("[DELIVERY] Initialized 5 delivery partners")
    
    def assign_delivery_partner(self, order_id: str, pickup_location: str, 
                               delivery_location: str) -> Dict:
        """
        Assign a delivery partner to an order
        Returns delivery details with partner info
        """
        partners = self._load_partners()
        
        # Find available partner (simple random selection for demo)
        available_partners = [p for p in partners if p["status"] == "available"]
        
        if not available_partners:
            # If no one available, pick anyone (they'll be available soon)
            available_partners = partners
        
        # Select partner (preferably highest rated)
        partner = max(available_partners, key=lambda p: p["rating"])
        
        # Create delivery record
        delivery_id = f"DEL-{uuid.uuid4().hex[:8].upper()}"
        
        # Calculate estimated delivery time (random between 30 min to 4 hours)
        estimated_minutes = random.randint(30, 240)
        estimated_delivery = datetime.now() + timedelta(minutes=estimated_minutes)
        
        delivery = {
            "delivery_id": delivery_id,
            "order_id": order_id,
            "partner_id": partner["partner_id"],
            "partner_name": partner["name"],
            "partner_phone": partner["phone"],
            "partner_vehicle": partner["vehicle"],
            "partner_rating": partner["rating"],
            "pickup_location": pickup_location,
            "delivery_location": delivery_location,
            "status": "assigned",
            "estimated_delivery_time": estimated_delivery.isoformat(),
            "assigned_at": datetime.now().isoformat(),
            "tracking_updates": [
                {
                    "status": "assigned",
                    "message": f"Delivery partner {partner['name']} has been assigned",
                    "location": partner["current_location"],
                    "timestamp": datetime.now().isoformat()
                }
            ]
        }
        
        # Save delivery
        deliveries = self._load_deliveries()
        deliveries.append(delivery)
        self._save_deliveries(deliveries)
        
        # Update partner status
        partner["status"] = "on_delivery"
        self._save_partners(partners)
        
        print(f"[DELIVERY] Partner {partner['name']} assigned to order {order_id}")
        return delivery
    
    def update_delivery_status(self, delivery_id: str, new_status: str, 
                               location: Optional[str] = None, 
                               message: Optional[str] = None) -> Dict:
        """
        Update delivery status with tracking information
        Statuses: assigned → picked_up → in_transit → out_for_delivery → delivered
        """
        deliveries = self._load_deliveries()
        
        delivery = next((d for d in deliveries if d["delivery_id"] == delivery_id), None)
        
        if not delivery:
            raise ValueError(f"Delivery {delivery_id} not found")
        
        # Update status
        delivery["status"] = new_status
        delivery["updated_at"] = datetime.now().isoformat()
        
        # Default messages based on status
        status_messages = {
            "picked_up": f"Order picked up from {delivery['pickup_location']}",
            "in_transit": "Order is on the way to delivery location",
            "out_for_delivery": "Order is out for delivery. Will arrive soon!",
            "delivered": "Order delivered successfully",
            "failed": "Delivery attempt failed. Will retry.",
            "cancelled": "Delivery cancelled"
        }
        
        # Add tracking update
        update = {
            "status": new_status,
            "message": message or status_messages.get(new_status, "Status updated"),
            "location": location or delivery.get("tracking_updates", [])[-1].get("location", "Unknown"),
            "timestamp": datetime.now().isoformat()
        }
        
        delivery["tracking_updates"].append(update)
        
        # If delivered, mark completion time
        if new_status == "delivered":
            delivery["delivered_at"] = datetime.now().isoformat()
            
            # Free up delivery partner
            partners = self._load_partners()
            partner = next((p for p in partners if p["partner_id"] == delivery["partner_id"]), None)
            if partner:
                partner["status"] = "available"
                partner["total_deliveries"] += 1
                self._save_partners(partners)
        
        # Save updated deliveries
        self._save_deliveries(deliveries)
        
        print(f"[DELIVERY] {delivery_id} status updated to: {new_status}")
        return delivery
    
    def get_delivery_by_order(self, order_id: str) -> Optional[Dict]:
        """Get delivery details for an order"""
        deliveries = self._load_deliveries()
        return next((d for d in deliveries if d["order_id"] == order_id), None)
    
    def get_all_deliveries(self, partner_id: Optional[str] = None, 
                          status: Optional[str] = None) -> List[Dict]:
        """Get all deliveries, optionally filtered"""
        deliveries = self._load_deliveries()
        
        if partner_id:
            deliveries = [d for d in deliveries if d.get("partner_id") == partner_id]
        
        if status:
            deliveries = [d for d in deliveries if d.get("status") == status]
        
        # Sort by assigned_at (newest first)
        deliveries.sort(key=lambda d: d.get("assigned_at", ""), reverse=True)
        return deliveries
    
    def get_available_partners(self) -> List[Dict]:
        """Get all available delivery partners"""
        partners = self._load_partners()
        return [p for p in partners if p["status"] == "available"]
    
    def get_partner_stats(self, partner_id: str) -> Dict:
        """Get statistics for a delivery partner"""
        partners = self._load_partners()
        partner = next((p for p in partners if p["partner_id"] == partner_id), None)
        
        if not partner:
            return {}
        
        deliveries = self._load_deliveries()
        partner_deliveries = [d for d in deliveries if d["partner_id"] == partner_id]
        
        completed = len([d for d in partner_deliveries if d["status"] == "delivered"])
        active = len([d for d in partner_deliveries if d["status"] not in ["delivered", "cancelled", "failed"]])
        
        return {
            **partner,
            "completed_deliveries": completed,
            "active_deliveries": active,
            "success_rate": round((completed / len(partner_deliveries) * 100) if partner_deliveries else 0, 1)
        }
    
    def simulate_delivery_progress(self, delivery_id: str):
        """
        Simulate delivery progress through all stages
        Useful for testing
        """
        stages = [
            ("picked_up", "Order picked up from farm", 5),
            ("in_transit", "On the way to delivery location", 10),
            ("out_for_delivery", "Delivery partner nearby", 5),
            ("delivered", "Successfully delivered", 0)
        ]
        
        for status, message, delay in stages:
            self.update_delivery_status(delivery_id, status, message=message)
            print(f"  → {status}: {message}")
            if delay:
                import time
                time.sleep(delay)  # Simulate real-time delays


# Singleton instance
delivery_manager = DeliveryManager()


if __name__ == "__main__":
    # Test delivery system
    print("Testing Delivery Manager...")
    
    # Assign a delivery partner
    delivery = delivery_manager.assign_delivery_partner(
        order_id="ORD-123456",
        pickup_location="Green Farm, Rohtak",
        delivery_location="Sector 18, Noida"
    )
    
    print(f"\n✅ Delivery assigned: {delivery['delivery_id']}")
    print(f"   Partner: {delivery['partner_name']}")
    print(f"   Phone: {delivery['partner_phone']}")
    print(f"   Vehicle: {delivery['partner_vehicle']}")
    print(f"   ETA: {delivery['estimated_delivery_time']}")
    
    # Simulate delivery progress
    print("\n🚚 Simulating delivery progress...")
    delivery_manager.simulate_delivery_progress(delivery['delivery_id'])
    
    print("\n[OK] Delivery Manager working correctly!")

