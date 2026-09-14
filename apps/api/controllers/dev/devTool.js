// Services
import { logAction } from "#services";

// Utils
import { fail, ok, asyncHandler } from "#utils";

/**
 * Developer alətləri YALNIZ developer roluna açıqdır — burada iyerarxiya
 * (hasRole) deyil, dəqiq rol tələb olunur (bax tests/roleGuards.test.js).
 */
const developerOnly = (handler) =>
  asyncHandler(async (req, res) => {
    if (req.user?.role !== "developer") {
      return fail(res, "Yalnız developer bu əməliyyatı edə bilər", 403);
    }
    return handler(req, res);
  });

/** Əksər import-lar eyni «quru rejim» bayrağını qəbul edir. */
const dryRunOption = (req) => ({ dryRun: Boolean(req.body?.dryRun) });

/**
 * Tipik alət: parametrlər → servis → audit jurnalı → cavab.
 * Hər handler-də eyni try/log/cavab şablonu təkrarlanırdı; fərq yalnız
 * parametrlərdə və mətnlərdədir.
 *
 * @param {object} spec
 * @param {(req) => object} [spec.options] req-dən servis parametrləri
 * @param {(opts) => Promise<object>} spec.run
 * @param {(result, opts) => string|false|null} spec.summary audit sətri; boşdursa jurnala yazılmır (məs. dryRun)
 * @param {(result, opts) => string} spec.message cavab mesajı
 * @param {string} [spec.action] audit əməliyyatının növü
 */
const devTool = ({ options = () => ({}), run, summary, message, action = "settings" }) =>
  developerOnly(async (req, res) => {
    const opts = options(req);
    const result = await run(opts);
    const line = summary(result, opts);
    if (line) {
      await logAction(req, { action, resource: "dev", summary: line });
    }
    ok(res, result, message(result, opts));
  });

export { developerOnly, devTool, dryRunOption };
