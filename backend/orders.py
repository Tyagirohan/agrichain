"""
Order Management System
Handles order creation, tracking, and management
"""

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Optional
import random

class OrderManager:
    """
    Manages orders between farmers and consumers
    """
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        self.orders_file = self.data_dir / "orders.json"
        
        # Initialize with demo orders if needed
        if not self.orders_file.exists():
            self._create_demo_orders()
    
    def _create_demo_orders(self):
        """Create demo orders for testing"""
        now = datetime.now()
        demo_orders = [
            {
                "order_id": "ORD-2025-001",
                "consumer_id": "consumer_1",
                "consumer_name": "Priya Sharma",
                "consumer_phone": "+91 9876543211",
                "farmer_id": "farmer_1",
                "farmer_name": "Rajan Singh",
                "farmer_phone": "+91 9876543210",
                "product_id": "tomato_organic",
                "product_name": "Organic Tomatoes",
                "quantity": 5,
                "unit": "kg",
                "price_per_unit": 60,
                "total_amount": 300,
                "payment_method": "COD",
                "payment_status": "pending",
                "order_status": "confirmed",
                "delivery_address": "123 Green Street, New Delhi, 110001",
                "farm_location": "Village Farm, Punjab",
                "order_date": (now - timedelta(days=2)).isoformat(),
                "expected_delivery": (now + timedelta(days=3)).isoformat(),
                "tracking_id": "AGR-2025-TRACK001",
                "tracking_updates": [
                    {
                        "status": "Order Placed",
                        "timestamp": (now - timedelta(days=2)).isoformat(),
                        "location": "Online",
                        "description": "Payment confirmed, order placed successfully"
                    },
                    {
                        "status": "Confirmed by Farmer",
                        "timestamp": (now - timedelta(days=2, hours=-1)).isoformat(),
                        "location": "Village Farm, Punjab",
                        "description": "Farmer confirmed the order"
                    },
                    {
                        "status": "Packed",
                        "timestamp": (now - timedelta(days=1)).isoformat(),
                        "location": "Village Farm, Punjab",
                        "description": "Product packed and ready for pickup"
                    }
                ],
                "rating": None,
                "review": None
            },
            {
                "order_id": "ORD-2025-002",
                "consumer_id": "consumer_1",
                "consumer_name": "Priya Sharma",
                "consumer_phone": "+91 9876543211",
                "farmer_id": "farmer_1",
                "farmer_name": "Rajan Singh",
                "farmer_phone": "+91 9876543210",
                "product_id": "rice_premium",
                "product_name": "Premium Basmati Rice",
                "quantity": 10,
                "unit": "kg",
                "price_per_unit": 120,
                "total_amount": 1200,
                "payment_method": "Online",
                "payment_status": "paid",
                "order_status": "delivered",
                "delivery_address": "123 Green Street, New Delhi, 110001",
                "farm_location": "Village Farm, Punjab",
                "order_date": (now - timedelta(days=15)).isoformat(),
                "expected_delivery": (now - timedelta(days=10)).isoformat(),
                "delivered_date": (now - timedelta(days=10)).isoformat(),
                "tracking_id": "AGR-2025-TRACK002",
                "tracking_updates": [
                    {
                        "status": "Order Placed",
                        "timestamp": (now - timedelta(days=15)).isoformat(),
                        "location": "Online",
                        "description": "Payment confirmed, order placed successfully"
                    },
                    {
                        "status": "Delivered",
                        "timestamp": (now - timedelta(days=10)).isoformat(),
                        "location": "New Delhi",
                        "description": "Successfully delivered to customer"
                    }
                ],
                "rating": 5,
                "review": "Excellent quality rice! Very fresh."
            }
        ]
        
        self._save_orders(demo_orders)
        print("[ORDERS] Created 2 demo orders")
    
    def _load_orders(self) -> List[Dict]:
        """Load orders from file"""
        try:
            with open(self.orders_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading orders: {e}")
            return []
    
    def _save_orders(self, orders: List[Dict]):
        """Save orders to file"""
        try:
            with open(self.orders_file, 'w', encoding='utf-8') as f:
                json.dump(orders, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error saving orders: {e}")
    
    def create_order(self, consumer_id: str, consumer_name: str, consumer_phone: str,
                    farmer_id: str, farmer_name: str, farmer_phone: str,
                    product_id: str, product_name: str, quantity: int, unit: str,
                    price_per_unit: float, delivery_address: str, farm_location: str,
                    payment_method: str = "COD", tracking_id: str = None) -> Dict:
        """Create a new order"""
        orders = self._load_orders()
        
        # Generate order ID
        order_number = len(orders) + 1
        order_id = f"ORD-2025-{order_number:03d}"
        
        # Generate tracking ID if not provided
        if not tracking_id:
            tracking_id = f"AGR-2025-{random.randint(100000, 999999)}"
        
        total_amount = quantity * price_per_unit
        now = datetime.now()
        
        new_order = {
            "order_id": order_id,
            "consumer_id": consumer_id,
            "consumer_name": consumer_name,
            "consumer_phone": consumer_phone,
            "farmer_id": farmer_id,
            "farmer_name": farmer_name,
            "farmer_phone": farmer_phone,
            "product_id": product_id,
            "product_name": product_name,
            "quantity": quantity,
            "unit": unit,
            "price_per_unit": price_per_unit,
            "total_amount": total_amount,
            "payment_method": payment_method,
            "payment_status": "paid" if payment_method == "Online" else "pending",
            "order_status": "pending",
            "delivery_address": delivery_address,
            "farm_location": farm_location,
            "order_date": now.isoformat(),
            "expected_delivery": (now + timedelta(days=5)).isoformat(),
            "tracking_id": tracking_id,
            "tracking_updates": [
                {
                    "status": "Order Placed",
                    "timestamp": now.isoformat(),
                    "location": "Online",
                    "description": "Order placed successfully. Awaiting farmer confirmation."
                }
            ],
            "rating": None,
            "review": None
        }
        
        orders.append(new_order)
        self._save_orders(orders)
        
        return new_order
    
    def get_order_by_id(self, order_id: str) -> Optional[Dict]:
        """Get order by ID"""
        orders = self._load_orders()
        for order in orders:
            if order['order_id'] == order_id:
                return order
        return None
    
    def get_orders_by_consumer(self, consumer_id: str) -> List[Dict]:
        """Get all orders for a consumer"""
        orders = self._load_orders()
        return [o for o in orders if o['consumer_id'] == consumer_id]
    
    def get_orders_by_farmer(self, farmer_id: str) -> List[Dict]:
        """Get all orders for a farmer"""
        orders = self._load_orders()
        return [o for o in orders if o['farmer_id'] == farmer_id]
    
    def update_order_status(self, order_id: str, new_status: str, 
                           location: str = "", description: str = "") -> bool:
        """Update order status with tracking"""
        orders = self._load_orders()
        
        for i, order in enumerate(orders):
            if order['order_id'] == order_id:
                orders[i]['order_status'] = new_status
                
                # Add tracking update
                tracking_update = {
                    "status": new_status.title(),
                    "timestamp": datetime.now().isoformat(),
                    "location": location or order['farm_location'],
                    "description": description or f"Order status updated to {new_status}"
                }
                orders[i]['tracking_updates'].append(tracking_update)
                
                # Update delivered date if delivered
                if new_status == "delivered":
                    orders[i]['delivered_date'] = datetime.now().isoformat()
                    orders[i]['payment_status'] = "paid"
                
                self._save_orders(orders)
                return True
        
        return False
    
    def add_rating_review(self, order_id: str, rating: int, review: str = "") -> bool:
        """Add rating and review to order"""
        orders = self._load_orders()
        
        for i, order in enumerate(orders):
            if order['order_id'] == order_id:
                orders[i]['rating'] = rating
                orders[i]['review'] = review
                self._save_orders(orders)
                return True
        
        return False
    
    def get_farmer_stats(self, farmer_id: str) -> Dict:
        """Get statistics for a farmer"""
        orders = self.get_orders_by_farmer(farmer_id)
        
        total_orders = len(orders)
        completed_orders = len([o for o in orders if o['order_status'] == 'delivered'])
        pending_orders = len([o for o in orders if o['order_status'] != 'delivered'])
        total_earnings = sum(o['total_amount'] for o in orders if o['payment_status'] == 'paid')
        
        # Calculate average rating
        rated_orders = [o for o in orders if o['rating'] is not None]
        avg_rating = sum(o['rating'] for o in rated_orders) / len(rated_orders) if rated_orders else 0
        
        return {
            "total_orders": total_orders,
            "completed_orders": completed_orders,
            "pending_orders": pending_orders,
            "total_earnings": total_earnings,
            "average_rating": round(avg_rating, 1),
            "total_reviews": len(rated_orders)
        }
    
    def get_consumer_stats(self, consumer_id: str) -> Dict:
        """Get statistics for a consumer"""
        orders = self.get_orders_by_consumer(consumer_id)
        
        total_orders = len(orders)
        active_orders = len([o for o in orders if o['order_status'] not in ['delivered', 'cancelled']])
        completed_orders = len([o for o in orders if o['order_status'] == 'delivered'])
        total_spent = sum(o['total_amount'] for o in orders if o['payment_status'] == 'paid')
        
        return {
            "total_orders": total_orders,
            "active_orders": active_orders,
            "completed_orders": completed_orders,
            "total_spent": total_spent
        }


# Global instance
order_manager = OrderManager()


if __name__ == "__main__":
    # Test order system
    print("Testing order management system...")
    
    # Get farmer stats
    stats = order_manager.get_farmer_stats("farmer_1")
    print(f"\n[STATS] Farmer 1 stats:")
    print(f"  Orders: {stats['total_orders']}")
    print(f"  Earnings: ₹{stats['total_earnings']}")
    print(f"  Rating: {stats['average_rating']}★")
    
    # Get consumer stats
    stats = order_manager.get_consumer_stats("consumer_1")
    print(f"\n[STATS] Consumer 1 stats:")
    print(f"  Orders: {stats['total_orders']}")
    print(f"  Spent: ₹{stats['total_spent']}")

