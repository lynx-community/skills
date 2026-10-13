package org.lynx.connector;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.os.Looper;
import java.lang.reflect.Method;

public final class AppIconRenderer {
  private static final int ICON_SIZE = 192;

  private AppIconRenderer() {}

  public static void main(String[] args) throws Exception {
    if (args.length != 1) {
      throw new IllegalArgumentException("Expected one Android package name");
    }

    Looper.prepareMainLooper();
    Class<?> activityThreadClass = Class.forName("android.app.ActivityThread");
    Object activityThread = activityThreadClass.getDeclaredConstructor().newInstance();
    Class<?> contextImplClass = Class.forName("android.app.ContextImpl");
    Method createSystemContext = contextImplClass.getDeclaredMethod("createSystemContext", activityThreadClass);
    createSystemContext.setAccessible(true);
    Context context = (Context) createSystemContext.invoke(null, activityThread);

    Drawable icon = context.getPackageManager().getApplicationIcon(args[0]);
    Bitmap bitmap = Bitmap.createBitmap(ICON_SIZE, ICON_SIZE, Bitmap.Config.ARGB_8888);
    Canvas canvas = new Canvas(bitmap);
    icon.setBounds(0, 0, ICON_SIZE, ICON_SIZE);
    icon.draw(canvas);

    if (!bitmap.compress(Bitmap.CompressFormat.PNG, 100, System.out)) {
      throw new IllegalStateException("Failed to encode icon as PNG");
    }
    System.out.flush();
  }
}
