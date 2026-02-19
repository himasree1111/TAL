import { validateField } from "./validation";

const MAX_FAMILY_MEMBERS = 15;
const MAX_EARNING_MEMBERS = 10;
const PHONE_NUMBER_LENGTH = 10;
const IFSC_CODE_LENGTH = 11;
const MAX_ACCOUNT_NUMBER_LENGTH = 18;

export function createInputChangeHandler(formData, setFormData, setErrors, userRole) {
  return (e) => {
    const { name } = e.target;
    let { value } = e.target;

    if (["contact", "whatsapp", "student_contact", "volunteer_contact"].includes(name)) {
      value = value.replace(/\D/g, "");
      if (value.length > PHONE_NUMBER_LENGTH) value = value.slice(0, PHONE_NUMBER_LENGTH);
    }

    if (name === "account_no") {
      value = value.replace(/\D/g, "");
      if (value.length > MAX_ACCOUNT_NUMBER_LENGTH) value = value.slice(0, MAX_ACCOUNT_NUMBER_LENGTH);
    }

    if (name === "ifsc_code") {
      value = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (value.length > IFSC_CODE_LENGTH) value = value.slice(0, IFSC_CODE_LENGTH);
    }

    if (name === "prev_percent" || name === "present_percent") {
      value = value.replace(/[^\d.]/g, "");
      const parts = value.split(".");
      if (parts.length > 2) value = parts[0] + "." + parts.slice(1).join("");
    }

    if (name === "fee_structure") {
      value = value.replace(/[^\d.,₹$£€¥\-\s]/g, "");
    }

    if (name === "num_family_members") {
      value = value.replace(/\D/g, "");
      if (value > MAX_FAMILY_MEMBERS) value = String(MAX_FAMILY_MEMBERS);
      const num = parseInt(value) || 0;
      const newDetails = [...formData.family_members_details];
      while (newDetails.length < num) newDetails.push({ name: "", relation: "" });
      while (newDetails.length > num) newDetails.pop();
      setFormData((prev) => ({ ...prev, num_family_members: value, family_members_details: newDetails }));
      return;
    }

    if (name.startsWith("family_member_name_") || name.startsWith("family_member_relation_")) {
      const index = parseInt(name.split("_")[3]);
      const field = name.includes("_name_") ? "name" : "relation";
      const updatedDetails = [...formData.family_members_details];
      if (updatedDetails[index]) updatedDetails[index][field] = value;
      setFormData((prev) => ({ ...prev, family_members_details: updatedDetails }));
      return;
    }

    if (name === "num_earning_members") {
      value = value.replace(/\D/g, "");
      if (value > MAX_EARNING_MEMBERS) value = String(MAX_EARNING_MEMBERS);
      const num = parseInt(value) || 0;
      const newDetails = [...formData.earning_members_details];
      while (newDetails.length < num) newDetails.push({ name: "", occupation: "" });
      while (newDetails.length > num) newDetails.pop();
      setFormData((prev) => ({ ...prev, num_earning_members: value, earning_members_details: newDetails }));
      return;
    }

    if (name.startsWith("earning_member_name_") || name.startsWith("earning_member_occ_")) {
      const index = parseInt(name.split("_")[3]);
      const field = name.includes("_name_") ? "name" : "occupation";
      const updatedDetails = [...formData.earning_members_details];
      if (updatedDetails[index]) updatedDetails[index][field] = value;
      setFormData((prev) => ({ ...prev, earning_members_details: updatedDetails }));
      return;
    }

    if (name === "dob") {
      let computedAge = "";
      if (value) {
        const dobDate = new Date(value);
        const today = new Date();
        let ageYears = today.getFullYear() - dobDate.getFullYear();
        const m = today.getMonth() - dobDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) ageYears--;
        computedAge = ageYears >= 0 ? String(ageYears) : "";
      }
      setFormData((prev) => ({ ...prev, dob: value, age: computedAge }));
      setErrors((prev) => ({ ...prev, age: validateField("age", computedAge, userRole) }));
      return;
    }

    if (name === "educationcategory") {
      if (value === "Other") {
        setFormData((prev) => ({ ...prev, educationcategory: value, educationsubcategory: "", educationyear: "", educationsubcategory_custom: "", educationyear_custom: "", class: "" }));
      } else {
        setFormData((prev) => ({ ...prev, educationcategory: value, educationsubcategory: "", educationyear: "", educationcategory_custom: "", educationsubcategory_custom: "", educationyear_custom: "", class: "" }));
      }
      return;
    }

    if (name === "educationsubcategory") {
      setFormData((prev) => ({ ...prev, educationsubcategory: value, educationyear: "", educationsubcategory_custom: value === "Other" ? prev.educationsubcategory_custom : "", educationyear_custom: "" }));
      return;
    }

    if (name === "educationyear") {
      const subcategoryValue = formData.educationsubcategory === "Other" ? formData.educationsubcategory_custom : formData.educationsubcategory;
      const categoryValue = formData.educationcategory === "Other" ? formData.educationcategory_custom : formData.educationcategory;
      const yearValue = value === "Other" ? formData.educationyear_custom : value;
      const subcategoryPart = subcategoryValue ? ` - ${subcategoryValue}` : "";
      const combinedClass = yearValue ? `${categoryValue}${subcategoryPart} - ${yearValue}` : "";
      setFormData((prev) => ({ ...prev, educationyear: value, educationyear_custom: value === "Other" ? prev.educationyear_custom : "", class: combinedClass }));
      return;
    }

    if (name === "educationcategory_custom" || name === "educationsubcategory_custom" || name === "educationyear_custom") {
      const categoryValue = formData.educationcategory_custom;
      const subcategoryValue = formData.educationsubcategory_custom;
      const yearValue = formData.educationyear_custom;
      const subcategoryPart = subcategoryValue ? ` - ${subcategoryValue}` : "";
      const combinedClass = yearValue ? `${categoryValue}${subcategoryPart} - ${yearValue}` : "";
      setFormData((prev) => ({ ...prev, [name]: value, class: combinedClass }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    const fieldError = validateField(name, value, userRole);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };
}
