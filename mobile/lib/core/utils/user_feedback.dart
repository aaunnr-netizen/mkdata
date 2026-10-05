/// Complete Dart port of `lib/user-feedback.ts`.
/// Converts technical API errors and statuses into polished, friendly user messages.
abstract final class UserFeedback {
  static const List<String> technicalPatterns = [
    'api response',
    'api error',
    'api request',
    'api c',
    'api a',
    'api b',
    'api d',
    'failed with',
    'status code',
    'status 4',
    'status 5',
    'status:',
    'axios',
    'econn',
    'timeout',
    'timed out',
    'econnaborted',
    'econnreset',
    'billstack',
    'alrahuz',
    'saiful',
    'smeplug',
    'amysub',
    'delivery error',
    'internal server error',
    'server error',
    'bad gateway',
    'gateway timeout',
    'prisma',
    'syntaxerror',
    'unexpected token',
    'json parse',
    'request failed',
    'unhandled',
    'nullpointer',
    'exception',
    'undefined',
  ];

  static String getFriendlyMessage(
    String? input, {
    String fallback = 'Something went wrong. Please try again in a moment.',
  }) {
    final message = (input ?? '').trim();
    final normalized = message.toLowerCase();

    final cleanFallback = fallback.startsWith('Ahh, sorry')
        ? fallback
        : 'Ahh, sorry, ${fallback[0].toLowerCase()}${fallback.substring(1)}';

    if (message.isEmpty) return cleanFallback;

    // Credential & Auth Errors
    if (normalized.contains('invalid credentials') ||
        normalized.contains('user not found') ||
        normalized.contains('account not found')) {
      return 'Ahh, sorry, that phone number or PIN does not look right. Please check and try again.';
    }
    if (normalized.contains('session mismatch') ||
        normalized.contains('unauthorized') ||
        normalized.contains('invalid session')) {
      return 'Ahh, sorry, your session has expired. Please sign in again.';
    }

    // PIN Errors
    if (normalized.contains('invalid pin') ||
        normalized.contains('incorrect pin') ||
        normalized.contains('current pin is incorrect') ||
        normalized.contains('pin is incorrect')) {
      return 'Ahh, sorry, that PIN does not look right. Please check it and try again.';
    }
    if (normalized.contains('pin not set')) {
      return 'Ahh, sorry, your transaction PIN is not ready yet. Please contact support if this continues.';
    }
    if (normalized.contains('pin entries do not match') ||
        normalized.contains('pin mismatch')) {
      return 'Ahh, sorry, those PIN entries do not match yet.';
    }
    if (normalized.contains('pin must be 6 digits') ||
        normalized.contains('6-digit pin')) {
      return 'Ahh, sorry, your PIN must be 6 digits.';
    }

    // Balance & Wallet
    if (normalized.contains('insufficient')) {
      return 'Ahh, sorry, your wallet balance is too low for this request right now.';
    }

    // Account Restrictions
    if (normalized.contains('account is banned') ||
        normalized.contains('account suspended') ||
        normalized.contains('deactivated')) {
      return 'Ahh, sorry, this account cannot complete transactions right now. Please contact support.';
    }

    // KYC
    if (normalized.contains('kyc') || normalized.contains('app locked')) {
      return 'Ahh, sorry, your account verification is required before continuing.';
    }

    // Plan Availability
    if (normalized.contains('plan not available') ||
        normalized.contains('out of stock') ||
        normalized.contains('product unavailable') ||
        normalized.contains('product not found') ||
        normalized.contains('plan disabled')) {
      return 'Ahh, sorry, that plan is not available right now. Please choose another one.';
    }

    // Duplicate Transactions
    if (normalized.contains('duplicate transaction') ||
        normalized.contains('already processing') ||
        normalized.contains('similar request')) {
      return 'Ahh, sorry, a similar request was noticed. Please confirm before continuing.';
    }

    // Rate Limiting
    if (normalized.contains('rate limit') || normalized.contains('too many requests')) {
      return 'Ahh, sorry, please wait a moment before trying again.';
    }

    // Technical Provider & Server Patterns
    if (technicalPatterns.any((pattern) => normalized.contains(pattern))) {
      return 'Ahh, sorry, we could not complete that right now. Please try again in a moment.';
    }

    // Purchase Failures
    if (normalized.contains('purchase failed') || normalized.contains('unable to')) {
      return 'Ahh, sorry, we could not complete that right now. Please try again in a moment.';
    }

    // Connection & Network
    if (normalized.contains('network') || normalized.contains('connection')) {
      return 'Ahh, sorry, the connection is unstable right now. Please try again shortly.';
    }

    return message.startsWith('Ahh, sorry')
        ? message
        : 'Ahh, sorry, ${message[0].toLowerCase()}${message.substring(1)}';
  }
}
