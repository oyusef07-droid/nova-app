package com.nova.downloader;

import android.app.DownloadManager;
import android.content.Context;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.URLUtil;
import android.webkit.WebView;
import android.widget.RelativeLayout;
import android.widget.Toast;
import android.widget.VideoView;
import android.graphics.Color;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Create a layout to hold the VideoView
        final RelativeLayout layout = new RelativeLayout(this);
        layout.setBackgroundColor(Color.parseColor("#0a0a0a"));
        RelativeLayout.LayoutParams layoutParams = new RelativeLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        );
        layout.setLayoutParams(layoutParams);

        // Create VideoView
        final VideoView videoView = new VideoView(this);
        RelativeLayout.LayoutParams videoParams = new RelativeLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        );
        // Center the video in the screen
        videoParams.addRule(RelativeLayout.CENTER_IN_PARENT, RelativeLayout.TRUE);
        videoView.setLayoutParams(videoParams);

        // Load the video from raw resources
        Uri videoUri = Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.splash);
        videoView.setVideoURI(videoUri);
        
        // Make sure it doesn't show anything behind it before it starts
        videoView.setBackgroundColor(Color.parseColor("#0a0a0a"));

        // When the video is prepared to play, remove the background so the video is visible
        videoView.setOnPreparedListener(new MediaPlayer.OnPreparedListener() {
            @Override
            public void onPrepared(MediaPlayer mp) {
                // Remove background color when video is ready to render its first frame
                videoView.setBackgroundColor(Color.TRANSPARENT);
                // Mute video to prevent loud noises
                mp.setVolume(0f, 0f);
            }
        });

        // Add VideoView to layout
        layout.addView(videoView);

        // Add layout to the root view of the Activity (which holds Capacitor's WebView)
        ((ViewGroup) findViewById(android.R.id.content)).addView(layout);

        // Start playing
        videoView.start();

        // When video finishes, remove the overlay
        videoView.setOnCompletionListener(new MediaPlayer.OnCompletionListener() {
            @Override
            public void onCompletion(MediaPlayer mp) {
                ViewGroup parent = (ViewGroup) layout.getParent();
                if (parent != null) {
                    parent.removeView(layout);
                }
            }
        });

        // Add Native DownloadListener for Capacitor WebView
        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            webView.setDownloadListener(new DownloadListener() {
                @Override
                public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
                    try {
                        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                        request.setMimeType(mimetype);
                        
                        String cookies = CookieManager.getInstance().getCookie(url);
                        if (cookies != null) {
                            request.addRequestHeader("cookie", cookies);
                        }
                        request.addRequestHeader("User-Agent", userAgent);
                        request.setDescription("Downloading file...");
                        
                        String fileName = URLUtil.guessFileName(url, contentDisposition, mimetype);
                        request.setTitle(fileName);
                        
                        // Determine native folder based on file type
                        String destDir = Environment.DIRECTORY_DOWNLOADS;
                        if (mimetype != null) {
                            if (mimetype.startsWith("video/")) {
                                destDir = Environment.DIRECTORY_MOVIES;
                            } else if (mimetype.startsWith("audio/")) {
                                destDir = Environment.DIRECTORY_MUSIC;
                            } else if (mimetype.startsWith("image/")) {
                                destDir = Environment.DIRECTORY_PICTURES;
                            }
                        }
                        
                        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                        request.setDestinationInExternalPublicDir(destDir, fileName);
                        
                        DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                        if (dm != null) {
                            dm.enqueue(request);
                            Toast.makeText(getApplicationContext(), "Started downloading...", Toast.LENGTH_LONG).show();
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                        Toast.makeText(getApplicationContext(), "Failed to start download.", Toast.LENGTH_SHORT).show();
                    }
                }
            });
        }
    }
}
