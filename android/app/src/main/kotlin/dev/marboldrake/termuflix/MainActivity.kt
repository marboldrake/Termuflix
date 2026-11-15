package dev.marboldrake.termuflix

import android.os.Bundle
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        EngineService.start(this)

        webView = WebView(this)
        setContentView(webView)

        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.allowFileAccess = true
        webView.settings.mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean = false
        }

        lifecycleScope.launch {
            waitForEngine()
            webView.loadUrl("file:///android_asset/web/index.html")
        }
    }

    private suspend fun waitForEngine() {
        withContext(Dispatchers.IO) {
            var attempts = 0
            while (attempts < 50 && !EngineService.isRunning()) {
                delay(100)
                attempts++
            }
            // Poll /health
            attempts = 0
            while (attempts < 50) {
                try {
                    val conn = URL("http://127.0.0.1:${EngineService.PORT}/health").openConnection() as HttpURLConnection
                    conn.connectTimeout = 500
                    conn.readTimeout = 500
                    if (conn.responseCode == 200) return@withContext
                } catch (_: Throwable) { }
                delay(100)
                attempts++
            }
        }
    }

    override fun onDestroy() {
        EngineService.stop()
        super.onDestroy()
    }
}