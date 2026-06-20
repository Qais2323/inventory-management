from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db

from models.order import Order
from models.customer import Customer
from models.product import Product

from schemas.order import OrderCreate

router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)


# CREATE ORDER
@router.post("/")
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(
        Customer.id == order_data.customer_id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    product = db.query(Product).filter(
        Product.id == order_data.product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    if product.quantity < order_data.quantity:
        raise HTTPException(
            status_code=400,
            detail="Insufficient stock"
        )

    total_amount = product.price * order_data.quantity

    product.quantity -= order_data.quantity

    new_order = Order(
        customer_id=order_data.customer_id,
        product_id=order_data.product_id,
        quantity=order_data.quantity,
        total_amount=total_amount
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    return {
        "id": new_order.id,
        "customer_name": customer.full_name,
        "product_name": product.name,
        "quantity": new_order.quantity,
        "total_amount": new_order.total_amount
    }


# GET ALL ORDERS
@router.get("/")
def get_orders(
    db: Session = Depends(get_db)
):
    orders = db.query(Order).all()

    result = []

    for order in orders:

        customer = db.query(Customer).filter(
            Customer.id == order.customer_id
        ).first()

        product = db.query(Product).filter(
            Product.id == order.product_id
        ).first()

        result.append({
            "id": order.id,
            "customer_id": order.customer_id,
            "customer_name": customer.full_name,
            "product_id": order.product_id,
            "product_name": product.name,
            "quantity": order.quantity,
            "total_amount": order.total_amount
        })

    return result


# GET ORDER BY ID
@router.get("/{id}")
def get_order(
    id: int,
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(
        Order.id == id
    ).first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    customer = db.query(Customer).filter(
        Customer.id == order.customer_id
    ).first()

    product = db.query(Product).filter(
        Product.id == order.product_id
    ).first()

    return {
        "id": order.id,
        "customer_id": order.customer_id,
        "customer_name": customer.full_name,
        "product_id": order.product_id,
        "product_name": product.name,
        "quantity": order.quantity,
        "total_amount": order.total_amount
    }


# DELETE ORDER
# DELETE ORDER
@router.delete("/{id}")
def delete_order(
    id: int,
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(
        Order.id == id
    ).first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    product = db.query(Product).filter(
        Product.id == order.product_id
    ).first()

    if product:
        product.quantity += order.quantity

    db.delete(order)
    db.commit()

    return {
        "message": "Order deleted successfully and stock restored"
    }