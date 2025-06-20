# Good for Good Trust Management System

A comprehensive management system for Good for Good Charitable Trust, built with Next.js, PostgreSQL, and Prisma.

## 🌟 Features

### Member Management
- Member profiles with role-based access control
- Trustee management and role assignments
- Profile picture handling
- Account status tracking

### Financial Management
- Donation tracking and management
- Expense management
- Financial reporting
- Integration with WordPress donation system (coming soon)

### Activity Management
- Event and activity planning
- Participant tracking
- Workshop resource management
- Meeting management

### Administrative Features
- Audit logging
- Automated backups
- System configuration
- Document management

## 🚀 Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Backend**: Node.js, PostgreSQL
- **ORM**: Prisma
- **Authentication**: Custom auth with session management
- **File Storage**: Local storage with backup support
- **UI Components**: Custom components with Tailwind

## 📋 Prerequisites

- Node.js 18.x or higher
- PostgreSQL 12 or higher
- npm or yarn package manager

## 🛠️ Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/gg.git
cd gg
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables
```bash
cp .env.example .env
```

4. Update the .env file with your configuration:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/gg_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

5. Run database migrations
```bash
npx prisma migrate deploy
```

6. Start the development server
```bash
npm run dev
# or
yarn dev
```

## 🔧 Configuration

### Database Setup
1. Create a PostgreSQL database
2. Update DATABASE_URL in .env
3. Run migrations: `npx prisma migrate deploy`
4. Seed initial data: `npx prisma db seed`

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_URL`: Your application URL
- `NEXTAUTH_SECRET`: Secret key for authentication
- Additional variables as needed

## 📦 Deployment

### Hostinger Deployment (Coming Soon)
- Node.js hosting setup
- PostgreSQL database configuration
- Domain and SSL setup
- Environment variable configuration

### WordPress Integration (Coming Soon)
- PayU Money integration
- Webhook configuration
- Cross-platform data sync

## 🔐 Security

- Role-based access control
- Session management
- Audit logging
- Secure password handling
- Data backup and recovery

## 🧪 Testing

```bash
# Run tests
npm run test
# or
yarn test
```

## 📝 License

This project is proprietary and confidential. All rights reserved.

## 👥 Contributors

- Development Team
- Good for Good Trust Members

## 📞 Support

For support, please contact:
- Email: goodforgood.contact@gmail.com
- Phone: +91 8217544316

## 🔄 Backup System

The system includes automated backup functionality:
- Daily/Weekly/Monthly backup options
- Configurable retention policy
- Backup verification
- Easy restore process

## 🛣️ Roadmap

- [x] Member Management
- [x] Financial Tracking
- [x] Activity Management
- [x] Audit Logging
- [ ] WordPress Donation Integration
- [ ] Enhanced Financial Reports
- [ ] Mobile App Integration
- [ ] Advanced Analytics

## 💡 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## 🏗️ Project Structure

```
gg/
├── src/
│   ├── app/           # Next.js app router
│   ├── components/    # React components
│   ├── lib/          # Utility functions
│   ├── types/        # TypeScript types
│   └── contexts/     # React contexts
├── prisma/
│   ├── schema.prisma # Database schema
│   └── migrations/   # Database migrations
├── public/           # Static files
└── scripts/         # Utility scripts
```

## Deployment Checklist

### Pre-deployment Steps
1. Database Setup
   - [ ] Set up PostgreSQL database
   - [ ] Note down connection string
   - [ ] Test database connection locally

2. Environment Variables
   - [ ] DATABASE_URL
   - [ ] NEXT_PUBLIC_APP_URL
   - [ ] RESEND_API_KEY
   - [ ] Verify all variables in local environment

3. Build and Test
   - [ ] Run `npm run build` locally
   - [ ] Test all features in production mode
   - [ ] Check for any console errors
   - [ ] Verify all API routes work

### Vercel Deployment
1. Repository Setup
   - [ ] Push code to GitHub
   - [ ] Connect repository to Vercel

2. Vercel Configuration
   - [ ] Set all environment variables
   - [ ] Configure build settings
   - [ ] Set up custom domain (if applicable)

3. Database Migration
   - [ ] Run `prisma migrate deploy`
   - [ ] Verify database schema
   - [ ] Test database connections

4. Post-deployment Verification
   - [ ] Test user registration
   - [ ] Test login/logout flow
   - [ ] Verify email functionality
   - [ ] Check all CRUD operations
   - [ ] Verify file uploads
   - [ ] Test admin features

### Known Limitations
- File uploads use local storage - consider migrating to cloud storage
- Session management uses database - monitor connection pool
- Backup functionality needs cloud storage integration

### Monitoring
- Set up error monitoring
- Configure performance monitoring
- Set up database monitoring
- Enable Vercel analytics

## Local Development
...