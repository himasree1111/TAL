/* TEST DELETE - Run in browser Console at localhost:3000/studentdashboard */

(async () => {
  // Get supabase from window or import
  const { data: docs } = await supabase.from('student_documents').select('id, student_id, document_name');
  console.table(docs);
  
  if (docs?.length) {
    const testDoc = docs[0];
    console.log('Testing delete:', testDoc.id);
    
    // Storage path guess
    const path = testDoc.file_url?.split('/student_documents/')[1];
    if (path) {
      console.log('Storage delete:', path);
      const { error } = await supabase.storage.from('student_documents').remove([path]);
      console.log('Storage error?', error);
    }
    
    // DB delete
    const { error: dbError } = await supabase.from('student_documents').delete().eq('id', testDoc.id);
    console.log('🚫 DB ERROR FULL:', dbError);
    
    // Check if gone
    const { data: remaining } = await supabase.from('student_documents').select('*').eq('id', testDoc.id);
    console.log('Still exists?', remaining);
  }
})();

