package dev.marboldrake.termuflix

import android.content.Context
import android.util.Log
import java.io.File

/**
 * Starts the Rust engine (`libtermuflix_engine.so`) in `--serve` mode on port 8080.
 * The binary is shipped in jniLibs and executed from the app's nativeLibraryDir,
 * which is allowed on all Android versions (unlike the app data dir).
 */
object EngineService {
    private const val TAG = "TermuflixEngine"
    const val PORT = 8080

    @Volatile
    private var process: Process? = null

    fun start(context: Context) {
        if (process != null) return
        val libDir = context.applicationInfo.nativeLibraryDir
        val binary = File(libDir, "libtermuflix_engine.so")
        if (!binary.exists()) {
            Log.e(TAG, "engine binary missing: $binary")
            return
        }
        try {
            val pb = ProcessBuilder(binary.absolutePath, "--serve", "--port", PORT.toString())
                .redirectErrorStream(true)
            pb.environment()["RUST_LOG"] = "info"
            process = pb.start()
            Log.i(TAG, "engine started on 127.0.0.1:$PORT")
        } catch (t: Throwable) {
            Log.e(TAG, "failed to start engine", t)
        }
    }

    fun stop() {
        process?.destroy()
        process = null
    }

    fun isRunning(): Boolean = process?.isAlive == true
}