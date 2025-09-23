
import QRCode from "qrcode";

import { getAllQrCodes } from "~/utils/db.server";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        //ASSIGN an EVENT ID manually
        let eventID = '421f4074-0784-465b-a01c-ea7d0ae26e0c'
        const result = await getAllQrCodes(eventID)
        const { data } = result
        if (!data) {
            return { data: null, error: "no data or is null" }
        }
        const dataWithQrImage = await Promise.all(
            data.map(async (item) => {
                try {
                    const url = await QRCode.toDataURL(item.qr_data);
                    return { ...item, qrCodeImage: url };
                } catch (error) {
                    console.error('Error generating QR code:', error);
                    return ''; // Return empty string or placeholder for failed QR codes
                }
            })
        );
        // console.log(dataWithQrImage)
        return { data: dataWithQrImage, error: result.error }
    } catch (error) {
        console.log(error)
        return { data: null, error: error }
    }
    //Generate QR Code Image from QR Data
    // const qrCodeImage = await QRCode.toDataURL(qrData);
}

export default function ViewQrCodes() {
    const { data, error } = useLoaderData<typeof loader>();
    console.log(data)
    return (
        <div className="flex flex-col items-center p-4">
            <h1 className="text-2xl mb-4">{data && data[0].event_id}</h1>
            {
                error ? <p className="mt-4 text-red-500">{error.toString()}</p> : null
            }
            {data &&
                <ul className="w-full flex flex-wrap justify-around">{
                    data.map((item) => {
                        return (
                            <li key={item.user_id} className="flex flex-col items-center mb-8">
                                <p className="text-xs">{item.name}</p>
                                <div className=" h-64">

                                    <img
                                        src={item.qrCodeImage}
                                        alt="QR Code"
                                        className="mb-4 max-w-xs h-full"
                                        onError={() => console.error("Failed to load QR code image")} // Debug log
                                    />
                                    {/* <a
                        href={qrCodeImage}
                        download="qr-code.png"
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                        Download QR Code
                    </a> */}
                                </div>
                            </li>
                        )
                    })
                } </ul>
            }
        </div>
    );
}