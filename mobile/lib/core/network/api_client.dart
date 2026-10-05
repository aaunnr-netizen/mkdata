import 'package:dio/dio.dart';
import '../storage/secure_storage_service.dart';
import '../utils/user_feedback.dart';
import 'api_endpoints.dart';

/// Exception wrapper delivering friendly, user-facing error messages.
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic rawData;

  const ApiException({
    required this.message,
    this.statusCode,
    this.rawData,
  });

  @override
  String toString() => message;
}

/// Production Dio HTTP client with JWT interceptor and session management.
class ApiClient {
  final Dio _dio;
  final SecureStorageService _storage;

  ApiClient({
    Dio? dio,
    SecureStorageService? storage,
    String? baseUrl,
  })  : _storage = storage ?? SecureStorageService(),
        _dio = dio ??
            Dio(
              BaseOptions(
                baseUrl: baseUrl ?? ApiEndpoints.baseUrl,
                connectTimeout: const Duration(seconds: 15),
                receiveTimeout: const Duration(seconds: 15),
                sendTimeout: const Duration(seconds: 15),
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                },
              ),
            ) {
    _setupInterceptors();
  }

  void _setupInterceptors() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          if (error.response?.statusCode == 401) {
            // Session expired: clear local token
            await _storage.clearSession();
          }
          return handler.next(error);
        },
      ),
    );
  }

  ApiException _handleError(DioException error) {
    final status = error.response?.statusCode;
    final data = error.response?.data;

    String? serverMsg;
    if (data is Map<String, dynamic>) {
      serverMsg = data['error']?.toString() ??
          data['message']?.toString() ??
          data['detail']?.toString();
    } else if (data is String && data.isNotEmpty) {
      serverMsg = data;
    }

    final friendly = UserFeedback.getFriendlyMessage(
      serverMsg ?? error.message,
      fallback: status == 404
          ? 'Resource not found. Please verify your details.'
          : status == 500
              ? 'Our servers are experiencing a brief delay. Please try again shortly.'
              : 'Unable to connect right now. Please check your internet connection.',
    );

    return ApiException(
      message: friendly,
      statusCode: status,
      rawData: data,
    );
  }

  // HTTP GET
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.get<T>(
        path,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // HTTP POST
  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.post<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // HTTP PUT
  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.put<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // HTTP DELETE
  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.delete<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }
}
