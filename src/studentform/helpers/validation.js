export const validateField = (name, value, userRole) => {
  if (name === "first_name" || name === "last_name" || name === "middle_name") {
    if (!value) return `${name.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())} is required`;
    if (!/^[a-zA-Z\s]+$/.test(value)) return "Only alphabets and spaces are allowed";
    return "";
  }

  if (name === "contact" || name === "whatsapp" || name === "volunteer_contact") {
    if (!value || !/^\d{10}$/.test(value)) return "Must be exactly 10 digits";
    return "";
  }

  if (name === "student_contact") {
    if (!value) return "";
    if (!/^\d{10}$/.test(value)) return "Must be exactly 10 digits (if entered)";
    return "";
  }

  if (name === "account_no") {
    if (!value) return "";
    if (!/^\d{10,18}$/.test(value)) return "Account number must be 10 to 18 digits";
    return "";
  }

  if (name === "ifsc_code") {
    if (!value) return "";
    if (!/^[A-Z]{4}0[0-9]{6}$/.test(value)) return "Enter a valid IFSC code";
    return "";
  }

  if (name === "email") {
    if (!value) return "Email is required";
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) return "Enter a valid email address";
    return "";
  }

  if (name === "age") {
    if (value !== "" && (Number.isNaN(Number(value)) || Number(value) < 6)) return "Age must be at least 6";
    return "";
  }

  if (name === "prev_percent" || name === "present_percent") {
    if (!value) return `${name === "prev_percent" ? "Previous Year" : "Present Year"} Percentage is required`;
    if (!/^\d+(\.\d+)?$/.test(value)) return "Only numbers and decimal points are allowed";
    const numValue = parseFloat(value);
    if (numValue < 0 || numValue > 100) return "Percentage must be between 0 and 100";
    return "";
  }

  if (name === "fee_structure") {
    if (!value) return "Tuition Fee is required";
    if (!/^[\d\s.,₹$£€¥\-\s]+$/.test(value)) return "Only numbers, currency symbols, and punctuation are allowed";
    return "";
  }

  if (name === "volunteer_name") {
    if (!value && userRole !== "student") return "Volunteer name is required";
    if (value && !/^[a-zA-Z\s]+$/.test(value)) return "Only alphabets and spaces are allowed";
    return "";
  }

  return "";
};

export const runFullValidation = (formData, userRole) => {
  const newErrors = {};

  const mandatoryFields = [
    { key: "age", label: "Age" },
    { key: "address", label: "Address" },
    { key: "whatsapp", label: "Whatsapp Number" },
    { key: "school", label: "Name of School/College" },
    { key: "class", label: "Class" },
    { key: "prev_percent", label: "Previous Year Percentage" },
    { key: "present_percent", label: "Present Year Percentage" },
    { key: "fee_structure", label: "Fee Structure" },
    { key: "num_earning_members", label: "Number of Earning Members" },
    { key: "first_name", label: "First Name" },
    { key: "last_name", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "contact", label: "Parent Number" },
    ...(userRole !== "student"
      ? [
          { key: "volunteer_name", label: "Volunteer Name" },
          { key: "volunteer_contact", label: "Volunteer Contact Number" },
        ]
      : []),
    { key: "camp_date", label: "Date of Camp" },
  ];

  const missing = mandatoryFields.filter((f) => {
    const v = (formData[f.key] || "").toString().trim();
    return v === "";
  });

  if (missing.length > 0) {
    newErrors._missing = "Please fill in all mandatory fields: " + missing.map((m) => m.label).join(", ");
  }

  if (formData.num_family_members) {
    const num = parseInt(formData.num_family_members);
    if (num > 0) {
      for (let i = 0; i < num; i++) {
        if (!formData.family_members_details[i] || !formData.family_members_details[i].name.trim() || !formData.family_members_details[i].relation.trim()) {
          newErrors.family_members = `Please provide name and relation for family member ${i + 1}`;
          break;
        }
      }
    }
  }

  if (formData.num_earning_members) {
    const num = parseInt(formData.num_earning_members);
    if (num > 0) {
      for (let i = 0; i < num; i++) {
        if (!formData.earning_members_details[i] || !formData.earning_members_details[i].name.trim() || !formData.earning_members_details[i].occupation.trim()) {
          newErrors.earning_members = `Please provide name and occupation for earning member ${i + 1}`;
          break;
        }
      }
    }
  }

  const ageVal = formData.age !== "" && formData.age !== null ? Number(formData.age) : null;
  if (ageVal === null || Number.isNaN(ageVal) || ageVal < 6) newErrors.age = "Age must be at least 6 years";

  const contactErr = validateField("contact", formData.contact, userRole);
  if (contactErr) newErrors.contact = contactErr;

  const whatsappErr = validateField("whatsapp", formData.whatsapp, userRole);
  if (whatsappErr) newErrors.whatsapp = whatsappErr;

  const studentErr = validateField("student_contact", formData.student_contact, userRole);
  if (studentErr) newErrors.student_contact = studentErr;

  const emailErr = validateField("email", formData.email, userRole);
  if (emailErr) newErrors.email = emailErr;

  if (!formData.is_single_parent) newErrors.is_single_parent = "Please select Yes or No for single parent question.";
  if (!formData.does_work) newErrors.does_work = "Please select Yes or No for work question.";

  if (formData.educationcategory === "Other" && !formData.educationcategory_custom.trim()) {
    newErrors.educationcategory_custom = "Please specify your education level.";
  }
  if (formData.educationsubcategory === "Other" && !formData.educationsubcategory_custom.trim()) {
    newErrors.educationsubcategory_custom = "Please specify your stream/branch/course.";
  }
  if (formData.educationyear === "Other" && !formData.educationyear_custom.trim()) {
    newErrors.educationyear_custom = "Please specify your academic year.";
  }

  return newErrors;
};
