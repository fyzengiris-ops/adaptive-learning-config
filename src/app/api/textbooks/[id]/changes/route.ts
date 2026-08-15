import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/textbooks/[id]/changes - 获取变更记录
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const unpublishedOnly = searchParams.get('unpublished') === 'true';

    let query = client
      .from('textbook_change_records')
      .select('*')
      .eq('textbook_id', id)
      .order('created_at', { ascending: false });

    if (unpublishedOnly) {
      query = query.eq('is_published', false);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching changes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch changes' },
      { status: 500 }
    );
  }
}

// POST /api/textbooks/[id]/changes - 添加变更记录
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    // 添加变更记录
    const { data, error } = await client
      .from('textbook_change_records')
      .insert({
        textbook_id: id,
        change_type: body.change_type,
        change_description: body.change_description,
        changed_by: body.changed_by || '当前用户',
        changed_by_role: body.changed_by_role || 'teacher',
        dimension: body.dimension,
        target: body.target,
        is_published: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 更新教材的待发布状态
    await client
      .from('textbooks')
      .update({ has_unpublished_changes: true })
      .eq('id', id);

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error creating change:', error);
    return NextResponse.json(
      { error: 'Failed to create change' },
      { status: 500 }
    );
  }
}

// PUT /api/textbooks/[id]/changes - 标记变更为已发布
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    // 将所有未发布的变更标记为已发布
    const { error } = await client
      .from('textbook_change_records')
      .update({ is_published: true })
      .eq('textbook_id', id)
      .eq('is_published', false);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 更新教材状态
    await client
      .from('textbooks')
      .update({ has_unpublished_changes: false })
      .eq('id', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking changes as published:', error);
    return NextResponse.json(
      { error: 'Failed to mark changes as published' },
      { status: 500 }
    );
  }
}
