package io.github.fanqin314.wordcards;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.util.Locale;

/**
 * 极简 WebView 壳：直接加载 GitHub Pages 上的手机版页面。
 * 站内跳转留在应用里，站外链交给系统浏览器。
 *
 * 安卓 WebView 本身不实现 speechSynthesis，所以这里用系统 TTS 把它补上：
 * 页面里的 speechSynthesis 调用会被注入的 shim 转给原生 TextToSpeech，
 * 这样无论将来有多少单词，都不需要为每个词单独准备音频文件。
 */
public class MainActivity extends Activity {

    private static final String START_URL = "https://fanqin314.github.io/word-memorization/mobile/";
    private static final String SITE_HOST = "fanqin314.github.io";

    /** 给页面补一个 speechSynthesis：优先用系统 TTS，不存在时才创建。 */
    private static final String TTS_SHIM = """
            (function () {
              if (!window.AndroidTTS) return;
              if (window.speechSynthesis && typeof window.speechSynthesis.speak === 'function') return;
              var active = null;
              function Utterance(text) {
                this.text = String(text == null ? '' : text);
                this.lang = 'en-US';
                this.rate = 1;
                this.pitch = 1;
                this.volume = 1;
                this.onstart = null;
                this.onend = null;
                this.onerror = null;
              }
              window.SpeechSynthesisUtterance = window.SpeechSynthesisUtterance || Utterance;
              window.__ttsDone = function () {
                var u = active;
                active = null;
                if (!u) return;
                try { if (u.onend) u.onend({}); } catch (e) {}
              };
              window.speechSynthesis = {
                speaking: false,
                pending: false,
                paused: false,
                onvoiceschanged: null,
                speak: function (u) {
                  if (!u || !u.text) return;
                  try {
                    if (window.AndroidTTS && !window.AndroidTTS.isReady()) {
                      if (u.onerror) u.onerror({});
                      return;
                    }
                  } catch (e) {}
                  active = u;
                  try { if (u.onstart) u.onstart({}); } catch (e) {}
                  try {
                    window.AndroidTTS.speak(u.text, u.lang || 'en-US', Number(u.rate) || 1);
                  } catch (e) {
                    active = null;
                    try { if (u.onerror) u.onerror({}); } catch (e2) {}
                  }
                },
                cancel: function () {
                  active = null;
                  try { window.AndroidTTS.stop(); } catch (e) {}
                },
                pause: function () {},
                resume: function () {},
                getVoices: function () {
                  return [{ name: 'Android TTS', lang: 'en-US', voiceURI: 'android', localService: true, 'default': true }];
                }
              };
            })();
            """;

    private WebView web;
    private TextToSpeech tts;
    private volatile boolean ttsReady = false;
    private final Handler main = new Handler();

    private final class TtsBridge {
        @JavascriptInterface
        public boolean isReady() {
            return ttsReady;
        }

        @JavascriptInterface
        public void speak(final String text, final String lang, final float rate) {
            if (text == null || text.isEmpty()) return;
            main.post(() -> {
                if (!ttsReady || tts == null) return;
                try {
                    tts.stop();
                    tts.setSpeechRate(rate > 0 ? rate : 1f);
                    Bundle params = new Bundle();
                    tts.speak(text, TextToSpeech.QUEUE_FLUSH, params,
                            "wc-" + System.currentTimeMillis());
                } catch (Exception ignored) {
                }
            });
        }

        @JavascriptInterface
        public void stop() {
            main.post(() -> {
                if (tts != null) {
                    try {
                        tts.stop();
                    } catch (Exception ignored) {
                    }
                }
            });
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);

        initTts();

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#E7E9E7"));

        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        /* 关键：否则音效、发音、朗读在部分系统上必须二次点击才会出声 */
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        web.addJavascriptInterface(new TtsBridge(), "AndroidTTS");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if (url == null) return false;
                if (SITE_HOST.equals(url.getHost())) return false;
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, url));
                } catch (Exception ignored) {
                    /* 没有可处理的应用时留在原地即可 */
                }
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                view.evaluateJavascript(TTS_SHIM, null);
            }
        });
        web.setWebChromeClient(new WebChromeClient());

        setContentView(web);

        if (state != null) {
            web.restoreState(state);
        } else {
            web.loadUrl(START_URL);
        }
    }

    private void initTts() {
        tts = new TextToSpeech(getApplicationContext(), status -> {
            if (status != TextToSpeech.SUCCESS || tts == null) return;
            int lang = tts.setLanguage(Locale.US);
            if (lang == TextToSpeech.LANG_MISSING_DATA
                    || lang == TextToSpeech.LANG_NOT_SUPPORTED) {
                lang = tts.setLanguage(Locale.ENGLISH);
            }
            ttsReady = lang != TextToSpeech.LANG_MISSING_DATA
                    && lang != TextToSpeech.LANG_NOT_SUPPORTED;
            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override
                public void onStart(String utteranceId) {
                }

                @Override
                public void onDone(String utteranceId) {
                    notifyTtsDone();
                }

                @Override
                public void onError(String utteranceId) {
                    notifyTtsDone();
                }
            });
            /* TTS 就绪后通知页面，避免首屏点击时还没准备好 */
            main.post(() -> {
                if (web != null) {
                    web.evaluateJavascript(
                            "window.dispatchEvent(new Event('androidTtsReady'))", null);
                }
            });
        });
    }

    private void notifyTtsDone() {
        main.post(() -> {
            if (web != null) {
                web.evaluateJavascript("window.__ttsDone && window.__ttsDone()", null);
            }
        });
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        if (web != null) web.saveState(out);
    }

    @Override
    protected void onPause() {
        if (web != null) web.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.onResume();
    }

    @Override
    protected void onDestroy() {
        if (tts != null) {
            try {
                tts.stop();
                tts.shutdown();
            } catch (Exception ignored) {
            }
            tts = null;
        }
        if (web != null) {
            web.loadUrl("about:blank");
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (web != null && web.canGoBack()) {
            web.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
