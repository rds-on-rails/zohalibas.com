import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Uploads an image file to Firebase Storage.
 * @param file The file to upload.
 * @param userId The ID of the user uploading the file.
 * @returns Object containing the download URL and the storage path.
 */
export async function uploadImage(file: File, userId: string) {
    const date = new Date().toISOString().split('T')[0];
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}_${userId.slice(0, 5)}.${extension}`;
    const storagePath = `receipts/${userId}/${date}/${filename}`;

    const storageRef = ref(storage, storagePath);
    const snapshot = await uploadBytes(storageRef, file, { contentType: file.type });
    const downloadUrl = await getDownloadURL(snapshot.ref);

    return {
        downloadUrl,
        storagePath
    };
}
