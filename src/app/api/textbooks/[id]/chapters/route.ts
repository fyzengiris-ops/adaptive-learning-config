import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/textbooks/[id]/chapters - 获取章节列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    const { data, error } = await client
      .from('textbook_chapters')
      .select('*')
      .eq('textbook_id', id)
      .order('order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chapters' },
      { status: 500 }
    );
  }
}

// PUT /api/textbooks/[id]/chapters - 批量更新章节
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();
    const { chapters } = body;

    // 使用事务处理（Supabase 不支持事务，需要逐个处理）
    const results = [];

    for (const chapter of chapters) {
      if (chapter.id) {
        // 更新现有章节
        const { data, error } = await client
          .from('textbook_chapters')
          .update({
            name: chapter.name,
            parent_id: chapter.parent_id,
            level: chapter.level,
            order: chapter.order,
            expanded: chapter.expanded,
            knowledge_points: chapter.knowledge_points,
            sync_courses: chapter.sync_courses,
            practice_exams: chapter.practice_exams,
            updated_at: new Date().toISOString(),
          })
          .eq('id', chapter.id)
          .select()
          .single();

        if (!error && data) {
          results.push(data);
        }
      } else {
        // 创建新章节
        const { data, error } = await client
          .from('textbook_chapters')
          .insert({
            textbook_id: id,
            name: chapter.name,
            parent_id: chapter.parent_id,
            level: chapter.level,
            order: chapter.order,
            expanded: chapter.expanded || false,
            knowledge_points: chapter.knowledge_points,
            sync_courses: chapter.sync_courses,
            practice_exams: chapter.practice_exams,
          })
          .select()
          .single();

        if (!error && data) {
          results.push(data);
        }
      }
    }

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error('Error updating chapters:', error);
    return NextResponse.json(
      { error: 'Failed to update chapters' },
      { status: 500 }
    );
  }
}

// POST /api/textbooks/[id]/chapters - 创建章节
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    const { data, error } = await client
      .from('textbook_chapters')
      .insert({
        textbook_id: id,
        name: body.name,
        parent_id: body.parent_id,
        level: body.level,
        order: body.order,
        expanded: body.expanded || false,
        knowledge_points: body.knowledge_points,
        sync_courses: body.sync_courses,
        practice_exams: body.practice_exams,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error creating chapter:', error);
    return NextResponse.json(
      { error: 'Failed to create chapter' },
      { status: 500 }
    );
  }
}

// DELETE /api/textbooks/[id]/chapters - 删除章节
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');

    if (!chapterId) {
      return NextResponse.json(
        { error: 'chapterId is required' },
        { status: 400 }
      );
    }

    const { error } = await client
      .from('textbook_chapters')
      .delete()
      .eq('id', chapterId)
      .eq('textbook_id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chapter:', error);
    return NextResponse.json(
      { error: 'Failed to delete chapter' },
      { status: 500 }
    );
  }
}
