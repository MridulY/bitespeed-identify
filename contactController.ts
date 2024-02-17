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
        SELECT * FROM contact
        WHERE email = $1 OR phonenumber = $2
        ORDER BY createdat ASC
        LIMIT 1;
    `;
    const findResult = await query(findContactQuery, [email, phoneNumber]);
    
    if (findResult.rows.length > 0) {
        return findResult.rows[0].id;
    } else {
        const insertContactQuery = `
            INSERT INTO contact (email, phonenumber, linkprecedence)
            VALUES ($1, $2, 'primary')
            RETURNING id;
        `;
        const insertResult = await query(insertContactQuery, [email, phoneNumber]);
        return insertResult.rows[0].id;
    }
}

export const identifyContact = async (req: Request, res: Response) => {
    try {
        const { email, phoneNumber } = req.body;

        const primaryContactId = await findOrCreateContact(email, phoneNumber);

        const linkedContactsQuery = `
            SELECT * FROM contact
            WHERE id = $1 OR linkedid = $1;
        `;
        const linkedContactsResult = await query(linkedContactsQuery, [primaryContactId]);

        const contacts: Contact[] = linkedContactsResult.rows.map(dbRow => ({
            id: dbRow.id,
            email: dbRow.email,
            phoneNumber: dbRow.phonenumber,
            linkedId: dbRow.linkedid,
            linkPrecedence: dbRow.linkprecedence,
            createdAt: dbRow.createdat,
            updatedAt: dbRow.updatedat,
            deletedAt: dbRow.deletedat
        }));

        const uniqueEmails = [...new Set(contacts.map(contact => contact.email).filter(email => email !== null))];
        const uniquePhoneNumbers = [...new Set(contacts.map(contact => contact.phoneNumber).filter(phoneNumber => phoneNumber !== null))];

        const response = {
            contact: {
                primaryContactId: primaryContactId,
                emails: uniqueEmails,
                phoneNumbers: uniquePhoneNumbers,
                secondaryContactIds: contacts.filter(contact => contact.id !== primaryContactId).map(contact => contact.id)
            }
        };

        res.json(response);
    } catch (error) {
        console.error('Failed to identify contact:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
