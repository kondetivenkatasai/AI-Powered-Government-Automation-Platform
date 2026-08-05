import logging
from typing import Dict, Any

logger = logging.getLogger("GovFlowNotification")

class NotificationService:
    @staticmethod
    def send_notification(
        user_email: str,
        user_phone: str,
        application_number: str,
        event_type: str, # 'SUBMITTED', 'AI_VERIFIED', 'APPROVED', 'REJECTED'
        details: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Multi-channel notification dispatcher simulating Email, SMS, and Portal Push Alerts.
        """
        details = details or {}
        messages = {
            "SUBMITTED": f"Application #{application_number} received. Automated AI verification initiated.",
            "AI_VERIFIED": f"AI evaluation completed for #{application_number}. Routed to department officer for final sign-off.",
            "APPROVED": f"Congratulations! Application #{application_number} has been APPROVED. Your digital certificate is ready in your portal.",
            "REJECTED": f"Update on Application #{application_number}: Decision recorded. Reason: {details.get('reason', 'Eligibility rules not met.')}"
        }

        body = messages.get(event_type, f"Status update for Application #{application_number}")
        
        # Log simulated dispatches
        print(f"[SMS DISPATCH] To: {user_phone or 'Registered Mobile'} | Text: {body}")
        print(f"[EMAIL DISPATCH] To: {user_email} | Subject: GovFlow Alert - {event_type} | Body: {body}")

        return {
            "status": "SENT",
            "channels": ["EMAIL", "SMS", "PORTAL"],
            "application_number": application_number,
            "event_type": event_type,
            "message": body
        }

notification_service = NotificationService()
