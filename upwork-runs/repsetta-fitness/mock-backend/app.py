"""
Repsetta mock backend (Stage A, local self-test only).

Standalone Flask server that mirrors the structure of the production
repsetta_blueprint.py so the app can be exercised end-to-end on the Mac with a
real round-trip, without touching mw-backend's data/mw.db. Uses a LOCAL sqlite
file in this folder (repsetta.db).

Run:  python app.py    (serves on http://localhost:5005)

CORS is added manually here (flask_cors not required) so it works from the
expo dev server / served export.
"""

import json
import sqlite3
from pathlib import Path
from datetime import datetime

from flask import Flask, Blueprint, request, jsonify

DB_PATH = Path(__file__).parent / "repsetta.db"

EXERCISES = [
    {"id": 1, "name": "Barbell Bench Press", "muscle": "Chest", "equipment": "Barbell"},
    {"id": 2, "name": "Incline Dumbbell Press", "muscle": "Chest", "equipment": "Dumbbell"},
    {"id": 3, "name": "Overhead Press", "muscle": "Shoulders", "equipment": "Barbell"},
    {"id": 4, "name": "Lateral Raise", "muscle": "Shoulders", "equipment": "Dumbbell"},
    {"id": 5, "name": "Tricep Pushdown", "muscle": "Triceps", "equipment": "Cable"},
    {"id": 6, "name": "Skull Crusher", "muscle": "Triceps", "equipment": "EZ Bar"},
]

TODAY_PROGRAM = {
    "name": "Push Day A",
    "focus": "Chest / Shoulders / Triceps",
    "exercises": [
        {"exerciseId": 1, "targetSets": 4, "targetReps": 8, "targetWeight": 135},
        {"exerciseId": 3, "targetSets": 3, "targetReps": 10, "targetWeight": 95},
        {"exerciseId": 5, "targetSets": 3, "targetReps": 12, "targetWeight": 50},
    ],
}

SEED_WORKOUTS = [
    {"id": "w1", "date": "2026-06-10", "name": "Push Day A",
     "sets": [{"exerciseId": 1, "reps": 8, "weight": 135}, {"exerciseId": 1, "reps": 8, "weight": 135},
              {"exerciseId": 1, "reps": 7, "weight": 135}, {"exerciseId": 3, "reps": 10, "weight": 95},
              {"exerciseId": 3, "reps": 9, "weight": 95}, {"exerciseId": 5, "reps": 12, "weight": 50}]},
    {"id": "w2", "date": "2026-06-08", "name": "Push Day A",
     "sets": [{"exerciseId": 1, "reps": 8, "weight": 130}, {"exerciseId": 1, "reps": 7, "weight": 130},
              {"exerciseId": 3, "reps": 10, "weight": 90}, {"exerciseId": 5, "reps": 12, "weight": 45}]},
    {"id": "w3", "date": "2026-06-05", "name": "Push Day A",
     "sets": [{"exerciseId": 1, "reps": 8, "weight": 125}, {"exerciseId": 3, "reps": 9, "weight": 85},
              {"exerciseId": 5, "reps": 10, "weight": 45}]},
]

repsetta_bp = Blueprint("repsetta", __name__, url_prefix="/repsetta")


def _db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _init():
    conn = _db()
    conn.execute(
        """CREATE TABLE IF NOT EXISTS repsetta_workouts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user TEXT NOT NULL,
            name TEXT,
            date TEXT,
            sets_json TEXT NOT NULL,
            created_at TEXT
        )"""
    )
    cur = conn.execute("SELECT COUNT(*) AS c FROM repsetta_workouts")
    if cur.fetchone()["c"] == 0:
        for w in SEED_WORKOUTS:
            conn.execute(
                "INSERT INTO repsetta_workouts (user, name, date, sets_json, created_at) VALUES (?,?,?,?,?)",
                ("demo", w["name"], w["date"], json.dumps(w["sets"]), w["date"]),
            )
    conn.commit()
    conn.close()


def _volume(sets):
    return sum(int(s["reps"]) * float(s["weight"]) for s in sets)


@repsetta_bp.route("/exercises")
def exercises():
    return jsonify({"exercises": EXERCISES})


@repsetta_bp.route("/program/today")
def program_today():
    return jsonify(TODAY_PROGRAM)


@repsetta_bp.route("/workouts", methods=["GET"])
def list_workouts():
    user = request.args.get("user", "demo")
    conn = _db()
    rows = conn.execute(
        "SELECT * FROM repsetta_workouts WHERE user=? ORDER BY date DESC, id DESC", (user,)
    ).fetchall()
    conn.close()
    out = [{"id": str(r["id"]), "name": r["name"], "date": r["date"],
            "sets": json.loads(r["sets_json"])} for r in rows]
    return jsonify({"workouts": out})


@repsetta_bp.route("/workouts", methods=["POST"])
def create_workout():
    data = request.get_json(silent=True) or {}
    user = data.get("user", "demo")
    sets = data.get("sets", [])
    name = data.get("name", "Workout")
    date = data.get("date") or datetime.now().strftime("%Y-%m-%d")
    conn = _db()
    cur = conn.execute(
        "INSERT INTO repsetta_workouts (user, name, date, sets_json, created_at) VALUES (?,?,?,?,?)",
        (user, name, date, json.dumps(sets), datetime.now().isoformat()),
    )
    conn.commit()
    wid = cur.lastrowid
    conn.close()
    return jsonify({"workout": {"id": str(wid), "name": name, "date": date, "sets": sets}})


@repsetta_bp.route("/progress")
def progress():
    user = request.args.get("user", "demo")
    conn = _db()
    rows = conn.execute(
        "SELECT * FROM repsetta_workouts WHERE user=? ORDER BY date ASC, id ASC", (user,)
    ).fetchall()
    conn.close()
    workouts = [{"date": r["date"], "sets": json.loads(r["sets_json"])} for r in rows]
    trend = [{"date": w["date"], "volume": int(_volume(w["sets"]))} for w in workouts]
    return jsonify({
        "totalWorkouts": len(workouts),
        "totalVolume": int(sum(t["volume"] for t in trend)),
        "currentStreak": len(workouts),
        "trend": trend[-7:],
    })


def create_app():
    app = Flask(__name__)
    app.register_blueprint(repsetta_bp)

    @app.after_request
    def cors(resp):
        resp.headers["Access-Control-Allow-Origin"] = "*"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
        resp.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
        return resp

    return app


if __name__ == "__main__":
    _init()
    create_app().run(port=5005, debug=False)
