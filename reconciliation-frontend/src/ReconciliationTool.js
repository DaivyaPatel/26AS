import React, { useState, useRef } from "react";
import axios from "axios";
import "./ReconciliationTool.css";

const API_BASE = "http://localhost:5000";

const FileUploadBox = ({ label, sublabel, icon, fileKey, file, onFileChange }) => {
  const inputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFileChange(fileKey, dropped);
  };

  const handleDragOver = (e) => e.preventDefault();

  return (
    <div
      className={`upload-box ${file ? "upload-box--filled" : ""}`}
      onClick={() => inputRef.current.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv,.pdf"
        style={{ display: "none" }}
        onChange={(e) => onFileChange(fileKey, e.target.files[0])}
      />
      <div className="upload-icon">{file ? "✅" : icon}</div>
      <div className="upload-label">{label}</div>
      <div className="upload-sublabel">
        {file ? (
          <span className="file-name">📄 {file.name}</span>
        ) : (
          sublabel
        )}
      </div>
      {!file && <div className="upload-hint">Click or drag & drop</div>}
      {file && (
        <button
          className="remove-btn"
          onClick={(e) => {
            e.stopPropagation();
            onFileChange(fileKey, null);
          }}
        >
          ✕ Remove
        </button>
      )}
    </div>
  );
};

const SummaryCard = ({ label, value, color }) => (
  <div className={`summary-card summary-card--${color}`}>
    <div className="summary-value">{value}</div>
    <div className="summary-label">{label}</div>
  </div>
);

export default function ReconciliationTool() {
  const [files, setFiles] = useState({
    form26as: null,
    ledger_direct: null,
    ledger_indirect: null,
  });
  const [status, setStatus] = useState("idle"); // idle | uploading | success | error
  const [summary, setSummary] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [progress, setProgress] = useState(0);

  const handleFileChange = (key, file) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
    if (status !== "idle") {
      setStatus("idle");
      setSummary(null);
    }
  };

  const allFilesSelected = files.form26as && files.ledger_direct && files.ledger_indirect;

  const handleReconcile = async () => {
    if (!allFilesSelected) return;

    setStatus("uploading");
    setProgress(0);
    setErrorMsg("");
    setSummary(null);

    const formData = new FormData();
    formData.append("form26as", files.form26as);
    formData.append("ledger_direct", files.ledger_direct);
    formData.append("ledger_indirect", files.ledger_indirect);

    try {
      const response = await axios.post(`${API_BASE}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded * 100) / e.total);
          setProgress(pct);
        },
      });

      setSummary(response.data.summary);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err.response?.data?.error || "Something went wrong. Please check your files and try again."
      );
    }
  };

  const handleDownload = () => {
    window.open(`${API_BASE}/download`, "_blank");
  };

  const handleReset = () => {
    setFiles({ form26as: null, ledger_direct: null, ledger_indirect: null });
    setStatus("idle");
    setSummary(null);
    setErrorMsg("");
    setProgress(0);
  };

  return (
    <div className="app-wrapper">
      {/* Background grid */}
      <div className="bg-grid" />

      {/* Header */}
      <header className="app-header">
        <div className="header-badge">TDS RECONCILIATION</div>
        <h1 className="app-title">
          26AS <span className="title-accent">×</span> Tally
        </h1>
        <p className="app-subtitle">
          Upload your Form 26AS and both Tally ledgers — get a reconciliation report in seconds.
        </p>
      </header>

      {/* Main Card */}
      <main className="main-card">

        {/* Step 1 — Upload */}
        <section className="section">
          <div className="section-header">
            <span className="step-badge">01</span>
            <h2 className="section-title">Upload Your Files</h2>
          </div>

          <div className="upload-grid">
            <FileUploadBox
              label="Form 26AS"
              sublabel="From Income Tax Portal"
              icon="🏛️"
              fileKey="form26as"
              file={files.form26as}
              onFileChange={handleFileChange}
            />
            <FileUploadBox
              label="Tally Ledger — Direct Tax"
              sublabel="TDS Direct Tax (Books)"
              icon="📒"
              fileKey="ledger_direct"
              file={files.ledger_direct}
              onFileChange={handleFileChange}
            />
            <FileUploadBox
              label="Tally Ledger — Indirect Tax"
              sublabel="TDS Indirect Tax (Books)"
              icon="📗"
              fileKey="ledger_indirect"
              file={files.ledger_indirect}
              onFileChange={handleFileChange}
            />
          </div>

          <div className="format-note">
            Accepted formats: <strong>.xlsx &nbsp;·&nbsp; .xls &nbsp;·&nbsp; .csv &nbsp;·&nbsp; .pdf</strong>
          </div>
        </section>

        {/* Divider */}
        <div className="divider" />

        {/* Step 2 — Reconcile */}
        <section className="section">
          <div className="section-header">
            <span className="step-badge">02</span>
            <h2 className="section-title">Run Reconciliation</h2>
          </div>

          <button
            className={`reconcile-btn ${!allFilesSelected ? "reconcile-btn--disabled" : ""} ${status === "uploading" ? "reconcile-btn--loading" : ""}`}
            onClick={handleReconcile}
            disabled={!allFilesSelected || status === "uploading"}
          >
            {status === "uploading" ? (
              <>
                <span className="spinner" />
                Processing... {progress > 0 && progress < 100 ? `${progress}%` : ""}
              </>
            ) : (
              <>⚡ Reconcile Now</>
            )}
          </button>

          {!allFilesSelected && status === "idle" && (
            <p className="hint-text">Upload all 3 files above to enable reconciliation</p>
          )}
        </section>

        {/* Error */}
        {status === "error" && (
          <div className="error-box">
            <span className="error-icon">❌</span>
            <div>
              <strong>Error</strong>
              <p>{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Success + Summary */}
        {status === "success" && summary && (
          <>
            <div className="divider" />
            <section className="section">
              <div className="section-header">
                <span className="step-badge">03</span>
                <h2 className="section-title">Reconciliation Summary</h2>
              </div>

              <div className="summary-grid">
                <SummaryCard label="Matched" value={summary.matched} color="green" />
                <SummaryCard label="Partial Match" value={summary.partial} color="yellow" />
                <SummaryCard label="Unmatched" value={summary.unmatched} color="red" />
                <SummaryCard label="Tally Only" value={summary.tally_only} color="blue" />
              </div>

              <div className="amount-summary">
                <div className="amount-row">
                  <span className="amount-label">Total TDS as per 26AS</span>
                  <span className="amount-value">₹{summary.total_26as?.toLocaleString("en-IN")}</span>
                </div>
                <div className="amount-row">
                  <span className="amount-label">Total TDS as per Tally</span>
                  <span className="amount-value">₹{summary.total_tally?.toLocaleString("en-IN")}</span>
                </div>
                <div className={`amount-row amount-row--diff ${summary.net_difference !== 0 ? "amount-row--alert" : "amount-row--ok"}`}>
                  <span className="amount-label">Net Difference</span>
                  <span className="amount-value">
                    {summary.net_difference === 0 ? "✅ Nil" : `⚠️ ₹${Math.abs(summary.net_difference)?.toLocaleString("en-IN")}`}
                  </span>
                </div>
              </div>

              <div className="action-row">
                <button className="download-btn" onClick={handleDownload}>
                  ⬇️ Download Full Report (.xlsx)
                </button>
                <button className="reset-btn" onClick={handleReset}>
                  🔄 New Reconciliation
                </button>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>26AS × Tally Reconciliation Tool &nbsp;·&nbsp; Built for CA Professionals</p>
      </footer>
    </div>
  );
}
