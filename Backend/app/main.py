"""
FastAPI main application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routers import customers, products, orders, substitutions, claims, dashboard

# Initialize database
init_db()

# Create FastAPI app
app = FastAPI(
    title="Valio Aimo Customer Portal API",
    description="Backend API for Zero-Fail Logistics Customer Portal",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(customers.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(substitutions.router)
app.include_router(claims.router)
app.include_router(dashboard.router)


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

