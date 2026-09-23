import { NextResponse } from 'next/server';
import { FiscalAiGateway } from '@fiscal/ai-gateway';

const gateway = new FiscalAiGateway();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!Array.isArray(body?.items)) {
      return NextResponse.json({ error: 'ITEMS_ARRAY_REQUIRED' }, { status: 400 });
    }
    const result = await gateway.simulateReforma({
      items: body.items,
      regime: body.regime,
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Simulation failed' }, { status: 500 });
  }
}
