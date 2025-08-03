// app/db.server.ts
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Optional: Add SSL for production if required by your database provider
    // ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export async function query(text: string, params: any[] = []) {
    const client = await pool.connect();
    try {
        const result = await client.query(text, params);

        return result;

    } catch (error) {
        console.error("Database query error:", error);
        throw error;
    } finally {
        client.release();
    }
}



export async function checkDbConnection() {
    try {
        const result = await pool.query("SELECT 1");
        return { connected: true, message: "Database connection successful" };
    } catch (error: any) {
        console.error("Database connection error:", error);
        return { connected: false, message: `Database connection failed: ${error.message}` };
    }
}


export async function findOneUser(id: number) {
    const client = await pool.connect();
    const query = `SELECT name FROM attendees WHERE user_id = ${id}`
    try {

        const result = await client.query(query);
        if (result.rows[0] <= 0) {
            return { error: 'No user found' }
        }
        return result.rows[0];

    } catch (error) {
        console.error("Database query error:", error);
        return { error: "Database query error:" }
    } finally {
        client.release();
    }
}
export async function getAllUsers() {
    const client = await pool.connect();
    const query = `SELECT user_id,name,email FROM attendees `
    try {

        const result = await client.query(query);
        if (result.rows[0] <= 0) {
            return { error: 'No user found' }
        }
        return { data: result.rows };

    } catch (error) {
        console.error("Database query error:", error);
        return { error: "Database query error:" }
    } finally {
        client.release();
    }

}

export async function getAllQrCodes() {
    const client = await pool.connect();
    const queryText = `SELECT user_id,event_id,token,qr_data FROM qr_codes`
    try {
        const result = await client.query(queryText)
        return { data: result.rows, success: true, error: "" }
    } catch (error) {
        console.log(error)
        return { data: null, success: false, error: true }
    } finally {
        client.release();
    }

}


export async function saveToQrCodes(data: Object[]) {
    const client = await pool.connect();
    const values = data
        .map((attendee, index) => {
            // Format values, escaping strings with single quotes and handling SQL injection
            const user_id = attendee.user_id;
            const event_id = attendee.event_id; // Escape single quotes
            const token = `'${attendee.token}'`; // Escape single quotes
            const qr_data = `'${attendee.qrData}'`; // Escape single quotes
            const used = 'FALSE';
            return `(${user_id}, ${event_id}, ${token}, ${qr_data}, ${used})`;
        })
        .join(',\n');

    let query = `INSERT INTO qr_codes (user_id, event_id, token,qr_data,used) VALUES\n`
    query += values + ';'
    console.log(query)
    try {

        const result = await client.query(query);

        return { success: true, message: 'Successfuly inserted to database', insertedRows: result.rowCount };

    } catch (error) {
        console.error("Database query error:", error);
        return { success: false, message: error, insertedRows: 0 }
    } finally {
        client.release();
    }
}
// Optional: Close the pool on app shutdown
process.on("SIGTERM", async () => {
    await pool.end();
});


