"""
Seeds the database with demo-ready mock data: customers, orders, inventory,
and policy snippets. Run once: `python seed_data.py`
Idempotent - safe to re-run, it clears and reloads.
"""
from database import Base, engine, SessionLocal
import models
from auth import hash_password


def seed():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Demo operator login
    demo_user = models.User(
        full_name="Demo Operator",
        email="demo@resolveai.app",
        hashed_password=hash_password("Demo1234!"),
        role="admin",
    )
    db.add(demo_user)

    customers = [
        models.Customer(id="cust_001", name="Asha Rao", email="asha@example.com", tier="premium"),
        models.Customer(id="cust_002", name="Rahul Nair", email="rahul@example.com", tier="standard"),
        models.Customer(id="cust_003", name="Meera Iyer", email="meera@example.com", tier="standard"),
    ]
    db.add_all(customers)

    orders = [
        models.Order(id="ord_101", customer_id="cust_001", sku="SKU-CAM-01",
                     product_name="Aperture X Camera", price=249.00, status="delivered"),
        models.Order(id="ord_102", customer_id="cust_002", sku="SKU-HDP-02",
                     product_name="Wave Pro Headphones", price=89.00, status="delivered"),
        models.Order(id="ord_103", customer_id="cust_003", sku="SKU-KTL-03",
                     product_name="Kettle Mini", price=35.00, status="delivered"),
    ]
    db.add_all(orders)

    inventory = [
        models.InventoryItem(sku="SKU-CAM-01", product_name="Aperture X Camera", stock_count=0),  # out of stock -> forces adaptation
        models.InventoryItem(sku="SKU-HDP-02", product_name="Wave Pro Headphones", stock_count=12),
        models.InventoryItem(sku="SKU-KTL-03", product_name="Kettle Mini", stock_count=5),
    ]
    db.add_all(inventory)

    policies = [
        models.Policy(topic="refund_window", keywords="refund,money,back",
                      text="Refunds are permitted within 30 days of delivery for items in delivered status."),
        models.Policy(topic="replacement_eligibility", keywords="replace,defective,wrong",
                      text="Replacements are offered when stock is available; otherwise issue store credit."),
        models.Policy(topic="cancellation", keywords="cancel",
                      text="Orders can be cancelled only if not yet marked delivered."),
    ]
    db.add_all(policies)

    db.commit()
    db.close()
    print("Seeded database: resolution_agent.db")
    print("Demo login -> email: demo@resolveai.app  password: Demo1234!")


if __name__ == "__main__":
    seed()
