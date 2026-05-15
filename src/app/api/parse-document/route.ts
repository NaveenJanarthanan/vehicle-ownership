import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getSessionUser } from '@/lib/session';

const EXTRACTION_PROMPT = `You are extracting vehicle purchase information from one or more documents (title applications, purchase contracts, odometer disclosures, warranty contracts, insurance forms, loan documents, etc.).

Extract ALL available information and return ONLY a valid JSON object with this exact structure:

{
  "vehicle": {
    "vin": string | null,
    "year": number | null,
    "make": string | null,
    "model": string | null,
    "trim": string | null,
    "color": string | null,
    "mileage": number | null,
    "purchasePrice": number | null,
    "purchaseDate": string | null
  },
  "loan": {
    "lender": string | null,
    "originalAmount": number | null,
    "currentBalance": number | null,
    "apr": number | null,
    "termMonths": number | null,
    "monthlyPayment": number | null,
    "startDate": string | null
  } | null,
  "warranties": [
    {
      "type": string,
      "provider": string | null,
      "expirationDate": string | null,
      "expirationMileage": number | null,
      "cost": number | null
    }
  ],
  "insurance": {
    "provider": string | null,
    "policyNumber": string | null,
    "coverageType": string,
    "monthlyPremium": number | null,
    "deductible": number | null,
    "startDate": string | null,
    "endDate": string | null
  } | null
}

Rules:
- All dates must be in YYYY-MM-DD format
- purchasePrice should be the vehicle cash price (before tax/fees), NOT the total sale price
- For loan: originalAmount = amount financed (not total sale price), currentBalance = same as originalAmount at time of purchase
- For loan startDate: use the first payment date if available, otherwise the purchase date
- For warranties: include ALL service contracts (extended warranty, tire & wheel, dent protection, windshield, key protection etc.) as separate entries
- For insurance: if you see deductibles listed per type (collision/comprehensive), use the lower one for "deductible"
- For insurance monthlyPremium: if only annual premium is shown, divide by 12; if not shown, set null
- coverageType should be one of: "Full Coverage", "Comprehensive", "Liability", "Collision"
- Return ONLY the JSON object, no markdown, no explanation`;

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type. Upload a PDF or image.' }, { status: 400 });
  }

  // 20 MB limit
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large. Maximum size is 20 MB.' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const isPdf = file.type === 'application/pdf';
  const contentBlock = isPdf
    ? {
        type: 'document' as const,
        source: {
          type: 'base64' as const,
          media_type: 'application/pdf' as const,
          data: base64,
        },
      }
    : {
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
          data: base64,
        },
      };

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: [
            contentBlock,
            { type: 'text', text: EXTRACTION_PROMPT },
          ],
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not extract data from document.' }, { status: 422 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `AI parsing failed: ${message}` }, { status: 500 });
  }
}
