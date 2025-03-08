import { db } from '../db';
import { users } from '../schema';
import { genSaltSync, hashSync } from 'bcrypt-ts';


export async function createUser(email: string, password: string) {
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);

    try {
        await db.insert(users).values({
            email: email,
            password: hash,
            createdAt: new Date(),
        })
    } catch (error) {
        console.error("Failed to create user in database");
        throw error;
    }
}
