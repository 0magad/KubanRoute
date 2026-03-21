from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


# === Enums ===

class PlaceType(str, Enum):
    farm = "farm"
    winery = "winery"
    guesthouse = "guesthouse"
    craft = "craft"
    nature = "nature"
    festival = "festival"
    route = "route"
    restaurant = "restaurant"


class PlaceStatus(str, Enum):
    approved = "approved"
    pending = "pending"
    rejected = "rejected"


# === Request Models ===

class UserProfile(BaseModel):
    group_type: str = Field(..., description="solo / couple / family / company / elderly")
    days: str = Field(..., description="1-2 / 3-5 / 7+")
    budget: str = Field(..., description="low / medium / high")
    interests: list[str] = Field(..., description="List of interests: wine, nature, history, etc.")
    transport: str = Field(..., description="yes / no / rent")


class BusinessSubmission(BaseModel):
    name: str
    type: str
    address: str
    short_description: str
    seasons: list[int] = []
    price: Optional[str] = None
    is_free: bool = False
    phone: Optional[str] = None
    website: Optional[str] = None
    has_public_transport: bool = False
    audience_tags: list[str] = []
    email: str
    comments: Optional[str] = None


# === Data Models ===

class Place(BaseModel):
    id: str
    name: str
    type: PlaceType
    description: str = ""
    short_description: str = ""
    lat: float
    lng: float
    address: str = ""
    region: str = ""
    tags: list[str] = []
    seasons: list[int] = []
    price_min: int = 0
    price_max: int = 0
    has_car_required: bool = False
    working_hours: dict = {}
    photos: list[str] = []
    contacts: dict = {}
    status: PlaceStatus = PlaceStatus.approved


class RoutePlace(BaseModel):
    """Place as it appears in a route day"""
    id: str
    name: str
    type: str
    short_description: str = ""
    lat: float
    lng: float
    time_start: str = ""
    time_end: str = ""
    price_min: int = 0
    price_max: int = 0
    tags: list[str] = []
    photos: list[str] = []


class RouteDay(BaseModel):
    day_number: int
    title: str = ""
    description: str = ""
    places: list[RoutePlace] = []


class RouteMeta(BaseModel):
    days: int
    budget: str
    group_type: str
    interests: list[str]


class RouteLogistics(BaseModel):
    transport: str = ""
    accommodation: str = ""
    food: str = ""


class GeneratedRoute(BaseModel):
    id: str
    share_token: str
    title: str
    intro: str
    profile: dict = {}
    meta: RouteMeta
    days: list[RouteDay]
    logistics: RouteLogistics


class CurrentUser(BaseModel):
    id: str
    email: str | None = None

class ChatMessage(BaseModel):
    text: str