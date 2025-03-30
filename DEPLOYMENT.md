# MLB Betting System - Deployment Guide

This guide explains how to deploy the MLB Betting System to Heroku.

## Prerequisites

1. [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed
2. Git installed
3. GitHub account (optional)

## Deployment Steps

### 1. Prepare Your Local Repository

Make sure all your changes are committed to git:

```bash
git init  # If not already a git repository
git add .
git commit -m "Prepare for deployment"
```

### 2. Create a Heroku App

```bash
# Login to Heroku
heroku login

# Create a new Heroku app
heroku create mlb-betting-system

# Add PostgreSQL database (optional, for production use)
heroku addons:create heroku-postgresql:hobby-dev
```

### 3. Deploy to Heroku

```bash
# Push code to Heroku
git push heroku main  # or master, depending on your branch name

# Initialize the database
heroku run python initialize_db.py
```

### 4. Configure Environment Variables (Optional)

```bash
# Set any additional environment variables
heroku config:set FLASK_ENV=production
```

### 5. Open the App

```bash
heroku open
```

## Updating the Deployment

When you make changes to your code, you can update the deployment:

```bash
git add .
git commit -m "Update application"
git push heroku main
```

## Troubleshooting

- **Database Issues**: Check logs with `heroku logs --tail`
- **Application Errors**: Check logs with `heroku logs --tail`
- **Reset Database**: Use `heroku pg:reset DATABASE` (careful, this deletes all data)

## Alternative Deployment Options

### Render

Render (render.com) is another platform that offers easy deployments:

1. Create a Render account
2. Create a new Web Service
3. Connect to your GitHub repository
4. Add the following settings:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn api:app`

### DigitalOcean App Platform

DigitalOcean also offers an easy deployment option:

1. Create a DigitalOcean account
2. Create a new App
3. Connect to your GitHub repository
4. Configure as a Web Service with these settings:
   - Build Command: `pip install -r requirements.txt`
   - Run Command: `gunicorn api:app`

### Railway

Railway is one of the easiest platforms for deploying Python applications:

1. Visit [Railway.app](https://railway.app) and create an account
2. Create a new project and select "Deploy from GitHub repo"
3. Select your repository
4. Connect a database from the 'New' menu (optional for production)
5. Railway will automatically detect the Python app and deploy it
6. For manual configuration settings, you can use:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn api:app`
7. Once deployed, you can view your app by clicking on the URL provided in the deployment section 