import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Hardware-backed secure storage and local preferences service.
class SecureStorageService {
  final FlutterSecureStorage _secureStorage;
  final SharedPreferences? prefs;

  static const String _keyAuthToken = 'mk_auth_token';
  static const String _keyRefreshToken = 'mk_refresh_token';
  static const String _keySavedPhone = 'mk_saved_phone';
  static const String _keyBiometricsEnabled = 'mk_biometrics_enabled';
  static const String _keyThemeMode = 'mk_theme_mode';

  SecureStorageService({
    FlutterSecureStorage? secureStorage,
    this.prefs,
  }) : _secureStorage = secureStorage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
            );

  // Authentication Token
  Future<void> saveToken(String token) async {
    await _secureStorage.write(key: _keyAuthToken, value: token);
  }

  Future<String?> getToken() async {
    return await _secureStorage.read(key: _keyAuthToken);
  }

  Future<void> deleteToken() async {
    await _secureStorage.delete(key: _keyAuthToken);
  }

  // Refresh Token
  Future<void> saveRefreshToken(String token) async {
    await _secureStorage.write(key: _keyRefreshToken, value: token);
  }

  Future<String?> getRefreshToken() async {
    return await _secureStorage.read(key: _keyRefreshToken);
  }

  // Saved Phone for Fast Login & Biometrics
  Future<void> savePhone(String phone) async {
    await _secureStorage.write(key: _keySavedPhone, value: phone);
  }

  Future<String?> getPhone() async {
    return await _secureStorage.read(key: _keySavedPhone);
  }

  // Biometrics Enrollment Flag
  Future<void> setBiometricsEnabled(bool enabled) async {
    final localPrefs = prefs ?? await SharedPreferences.getInstance();
    await localPrefs.setBool(_keyBiometricsEnabled, enabled);
  }

  Future<bool> isBiometricsEnabled() async {
    final localPrefs = prefs ?? await SharedPreferences.getInstance();
    return localPrefs.getBool(_keyBiometricsEnabled) ?? false;
  }

  // Theme Mode (light, dark, system)
  Future<void> saveThemeMode(String mode) async {
    final localPrefs = prefs ?? await SharedPreferences.getInstance();
    await localPrefs.setString(_keyThemeMode, mode);
  }

  Future<String?> getThemeMode() async {
    final localPrefs = prefs ?? await SharedPreferences.getInstance();
    return localPrefs.getString(_keyThemeMode);
  }

  // Clear Session Data
  Future<void> clearSession() async {
    await _secureStorage.delete(key: _keyAuthToken);
    await _secureStorage.delete(key: _keyRefreshToken);
  }
}
