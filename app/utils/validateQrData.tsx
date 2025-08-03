
export async function validateQrData(qrData: any) {
    try {
        const url = new URL(qrData);
        qrData = url.searchParams.get("data") || undefined;
        if (!qrData) {
            return { error: "No encrypted data found in QR code URL" };
        }
        console.log("Extracted encrypted data:", qrData); // Debug log
    } catch (error) {
        console.error("Error parsing QR code URL:", error); // Debug log
        return { error: "Invalid QR code URL format" };
    }

    try {
        return { data: qrData };
    } catch (error) {
        console.error("Error in scan action:", error); // Debug log
        return { error: `Failed to process QR code: ${(error as Error).message}` }


    }
}

