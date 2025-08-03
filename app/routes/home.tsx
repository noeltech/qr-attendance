
import QRCode from "qrcode";
import CryptoJS from "crypto-js";
import { query } from "~/utils/db.server";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const user_id = 1;
  const event_id = 1;

  console.log("Generate QR for:", { user_id, event_id }); // Debug log

  if (!user_id || !event_id) {
    return Response.json({ error: "Missing user_id or event_id", qrCodeImage: null }, { status: 400 });
  }

  try {
    const token = CryptoJS.lib.WordArray.random(16).toString();
    const secretKey = process.env.QR_SECRET_KEY || "your-16-byte-key-here";
    console.log("Using QR_SECRET_KEY for encryption:", secretKey); // Debug log

    const data = JSON.stringify({ user_id, event_id, token });
    const encrypted = CryptoJS.AES.encrypt(data, secretKey).toString();
    console.log("Encrypted data:", encrypted); // Debug log

    const qrData = `http://localhost:5173/log-attendance?data=${encodeURIComponent(encrypted)}`;
    console.log("QR code data:", qrData); // Debug log

    // Store in database
    await query(
      "INSERT INTO qr_codes (user_id, event_id, token, qr_data, used) VALUES ($1, $2, $3, $4, FALSE)",
      [user_id, event_id, token, qrData]
    );
    //Generate QR Code Image from QR Data
    const qrCodeImage = await QRCode.toDataURL(qrData);
    console.log("QR code image generated (first 50 chars):", qrCodeImage.slice(0, 50)); // Debug log
    return Response.json({ qrCodeImage, error: null });
  } catch (error) {
    console.error("Error generating QR code:", error); // Debug log
    return Response.json({ error: "Failed to generate QR code", qrCodeImage: null }, { status: 500 });
  }
}

export default function GenerateQR() {
  const { qrCodeImage, error } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-2xl mb-4">Generate QR Code</h1>
      {error && <p className="mt-4 text-red-500">{error}</p>}
      {qrCodeImage ? (
        <div className="flex flex-col items-center">
          <img
            src={qrCodeImage}
            alt="QR Code"
            className="mb-4 max-w-xs"
            onError={() => console.error("Failed to load QR code image")} // Debug log
          />
          <a
            href={qrCodeImage}
            download="qr-code.png"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Download QR Code
          </a>
        </div>
      ) : (
        <p className="mt-4 text-gray-600">
          {error ? "Error generating QR code." : "Enter user_id and event_id in the URL to generate a QR code."}
        </p>
      )}
    </div>
  );
}