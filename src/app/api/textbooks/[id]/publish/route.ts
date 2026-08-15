import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/textbooks/[id]/publish - 获取发布记录
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    const { data, error } = await client
      .from('textbook_publish_records')
      .select('*')
      .eq('textbook_id', id)
      .order('publish_time', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching publish records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch publish records' },
      { status: 500 }
    );
  }
}

// POST /api/textbooks/[id]/publish - 发布新版本
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    const now = new Date();
    const publishTime = now.toISOString();

    // 获取未发布的变更记录
    const { data: unpublishedChanges } = await client
      .from('textbook_change_records')
      .select('*')
      .eq('textbook_id', id)
      .eq('is_published', false);

    // 创建发布记录
    const { data: publishRecord, error: publishError } = await client
      .from('textbook_publish_records')
      .insert({
        textbook_id: id,
        version: body.version,
        description: body.description,
        publish_time: publishTime,
        publisher: body.publisher || '当前用户',
        publisher_account: body.publisher_account,
        changes: unpublishedChanges || [],
        scheduled_date: body.scheduled_date,
        scheduled_time: body.scheduled_time,
      })
      .select()
      .single();

    if (publishError) {
      return NextResponse.json({ error: publishError.message }, { status: 500 });
    }

    // 将变更记录标记为已发布
    await client
      .from('textbook_change_records')
      .update({ is_published: true })
      .eq('textbook_id', id)
      .eq('is_published', false);

    // 更新教材状态
    await client
      .from('textbooks')
      .update({
        current_version: body.version,
        last_publish_time: publishTime,
        last_publisher: body.publisher || '当前用户',
        has_unpublished_changes: false,
        updated_at: publishTime,
      })
      .eq('id', id);

    return NextResponse.json({ data: publishRecord });
  } catch (error) {
    console.error('Error publishing:', error);
    return NextResponse.json(
      { error: 'Failed to publish' },
      { status: 500 }
    );
  }
}
