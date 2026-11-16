package dev.marboldrake.termuflix

import android.os.Bundle
import android.util.Log
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.appcompat.app.AppCompatActivity
import com.termux.terminal.TerminalSession
import com.termux.terminal.TerminalSessionClient
import com.termux.view.TerminalView

class MainActivity : AppCompatActivity() {
    private val tag = "TermuflixTerm"
    private lateinit var terminalView: TerminalView
    private var session: TerminalSession? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Log.i(tag, "onCreate")

        val container = FrameLayout(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }

        terminalView = TerminalView(this, null).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }
        container.addView(terminalView)
        setContentView(container)

        EngineService.start(this) // no-op now, kept for compat

        lifecycleScopeSafe {
            startTerminal()
        }
    }

    private fun lifecycleScopeSafe(block: () -> Unit) {
        // Run on main thread
        runOnUiThread { block() }
    }

    private fun startTerminal() {
        val libDir = applicationInfo.nativeLibraryDir
        val binary = "$libDir/libtermuflix_engine.so"
        Log.i(tag, "binary: $binary")

        val env = arrayOf(
            "TERM=xterm-256color",
            "HOME=${filesDir.absolutePath}",
            "PATH=$libDir:/system/bin:/system/xbin",
            "LANG=en_US.UTF-8",
        )

        val client = object : TerminalSessionClient {
            override fun onTextChanged(changedSession: TerminalSession) {
                terminalView.onScreenUpdated()
            }
            override fun onTitleChanged(changedSession: TerminalSession) {}
            override fun onSessionFinished(finishedSession: TerminalSession) {
                Log.i(tag, "session finished")
            }
            override fun onCopyTextToClipboard(session: TerminalSession, text: String) {}
            override fun onPasteTextFromClipboard(session: TerminalSession) {}
            override fun onBell(session: TerminalSession) {}
            override fun onColorsChanged(session: TerminalSession) {}
            override fun onTerminalCursorStateChange(state: Boolean) {}
            override fun getTerminalCursorStyle(): Int = 0
            override fun logError(tag: String?, message: String?) {
                Log.e(tag ?: "Termux", message ?: "")
            }
            override fun logWarn(tag: String?, message: String?) {
                Log.w(tag ?: "Termux", message ?: "")
            }
            override fun logInfo(tag: String?, message: String?) {
                Log.i(tag ?: "Termux", message ?: "")
            }
            override fun logDebug(tag: String?, message: String?) {
                Log.d(tag ?: "Termux", message ?: "")
            }
            override fun logVerbose(tag: String?, message: String?) {
                Log.v(tag ?: "Termux", message ?: "")
            }
            override fun logStackTraceWithMessage(tag: String?, message: String?, e: Throwable?) {
                Log.e(tag ?: "Termux", message ?: "", e)
            }
        }

        try {
            session = TerminalSession(
                binary,
                arrayOf<String>(),
                filesDir.absolutePath,
                env,
                80,
                24,
                client
            )
            terminalView.attachSession(session)
            Log.i(tag, "terminal session started")
        } catch (t: Throwable) {
            Log.e(tag, "failed to start terminal session", t)
        }
    }

    override fun onDestroy() {
        session?.finishIfRunning()
        super.onDestroy()
    }
}