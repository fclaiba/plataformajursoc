import { makeFunctionReference } from 'convex/server';

export const healthPing = makeFunctionReference<'query', Record<string, never>, { ok: boolean; timestamp: number }>(
  'health:ping',
);
export const correlativesGetMap = makeFunctionReference<'query', Record<string, never>, {
  nodes: Array<any>;
  edges: Array<any>;
}>('correlatives:getMap');

type MeResult = {
  user: { _id: string; email?: string; name?: string } | null;
  profile: {
    role?: 'student' | 'admin';
    reputation?: number;
    reviewsCount?: number;
    approvedSubjectExternalIds?: string[];
    documentUrls?: string[];
  } | null;
} | null;

export const usersGetMe = makeFunctionReference<'query', Record<string, never>, MeResult>(
  'users:getMe',
);
export const usersGetVisibleProfile = makeFunctionReference<'query', {
  targetUserId: string;
}, {
  user: { _id: string; name: string };
  profile: {
    role?: 'student' | 'admin';
    reputation?: number;
    reviewsCount?: number;
  };
} | null>('users:getVisibleProfile');
export const usersListVisibleActivity = makeFunctionReference<'query', {
  targetUserId: string;
  limit?: number;
}, Array<{
  id: string;
  type: 'exchange_completed' | 'review_received';
  title: string;
  description: string;
  createdAt: number;
}>>('users:listVisibleActivity');

export const usersEnsureCurrentProfile = makeFunctionReference<'mutation', { name?: string }, { ok: boolean }>(
  'users:ensureCurrentProfile',
);
export const usersIsCurrentUserAdmin = makeFunctionReference<'query', Record<string, never>, { isAdmin: boolean }>(
  'users:isCurrentUserAdmin',
);
export const usersSetUserRole = makeFunctionReference<'mutation', { targetUserId: string; role: 'student' | 'admin' }, { ok: boolean }>(
  'users:setUserRole',
);
export const usersAddDocument = makeFunctionReference<'mutation', { url: string }, { ok: boolean }>(
  'users:addDocument',
);
export const usersToggleApprovedSubject = makeFunctionReference<
  'mutation',
  { subjectExternalId: string },
  { ok: boolean; approved: boolean }
>('users:toggleApprovedSubject');

export const subjectsSyncCatalog = makeFunctionReference<'mutation', {
  subjects: Array<{ externalId: string; code: string; name: string; year: number }>;
  cathedras: Array<{ externalId: string; subjectExternalId: string; name: string }>;
  commissions: Array<{
    externalId: string;
    subjectExternalId: string;
    cathedraExternalId: string;
    number: number;
    professor: string;
    seatsTotal: number;
    seatsAvailable: number;
    schedules: Array<{ day: string; start: string; end: string }>;
  }>;
}, { ok: boolean }>('subjects:syncCatalog');
export const subjectsSeedCatalogFromIngresantes = makeFunctionReference<'mutation', Record<string, never>, { ok: boolean }>(
  'subjects:seedCatalogFromIngresantes',
);
export const subjectsListCatalog = makeFunctionReference<'query', Record<string, never>, {
  subjects: Array<{ id: string; externalId: string; code: string; name: string; year: number }>;
  cathedras: Array<{ id: string; externalId: string; subjectId: string; name: string }>;
  commissions: Array<{
    id: string;
    externalId: string;
    subjectId: string;
    cathedraId: string;
    number: number;
    professor: string;
    schedules: Array<{ day: string; start: string; end: string }>;
    seatsTotal: number;
    seatsAvailable: number;
  }>;
}>('subjects:listCatalog');

export const subjectsListEnrollmentsByUser = makeFunctionReference<'query', { userId: string }, Array<{
  enrollmentId: string;
  materiaId: string;
  catedraId: string;
  comisionId: string;
}>>('subjects:listEnrollmentsByUser');
export const subjectsGetCatalogIdsByExternal = makeFunctionReference<'query', {
  subjectExternalId: string;
  commissionExternalIds: string[];
}, {
  subjectId: string | null;
  commissions: Array<{ externalId: string; id: string }>;
}>('subjects:getCatalogIdsByExternal');

export const subjectsAddEnrollmentByExternal = makeFunctionReference<'mutation', {
  subjectExternalId: string;
  cathedraExternalId: string;
  commissionExternalId: string;
}, string>('subjects:addEnrollmentByExternal');

export const subjectsRemoveEnrollmentByExternal = makeFunctionReference<'mutation', {
  subjectExternalId: string;
}, void>('subjects:removeEnrollmentByExternal');

export const requestsListVisibleByUser = makeFunctionReference<'query', { userId: string; limit?: number }, Array<any>>(
  'requests:listVisibleByUser',
);
export const requestsCreate = makeFunctionReference<'mutation', {
  subjectId: string;
  commissionOriginId: string;
  destinations: Array<{ commissionId: string; priority: number }>;
}, string>('requests:createRequest');
export const requestsCancel = makeFunctionReference<'mutation', { requestId: string }, void>(
  'requests:cancelRequest',
);
export const requestsFinalize = makeFunctionReference<'mutation', { requestId: string }, void>(
  'requests:finalizeRequest',
);
export const requestsComplete = makeFunctionReference<'mutation', { requestId: string }, void>(
  'requests:completeExchange',
);
export const requestsEdit = makeFunctionReference<'mutation', {
  requestId: string;
  destinations: Array<{ commissionId: string; priority: number }>;
}, string>('requests:editRequest');
export const requestsGetDashboardStats = makeFunctionReference<'query', Record<string, never>, {
  active: number;
  completed: number;
  pendingConfirm: number;
  unreadMessages: number;
}>('requests:getDashboardStats');
export const requestsCountActiveByCommission = makeFunctionReference<'query', { subjectExternalId: string }, Array<{
  commissionId: string;
  count: number;
}>>('requests:countActiveByCommission');

export const chatGetOrCreateThread = makeFunctionReference<'mutation', {
  requestId: string;
}, string>('chat:getOrCreateThread');
export const chatListMessagesByRequest = makeFunctionReference<'query', { requestId: string; limit?: number }, Array<any>>(
  'chat:listMessagesByRequest',
);
export const chatListMessagesByThread = makeFunctionReference<'query', { threadId: string; limit?: number }, Array<any>>(
  'chat:listMessagesByThread',
);
export const chatGenerateUploadUrl = makeFunctionReference<'mutation', Record<string, never>, string>(
  'chat:generateUploadUrl',
);
export const chatSendMessage = makeFunctionReference<'mutation', {
  threadId: string;
  requestId: string;
  content: string;
  type: 'text' | 'image';
  mediaUrl?: string;
  mediaStorageId?: string;
}, string>('chat:sendMessage');
export const chatMarkRequestMessagesAsRead = makeFunctionReference<'mutation', {
  requestId: string;
}, { ok: boolean; updated: number }>('chat:markRequestMessagesAsRead');
export const chatMarkThreadMessagesAsRead = makeFunctionReference<'mutation', {
  threadId: string;
}, { ok: boolean; updated: number }>('chat:markThreadMessagesAsRead');
export const chatBackfillPairThreads = makeFunctionReference<'mutation', Record<string, never>, {
  ok: boolean;
  mergedThreads: number;
  movedMessages: number;
  processedPairs: number;
}>('chat:backfillPairThreads');

export const notificationsListByUser = makeFunctionReference<'query', { paginationOpts: any }, any>(
  'notifications:listByUser',
);
export const notificationsCreate = makeFunctionReference<'mutation', {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  source?: 'auth' | 'requests' | 'chat' | 'ranking' | 'system';
}, string>('notifications:createNotification');
export const notificationsMarkRead = makeFunctionReference<'mutation', { notificationId: string }, void>(
  'notifications:markRead',
);
export const notificationsClearByUser = makeFunctionReference<'mutation', Record<string, never>, void>(
  'notifications:clearByUser',
);

export const rankingListProfessors = makeFunctionReference<'query', Record<string, never>, Array<any>>(
  'ranking:listProfessors',
);
export const rankingListProfessorsWithStats = makeFunctionReference<'query', Record<string, never>, Array<any>>(
  'ranking:listProfessorsWithStats',
);
export const rankingEnsureProfessors = makeFunctionReference<'mutation', {
  professors: Array<{
    name: string;
    roles: string[];
    subjectExternalIds: string[];
    cathedraExternalIds: string[];
  }>;
}, { ok: boolean }>('ranking:ensureProfessors');
export const rankingEnsureProfessorsFromCatalog = makeFunctionReference<'mutation', Record<string, never>, { ok: boolean; count: number }>(
  'ranking:ensureProfessorsFromCatalog',
);
export const rankingGetLeaderboard = makeFunctionReference<'query', {
  contextType: 'general' | 'subject' | 'cathedra';
  contextId: string;
  limit?: number;
}, Array<any>>('ranking:getLeaderboard');

export const adminGetDashboardOverview = makeFunctionReference<'query', Record<string, never>, {
  jobs: { total: number; failed: number; queued: number; running: number };
  recentLogs: Array<any>;
}>('admin:getDashboardOverview');
export const adminGetReleaseReadiness = makeFunctionReference<'query', Record<string, never>, {
  checks: Array<{ id: string; label: string; ok: boolean; detail: string }>;
  recentErrors: Array<any>;
}>('admin:getReleaseReadiness');
export const adminListRecentRequestEvents = makeFunctionReference<'query', { limit?: number }, Array<any>>(
  'admin:listRecentRequestEvents',
);
export const adminListOperationalLogs = makeFunctionReference<'query', {
  domain?: string;
  level?: 'info' | 'warning' | 'error';
  limit?: number;
}, Array<any>>('admin:listOperationalLogs');
export const adminListSupportReports = makeFunctionReference<'query', {
  limit?: number;
}, Array<any>>('admin:listSupportReports');
export const adminResetRanking = makeFunctionReference<'mutation', Record<string, never>, { ok: boolean; deletedSnapshots: number }>(
  'admin:resetRanking',
);
export const adminSeedCatalog = makeFunctionReference<'action', Record<string, never>, { ok: boolean }>('admin:seedCatalog');
export const adminRecomputeMatchingBySubject = makeFunctionReference<'action', { subjectId: string }, { ok: boolean }>(
  'admin:recomputeMatchingBySubject',
);
export const adminSyncProfessorsFromCatalog = makeFunctionReference<'action', Record<string, never>, {
  ok: boolean;
  count: number;
}>('admin:syncProfessorsFromCatalog');

export const resourcesListBySubject = makeFunctionReference<'query', {
  subjectExternalId: string;
  category?: 'biblio' | 'apuntes' | 'resumenes';
}, Array<any>>('resources:listBySubject');
export const resourcesCreate = makeFunctionReference<'mutation', {
  subjectExternalId: string;
  category: 'biblio' | 'apuntes' | 'resumenes';
  title: string;
  author?: string;
  type: 'pdf' | 'link' | 'video';
  url: string;
  size?: string;
}, string>('resources:createResource');
export const resourcesDelete = makeFunctionReference<'mutation', { resourceId: string }, { ok: boolean }>('resources:deleteResource');
export const rankingCastVote = makeFunctionReference<'mutation', {
  winnerProfessorId: string;
  loserProfessorId: string;
  contextType: 'general' | 'subject' | 'cathedra';
  contextId: string;
}, { ok: boolean }>('ranking:castVote');

export const supportCreateReport = makeFunctionReference<'mutation', {
  category: 'bug' | 'abuse' | 'support';
  message: string;
}, { ok: boolean; reportId: string }>('support:createReport');
export const supportListMine = makeFunctionReference<'query', Record<string, never>, Array<any>>('support:listMine');

export const reviewsCreate = makeFunctionReference<'mutation', {
  requestId: string;
  targetUserId: string;
  rating: number;
  comment: string;
}, string>('reviews:createReview');
export const reviewsListByTarget = makeFunctionReference<'query', {
  targetUserId: string;
}, Array<{
  _id: string;
  reviewerUserId: string;
  reviewerName: string;
  targetUserId: string;
  requestId: string;
  rating: number;
  comment: string;
  createdAt: number;
}>>('reviews:listByTarget');
export const reviewsListByReviewer = makeFunctionReference<'query', Record<string, never>, Array<{ requestId: string; targetUserId: string; createdAt: number }>>('reviews:listByReviewer');