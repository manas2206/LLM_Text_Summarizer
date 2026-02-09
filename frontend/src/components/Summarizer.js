import React, { useState, useEffect } from "react";

const Summarizer = () => {

  const [text, setText] = useState("");
  const [model, setModel] = useState("bart");
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false); // ✅ Loader State
  const [error, setError] = useState("");

  // ---------------- Fetch History ----------------
  const fetchHistory = async () => {
    try {
      const res = await fetch("/history");
      const data = await res.json();
      setHistory(data);
    } catch {
      console.error("Failed to load history");
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // ---------------- Submit ----------------
  const handleSubmit = async () => {

    if (!text.trim() && !file) {
      alert("Please enter text or upload a file!");
      return;
    }

    setLoading(true);     // ✅ Start loader
    setError("");
    setSummary("");

    const formData = new FormData();
    formData.append("model", model);

    if (file) formData.append("file", file);
    else formData.append("text", text);

    try {

      const res = await fetch("/summarize", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.summary) {
        setSummary(data.summary);
        fetchHistory();
      } else {
        setError("Failed to generate summary.");
      }

    } catch (err) {
      setError("Server not responding.");

    } finally {
      setLoading(false);  // ✅ Stop loader
    }
  };

  // ---------------- Delete ----------------
  const handleDelete = async (id) => {
    await fetch(`/delete/${id}`, { method: "DELETE" });
    fetchHistory();
  };

  // ---------------- Clear ----------------
  const handleClearAll = async () => {
    await fetch(`/clear`, { method: "DELETE" });
    fetchHistory();
  };

  // ---------------- Download ----------------
  const handleDownload = (textContent, modelName) => {

    const element = document.createElement("a");

    const file = new Blob(
      [`Model: ${modelName.toUpperCase()}\n\nSummary:\n${textContent}`],
      { type: "text/plain" }
    );

    element.href = URL.createObjectURL(file);
    element.download = `summary_${modelName}.txt`;

    document.body.appendChild(element);
    element.click();
  };

  // ---------------- UI ----------------
  return (
    <div>

      {/* Text Input */}
      <textarea
        placeholder="Enter or paste text here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <br />

      {/* File Upload */}
      <input
        type="file"
        accept=".pdf,.txt"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <br />

      {/* Model */}
      <select value={model} onChange={(e) => setModel(e.target.value)}>
        <option value="bart">BART</option>
        <option value="t5">T5</option>
      </select>

      {/* Button */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className={loading ? "btn-loading" : ""}
      >
        {loading ? "⏳ Summarizing..." : "Summarize"}
      </button>

      {/* Error */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Output */}
      {summary && (
        <div className="history-item">
          <h3>Generated Summary</h3>

          <p>{summary}</p>

          <button onClick={() => handleDownload(summary, model)}>
            📥 Download Summary
          </button>
        </div>
      )}

      {/* History */}
      <div className="history">

        <h2>📜 History</h2>

        <button
          onClick={handleClearAll}
          style={{ background: "red" }}
        >
          🧹 Clear All
        </button>

        {history.map((item) => (

          <div className="history-item" key={item.id}>

            <p><b>Model:</b> {item.model.toUpperCase()}</p>

            <p>
              <b>Original:</b>{" "}
              {item.text.substring(0, 150)}...
            </p>

            <p><b>Summary:</b> {item.summary}</p>

            <button
              onClick={() =>
                handleDownload(item.summary, item.model)
              }
            >
              📥 Download
            </button>

            <button
              onClick={() => handleDelete(item.id)}
            >
              🗑️ Delete
            </button>

          </div>
        ))}
      </div>
    </div>
  );
};

export default Summarizer;
