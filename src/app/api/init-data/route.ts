import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// POST /api/init-data - 初始化测试数据
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();

    // 检查是否已有数据
    const { data: existingTextbooks } = await client
      .from('textbooks')
      .select('id')
      .limit(1);

    if (existingTextbooks && existingTextbooks.length > 0) {
      return NextResponse.json({
        message: '数据已存在，跳过初始化',
        existing: true,
      });
    }

    // 创建测试教材
    const { data: textbook1, error: error1 } = await client
      .from('textbooks')
      .insert({
        name: '高中数学·必修一',
        subject: '数学',
        phase: '高中',
        grade: '高一',
        publisher: '人教版',
        version: '2024版',
        year: '2024',
        region: '全国',
        chapter_count: 2,
        knowledge_point_count: 4,
        school_count: 2,
        has_unpublished_changes: false,
        current_version: 'v1.0',
        last_publish_time: '2024-01-10 09:00:00',
        last_publisher: '管理员',
      })
      .select()
      .single();

    if (error1) {
      return NextResponse.json({ error: error1.message }, { status: 500 });
    }

    // 创建第二个教材
    const { data: textbook2, error: error2 } = await client
      .from('textbooks')
      .insert({
        name: '高中数学·必修二',
        subject: '数学',
        phase: '高中',
        grade: '高二',
        publisher: '人教版',
        version: '2024版',
        year: '2024',
        region: '全国',
        chapter_count: 1,
        knowledge_point_count: 2,
        school_count: 1,
        has_unpublished_changes: false,
        current_version: 'v1.0',
        last_publish_time: '2024-01-10 10:00:00',
        last_publisher: '李老师',
      })
      .select()
      .single();

    if (error2) {
      return NextResponse.json({ error: error2.message }, { status: 500 });
    }

    // 为教材1创建章节
    const chapters1 = [
      {
        textbook_id: textbook1.id,
        name: '第一章 集合与常用逻辑用语',
        level: 'chapter',
        order: 1,
        expanded: true,
        knowledge_points: JSON.stringify([
          { id: 'kp1', name: '集合的概念', extendedPoints: [] },
          { id: 'kp2', name: '集合间的基本关系', extendedPoints: [] },
        ]),
      },
      {
        textbook_id: textbook1.id,
        name: '1.1 集合的概念',
        level: 'section',
        order: 1,
        parent_id: null, // 需要后续更新
        expanded: false,
        knowledge_points: JSON.stringify([
          { id: 'kp1', name: '集合的概念', extendedPoints: [] },
        ]),
      },
      {
        textbook_id: textbook1.id,
        name: '第二章 函数概念与基本初等函数',
        level: 'chapter',
        order: 2,
        expanded: false,
        knowledge_points: JSON.stringify([
          { id: 'kp3', name: '函数的概念', extendedPoints: [] },
          { id: 'kp4', name: '函数的基本性质', extendedPoints: [] },
        ]),
      },
    ];

    const { data: insertedChapters1, error: chapterError1 } = await client
      .from('textbook_chapters')
      .insert(chapters1)
      .select();

    if (chapterError1) {
      return NextResponse.json({ error: chapterError1.message }, { status: 500 });
    }

    // 更新子章节的 parent_id
    if (insertedChapters1 && insertedChapters1.length >= 2) {
      const parentChapter = insertedChapters1[0];
      const childSection = insertedChapters1[1];
      
      await client
        .from('textbook_chapters')
        .update({ parent_id: parentChapter.id })
        .eq('id', childSection.id);
    }

    // 为教材2创建章节
    const chapters2 = [
      {
        textbook_id: textbook2.id,
        name: '第一章 空间几何体',
        level: 'chapter',
        order: 1,
        expanded: false,
        knowledge_points: JSON.stringify([
          { id: 'kp5', name: '空间几何体的结构', extendedPoints: [] },
          { id: 'kp6', name: '空间几何体的三视图和直观图', extendedPoints: [] },
        ]),
      },
    ];

    const { error: chapterError2 } = await client
      .from('textbook_chapters')
      .insert(chapters2);

    if (chapterError2) {
      return NextResponse.json({ error: chapterError2.message }, { status: 500 });
    }

    // 创建使用学校
    const schools = [
      { textbook_id: textbook1.id, school_id: 's1', school_name: '北京市第一中学' },
      { textbook_id: textbook1.id, school_id: 's2', school_name: '上海市实验中学' },
      { textbook_id: textbook2.id, school_id: 's3', school_name: '广州市第二中学' },
    ];

    await client.from('textbook_schools').insert(schools);

    // 创建发布记录
    const publishRecords = [
      {
        textbook_id: textbook1.id,
        version: 'v1.0',
        description: '初始版本',
        publish_time: '2024-01-10 09:00:00',
        publisher: '管理员',
        publisher_account: '000001',
      },
      {
        textbook_id: textbook2.id,
        version: 'v1.0',
        description: '初始版本',
        publish_time: '2024-01-10 10:00:00',
        publisher: '李老师',
        publisher_account: '234567',
      },
    ];

    await client.from('textbook_publish_records').insert(publishRecords);

    return NextResponse.json({
      success: true,
      message: '测试数据初始化成功',
      textbooks: [textbook1, textbook2],
    });
  } catch (error) {
    console.error('Error initializing data:', error);
    return NextResponse.json(
      { error: 'Failed to initialize data' },
      { status: 500 }
    );
  }
}

// GET /api/init-data - 检查数据状态
export async function GET() {
  try {
    const client = getSupabaseClient();

    const { count: textbookCount } = await client
      .from('textbooks')
      .select('*', { count: 'exact', head: true });

    const { count: chapterCount } = await client
      .from('textbook_chapters')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      textbooks: textbookCount || 0,
      chapters: chapterCount || 0,
    });
  } catch (error) {
    console.error('Error checking data status:', error);
    return NextResponse.json(
      { error: 'Failed to check data status' },
      { status: 500 }
    );
  }
}
