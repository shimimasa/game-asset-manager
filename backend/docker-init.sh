#!/bin/bash

# Docker環境セットアップスクリプト

echo "Starting Docker containers..."
cd ../docker
docker compose up -d postgres redis

echo "Waiting for PostgreSQL to be ready..."
sleep 5

cd ../backend

echo "Running database migrations..."
npm run prisma:migrate -- --name init

echo "Generating Prisma client..."
npm run prisma:generate

echo "Seeding database..."
npm run prisma:seed

echo "Setup complete! You can now run 'npm run dev' to start the server."