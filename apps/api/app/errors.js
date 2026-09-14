/**
 * Configure error handlers
 */
export const setupErrorHandlers = (app) => {
  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: "Endpoint not found",
    });
  });

  // Central error handler
  app.use((err, req, res, _next) => {
    console.error("Server error:", err.message || err);

    // Mongoose validation error
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(err.errors).map((e) => e.message),
      });
    }

    // Yanlış formatlı ObjectId (məs. /api/admin/courses/abc) — əvvəl 500
    // «Server error» qaytarırdı və loglarda xəta kimi görünürdü.
    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: `Yanlış dəyər: «${err.path}»`,
      });
    }

    // Mongoose duplicate key
    // Hansı sahə və hansı dəyər — mesaja YAZILIR. Əvvəl yalnız «This record
    // already exists» qaytarılırdı: seed 409 verəndə nə modelin, nə sahənin,
    // nə də dəyərin nə olduğu bilinmirdi və səbəbi tapmaq üçün kodu əl ilə
    // gəzmək lazım gəlirdi.
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
      const value = field ? err.keyValue?.[field] : undefined;
      return res.status(409).json({
        success: false,
        message: field
          ? `Təkrarlanan dəyər: «${field}» = ${JSON.stringify(value)} artıq mövcuddur`
          : "This record already exists",
        field,
      });
    }

    // JWT errors
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired",
      });
    }

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: statusCode === 500 ? "Server error" : err.message,
    });
  });
};
