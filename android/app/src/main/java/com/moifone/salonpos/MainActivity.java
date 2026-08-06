package com.moifone.salonpos;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Enable fullscreen + kiosk mode
    int flags = WindowManager.LayoutParams.FLAG_FULLSCREEN
        | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
        | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD;
    getWindow().setFlags(flags, flags);

    // Immersive fullscreen
    hideSystemUI();
  }

  private void hideSystemUI() {
    View decorView = getWindow().getDecorView();
    int uiOptions = View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
        | View.SYSTEM_UI_FLAG_FULLSCREEN;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
      uiOptions |= View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
    }
    decorView.setSystemUiVisibility(uiOptions);
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    if (hasFocus) {
      hideSystemUI();
    }
  }

  @Override
  public void onResume() {
    super.onResume();
    hideSystemUI();
  }
}

