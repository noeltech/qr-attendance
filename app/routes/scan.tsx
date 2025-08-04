import { useEffect, useRef, useState } from "react";
import { Form, useActionData, useFetcher } from "react-router";
import jsQR from "jsqr";
import type { ActionFunctionArgs, LoaderFunctionArgs, } from "react-router";
import type { Route } from "./+types/scan";
import { validateQrData } from "~/utils/validateQrData";
import { validateQrCode } from "~/utils/validateQrCode";
import { findAttendance, findOneUser, getAllAttendance, loggedIn } from "~/utils/db.server";
import { Spinner } from "@radix-ui/themes";

import { useLoaderData } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const result = await getAllAttendance()
        const { data } = result
        if (!data) {
            return { data: null, error: "no data or is null" }
        }

        // console.log(dataWithQrImage)
        return { data, error: result.error }
    } catch (error) {
        console.log(error)
        return { data: null, error: error }
    }

}



export async function action({ request }) {
    const formData = await request.formData();
    let qrData = formData.get("data")?.toString();
    console.log("Scan action received QR data:", qrData); // Debug log
    if (!qrData) {
        return { error: "No QR code data provided" };
    }
    // Validate the Qr data 
    const qrDataresult = await validateQrData(qrData)
    if (qrDataresult.error) {
        return { error: qrDataresult.error }
    }
    // Validate the Qr COde
    const qrCodeResult = await validateQrCode(qrDataresult.data)
    console.log(qrCodeResult)

    if (qrCodeResult.error) {
        return { error: qrCodeResult.error }
    }

    const findResult = await findOneUser(qrCodeResult.userID)
    if (findResult.error) {
        return { error: `${findResult.error}` }
    }


    //CHECK ATTENDEE IF ALREADY LOGGEDIN OR NOT
    const isLogin = await findAttendance(qrCodeResult.userID, qrCodeResult.event_id, 1, 'am')
    console.log(isLogin)
    if (isLogin.result == true) {
        return { message: `Hi ${findResult.name}! You are already logged in.  Thank You!`, isLogin: true, name: findResult.name }
    }
    //LOG ATTENDANCE
    const loggedInResult = await loggedIn(qrCodeResult.userID, qrCodeResult.event_id, 1, 'am', findResult.name)
    if (loggedInResult.error) {
        return { error: loggedInResult.error }
    }


    console.log(findResult)
    return { message: 'QR Code successfully validated', name: findResult.name, isLogin: false }
}





export default function Scan() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const fetcher = useFetcher();
    const [hasWebcam, setHasWebcam] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [scannedData, setScannedData] = useState<string | null>(null);
    const { data, error: dataError } = useLoaderData<typeof loader>();
    // const [message, setMessage] = useState<string | null>(null)
    // Handle fetcher response for /log-attendance
    // useEffect(() => {
    //     console.log("useEffect triggered, fetcher state:", fetcher.state, "fetcher data:", fetcher.data); // Debug log
    //     if (fetcher.data && fetcher.state === "idle") {
    //         if (fetcher.data.error) {
    //             setError(fetcher.data.error);
    //             console.error("Fetcher error:", fetcher.data.error); // Debug log
    //         } else if (fetcher.data.qrData) {
    //             // Submit to /log-attendance
    //             console.log("Submitting to /log-attendance with data:", fetcher.data.qrData); // Debug log
    //             fetcher.submit(
    //                 { data: fetcher.data.qrData },
    //                 { method: "post", action: "/log-attendance" }
    //             );
    //         } else if (fetcher.data.message || fetcher.data.attendee) {
    //             console.log("Success from /log-attendance:", fetcher.data.message || fetcher.data.attendee); // Debug log
    //             setScannedData(null); // Clear scanned data after success
    //         } else {
    //             console.error("Unexpected fetcher data:", fetcher.data); // Debug log
    //         }
    //     }
    // }, [fetcher.data, fetcher.state]);

    // Handle webcam scanning


    useEffect(() => {
        console.log("Webcam useEffect triggered, videoRef:", !!videoRef.current, "canvasRef:", !!canvasRef.current); // Debug log
        if (fetcher.state !== 'idle') { return }
        navigator.mediaDevices
            .getUserMedia({ video: { facingMode: "environment" } })
            .then((stream) => {
                console.log("Webcam detected"); // Debug log
                setHasWebcam(true);
                const video = videoRef.current;
                const canvas = canvasRef.current;
                if (!video || !canvas) {
                    setError("Video or canvas element not available");
                    console.error("Video or canvas missing for webcam:", { video: !!video, canvas: !!canvas }); // Debug log
                    return;
                }

                video.srcObject = stream;
                video.play();

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    setError("Canvas context not available for webcam");
                    console.error("Canvas context missing for webcam"); // Debug log
                    return;
                }

                const scan = () => {
                    if (video.readyState === video.HAVE_ENOUGH_DATA) {
                        canvas.height = video.videoHeight;
                        canvas.width = video.videoWidth;
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const code = jsQR(imageData.data, imageData.width, imageData.height);
                        if (code) {
                            console.log("QR code detected from webcam:", code.data); // Debug log
                            setScannedData(code.data);
                            fetcher.submit(
                                { data: code.data },
                                { method: "post", action: "/scan" }
                            );
                        }
                    }
                    requestAnimationFrame(scan);
                };
                requestAnimationFrame(scan);
            })
            .catch((err) => {
                console.log("No webcam detected:", err); // Debug log
                setHasWebcam(false);
            });

        return () => {
            if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
            }
        };
    }, [fetcher]);

    // Handle file upload
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        setError(null); // Clear previous errors
        const file = event.target.files?.[0];
        if (!file) {
            setError("No file selected");
            console.log("No file selected"); // Debug log
            return;
        }

        console.log("File selected:", file.name); // Debug log
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = canvasRef.current;
                if (!canvas) {
                    setError("Canvas element not available");
                    console.error("Canvas element not available for file upload"); // Debug log
                    return;
                }

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    setError("Canvas context not available");
                    console.error("Canvas context not available for file upload"); // Debug log
                    return;
                }

                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0, img.width, img.height);
                const imageData = ctx.getImageData(0, 0, img.width, img.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);

                if (code) {
                    console.log("QR code detected from image:", code.data); // Debug log
                    setScannedData(code.data);
                    fetcher.submit(
                        { data: code.data },
                        { method: "post", action: "/scan" }
                    );
                } else {
                    setError("No QR code found in the uploaded image");
                    console.log("No QR code found in image"); // Debug log
                }
            };
            img.onerror = () => {
                setError("Failed to load image");
                console.log("Image load error"); // Debug log
            };
            img.src = e.target?.result as string;
        };
        reader.onerror = () => {
            setError("Failed to read file");
            console.log("FileReader error"); // Debug log
        };
        reader.readAsDataURL(file);
    };

    return (


        <div className="flex">
            <div className="basis-4/5 border-r-solid border-r-1 border-gray-200">
                <div className="flex flex-col items-center justify-start p-4 h-screen text-black">
                    <h1 className="text-2xl text-center font-semibold max-w-2xl">
                        RE-ORIENTATION TRAINING AND SEMINAR WORKSHOP FOR OPERATION AND MAINTENANCE PERSONNEL AND STAFF
                    </h1>
                    <div className="w-full">
                        <p className="pt-8 text-gray-500">Currently Attending: </p>
                    </div>
                    <div className="w-full">
                        <ul className="flex gap-1 justify-around flex-wrap mt-4 text-left">
                            {data && data.map((item) => {
                                return (
                                    <li className="text-center" key={item.name}>{item.name}</li>
                                )
                            })}
                        </ul>
                    </div>
                </div>

            </div>
            <div className="flex flex-col items-center justify-center h-screen text-center">
                {fetcher.data?.error && (
                    <p className="mt-4 text-red-500">{'Sorry, can you try again?'}</p>
                )}
                {fetcher.data?.isLogin == false ? (
                    <p className="mt-4 text-green-700 text-xl font-semibold">
                        Welcome <span className="text-2xl text-black">{fetcher.data.name}</span>! We are glad for you to be here!
                    </p>
                ) : null}
                {fetcher.data?.isLogin && (
                    <p className="mt-4 text-green-700 text-xl font-semibold">Hi{` `}
                        <span className="text-2xl text-black">{fetcher.data.name}</span>!  You are already logged in.Thank You!
                    </p>
                )}
                <h1 className="text-lg mb-4 mt-8 text-gray-500 font-medium">
                    Please scan QR code for your attendance
                </h1>
                {hasWebcam === null && <p>Checking for webcam...</p>}
                {fetcher.state !== 'idle' && <Spinner size='3' />}
                <video ref={videoRef} className="mb-4 w-full max-w-xs" />
                <canvas ref={canvasRef} className="hidden" />

                {/* {hasWebcam === false && (
                <div className="mb-4">
                    <p>No webcam detected. Please upload a QR code image.</p>
                    <fetcher.Form method="post" name="scannedFile" action="/scan">
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="mt-2 p-2 border rounded"
                            name="scannedQr"
                        />
                    </fetcher.Form>
                </div>
            )} */}
                {/* <Form id="qrForm" method="post" action="/scan">
          <input type="hidden" name="data" />
        </Form> */}
                {/* {scannedData && (
          <p className="mt-4 text-gray-600">Scanned QR Code Data: {scannedData}</p>
        )} */}
                {/* {error && <p className="mt-4 text-red-500">{error}</p>} */}

            </div>
        </div>



    );
}

// "@chakra-ui/react": "^3.24.0",
// "@emotion/react": "^11.14.0",