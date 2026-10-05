/// Centralized API Endpoints registry for MK DATA SUB.
/// Connects directly to the existing Next.js backend routes without changes.
abstract final class ApiEndpoints {
  // Default to user-specified production domain with compile-time environment override
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://mkdatasub.com',
  );

  // Authentication & Session
  static const String login = '/api/auth/login';
  static const String register = '/api/auth/register';
  static const String session = '/api/auth/session';
  static const String logout = '/api/auth/logout';
  static const String forgotPassword = '/api/auth/forgot-password';

  // User & Accounts
  static const String userProfile = '/api/user';
  static const String virtualAccounts = '/api/user/virtual-accounts';
  static const String kycSubmit = '/api/user/kyc';

  // Telecom Services
  static const String dataPlans = '/api/data';
  static const String dataVend = '/api/data';
  static const String airtimeVend = '/api/airtime';

  // Utilities & Bills
  static const String electricityProviders = '/api/electricity';
  static const String electricityVerify = '/api/electricity/verify';
  static const String electricityVend = '/api/electricity';
  
  static const String cableProviders = '/api/cable';
  static const String cableVerify = '/api/cable/verify';
  static const String cableVend = '/api/cable';
  
  static const String examProducts = '/api/exam';
  static const String examVend = '/api/exam';

  // Transactions & Ledger
  static const String transactions = '/api/transactions';
  static String transactionDetail(String id) => '/api/transactions/$id';

  // Reseller Agent & Rewards
  static const String agentStatus = '/api/agent';
  static const String agentRequest = '/api/agent/request';
  static const String rewards = '/api/rewards';
  static const String claimReward = '/api/rewards/claim';

  // System & Notices
  static const String notices = '/api/notices';
  static const String settings = '/api/settings';
}
