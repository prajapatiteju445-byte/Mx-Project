from fastapi import FastAPI, APIRouter, HTTPException, Header, Response, Cookie
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: EmailStr
    name: str
    picture: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime
    emergency_settings: Optional[Dict[str, Any]] = None

class EmergencyContact(BaseModel):
    model_config = ConfigDict(extra="ignore")
    contact_id: str = Field(default_factory=lambda: f"contact_{uuid.uuid4().hex[:12]}")
    user_id: str
    name: str
    relationship: str
    phone: str
    email: Optional[EmailStr] = None
    is_primary: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmergencyAlert(BaseModel):
    model_config = ConfigDict(extra="ignore")
    alert_id: str = Field(default_factory=lambda: f"alert_{uuid.uuid4().hex[:12]}")
    user_id: str
    type: str
    status: str
    location: Dict[str, Any]
    triggered_at: datetime
    resolved_at: Optional[datetime] = None
    contacts_notified: List[str] = Field(default_factory=list)
    evidence: Optional[List[str]] = None

class CommunityReport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    report_id: str = Field(default_factory=lambda: f"report_{uuid.uuid4().hex[:12]}")
    user_id: Optional[str] = None
    type: str
    severity: int
    location: Dict[str, Any]
    description: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    anonymous: bool = True
    status: str = "pending"

class SafetyZone(BaseModel):
    model_config = ConfigDict(extra="ignore")
    zone_id: str = Field(default_factory=lambda: f"zone_{uuid.uuid4().hex[:12]}")
    name: str
    type: str
    location: Dict[str, float]
    address: str
    contact: Optional[str] = None
    hours: str = "24/7"
    verified: bool = True
    facilities: List[str] = Field(default_factory=list)

class CreateContactRequest(BaseModel):
    name: str
    relationship: str
    phone: str
    email: Optional[EmailStr] = None
    is_primary: bool = False

class TriggerEmergencyRequest(BaseModel):
    type: str = "manual"
    location: Dict[str, Any]
    evidence: Optional[List[str]] = None

class SubmitReportRequest(BaseModel):
    type: str
    severity: int
    location: Dict[str, Any]
    description: str
    anonymous: bool = True

class FakeCallRequest(BaseModel):
    caller_name: str = "Mom"

class AnalyzeDistressRequest(BaseModel):
    text: str
    location: Optional[Dict[str, Any]] = None

# Authentication Helper
async def get_current_user(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)) -> User:
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    token = session_token or (authorization.replace("Bearer ", "") if authorization else None)
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user_doc["created_at"], str):
        user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])
    
    return User(**user_doc)

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "SafeHer API is running", "status": "healthy"}

# Auth Endpoints
@api_router.get("/auth/session")
async def exchange_session(x_session_id: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": x_session_id}
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Session exchange failed")
        
        data = response.json()
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    existing_user = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": data["name"],
                "picture": data["picture"],
                "last_active": datetime.now(timezone.utc).isoformat()
            }}
        )
    else:
        await db.users.insert_one({
            "user_id": user_id,
            "email": data["email"],
            "name": data["name"],
            "picture": data["picture"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "emergency_settings": {
                "auto_detect": True,
                "alert_contacts": True,
                "share_location": True,
                "fake_call_enabled": True
            }
        })
    
    session_token = data["session_token"]
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    })
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {**user_doc, "session_token": session_token}

@api_router.get("/auth/me")
async def get_me(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(authorization, session_token)
    return user

@api_router.post("/auth/logout")
async def logout(response: Response, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    try:
        user = await get_current_user(authorization, session_token)
        await db.user_sessions.delete_many({"user_id": user.user_id})
        response.delete_cookie("session_token", path="/")
        return {"message": "Logged out successfully"}
    except:
        raise HTTPException(status_code=401, detail="Not authenticated")

# Emergency Contacts Endpoints
@api_router.get("/emergency/contacts", response_model=List[EmergencyContact])
async def get_contacts(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    user = await get_current_user()
    contacts = await db.emergency_contacts.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    for contact in contacts:
        if isinstance(contact.get("created_at"), str):
            contact["created_at"] = datetime.fromisoformat(contact["created_at"])
    return contacts

@api_router.post("/emergency/contacts", response_model=EmergencyContact)
async def create_contact(request: CreateContactRequest, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    user = await get_current_user()
    contact = EmergencyContact(
        user_id=user.user_id,
        **request.model_dump()
    )
    doc = contact.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.emergency_contacts.insert_one(doc)
    return contact

@api_router.delete("/emergency/contacts/{contact_id}")
async def delete_contact(contact_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    user = await get_current_user()
    result = await db.emergency_contacts.delete_one({"contact_id": contact_id, "user_id": user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"message": "Contact deleted"}

# Emergency Alert Endpoints
@api_router.post("/emergency/trigger", response_model=EmergencyAlert)
async def trigger_emergency(request: TriggerEmergencyRequest, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    user = await get_current_user()
    
    contacts = await db.emergency_contacts.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    contact_ids = [c["contact_id"] for c in contacts]
    
    alert = EmergencyAlert(
        user_id=user.user_id,
        type=request.type,
        status="active",
        location=request.location,
        triggered_at=datetime.now(timezone.utc),
        contacts_notified=contact_ids,
        evidence=request.evidence
    )
    
    doc = alert.model_dump()
    doc["triggered_at"] = doc["triggered_at"].isoformat()
    await db.emergency_alerts.insert_one(doc)
    
    return alert

@api_router.get("/emergency/active", response_model=Optional[EmergencyAlert])
async def get_active_emergency(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    user = await get_current_user()
    alert = await db.emergency_alerts.find_one(
        {"user_id": user.user_id, "status": "active"},
        {"_id": 0},
        sort=[("triggered_at", -1)]
    )
    if alert:
        if isinstance(alert["triggered_at"], str):
            alert["triggered_at"] = datetime.fromisoformat(alert["triggered_at"])
        if alert.get("resolved_at") and isinstance(alert["resolved_at"], str):
            alert["resolved_at"] = datetime.fromisoformat(alert["resolved_at"])
        return EmergencyAlert(**alert)
    return None

@api_router.post("/emergency/resolve/{alert_id}")
async def resolve_emergency(alert_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    user = await get_current_user()
    result = await db.emergency_alerts.update_one(
        {"alert_id": alert_id, "user_id": user.user_id},
        {"$set": {
            "status": "resolved",
            "resolved_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Emergency resolved"}

# Community Reports Endpoints
@api_router.post("/community/reports", response_model=CommunityReport)
async def submit_report(request: SubmitReportRequest, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    user = await get_current_user()
    report = CommunityReport(
        user_id=None if request.anonymous else user.user_id,
        **request.model_dump()
    )
    doc = report.model_dump()
    doc["timestamp"] = doc["timestamp"].isoformat()
    await db.community_reports.insert_one(doc)
    return report

@api_router.get("/community/reports", response_model=List[CommunityReport])
async def get_reports(limit: int = 50):
    reports = await db.community_reports.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    for report in reports:
        if isinstance(report["timestamp"], str):
            report["timestamp"] = datetime.fromisoformat(report["timestamp"])
    return reports

# Safety Zones Endpoints
@api_router.get("/safety/zones", response_model=List[SafetyZone])
async def get_safety_zones():
    zones = await db.safety_zones.find({"verified": True}, {"_id": 0}).to_list(100)
    return zones

@api_router.post("/safety/zones/nearby")
async def get_nearby_zones(latitude: float, longitude: float, radius: float = 5000):
    zones = await db.safety_zones.find({"verified": True}, {"_id": 0}).to_list(100)
    
    # Simple distance calculation
    nearby = []
    for zone in zones:
        lat_diff = abs(zone["location"]["latitude"] - latitude)
        lng_diff = abs(zone["location"]["longitude"] - longitude)
        distance = ((lat_diff ** 2 + lng_diff ** 2) ** 0.5) * 111000  # rough conversion to meters
        
        if distance <= radius:
            zone["distance"] = round(distance)
            nearby.append(zone)
    
    nearby.sort(key=lambda x: x["distance"])
    return nearby

# Fake Call Endpoint
@api_router.post("/fake-call")
async def generate_fake_call(request: FakeCallRequest, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    user = await get_current_user()
    return {
        "caller": request.caller_name,
        "message": f"Hey {user.name.split()[0]}, just checking when you'll be home?",
        "duration": 45,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# AI Distress Detection using Gemini 3 Flash
@api_router.post("/ai/analyze-distress")
async def analyze_distress(request: AnalyzeDistressRequest, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    user = await get_current_user()
    
    try:
        chat = LlmChat(
            api_key=os.environ["EMERGENT_LLM_KEY"],
            session_id=f"distress_{user.user_id}_{uuid.uuid4().hex[:8]}",
            system_message="You are an AI assistant analyzing text for distress signals in a women's safety app. Analyze the given text and determine if it indicates distress, danger, or emergency. Respond ONLY with a JSON object containing: {\"distress_level\": (0-1 float), \"triggers\": [array of detected triggers like 'fear', 'threat', 'violence'], \"recommendation\": \"action to take\"}. Be sensitive and accurate."
        ).with_model("gemini", "gemini-3-flash-preview")
        
        user_message = UserMessage(text=f"Analyze this text for distress: {request.text}")
        response = await chat.send_message(user_message)
        
        # Parse the response
        import json
        result = json.loads(response)
        
        return {
            "distress_level": result.get("distress_level", 0),
            "triggers": result.get("triggers", []),
            "recommendation": result.get("recommendation", "Monitor situation"),
            "confidence": 0.85,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logging.error(f"AI analysis error: {e}")
        return {
            "distress_level": 0.5,
            "triggers": ["analysis_error"],
            "recommendation": "Unable to analyze, recommend manual review",
            "confidence": 0.3,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

# Seed Safety Zones
@api_router.post("/admin/seed-zones")
async def seed_safety_zones():
    zones = [
        {
            "zone_id": f"zone_{uuid.uuid4().hex[:12]}",
            "name": "Women's Police Station - Central",
            "type": "police_station",
            "location": {"latitude": 28.6139, "longitude": 77.2090},
            "address": "Connaught Place, New Delhi",
            "contact": "+91-11-23412345",
            "hours": "24/7",
            "verified": True,
            "facilities": ["police", "first_aid", "restroom"]
        },
        {
            "zone_id": f"zone_{uuid.uuid4().hex[:12]}",
            "name": "City Hospital Emergency",
            "type": "hospital",
            "location": {"latitude": 28.6280, "longitude": 77.2197},
            "address": "Kasturba Gandhi Marg, New Delhi",
            "contact": "+91-11-23345678",
            "hours": "24/7",
            "verified": True,
            "facilities": ["emergency", "trauma_care", "counseling"]
        },
        {
            "zone_id": f"zone_{uuid.uuid4().hex[:12]}",
            "name": "Safe House - NGO Support Center",
            "type": "safe_house",
            "location": {"latitude": 28.6000, "longitude": 77.2300},
            "address": "Lajpat Nagar, New Delhi",
            "contact": "+91-11-23456789",
            "hours": "24/7",
            "verified": True,
            "facilities": ["shelter", "counseling", "legal_aid"]
        }
    ]
    
    for zone in zones:
        existing = await db.safety_zones.find_one({"name": zone["name"]})
        if not existing:
            await db.safety_zones.insert_one(zone)
    
    return {"message": f"Seeded {len(zones)} safety zones"}

app.include_router(api_router)

cors_origins = os.environ.get('CORS_ORIGINS', '*')
if cors_origins == '*':
    cors_origins = ["http://localhost:3000", "https://hersafety-2.preview.emergentagent.com"]
else:
    cors_origins = cors_origins.split(',')

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()