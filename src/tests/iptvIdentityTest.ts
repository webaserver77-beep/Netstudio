import { VERIFIED_CANONICAL_CHANNELS, CANONICAL_CHANNEL_MAP } from '../data/channelsData';
import { runIPTVDiagnostics, validateChannelIntegrity, isValidChannelLogo } from '../utils/iptvValidator';

export function executeIPTVIdentityVerificationSuite(): { success: boolean; results: string[] } {
  const log: string[] = [];
  let allPassed = true;

  log.push('=== RUNNING NETSTUDIO IPTV IDENTITY & LOGO AUDIT ===');

  // Test 1: Unique Channel IDs
  const channelIds = VERIFIED_CANONICAL_CHANNELS.map(c => c.id);
  const uniqueIds = new Set(channelIds);
  if (channelIds.length === uniqueIds.size) {
    log.push(`[PASS] Test 1: All ${channelIds.length} canonical channels have unique primary IDs.`);
  } else {
    log.push(`[FAIL] Test 1: Duplicate channel IDs detected!`);
    allPassed = false;
  }

  // Test 2: Flash TV Identity & Logo Verification
  const flashChannel = CANONICAL_CHANNEL_MAP.get('flashtv.rw') || VERIFIED_CANONICAL_CHANNELS.find(c => c.id === 'FlashTV.rw');
  if (flashChannel && flashChannel.logoUrl?.includes('FlashTV.rw.png') && !flashChannel.logoUrl.includes('BTN.rw.png')) {
    log.push(`[PASS] Test 2: Flash TV has strictly verified logo (${flashChannel.logoUrl}) with zero BTN pollution.`);
  } else {
    log.push(`[FAIL] Test 2: Flash TV logo is incorrect or polluted: ${flashChannel?.logoUrl}`);
    allPassed = false;
  }

  // Test 3: BTN TV Identity & Logo Verification
  const btnChannel = CANONICAL_CHANNEL_MAP.get('btn.rw') || VERIFIED_CANONICAL_CHANNELS.find(c => c.id === 'BTN.rw');
  if (btnChannel && btnChannel.logoUrl?.includes('BTN.rw.png') && !btnChannel.logoUrl.includes('FlashTV.rw.png')) {
    log.push(`[PASS] Test 3: BTN TV has strictly verified logo (${btnChannel.logoUrl}) with zero Flash pollution.`);
  } else {
    log.push(`[FAIL] Test 3: BTN TV logo is incorrect or polluted: ${btnChannel?.logoUrl}`);
    allPassed = false;
  }

  // Test 4: RBA Television Identity & Logo Verification
  const rbaChannel = CANONICAL_CHANNEL_MAP.get('rwandatelevision.rw') || VERIFIED_CANONICAL_CHANNELS.find(c => c.id === 'RwandaTelevision.rw');
  if (rbaChannel && rbaChannel.logoUrl?.includes('RwandaTelevision.rw.png')) {
    log.push(`[PASS] Test 4: Rwanda Television has strictly verified logo (${rbaChannel.logoUrl}).`);
  } else {
    log.push(`[FAIL] Test 4: Rwanda Television logo is incorrect: ${rbaChannel?.logoUrl}`);
    allPassed = false;
  }

  // Test 5: Fallback Channel without verified logo must have null logoUrl and NEVER steal other channel logos
  const agasobanuyeChannel = CANONICAL_CHANNEL_MAP.get('netstudioagasobanuye.rw') || VERIFIED_CANONICAL_CHANNELS.find(c => c.id === 'NetStudioAgasobanuye.rw');
  if (agasobanuyeChannel && agasobanuyeChannel.logoUrl === null) {
    log.push(`[PASS] Test 5: Unverified channel correctly defaults to null logoUrl (neutral fallback), no logo stolen.`);
  } else {
    log.push(`[FAIL] Test 5: Unverified channel has unexpected non-null logoUrl: ${agasobanuyeChannel?.logoUrl}`);
    allPassed = false;
  }

  // Test 6: Cross-Channel Logo Validator rejection test
  const fakeCrossAssignment = isValidChannelLogo('FlashTV.rw', { channel: 'BTN.rw' });
  if (fakeCrossAssignment === false) {
    log.push(`[PASS] Test 6: isValidChannelLogo correctly rejected mismatched cross-channel logo assignment.`);
  } else {
    log.push(`[FAIL] Test 6: isValidChannelLogo erroneously allowed cross-channel logo assignment.`);
    allPassed = false;
  }

  // Test 7: Diagnostics Report Runner
  const report = runIPTVDiagnostics(VERIFIED_CANONICAL_CHANNELS);
  if (report.errorCount === 0 && report.totalChannels > 0) {
    log.push(`[PASS] Test 7: Diagnostics report completed with 0 errors across ${report.totalChannels} channels.`);
  } else {
    log.push(`[FAIL] Test 7: Diagnostics report flagged errors: ${report.errorCount}`);
    allPassed = false;
  }

  log.push(allPassed ? '=== AUDIT SUMMARY: ALL TESTS PASSED! ZERO CONTAMINATION. ===' : '=== AUDIT SUMMARY: FAILURES FOUND! ===');

  return { success: allPassed, results: log };
}
