package dev.marboldrake.termuflix

import android.os.Bundle
import android.util.Log
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.appcompat.app.AppCompatActivity
import com.termux.shared.termux.terminal.TermuxTerminalSessionClientBase
import com.termux.terminal.TerminalSession
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

        startTerminal()
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

        val client = object : TermuxTerminalSessionClientBase() {
            override fun onTextChanged(changedSession: TerminalSession) {
                terminalView.onScreenUpdated()
            }
            override fun onSessionFinished(finishedSession: TerminalSession) {
                Log.i(tag, "session finished")
            }
        }

        try {
            session = TerminalSession(
                binary,
                filesDir.absolutePath,
                arrayOf<String>(),
                env,
                null,
                client
            )
            terminalView.attachSession(session)
            session?.updateSize(80, 24, 0, 0)
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