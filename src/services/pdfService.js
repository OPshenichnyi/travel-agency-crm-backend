import PDFDocument from "pdfkit";
import { format } from "date-fns";

class PDFService {
  static generateVoucher(order) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50,
          },
        });

        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // Header
        doc
          .fontSize(20)
          .font("Helvetica-Bold")
          .text("TRAVEL AGENCY", { align: "center" });

        doc.moveDown(0.5);
        doc
          .fontSize(14)
          .font("Helvetica")
          .text(
            `We are pleased to confirm your reservation made on ${format(
              new Date(order.createdOrder),
              "dd.MM.yyyy"
            )}`,
            { align: "center" }
          );

        doc.moveDown(2);

        // Main information
        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("RESERVATION DETAILS", { underline: true });

        doc.moveDown(1);
        doc.fontSize(12).font("Helvetica");

        // Check in/out
        doc.text(
          `Check in/out: ${format(
            new Date(order.checkIn),
            "dd.MM.yyyy"
          )} – ${format(new Date(order.checkOut), "dd.MM.yyyy")}`
        );
        doc.text(`Nights: ${order.nights}`);
        doc.text(`Property: ${order.propertyName}`);
        doc.text(`Location: ${order.cityTravel}, ${order.countryTravel}`);
        doc.text(`Number: ${order.reservationNumber}`);
        doc.text(`Client Name: ${order.clientName}`);

        if (order.clientDocumentNumber) {
          doc.text(`Client ID No: ${order.clientDocumentNumber}`);
        }

        // Guests
        if (order.guests && Array.isArray(order.guests)) {
          doc.text(`Guests: ${order.guests.length} person(s)`);
          order.guests.forEach((guest, index) => {
            doc.text(
              `  ${index + 1}. ${guest.name || "N/A"} - ${
                guest.age || "N/A"
              } years`
            );
          });
        }

        // Client phone
        if (order.clientPhone && Array.isArray(order.clientPhone)) {
          doc.text(`Client Phone: ${order.clientPhone.join(", ")}`);
        }

        doc.moveDown(1);

        // Financial information
        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("FINANCIAL INFORMATION", { underline: true });

        doc.moveDown(1);
        doc.fontSize(12).font("Helvetica");

        const taxAmount = order.taxClean || 0;
        const totalWithTax = order.officialPrice + taxAmount;

        doc.text(
          `Official Price: ${order.officialPrice}€ + ${taxAmount}€ (tax) = ${totalWithTax}€`
        );
        doc.text(`Total price: ${order.totalPrice}€`);
        doc.text(`Cash on check-in: ${order.balanceAmount || 0}€`);

        doc.moveDown(1);

        // Bank account information
        if (order.bankAccount) {
          doc
            .fontSize(16)
            .font("Helvetica-Bold")
            .text("BANK ACCOUNT DETAILS", { underline: true });

          doc.moveDown(1);
          doc.fontSize(12).font("Helvetica");

          try {
            const bankInfo =
              typeof order.bankAccount === "string"
                ? JSON.parse(order.bankAccount)
                : order.bankAccount;

            if (bankInfo.accountNumber) {
              doc.text(`Account Number: ${bankInfo.accountNumber}`);
            }
            if (bankInfo.bankName) {
              doc.text(`Bank Name: ${bankInfo.bankName}`);
            }
            if (bankInfo.iban) {
              doc.text(`IBAN: ${bankInfo.iban}`);
            }
            if (bankInfo.swift) {
              doc.text(`SWIFT: ${bankInfo.swift}`);
            }
          } catch (e) {
            doc.text(`Bank Account: ${order.bankAccount}`);
          }

          doc.text(`Note on Payment: ${order.reservationNumber}`);
        }

        doc.moveDown(2);

        // Static text
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("IMPORTANT INFORMATION", { underline: true });

        doc.moveDown(1);
        doc.fontSize(10).font("Helvetica");

        doc.text("Deposit Rules (60/59 days):");
        doc
          .fontSize(9)
          .text("• Deposit must be paid within 60 days before check-in");
        doc.text(
          "• Cancellation policy applies according to Greek legislation"
        );

        doc.moveDown(0.5);
        doc.fontSize(10).text("Check-in/Check-out:");
        doc.fontSize(9).text("• Check-in: 15:00 - 18:00");
        doc.text("• Check-out: 08:00 - 11:00");

        doc.moveDown(0.5);
        doc.fontSize(10).text("Quiet Hours (Greek Law):");
        doc.fontSize(9).text("• 15:00 - 17:30 and 22:00 - 07:00");

        doc.moveDown(0.5);
        doc.fontSize(10).text("Personal Data Protection:");
        doc
          .fontSize(9)
          .text(
            "• Your personal data is protected according to GDPR regulations"
          );
        doc.text("• Data is used only for reservation purposes");

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default PDFService;
