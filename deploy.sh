#!/bin/bash

echo "🚀 Deploying functions using Firebase CLI..."
# Deploy only functions
firebase deploy --only functions

echo "✅ Deployment finished!"
