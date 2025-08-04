import CryptoJS from "crypto-js";

export function generateQrData(user_id: string, event_id: string, name: string) {
    // console.log("Generate QR for:", { user_id, event_id }); // Debug log

    if (!user_id || !event_id) {
        return { error: "Missing user_id or event_id", qrCodeImage: null };
    }

    try {
        const token = CryptoJS.lib.WordArray.random(16).toString();
        const secretKey = "mysecretkey12345";
        // console.log("Using QR_SECRET_KEY for encryption:", secretKey); // Debug log

        const data = JSON.stringify({ user_id, event_id, token });
        const encrypted = CryptoJS.AES.encrypt(data, secretKey).toString();
        // console.log("Encrypted data:", encrypted); // Debug log

        const qrData = `http://localhost:5173/log-attendance?data=${encodeURIComponent(encrypted)}`;
        // console.log("QR code data:", qrData); // Debug log
        return { user_id, event_id, token, qrData, name }
    } catch (error) {
        return { error: error }
    }
}