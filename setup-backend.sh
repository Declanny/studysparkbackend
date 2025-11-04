#!/bin/bash

# StudySpark Backend Setup Script
echo "🚀 Setting up StudySpark Backend..."

# Create .env from example
cp .env.example .env
echo "✅ Created .env file (please update with your values)"

echo "📁 Backend structure created successfully!"
echo ""
echo "Next steps:"
echo "1. Update .env with your MongoDB URI and OpenAI API key"
echo "2. Run: npm run dev"
echo "3. API will be available at http://localhost:3001"
echo ""
echo "🎉 Backend setup complete!"
