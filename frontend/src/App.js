import React, { useState, useEffect } from "react";
import "./App.css";

function App() {

  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState("bart");
  const [file, setFile] = useState(null);
  const [dark, setDark] = useState(false);
  const [history, setHistory] = useState([]);

  const API = "http://127.0.0.1:5000";


  // ================= Load History =================
  const loadHistory = async () => {
    try {

      const res = await fetch(`${API}/history`);
      if (!res.ok) throw new Error();

      const data = await res.json();
      setHistory(data);

    } catch {
      console.log("Backend not connected");
    }
  };


  useEffect(() => {
    loadHistory();
  }, []);


  // ================= Download =================
  const downloadSummary = (text) => {

    if (!text) {
      alert("No summary to download!");
      return;
    }

    const blob = new Blob([text], {
      type: "text/plain;charset=utf-8",
    });

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "summary.txt";

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };


  // ================= Summarize =================
  const handleSummarize = async () => {

    if (!text.trim() && !file) {
      alert("Enter text or upload file!");
      return;
    }

    setLoading(true);

    try {

      let res;

      // -------- File Upload --------
      if (file) {

        const formData = new FormData();

        formData.append("file", file);
        formData.append("model", model);

        res = await fetch(`${API}/summarize`, {
          method: "POST",
          body: formData,
        });

      }

      // -------- Text Input --------
      else {

        res = await fetch(`${API}/summarize`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text, model }),
        });

      }

      if (!res.ok) throw new Error();

      const data = await res.json();


      if (data.summary) {

        setSummary(data.summary);
        setText("");
        setFile(null);

        loadHistory();

      } else {
        alert("No summary received!");
      }

    } catch {

      alert("Server Error! Start backend first.");

    }

    setLoading(false);
  };


  // ================= Delete =================
  const deleteItem = async (id) => {

    try {

      await fetch(`${API}/delete/${id}`, {
        method: "DELETE",
      });

      loadHistory();

    } catch {
      alert("Delete failed!");
    }
  };


  // ================= Clear All =================
  const clearAll = async () => {

    if (!window.confirm("Delete all history?")) return;

    try {

      await fetch(`${API}/clear`, {
        method: "DELETE",
      });

      loadHistory();

    } catch {
      alert("Clear failed!");
    }
  };



  return (

    <div className={dark ? "app dark" : "app"}>


      {/* ================= Navbar ================= */}
      <nav className="navbar">

        <h2>🧠 LLM Summarizer</h2>

        <button
          className="dark-btn"
          onClick={() => setDark(!dark)}
        >
          {dark ? "☀ Light" : "🌙 Dark"}
        </button>

      </nav>



      {/* ================= Main ================= */}
      <div className="main">


        {/* -------- Input Card -------- */}
        <div className="card">

          <h3>📥 Input</h3>

          <textarea
            placeholder="Paste your text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />


          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={(e) => setFile(e.target.files[0])}
          />


          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            <option value="bart">BART</option>
            <option value="t5">T5</option>
          </select>


          <button
            className={loading ? "btn-loading" : ""}
            disabled={loading}
            onClick={handleSummarize}
          >
            {loading ? "⏳ Processing..." : "✨ Summarize"}
          </button>

        </div>



        {/* -------- Result Card -------- */}
        <div className="card">

          <h3>📝 Summary</h3>

          <div className="output">
            {summary || "Summary will appear here..."}
          </div>


          {summary && (
            <button onClick={() => downloadSummary(summary)}>
              📥 Download Summary
            </button>
          )}

        </div>


      </div>



      {/* ================= History ================= */}
      <div className="history">

        <h2>📜 History</h2>


        {history.length > 0 && (

          <button
            className="clear-btn"
            onClick={clearAll}
          >
            🧹 Clear All
          </button>

        )}


        {history.map((item) => (

          <div key={item.id} className="history-item">

            <p><b>Model:</b> {item.model}</p>


            <p className="short">
              {item.text.substring(0, 150)}...
            </p>


            <p>{item.summary}</p>


            <button onClick={() => downloadSummary(item.summary)}>
              📥 Download
            </button>


            <button
              className="delete-btn"
              onClick={() => deleteItem(item.id)}
            >
              🗑 Delete
            </button>

          </div>

        ))}

      </div>



      {/* ================= Footer ================= */}
      <footer>

        Built with React + Flask + SQLite + Transformers <br />
        © 2026 AI Summarizer

      </footer>


    </div>
  );
}

export default App;
