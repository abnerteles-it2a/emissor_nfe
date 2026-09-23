import { NextResponse } from 'next/server';
import { FiscalAiGateway } from '@fiscal/ai-gateway';

const gateway = new FiscalAiGateway();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.description) {
      return NextResponse.json({ error: 'DESCRIPTION_REQUIRED' }, { status: 400 });
    }
    const result = await gateway.classify({
      description: body.description,
      regime: body.regime,
      uf: body.uf,
      operationType: body.operationType,
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Classification failed' }, { status: 500 });
  }
}
