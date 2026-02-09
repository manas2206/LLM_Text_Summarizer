from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline
import sqlite3
import os
from werkzeug.utils import secure_filename
import PyPDF2
import docx


app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return "Backend is running successfully 🚀"


# ---------------- CONFIG ----------------

UPLOAD_FOLDER = "uploads"
DB_FILE = "database.db"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


# ---------------- DATABASE ----------------

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
        conn.commit()


init_db()


# ---------------- MODELS ----------------

models = {
    "bart": pipeline("summarization", model="facebook/bart-large-cnn"),
    "t5": pipeline("summarization", model="t5-small")
}


def get_model(name):
    return models.get(name, models["bart"])


# ---------------- FILE READERS ----------------

def read_pdf(path):

    text = ""

    with open(path, "rb") as f:

        reader = PyPDF2.PdfReader(f)

        for page in reader.pages:
            text += page.extract_text() or ""

    return text


def read_docx(path):

    doc = docx.Document(path)

    full_text = []

    for para in doc.paragraphs:
        full_text.append(para.text)

    return "\n".join(full_text)


def read_txt(path):

    with open(path, "r", encoding="utf-8") as f:
        return f.read()


# ---------------- ROUTES ----------------

@app.route("/summarize", methods=["POST"])
def summarize():

    try:

        text = ""
        model_name = "bart"


        # ---------- JSON (Normal Text) ----------
        if request.is_json:

            data = request.get_json()

            text = data.get("text", "")
            model_name = data.get("model", "bart")


        # ---------- FILE UPLOAD ----------
        else:

            model_name = request.form.get("model", "bart")

            if "file" not in request.files:
                return jsonify({"error": "No file uploaded"}), 400


            file = request.files["file"]

            if file.filename == "":
                return jsonify({"error": "Empty file"}), 400


            filename = secure_filename(file.filename)

            path = os.path.join(UPLOAD_FOLDER, filename)

            file.save(path)


            # ---------- Detect File Type ----------

            if filename.endswith(".pdf"):

                text = read_pdf(path)

            elif filename.endswith(".docx"):

                text = read_docx(path)

            elif filename.endswith(".txt"):

                text = read_txt(path)

            else:

                return jsonify({
                    "error": "Unsupported file type"
                }), 400


        # ---------- VALIDATION ----------

        if not text.strip():

            return jsonify({
                "error": "No text found in file"
            }), 400


        # ---------- SUMMARY ----------

        words = len(text.split())

        max_len = min(130, max(50, words // 2))


        summarizer = get_model(model_name)

        result = summarizer(
            text,
            max_length=max_len,
            min_length=30,
            do_sample=False
        )


        summary = result[0]["summary_text"]


        # ---------- SAVE DB ----------

        with sqlite3.connect(DB_FILE) as conn:

            conn.execute(
                "INSERT INTO summaries (text, summary, model) VALUES (?, ?, ?)",
                (text, summary, model_name)
            )

            conn.commit()


        return jsonify({
            "summary": summary,
            "model": model_name
        })


    except Exception as e:

        return jsonify({
            "error": "Server error",
            "details": str(e)
        }), 500



@app.route("/history")
def history():

    with sqlite3.connect(DB_FILE) as conn:

        data = conn.execute(
            "SELECT id, text, summary, model FROM summaries ORDER BY id DESC"
        ).fetchall()


    result = []

    for row in data:

        result.append({
            "id": row[0],
            "text": row[1],
            "summary": row[2],
            "model": row[3]
        })


    return jsonify(result)



@app.route("/clear", methods=["POST"])
def clear():

    with sqlite3.connect(DB_FILE) as conn:
        conn.execute("DELETE FROM summaries")
        conn.commit()

    return jsonify({"msg": "Cleared"})


# ---------------- MAIN ----------------

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
