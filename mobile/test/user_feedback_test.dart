import 'package:flutter_test/flutter_test.dart';
import 'package:mkdata_app/core/utils/user_feedback.dart';

void main() {
  group('UserFeedback friendly message mapping', () {
    test('handles invalid credentials', () {
      final msg = UserFeedback.getFriendlyMessage('Invalid credentials provided');
      expect(msg, contains('phone number or PIN does not look right'));
    });

    test('handles PIN mismatch', () {
      final msg = UserFeedback.getFriendlyMessage('PIN entries do not match');
      expect(msg, contains('PIN entries do not match yet'));
    });

    test('handles low wallet balance', () {
      final msg = UserFeedback.getFriendlyMessage('insufficient wallet balance');
      expect(msg, contains('wallet balance is too low'));
    });

    test('handles technical server error pattern', () {
      final msg = UserFeedback.getFriendlyMessage('AxiosError: ECONNRESET');
      expect(msg, contains('could not complete that right now'));
    });

    test('prepends friendly prefix for regular messages', () {
      final msg = UserFeedback.getFriendlyMessage('Transaction cancelled');
      expect(msg, startsWith('Ahh, sorry'));
    });
  });
}
