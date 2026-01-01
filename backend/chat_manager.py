"""
Chat System Manager for AgriChain
Handles message storage, retrieval, and conversation management
"""

import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
from collections import defaultdict

class ChatManager:
    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        self.messages_file = self.data_dir / "chat_messages.json"
        self.conversations_file = self.data_dir / "conversations.json"
        
        # Initialize files if they don't exist
        if not self.messages_file.exists():
            self._save_messages([])
        if not self.conversations_file.exists():
            self._save_conversations({})
    
    def _load_messages(self) -> List[Dict]:
        """Load all messages from JSON file"""
        try:
            with open(self.messages_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"[ERROR] Failed to load messages: {e}")
            return []
    
    def _save_messages(self, messages: List[Dict]):
        """Save all messages to JSON file"""
        try:
            with open(self.messages_file, 'w', encoding='utf-8') as f:
                json.dump(messages, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[ERROR] Failed to save messages: {e}")
    
    def _load_conversations(self) -> Dict:
        """Load conversations index"""
        try:
            with open(self.conversations_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"[ERROR] Failed to load conversations: {e}")
            return {}
    
    def _save_conversations(self, conversations: Dict):
        """Save conversations index"""
        try:
            with open(self.conversations_file, 'w', encoding='utf-8') as f:
                json.dump(conversations, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[ERROR] Failed to save conversations: {e}")
    
    def _get_conversation_id(self, user1_email: str, user2_email: str) -> str:
        """Generate consistent conversation ID for two users"""
        # Sort emails to ensure same conversation ID regardless of order
        emails = sorted([user1_email, user2_email])
        return f"{emails[0]}___{emails[1]}"
    
    def send_message(self, sender_email: str, sender_name: str, 
                    receiver_email: str, receiver_name: str, 
                    message: str) -> Dict:
        """
        Send a message from sender to receiver
        Returns the created message object
        """
        messages = self._load_messages()
        conversations = self._load_conversations()
        
        conversation_id = self._get_conversation_id(sender_email, receiver_email)
        
        # Create message object
        new_message = {
            "message_id": f"MSG-{len(messages) + 1:06d}",
            "conversation_id": conversation_id,
            "sender_email": sender_email,
            "sender_name": sender_name,
            "receiver_email": receiver_email,
            "receiver_name": receiver_name,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "read": False
        }
        
        # Add message
        messages.append(new_message)
        self._save_messages(messages)
        
        # Update conversations index
        if conversation_id not in conversations:
            conversations[conversation_id] = {
                "participants": [
                    {"email": sender_email, "name": sender_name},
                    {"email": receiver_email, "name": receiver_name}
                ],
                "last_message": message[:50],
                "last_message_time": new_message["timestamp"],
                "unread_count": {sender_email: 0, receiver_email: 1}
            }
        else:
            conversations[conversation_id]["last_message"] = message[:50]
            conversations[conversation_id]["last_message_time"] = new_message["timestamp"]
            # Increment unread count for receiver
            conversations[conversation_id]["unread_count"][receiver_email] = \
                conversations[conversation_id]["unread_count"].get(receiver_email, 0) + 1
        
        self._save_conversations(conversations)
        
        print(f"[CHAT] Message sent: {sender_name} → {receiver_name}")
        return new_message
    
    def get_conversation_history(self, user1_email: str, user2_email: str, 
                                 limit: int = 100) -> List[Dict]:
        """
        Get chat history between two users
        Returns list of messages sorted by timestamp
        """
        messages = self._load_messages()
        conversation_id = self._get_conversation_id(user1_email, user2_email)
        
        # Filter messages for this conversation
        conversation_messages = [
            msg for msg in messages 
            if msg.get("conversation_id") == conversation_id
        ]
        
        # Sort by timestamp (newest first) and limit
        conversation_messages.sort(key=lambda x: x["timestamp"], reverse=True)
        return conversation_messages[:limit][::-1]  # Reverse to show oldest first
    
    def get_user_conversations(self, user_email: str) -> List[Dict]:
        """
        Get all conversations for a user
        Returns list of conversations with last message
        """
        conversations = self._load_conversations()
        
        user_conversations = []
        for conv_id, conv_data in conversations.items():
            # Check if user is part of this conversation
            participant_emails = [p["email"] for p in conv_data["participants"]]
            if user_email in participant_emails:
                # Find the other participant
                other_participant = next(
                    p for p in conv_data["participants"] 
                    if p["email"] != user_email
                )
                
                user_conversations.append({
                    "conversation_id": conv_id,
                    "other_user": other_participant,
                    "last_message": conv_data["last_message"],
                    "last_message_time": conv_data["last_message_time"],
                    "unread_count": conv_data["unread_count"].get(user_email, 0)
                })
        
        # Sort by last message time (newest first)
        user_conversations.sort(key=lambda x: x["last_message_time"], reverse=True)
        return user_conversations
    
    def mark_as_read(self, user_email: str, conversation_id: str):
        """Mark all messages in a conversation as read for a user"""
        messages = self._load_messages()
        conversations = self._load_conversations()
        
        # Mark messages as read
        updated = False
        for msg in messages:
            if (msg.get("conversation_id") == conversation_id and 
                msg.get("receiver_email") == user_email and 
                not msg.get("read")):
                msg["read"] = True
                updated = True
        
        if updated:
            self._save_messages(messages)
        
        # Reset unread count
        if conversation_id in conversations:
            conversations[conversation_id]["unread_count"][user_email] = 0
            self._save_conversations(conversations)
    
    def get_unread_count(self, user_email: str) -> int:
        """Get total unread message count for a user"""
        conversations = self._load_conversations()
        total_unread = 0
        
        for conv_data in conversations.values():
            total_unread += conv_data.get("unread_count", {}).get(user_email, 0)
        
        return total_unread
    
    def search_messages(self, user_email: str, search_query: str) -> List[Dict]:
        """Search messages for a user"""
        messages = self._load_messages()
        
        # Get all conversations involving this user
        user_messages = [
            msg for msg in messages
            if msg.get("sender_email") == user_email or 
               msg.get("receiver_email") == user_email
        ]
        
        # Filter by search query
        search_query = search_query.lower()
        results = [
            msg for msg in user_messages
            if search_query in msg.get("message", "").lower() or
               search_query in msg.get("sender_name", "").lower() or
               search_query in msg.get("receiver_name", "").lower()
        ]
        
        results.sort(key=lambda x: x["timestamp"], reverse=True)
        return results
    
    def delete_conversation(self, user1_email: str, user2_email: str) -> bool:
        """Delete entire conversation between two users"""
        messages = self._load_messages()
        conversations = self._load_conversations()
        
        conversation_id = self._get_conversation_id(user1_email, user2_email)
        
        # Remove messages
        messages = [
            msg for msg in messages 
            if msg.get("conversation_id") != conversation_id
        ]
        self._save_messages(messages)
        
        # Remove conversation
        if conversation_id in conversations:
            del conversations[conversation_id]
            self._save_conversations(conversations)
            return True
        
        return False


# Singleton instance
chat_manager = ChatManager()


if __name__ == "__main__":
    # Test chat system
    print("Testing Chat Manager...")
    
    # Send test messages
    chat_manager.send_message(
        "farmer@test.com", "Farmer John",
        "consumer@test.com", "Consumer Jane",
        "Hello! I have fresh tomatoes available."
    )
    
    chat_manager.send_message(
        "consumer@test.com", "Consumer Jane",
        "farmer@test.com", "Farmer John",
        "Great! How much per kg?"
    )
    
    # Get conversation history
    history = chat_manager.get_conversation_history("farmer@test.com", "consumer@test.com")
    print(f"\nConversation History: {len(history)} messages")
    for msg in history:
        print(f"  {msg['sender_name']}: {msg['message']}")
    
    # Get user conversations
    conversations = chat_manager.get_user_conversations("farmer@test.com")
    print(f"\nFarmer's Conversations: {len(conversations)}")
    
    print("\n[OK] Chat Manager working correctly!")

