
import QRCode from "qrcode";
import CryptoJS from "crypto-js";
import { query } from "~/utils/db.server";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  // const url = new URL(request.url);
  // const user_id = 1;
  // const event_id = 1;

  // console.log("Generate QR for:", { user_id, event_id }); // Debug log

  // if (!user_id || !event_id) {
  //   return Response.json({ error: "Missing user_id or event_id", qrCodeImage: null }, { status: 400 });
  // }

  // try {
  //   const token = CryptoJS.lib.WordArray.random(16).toString();
  //   const secretKey = process.env.QR_SECRET_KEY || "your-16-byte-key-here";
  //   console.log("Using QR_SECRET_KEY for encryption:", secretKey); // Debug log

  //   const data = JSON.stringify({ user_id, event_id, token });
  //   const encrypted = CryptoJS.AES.encrypt(data, secretKey).toString();
  //   console.log("Encrypted data:", encrypted); // Debug log

  //   const qrData = `http://localhost:5173/log-attendance?data=${encodeURIComponent(encrypted)}`;
  //   console.log("QR code data:", qrData); // Debug log

  //   // Store in database
  //   await query(
  //     "INSERT INTO qr_codes (user_id, event_id, token, qr_data, used) VALUES ($1, $2, $3, $4, FALSE)",
  //     [user_id, event_id, token, qrData]
  //   );
  //   //Generate QR Code Image from QR Data
  //   const qrCodeImage = await QRCode.toDataURL(qrData);
  //   console.log("QR code image generated (first 50 chars):", qrCodeImage.slice(0, 50)); // Debug log
  //   return Response.json({ qrCodeImage, error: null });
  // } catch (error) {
  //   console.error("Error generating QR code:", error); // Debug log
  //   return Response.json({ error: "Failed to generate QR code", qrCodeImage: null }, { status: 500 });
  // }
}

export default function GenerateQR() {
  // const { qrCodeImage, error } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-2xl mb-4">WELCOME TO QR ATTENDANCE SYSTEM</h1>

    </div>
  );
}