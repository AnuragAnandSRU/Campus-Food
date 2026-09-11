# Setup Guide

## Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account (free tier)
- AWS account with $100 credits
- Git
- VS Code (recommended)

---

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Update the following variables:

```env
# Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/campus-food

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# AWS S3 (get from AWS Console)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=campus-food-images

# Email (for verification emails)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 3. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist your IP (or use 0.0.0.0/0 for development)
5. Get your connection string
6. Replace `<username>` and `<password>` in MONGODB_URI

### 4. AWS S3 Setup

1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Navigate to S3
3. Create a new bucket (e.g., `campus-food-images`)
4. Set permissions:
   - Uncheck "Block all public access"
   - Add bucket policy for public read:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::campus-food-images/*"
       }
     ]
   }
   ```
5. Go to IAM > Users > Create user
6. Attach policy: `AmazonS3FullAccess`
7. Create access key and save credentials

### 5. Email Setup (Gmail)

1. Enable 2-factor authentication on your Google account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate an app password for "Mail"
4. Use this password in `EMAIL_PASSWORD`

### 6. Run Backend

```bash
# Development mode with auto-reload
npm run dev

# Build for production
npm run build

# Run production
npm start
```

Server will run on `http://localhost:5000`

---

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Install Additional Packages

```bash
npm install axios zustand socket.io-client @tanstack/react-query
npm install -D @types/node
```

### 3. Environment Configuration

Create `.env.local` in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=Campus Food
```

### 4. Run Frontend

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Run production
npm start
```

Frontend will run on `http://localhost:3000`

---

## Shared Types Setup

```bash
cd shared
npm install
npm run build
```

The backend and frontend will reference these shared types.

---

## Development Workflow

### 1. Start Backend

```bash
cd backend
npm run dev
```

### 2. Start Frontend (in a new terminal)

```bash
cd frontend
npm run dev
```

### 3. Access the App

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/health

---

## Git Workflow

### Initial Commit

```bash
git add .
git commit -m "Initial project setup

- Backend API with Express + TypeScript
- MongoDB models and authentication
- Frontend with Next.js 15
- Shared TypeScript types
- Documentation

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

### Feature Branch Workflow

```bash
# Create feature branch
git checkout -b feature/auth-system

# Make changes and commit
git add .
git commit -m "Add user authentication

- JWT-based auth
- Email verification
- Password reset

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"

# Merge to main
git checkout main
git merge feature/auth-system
```

---

## Testing

### Backend Testing

```bash
cd backend
npm test
```

### Frontend Testing

```bash
cd frontend
npm test
```

---

## Deployment

### Backend (AWS EC2)

1. Launch EC2 instance (t2.micro free tier)
2. Install Node.js and npm
3. Clone repository
4. Install dependencies
5. Set environment variables
6. Run with PM2:
   ```bash
   npm install -g pm2
   pm2 start dist/server.js --name campus-food-api
   pm2 startup
   pm2 save
   ```

### Frontend (Vercel)

1. Push code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import repository
4. Set environment variables
5. Deploy

---

## Troubleshooting

### MongoDB Connection Issues
- Check if IP is whitelisted in MongoDB Atlas
- Verify connection string format
- Test connection using MongoDB Compass

### CORS Errors
- Verify FRONTEND_URL in backend .env
- Check CORS configuration in server.ts

### Socket.io Connection Issues
- Ensure backend is running
- Check NEXT_PUBLIC_SOCKET_URL
- Verify auth token is being sent

### Image Upload Issues
- Verify AWS credentials
- Check S3 bucket permissions
- Ensure bucket name is correct

---

## Next Steps

1. Complete Phase 1: Authentication system
2. Test all auth flows
3. Set up MongoDB Atlas properly
4. Configure AWS S3
5. Start Phase 2: Canteen & Menu management

Refer to `ROADMAP.md` for detailed development phases.
