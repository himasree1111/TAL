// StudentDocsUpload.js
//import React, { useState } from "react";
// import { FaCheckCircle, FaPlus } from "react-icons/fa";
import React, { useState, useEffect } from "react";
import "./StudentDocs.css";
import supabase from "../supabaseClient";
import { FaCheckCircle, FaPlus } from "react-icons/fa";



export default function StudentDocsUpload() {

  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const [bankAccount, setBankAccount] = useState("");
  const handleDelete = async (doc) => {
  try {
    // 🗑️ 1. Delete files from storage
    const fileFields = [
      "school_id",
      "aadhaar",
      "income_proof",
      "marksheet",
      "passport_photo",
      "fees_receipt",
      "volunteer_signature",
      "student_signature",
    ];

    for (const field of fileFields) {
      if (doc[field]) {
        const path = doc[field].split("/student-docs/")[1]; // extract file path

        if (path) {
          await supabase.storage
            .from("student-docs")
            .remove([path]);
        }
      }
    }

    // 🧹 2. Delete row from DB
    const { error } = await supabase
      .from("student_documents")
      .delete()
      .eq("id", doc.id);

    if (error) throw error;

    // 🔄 3. Refresh UI
    await fetchDocuments();

    alert("🗑️ Deleted successfully!");
  } catch (err) {
    console.error(err);
    alert("❌ Delete failed: " + err.message);
  }
};

const fetchDocuments = async () => {
  const { data, error } = await supabase
    .from("student_documents")
    .select("*")
    .order("created_at", { ascending: false });

  console.log("FETCHED:", data, error);

  if (data) setDocuments(data);
};
  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFiles({ ...files, [field]: file });
    }
  };
 
   documents.map((doc) => (
  <div key={doc.id} style={{ marginBottom: "15px" }}>
    <p>Bank: {doc.bank_account}</p>

    <a href={doc.school_id} target="_blank" rel="noreferrer">School ID</a><br/>
    <a href={doc.aadhaar} target="_blank" rel="noreferrer">Aadhaar</a><br/>
    <a href={doc.marksheet} target="_blank" rel="noreferrer">Marksheet</a><br/>

    {/* ✅ ADD THIS */}
    <button
      onClick={() => handleDelete(doc)}
      style={{
        marginTop: "8px",
        background: "red",
        color: "white",
        padding: "5px 10px",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
      }}
    >
      Delete
    </button>
  </div>
)))
 

  const uploadFile = async (file, folder) => {
  const filePath = `${folder}/${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("student-docs")
    .upload(filePath, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from("student-docs")
    .getPublicUrl(filePath);

  return data.publicUrl;
};
  const allUploaded =
    Object.values(files).every((f) => f !== null) && bankAccount.trim() !== "";

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!allUploaded) {
    alert("⚠️ Please upload all required documents.");
    return;
  }

  try {
    const uploadedUrls = {};

    // upload all files
    for (const key in files) {
      uploadedUrls[key] = await uploadFile(files[key], key);
    }
await fetchDocuments();
    // save in database
    const { error } = await supabase.from("student_documents").insert([
      {
        ...uploadedUrls,
        bank_account: bankAccount,
      },
    ]);

    if (error) throw error;

    alert("✅ Student details submitted successfully!");
  } catch (err) {
    console.error(err);
    alert("❌ Upload failed: " + err.message);
  }
};
const [files, setFiles] = useState({
  school_id: null,
  aadhaar: null,
  income_proof: null,
  marksheet: null,
  passport_photo: null,
  fees_receipt: null,
  volunteer_signature: null,
  student_signature: null,
});
  const renderUploadField = (label, field) => (
    <div className="upload-field">
      <span className="label">{label}</span>
      <div className="upload-controls">
        <label className="upload-btn">
          <FaPlus />
          <input
            type="file"
            style={{ display: "none" }}
            onChange={(e) => handleFileChange(e, field)}
          />
        </label>
        {files[field] && (
          <span className="file-info">
            <FaCheckCircle className="tick" /> {files[field].name}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <h2>📑 Upload Student Documents</h2>

      {renderUploadField("School / College ID", "school_id")}
      {renderUploadField("Aadhaar Card", "aadhaar")}
      {renderUploadField("Income Proof", "income_proof")}
      {renderUploadField("Marks Sheet (Last & Present Year)", "marksheet")}
      {renderUploadField("Passport Size Photo", "passport_photo")}

      <div className="upload-field">
        <span className="label">Bank Account Details</span>
        <input
          type="text"
          placeholder="Enter bank account details"
          value={bankAccount}
          onChange={(e) => setBankAccount(e.target.value)}
        />
      </div>

      {renderUploadField("Fees Receipt (Upload / Text)", "fees_receipt")}
      {renderUploadField("Volunteer Signature", "volunteer_signature")}
      {renderUploadField("Student Signature", "student_signature")}

      <button type="submit" className="submit-btn" disabled={!allUploaded}>
        Submit Student Details
      </button>
      
    </form>
    
    
  );
}