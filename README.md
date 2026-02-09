🧠 LLM Text Summarizer

A full-stack AI-powered text summarization web application built using Flask (Python) for the backend and React.js for the frontend.
The app allows users to input text or upload PDFs and receive concise summaries generated using Large Language Models (LLMs).

🚀 Features

✨ AI-powered text summarization

📄 PDF upload & summarization

📝 Manual text input support

🕒 Summary history with timestamps

🔐 User authentication (Login)

📱 Fully responsive UI (mobile & desktop)

⚡ Fast and lightweight REST API

🗂 Clean project structure (frontend + backend)

🛠 Tech Stack
Frontend: 

React.js

HTML5

CSS3

JavaScript (ES6)

Axios

Backend: 

Python

Flask

Flask-CORS

SQLite

HuggingFace / LLM API (or local model)

📂 Project Structure:
LLM_Text_Summarizer/
│
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── uploads/           # ignored
│   └── database.db        # ignored
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Summarizer.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
├── package.json
└── README.md
