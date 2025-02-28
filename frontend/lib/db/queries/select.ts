import { db } from "../db";
import { users } from "../schema";
import { eq } from "drizzle-orm";



export async function getUser(email: string) {
    try {
        const userData = await db.select().from(users).where(eq(users.email, email)).execute();

        if (userData.length === 0) {
            console.error("User not found in database");
            return null;
        }
        return userData[0];
    } catch (error) {
        console.error("Failed to get user from database:", error);
        throw error;
    }
}

// get user by id
export async function getUserById(id: string) {
    try {
        const userData = await db.select().from(users).where(eq(users.id, id)).execute();

        if (userData.length === 0) {
            console.error("User not found in database");
            return null;
        }
        return userData[0];
    } catch (error) {
        console.error("Failed to get user from database:", error);
        throw error;
    }
}
