import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/textbooks/[id] - 获取教材详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    const { data, error } = await client
      .from('textbooks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Textbook not found' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching textbook:', error);
    return NextResponse.json(
      { error: 'Failed to fetch textbook' },
      { status: 500 }
    );
  }
}

// PUT /api/textbooks/[id] - 更新教材
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // 只更新提供的字段
    if (body.name !== undefined) updateData.name = body.name;
    if (body.chapter_count !== undefined) updateData.chapter_count = body.chapter_count;
    if (body.knowledge_point_count !== undefined) updateData.knowledge_point_count = body.knowledge_point_count;
    if (body.school_count !== undefined) updateData.school_count = body.school_count;
    if (body.has_unpublished_changes !== undefined) updateData.has_unpublished_changes = body.has_unpublished_changes;
    if (body.current_version !== undefined) updateData.current_version = body.current_version;
    if (body.last_publish_time !== undefined) updateData.last_publish_time = body.last_publish_time;
    if (body.last_publisher !== undefined) updateData.last_publisher = body.last_publisher;

    const { data, error } = await client
      .from('textbooks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error updating textbook:', error);
    return NextResponse.json(
      { error: 'Failed to update textbook' },
      { status: 500 }
    );
  }
}

// DELETE /api/textbooks/[id] - 删除教材
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    // 先删除关联的章节
    await client
      .from('textbook_chapters')
      .delete()
      .eq('textbook_id', id);

    // 删除关联的变更记录
    await client
      .from('textbook_change_records')
      .delete()
      .eq('textbook_id', id);

    // 删除关联的发布记录
    await client
      .from('textbook_publish_records')
      .delete()
      .eq('textbook_id', id);

    // 删除关联的学校
    await client
      .from('textbook_schools')
      .delete()
      .eq('textbook_id', id);

    // 删除教材
    const { error } = await client
      .from('textbooks')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting textbook:', error);
    return NextResponse.json(
      { error: 'Failed to delete textbook' },
      { status: 500 }
    );
  }
}
