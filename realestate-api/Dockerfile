FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Make sure Python can import the /app directory
ENV PYTHONPATH=/app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY ./app /app/app
COPY ./alembic /app/alembic
COPY ./alembic.ini /app/alembic.ini
COPY ./create_admin.py /app/create_admin.py

EXPOSE 8000

# Run migrations then start FastAPI
CMD ["sh", "-c", "sleep 5 && alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
