import { NextRequest, NextResponse } from 'next/server';
import { SAMPLE_99ACRES_PAYLOAD } from '@/lib/ninety-nine-acres/sample-payload';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COLLECTION: Record<string, unknown> = {
  info: {
    _postman_id: '99acres-crm-integration-2026-07-04',
    name: '99acres CRM Integration',
    description:
      'Post leads from 99acres into the SpaceOracleCRM webhook. ' +
      'Set the `token` collection variable to NINETY_NINE_ACRES_BEARER_TOKEN ' +
      'and `baseUrl` to your deployment URL.',
    schema:
      'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: [
    {
      name: 'Receive 99acres Lead (Webhook)',
      request: {
        method: 'POST',
        header: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Authorization', value: 'Bearer {{token}}' },
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify(SAMPLE_99ACRES_PAYLOAD, null, 2),
          options: { raw: { language: 'json' } },
        },
        url: {
          raw: '{{baseUrl}}/api/integrations/99acres/webhook',
          host: ['{{baseUrl}}'],
          path: ['api', 'integrations', '99acres', 'webhook'],
        },
      },
    },
  ],
  variable: [
    { key: 'baseUrl', value: 'https://your-deployment.example.com' },
    { key: 'token', value: 'YOUR_SECRET_TOKEN' },
  ],
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const download = searchParams.get('download') === '1';
  const filename = '99acres-crm-integration.postman_collection.json';
  const body = JSON.stringify(COLLECTION, null, 2);

  return new NextResponse(body, {
    status: 200,
    headers: {
      'content-type': 'application/json',
      ...(download ? { 'content-disposition': `attachment; filename="${filename}"` } : {}),
    },
  });
}