#!/bin/sh

echo "🚀 Starting Doc-Flow Backend..."

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
while ! nc -z mongodb 27017; do
  sleep 1
done
echo "✅ MongoDB is ready!"

# Run initialization scripts
echo "🔧 Running initialization scripts..."

# Initialize admin user and group
echo "👤 Initializing admin user and group..."
npm run init-admin:prod
if [ $? -eq 0 ]; then
  echo "✅ Admin initialization completed successfully"
else
  echo "⚠️  Admin initialization failed or admin already exists"
fi

# Initialize document permissions
echo "📄 Initializing document permissions..."
npm run init-docs:prod
if [ $? -eq 0 ]; then
  echo "✅ Document permissions initialization completed successfully"
else
  echo "⚠️  Document permissions initialization failed or no documents found"
fi

echo "🎉 Initialization complete! Starting server..."

# Start the application
exec npm start
