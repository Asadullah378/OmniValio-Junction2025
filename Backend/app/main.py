"""
FastAPI main application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.database import init_db
from app.routers import auth
from app.routers.customer import cart, products, orders, dashboard, claims, payments
from app.routers.admin import orders as admin_orders, inventory, claims as admin_claims, customers, products as admin_products
from app.routers import voice_agent

# Initialize database
init_db()

# Create FastAPI app
app = FastAPI(
    title="Valio Aimo Customer Portal API",
    description="Backend API for Zero-Fail Logistics Customer Portal",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploaded attachments
# Ensure uploads directory exists
uploads_dir = "uploads"
os.makedirs(uploads_dir, exist_ok=True)
os.makedirs(os.path.join(uploads_dir, "claims"), exist_ok=True)

# Mount static files at /files path
app.mount("/files", StaticFiles(directory="."), name="files")

# Include routers
# Authentication
app.include_router(auth.router)

# Customer routers
app.include_router(cart.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(dashboard.router)
app.include_router(claims.router)
app.include_router(payments.router)

# Admin routers
app.include_router(admin_orders.router)
app.include_router(inventory.router)
app.include_router(admin_claims.router)
app.include_router(customers.router)
app.include_router(admin_products.router)

# Voice agent (bot) routers - unauthenticated
app.include_router(voice_agent.router)


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Valio Aimo Customer Portal API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

