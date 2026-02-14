# Gold Pawn Management System - Full Stack with Supabase

## Overview

A complete web-based gold pawn shop management system with role-based access control, multi-branch operations, transaction management, and reporting — built with React + Spring boot

---

## Phase 1: Authentication & User Roles

### Login Page

- username/password authentication with branded login screen
- JWT-based session management via Supabase Auth

### Role-Based Access Control

- 4 roles: **Super Admin**, **Admin**, **Branch Manager**, **Staff**
- Separate user_roles table for secure role management
- Automatic redirect to role-specific dashboard after login

---

## Phase 2: Database Setup

### Core Tables

- **profiles** — user profiles linked to Supabase auth
- **user_roles** — role assignments (SUPERADMIN, ADMIN, MANAGER, STAFF)
- **branches** — branch information with manager assignments
- **pawn_transactions** — gold pawn records with customer/item details
- **interest_rates** — configurable interest rates by period and customer type
- **blacklist** — blacklisted customers with police report tracking
- **branch_requests** — branch creation request workflow
- **audit_logs** — system activity tracking
- **dashboard_widgets** — dynamic dashboard widget configuration

### Row-Level Security

- Users can only access data for their assigned branch
- Super Admin has system-wide access
- Staff has read-only access to most tables

---

## Phase 3: Role-Specific Dashboards

### Super Admin Dashboard

- Widgets: Total Branches, Pending Requests, Total Users, Active Branches, create user
- Quick navigation to branch management and requests
- send a newly created user password thought the mail. for now add only log print

### Admin Dashboard

- Widgets: Branch Managers, Pending Staff, Total Staff, Active Pawns, Interest Rates
- Quick access to staff approval and rate management

### Manager Dashboard

- Active pawns in branch, staff count, recent transactions
- Quick action buttons for common tasks

### Staff Dashboard

- Today's transactions, pending tasks, recent customer searches

---

## Phase 4: Branch Management (Super Admin)

- View all branches with status indicators
- Create, edit, activate/deactivate branches
- Assign managers to branches
- Review and approve/reject branch requests from Admins

---

## Phase 5: User & Staff Management

### Admin Features

- Create and manage Branch Manager accounts
- Review and approve/reject staff registration requests
- Assign staff to branches

### Manager Features

- View branch staff list
- Manage staff within their branch

---

## Phase 6: Pawn Transaction Management

### Create New Pawn Transaction (Manager & Staff)

- Customer details form (name, NIC, address, phone)
- Gold item details (weight, karat, description)
- Loan calculation with selectable interest rates and periods
- Auto-generated Pawn ID (e.g., PW001)
- Maturity date calculation

### Pawn Records

- Paginated list with search (by NIC, name, Pawn ID)
- Filter by status: Active, Completed, Defaulted
- Status updates (Manager only)
- Add remarks to transactions

---

## Phase 7: Customer & Blacklist Management

### Customer Search

- Search by NIC or name
- View transaction history and customer type (Loyal/Regular)
- Check blacklist status

### Blacklist Management

- Add/remove customers from blacklist (Manager)
- Police report tracking with report number and date
- View-only access for Staff

---

## Phase 8: Interest Rate Management (Admin)

- Create and manage interest rates
- Configure by period (6 months, 1 year, etc.)
- Set rates by customer type (Loyal, Regular, Special)
- Activate/deactivate rates

---

## Phase 9: Reports & Audit Logs

### Reports

- Transaction summaries by branch and date range
- Staff performance metrics
- Revenue reports with charts

### Audit Logs (Super Admin)

- Track all system activities
- User login/logout history
- Transaction and configuration change trails

---

## Design & Navigation

- **Sidebar navigation** with role-specific menu items
- **Color-coded role indicators** (Red=SuperAdmin, Orange=Admin, Blue=Manager, Green=Staff)
- Clean, professional UI with cards, tables, and data visualization
- Responsive layout for desktop use
- Toast notifications for actions and errors