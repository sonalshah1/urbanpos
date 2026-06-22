import type { PrintSize } from "@/types/domain";

export function printInvoice(printSize: PrintSize) {
  document.documentElement.dataset.printSize = printSize;
  window.print();
  window.setTimeout(() => {
    delete document.documentElement.dataset.printSize;
  }, 500);
}
