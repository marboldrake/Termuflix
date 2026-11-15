package dev.marboldrake.termuflix

import android.graphics.Color
import android.os.Bundle
import android.util.Log
import android.webkit.WebResourceError
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
    private val tag = "TermuflixUI"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.decorView.setBackgroundColor(Color.parseColor("#07080a"))
        Log.i(tag, "onCreate: starting engine")
        EngineService.start(this)

        webView = WebView(this)
        webView.setBackgroundColor(Color.parseColor("#07080a"))
        setContentView(webView)

        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.allowFileAccess = true
        webView.settings.allowContentAccess = true
        webView.settings.mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

        webView.webViewClient = object : WebViewClient() {
            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                Log.e(tag, "WebView error: ${error?.description} for ${request?.url}")
            }
            override fun onPageFinished(view: WebView?, url: String?) {
                Log.i(tag, "Page finished: $url")
            }
        }

        lifecycleScope.launch {
            waitForEngine()
            Log.i(tag, "Loading web bundle")
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
            attempts = 0
            while (attempts < 50) {
                try {
                    val conn = URL("http://127.0.0.1:${EngineService.PORT}/health").openConnection() as HttpURLConnection
                    conn.connectTimeout = 500
                    conn.readTimeout = 500
                    if (conn.responseCode == 200) {
                        Log.i(tag, "Engine online")
                        return@withContext
                    }
                } catch (e: Throwable) {
                    Log.d(tag, "Engine not ready: ${e.message}")
                }
                delay(100)
                attempts++
            }
            Log.w(tag, "Engine not reachable after wait; loading UI anyway")
        }
    }

    override fun onDestroy() {
        EngineService.stop()
        super.onDestroy()
    }
}