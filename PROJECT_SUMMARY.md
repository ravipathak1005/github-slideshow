# NewsFlow - शिक्षक समाचार

## 📰 Project Overview

**NewsFlow** is a Hindi-first, role-based news publishing platform specifically designed for government teachers in India. The platform enables verified, editor-approved news delivery covering topics relevant to teachers including salaries, service rules, transfers, court orders, and education policy.

## 🎯 Core Features

### **Role-Based Access Control**
- **Public Readers**: Can view published articles without login
- **Reporters**: Can create, edit, and submit articles for review
- **Editors**: Can review, approve/reject, and publish articles
- **Admin**: Can manage users, assign roles, and manage categories

### **Article Workflow**
```
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → PUBLISHED
         ↓
      REJECTED (back to DRAFT)
```

### **Key Functionality**
1. **Public Pages**
   - Homepage with category filtering
   - Article detail pages with large Hindi fonts
   - Mobile-first responsive design
   
2. **Reporter Features**
   - Create and edit draft articles
   - Submit articles for editorial review
   - View article status (draft/submitted/approved/published/rejected)
   - Mandatory source attachment for every article
   
3. **Editor Features**
   - Review queue for submitted articles
   - Approve or reject articles with comments
   - Publish approved articles
   - Editorial audit logs
   
4. **Admin Features**
   - User management (assign roles)
   - Category management
   - System oversight

## 🛠️ Tech Stack

### **Backend**
- **Framework**: FastAPI (Python 3.11)
- **Database**: MongoDB with Motor (async driver)
- **Authentication**: JWT-based with bcrypt password hashing
- **API Pattern**: RESTful with role-based middleware

### **Frontend**
- **Framework**: React 19.0
- **Routing**: React Router v7
- **Styling**: Tailwind CSS 3.4
- **UI Components**: shadcn/ui (Radix UI)
- **HTTP Client**: Axios
- **Language**: Hindi-first with optimized Devanagari fonts

## 📂 Project Structure

```
/app/
├── backend/
│   ├── server.py          # Main FastAPI application
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Backend configuration
│
├── frontend/
│   ├── src/
│   │   ├── App.js                    # Main app with routing
│   │   ├── context/
│   │   │   └── AuthContext.js        # Authentication context
│   │   └── pages/
│   │       ├── HomePage.js           # Public homepage
│   │       ├── ArticlePage.js        # Article detail page
│   │       ├── LoginPage.js          # Login page
│   │       ├── RegisterPage.js       # Reporter registration
│   │       ├── ReporterDashboard.js  # Reporter dashboard
│   │       ├── CreateArticle.js      # Create new article
│   │       ├── EditArticle.js        # Edit draft article
│   │       ├── EditorDashboard.js    # Editor review dashboard
│   │       └── AdminDashboard.js     # Admin panel
│   ├── package.json       # Node dependencies
│   └── .env              # Frontend configuration
│
└── PROJECT_SUMMARY.md    # This file
```

## 🔐 Authentication & Security

- JWT tokens with 72-hour expiration
- Bcrypt password hashing
- Role-based route protection
- CSRF protection enabled
- Backend validation for state transitions
- Reporters cannot directly publish articles

## 📊 Data Models

### **User & UserProfile**
- `id`, `email`, `name`, `role`, `created_at`
- Roles: public, reporter, editor, admin

### **Category**
- `id`, `name_hi` (Hindi name), `name_en` (English name), `slug`
- Default categories: वेतन/भत्ता, स्थानांतरण, सेवा नियम, न्यायालय आदेश, चुनाव ड्यूटी, शिक्षा नीति

### **Article**
- `id`, `title`, `slug`, `content`, `category_id`, `author_id`, `author_name`
- `status` (draft/submitted/under_review/approved/published/rejected)
- `sources[]` (ArticleSource array)
- `published_at`, `created_at`, `updated_at`

### **ArticleSource**
- `source_type` (url/pdf_link)
- `source_url`, `description`

### **ReviewLog**
- `id`, `article_id`, `reviewer_id`, `reviewer_name`
- `action` (approved/rejected/published)
- `comment`, `timestamp`

## 🚀 Getting Started

### **Default Credentials**

**Admin Account:**
- Email: `admin@newsflow.com`
- Password: `admin123`

**Test Reporter:**
- Email: `reporter@test.com`
- Password: `test123`

### **API Endpoints**

#### **Public APIs**
- `GET /api/categories` - List all categories
- `GET /api/articles` - List published articles (with optional category filter)
- `GET /api/articles/{slug}` - Get article by slug

#### **Authentication**
- `POST /api/auth/register` - Register new user (reporter by default)
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user profile

#### **Reporter APIs** (requires authentication)
- `POST /api/articles` - Create new draft article
- `GET /api/my-articles` - Get reporter's own articles
- `PUT /api/articles/{id}` - Update draft/rejected article
- `POST /api/articles/{id}/submit` - Submit article for review

#### **Editor APIs** (requires editor/admin role)
- `GET /api/review-queue` - Get articles pending review
- `POST /api/articles/{id}/approve` - Approve submitted article
- `POST /api/articles/{id}/reject` - Reject article with comment
- `POST /api/articles/{id}/publish` - Publish approved article

#### **Admin APIs** (requires admin role)
- `GET /api/users` - List all users
- `PUT /api/users/{id}/role` - Update user role
- `POST /api/categories` - Create new category

## 🌐 Environment Variables

### **Backend (.env)**
```bash
MONGO_URL=mongodb://localhost:27017
DB_NAME=newsflow_db
CORS_ORIGINS=*
JWT_SECRET=newsflow-secret-key-change-in-production-2025
```

### **Frontend (.env)**
```bash
REACT_APP_BACKEND_URL=https://your-domain.preview.emergentagent.com
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

## 🎨 Design Principles

1. **Mobile-First**: Optimized for mobile reading with touch-friendly UI
2. **Hindi-Centric**: Devanagari fonts with proper rendering
3. **Verification-First**: No article published without editorial approval
4. **Clean Layout**: Card-based design with clear visual hierarchy
5. **Accessibility**: Proper semantic HTML and ARIA labels

## 📱 Key Pages

### **Public Homepage**
- Sticky header with app title "शिक्षक समाचार"
- Horizontal scrolling category tabs
- Vertical card-based news layout
- Each card shows: category badge, headline, date, "पूरा पढ़ें" button

### **Article Detail Page**
- Large Hindi fonts for easy reading
- Category badge and headline
- Author name and published date
- Full article content with proper line spacing
- Sources section with clickable links

### **Reporter Dashboard**
- "नया लेख बनाएं" button to create articles
- List of reporter's articles with status badges
- Actions: Edit, Submit for Review, View Published

### **Editor Dashboard**
- Review queue (समीक्षा कतार) for submitted articles
- Expandable article preview with full content and sources
- Actions: Approve (✓), Reject (✗) with comments
- Approved articles section ready for publishing

### **Admin Panel**
- User management table with role assignment dropdown
- Category management with add/edit capabilities
- Real-time role updates

## 🔄 Article Workflow Example

1. **Reporter** creates a draft article with title, content, category, and sources
2. **Reporter** submits article for review (status: SUBMITTED)
3. **Editor** views article in review queue
4. **Editor** reviews content and sources
5. **Editor** approves article (status: APPROVED)
6. **Editor** publishes article (status: PUBLISHED)
7. Article appears on public homepage
8. **Public** readers can view the article without login

If rejected:
- **Editor** rejects with comment (status: REJECTED)
- **Reporter** sees rejection reason
- **Reporter** can edit and resubmit

## ✅ Implementation Highlights

### **Backend**
- ✅ JWT-based authentication with role-based access control
- ✅ Complete CRUD APIs for articles, categories, users
- ✅ State machine validation for article workflow
- ✅ MongoDB integration with async Motor driver
- ✅ Editorial audit logs (ReviewLog collection)
- ✅ Default admin and categories setup on first run

### **Frontend**
- ✅ React Router with protected routes
- ✅ Context API for global auth state
- ✅ Hindi localization throughout the UI
- ✅ Mobile-responsive design with Tailwind CSS
- ✅ Form validation and error handling
- ✅ Real-time JWT token management
- ✅ All CRUD operations for articles

### **Security**
- ✅ Password hashing with bcrypt
- ✅ JWT token expiration (72 hours)
- ✅ Role-based middleware protection
- ✅ CORS configuration
- ✅ Backend validation for all state transitions

## 🎯 Future Enhancements (Out of Scope for MVP)

1. **Reporter-Editor Mapping**: Assign specific reporters to editors
2. **Senior Editor Role**: Multi-level approval process
3. **Notification System**: Email/SMS alerts for article status changes
4. **Analytics Dashboard**: Article views, engagement metrics
5. **Rich Text Editor**: WYSIWYG editor for article content formatting
6. **Image Upload**: Article featured images and inline images
7. **Search & Filters**: Advanced search with date range, author filters
8. **Comments System**: Public comments on articles (moderated)
9. **Scheduled Publishing**: Schedule articles for future publication
10. **Monetization**: Non-intrusive ads for teachers

## 📝 Notes

- All articles require at least one source (URL or PDF link)
- Article slugs are auto-generated using UUID to avoid URL encoding issues
- Hindi date formatting uses Indian locale (hi-IN)
- Mobile menu provides access to dashboards based on user role
- Default admin account should be changed in production
- JWT secret should be updated in production environment

## 🏆 Success Metrics

- ✅ Complete article lifecycle from creation to publication
- ✅ Role-based access control working correctly
- ✅ Hindi-first design with proper font rendering
- ✅ Mobile-responsive UI matching design specifications
- ✅ Source attribution for every published article
- ✅ Editorial accountability through review logs
- ✅ Public access without authentication requirement

---

**Built with ❤️ by Emergent AI**

Last Updated: January 24, 2026
