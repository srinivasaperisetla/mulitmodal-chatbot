import { db } from '../db';
import { user, User } from '../schema';
import { genSaltSync, hashSync } from 'bcrypt-ts';


export async function createUser(data: User) {
    const salt = genSaltSync(10);
    const hash = hashSync(data.password, salt);

    try {
        await db.insert(user).values({
            email: data.email,
            password: hash,
            createdAt: new Date(),
        })
    } catch (error) {
        console.error("Failed to create user in database");
        throw error;
    }
}