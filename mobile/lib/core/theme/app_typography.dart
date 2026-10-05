import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Production-Grade Apple San Francisco & FinTech Typographic Scale.
@immutable
final class AppTypography {
  const AppTypography._();

  static TextTheme textTheme(bool isDark) {
    final primary = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    final secondary = isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;
    final dim = isDark ? AppColors.darkTextDim : AppColors.lightTextDim;

    return TextTheme(
      // Apple Large Title (34pt)
      displayLarge: TextStyle(
        fontSize: 34,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.5,
        height: 1.20,
        color: primary,
      ),
      // Apple Title 1 (28pt)
      displayMedium: TextStyle(
        fontSize: 28,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.4,
        height: 1.22,
        color: primary,
      ),
      // Apple Title 2 (22pt)
      displaySmall: TextStyle(
        fontSize: 22,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.3,
        height: 1.25,
        color: primary,
      ),
      // Apple Title 3 (20pt)
      headlineMedium: TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.2,
        height: 1.28,
        color: primary,
      ),
      // Apple Headline (17pt Semi-bold)
      headlineSmall: TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.4,
        height: 1.30,
        color: primary,
      ),
      // Apple Subhead (15pt Semi-bold)
      titleMedium: TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.2,
        height: 1.33,
        color: primary,
      ),
      // Apple Body (17pt Regular)
      bodyLarge: TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.w400,
        letterSpacing: -0.4,
        height: 1.35,
        color: primary,
      ),
      // Apple Callout (15pt Regular)
      bodyMedium: TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w400,
        letterSpacing: -0.2,
        height: 1.35,
        color: secondary,
      ),
      // Apple Footnote (13pt Regular)
      bodySmall: TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w400,
        letterSpacing: -0.1,
        height: 1.35,
        color: secondary,
      ),
      // Apple Button Label (16pt Semi-bold)
      labelLarge: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.2,
        height: 1.25,
      ),
      // Apple Caption 1 (12pt Medium)
      labelMedium: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.0,
        height: 1.30,
        color: dim,
      ),
      // Apple Caption 2 (11pt Bold)
      labelSmall: TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.2,
        height: 1.30,
        color: dim,
      ),
    );
  }
}
