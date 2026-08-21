import React, { useEffect, useState } from "react";
import { profile as profileApi } from "../api/services";
import { errorMessage } from "../api/http";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Spinner from "../components/common/Spinner";
import PageHeader from "../components/storefront/PageHeader";

export default function Profile() {
  const { updateCustomer } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState({ name: "", companyName: "", email: "", phoneNumber: "", address: "" });
  const [savingDetails, setSavingDetails] = useState(false);

  const [pwd, setPwd] = useState({ oldPassword: "", newPassword: "", confirm: "" });
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const me = await profileApi.get();
        if (me) {
          setDetails({
            name: me.name || "",
            companyName: me.companyName || "",
            email: me.email || "",
            phoneNumber: me.phoneNumber || "",
            address: me.address || "",
          });
        }
      } catch (err) {
        toast.error(errorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const onDetails = (e) => setDetails({ ...details, [e.target.name]: e.target.value });
  const onPwd = (e) => setPwd({ ...pwd, [e.target.name]: e.target.value });

  const saveDetails = async (e) => {
    e.preventDefault();
    if (!details.phoneNumber.trim()) {
      toast.error("Phone number is required.");
      return;
    }
    setSavingDetails(true);
    try {
      const updated = await profileApi.update(details);
      // Keep the navbar greeting / cart pre-fill fresh.
      updateCustomer({
        name: updated?.name ?? details.name,
        phone: updated?.phoneNumber ?? details.phoneNumber,
        companyName: updated?.companyName ?? details.companyName,
      });
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSavingDetails(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (pwd.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (pwd.newPassword !== pwd.confirm) {
      toast.error("New passwords do not match.");
      return;
    }
    setSavingPwd(true);
    try {
      await profileApi.changePassword(pwd.oldPassword, pwd.newPassword);
      setPwd({ oldPassword: "", newPassword: "", confirm: "" });
      toast.success("Password changed successfully.");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <>
      <PageHeader title="My Profile" subtitle="Manage your details and password." crumb="Profile" />

      <div className="container section" style={{ paddingTop: 12 }}>
        {loading ? (
          <Spinner full />
        ) : (
          <div className="profile-grid">
            {/* Details */}
            <form className="card profile-card" onSubmit={saveDetails}>
              <h3>Your details</h3>
              <div className="field">
                <label>Full name</label>
                <input className="input" name="name" value={details.name} onChange={onDetails} placeholder="Your name" />
              </div>
              <div className="field">
                <label>Company / organization</label>
                <input className="input" name="companyName" value={details.companyName} onChange={onDetails} placeholder="Company or organization name" />
              </div>
              <div className="field">
                <label>Email</label>
                <input className="input" value={details.email} disabled readOnly />
                <div className="hint">Email can't be changed.</div>
              </div>
              <div className="field">
                <label>Phone number</label>
                <input className="input" name="phoneNumber" value={details.phoneNumber} onChange={onDetails} placeholder="+91 …" />
              </div>
              <div className="field">
                <label>Address</label>
                <textarea className="textarea" name="address" value={details.address} onChange={onDetails} placeholder="Shipping / billing address" />
              </div>
              <button className="btn btn-primary" disabled={savingDetails}>
                {savingDetails ? "Saving…" : "Save changes"}
              </button>
            </form>

            {/* Password */}
            <form className="card profile-card" onSubmit={savePassword}>
              <h3>Change password</h3>
              <div className="field">
                <label>Current password</label>
                <input className="input" type="password" name="oldPassword" value={pwd.oldPassword} onChange={onPwd} required autoComplete="current-password" />
              </div>
              <div className="field">
                <label>New password</label>
                <input className="input" type="password" name="newPassword" value={pwd.newPassword} onChange={onPwd} required autoComplete="new-password" placeholder="At least 8 characters" />
              </div>
              <div className="field">
                <label>Confirm new password</label>
                <input className="input" type="password" name="confirm" value={pwd.confirm} onChange={onPwd} required autoComplete="new-password" />
              </div>
              <button className="btn btn-primary" disabled={savingPwd}>
                {savingPwd ? "Updating…" : "Change password"}
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
