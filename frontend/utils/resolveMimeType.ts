// frontend/utils/resolveMimeType.ts

function resolveMimeType(file: any) {
  if (file.mimeType) return file.mimeType;

  const ext = file.fileName?.split('.').pop()?.toLowerCase();

  if (!ext) return 'application/octet-stream';

  const types: Record<string, string> = {
    // images
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    heic: 'image/heic',

    // video
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',

    // audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',

    // docs
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    csv: 'text/csv',
    zip: 'application/zip',
  };

  return types[ext] || 'application/octet-stream';
}


export default resolveMimeType;
