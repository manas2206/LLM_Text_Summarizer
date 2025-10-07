from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline
import sqlite3
import os
import PyPDF2

app = Flask(__name__)
CORS(app)

DB_FILE = "database.db"
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ---------- Database Setup ----------
def init_db():
    with sqlite3.connect(DB_FILE) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS summaries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text TEXT,
                summary TEXT,
                model TEXT
            )
        """)
init_db()

# ---------- Model Loader ----------
def load_model(model_name):
    if model_name == "t5":
        return pipeline("summarization", model="t5-small")
    else:
        return pipeline("summarization", model="facebook/bart-large-cnn")

# ---------- Extract text from PDF ----------
def extract_text_from_pdf(file_path):
    text = ""
    with open(file_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        for page in reader.pages:
            text += page.extract_text() or ""
    return text.strip()

# ---------- Routes ----------
@app.route("/summarize", methods=["POST"])
def summarize():
    data = request.form
    model_name = data.get("model", "bart")

    # Handle file upload
    if "file" in request.files:
        file = request.files["file"]
        path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(path)
        text = extract_text_from_pdf(path)
    else:
        text = data.get("text", "")

    if not text.strip():
        return jsonify({"error": "No text provided"}), 400

    summarizer = load_model(model_name)
    summary = summarizer(text, max_length=130, min_length=30, do_sample=False)[0]["summary_text"]

    # Save to DB
    with sqlite3.connect(DB_FILE) as conn:
        conn.execute("INSERT INTO summaries (text, summary, model) VALUES (?, ?, ?)", (text, summary, model_name))
        conn.commit()

    return jsonify({"summary": summary})

@app.route("/history", methods=["GET"])
def get_history():
    with sqlite3.connect(DB_FILE) as conn:
        data = conn.execute("SELECT id, text, summary, model FROM summaries").fetchall()
    return jsonify([{"id": i[0], "text": i[1], "summary": i[2], "model": i[3]} for i in data])

@app.route("/delete/<int:id>", methods=["DELETE"])
def delete_summary(id):
    with sqlite3.connect(DB_FILE) as conn:
        conn.execute("DELETE FROM summaries WHERE id=?", (id,))
        conn.commit()
    return jsonify({"message": "Deleted successfully"})

@app.route("/clear", methods=["DELETE"])
def clear_all():
    with sqlite3.connect(DB_FILE) as conn:
        conn.execute("DELETE FROM summaries")
        conn.commit()
    return jsonify({"message": "All summaries cleared"})

if __name__ == "__main__":
    app.run(debug=True)
