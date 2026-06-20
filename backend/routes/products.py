from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.product import Product
from models.order import Order
from schemas.product import ProductCreate, ProductUpdate

from sqlalchemy.exc import IntegrityError

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


# CREATE PRODUCT
@router.post("/")
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db)
):
    new_product = Product(
        name=product.name,
        sku=product.sku,
        price=product.price,
        quantity=product.quantity
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product


# GET ALL PRODUCTS
@router.get("/")
def get_products(
    db: Session = Depends(get_db)
):
    return db.query(Product).all()


# GET PRODUCT BY ID
@router.get("/{id}")
def get_product(
    id: int,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return product


# UPDATE PRODUCT
@router.put("/{id}")
def update_product(
    id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    product.name = product_data.name
    product.sku = product_data.sku
    product.price = product_data.price
    product.quantity = product_data.quantity

    try:
        db.commit()
        db.refresh(product)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="SKU already exists. Please use a different SKU."
        )

    return product
# DELETE PRODUCT
@router.delete("/{id}")
def delete_product(
    id: int,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == id).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    order_exists = (
        db.query(Order)
        .filter(Order.product_id == id)
        .first()
    )

    if order_exists:
        raise HTTPException(
            status_code=400,
            detail="Product is used in orders and cannot be deleted"
        )

    db.delete(product)
    db.commit()

    return {
        "message": "Product deleted successfully"
    }