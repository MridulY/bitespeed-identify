import { Request, Response } from 'express';
import { query } from './db';

interface Contact {
  id: number;
  email?: string;
  phoneNumber?: string;
  linkedId?: number;
  linkPrecedence: 'primary' | 'secondary';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

async function findOrCreateContact(email: string | null, phoneNumber: string | null): Promise<number> {
    if (!email && !phoneNumber) {
        throw new Error('Either email or phoneNumber must be provided');
    }

    const findContactQuery = `
        SELECT * FROM contact_zkyu
        WHERE email = $1 OR phonenumber = $2
        ORDER BY createdat ASC
        LIMIT 1;
    `;
    const findResult = await query(findContactQuery, [email, phoneNumber]);
    
    if (findResult.rows.length > 0) {
        return findResult.rows[0].id;
    } else {
        const insertContactQuery = `
            INSERT INTO contact_zkyu (email, phonenumber, linkprecedence)
            VALUES ($1, $2, 'primary')
            RETURNING id;
        `;
        const insertResult = await query(insertContactQuery, [email, phoneNumber]);
        return insertResult.rows[0].id;
    }
}

async function updateContactLinking(email: string, phoneNumber: string, primaryContactId: number): Promise<void> {
    // Update the existing contact to be secondary if it matches the new primary contact criteria
    await query(
        `UPDATE contact_zkyu SET linkedid = $1, linkprecedence = 'secondary', updatedat = NOW() WHERE phonenumber = $2 AND id != $1`,
        [primaryContactId, phoneNumber]
    );
}

export const identifyContact = async (req: Request, res: Response) => {
    try {
        const { email, phoneNumber } = req.body;

        const primaryContactId = await findOrCreateContact(email, phoneNumber);

        await updateContactLinking(email, phoneNumber, primaryContactId);

        const contacts = await query(
            `SELECT id, email, phonenumber, linkedid FROM contact_zkyu WHERE id = $1 OR linkedid = $1`,
            [primaryContactId]
        );

        res.json({
            contact: {
                primaryContactId: primaryContactId,
                emails: contacts.rows.map(contact => contact.email),
                phoneNumbers: contacts.rows.map(contact => contact.phoneNumber),
                secondaryContactIds: contacts.rows.filter(contact => contact.id !== primaryContactId).map(contact => contact.id),
            },
        });
    } catch (error) {
        console.error('Failed to identify contact:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
