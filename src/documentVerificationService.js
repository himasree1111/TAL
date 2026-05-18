// src/documentVerificationService.js
// ============================================================================
// Document Verification Service
// Provides robust utilities for querying documents by both student_id and
// student_public_id to ensure complete document retrieval and verification.
// ============================================================================

import supabase from "./supabaseClient";

/**
 * Fetch documents for a student using BOTH student_id and student_public_id
 * Handles backward compatibility with old records that may only have one identifier
 * 
 * @param {number|string} studentId - The student_id (usually from student_form_submissions.id)
 * @param {string} studentPublicId - The student_public_id (assigned public identifier)
 * @param {string} category - Document category ('academic', 'personal', 'extracurricular', 'fee')
 * @returns {Promise<Array>} Deduplicated array of documents
 */
export async function fetchDocumentsByBothIds(studentId, studentPublicId, category = null) {
  const results = { byStudentId: [], byPublicId: [], merged: [] };

  try {
    console.log('[DOC_SERVICE] fetchDocumentsByBothIds START - inputs:', {
      studentId: Array.isArray(studentId) ? `[array: ${studentId.join(',')}]` : studentId,
      studentPublicId,
      category,
    });

    // Check if student 229 is in the request
    const hasStudent229 = Array.isArray(studentId) ? studentId.includes(229) : studentId === 229;
    if (hasStudent229) {
      console.log('[DOC_SERVICE] ⭐ STUDENT 229 DETECTED - Full array:', studentId);
    }

    // Query by student_id
    const studentIds = Array.isArray(studentId)
    ? studentId.filter((id) => id !== null && id !== undefined && id !== '')
    : [studentId].filter((id) => id !== null && id !== undefined && id !== '');

  if (studentIds.length > 0) {
      let query = supabase
        .from('student_documents')
        .select('*');

      if (category) {
        query = query.eq('category', category);
      }

      if (studentIds.length === 1) {
        query = query.eq('student_id', studentIds[0]);
        console.log('[DOC_SERVICE] Querying by student_id =', studentIds[0]);
      } else {
        query = query.in('student_id', studentIds);
        console.log('[DOC_SERVICE] Querying by student_id IN (', studentIds.join(','), ')');
        if (hasStudent229) {
          console.log('[DOC_SERVICE] ⭐ STUDENT 229 IS IN THE QUERY');
        }
      }

      const { data, error } = await query.order('uploaded_at', { ascending: false });

      console.log('[DOC_SERVICE] Query by student_id result:', data?.length || 0, 'docs', error ? `ERROR: ${error.message}` : 'OK');
      if (hasStudent229 && data) {
        console.log('[DOC_SERVICE] ⭐ STUDENT 229 DOCS RETURNED:', data.map(d => ({ id: d.id, category: d.category, student_id: d.student_id })));
      }

      if (error) {
        console.error('[DOC_SERVICE] Error fetching by student_id:', error);
      } else {
        results.byStudentId = data || [];
      }
    }

    // Query by student_public_id
    if (studentPublicId) {
      let query = supabase
        .from('student_documents')
        .select('*');

      if (category) {
        query = query.eq('category', category);
      }

      console.log('[DOC_SERVICE] Querying by student_public_id =', studentPublicId);

      const { data, error } = await query
        .eq('student_public_id', studentPublicId)
        .order('uploaded_at', { ascending: false });

      console.log('[DOC_SERVICE] Query by student_public_id result:', data?.length || 0, 'docs', error ? `ERROR: ${error.message}` : 'OK');

      if (error) {
        console.error('[DOC_SERVICE] Error fetching by student_public_id:', error);
      } else {
        results.byPublicId = data || [];
      }
    }

    // Merge and deduplicate
    const merged = [...results.byStudentId, ...results.byPublicId];
    results.merged = Array.from(new Map(merged.map((d) => [d.id, d])).values());

    console.log('[DOC_SERVICE] Merge results:', {
      byStudentId: results.byStudentId.length,
      byPublicId: results.byPublicId.length,
      merged_total: results.merged.length,
    });

    if (hasStudent229) {
      console.log('[DOC_SERVICE] ⭐ STUDENT 229 FINAL MERGED COUNT:', results.merged.length);
    }

    return results.merged;
  } catch (err) {
    console.error('[DOC_SERVICE] Unexpected error in fetchDocumentsByBothIds:', err);
    throw err;
  }
}

/**
 * Fetch all unchecked documents for a student across all categories
 * Used by admin dashboard to find students with pending document verification
 * 
 * @param {number|string} studentId - The student_id
 * @param {string} studentPublicId - The student_public_id
 * @returns {Promise<{academics: number, personal: number, extracurricular: number, total: number}>}
 */
export async function getDocumentCounts(studentId, studentPublicId) {
  const counts = {
    academic: 0,
    personal: 0,
    extracurricular: 0,
    fee: 0,
    total: 0,
    verified: 0,
  };

  try {
    console.log('[DOC_SERVICE] getDocumentCounts called with:', {
      studentId: Array.isArray(studentId) ? `[array of ${studentId.length}]` : studentId,
      studentPublicId,
    });

    const docs = await fetchDocumentsByBothIds(studentId, studentPublicId);

    console.log('[DOC_SERVICE] fetchDocumentsByBothIds returned:', docs.length, 'documents');

    counts.academic = docs.filter((d) => d.category === 'academic').length;
    counts.personal = docs.filter((d) => d.category === 'personal').length;
    counts.extracurricular = docs.filter((d) => d.category === 'extracurricular').length;
    counts.fee = docs.filter((d) => d.category === 'fee').length;
    counts.total = docs.length;
    counts.verified = docs.filter((d) => d.is_checked === true).length;

    console.log('[DOC_SERVICE] Document counts computed:', counts);

    return counts;
  } catch (err) {
    console.error('[DOC_SERVICE] Error getting document counts:', err);
    throw err;
  }
}

/**
 * Update document verification status for ALL documents of a student
 * Uses robust .or() logic to ensure all documents are updated regardless of linking method
 * 
 * @param {number|string} studentId - The student_id
 * @param {string} studentPublicId - The student_public_id
 * @param {boolean} isChecked - Whether documents should be marked as verified
 * @param {Array<string>} categories - Categories to update (default: all document categories)
 * @returns {Promise<{before: number, after: number, updated: boolean}>}
 */
export async function updateDocumentVerificationStatus(
  studentId,
  studentPublicId,
  isChecked = true,
  categories = ['academic', 'personal', 'extracurricular']
) {
  const result = { before: 0, after: 0, updated: false };

  try {
    // Build OR condition for robust querying
    let orCondition = '';
    if (studentId && studentPublicId) {
      orCondition = `student_id.eq.${studentId},student_public_id.eq.${studentPublicId}`;
    } else if (studentId) {
      orCondition = `student_id.eq.${studentId}`;
    } else if (studentPublicId) {
      orCondition = `student_public_id.eq.${studentPublicId}`;
    }

    if (!orCondition) {
      throw new Error('At least one student identifier must be provided');
    }

    // Get count BEFORE update
    const { data: docsBefore } = await supabase
      .from('student_documents')
      .select('id')
      .in('category', categories)
      .or(orCondition);

    result.before = (docsBefore || []).length;

    // Update documents
    const { error: updateError } = await supabase
      .from('student_documents')
      .update({ is_checked: isChecked })
      .in('category', categories)
      .or(orCondition);

    if (updateError) {
      console.error('[DOC_SERVICE] Error updating verification status:', updateError);
      throw updateError;
    }

    // Get count AFTER update
    const { data: docsAfter } = await supabase
      .from('student_documents')
      .select('id')
      .in('category', categories)
      .or(orCondition);

    result.after = (docsAfter || []).length;
    result.updated = true;

    console.log('[DOC_SERVICE] Verification status updated:', {
      studentId,
      studentPublicId,
      isChecked,
      before: result.before,
      after: result.after,
    });

    return result;
  } catch (err) {
    console.error('[DOC_SERVICE] Error in updateDocumentVerificationStatus:', err);
    throw err;
  }
}

/**
 * Get detailed document statistics for multiple students
 * Useful for admin dashboard to see overall verification progress
 * 
 * @param {Array<{student_id, student_public_id}>} students - Array of students to analyze
 * @returns {Promise<Array>} Array with document counts for each student
 */
export async function getStudentDocumentStats(students) {
  try {
    const stats = await Promise.all(
      students.map(async (student) => {
        const counts = await getDocumentCounts(student.student_id, student.student_public_id);
        return {
          ...student,
          documentStats: counts,
        };
      })
    );

    return stats;
  } catch (err) {
    console.error('[DOC_SERVICE] Error getting student document stats:', err);
    throw err;
  }
}

/**
 * Insert document with BOTH identifiers for complete linking
 * Should be used by ALL upload functions to ensure proper document creation
 * 
 * @param {Object} documentData - Document object with required fields
 * @param {number|string} documentData.student_id - Student ID (required)
 * @param {string} documentData.student_public_id - Student public ID (optional but recommended)
 * @param {string} documentData.category - Document category (required)
 * @param {string} documentData.file_name - Original file name (required)
 * @param {string} documentData.file_url - Public file URL (required)
 * @param {string} documentData.document_name - Display name (optional)
 * @returns {Promise<Object>} Inserted document object
 */
export async function insertDocumentWithBothIds(documentData) {
  const {
    student_id,
    student_public_id,
    category,
    file_name,
    file_url,
    document_name = '',
    education_year = null,
    uploaded_at = new Date().toISOString(),
  } = documentData;

  if (!student_id && !student_public_id) {
    throw new Error('At least one student identifier must be provided');
  }

  if (!category || !file_name || !file_url) {
    throw new Error('category, file_name, and file_url are required');
  }

  try {
    const { error, data } = await supabase
      .from('student_documents')
      .insert({
        student_id,
        student_public_id,
        category,
        document_name,
        file_name,
        file_url,
        education_year,
        uploaded_at,
      })
      .select()
      .single();

    if (error) {
      console.error('[DOC_SERVICE] Error inserting document:', error);
      throw error;
    }

    console.log('[DOC_SERVICE] Document inserted successfully:', {
      doc_id: data.id,
      student_id,
      student_public_id,
      category,
    });

    return data;
  } catch (err) {
    console.error('[DOC_SERVICE] Unexpected error in insertDocumentWithBothIds:', err);
    throw err;
  }
}

/**
 * Verify data consistency - check for documents with missing identifiers
 * Should be run periodically to identify orphaned or partially linked documents
 * 
 * @returns {Promise<Object>} Statistics about document linking status
 */
export async function verifyDocumentLinkingConsistency() {
  try {
    const { data: stats } = await supabase
      .rpc('document_linking_stats'); // Requires custom SQL function

    // Fallback: do it in JavaScript if RPC not available
    if (!stats) {
      const { data: allDocs } = await supabase
        .from('student_documents')
        .select('id, student_id, student_public_id');

      const analysis = {
        total: (allDocs || []).length,
        hasStudentId: (allDocs || []).filter((d) => d.student_id).length,
        hasPublicId: (allDocs || []).filter((d) => d.student_public_id).length,
        hasBoth: (allDocs || []).filter((d) => d.student_id && d.student_public_id).length,
        orphaned: (allDocs || []).filter((d) => !d.student_id && !d.student_public_id).length,
      };

      console.log('[DOC_SERVICE] Document linking consistency:', analysis);
      return analysis;
    }

    return stats;
  } catch (err) {
    console.error('[DOC_SERVICE] Error verifying document consistency:', err);
    throw err;
  }
}

export default {
  fetchDocumentsByBothIds,
  getDocumentCounts,
  updateDocumentVerificationStatus,
  getStudentDocumentStats,
  insertDocumentWithBothIds,
  verifyDocumentLinkingConsistency,
};
