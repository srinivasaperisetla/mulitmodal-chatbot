import { db } from "../db";
import { compare } from 'bcrypt-ts'; 
import { user } from "../schema";
import { eq } from "drizzle-orm";

export async function getUser(email: string, password: string) {
    try {
        const userData = await db.select().from(user).where(eq(user.email, email)).execute();

        // If the user is not found, return null
        if (userData.length === 0) {
            console.error("User not found in database");
            return null;
        }

        const { password: hashedPassword } = userData[0];

        // Compare password with the hashed password from the database
        const isPasswordValid = await compare(password, hashedPassword);

        if (!isPasswordValid) {
            console.error("Incorrect password");
            return null;
        }
        return userData[0];
    } catch (error) {
        console.error("Failed to get user from database:", error);
        throw error;
    }
}
