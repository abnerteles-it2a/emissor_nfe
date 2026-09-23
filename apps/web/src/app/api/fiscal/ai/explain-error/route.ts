import { NextResponse } from 'next/server';
import { FiscalAiGateway } from '@fiscal/ai-gateway';

const gateway = new FiscalAiGateway();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.cStat && !body?.sefazMessage) {
      return NextResponse.json({ error: 'CSTAT_OR_MESSAGE_REQUIRED' }, { status: 400 });
    }
    const result = await gateway.explainRejection({
      cStat: body.cStat,
      sefazMessage: body.sefazMessage,
      documentType: body.documentType,
      rawPayload: body.rawPayload,
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Explanation failed' }, { status: 500 });
  }
}
