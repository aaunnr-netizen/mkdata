import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'core/network/api_client.dart';
import 'core/network/api_endpoints.dart';
import 'core/theme/app_colors.dart';
import 'core/theme/app_theme.dart';
import 'core/widgets/apple_widgets.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  runApp(const MkDataSubApp());
}

class MkDataSubApp extends StatefulWidget {
  const MkDataSubApp({super.key});

  @override
  State<MkDataSubApp> createState() => _MkDataSubAppState();
}

class _MkDataSubAppState extends State<MkDataSubApp> {
  ThemeMode _themeMode = ThemeMode.light;

  void _toggleTheme() {
    HapticFeedback.selectionClick();
    setState(() {
      _themeMode = _themeMode == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MK DATA SUB',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme(),
      darkTheme: AppTheme.darkTheme(),
      themeMode: _themeMode,
      home: Phase1HarnessScreen(
        onToggleTheme: _toggleTheme,
        currentThemeMode: _themeMode,
      ),
    );
  }
}

class Phase1HarnessScreen extends StatefulWidget {
  final VoidCallback onToggleTheme;
  final ThemeMode currentThemeMode;

  const Phase1HarnessScreen({
    super.key,
    required this.onToggleTheme,
    required this.currentThemeMode,
  });

  @override
  State<Phase1HarnessScreen> createState() => _Phase1HarnessScreenState();
}

class _Phase1HarnessScreenState extends State<Phase1HarnessScreen> {
  final ApiClient _apiClient = ApiClient();
  bool _isTestingApi = false;
  String? _apiResult;
  bool? _apiSuccess;

  Future<void> _testConnection() async {
    setState(() {
      _isTestingApi = true;
      _apiResult = null;
      _apiSuccess = null;
    });

    final stopwatch = Stopwatch()..start();
    try {
      final res = await _apiClient.get(ApiEndpoints.notices);
      stopwatch.stop();
      if (!mounted) return;
      setState(() {
        _isTestingApi = false;
        _apiSuccess = true;
        _apiResult = 'Connected to ${ApiEndpoints.baseUrl} (${res.statusCode} OK in ${stopwatch.elapsedMilliseconds}ms)';
      });
    } catch (e) {
      stopwatch.stop();
      if (!mounted) return;
      setState(() {
        _isTestingApi = false;
        _apiSuccess = false;
        _apiResult = e.toString();
      });
    }
  }

  void _openSampleSheet() {
    AppleBottomSheet.show(
      context: context,
      title: 'Apple Cupertino Sheet',
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'This modal uses iOS drag gestures, frosted background, and native hairline borders for optimal UI/UX.',
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          AppleButton(
            text: 'Dismiss Sheet',
            onPressed: () => Navigator.of(context).pop(),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.asset(
                'assets/icons/app_icon.png',
                width: 28,
                height: 28,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const Icon(
                  CupertinoIcons.bolt_fill,
                  color: AppColors.primary,
                  size: 24,
                ),
              ),
            ),
            const SizedBox(width: 8),
            const Text('MK DATA SUB'),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Toggle Theme',
            icon: Icon(
              isDark ? CupertinoIcons.sun_max_fill : CupertinoIcons.moon_fill,
              color: isDark ? AppColors.warning : AppColors.primary,
            ),
            onPressed: widget.onToggleTheme,
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: ListView(
          physics: const BouncingScrollPhysics(
            parent: AlwaysScrollableScrollPhysics(),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
          children: [
            // App Identity & Package Card
            AppleCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.primaryLight,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          CupertinoIcons.device_phone_portrait,
                          color: AppColors.primary,
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'MK DATA SUB',
                              style: theme.textTheme.headlineSmall,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'com.mkdata.app',
                              style: theme.textTheme.labelMedium?.copyWith(
                                color: AppColors.primary,
                                fontFamily: 'Courier',
                              ),
                            ),
                          ],
                        ),
                      ),
                      AppleBadge(
                        text: 'Phase 1',
                        color: AppColors.primary,
                        icon: CupertinoIcons.checkmark_seal_fill,
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Text(
                    'Native Flutter Foundation & Apple Cupertino Design System (/flutterapp) matching the /dashboard color tokens.',
                    style: theme.textTheme.bodyMedium,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Live Dashboard Style Metrics Card
            AppleCard(
              backgroundColor: isDark ? AppColors.darkCard : AppColors.lightCard,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(
                            CupertinoIcons.money_dollar_circle_fill,
                            size: 16,
                            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'SAMPLE WALLET BALANCE',
                            style: theme.textTheme.labelSmall?.copyWith(
                              letterSpacing: 0.8,
                            ),
                          ),
                        ],
                      ),
                      const AppleBadge(
                        text: 'Agent Tier',
                        color: AppColors.primary,
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '₦48,500.00',
                    style: theme.textTheme.displayMedium?.copyWith(
                      color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Divider(),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Virtual Account (Wema Bank)',
                        style: theme.textTheme.bodySmall,
                      ),
                      Text(
                        '8032918822',
                        style: theme.textTheme.labelLarge?.copyWith(
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Backend Connectivity Verification
            AppleCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(
                        CupertinoIcons.waveform_path,
                        color: AppColors.primary,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Backend Endpoint',
                        style: theme.textTheme.titleMedium,
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    ApiEndpoints.baseUrl,
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 14),
                  AppleButton(
                    text: 'Test API Connection',
                    icon: CupertinoIcons.arrow_2_circlepath,
                    isLoading: _isTestingApi,
                    onPressed: _testConnection,
                  ),
                  if (_apiResult != null) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: _apiSuccess == true
                            ? AppColors.successLight
                            : AppColors.errorLight,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: _apiSuccess == true
                              ? AppColors.successBorder
                              : AppColors.errorBorder,
                          width: 0.75,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            _apiSuccess == true
                                ? CupertinoIcons.check_mark_circled_solid
                                : CupertinoIcons.exclamationmark_circle_fill,
                            color: _apiSuccess == true
                                ? AppColors.success
                                : AppColors.error,
                            size: 18,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _apiResult!,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: _apiSuccess == true
                                    ? AppColors.success
                                    : AppColors.error,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Apple Component Interactive Showcase
            AppleCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Apple Component Gallery',
                    style: theme.textTheme.titleMedium,
                  ),
                  const SizedBox(height: 14),
                  AppleButton(
                    text: 'Secondary Action Button',
                    variant: AppleButtonVariant.secondary,
                    onPressed: () {
                      HapticFeedback.lightImpact();
                    },
                  ),
                  const SizedBox(height: 10),
                  AppleButton(
                    text: 'Open Apple Bottom Sheet',
                    variant: AppleButtonVariant.ghost,
                    icon: CupertinoIcons.square_stack_3d_down_right,
                    onPressed: _openSampleSheet,
                  ),
                  const SizedBox(height: 14),
                  const Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      AppleBadge(text: 'Success', color: AppColors.success),
                      AppleBadge(text: 'Processing', color: AppColors.warning),
                      AppleBadge(text: 'Failed', color: AppColors.error),
                      AppleBadge(text: 'MTN 5G', color: AppColors.mtnYellow, textColor: Color(0xFF7A6000)),
                      AppleBadge(text: 'Airtel', color: AppColors.airtelRed),
                      AppleBadge(text: 'Glo', color: AppColors.gloGreen),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
