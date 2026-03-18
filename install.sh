#!/bin/bash

echo "🏥 Hospital Management System - Installation Script"
echo "=================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "=================================================="
echo "✅ Installation Complete!"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Setup Database:"
echo "   - Go to: https://supabase.com/dashboard/project/mzxubcgsidqaoodwclwe/sql"
echo "   - Run database-schema.sql"
echo "   - Run rls-policies.sql"
echo ""
echo "2. Create Admin User (see QUICK-START.md)"
echo ""
echo "3. Start Development Server:"
echo "   npm run dev"
echo ""
echo "4. Open: http://localhost:3000"
echo ""
echo "📚 Documentation:"
echo "   - QUICK-START.md - Get running in 5 minutes"
echo "   - DEPLOYMENT-GUIDE.md - Complete setup guide"
echo "   - PROJECT-SUMMARY.md - Full feature overview"
echo ""
echo "🎉 Happy coding!"
