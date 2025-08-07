// app/db.server.ts
import { Pool } from "pg";
import { data } from "react-router";

// DATABASE_URL=postgresql://postgres:postgres@172.24.128.1:5432/nia6_attendance

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


export async function findOneUser(id: string) {
    const client = await pool.connect();
    const queryText = `SELECT name,designation FROM attendees WHERE user_id = $1`;

    try {

        const result = await client.query(queryText, [id]);
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
    const query = `SELECT user_id, name, designation FROM attendees `
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
    const queryText = `SELECT user_id,event_id,token,qr_data,name FROM qr_codes`
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
            const user_id = `'${attendee.user_id}'`;
            const event_id = `'${attendee.event_id}'`; // Escape single quotes
            const token = `'${attendee.token}'`; // Escape single quotes
            const qr_data = `'${attendee.qrData}'`; // Escape single quotes
            const used = 'FALSE';
            const name = `'${attendee.name}'`
            return `(${user_id}, ${event_id}, ${token}, ${qr_data}, ${used},${name})`;
        })
        .join(',\n');

    let query = `INSERT INTO qr_codes (user_id, event_id, token,qr_data,used ,name) VALUES\n`
    query += values + ';'

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



export async function loggedIn(user_id: string, event_id: string, day_number: number, time_of_day: string, name: string, designation: string, role: string) {

    const client = await pool.connect();
    const queryText = `INSERT INTO attendance (user_id, event_id,day_number,time_of_day,name,designation,role) VALUES ($1,$2,$3,$4,$5,$6,$7)`;

    try {

        const result = await client.query(queryText, [user_id, event_id, day_number, time_of_day, name, designation, role]);

        return { success: true, message: 'Successfuly loggedin', error: null };

    } catch (error) {
        console.error("Database query error:", error);
        return { success: false, message: 'Loggedin failed', error: error }
    } finally {
        client.release();
    }
}
export async function findAttendance(user_id: string, event_id: string, day_number: number, time_of_day: string) {
    const client = await pool.connect();
    const queryText = `SELECT * FROM attendance WHERE user_id = $1 AND event_id = $2 AND day_number = $3 AND time_of_day = $4`;

    try {

        const result = await client.query(queryText, [user_id, event_id, day_number, time_of_day]);
        if (result.rowCount === 0) {

            return { result: false, message: "Attendee not yet loggedin", error: null }
        } else {
            return { result: true, message: "Attendee already loggedin", error: null }
        }


    } catch (error) {
        console.error("Database query error:", error);
        return { message: "Database query error ", error: error }
    } finally {
        client.release();
    }
}


export async function getAllAttendance() {
    const client = await pool.connect();
    const queryText = `SELECT * FROM (SELECT DISTINCT ON (user_id) * FROM attendance WHERE timestamp::date = CURRENT_DATE +1
    AND EXTRACT(HOUR FROM timestamp) BETWEEN 0 AND 11 ORDER BY user_id, timestamp ASC) t ORDER BY timestamp DESC;`

    try {

        const result = await client.query(queryText);
        if (result.rowCount !== 0) {
            console.log(result.rows)
            return { data: result.rows, message: "success", error: null }
        } else {
            return { data: null, message: "no attendance yet", error: null }
        }


    } catch (error) {
        console.error("Database query error:", error);
        return { message: "Database query error ", error: error }
    } finally {
        client.release();
    }
}



// Optional: Close the pool on app shutdown
process.on("SIGTERM", async () => {
    await pool.end();
});


