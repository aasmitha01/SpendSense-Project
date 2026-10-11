
import { useEffect, useRef, useState } from "react";
import { createWorker } from "tesseract.js";
import {
  ScanLine,
  Upload,
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Save,
} from "lucide-react";
import api from "../services/api";

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const initialForm = () => ({
  title: "",
  amount: "",
  category: "Shopping",
  type: "expense",
  transaction_date: today(),
  description: "",
});

const categories = [
  "Food",
  "Groceries",
  "Shopping",
  "Transport",
  "Utilities",
  "Healthcare",
  "Education",
  "Entertainment",
  "Travel",
  "Other",
];

function detectCategory(text) {
  const value = text.toLowerCase();

  if (/restaurant|cafe|coffee|food|pizza|burger|hotel|bakery/.test(value)) {
    return "Food";
  }
  if (/supermarket|grocery|vegetable|provision|mart/.test(value)) {
    return "Groceries";
  }
  if (/petrol|fuel|taxi|uber|ola|bus|train|metro/.test(value)) {
    return "Transport";
  }
  if (/pharmacy|medical|hospital|clinic/.test(value)) {
    return "Healthcare";
  }
  if (/electricity|water bill|internet|broadband|mobile recharge/.test(value)) {
    return "Utilities";
  }
  if (/movie|cinema|theatre|gaming/.test(value)) {
    return "Entertainment";
  }

  return "Shopping";
}

function detectAmount(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  const totalLines = lines.filter((line) =>
    /\b(grand\s+total|total\s+amount|amount\s+due|balance\s+due|net\s+amount|total|payable)\b/i.test(
      line
    )
  );

  const candidates = [];

  // Prefer amounts found on lines mentioning a total.
  for (const line of totalLines) {
    const matches = line.match(/(?:₹|rs\.?|inr)?\s*\d[\d,]*(?:\.\d{1,2})?/gi) || [];

    for (const match of matches) {
      const amount = Number(
        match.replace(/₹|rs\.?|inr/gi, "").replace(/,/g, "").trim()
      );

      if (Number.isFinite(amount) && amount > 0) {
        candidates.push(amount);
      }
    }
  }

  if (candidates.length > 0) {
    return candidates[candidates.length - 1].toFixed(2);
  }

  // Fallback: use the largest plausible amount, but ask the user to verify it.
  const matches =
    text.match(/(?:₹|rs\.?|inr)\s*\d[\d,]*(?:\.\d{1,2})?/gi) || [];

  const amounts = matches
    .map((match) =>
      Number(match.replace(/₹|rs\.?|inr/gi, "").replace(/,/g, "").trim())
    )
    .filter((amount) => Number.isFinite(amount) && amount > 0);

  return amounts.length ? Math.max(...amounts).toFixed(2) : "";
}

function detectDate(text) {
  const patterns = [
    /\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/,
    /\b(\d{1,2})[-/](\d{1,2})[-/](20\d{2})\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;

    let year;
    let month;
    let day;

    if (match[1].length === 4) {
      [, year, month, day] = match;
    } else {
      [, day, month, year] = match;
    }

    const candidate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

    if (
      candidate.getFullYear() === Number(year) &&
      candidate.getMonth() === Number(month) - 1 &&
      candidate.getDate() === Number(day)
    ) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  return today();
}

function detectMerchant(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 2);

  const ignored = /^(tax invoice|receipt|invoice|cash memo|bill|gst invoice)$/i;

  return (
    lines.find(
      (line) =>
        !ignored.test(line) &&
        !/^(date|time|phone|tel|gstin|invoice no|bill no)/i.test(line) &&
        !/^\d[\d\s/-]*$/.test(line)
    ) || "Receipt transaction"
  ).slice(0, 100);
}

function ReceiptScanner() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [form, setForm] = useState(initialForm);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reviewRequired, setReviewRequired] = useState(false);
  const fileInput = useRef(null);

  useEffect(() => {
    if (!image) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(image);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [image]);

  const updateForm = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const selectImage = (file) => {
    setError("");
    setNotice("");
    setOcrText("");
    setReviewRequired(false);

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Please choose an image smaller than 10 MB.");
      return;
    }

    setImage(file);
    setForm(initialForm());
  };

  const scanReceipt = async () => {
    if (!image) {
      setError("Upload or capture a receipt image first.");
      return;
    }

    setScanning(true);
    setProgress(0);
    setError("");
    setNotice("");

    let worker;

    try {
      worker = await createWorker("eng", 1, {
        logger: (message) => {
          if (message.status === "recognizing text") {
            setProgress(Math.round((message.progress || 0) * 100));
          }
        },
      });

      const result = await worker.recognize(image);
      const text = result.data.text || "";

      if (!text.trim()) {
        throw new Error(
          "No readable text was found. Try a clearer, well-lit receipt image."
        );
      }

      setOcrText(text);

      const merchant = detectMerchant(text);
      const amount = detectAmount(text);
      const date = detectDate(text);
      const category = detectCategory(`${merchant}\n${text}`);

      setForm({
        title: merchant,
        amount,
        category,
        type: "expense",
        transaction_date: date,
        description: `Imported from receipt using OCR.\n\n${text.slice(0, 1500)}`,
      });

      setReviewRequired(true);
      setNotice(
        "Receipt scanned. Please verify the amount, date, merchant, and category before saving."
      );
    } catch (err) {
      setError(err.message || "Receipt scanning failed. Please try again.");
    } finally {
      if (worker) {
        await worker.terminate();
      }

      setScanning(false);
    }
  };

  const saveTransaction = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const amount = Number(form.amount);

    if (!form.title.trim()) {
      setError("Enter a transaction title.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Check the receipt and enter a valid amount.");
      return;
    }

    if (!form.transaction_date) {
      setError("Select a transaction date.");
      return;
    }

    let user;

    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        throw new Error("Please log in before saving a transaction.");
      }

      user = JSON.parse(storedUser);

      if (!user?.id) {
        throw new Error("Your user ID was not found. Please log in again.");
      }
    } catch (err) {
      setError(err.message || "Unable to identify the logged-in user.");
      return;
    }

    setSaving(true);

    try {
      await api.post("/transactions", {
        user_id: user.id,
        title: form.title.trim(),
        type: form.type,
        category: form.category,
        amount,
        description: form.description.trim(),
        transaction_date: form.transaction_date,
      });

      setNotice("Transaction saved successfully!");
      setImage(null);
      setOcrText("");
      setForm(initialForm());
      setReviewRequired(false);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save the transaction. Check your API and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100">
            <ScanLine className="h-6 w-6 text-violet-700" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Upload your receipt
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Select a clear JPG, PNG, or other browser-supported image. OCR
              runs in your browser, and the image is not uploaded to our
              backend by this scanner.
            </p>
          </div>
        </div>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          onChange={(event) => selectImage(event.target.files?.[0])}
          className="hidden"
        />

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
          >
            <Upload className="h-4 w-4" />
            Upload receipt
          </button>

          <button
            type="button"
            onClick={() => {
              if (fileInput.current) {
                fileInput.current.setAttribute("capture", "environment");
                fileInput.current.click();
                fileInput.current.removeAttribute("capture");
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Camera className="h-4 w-4" />
            Take photo
          </button>
        </div>

        {preview && (
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
              <img
                src={preview}
                alt="Selected receipt preview"
                className="max-h-[420px] w-full rounded-lg object-contain"
              />
            </div>

            <div className="flex flex-col justify-center">
              <p className="font-semibold text-slate-900">
                Ready to scan
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                For the best result, make sure the merchant name, total, and
                date are clear and not cut off.
              </p>

              <button
                type="button"
                onClick={scanReceipt}
                disabled={scanning}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {scanning ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <ScanLine className="h-4 w-4" />
                )}
                {scanning ? `Scanning... ${progress}%` : "Scan receipt"}
              </button>

              {scanning && (
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-violet-600 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {notice && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          {notice}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {reviewRequired && (
        <form
          onSubmit={saveTransaction}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <FileText className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Review detected details
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                OCR can make mistakes. Verify every field before saving.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Merchant / title
              <input
                required
                maxLength={100}
                value={form.title}
                onChange={(event) => updateForm("title", event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-violet-500"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Amount (₹)
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(event) => updateForm("amount", event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-violet-500"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Transaction type
              <select
                value={form.type}
                onChange={(event) => updateForm("type", event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-violet-500"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Category
              <select
                value={form.category}
                onChange={(event) => updateForm("category", event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-violet-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Transaction date
              <input
                required
                type="date"
                value={form.transaction_date}
                onChange={(event) =>
                  updateForm("transaction_date", event.target.value)
                }
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-violet-500"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Description
              <textarea
                rows={3}
                value={form.description}
                onChange={(event) =>
                  updateForm("description", event.target.value)
                }
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-violet-500"
              />
            </label>
          </div>

          {ocrText && (
            <details className="mt-5 rounded-xl border border-slate-200 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                View extracted receipt text
              </summary>
              <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-slate-600">
                {ocrText}
              </pre>
            </details>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save transaction"}
          </button>
        </form>
      )}
    </section>
  );
}

export default ReceiptScanner;
