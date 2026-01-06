# Homestay Booking Platform

A multi-tenant homestay booking platform built with Next.js 16, React 19, Supabase, and shadcn/ui.

## Features

### For Property Owners (Hosts)
- 🏠 Create and manage multiple rooms
- 📅 Availability calendar with price overrides
- 📊 Dashboard with booking analytics
- 💳 Accept online payments (Stripe integration ready)
- 🎨 Customizable branding (logo, colors)

### For Guests
- 🔍 Browse available rooms
- 📖 View room details, amenities, and photos
- 📆 Check availability and book online
- 📝 View booking history
- ⭐ Leave reviews

### For Super Admins
- 👥 Manage all tenants and users
- 📊 Platform-wide analytics
- 💰 Subscription management
- ⚙️ System settings

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS 4
- **Components**: shadcn/ui (Radix UI)
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd homestay-booking
```

2. Install dependencies:
```bash
npm install
```

3. Create a Supabase project and run the migrations:
```bash
# In your Supabase dashboard, run the SQL files in order:
# 1. supabase/migrations/001_initial_schema.sql
# 2. supabase/migrations/002_row_level_security.sql
```

4. Set up environment variables:
```bash
cp .env.example .env.local
```

Add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
homestay-booking/
├── app/                      # Next.js App Router pages
│   ├── admin/               # Super admin panel
│   │   ├── login/          # Admin login
│   │   ├── register/       # Host registration
│   │   ├── tenants/        # Tenant management
│   │   ├── users/          # User management
│   │   ├── subscriptions/  # Subscription management
│   │   ├── analytics/      # Platform analytics
│   │   └── settings/       # System settings
│   ├── [slug]/             # Tenant-specific pages
│   │   ├── dashboard/      # Host dashboard
│   │   ├── rooms/          # Room listings
│   │   ├── booking/        # Booking flow
│   │   ├── my-bookings/    # Guest bookings
│   │   ├── login/          # Guest login
│   │   └── register/       # Guest registration
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Platform landing page
├── components/
│   ├── admin/              # Admin panel components
│   ├── auth/               # Authentication components
│   ├── booking/            # Booking components
│   ├── dashboard/          # Dashboard components
│   ├── tenant/             # Tenant-specific components
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── supabase/           # Supabase clients
│   │   ├── client.ts       # Browser client
│   │   ├── server.ts       # Server client
│   │   └── middleware.ts   # Middleware client
│   └── utils.ts            # Utility functions
├── supabase/
│   └── migrations/         # Database migrations
├── types/
│   └── database.ts         # TypeScript types
└── middleware.ts           # Next.js middleware
```

## User Roles

| Role | Access |
|------|--------|
| `super_admin` | Full platform access, manage all tenants and users |
| `host` | Manage own tenant, rooms, and bookings |
| `guest` | Book rooms, view own bookings, write reviews |

## Routes

### Public Routes
- `/` - Platform landing page
- `/{slug}` - Tenant landing page
- `/{slug}/rooms` - Room listings
- `/{slug}/rooms/{id}` - Room details
- `/{slug}/login` - Guest login
- `/{slug}/register` - Guest registration

### Protected Routes (Guest)
- `/{slug}/booking/{roomId}` - Booking flow
- `/{slug}/my-bookings` - My bookings

### Protected Routes (Host)
- `/{slug}/dashboard` - Dashboard overview
- `/{slug}/dashboard/rooms` - Room management
- `/{slug}/dashboard/bookings` - Booking management

### Admin Routes (Super Admin)
- `/admin` - Admin dashboard
- `/admin/tenants` - Tenant management
- `/admin/users` - User management
- `/admin/subscriptions` - Subscription management
- `/admin/analytics` - Analytics
- `/admin/settings` - Settings

## Database Schema

### Tables
- `tenants` - Property/homestay information
- `profiles` - User profiles (extends auth.users)
- `rooms` - Room/accommodation details
- `bookings` - Reservations
- `room_availability` - Date-specific availability/pricing
- `reviews` - Guest reviews

## Security

- Row Level Security (RLS) enabled on all tables
- Role-based access control
- Secure authentication with Supabase Auth
- Protected routes via middleware

## Development

### Running Locally
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details
