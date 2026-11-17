package dev.marboldrake.termuflix

import android.graphics.Color
import android.os.Bundle
import android.util.Log
import android.view.ViewGroup
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

        webView = WebView(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#07080a"))
        }
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

        webView.loadDataWithBaseURL(
            "file:///android_asset/web/",
            "<html><body style='background:#07080a;color:#f4f5f7;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0'><div style='text-align:center'><h1 style='letter-spacing:.18em;font-size:14px'>TERMUFLIX</h1><p style='color:#6e7683;font-size:12px'>Starting engine…</p></div></body></html>",
            "text/html",
            "UTF-8",
            null
        )

        lifecycleScope.launch {
            try {
                waitForEngine()
                Log.i(tag, "Loading web bundle")
                webView.loadUrl("file:///android_asset/web/index.html")
            } catch (e: Throwable) {
                Log.e(tag, "Failed to load web bundle", e)
            }
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