import React, { useState } from "react";
import { adminSales } from "../../api/services";
import { errorMessage } from "../../api/http";
import { useToast } from "../../context/ToastContext";

const EMAIL_REGEX =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export const AdminEmailPopUp = ({
  invoice,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();

  const [type, setType] = useState("CUSTOMER");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const sendMail = async () => {
    try {
      setLoading(true);

      if (type === "CUSTOMER") {
        await adminSales.resendMail(invoice.id);
      } else if (type === "TRANSPORT" && invoice?.transportEmail) {
        await adminSales.sendTransportMail(invoice.id, invoice?.transportEmail);
      } else {
        if (!email.trim()) {
          setAlert("Please enter email.");
          return;
        }

        if (!EMAIL_REGEX.test(email)) {
          setAlert("Please enter a valid email address.");
          return;
        }
        await adminSales.sendTransportMail(invoice.id, email);
      }

      toast.success("Mail sent successfully.");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="modal-overlay">
    <div className="modal-box">

      <div className="modal-header">
        <h3>Send Invoice Email</h3>

        <button
          className="close-btn"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <div className="modal-body">

        <label className="radio-item">
          <input
            type="radio"
            checked={type === "CUSTOMER"}
            onChange={() => setType("CUSTOMER")}
          />
          Send mail to Customer
          <div className="email">
            {invoice?.userMST?.email}
          </div>
        </label>

        <label className="radio-item">
          <input
            type="radio"
            checked={type === "TRANSPORT"}
            onChange={() => setType("TRANSPORT")}
          />
          Send mail to Transport
          <div className="email">
            {invoice?.transportEmail}
          </div>
        </label>

        <label className="radio-item">
          <input
            type="radio"
            checked={type === "OTHER"}
            onChange={() => setType("OTHER")}
          />
          Other Email
        </label>

        {type === "OTHER" && (
          <input
            className="email-input"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}
        {alert && (
          <div style={{ color: "red", fontSize: "0.8rem", marginTop: 4 }}>
            {alert}
          </div>
        )}
      </div>

      <div className="modal-footer">
        <button className="btn btn-outline" onClick={onClose}>
          Cancel
        </button>

        <button
          className="btn btn-primary"
          onClick={sendMail}
        >
          Send
        </button>
      </div>

    </div>
  </div>
);
};