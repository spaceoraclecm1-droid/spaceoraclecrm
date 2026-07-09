# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build production version
- `npm start` - Start production server
- `npm run lint` - Run ESLint checks

## Project Architecture

This is a Next.js 15 CRM application for real estate management with the following key architectural components:

### Core Technologies
- **Next.js 15** with App Router architecture
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **Supabase** for database and authentication
- **Zustand** for state management
- **Housing.com API** integration for lead management

### Directory Structure
- `app/` - Next.js app router pages and components
  - `components/` - Reusable React components
  - `context/` - React context providers (AuthContext)
  - `store/` - Zustand state management (inquiryStore)
  - `types/` - TypeScript type definitions
  - `utils/` - Utility functions including Supabase client
  - `api/` - API routes for external integrations
- `lib/housing/` - Housing.com integration modules

### Key Features
1. **Inquiry Management** - Track real estate inquiries through multiple stages
2. **Site Visit Management** - Schedule and track property visits
3. **Employee Reporting** - Performance metrics and analytics
4. **Housing.com Integration** - Automated lead synchronization

### Database Schema
The application uses Supabase with these main entities:
- **Inquiries** - Real estate customer inquiries with status tracking
- **InquiryProgress** - Progress updates and interactions
- **SiteVisits** - Scheduled and completed property visits
- **EmployeeReports** - Performance tracking data

### State Management
- **AuthContext** - Global authentication state
- **inquiryStore** (Zustand) - Inquiry-specific state management

### Housing.com Integration
- Configuration in `lib/housing/config.ts`
- Requires `HOUSING_PROFILE_ID` and `HOUSING_ENCRYPTION_KEY` environment variables
- Automated sync every 30 minutes via cron endpoint
- API endpoints: `/api/housing/sync`, `/api/housing/cron`, `/api/housing/test`

### Configuration Notes
- TypeScript build errors and ESLint warnings are currently ignored during builds (see next.config.ts)
- Image domain `i.ibb.co` is configured for external images
- Path alias `@/*` points to project root

### Authentication Flow
Authentication is handled through Supabase with context-based state management. Login functionality is available at `/login`.

### Inquiry Status Flow
Inquiries progress through these statuses: `new` → `in_progress` → `site_visit_scheduled` → `site_visit_done` → `deal_succeeded`/`deal_lost`