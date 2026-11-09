import subprocess
import sys
import threading
import time

def pipe_output(process, prefix, color_code):
    """Pipes stdout/stderr of a process to console with a colored prefix."""
    reset_code = "\033[0m"
    while True:
        line = process.stdout.readline()
        if not line:
            break
        try:
            decoded = line.decode('utf-8', errors='ignore').rstrip()
            print(f"{color_code}{prefix}{reset_code} {decoded}")
        except Exception:
            pass

def main():
    print("🚀 Starting Vericode AI (Backend & Frontend) via Python...")
    
    # On Windows, we must use shell=True for npm commands to be found properly
    use_shell = sys.platform == "win32"
    
    backend_cmd = ["npm", "run", "server"]
    frontend_cmd = ["npm", "run", "dev"]
    
    backend_proc = None
    frontend_proc = None
    
    try:
        # Start backend
        backend_proc = subprocess.Popen(
            backend_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            shell=use_shell
        )
        
        # Start frontend
        frontend_proc = subprocess.Popen(
            frontend_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            shell=use_shell
        )
        
        # Start log piping threads: Green (92) for Backend, Blue (94) for Frontend
        t1 = threading.Thread(target=pipe_output, args=(backend_proc, "[Backend]", "\033[92m"))
        t2 = threading.Thread(target=pipe_output, args=(frontend_proc, "[Frontend]", "\033[94m"))
        
        t1.daemon = True
        t2.daemon = True
        
        t1.start()
        t2.start()
        
        print("⚡ Both servers launched. Press Ctrl+C to terminate both at any time.\n")
        
        while True:
            # Exit if any process terminated unexpectedly
            if backend_proc.poll() is not None:
                print("\n❌ Backend process exited.")
                break
            if frontend_proc.poll() is not None:
                print("\n❌ Frontend process exited.")
                break
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n🛑 KeyboardInterrupt detected. Stopping servers...")
    finally:
        # Terminate both processes cleanly
        if backend_proc:
            try:
                backend_proc.terminate()
                backend_proc.wait(timeout=2)
            except Exception:
                pass
        if frontend_proc:
            try:
                frontend_proc.terminate()
                frontend_proc.wait(timeout=2)
            except Exception:
                pass
        print("👋 All servers terminated successfully.")

if __name__ == "__main__":
    # Enable terminal ANSI escape colors on Windows
    if sys.platform == "win32":
        import os
        os.system('color')
    main()
