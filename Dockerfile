# One image for the whole app: the React UI is built first, then FastAPI serves
# it alongside the API. Sessions live in memory, so run a single instance.

FROM node:22-slim AS web
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements-server.txt ./
RUN pip install --no-cache-dir -r requirements-server.txt
COPY server.py ./
COPY tutor/ tutor/
COPY --from=web /web/dist web/dist
RUN useradd --create-home app
USER app
# Render passes the port in $PORT; 8000 when run locally.
CMD ["sh", "-c", "exec uvicorn server:app --host 0.0.0.0 --port ${PORT:-8000}"]
