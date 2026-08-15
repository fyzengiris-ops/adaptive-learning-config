import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/textbooks - 获取教材列表
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const phase = searchParams.get('phase');
    const grade = searchParams.get('grade');

    let query = client
      .from('textbooks')
      .select('*')
      .order('created_at', { ascending: false });

    if (subject) {
      query = query.eq('subject', subject);
    }
    if (phase) {
      query = query.eq('phase', phase);
    }
    if (grade) {
      query = query.eq('grade', grade);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching textbooks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch textbooks' },
      { status: 500 }
    );
  }
}

// POST /api/textbooks - 创建教材
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await client
      .from('textbooks')
      .insert({
        name: body.name,
        subject: body.subject,
        phase: body.phase,
        grade: body.grade,
        publisher: body.publisher,
        version: body.version,
        year: body.year,
        region: body.region,
        chapter_count: 0,
        knowledge_point_count: 0,
        school_count: 0,
        has_unpublished_changes: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error creating textbook:', error);
    return NextResponse.json(
      { error: 'Failed to create textbook' },
      { status: 500 }
    );
  }
}
