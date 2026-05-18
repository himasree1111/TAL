// Debug script to diagnose document verification issue for student_form_id: 229
import supabase from "./src/supabaseClient.js";

async function diagnoseDocuments() {
  console.log('\n========== DIAGNOSTIC REPORT FOR STUDENT_FORM_ID: 229 ==========\n');

  // Step 1: Find the student form submission
  console.log('STEP 1: Fetching student_form_submissions with id = 229...');
  const { data: formData, error: formError } = await supabase
    .from('student_form_submissions')
    .select('*')
    .eq('id', 229)
    .single();

  if (formError) {
    console.error('ERROR fetching form:', formError);
    return;
  }

  console.log('Form found:', {
    id: formData.id,
    email: formData.email,
    student_public_id: formData.student_public_id,
  });

  // Step 2: Find eligible student record
  console.log('\nSTEP 2: Fetching eligible_students with matching email...');
  const { data: eligibleData, error: eligibleError } = await supabase
    .from('eligible_students')
    .select('*')
    .eq('email', formData.email);

  if (eligibleError) {
    console.error('ERROR fetching eligible students:', eligibleError);
  } else {
    console.log(`Found ${eligibleData?.length || 0} eligible_students records`);
    if (eligibleData?.length > 0) {
      eligibleData.forEach((s, i) => {
        console.log(`  Record ${i}:`, {
          id: s.id,
          student_id: s.student_id,
          student_form_id: s.student_form_id,
          student_public_id: s.student_public_id,
          email: s.email,
        });
      });
    }
  }

  // Step 3: Check what's in student_documents
  console.log('\nSTEP 3: Fetching ALL student_documents by FORM ID (229)...');
  const { data: docsByFormId, error: docsByFormIdError } = await supabase
    .from('student_documents')
    .select('id, student_id, student_public_id, category, uploaded_at')
    .eq('student_id', 229);

  console.log(`Found ${docsByFormId?.length || 0} documents by student_id = 229`);
  if (docsByFormId?.length > 0) {
    docsByFormId.forEach((doc, i) => {
      console.log(`  Doc ${i}: ID=${doc.id}, category=${doc.category}, student_public_id=${doc.student_public_id}`);
    });
  }

  // Step 4: Check by student_public_id
  if (formData.student_public_id) {
    console.log(`\nSTEP 4: Fetching student_documents by public_id (${formData.student_public_id})...`);
    const { data: docsByPublicId, error: docsByPublicIdError } = await supabase
      .from('student_documents')
      .select('id, student_id, student_public_id, category, uploaded_at')
      .eq('student_public_id', formData.student_public_id);

    console.log(`Found ${docsByPublicId?.length || 0} documents by student_public_id`);
    if (docsByPublicId?.length > 0) {
      docsByPublicId.forEach((doc, i) => {
        console.log(`  Doc ${i}: ID=${doc.id}, student_id=${doc.student_id}, category=${doc.category}`);
      });
    }
  }

  // Step 5: Check all documents for this student across all possible identifiers
  console.log('\nSTEP 5: Searching student_documents by ALL possible identifiers...');
  const candidateIds = [
    formData.id,
    formData.student_public_id,
  ].filter(Boolean);

  for (const id of candidateIds) {
    const { data: docs } = await supabase
      .from('student_documents')
      .select('id, student_id, student_public_id, category, is_checked, uploaded_at')
      .or(`student_id.eq.${id},student_public_id.eq.${id}`);

    if (docs?.length > 0) {
      console.log(`Found ${docs.length} documents with id=${id}`);
      docs.forEach((doc) => {
        console.log(`  - ID=${doc.id}, student_id=${doc.student_id}, student_public_id=${doc.student_public_id}, category=${doc.category}, is_checked=${doc.is_checked}`);
      });
    }
  }

  // Step 6: Check admin_student_info
  console.log('\nSTEP 6: Checking admin_student_info for student_form_id/student_id = 229...');
  const { data: adminData } = await supabase
    .from('admin_student_info')
    .select('id, student_id, email')
    .or(`id.eq.229,student_id.eq.229`);

  if (adminData?.length > 0) {
    console.log(`Found ${adminData.length} admin_student_info records`);
    adminData.forEach((s) => {
      console.log(`  - id=${s.id}, student_id=${s.student_id}, email=${s.email}`);
    });
  } else {
    console.log('No admin_student_info records found');
  }

  console.log('\n========== END DIAGNOSTIC REPORT ==========\n');
}

diagnoseDocuments().catch(console.error).then(() => process.exit(0));
