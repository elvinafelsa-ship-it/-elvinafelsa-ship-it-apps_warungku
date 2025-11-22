import { jsPDF } from "jspdf";
import { CartItem } from "../types";

export const generateReceipt = (items: CartItem[], total: number, cash: number, change: number) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, 150 + (items.length * 5)] // Dynamic height based on items
  });

  let y = 10;
  
  // Header
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("WARUNG MADURA", 40, y, { align: "center" });
  y += 5;
  doc.setFontSize(10);
  doc.text("ONLINE 24 JAM", 40, y, { align: "center" });
  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Jl. Digital No. 1, Cloud City", 40, y, { align: "center" });
  y += 5;
  doc.text("-------------------------------------------", 40, y, { align: "center" });
  y += 5;

  // Metadata
  const date = new Date().toLocaleString('id-ID');
  doc.text(`${date}`, 5, y);
  y += 5;
  doc.text("-------------------------------------------", 40, y, { align: "center" });
  y += 5;

  // Items
  items.forEach((item) => {
    // Item Name
    doc.setFont("helvetica", "bold");
    doc.text(item.name, 5, y);
    y += 4;
    
    // Qty x Price = Total
    doc.setFont("helvetica", "normal");
    const lineTotal = item.price * item.quantity;
    const line = `${item.quantity} x ${item.price.toLocaleString('id-ID')} = Rp ${lineTotal.toLocaleString('id-ID')}`;
    doc.text(line, 75, y, { align: "right" });
    y += 5;
  });

  // Footer Calculations
  doc.text("-------------------------------------------", 40, y, { align: "center" });
  y += 5;
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("TOTAL", 5, y);
  doc.text(`Rp ${total.toLocaleString('id-ID')}`, 75, y, { align: "right" });
  y += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("TUNAI", 5, y);
  doc.text(`Rp ${cash.toLocaleString('id-ID')}`, 75, y, { align: "right" });
  y += 5;

  doc.text("KEMBALI", 5, y);
  doc.text(`Rp ${change.toLocaleString('id-ID')}`, 75, y, { align: "right" });
  y += 10;

  // Thank You
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("TERIMA KASIH", 40, y, { align: "center" });
  y += 4;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Barang yang dibeli tidak dapat dikembalikan", 40, y, { align: "center" });

  // Save
  doc.save(`struk-warung-madura-${Date.now()}.pdf`);
};