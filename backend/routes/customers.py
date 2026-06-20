from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db

from models.customer import Customer
from models.order import Order

from schemas.customer import CustomerCreate, CustomerUpdate

router = APIRouter(
    prefix="/customers",
    tags=["Customers"]
)


# CREATE CUSTOMER
@router.post("/")
def create_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db)
):
    existing_customer = db.query(Customer).filter(
        Customer.email == customer.email
    ).first()

    if existing_customer:
        raise HTTPException(
            status_code=400,
            detail="Email already exists. Please use a different email."
        )

    new_customer = Customer(
        full_name=customer.full_name,
        email=customer.email,
        phone=customer.phone
    )

    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)

    return new_customer


# GET ALL CUSTOMERS
@router.get("/")
def get_customers(
    db: Session = Depends(get_db)
):
    return db.query(Customer).all()


# GET CUSTOMER BY ID
@router.get("/{id}")
def get_customer(
    id: int,
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(
        Customer.id == id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    return customer


# DELETE CUSTOMER
@router.delete("/{id}")
def delete_customer(
    id: int,
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(
        Customer.id == id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    existing_order = db.query(Order).filter(
        Order.customer_id == id
    ).first()

    if existing_order:
        raise HTTPException(
            status_code=400,
            detail="Customer has orders and cannot be deleted."
        )

    db.delete(customer)
    db.commit()

    return {
        "message": "Customer deleted successfully"
    }