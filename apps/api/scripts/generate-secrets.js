#!/usr/bin/env node
/**
 * Generate secure random secrets for JWT and REFRESH tokens
 * Run: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

const jwtSecret = crypto.randomBytes(64).toString('hex');
const refreshSecret = crypto.randomBytes(64).toString('hex');

console.log('\n🔐 Generated Secrets');
console.log('====================\n');
console.log('JWT_SECRET=' + jwtSecret);
console.log('REFRESH_SECRET=' + refreshSecret);
console.log('\n📋 Copy these into your .env file');
console.log('⚠️  NEVER commit these to git!\n');