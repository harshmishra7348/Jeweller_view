import React, { useEffect, useState } from "react";
import PageHeader from "../../components/storefront/PageHeader";
import { adminProfile } from "../../api/services";
import { errorMessage } from "../../api/http";
import { useToast } from "../../context/ToastContext";
import Modal from "../../components/common/Modal";

export default function AdminProfile() {
  const toast = useToast();
  const [details, setDetails] = useState({ name: "", companyName: "", email: "", phoneNumber: "", address: "" });
  const [loading, setLoading] = useState(true);
  const [savingDetails, setSavingDetails] = useState(false);
  const [pwd, setPwd] = useState({ oldPassword: "", newPassword: "", confirm: "" });
  const [savingPwd, setSavingPwd] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: "", companyName: "", email: "", phoneNumber: "", address: "", password: "" });
  const [addingAdmin, setAddingAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const admin = await adminProfile.get();
        setDetails({
          name: admin.name || "",
          companyName: admin.companyName || "",
          email: admin.email || "",
          phoneNumber: admin.phoneNumber || "",
          address: admin.address || "",
        });
      } catch (err) {
        toast.error(errorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const onChange = (e) => setDetails({ ...details, [e.target.name]: e.target.value });
  const onPwdChange = (e) => setPwd({ ...pwd, [e.target.name]: e.target.value });
  const onNewAdminChange = (e) => setNewAdmin({ ...newAdmin, [e.target.name]: e.target.value });

  const saveDetails = async (e) => {
    e.preventDefault();
    if (!details.address.trim()) {
      toast.error("Address is required.");
      return;
    }
    setSavingDetails(true);
    try {
      const updated = await adminProfile.update(details);
      setDetails({
        name: updated.name || details.name,
        companyName: updated.companyName || details.companyName,
        email: updated.email || details.email,
        phoneNumber: updated.phoneNumber || details.phoneNumber,
        address: updated.address || details.address,
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
      toast.error("Passwords do not match.");
      return;
    }
    setSavingPwd(true);
    try {
      await adminProfile.changePassword(pwd.oldPassword, pwd.newPassword);
      setPwd({ oldPassword: "", newPassword: "", confirm: "" });
      toast.success("Password changed successfully.");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSavingPwd(false);
    }
  };

  const createAdmin = async (e) => {
    e.preventDefault();
    if (newAdmin.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setAddingAdmin(true);
    try {
      await adminProfile.createAdmin(newAdmin);
      toast.success("New admin account created.");
      setNewAdmin({ name: "", companyName: "", email: "", phoneNumber: "", address: "", password: "" });
      setShowCreateAdmin(false);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setAddingAdmin(false);
    }
  };

  return (
    <>
      <PageHeader title="Admin profile" subtitle="Edit your profile details and manage admin access." crumb="Profile" />
      <div className="container section" style={{ paddingTop: 12 }}>
        {loading ? (
          <div className="card profile-card"><p>Loading profile…</p></div>
        ) : (
          <div className="profile-grid">
            <form className="card profile-card" onSubmit={saveDetails}>
              <h3>My details</h3>
              <div className="field">
                <label>Full name</label>
                <input className="input" name="name" value={details.name} onChange={onChange} />
              </div>
              <div className="field">
                <label>Company / organization</label>
                <input className="input" name="companyName" value={details.companyName} onChange={onChange} />
              </div>
              <div className="field">
                <label>Email</label>
                <input className="input" value={details.email} disabled readOnly />
                <div className="hint">Email can't be changed.</div>
              </div>
              <div className="field">
                <label>Phone number</label>
                <input className="input" name="phoneNumber" value={details.phoneNumber} onChange={onChange} />
              </div>
              <div className="field">
                <label>Address *</label>
                <textarea className="textarea" name="address" value={details.address} onChange={onChange} required />
              </div>
              <button className="btn btn-primary" disabled={savingDetails}>{savingDetails ? "Saving…" : "Save profile"}</button>
            </form>

            <form className="card profile-card" onSubmit={savePassword}>
              <h3>Change password</h3>
              <div className="field">
                <label>Current password</label>
                <input className="input" type="password" name="oldPassword" value={pwd.oldPassword} onChange={onPwdChange} required autoComplete="current-password" />
              </div>
              <div className="field">
                <label>New password</label>
                <input className="input" type="password" name="newPassword" value={pwd.newPassword} onChange={onPwdChange} required autoComplete="new-password" placeholder="At least 8 characters" />
              </div>
              <div className="field">
                <label>Confirm new password</label>
                <input className="input" type="password" name="confirm" value={pwd.confirm} onChange={onPwdChange} required autoComplete="new-password" />
              </div>
              <button className="btn btn-primary" disabled={savingPwd}>{savingPwd ? "Updating…" : "Change password"}</button>
            </form>

            <div className="card profile-card">
              <h3>Manage admins</h3>
              <p className="muted">Create another admin who can sign in to the merchant console.</p>
              <button className="btn btn-outline btn-block" onClick={() => setShowCreateAdmin(true)}>Add another admin</button>
            </div>
          </div>
        )}
      </div>

      {showCreateAdmin && (
        <Modal
          title="Create admin user"
          onClose={() => setShowCreateAdmin(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowCreateAdmin(false)} disabled={addingAdmin}>Cancel</button>
              <button className="btn btn-primary" form="create-admin-form" disabled={addingAdmin}>{addingAdmin ? "Creating…" : "Create admin"}</button>
            </>
          }
        >
          <form id="create-admin-form" onSubmit={createAdmin}>
            <div className="field">
              <label>Name</label>
              <input className="input" name="name" value={newAdmin.name} onChange={onNewAdminChange} required />
            </div>
            <div className="field">
              <label>Company / organization <span className="muted">(optional)</span></label>
              <input className="input" name="companyName" value={newAdmin.companyName} onChange={onNewAdminChange} />
            </div>
            <div className="field">
              <label>Email</label>
              <input className="input" type="email" name="email" value={newAdmin.email} onChange={onNewAdminChange} required />
            </div>
            <div className="field">
              <label>Phone number</label>
              <input className="input" name="phoneNumber" value={newAdmin.phoneNumber} onChange={onNewAdminChange} />
            </div>
            <div className="field">
              <label>Address</label>
              <input className="input" name="address" value={newAdmin.address} onChange={onNewAdminChange} />
            </div>
            <div className="field">
              <label>Password</label>
              <input className="input" type="password" name="password" value={newAdmin.password} onChange={onNewAdminChange} required placeholder="At least 8 characters" />
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
