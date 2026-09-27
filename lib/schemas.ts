import { z } from 'zod';
export const selectionSchema=z.object({service:z.uuid(),extras:z.array(z.uuid()).max(10)});
export const detailsSchema=z.object({name:z.string().trim().min(2,'Please enter your full name.').max(100),phone:z.string().trim().regex(/^\+?[\d\s().-]{10,25}$/,'Please enter a valid phone number.'),email:z.email().max(200),instagram:z.string().trim().max(50).regex(/^@?[\w.]*$/,'Use your Instagram username.'),notes:z.string().trim().max(300),prep:z.literal(true,{error:'Please read and agree to the booking policies.'}),website:z.string().max(0)});
export const bookingSchema=selectionSchema.extend({start:z.iso.datetime(),details:detailsSchema,idempotencyKey:z.uuid()});
