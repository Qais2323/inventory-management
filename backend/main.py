from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine

from models.product import Product
from routes.products import router as product_router

from models.customer import Customer
from routes.customers import router as customer_router

from models.order import Order
from routes.orders import router as order_router

from routes.dashboard import router as dashboard_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(product_router)
app.include_router(customer_router)
app.include_router(order_router)
app.include_router(dashboard_router)

@app.get("/")
def home():
    return {"message": "Inventory Management APIs"}