package com.moifone.salonpos;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.DashPathEffect;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.RemoteException;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.sunmi.peripheral.printer.InnerPrinterCallback;
import com.sunmi.peripheral.printer.InnerPrinterException;
import com.sunmi.peripheral.printer.InnerPrinterManager;
import com.sunmi.peripheral.printer.SunmiPrinterService;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import woyou.aidlservice.jiuiv5.IWoyouService;

@CapacitorPlugin(name = "SunmiPrinter")
public class SunmiPrinterPlugin extends Plugin {

    private static final String SERVICE_PACKAGE = "woyou.aidlservice.jiuiv5";
    private static final String SERVICE_ACTION = "woyou.aidlservice.jiuiv5.IWoyouService";
    private static final int DEFAULT_BITMAP_WIDTH = 576; // 80mm Sunmi D3 Mini
    private static final int MAX_BITMAP_WIDTH = 576; // 80mm devices
    private static final int BARCODE_CODE128 = 8;
    /** ESC/POS cash drawer kick (pin 2). */
    private static final byte[] DRAWER_KICK = new byte[] { 0x1B, 0x70, 0x00, 0x19, (byte) 0xFA };
    private static final String THERMAL_HTML_CSS =
        "<style>"
            + "html,body{box-sizing:border-box!important;overflow-x:hidden!important;"
            + "scrollbar-width:none!important}"
            + "::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}"
            + "html,body,table,thead,tbody,tr,div,span,td,th,p,b,strong{"
            + "color:#000!important;font-weight:700!important;"
            + "-webkit-font-smoothing:none!important;font-smooth:never!important;"
            + "text-rendering:geometricPrecision!important;-webkit-text-stroke:0.3px #000}"
            + "body,table,div,span,td,th,p,.en,.th-en,.xr-lbl,.xr-val,.xr-row,.lbl,.val,"
            + ".row,.row-left,.row-right,.pair-row,.pair,.title-row,.bi-lbl,.footer{"
            + "font-family:'Courier New',Courier,monospace!important;font-weight:700!important}"
            + ".th-ar,.title-ar,.desc-ar,.bi-lbl .ar,.tax-head-ar,.draft-banner-ar{"
            + "font-family:Tahoma,'Segoe UI',Arial,sans-serif!important;"
            + "font-weight:700!important;-webkit-font-smoothing:none!important}"
            + "</style>";

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final ExecutorService printerExecutor = Executors.newSingleThreadExecutor();

    private WebView activePrintWebView;
    private ViewGroup activePrintContainer;

    private IWoyouService printerService;
    private SunmiPrinterService sunmiPrinterService;
    private boolean binding;
    private PluginCall pendingCall;
    private JSArray pendingCommands;
    private PluginCall pendingHtmlCall;
    private String pendingHtml;
    private int pendingHtmlWidth;

    private final InnerPrinterCallback innerPrinterCallback = new InnerPrinterCallback() {
        @Override
        protected void onConnected(SunmiPrinterService service) {
            sunmiPrinterService = service;
            flushPendingHtml();
        }

        @Override
        protected void onDisconnected() {
            sunmiPrinterService = null;
        }
    };

    private final ServiceConnection serviceConnection = new ServiceConnection() {
        @Override
        public void onServiceConnected(ComponentName name, IBinder service) {
            printerService = IWoyouService.Stub.asInterface(service);
            binding = false;
            PluginCall call = pendingCall;
            JSArray commands = pendingCommands;
            pendingCall = null;
            pendingCommands = null;
            if (call != null && commands != null) {
                executePrint(call, commands);
            }
            flushPendingHtml();
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {
            printerService = null;
            binding = false;
        }
    };

    @Override
    public void load() {
        bindInnerPrinter();
        bindPrinterService();
    }

    private void bindInnerPrinter() {
        try {
            InnerPrinterManager.getInstance().bindService(getContext(), innerPrinterCallback);
        } catch (InnerPrinterException e) {
            android.util.Log.e("SunmiPrinterPlugin", "InnerPrinter bind failed: " + e.getMessage());
        }
    }

    private boolean hasPrinterService() {
        return sunmiPrinterService != null || printerService != null;
    }

    private void flushPendingHtml() {
        PluginCall htmlCall = pendingHtmlCall;
        String html = pendingHtml;
        int htmlWidth = pendingHtmlWidth;
        if (htmlCall == null || html == null || !hasPrinterService()) {
            return;
        }
        pendingHtmlCall = null;
        pendingHtml = null;
        pendingHtmlWidth = 0;
        executePrintHtml(htmlCall, html, htmlWidth);
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        if (hasPrinterService()) {
            resolveAvailability(call, true);
            return;
        }

        bindInnerPrinter();
        boolean started = bindPrinterService();
        resolveAvailability(call, started);
    }

    @PluginMethod
    public void openDrawer(PluginCall call) {
        if (!hasPrinterService()) {
            bindInnerPrinter();
            bindPrinterService();
            mainHandler.postDelayed(() -> {
                if (!hasPrinterService()) {
                    call.reject("Sunmi printer service not connected");
                    return;
                }
                printerExecutor.execute(() -> {
                    try {
                        openDrawerHardware();
                        JSObject ret = new JSObject();
                        ret.put("opened", true);
                        resolveOnMain(call, ret);
                    } catch (Exception e) {
                        rejectOnMain(call, "Drawer open failed: " + e.getMessage());
                    }
                });
            }, 2500);
            return;
        }

        printerExecutor.execute(() -> {
            try {
                openDrawerHardware();
                JSObject ret = new JSObject();
                ret.put("opened", true);
                resolveOnMain(call, ret);
            } catch (Exception e) {
                rejectOnMain(call, "Drawer open failed: " + e.getMessage());
            }
        });
    }

    private void openDrawerHardware() throws Exception {
        if (printerService != null) {
            printerService.sendRAWData(DRAWER_KICK, null);
            return;
        }
        if (sunmiPrinterService != null) {
            sunmiPrinterService.sendRAWData(DRAWER_KICK, null);
            return;
        }
        throw new Exception("Printer service not connected");
    }

    @PluginMethod
    public void print(PluginCall call) {
        JSArray commands = call.getArray("commands");
        if (commands == null || commands.length() == 0) {
            call.reject("No print commands supplied");
            return;
        }

        if (printerService == null) {
            pendingCall = call;
            pendingCommands = commands;
            if (!bindPrinterService()) {
                clearPending(call);
                call.reject("Sunmi printer service not available");
                return;
            }

            mainHandler.postDelayed(() -> {
                if (pendingCall == call) {
                    clearPending(call);
                    call.reject("Sunmi printer service did not connect");
                }
            }, 4000);
            return;
        }

        executePrint(call, commands);
    }

    @PluginMethod
    public void printHtml(PluginCall call) {
        String html = call.getString("html");
        if (html == null || html.trim().isEmpty()) {
            call.reject("No receipt HTML supplied");
            return;
        }

        Integer widthArg = call.getInt("width");
        int width = widthArg != null && widthArg > 0 ? widthArg : DEFAULT_BITMAP_WIDTH;
        width = Math.min(width, MAX_BITMAP_WIDTH);

        if (!hasPrinterService()) {
            pendingHtmlCall = call;
            pendingHtml = html;
            pendingHtmlWidth = width;
            bindInnerPrinter();
            bindPrinterService();
            mainHandler.postDelayed(() -> {
                if (pendingHtmlCall == call) {
                    clearPendingHtml(call);
                    call.reject("Sunmi printer service did not connect");
                }
            }, 5000);
            return;
        }

        executePrintHtml(call, html, width);
    }

    private boolean bindPrinterService() {
        if (printerService != null) return true;
        if (binding) return true;

        Intent intent = new Intent();
        intent.setPackage(SERVICE_PACKAGE);
        intent.setAction(SERVICE_ACTION);

        try {
            binding = getContext().bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE);
            return binding;
        } catch (Exception ignored) {
            binding = false;
            return false;
        }
    }

    private void executePrint(PluginCall call, JSArray commands) {
        printerExecutor.execute(() -> {
            try {
                if (printerService == null) {
                    rejectOnMain(call, "Sunmi printer service not connected");
                    return;
                }

                int state = printerService.updatePrinterState();
                if (isHardPrinterError(state)) {
                    rejectOnMain(call, printerStateMessage(state));
                    return;
                }

                printerService.printerInit(null);
                for (int i = 0; i < commands.length(); i++) {
                    JSONObject command = commands.getJSONObject(i);
                    executeCommand(command);
                }

                JSObject ret = new JSObject();
                ret.put("printed", true);
                ret.put("printerState", state);
                resolveOnMain(call, ret);
            } catch (Exception e) {
                rejectOnMain(call, "Print failed: " + e.getMessage());
            }
        });
    }

    private void executePrintHtml(PluginCall call, String html, int width) {
        mainHandler.post(() -> {
            try {
                android.app.Activity activity = getActivity();
                if (activity == null) {
                    call.reject("Activity not available");
                    return;
                }

                cleanupPrintWebView();

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    WebView.enableSlowWholeDocumentDraw();
                }

                WebView webView = new WebView(activity);
                activePrintWebView = webView;
                webView.setBackgroundColor(Color.WHITE);
                webView.setLayerType(View.LAYER_TYPE_SOFTWARE, null);
                webView.setVerticalScrollBarEnabled(false);
                webView.setHorizontalScrollBarEnabled(false);
                webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
                webView.setScrollBarStyle(View.SCROLLBARS_INSIDE_OVERLAY);

                WebSettings settings = webView.getSettings();
                settings.setJavaScriptEnabled(false);
                settings.setLoadWithOverviewMode(false);
                settings.setUseWideViewPort(true);
                settings.setDefaultTextEncodingName("UTF-8");
                settings.setDomStorageEnabled(true);
                settings.setDefaultFontSize(20);
                settings.setMinimumFontSize(16);
                settings.setMinimumLogicalFontSize(16);

                ViewGroup container = activity.findViewById(android.R.id.content);
                activePrintContainer = container;
                ViewGroup.LayoutParams lp = new ViewGroup.LayoutParams(width, ViewGroup.LayoutParams.WRAP_CONTENT);
                webView.setAlpha(0.01f);
                container.addView(webView, lp);

                webView.setWebViewClient(new WebViewClient() {
                    @Override
                    public void onPageFinished(WebView view, String url) {
                        mainHandler.postDelayed(() -> renderAndPrintHtml(call, view, width), 900);
                    }
                });

                webView.loadDataWithBaseURL("file:///android_asset/", injectThermalCss(html), "text/html", "UTF-8", null);
            } catch (Exception e) {
                cleanupPrintWebView();
                call.reject("Receipt render failed: " + e.getMessage());
            }
        });
    }

    private void cleanupPrintWebView() {
        try {
            if (activePrintWebView != null && activePrintContainer != null) {
                activePrintContainer.removeView(activePrintWebView);
            }
            if (activePrintWebView != null) {
                activePrintWebView.destroy();
            }
        } catch (Exception ignored) {
        } finally {
            activePrintWebView = null;
            activePrintContainer = null;
        }
    }

    private void renderAndPrintHtml(PluginCall call, WebView webView, int width) {
        try {
            int exactWidth = View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY);
            int freeHeight = View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED);
            webView.measure(exactWidth, freeHeight);

            int height = webView.getMeasuredHeight();
            if (height <= 0) {
                height = Math.max(1, (int) (webView.getContentHeight() * webView.getScale()));
            }
            height = Math.max(height, 1);

            webView.layout(0, 0, width, height);

            Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(bitmap);
            canvas.drawColor(Color.WHITE);
            webView.draw(canvas);

            cleanupPrintWebView();

            if (height < 40 || isMostlyBlank(bitmap)) {
                rejectOnMain(call, "Receipt render was blank — retry print");
                bitmap.recycle();
                return;
            }

            printerExecutor.execute(() -> printBitmap(call, bitmap));
        } catch (Exception e) {
            cleanupPrintWebView();
            call.reject("Receipt render failed: " + e.getMessage());
        }
    }

    private boolean isMostlyBlank(Bitmap bitmap) {
        int sampleStep = Math.max(1, bitmap.getWidth() / 8);
        int darkPixels = 0;
        int samples = 0;
        for (int y = 0; y < bitmap.getHeight(); y += sampleStep) {
            for (int x = 0; x < bitmap.getWidth(); x += sampleStep) {
                int pixel = bitmap.getPixel(x, y);
                int gray = (Color.red(pixel) + Color.green(pixel) + Color.blue(pixel)) / 3;
                if (gray < 240) darkPixels++;
                samples++;
            }
        }
        return samples > 0 && darkPixels < Math.max(2, samples / 200);
    }

    private Bitmap prepareBitmapForThermal(Bitmap source) {
        int targetWidth = Math.min(source.getWidth(), MAX_BITMAP_WIDTH);
        Bitmap working = source;
        if (source.getWidth() != targetWidth) {
            int targetHeight = Math.max(1, Math.round(source.getHeight() * ((float) targetWidth / source.getWidth())));
            working = Bitmap.createScaledBitmap(source, targetWidth, targetHeight, false);
            if (working != source) {
                source.recycle();
            }
        }
        Bitmap thermal = binarizeForThermal(working);
        if (thermal != working) {
            working.recycle();
        }
        return thermal;
    }

    private Bitmap binarizeForThermal(Bitmap source) {
        int w = source.getWidth();
        int h = source.getHeight();
        int[] px = new int[w * h];
        source.getPixels(px, 0, w, 0, 0, w, h);

        int[] out = new int[px.length];
        for (int i = 0; i < px.length; i++) {
            int p = px[i];
            int gray = (Color.red(p) + Color.green(p) + Color.blue(p)) / 3;
            out[i] = gray < 188 ? Color.BLACK : Color.WHITE;
        }
        // Kill scrollbar / clip artifacts on both edges.
        for (int y = 0; y < h; y++) {
            int row = y * w;
            out[row] = Color.WHITE;
            if (w > 1) out[row + 1] = Color.WHITE;
            out[row + w - 1] = Color.WHITE;
            if (w > 2) out[row + w - 2] = Color.WHITE;
        }

        Bitmap result = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        result.setPixels(out, 0, w, 0, 0, w, h);
        return result;
    }

    private String injectThermalCss(String html) {
        if (html == null) return "";
        if (html.contains("</head>")) {
            return html.replace("</head>", THERMAL_HTML_CSS + "</head>");
        }
        return THERMAL_HTML_CSS + html;
    }

    private void printBitmap(PluginCall call, Bitmap bitmap) {
        Bitmap printable = prepareBitmapForThermal(bitmap);
        try {
            android.util.Log.i("SunmiPrinterPlugin", "printBitmap " + printable.getWidth() + "x" + printable.getHeight());

            if (printerService != null) {
                int state = printerService.updatePrinterState();
                if (isHardPrinterError(state)) {
                    rejectOnMain(call, printerStateMessage(state));
                    return;
                }

                printerService.printerInit(null);
                printerService.setAlignment(0, null);
                printerService.printBitmap(printable, null);
                printerService.printText("\n", null);
                printerService.lineWrap(3, null);
                try {
                    printerService.sendRAWData(new byte[] { 0x1d, 0x56, 0x42, 0x00 }, null);
                } catch (Exception ignored) {
                    printerService.lineWrap(4, null);
                }

                JSObject ret = new JSObject();
                ret.put("printed", true);
                ret.put("printerState", state);
                ret.put("printer", "woyou");
                resolveOnMain(call, ret);
                return;
            }

            if (sunmiPrinterService != null) {
                sunmiPrinterService.printerInit(null);
                sunmiPrinterService.setAlignment(0, null);
                sunmiPrinterService.printBitmap(printable, null);
                sunmiPrinterService.lineWrap(3, null);
                JSObject ret = new JSObject();
                ret.put("printed", true);
                ret.put("printer", "inner");
                resolveOnMain(call, ret);
                return;
            }

            rejectOnMain(call, "Sunmi printer service not connected");
        } catch (Exception e) {
            rejectOnMain(call, "Print failed: " + e.getMessage());
        } finally {
            try {
                printable.recycle();
            } catch (Exception ignored) {}
        }
    }

    private void executeCommand(JSONObject command) throws JSONException, RemoteException {
        String type = command.optString("type", "text");

        switch (type) {
            case "align":
                printerService.setAlignment(command.optInt("value", 0), null);
                break;
            case "size":
                printerService.setFontSize((float) command.optDouble("value", 22), null);
                break;
            case "text":
                printerService.setAlignment(command.optInt("align", 0), null);
                printerService.printTextWithFont(
                    command.optString("text", "") + "\n",
                    "",
                    (float) command.optDouble("size", 22),
                    null
                );
                break;
            case "plainText":
                printerService.setAlignment(command.optInt("align", 0), null);
                printerService.setFontSize((float) command.optDouble("size", 20), null);
                printerService.printOriginalText(command.optString("text", ""), null);
                break;
            case "receiptTextBitmap":
                printerService.setAlignment(1, null);
                printerService.printBitmap(renderReceiptTextBitmap(
                    command.optString("text", ""),
                    command.optInt("width", DEFAULT_BITMAP_WIDTH),
                    command.optInt("padding", 4),
                    (float) command.optDouble("textSize", 22)
                ), null);
                break;
            case "columns":
                printerService.setFontSize((float) command.optDouble("size", 20), null);
                printerService.printColumnsText(
                    jsonStringArray(command.getJSONArray("texts")),
                    jsonIntArray(command.getJSONArray("widths")),
                    jsonIntArray(command.getJSONArray("aligns")),
                    null
                );
                break;
            case "barcode":
                printerService.setAlignment(1, null);
                printerService.printBarCode(
                    command.optString("text", ""),
                    BARCODE_CODE128,
                    command.optInt("height", 64),
                    command.optInt("width", 2),
                    command.optInt("position", 2),
                    null
                );
                break;
            case "feed":
                printerService.lineWrap(command.optInt("lines", 1), null);
                break;
            case "openDrawer":
                try {
                    openDrawerHardware();
                } catch (Exception e) {
                    throw new RemoteException("Drawer open failed: " + e.getMessage());
                }
                break;
            case "cut":
                try {
                    printerService.lineWrap(3, null);
                    printerService.sendRAWData(new byte[] { 0x1d, 0x56, 0x42, 0x00 }, null);
                } catch (Exception ignored) {
                    printerService.lineWrap(4, null);
                }
                break;
            default:
                printerService.printText(command.optString("text", "") + "\n", null);
                break;
        }
    }

    private Bitmap renderReceiptTextBitmap(String text, int width, int padding, float requestedTextSize) {
        String[] lines = text == null ? new String[] { "" } : text.split("\\n", -1);

        Paint paint = new Paint();
        paint.setColor(Color.BLACK);
        paint.setTypeface(Typeface.create(Typeface.MONOSPACE, Typeface.BOLD));
        paint.setFakeBoldText(true);
        paint.setTextSize(requestedTextSize);
        paint.setAntiAlias(false);
        paint.setFilterBitmap(false);
        paint.setSubpixelText(false);

        int printableWidth = Math.max(1, width - (padding * 2));
        String widestLine = "";
        for (String line : lines) {
            if (line == null) continue;
            if (isRuleLine(line)) continue;
            if (line.length() > widestLine.length()) widestLine = line;
        }
        if (widestLine.isEmpty()) widestLine = " ";

        while (paint.measureText(widestLine) > printableWidth && paint.getTextSize() > 18f) {
            paint.setTextSize(paint.getTextSize() - 1f);
        }
        while (paint.measureText(widestLine) < printableWidth * 0.94f && paint.getTextSize() < 40f) {
            paint.setTextSize(paint.getTextSize() + 1f);
        }

        Paint.FontMetrics fm = paint.getFontMetrics();
        int lineHeight = Math.max(18, (int) Math.ceil(fm.descent - fm.ascent) + 4);
        int height = Math.max(lineHeight, (lines.length * lineHeight) + (padding * 2));

        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        canvas.drawColor(Color.WHITE);

        float y = padding - fm.ascent;
        for (String line : lines) {
            String safeLine = line == null ? "" : line;
            if (isRuleLine(safeLine)) {
                float ruleY = y + fm.ascent + (lineHeight / 2f);
                Paint rulePaint = new Paint();
                rulePaint.setColor(Color.BLACK);
                rulePaint.setAntiAlias(false);
                rulePaint.setStrokeWidth(safeLine.startsWith("=") ? 5.5f : 4.0f);
                rulePaint.setPathEffect(new DashPathEffect(new float[] { 11f, 7f }, 0));
                canvas.drawLine(0, ruleY, width, ruleY, rulePaint);
            } else {
                drawThermalText(canvas, safeLine, padding, y, paint);
            }
            y += lineHeight;
        }

        Bitmap thermal = binarizeForThermal(bitmap);
        if (thermal != bitmap) {
            bitmap.recycle();
        }
        return thermal;
    }

    private void drawThermalText(Canvas canvas, String text, float x, float y, Paint paint) {
        paint.setFakeBoldText(true);
        canvas.drawText(text, x, y, paint);
    }

    private boolean isRuleLine(String line) {
        if (line == null) return false;
        String trimmed = line.trim();
        if (trimmed.length() < 8) return false;
        return trimmed.matches("[-.=]+");
    }

    private String[] jsonStringArray(org.json.JSONArray array) throws JSONException {
        String[] result = new String[array.length()];
        for (int i = 0; i < array.length(); i++) {
            result[i] = array.optString(i, "");
        }
        return result;
    }

    private int[] jsonIntArray(org.json.JSONArray array) throws JSONException {
        int[] result = new int[array.length()];
        for (int i = 0; i < array.length(); i++) {
            result[i] = array.optInt(i, 0);
        }
        return result;
    }

    private void resolveAvailability(PluginCall call, boolean available) {
        JSObject ret = new JSObject();
        ret.put("available", available);
        call.resolve(ret);
    }

    private void clearPending(PluginCall call) {
        if (pendingCall == call) {
            pendingCall = null;
            pendingCommands = null;
        }
    }

    private void clearPendingHtml(PluginCall call) {
        if (pendingHtmlCall == call) {
            pendingHtmlCall = null;
            pendingHtml = null;
            pendingHtmlWidth = 0;
        }
    }

    private void resolveOnMain(PluginCall call, JSObject ret) {
        mainHandler.post(() -> call.resolve(ret));
    }

    private void rejectOnMain(PluginCall call, String message) {
        mainHandler.post(() -> call.reject(message));
    }

    private boolean isHardPrinterError(int state) {
        return state == 4 || state == 5 || state == 6 || state == 7 || state == 505;
    }

    private String printerStateMessage(int state) {
        switch (state) {
            case 0: return "Printer ready";
            case 1: return "Printer ready";
            case 2: return "Printer preparing";
            case 3: return "Printer communication error";
            case 4: return "Printer out of paper";
            case 5: return "Printer overheated";
            case 6: return "Printer cover open";
            case 7: return "Printer cutter error";
            case 8: return "Printer cutter recovered";
            case 9: return "Printer black mark not found";
            case 505: return "Printer not detected";
            default: return "Printer not ready (" + state + ")";
        }
    }
}
