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
          margins: { top: 35, bottom: 35, left: 45, right: 45 },
        });

        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // Fetch agent info once for both name and bank account lookup
        let agentName = "";
        let agentManagerId = null;
        try {
          const agent = await User.findByPk(order.agentId);
          if (agent) {
            agentName = agent.firstName || "";
            agentManagerId = agent.managerId;
          }
        } catch (e) {
          console.log("Error fetching agent:", e.message);
        }

        // Helper: label (normal) + value (bold by default)
        const addField = (label, value, opts = {}) => {
          const { valueBold = true, labelFont = "Helvetica" } = opts;
          doc.font(labelFont).fillColor("black").text(label, { continued: true });
          doc.text(" ", { continued: true });
          doc.font(valueBold ? "Helvetica-Bold" : "Helvetica").fillColor("black").text(value);
          doc.moveDown(0.1);
        };

        // ── TITLE ──────────────────────────────────────────────
        doc.fontSize(10).font("Helvetica-Bold").text("CUSTOMER RESERVATION FORM - VOUCHER");
        doc.moveDown(0.8);

        doc.fontSize(10).font("Helvetica").text("Dear Guests,");
        doc.moveDown(0.8);

        const createdDate = order.createdOrder
          ? format(new Date(order.createdOrder), "dd/MM/yyyy")
          : format(new Date(), "dd/MM/yyyy");

        doc
          .font("Helvetica")
          .text("We are pleased to confirm your reservation made on ", { continued: true });
        doc.font("Helvetica-Bold").text(`${createdDate}.`);
        doc.moveDown(0.8);

        doc.font("Helvetica").text("Here are the details of your reservation:");
        doc.moveDown(0.8);

        // ── RESERVATION FORM ───────────────────────────────────
        doc.fontSize(10).font("Helvetica").text("RESERVATION FORM");
        doc.moveDown(0.15);

        addField("Check-in:", format(new Date(order.checkIn), "dd.MM.yyyy"));
        addField("Check-out:", format(new Date(order.checkOut), "dd.MM.yyyy"));
        addField("Nights:", `${order.nights}`);
        addField("Property:", `${order.propertyName}`);
        addField("Reservation No.:", `${order.reservationNumber}`);
        if (agentName) {
          addField("Agent:", agentName);
        }

        doc.moveDown(0.8);

        // ── GUEST INFORMATION ──────────────────────────────────
        doc.fontSize(10).font("Helvetica").text("GUEST INFORMATION");
        doc.moveDown(0.15);

        addField("Guest Name:", `${order.clientName}`);

        if (order.clientDocumentNumber) {
          addField("Passport No.:", `${order.clientDocumentNumber}`);
        }

        addField("Country:", `${order.clientCountry}`);

        // Guests formatting
        if (order.guests && typeof order.guests === "object") {
          let guestInfo = "";
          if (order.guests.adults !== undefined) {
            const adultsCount = order.guests.adults;
            const children = order.guests.children || [];
            const childrenCount = children.length;
            if (childrenCount > 0) {
              const childrenAges = children.map((c) => {
                if (c.age === 0 && c.months) return `baby ${c.months} month`;
                if (c.age === 0) return "baby";
                return c.age;
              }).join(",");
              guestInfo = `${adultsCount} Adl + ${childrenCount} Chl (${childrenAges})`;
            } else {
              guestInfo = `${adultsCount} Adl`;
            }
          } else if (Array.isArray(order.guests)) {
            guestInfo = `${order.guests.length} person(s)`;
          }
          if (guestInfo) {
            addField("Guests:", guestInfo);
          }
        }

        if (order.clientPhone && Array.isArray(order.clientPhone) && order.clientPhone.length > 0) {
          addField("Phone:", `(W) ${order.clientPhone.join(", ")}`);
        }

        addField("E-mail:", order.clientEmail || "-");

        doc.moveDown(0.8);

        // ── PAYMENT DETAILS ────────────────────────────────────
        doc.fontSize(10).font("Helvetica").text("PAYMENT DETAILS");
        doc.moveDown(0.15);

        const taxAmount = order.taxClean || 0;
        const totalWithTax = (order.officialPrice || 0) + taxAmount;
        addField(
          "Official Price:",
          `${order.officialPrice}€ +${taxAmount}tax=${totalWithTax}`
        );

        // Deposit label includes payment method if available
        const depositMethods =
          order.depositPaymentMethods && order.depositPaymentMethods.length > 0
            ? order.depositPaymentMethods
            : null;
        const depositLabel = depositMethods
          ? `Deposit (${depositMethods.join(", ")}):`
          : "Deposit:";
        addField(depositLabel, `${order.depositAmount || 0}€`);

        // Balance label includes payment method if available
        const balanceMethods =
          order.balancePaymentMethods && order.balancePaymentMethods.length > 0
            ? order.balancePaymentMethods
            : null;
        const balanceLabel = balanceMethods
          ? `Balance (${balanceMethods.join(", ")}):`
          : "Balance (Cash on Check-in):";
        addField(balanceLabel, `${order.balanceAmount || 0}€`);

        addField("Damage Deposit:", "No");

        doc.moveDown(1.2);

        // ── BANK DETAILS ───────────────────────────────────────
        if (order.bankAccount) {
          try {
            if (!agentManagerId) throw new Error("Agent has no manager");

            const bankAccount = await getBankAccountById(
              order.bankAccount,
              agentManagerId,
              "manager"
            );

            if (bankAccount.bankName) {
              addField("Bank Name:", bankAccount.bankName, { valueBold: false });
            }
            if (bankAccount.swift) {
              addField("Swift &Bic:", bankAccount.swift, { valueBold: false });
            }
            if (bankAccount.iban) {
              addField("IBAN:", bankAccount.iban, { valueBold: false });
            }
            if (bankAccount.holderName) {
              addField("COMPANY:", bankAccount.holderName, { valueBold: false });
            }
            addField("COUNTRY:", "GREECE", { valueBold: false });
            if (bankAccount.address) {
              addField("ADDRESS:", bankAccount.address, { valueBold: false });
            }
          } catch (e) {
            console.log("Error getting bank account data:", e.message);
            // Fallback: try parsing as JSON object
            try {
              const bankInfo =
                typeof order.bankAccount === "string"
                  ? JSON.parse(order.bankAccount)
                  : order.bankAccount;
              if (bankInfo.bankName) addField("Bank Name:", bankInfo.bankName, { valueBold: false });
              if (bankInfo.swift) addField("Swift &Bic:", bankInfo.swift, { valueBold: false });
              if (bankInfo.iban) addField("IBAN:", bankInfo.iban, { valueBold: false });
              if (bankInfo.holderName || bankInfo.holder) {
                addField("COMPANY:", bankInfo.holderName || bankInfo.holder, { valueBold: false });
              }
              addField("COUNTRY:", "GREECE", { valueBold: false });
              if (bankInfo.address) addField("ADDRESS:", bankInfo.address, { valueBold: false });
            } catch (e2) {
              console.log("Error parsing bank account JSON:", e2.message);
            }
          }
        }

        doc.moveDown(0.8);

        // ── RED NOTE ───────────────────────────────────────────
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor("red")
          .text(
            "PLEASE DO NOT FORGET TO WRITE ON THE NOTES OF PAYMENT THE RESERVATION"
          )
          .fillColor("red")
          .text("NUMBER: ", { continued: true })
          .fillColor("black")
          .text(`${order.reservationNumber}`);

        doc.moveDown(0.8);

        // ── DEPOSIT POLICY ─────────────────────────────────────
        doc
          .fontSize(9)
          .font("Helvetica")
          .text(
            "With deposit within three working days the reservation will be confirmed."
          );
        doc.text(
          "If there is a delay in payment, please inform us; otherwise, the reservation will be canceled."
        );

        doc.moveDown(0.8);

        // ── GENERAL RULES ──────────────────────────────────────
        doc.fontSize(8).font("Helvetica");
        doc.text(
          '\u2022In your payment it is including all government taxes and commissions of intermediaries between you \u201cGuest\u201d who make a reservation and your vacation rental property in Greece.'
        );
        doc.text(
          "\u2022You must bring on check-in one photocopy of your primary ID which includes your photo."
        );
        doc.text(
          "\u2022This property does not require a damage deposit during check-in which is at 15:30; however, check-out is till 10:30 and can be completed after inspection of the general condition of the house."
        );
        doc.text(
          "\u2022Please note that according to Greek law, quiet hours are enforced from 3:00 PM to 6:00 PM and from 10:30 PM to 7:30 AM. During these times, loud noises are prohibited. By accepting this reservation, you agree to adhere to these rules."
        );

        doc.moveDown(0.4);

        // ── PRIVACY POLICY ─────────────────────────────────────
        doc
          .fontSize(7.5)
          .font("Helvetica-Bold")
          .text("PERSONAL DATA PROTECTION DECLARATION - SECURITY & PRIVACY POLICY");
        doc.moveDown(0.2);
        doc.font("Helvetica");
        doc.text(
          "\u2022We wish to hereby inform you that our company complies with the protection framework for natural persons with regard to the processing of personal data, as established by the new Regulation (EU) 2016/679 of the European Parliament."
        );
        doc.text(
          "\u2022Personal data is defined as information that can be used to identify you, such as your name, e-mail address, postal address, etc. Our company does not collect your personal data unless you have explicitly provided it for a specific purpose and under the condition that you have consented to their use."
        );
        doc.text(
          "\u2022The Company stores your personal data in order to update the customer registration book, keeping which is mandatory by law, and uses it only if you consent to receiving newsletters (evaluation form, special offers etc.)."
        );
        doc.text(
          "\u2022The company reserves the right to disclose information pertaining to you if the law so requires or if such disclosure is demanded by the competent government authorities, administrative authorities, or law enforcement."
        );
        doc.text(
          "\u2022The Company guarantees that it will not transmit, share, disclose etc. your personal data to third parties for any purpose or use, but may send you newsletters via e-mail."
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default PDFService;
