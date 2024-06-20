from flask_sqlalchemy import SQLAlchemy

# Create a SQLAlchemy instance
db = SQLAlchemy()

def init_db(app):
    # Use the app's configuration to set up the database URI and track modifications
    db.init_app(app)
    
    return db
