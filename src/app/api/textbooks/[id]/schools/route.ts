import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/textbooks/[id]/schools - 获取使用学校列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    const { data, error } = await client
      .from('textbook_schools')
      .select('*')
      .eq('textbook_id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching schools:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schools' },
      { status: 500 }
    );
  }
}

// POST /api/textbooks/[id]/schools - 添加学校
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    // 批量插入学校
    const schoolsToInsert = body.schools.map((school: { id: string; name: string }) => ({
      textbook_id: id,
      school_id: school.id,
      school_name: school.name,
    }));

    const { data, error } = await client
      .from('textbook_schools')
      .insert(schoolsToInsert)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 更新教材的学校数量
    const { count } = await client
      .from('textbook_schools')
      .select('*', { count: 'exact', head: true })
      .eq('textbook_id', id);

    await client
      .from('textbooks')
      .update({ school_count: count || 0 })
      .eq('id', id);

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error adding schools:', error);
    return NextResponse.json(
      { error: 'Failed to add schools' },
      { status: 500 }
    );
  }
}

// DELETE /api/textbooks/[id]/schools - 删除学校
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');

    if (!schoolId) {
      return NextResponse.json(
        { error: 'schoolId is required' },
        { status: 400 }
      );
    }

    const { error } = await client
      .from('textbook_schools')
      .delete()
      .eq('textbook_id', id)
      .eq('school_id', schoolId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 更新教材的学校数量
    const { count } = await client
      .from('textbook_schools')
      .select('*', { count: 'exact', head: true })
      .eq('textbook_id', id);

    await client
      .from('textbooks')
      .update({ school_count: count || 0 })
      .eq('id', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting school:', error);
    return NextResponse.json(
      { error: 'Failed to delete school' },
      { status: 500 }
    );
  }
}
