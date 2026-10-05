import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mkdata_app/core/theme/app_colors.dart';
import 'package:mkdata_app/core/widgets/apple_widgets.dart';

void main() {
  group('Apple Design System Tokens & Widgets', () {
    test('verifies dashboard color tokens', () {
      expect(AppColors.primary, const Color(0xFF008FEF));
      expect(AppColors.primaryDark, const Color(0xFF0060D0));
      expect(AppColors.lightBg, const Color(0xFFF5FAFF));
      expect(AppColors.lightTextPrimary, const Color(0xFF06133A));
      expect(AppColors.success, const Color(0xFF059669));
      expect(AppColors.warning, const Color(0xFFD97706));
      expect(AppColors.error, const Color(0xFFDC2626));
    });

    testWidgets('AppleCard renders with squircle border radius and child', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: AppleCard(
              child: Text('Card Content'),
            ),
          ),
        ),
      );

      expect(find.text('Card Content'), findsOneWidget);
      final containerFinder = find.byType(Container).first;
      final container = tester.widget<Container>(containerFinder);
      final decoration = container.decoration as BoxDecoration;
      expect(decoration.borderRadius, BorderRadius.circular(18));
    });

    testWidgets('AppleButton renders with label and responds to tap', (tester) async {
      bool tapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AppleButton(
              text: 'Tap Me',
              onPressed: () {
                tapped = true;
              },
            ),
          ),
        ),
      );

      expect(find.text('Tap Me'), findsOneWidget);
      await tester.tap(find.text('Tap Me'));
      await tester.pumpAndSettle();

      expect(tapped, isTrue);
    });

    testWidgets('AppleBadge displays text with custom color', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: AppleBadge(
              text: 'Verified',
              color: AppColors.success,
            ),
          ),
        ),
      );

      expect(find.text('Verified'), findsOneWidget);
    });
  });
}
