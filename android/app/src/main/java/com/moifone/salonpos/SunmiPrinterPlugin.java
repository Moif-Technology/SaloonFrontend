package com.moifone.salonpos;

import android.content.Context;
import android.graphics.Bitmap;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

@CapacitorPlugin(
    name = "SunmiPrinter",
    permissions = { @Permission(strings = { "com.sunmi.permission.MCS" }, alias = "SUNMI_MCS") }
)
public class SunmiPrinterPlugin extends Plugin {

    private static final String TAG = "SunmiPrinterPlugin";

    @Override
    public void load() {
        super.load();
        Log.i(TAG, "✓ SunmiPrinter plugin loaded");
    }

    @org.jetbrains.annotations.NotNull
    public void printHtml(@org.jetbrains.annotations.NotNull PluginCall call) {
        String html = call.getString("html");
        Integer width = call.getInt("width", 576);

        if (html == null || html.isEmpty()) {
            Log.e(TAG, "HTML is empty");
            call.reject("HTML content required");
            return;
        }

        try {
            Log.i(TAG, "printHtml() called - " + html.length() + " chars");

            // Convert HTML to bitmap
            Bitmap bitmap = htmlToBitmap(html, width);
            if (bitmap == null) {
                Log.e(TAG, "Failed to convert HTML to bitmap");
                call.reject("Failed to render HTML");
                return;
            }

            Log.i(TAG, "✓ Bitmap created: " + bitmap.getWidth() + "x" + bitmap.getHeight());
            // TODO: Send bitmap to Sunmi printer service
            call.resolve();

        } catch (Exception e) {
            Log.e(TAG, "printHtml error: " + e.getMessage());
            call.reject("Print error: " + e.getMessage());
        }
    }

    @org.jetbrains.annotations.NotNull
    public void getPrinterStatus(@org.jetbrains.annotations.NotNull PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("connected", true);
        call.resolve(ret);
    }

    private Bitmap htmlToBitmap(String html, int width) {
        try {
            WebView webView = new WebView(getContext());
            webView.setWebViewClient(new WebViewClient());
            webView.loadData(html, "text/html; charset=UTF-8", null);

            // Wait for rendering
            Thread.sleep(800);

            webView.measure(
                android.view.View.MeasureSpec.makeMeasureSpec(width, android.view.View.MeasureSpec.EXACTLY),
                android.view.View.MeasureSpec.makeMeasureSpec(0, android.view.View.MeasureSpec.UNSPECIFIED)
            );
            webView.layout(0, 0, webView.getMeasuredWidth(), webView.getMeasuredHeight());

            Bitmap bitmap = Bitmap.createBitmap(
                webView.getMeasuredWidth(),
                webView.getMeasuredHeight(),
                Bitmap.Config.ARGB_8888
            );

            android.graphics.Canvas canvas = new android.graphics.Canvas(bitmap);
            webView.draw(canvas);

            Log.i(TAG, "HTML → Bitmap OK");
            return bitmap;

        } catch (Exception e) {
            Log.e(TAG, "htmlToBitmap failed: " + e.getMessage());
            return null;
        }
    }
}
