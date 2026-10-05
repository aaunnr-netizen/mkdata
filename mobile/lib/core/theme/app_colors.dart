import 'package:flutter/material.dart';

/// Semantic colors mapped 1:1 with the MK DATA `/dashboard` palette.
/// Provides Apple-grade diffuse shadows, hairline borders, and dual-theme tokens.
abstract final class AppColors {
  // Brand Blue
  static const Color primary = Color(0xFF008FEF);
  static const Color primaryDark = Color(0xFF0060D0);
  static const Color primaryLight = Color(0x14008FEF); // ~8% opacity
  static const Color primaryContainer = Color(0xFFEAF4FF);

  // Status & Utility Accents
  static const Color success = Color(0xFF059669);
  static const Color successLight = Color(0xFFECFDF5);
  static const Color successBorder = Color(0xFFA7F3D0);

  static const Color warning = Color(0xFFD97706);
  static const Color warningLight = Color(0xFFFFFBEB);
  static const Color warningBorder = Color(0xFFFDE68A);

  static const Color error = Color(0xFFDC2626);
  static const Color errorLight = Color(0xFFFEF2F2);
  static const Color errorBorder = Color(0xFFFECACA);

  // Telco Official Brand Colors
  static const Color mtnYellow = Color(0xFFFFCC00);
  static const Color mtnBg = Color(0xFFFFF7CC);
  static const Color airtelRed = Color(0xFFFF3333);
  static const Color airtelBg = Color(0xFFFFE2E2);
  static const Color gloGreen = Color(0xFF16A34A);
  static const Color gloBg = Color(0xFFDCFCE7);
  static const Color nineMobileGreen = Color(0xFF00A859);
  static const Color nineMobileBg = Color(0xFFD1FAE5);

  // Light Mode Surfaces & Text (Matches /dashboard)
  static const Color lightBg = Color(0xFFF5FAFF);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightCard = Color(0xFFFFFFFF);
  static const Color lightBorder = Color(0xFFD7E8FF);
  static const Color lightBorderMuted = Color(0xFFEAF2FF);
  static const Color lightTextPrimary = Color(0xFF06133A);
  static const Color lightTextSecondary = Color(0xFF526079);
  static const Color lightTextDim = Color(0xFF8AA0BE);

  // Dark Mode Surfaces & Text
  static const Color darkBg = Color(0xFF060D1F);
  static const Color darkSurface = Color(0xFF0A162E);
  static const Color darkCard = Color(0xFF0E1D3C);
  static const Color darkBorder = Color(0xFF1A3058);
  static const Color darkBorderMuted = Color(0xFF27457A);
  static const Color darkTextPrimary = Color(0xFFF8FBFF);
  static const Color darkTextSecondary = Color(0xFF9DB2CF);
  static const Color darkTextDim = Color(0xFF5B7294);

  // Apple Diffuse Shadows (No harsh Material elevation)
  static List<BoxShadow> get appleAmbientShadow => [
        BoxShadow(
          color: const Color(0xFF008FEF).withAlpha(15), // 6% brand ambient
          blurRadius: 16,
          offset: const Offset(0, 4),
        ),
        BoxShadow(
          color: const Color(0xFF06133A).withAlpha(10), // 4% depth
          blurRadius: 6,
          offset: const Offset(0, 2),
        ),
      ];

  static List<BoxShadow> get appleCardShadow => [
        BoxShadow(
          color: const Color(0xFF101828).withAlpha(10),
          blurRadius: 12,
          offset: const Offset(0, 2),
        ),
      ];

  static List<BoxShadow> get appleDarkShadow => [
        BoxShadow(
          color: Colors.black.withAlpha(115), // 45% shadow in dark mode
          blurRadius: 18,
          offset: const Offset(0, 6),
        ),
      ];
}
