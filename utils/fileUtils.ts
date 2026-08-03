export const MAX_FILE_SIZE_BYTES = 500 * 1024; // 500 KB
export const MAX_FILE_SIZE_MSG = 'Ukuran file melebihi batas maksimum 500 KB.';

/**
 * Validates whether a file size is within the max 500 KB limit.
 * @param file The File object
 * @param maxSizeKB Max size in KB (default 500)
 * @returns boolean
 */
export const validateFileSize = (file: File, maxSizeKB = 500): boolean => {
  return file.size <= maxSizeKB * 1024;
};
