/**
 * Test script for ShortReel Typed API Client SDK
 */

const assert = require('assert');

async function testApiClient() {
  console.log('Testing generated API client artifacts...');

  const typesPath = '../src/lib/api-client/types.gen.ts';
  const clientPath = '../src/lib/api-client/client.ts';
  const indexPath = '../src/lib/api-client/index.ts';

  const fs = require('fs');
  const path = require('path');

  assert(fs.existsSync(path.resolve(__dirname, typesPath)), 'types.gen.ts must exist');
  assert(fs.existsSync(path.resolve(__dirname, clientPath)), 'client.ts must exist');
  assert(fs.existsSync(path.resolve(__dirname, indexPath)), 'index.ts must exist');

  const clientContent = fs.readFileSync(path.resolve(__dirname, clientPath), 'utf-8');
  assert(clientContent.includes('export const contentApi'), 'contentApi must be exported');
  assert(clientContent.includes('export const interactiveApi'), 'interactiveApi must be exported');
  assert(clientContent.includes('export const engagementApi'), 'engagementApi must be exported');
  assert(clientContent.includes('export const creatorsApi'), 'creatorsApi must be exported');
  assert(clientContent.includes('export const aiStudioApi'), 'aiStudioApi must be exported');
  assert(clientContent.includes('export const subscriptionsApi'), 'subscriptionsApi must be exported');
  assert(clientContent.includes('export const adminApi'), 'adminApi must be exported');

  const typesContent = fs.readFileSync(path.resolve(__dirname, typesPath), 'utf-8');
  assert(typesContent.includes('export interface ApiResponse'), 'ApiResponse envelope must be defined');
  assert(typesContent.includes('export interface ConceptExpandRequestDto'), 'ConceptExpandRequestDto must be defined');
  assert(typesContent.includes('export interface CharacterForgeRequestDto'), 'CharacterForgeRequestDto must be defined');

  console.log('✅ All API Client SDK assertions passed successfully!');
}

testApiClient().catch((err) => {
  console.error('API Client test failed:', err);
  process.exit(1);
});
