
import { getAllUsers, saveToQrCodes } from "~/utils/db.server";
import type { ActionFunctionArgs, ClientActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, useLoaderData, useSubmit } from "react-router";
import { useEffect } from "react";
import { Button } from "@radix-ui/themes";
import { generateQrData } from "~/utils/generateQrData";


export async function loader({ request }: LoaderFunctionArgs) {
    const result = await getAllUsers()
    if (result.error) {
        return { data: null, error: result.error }
    }
    return { data: result.data, error: null }
}

export async function action({ request }: ActionFunctionArgs) {
    const body = await request.formData();
    const listOfAttendeeswithQrCodes = body.get('data') as string
    if (!listOfAttendeeswithQrCodes && typeof listOfAttendeeswithQrCodes !== 'string') {
        return Response.json({ error: 'Data must not be empty or is not a string' }, { status: 400 })
    }
    await saveToQrCodes(JSON.parse(listOfAttendeeswithQrCodes))
    return null
}

export default function Attendees() {
    const { data, error } = useLoaderData<typeof loader>();
    const submit = useSubmit()
    const handleGenerateQrData = (data) => {
        console.log('im click')
        if (!data) {
            console.log('Invalid or No Data')
            return { error: 'Invalid or No Data' }
        }
        try {
            const resultWithQrData = data.map((item) => {
                const result = generateQrData(item.user_id, '6d5ca3a9-63e3-4a71-8787-3e42e3b4e606', item.name);
                return result
            })
            console.log(resultWithQrData)
            // Save the result to the database 
            submit({
                data: JSON.stringify(resultWithQrData)

            }, { action: '/attendees', method: 'post' })
        } catch (error) {
            console.log(`error generating qr code : ${error}`)
            return { error }
        }
    }

    return (
        <div className=" items-center p-4">
            <h1 className="text-2xl">Attendees</h1>
            {error && <>
                <p>Looks like theres some kind of problem, but dont worry, we will fix this ASAP! we got you!</p>
            </>}
            {data && <>
                <ul>
                    {data.map((item) => (
                        <li className="" key={item.user_id}><p className="flex gap-12       "> <span>{item.name}</span> {'     '}  <span>{item.designation}</span></p></li>
                    ))}
                </ul>
            </>}


            {data && <div className="m-2 p-8 "><Button className="m-12 hover:cursor-pointer" onClick={() => handleGenerateQrData(data)}>Generate QR Codes</Button></div>}

        </div >
    );
}

<span></span>
