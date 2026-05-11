import os
import sys
import json
import time
import psutil
import subprocess

def monitor_execution(payload_path: str, timeout: int = 10):
    results = {
        "status": "success",
        "hypervisor": "VirtualBox (Real Telemetry)",
        "process_tree": [],
        "network_activity": [],
        "file_system_changes": [],
        "risk_score": 0.0
    }

    try:
        # Snapshot current processes
        initial_pids = set(p.pid for p in psutil.process_iter())

        print(f"[Agent] Launching payload: {payload_path}")
        proc = subprocess.Popen([payload_path], shell=True)
        
        # Monitor for N seconds
        end_time = time.time() + timeout
        new_processes = []

        while time.time() < end_time:
            for p in psutil.process_iter(['pid', 'name', 'exe', 'cmdline']):
                try:
                    if p.pid not in initial_pids and p.pid != proc.pid and p.pid != os.getpid():
                        proc_info = f"{p.info['name']} (PID: {p.pid})"
                        if p.info.get('cmdline'):
                            proc_info += f" -> {' '.join(p.info['cmdline'])}"
                        if proc_info not in new_processes:
                            new_processes.append(proc_info)
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    pass
                    
            # Capture network connections
            try:
                for conn in psutil.net_connections(kind='inet'):
                    if conn.status == 'ESTABLISHED' and conn.raddr:
                        # Ensure we don't log the Python agent's own internal connections if any
                        if conn.pid != os.getpid():
                            net_info = f"TCP Outbound: {conn.raddr.ip}:{conn.raddr.port} (PID: {conn.pid})"
                            if net_info not in results["network_activity"]:
                                results["network_activity"].append(net_info)
            except psutil.AccessDenied:
                pass
                
            time.sleep(1)

        # Terminate payload if still running
        if proc.poll() is None:
            proc.terminate()

        # Build process tree for report
        results["process_tree"].append(f"Root Payload (PID: {proc.pid})")
        for np in new_processes:
            results["process_tree"].append(f"  └── {np}")

        results["risk_score"] = 60.0 if new_processes else 20.0

    except Exception as e:
        results["status"] = "error"
        results["error_message"] = str(e)
        print(f"[Agent] Error: {e}")

    # Write output to Desktop or specific path
    output_path = r"C:\Users\Public\results.json"
    with open(output_path, "w") as f:
        json.dump(results, f)
    print(f"[Agent] Telemetry saved to {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: agent.py <payload_path>")
        sys.exit(1)
    
    payload = sys.argv[1]
    monitor_execution(payload)
