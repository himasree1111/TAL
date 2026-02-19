import React from "react";
import supabase from "../../supabaseClient";
import { toast } from "react-toastify";

export default function BroadcastModal({ broadcastOpen, setBroadcastOpen, currentUser, setAdminNotifications }) {
  if (!broadcastOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => setBroadcastOpen(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Quick Broadcast</h3>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const title = fd.get("title");
          const msg = fd.get("msg");
          const rec = fd.get("rec");
          if (!title) { toast.warn("Title is required"); return; }
          try {
            const { data: resp } = await (await import("axios")).default.post(
              "/api/notifications/broadcast",
              { recipient_role: rec === "all" ? null : rec, title, message: msg, type: "broadcast", priority: "medium", created_by: currentUser?.email }
            );
            toast.success(`Broadcast sent to ${resp?.data?.count || 0} recipients!`);
            setBroadcastOpen(false);
            const { data: refreshed } = await supabase.from("notifications").select("*");
            if (refreshed) setAdminNotifications(refreshed);
          } catch (err) {
            toast.error("Error: " + err.message);
          }
        }}>
          <label>Title *<input name="title" placeholder="Notification title" required /></label>
          <label>Message<textarea name="msg" rows={4} placeholder="Message body" /></label>
          <label>Recipients<select name="rec">
            <option value="all">All Users</option>
            <option value="student">All Students</option>
            <option value="donor">All Donors</option>
            <option value="volunteer">All Volunteers</option>
          </select></label>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn primary" type="submit">Send</button>
            <button className="btn" type="button" onClick={() => setBroadcastOpen(false)}>Close</button>
          </div>
        </form>
      </div>
    </div>
  );
}
