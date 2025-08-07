import PDFDocument from "pdfkit";
import { format } from "date-fns";
import { getBankAccountById } from "./bankAccountService.js";
import { User } from "../models/index.js";

class PDFService {
  static async generateVoucher(order) {
    return new Promise(async (resolve, reject) => {
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
          .fontSize(11)
          .font("Helvetica-Bold")
          .text(
            `We are pleased to confirm your reservation made on ${format(
              new Date(order.createdOrder),
              "dd/MM/yyyy"
            )}`,
            { align: "left" }
          );
        doc.moveDown(0.5);
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .text("Here are the details of your reservation:", {
            align: "left",
          });
        doc.moveDown(0.5);
        // Reservation Details Section
        doc.fontSize(11).font("Helvetica");

        // Helper function to add label-value pairs with proper spacing
        const addField = (label, value, isRed = false) => {
          // Add label and value on the same line
          doc.font("Helvetica-Bold").text(label, { continued: true });
          doc.font("Helvetica").text(" ", { continued: true });
          if (isRed) doc.fillColor("red");
          doc.text(value);
          if (isRed) doc.fillColor("black");

          // Move down for spacing between fields
          doc.moveDown(0.5);
        };

        // Check in/out
        addField(
          "Check in/out:",
          `${format(new Date(order.checkIn), "dd.MM")} – ${format(
            new Date(order.checkOut),
            "dd.MM.yyyy"
          )}`
        );

        addField("Nights:", `${order.nights}`);

        addField("Property:", `${order.propertyName}`);

        addField("Location:", `${order.cityTravel} ${order.countryTravel}`);

        addField("Number:", `${order.reservationNumber}`, true);

        addField("Country:", `${order.clientCountry}`);

        addField("Client Name:", `${order.clientName}`);

        if (order.clientDocumentNumber) {
          addField("Client ID No:", `${order.clientDocumentNumber}`);
        }

        // Guests
        if (order.guests && Array.isArray(order.guests)) {
          const guestInfo = order.guests
            .map((guest) => {
              const age = guest.age ? guest.age : "N/A";
              return `${guest.name || "N/A"} (${age})`;
            })
            .join(", ");
          addField("Guests:", `${order.guests.length} person(s): ${guestInfo}`);
        }

        // Client phone
        if (order.clientPhone && Array.isArray(order.clientPhone)) {
          addField("Client Phone:", `(W) ${order.clientPhone.join(", ")}`);
        }

        // Financial Information Section
        doc.fontSize(11).font("Helvetica");

        const taxAmount = order.taxClean || 0;
        const totalWithTax = order.officialPrice + taxAmount;

        addField(
          "Official Price:",
          `${order.officialPrice}€+${taxAmount}€ (tax) =${totalWithTax}€`
        );

        addField("Total price:", `${order.totalPrice}€`);

        addField("Cash on check-in:", `${order.balanceAmount || 0}€`);

        // Bank Details Section
        if (order.bankAccount) {
          doc.fontSize(11).font("Helvetica");

          try {
            // Get agent's manager to access bank account
            const agent = await User.findByPk(order.agentId);
            if (!agent) {
              throw new Error("Agent not found");
            }

            if (!agent.managerId) {
              throw new Error("Agent not assigned to manager");
            }

            // Try to get bank account data by ID using manager's permissions
            const bankAccount = await getBankAccountById(
              order.bankAccount,
              agent.managerId, // Using managerId for permissions
              "manager" // Using manager role for permissions
            );

            if (bankAccount.bankName) {
              addField("Bank Name:", `${bankAccount.bankName}`);
            }
            if (bankAccount.swift) {
              addField("Swift &Bic:", `${bankAccount.swift}`);
            }
            if (bankAccount.iban) {
              addField("IBAN:", `${bankAccount.iban}`);
            }
            if (bankAccount.holderName) {
              addField("Holder (Beneficiar):", `${bankAccount.holderName}`);
            }
            if (bankAccount.address) {
              addField("Address:", `${bankAccount.address}`);
            }
          } catch (e) {
            console.log("Error getting bank account data:", e.message);
            // Fallback to old format if bank account not found
            try {
              const bankInfo =
                typeof order.bankAccount === "string"
                  ? JSON.parse(order.bankAccount)
                  : order.bankAccount;

              if (bankInfo.bankName) {
                addField("Bank Name:", `${bankInfo.bankName}`);
              }
              if (bankInfo.swift) {
                addField("Swift &Bic:", `${bankInfo.swift}`);
              }
              if (bankInfo.iban) {
                addField("IBAN:", `${bankInfo.iban}`);
              }
              if (bankInfo.holder) {
                addField("Holder (Beneficiar):", `${bankInfo.holder}`);
              }
              if (bankInfo.address) {
                addField("Address:", `${bankInfo.address}`);
              }
            } catch (e2) {
              console.log("Error parsing bank account JSON:", e2.message);
              // Final fallback - show as string
              addField("Bank Account:", `${order.bankAccount}`);
            }
          }
        }

        doc.moveDown(1);

        // Deposit and Payment Notes
        doc
          .fontSize(11)
          .font("Helvetica")
          .text(
            "With deposit within three working days the reservation will be confirmed. If there is a delay in payment, please inform us; otherwise, the reservation will be canceled. Deposit is refundable before 60 days till your arrival and non-refundable after 59 days till your arrival."
          );

        doc.moveDown(1);
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .fillColor("red")
          .text(`Note on Payment: ${order.reservationNumber}`);
        doc.text(
          "PLEASE DO NOT FORGET TO WRITE ON THE NOTES OF PAYMENT THE RESERVATION NUMBER."
        );
        doc.fillColor("black");

        doc.moveDown(1);

        // General Rules Section
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .text("GENERAL RULES AND POLICIES:");

        doc.moveDown(0.5);
        doc.fontSize(10).font("Helvetica");

        doc.text(
          '• In your payment it is including all government taxes and commissions of intermediaries between you "Guest" who make a reservation and your vacation rental property in Greece.'
        );
        doc.text(
          "• You must bring on check-in one photocopy of your primary ID which includes your photo."
        );
        doc.text(
          "• This property does not require a damage deposit during check-in which is at 15:30; however, check-out is till 10:30 and can be completed after inspection of the general condition of the house."
        );
        doc.text(
          "• Please note that according to Greek law, quiet hours are enforced from 3:00 PM to 6:00 PM and from 10:30 PM to 7:30 AM. During these times, loud noises are prohibited. By accepting this reservation, you agree to adhere to these rules."
        );

        doc.moveDown(1);

        // Personal Data Protection Section
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .text(
            "PERSONAL DATA PROTECTION DECLARATION - SECURITY & PRIVACY POLICY"
          );

        doc.moveDown(0.5);
        doc.fontSize(10).font("Helvetica");

        doc.text(
          "• We wish to hereby inform you that our company complies with the protection framework for natural persons with regard to the processing of personal data, as established by the new Regulation (EU) 2016/679 of the European Parliament."
        );
        doc.text(
          "• Personal data is defined as information that can be used to identify you, such as your name, e-mail address, postal address, etc. Our company does not collect your personal data unless you have explicitly provided it for a specific purpose and under the condition that you have consented to their use."
        );
        doc.text(
          "• The Company stores your personal data in order to update the customer registration book, keeping which is mandatory by law, and uses it only if you consent to receiving newsletters (evaluation form, special offers etc.)."
        );
        doc.text(
          "• The company reserves the right to disclose information pertaining to you if the law so requires or if such disclosure is demanded by the competent government authorities, administrative authorities, or law enforcement."
        );
        doc.text(
          "• The Company guarantees that it will not transmit, share, disclose etc. your personal data to third parties for any purpose or use, but may send you newsletters via e-mail."
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default PDFService;
