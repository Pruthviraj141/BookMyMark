package com.mybookmark.app;

import android.content.Intent;
import android.os.Bundle;
import androidx.core.content.pm.ShortcutInfoCompat;
import androidx.core.content.pm.ShortcutManagerCompat;
import androidx.core.graphics.drawable.IconCompat;
import com.getcapacitor.BridgeActivity;
import java.util.Collections;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeBridgePlugin.class);
        super.onCreate(savedInstanceState);
        setupSharingShortcut();
    }

    private void setupSharingShortcut() {
        try {
            Intent shareIntent = new Intent(Intent.ACTION_SEND);
            shareIntent.setClass(this, ShareReceiverActivity.class);
            shareIntent.setType("text/plain");

            ShortcutInfoCompat shortcut = new ShortcutInfoCompat.Builder(this, "direct_share_bookmark")
                .setShortLabel("BookMyMark")
                .setLongLabel("Save to BookMyMark")
                .setIcon(IconCompat.createWithResource(this, R.mipmap.ic_launcher))
                .setIntent(shareIntent)
                .setCategories(Collections.singleton("com.mybookmark.app.category.DIRECT_SHARE_TARGET"))
                .build();

            ShortcutManagerCompat.pushDynamicShortcut(this, shortcut);
        } catch (Exception ignored) {
        }
    }
}
