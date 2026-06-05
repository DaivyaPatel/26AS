from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
import os
from reconciliation import reconcile_files

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "outputs"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

@app.route("/upload", methods=["POST"])
def upload():
    try:
        # Expect 3 files
        if "form26as" not in request.files:
            return jsonify({"error": "Form 26AS file missing"}), 400
        if "ledger_direct" not in request.files:
            return jsonify({"error": "Direct Tax Ledger file missing"}), 400
        if "ledger_indirect" not in request.files:
            return jsonify({"error": "Indirect Tax Ledger file missing"}), 400

        form26as = request.files["form26as"]
        ledger_direct = request.files["ledger_direct"]
        ledger_indirect = request.files["ledger_indirect"]

        # Save uploaded files
        path_26as = os.path.join(UPLOAD_FOLDER, "form26as" + os.path.splitext(form26as.filename)[1])
        path_direct = os.path.join(UPLOAD_FOLDER, "ledger_direct" + os.path.splitext(ledger_direct.filename)[1])
        path_indirect = os.path.join(UPLOAD_FOLDER, "ledger_indirect" + os.path.splitext(ledger_indirect.filename)[1])

        form26as.save(path_26as)
        ledger_direct.save(path_direct)
        ledger_indirect.save(path_indirect)

        # Run reconciliation
        output_path, summary = reconcile_files(path_26as, path_direct, path_indirect, OUTPUT_FOLDER)

        return jsonify({
            "success": True,
            "summary": summary,
            "download_url": "/download"
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/download", methods=["GET"])
def download():
    output_path = os.path.join(OUTPUT_FOLDER, "reconciliation_report.xlsx")
    if not os.path.exists(output_path):
        return jsonify({"error": "Report not found"}), 404
    return send_file(output_path, as_attachment=True, download_name="26AS_Reconciliation_Report.xlsx")


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))

app = Flask(__name__, static_folder='reconciliation-frontend/build', static_url_path='')

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')