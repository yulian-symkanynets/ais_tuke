# AIS TUKE Student Portal Dashboard

This is a code bundle for AIS TUKE Student Portal Dashboard. The original project is available at https://www.figma.com/design/nZqmP10Y180WC8WOCF5J8b/AIS-TUKE-Student-Portal-Dashboard.

## Project Structure

- **Frontend**: React + TypeScript + Vite
- **Backend**: FastAPI + DuckDB (Python)

## Running the Frontend

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Running the Backend

See [backend/README.md](backend/README.md) for detailed backend setup instructions.

Quick start:
```bash
cd backend
pip install -r requirements.txt
python database.py  # Initialize database
python main.py      # Start backend server
```

The backend API will be available at `http://127.0.0.1:8000` with full API documentation at `http://127.0.0.1:8000/docs`.
