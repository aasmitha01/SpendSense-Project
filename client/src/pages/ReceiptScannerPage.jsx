
import { ScanLine } from "lucide-react";
import ReceiptScanner from "../components/ReceiptScanner";

function ReceiptScannerPage() {
  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Page Header */}
      <div className="rounded-2xl bg-gradient-to-r from-violet-700 to-indigo-600 p-6 text-white shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <ScanLine className="h-8 w-8" />
          </div>

          <div className="min-w-0">
            <p className="text-sm text-violet-100">
              Less manual entry, easier tracking
            </p>

            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              Receipt-to-Transaction Scanner
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-violet-100">
              Scan a receipt, review the extracted details, and save them
              directly as a SpendSense transaction.
            </p>
          </div>
        </div>
      </div>

      {/* Receipt Scanner */}
      <section className="w-full min-w-0">
        <ReceiptScanner />
      </section>
    </div>
  );
}

export default ReceiptScannerPage;
