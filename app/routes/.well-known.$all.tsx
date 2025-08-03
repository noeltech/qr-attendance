// routes/.well-known.$all.jsx
export async function loader() {
    return new Response(null, { status: 404 });
}

export default function WellKnown() {
    return null; // No UI needed, as this is for API requests
}