import { query } from "./db.server";
import CryptoJS from "crypto-js";


export async function validateQrCode(qrData: string) {
    try {
        const secretKey = "mysecretkey12345";
        console.log("Using QR_SECRET_KEY:", secretKey); // Debug log
        const bytes = CryptoJS.AES.decrypt(qrData, secretKey);
        let decrypted;
        try {
            decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        } catch (error) {
            console.error("Decryption failed:", error); // Debug log
            return { error: "Invalid QR code data: decryption failed" };
        }
        console.log("Decrypted data:", decrypted); // Debug log
        const { user_id, event_id, token } = decrypted;

        if (!user_id || !event_id || !token) {
            console.error("Missing required fields in decrypted data:", { user_id, event_id, token }); // Debug log
            return { error: "Invalid QR code data: missing fields", status: 403 };
        }

        // Validate token and check if used
        const result = await query(
            "SELECT used FROM qr_codes WHERE user_id = $1 AND event_id = $2 AND token = $3",
            [user_id, event_id, token]
        );
        console.log("Database query result:", result.rows); // Debug log

        if (result.rows.length === 0) {
            console.error("No matching QR code found in database"); // Debug log
            return { error: "Invalid QR code: not found", status: 403 };
        }
        // if (result.rows[0].used) {
        //     console.error("QR code already used"); // Debug log
        //     return { error: "Invalid QR code: already used", status: 403 };
        // }

        // // Mark QR code as used
        // await query(
        //     "UPDATE qr_codes SET used = TRUE WHERE user_id = $1 AND event_id = $2 AND token = $3",
        //     [user_id, event_id, token]
        // );
        // console.log("QR code marked as used"); // Debug log

        // Log attendance
        // await query(
        //     "INSERT INTO attendance (user_id, event_id, timestamp) VALUES ($1, $2, CURRENT_TIMESTAMP)",
        //     [user_id, event_id]
        // );
        console.log("Attendance recorded"); // Debug log

        return { message: "Attendance recorded successfully", userID: user_id };
    } catch (error) {
        console.error("Error in log-attendance:", error); // Debug log
        return { error: `Invalid QR code data: ${(error as Error).message}`, status: 403 };
    }
}