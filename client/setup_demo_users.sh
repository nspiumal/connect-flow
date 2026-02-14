#!/bin/bash

# ============================================================================
# Connect Flow - Demo Users Setup Helper
# ============================================================================
# This script provides instructions and helps verify demo users setup
#
# Usage: bash setup_demo_users.sh
# ============================================================================

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       Connect Flow - Demo Users Setup & Login Helper           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 STEP 1: Verify Supabase Connection${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Your Supabase Project ID: zphlyqpxfowjymahgpca"
echo "Your Supabase URL: https://zphlyqpxfowjymahgpca.supabase.co"
echo ""
echo -e "${YELLOW}✓ To verify connection works:${NC}"
echo "  1. Go to: https://supabase.com/dashboard"
echo "  2. Sign in to your account"
echo "  3. Select project: zphlyqpxfowjymahgpca"
echo "  4. You should see your database dashboard"
echo ""
echo -e "${GREEN}✓ Connection verified?${NC} Press Enter to continue..."
read

echo ""
echo -e "${BLUE}👤 STEP 2: Create Demo Users in Supabase Auth${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}You need to create 4 users in Supabase:${NC}"
echo ""
echo "  1. SUPERADMIN"
echo "     Email:    superadmin@connectflow.com"
echo "     Password: SuperAdmin@123"
echo ""
echo "  2. ADMIN"
echo "     Email:    admin@connectflow.com"
echo "     Password: Admin@123"
echo ""
echo "  3. MANAGER"
echo "     Email:    manager@connectflow.com"
echo "     Password: Manager@123"
echo ""
echo "  4. STAFF"
echo "     Email:    staff@connectflow.com"
echo "     Password: Staff@123"
echo ""
echo -e "${YELLOW}📝 Instructions:${NC}"
echo "  1. Go to: https://supabase.com/dashboard/project/zphlyqpxfowjymahgpca/auth/users"
echo "  2. Click 'Add User'"
echo "  3. Enter email and password"
echo "  4. Click 'Create User'"
echo "  5. Repeat for all 4 users"
echo ""
echo -e "${GREEN}✓ All 4 users created?${NC} Press Enter to continue..."
read

echo ""
echo -e "${BLUE}🗄️  STEP 3: Run SQL Setup Script${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}Now you need to create profiles and roles in the database:${NC}"
echo ""
echo "  1. Go to: https://supabase.com/dashboard/project/zphlyqpxfowjymahgpca/sql/new"
echo "  2. Open file: supabase/migrations/setup_demo_users.sql"
echo "  3. Copy all content"
echo "  4. Paste into Supabase SQL Editor"
echo "  5. Click 'Run'"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "  - Users MUST be created in Auth FIRST (Step 2)"
echo "  - Then run this SQL script (Step 3)"
echo "  - Both steps are required!"
echo ""
echo -e "${GREEN}✓ SQL script executed?${NC} Press Enter to continue..."
read

echo ""
echo -e "${BLUE}🔐 STEP 4: Test Login${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}Start your development server:${NC}"
echo ""
echo "  npm start"
echo ""
echo -e "${YELLOW}Then try logging in:${NC}"
echo ""
echo "  URL: http://localhost:5173/login"
echo ""
echo "  Try these accounts (in order):"
echo "    1. staff@connectflow.com / Staff@123 (simplest role)"
echo "    2. manager@connectflow.com / Manager@123"
echo "    3. admin@connectflow.com / Admin@123"
echo "    4. superadmin@connectflow.com / SuperAdmin@123 (most features)"
echo ""

echo ""
echo -e "${BLUE}🆘 TROUBLESHOOTING${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${YELLOW}Problem: \"Invalid credentials\" error${NC}"
echo "  ✓ Check email is EXACTLY correct (case-sensitive)"
echo "  ✓ Check password is EXACTLY correct (case-sensitive)"
echo "  ✓ Verify user exists in Supabase Auth Dashboard"
echo "  ✓ Wait 30 seconds after creating user before trying login"
echo "  ✓ Try a different browser (incognito mode)"
echo ""

echo -e "${YELLOW}Problem: Login button doesn't respond${NC}"
echo "  ✓ Check browser console for errors (F12 → Console)"
echo "  ✓ Clear browser cache (Ctrl+Shift+Delete)"
echo "  ✓ Verify Supabase credentials in .env file"
echo "  ✓ Restart development server (npm start)"
echo ""

echo -e "${YELLOW}Problem: Stuck on \"Loading...\" after login${NC}"
echo "  ✓ This means user/profile/role weren't set up correctly"
echo "  ✓ Go back and verify:"
echo "     - User exists in Supabase Auth"
echo "     - Profile exists in 'profiles' table"
echo "     - User role exists in 'user_roles' table"
echo "  ✓ Open browser developer tools (F12 → Network tab)"
echo "  ✓ Look for failed requests"
echo ""

echo -e "${YELLOW}Problem: Different features not available${NC}"
echo "  ✓ Some features depend on user role"
echo "  ✓ Staff users have limited access"
echo "  ✓ Try logging in as SuperAdmin to see all features"
echo "  ✓ Check DEMO_USERS.md for what each role can do"
echo ""

echo ""
echo -e "${BLUE}📚 DOCUMENTATION${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  DEMO_USERS.md           Complete guide with workflows"
echo "  SETUP_GUIDE.md          Quick start instructions"
echo "  QUICK_REFERENCE.txt     Credential reference"
echo "  setup_demo_users.sql    SQL setup script"
echo ""

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Setup Complete! You're ready to login and test the app.${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Questions? Check the documentation files in the /client directory."
echo ""

