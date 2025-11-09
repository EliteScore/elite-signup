const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { initializeDatabase, dbPool } = require('../config/database');
const {
  upsertCommunity,
  ensureCommunityMembership,
  upsertUserCommunityProgress,
  getCommunitiesForUser,
  getCommunityMembers,
  getUserCommunityProgress,
  recordChallengeEvent
} = require('../database/communityOperations');

async function runCommunitySyncTest() {
  console.log('🌐 Testing Community Synchronization');
  console.log('====================================\n');

  await initializeDatabase();

  const now = Date.now();
  const communityId = `community_test_${now}`;
  const ownerId = `owner_${now}`;
  const memberId = `member_${now}`;
  const eventId = `evt_${now}`;

  try {
    console.log('📦 Upserting community metadata...');
    const community = await upsertCommunity({
      communityId,
      name: `Test Community ${now}`,
      description: 'Automated test community for integration checks',
      avatarUrl: null,
      defaultGroupId: null,
      createdByUserId: ownerId,
      isActive: true
    });
    console.log('✅ Community saved:', community.communityId);

    console.log('\n👥 Syncing community members...');
    await ensureCommunityMembership(communityId, ownerId, { role: 'owner' });
    await ensureCommunityMembership(communityId, memberId, { role: 'member' });
    console.log('✅ Members ensured.');

    console.log('\n📈 Writing baseline progress snapshot...');
    const baselineProgress = await upsertUserCommunityProgress({
      communityId,
      userId: memberId,
      totalXp: 120,
      dailyStreak: 3,
      weeklyStreak: 1,
      lastChallengeId: 'challenge_baseline',
      lastChallengeType: 'daily',
      lastCompletedAt: new Date().toISOString()
    });
    console.log('✅ Baseline progress stored with XP:', baselineProgress.totalXp);

    console.log('\n⚡ Recording challenge event with updated progress...');
    const challengeResult = await recordChallengeEvent(
      {
        eventId,
        communityId,
        userId: memberId,
        challengeId: 'challenge_smoke',
        challengeType: 'daily',
        xpAwarded: 40,
        occurredAt: new Date().toISOString(),
        payload: { source: 'community-sync-test' }
      },
      {
        communityId,
        userId: memberId,
        totalXp: baselineProgress.totalXp + 40,
        dailyStreak: baselineProgress.dailyStreak + 1,
        weeklyStreak: baselineProgress.weeklyStreak,
        lastChallengeId: 'challenge_smoke',
        lastChallengeType: 'daily',
        lastCompletedAt: new Date().toISOString()
      }
    );
    console.log('✅ Event logged:', challengeResult.event?.eventId);
    console.log('✅ Progress updated with XP:', challengeResult.progress?.totalXp);

    console.log('\n🔍 Fetching community listings and members...');
    const communities = await getCommunitiesForUser(memberId);
    const members = await getCommunityMembers(communityId);
    const latestProgress = await getUserCommunityProgress(communityId, memberId);

    console.log(`✅ Found ${communities.length} community(ies) for member.`);
    console.log(`✅ Community member count: ${members.length}`);
    console.log('✅ Latest XP total:', latestProgress?.totalXp);

    console.log('\n🎉 Community sync smoke test completed successfully!');
  } catch (error) {
    console.error('\n❌ Community sync test failed:', error);
    throw error;
  } finally {
    console.log('\n🧹 Cleaning up test artifacts...');
    await dbPool.query('DELETE FROM community_challenge_events WHERE community_id = $1', [communityId]);
    await dbPool.query('DELETE FROM user_community_progress WHERE community_id = $1', [communityId]);
    await dbPool.query('DELETE FROM community_members WHERE community_id = $1', [communityId]);
    await dbPool.query('DELETE FROM communities WHERE community_id = $1', [communityId]);
    await dbPool.end();
    console.log('✅ Cleanup complete.');
  }
}

runCommunitySyncTest()
  .then(() => {
    console.log('\n✅ All community tests passed.\n');
    process.exit(0);
  })
  .catch(() => {
    console.log('\n❌ Community tests failed.\n');
    process.exit(1);
  });

