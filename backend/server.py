from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 72

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Enums
class UserRole(str, Enum):
    PUBLIC = "public"
    REPORTER = "reporter"
    EDITOR = "editor"
    ADMIN = "admin"

class ArticleStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    PUBLISHED = "published"
    REJECTED = "rejected"

class SourceType(str, Enum):
    URL = "url"
    PDF_LINK = "pdf_link"

# Models
class UserProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: UserRole = UserRole.PUBLIC
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole = UserRole.REPORTER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name_hi: str
    name_en: str
    slug: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CategoryCreate(BaseModel):
    name_hi: str
    name_en: str
    slug: str

class ArticleSource(BaseModel):
    source_type: SourceType
    source_url: str
    description: Optional[str] = None

class Article(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    slug: str
    content: str
    category_id: str
    author_id: str
    author_name: str
    status: ArticleStatus = ArticleStatus.DRAFT
    sources: List[ArticleSource] = []
    scheduled_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ArticleCreate(BaseModel):
    title: str
    content: str
    category_id: str
    sources: List[ArticleSource] = []

class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category_id: Optional[str] = None
    sources: Optional[List[ArticleSource]] = None

class ReviewLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    article_id: str
    reviewer_id: str
    reviewer_name: str
    action: str
    comment: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReviewAction(BaseModel):
    comment: Optional[str] = None

# Helper Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        'user_id': user_id,
        'exp': expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserProfile:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        
        user_doc = await db.users.find_one({'id': user_id}, {'_id': 0, 'password': 0})
        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")
        
        return UserProfile(**user_doc)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_role(required_roles: List[UserRole]):
    async def role_checker(user: UserProfile = Depends(get_current_user)) -> UserProfile:
        if user.role not in required_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker

# Initialize default data
async def initialize_defaults():
    # Create default admin if no users exist
    user_count = await db.users.count_documents({})
    if user_count == 0:
        admin_user = {
            'id': str(uuid.uuid4()),
            'email': 'admin@newsflow.com',
            'password': hash_password('admin123'),
            'name': 'Admin',
            'role': UserRole.ADMIN,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
        logger.info("Default admin created: admin@newsflow.com / admin123")
    
    # Create default categories
    category_count = await db.categories.count_documents({})
    if category_count == 0:
        default_categories = [
            {'id': str(uuid.uuid4()), 'name_hi': 'वेतन / भत्ता', 'name_en': 'Salary / Allowance', 'slug': 'salary-allowance', 'created_at': datetime.now(timezone.utc).isoformat()},
            {'id': str(uuid.uuid4()), 'name_hi': 'स्थानांतरण', 'name_en': 'Transfers', 'slug': 'transfers', 'created_at': datetime.now(timezone.utc).isoformat()},
            {'id': str(uuid.uuid4()), 'name_hi': 'सेवा नियम', 'name_en': 'Service Rules', 'slug': 'service-rules', 'created_at': datetime.now(timezone.utc).isoformat()},
            {'id': str(uuid.uuid4()), 'name_hi': 'न्यायालय आदेश', 'name_en': 'Court Orders', 'slug': 'court-orders', 'created_at': datetime.now(timezone.utc).isoformat()},
            {'id': str(uuid.uuid4()), 'name_hi': 'चुनाव ड्यूटी', 'name_en': 'Election Duty', 'slug': 'election-duty', 'created_at': datetime.now(timezone.utc).isoformat()},
            {'id': str(uuid.uuid4()), 'name_hi': 'शिक्षा नीति', 'name_en': 'Education Policy', 'slug': 'education-policy', 'created_at': datetime.now(timezone.utc).isoformat()},
        ]
        await db.categories.insert_many(default_categories)
        logger.info(f"Created {len(default_categories)} default categories")

# Auth Routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({'email': user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = UserProfile(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role
    )
    
    user_doc = user.model_dump()
    user_doc['password'] = hash_password(user_data.password)
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    
    await db.users.insert_one(user_doc)
    
    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=user)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({'email': credentials.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_doc.pop('password')
    user_doc.pop('_id')
    user = UserProfile(**user_doc)
    
    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=user)

@api_router.get("/auth/me", response_model=UserProfile)
async def get_me(user: UserProfile = Depends(get_current_user)):
    return user

# Category Routes
@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find({}, {'_id': 0}).to_list(100)
    for cat in categories:
        if isinstance(cat['created_at'], str):
            cat['created_at'] = datetime.fromisoformat(cat['created_at'])
    return categories

@api_router.post("/categories", response_model=Category)
async def create_category(category_data: CategoryCreate, user: UserProfile = Depends(require_role([UserRole.ADMIN]))):
    category = Category(**category_data.model_dump())
    cat_doc = category.model_dump()
    cat_doc['created_at'] = cat_doc['created_at'].isoformat()
    await db.categories.insert_one(cat_doc)
    return category

# Article Routes - Public
@api_router.get("/articles", response_model=List[Article])
async def get_published_articles(category_id: Optional[str] = None, skip: int = 0, limit: int = 10):
    query = {'status': ArticleStatus.PUBLISHED}
    if category_id:
        query['category_id'] = category_id
    
    articles = await db.articles.find(query, {'_id': 0}).sort('published_at', -1).skip(skip).limit(limit).to_list(limit)
    
    for article in articles:
        for field in ['created_at', 'updated_at', 'published_at', 'scheduled_at']:
            if field in article and isinstance(article[field], str):
                article[field] = datetime.fromisoformat(article[field])
    
    return articles

@api_router.get("/articles/{slug}", response_model=Article)
async def get_article_by_slug(slug: str):
    article = await db.articles.find_one({'slug': slug, 'status': ArticleStatus.PUBLISHED}, {'_id': 0})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    for field in ['created_at', 'updated_at', 'published_at', 'scheduled_at']:
        if field in article and isinstance(article[field], str):
            article[field] = datetime.fromisoformat(article[field])
    
    return Article(**article)

# Article Routes - Reporter
@api_router.post("/articles", response_model=Article)
async def create_article(article_data: ArticleCreate, user: UserProfile = Depends(require_role([UserRole.REPORTER, UserRole.EDITOR, UserRole.ADMIN]))):
    # Validate category exists
    category = await db.categories.find_one({'id': article_data.category_id})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Generate slug from title (using UUID for simplicity to avoid encoding issues)
    slug = 'article-' + str(uuid.uuid4())[:12]
    
    article = Article(
        title=article_data.title,
        slug=slug,
        content=article_data.content,
        category_id=article_data.category_id,
        author_id=user.id,
        author_name=user.name,
        sources=article_data.sources
    )
    
    article_doc = article.model_dump()
    article_doc['created_at'] = article_doc['created_at'].isoformat()
    article_doc['updated_at'] = article_doc['updated_at'].isoformat()
    
    await db.articles.insert_one(article_doc)
    return article

@api_router.get("/my-articles", response_model=List[Article])
async def get_my_articles(user: UserProfile = Depends(require_role([UserRole.REPORTER, UserRole.EDITOR, UserRole.ADMIN]))):
    articles = await db.articles.find({'author_id': user.id}, {'_id': 0}).sort('created_at', -1).to_list(100)
    
    for article in articles:
        for field in ['created_at', 'updated_at', 'published_at', 'scheduled_at']:
            if field in article and isinstance(article[field], str):
                article[field] = datetime.fromisoformat(article[field])
    
    return articles

@api_router.put("/articles/{article_id}", response_model=Article)
async def update_article(article_id: str, article_data: ArticleUpdate, user: UserProfile = Depends(get_current_user)):
    article = await db.articles.find_one({'id': article_id}, {'_id': 0})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Only author can edit if draft/rejected, editor can edit any
    if user.role == UserRole.REPORTER and article['author_id'] != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if user.role == UserRole.REPORTER and article['status'] not in [ArticleStatus.DRAFT, ArticleStatus.REJECTED]:
        raise HTTPException(status_code=403, detail="Can only edit draft or rejected articles")
    
    update_data = {k: v for k, v in article_data.model_dump(exclude_unset=True).items() if v is not None}
    if update_data:
        update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
        await db.articles.update_one({'id': article_id}, {'$set': update_data})
    
    updated_article = await db.articles.find_one({'id': article_id}, {'_id': 0})
    for field in ['created_at', 'updated_at', 'published_at', 'scheduled_at']:
        if field in updated_article and isinstance(updated_article[field], str):
            updated_article[field] = datetime.fromisoformat(updated_article[field])
    
    return Article(**updated_article)

@api_router.post("/articles/{article_id}/submit")
async def submit_article(article_id: str, user: UserProfile = Depends(require_role([UserRole.REPORTER, UserRole.EDITOR, UserRole.ADMIN]))):
    article = await db.articles.find_one({'id': article_id}, {'_id': 0})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    if article['author_id'] != user.id and user.role == UserRole.REPORTER:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if article['status'] not in [ArticleStatus.DRAFT, ArticleStatus.REJECTED]:
        raise HTTPException(status_code=400, detail="Can only submit draft or rejected articles")
    
    # Check if article has sources
    if not article.get('sources') or len(article['sources']) == 0:
        raise HTTPException(status_code=400, detail="Article must have at least one source")
    
    await db.articles.update_one({'id': article_id}, {'$set': {'status': ArticleStatus.SUBMITTED, 'updated_at': datetime.now(timezone.utc).isoformat()}})
    
    return {'message': 'Article submitted for review'}

# Article Routes - Editor
@api_router.get("/review-queue", response_model=List[Article])
async def get_review_queue(user: UserProfile = Depends(require_role([UserRole.EDITOR, UserRole.ADMIN]))):
    articles = await db.articles.find({'status': ArticleStatus.SUBMITTED}, {'_id': 0}).sort('created_at', 1).to_list(100)
    
    for article in articles:
        for field in ['created_at', 'updated_at', 'published_at', 'scheduled_at']:
            if field in article and isinstance(article[field], str):
                article[field] = datetime.fromisoformat(article[field])
    
    return articles

@api_router.post("/articles/{article_id}/approve")
async def approve_article(article_id: str, action: ReviewAction, user: UserProfile = Depends(require_role([UserRole.EDITOR, UserRole.ADMIN]))):
    article = await db.articles.find_one({'id': article_id}, {'_id': 0})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    if article['status'] != ArticleStatus.SUBMITTED:
        raise HTTPException(status_code=400, detail="Can only approve submitted articles")
    
    await db.articles.update_one(
        {'id': article_id},
        {'$set': {'status': ArticleStatus.APPROVED, 'updated_at': datetime.now(timezone.utc).isoformat()}}
    )
    
    # Log review action
    review_log = ReviewLog(
        article_id=article_id,
        reviewer_id=user.id,
        reviewer_name=user.name,
        action='approved',
        comment=action.comment
    )
    log_doc = review_log.model_dump()
    log_doc['timestamp'] = log_doc['timestamp'].isoformat()
    await db.review_logs.insert_one(log_doc)
    
    return {'message': 'Article approved'}

@api_router.post("/articles/{article_id}/reject")
async def reject_article(article_id: str, action: ReviewAction, user: UserProfile = Depends(require_role([UserRole.EDITOR, UserRole.ADMIN]))):
    article = await db.articles.find_one({'id': article_id}, {'_id': 0})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    if article['status'] != ArticleStatus.SUBMITTED:
        raise HTTPException(status_code=400, detail="Can only reject submitted articles")
    
    await db.articles.update_one(
        {'id': article_id},
        {'$set': {'status': ArticleStatus.REJECTED, 'updated_at': datetime.now(timezone.utc).isoformat()}}
    )
    
    # Log review action
    review_log = ReviewLog(
        article_id=article_id,
        reviewer_id=user.id,
        reviewer_name=user.name,
        action='rejected',
        comment=action.comment
    )
    log_doc = review_log.model_dump()
    log_doc['timestamp'] = log_doc['timestamp'].isoformat()
    await db.review_logs.insert_one(log_doc)
    
    return {'message': 'Article rejected'}

@api_router.post("/articles/{article_id}/publish")
async def publish_article(article_id: str, user: UserProfile = Depends(require_role([UserRole.EDITOR, UserRole.ADMIN]))):
    article = await db.articles.find_one({'id': article_id}, {'_id': 0})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    if article['status'] != ArticleStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Can only publish approved articles")
    
    await db.articles.update_one(
        {'id': article_id},
        {'$set': {
            'status': ArticleStatus.PUBLISHED,
            'published_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Log review action
    review_log = ReviewLog(
        article_id=article_id,
        reviewer_id=user.id,
        reviewer_name=user.name,
        action='published'
    )
    log_doc = review_log.model_dump()
    log_doc['timestamp'] = log_doc['timestamp'].isoformat()
    await db.review_logs.insert_one(log_doc)
    
    return {'message': 'Article published'}

# Admin Routes
@api_router.get("/users", response_model=List[UserProfile])
async def get_users(user: UserProfile = Depends(require_role([UserRole.ADMIN]))):
    users = await db.users.find({}, {'_id': 0, 'password': 0}).to_list(1000)
    for u in users:
        if isinstance(u['created_at'], str):
            u['created_at'] = datetime.fromisoformat(u['created_at'])
    return users

@api_router.put("/users/{user_id}/role")
async def update_user_role(user_id: str, role: UserRole, admin: UserProfile = Depends(require_role([UserRole.ADMIN]))):
    user = await db.users.find_one({'id': user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one({'id': user_id}, {'$set': {'role': role}})
    return {'message': f'User role updated to {role}'}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    await initialize_defaults()
    logger.info("NewsFlow API started successfully")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
