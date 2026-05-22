export async function putBlob(bucket: R2Bucket, pasteId: string, ct: string): Promise<void> {
  await bucket.put(pasteId, ct);
}

export async function getBlob(bucket: R2Bucket, pasteId: string): Promise<string | null> {
  const obj = await bucket.get(pasteId);
  if (!obj) return null;
  return await obj.text();
}

export async function deleteBlob(bucket: R2Bucket, pasteId: string): Promise<void> {
  await bucket.delete(pasteId);
}

const R2_THRESHOLD = 100_000;

export function shouldUseR2(ct: string): boolean {
  return ct.length > R2_THRESHOLD;
}
