from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.product import Product
from models.customer import Customer
from models.order import Order

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/")
def get_dashboard(
    db: Session = Depends(get_db)
):
    total_products = db.query(Product).count()

    total_customers = db.query(Customer).count()

    total_orders = db.query(Order).count()

    low_stock_products = db.query(Product).filter(
        Product.quantity < 5
    ).count()

    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_products": low_stock_products
    }