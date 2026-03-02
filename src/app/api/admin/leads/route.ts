import { NextResponse } from 'next/server';
import { getAllAdminLeadRows, getAdminLeadRows } from '@/lib/leadQueries';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get('page') ?? '1', 10) || 1;
    const pageSize = Math.min(Number.parseInt(searchParams.get('page_size') ?? '25', 10) || 25, 100);

    const zip = searchParams.get('zip') ?? undefined;
    const lead_status = searchParams.get('lead_status') ?? undefined;
    const homeowner_status = searchParams.get('homeowner_status') ?? undefined;
    const from = searchParams.get('from') ?? undefined;
    const to = searchParams.get('to') ?? undefined;
    const sortParam = searchParams.get('sort');
    const sort = sortParam === 'created_at_asc' ? 'created_at_asc' : 'created_at_desc';

    if (searchParams.get('all') === 'true') {
      const rows = await getAllAdminLeadRows({ zip, lead_status, homeowner_status, from, to, sort });
      return NextResponse.json({ rows, total: rows.length });
    }

    const result = await getAdminLeadRows({
      page,
      pageSize,
      zip,
      lead_status,
      homeowner_status,
      from,
      to,
      sort
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}
